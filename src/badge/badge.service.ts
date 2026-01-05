import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StreakService } from 'src/streak/streak.service';
import { BadgeRuleType, PomodoroSessionState, SessionType } from '@prisma/client';
import type { BadgeDefinitionResponseDto } from './dto/badge-definition-response.dto';
import type { UserBadgeResponseDto } from './dto/user-badge-response.dto';

@Injectable()
export class BadgeService {
    private readonly logger = new Logger(BadgeService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly streakService: StreakService,
    ) { }

    async getAllBadgeDefinitions(userId: string): Promise<BadgeDefinitionResponseDto[]> {
        // Get all active badge definitions
        const definitions = await this.prisma.badge_definitions.findMany({
            where: { is_active: true },
            orderBy: [{ category: 'asc' }, { rule_value: 'asc' }],
        });

        // Get user's earned badges
        const userBadges = await this.prisma.user_badges.findMany({
            where: { user_id: userId },
            select: { badge_id: true, unlocked_at: true },
        });

        // Create a map for quick lookup
        const unlockedMap = new Map(
            userBadges.map((ub) => [ub.badge_id, ub.unlocked_at]),
        );

        // Merge data
        return definitions.map((def) => ({
            id: def.id,
            code: def.code,
            rule_type: def.rule_type,
            rule_value: def.rule_value,
            title: def.title,
            description: def.description,
            category: def.category,
            is_unlocked: unlockedMap.has(def.id),
            unlocked_at: unlockedMap.get(def.id)?.toISOString(),
        }));
    }

    async getUserBadges(userId: string): Promise<UserBadgeResponseDto[]> {
        const badges = await this.prisma.user_badges.findMany({
            where: { user_id: userId },
            include: {
                badge: true,
            },
            orderBy: { unlocked_at: 'desc' },
        });

        return badges.map((ub) => ({
            id: ub.badge.id,
            code: ub.badge.code,
            title: ub.badge.title,
            description: ub.badge.description,
            category: ub.badge.category,
            unlocked_at: ub.unlocked_at.toISOString(),
        }));
    }

    async checkAndAwardBadges(userId: string): Promise<void> {
        this.logger.log(`Checking badges for user: ${userId}`);

        // Get all active badge definitions
        const definitions = await this.prisma.badge_definitions.findMany({
            where: { is_active: true },
        });

        // Get already earned badges
        const earnedBadgeIds = await this.prisma.user_badges.findMany({
            where: { user_id: userId },
            select: { badge_id: true },
        });

        const earnedSet = new Set(earnedBadgeIds.map((ub) => ub.badge_id));

        // Check each badge
        for (const badge of definitions) {
            // Skip if already earned
            if (earnedSet.has(badge.id)) {
                continue;
            }

            // Evaluate rule
            const eligible = await this.evaluateRule(
                userId,
                badge.rule_type,
                badge.rule_value,
            );

            if (eligible) {
                await this.awardBadge(userId, badge.id, badge.code);
            }
        }
    }

    private async evaluateRule(
        userId: string,
        ruleType: BadgeRuleType,
        threshold: number,
    ): Promise<boolean> {
        switch (ruleType) {
            case BadgeRuleType.SESSION_COUNT:
                return this.evaluateSessionCount(userId, threshold);

            case BadgeRuleType.STREAK_COUNT:
                return this.evaluateStreakCount(userId, threshold);

            case BadgeRuleType.DAILY_COUNT:
                return this.evaluateDailyCount(userId, threshold);

            default:
                this.logger.warn(`Unknown rule type: ${ruleType}`);
                return false;
        }
    }

    private async evaluateSessionCount(
        userId: string,
        threshold: number,
    ): Promise<boolean> {
        const count = await this.prisma.pomodoro_sessions.count({
            where: {
                user_id: userId,
                session_type: SessionType.FOCUS,
                state: PomodoroSessionState.COMPLETED,
            },
        });

        return count >= threshold;
    }

    private async evaluateStreakCount(
        userId: string,
        threshold: number,
    ): Promise<boolean> {
        const streak = await this.streakService.getStreak(userId);

        // Check either current or longest streak
        return (
            streak.current_streak >= threshold || streak.longest_streak >= threshold
        );
    }

    private async evaluateDailyCount(
        userId: string,
        threshold: number,
    ): Promise<boolean> {
        const maxDaily = await this.prisma.daily_activity.findFirst({
            where: { user_id: userId },
            orderBy: { pomodoro_count: 'desc' },
        });

        return maxDaily ? maxDaily.pomodoro_count >= threshold : false;
    }

    private async awardBadge(
        userId: string,
        badgeId: string,
        badgeCode: string,
    ): Promise<void> {
        try {
            await this.prisma.user_badges.create({
                data: {
                    user_id: userId,
                    badge_id: badgeId,
                },
            });

            this.logger.log(`✅ Badge awarded: ${badgeCode} to user ${userId}`);

            // TODO: Emit BADGE_UNLOCKED event for notification module
        } catch (error: any) {
            // Handle duplicate key error (badge already awarded)
            if (error.code === 'P2002') {
                this.logger.debug(`Badge ${badgeCode} already awarded to ${userId}`);
            } else {
                this.logger.error(`Failed to award badge ${badgeCode}:`, error);
                throw error;
            }
        }
    }
}
