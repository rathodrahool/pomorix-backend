import { BadgeCategory, BadgeRuleType } from '@prisma/client';
import { prisma } from '../src/prisma/prisma.client';

async function seedBadgeDefinitions() {
  console.log('Seeding badge definitions...');

  const badges = [
    // Rank Tiers (based on total Pomodoros completed)
    {
      code: 'BRONZE',
      title: 'Bronze',
      description: 'Tier I - Complete 1+ hours of focus time',
      category: BadgeCategory.VOLUME,
      rule_type: BadgeRuleType.SESSION_COUNT,
      rule_value: 3,
    },
    {
      code: 'SILVER',
      title: 'Silver',
      description: 'Tier II - Complete 10+ hours of focus time',
      category: BadgeCategory.VOLUME,
      rule_type: BadgeRuleType.SESSION_COUNT,
      rule_value: 24,
    },
    {
      code: 'GOLD',
      title: 'Gold',
      description: 'Tier III - Complete 50+ hours of focus time',
      category: BadgeCategory.VOLUME,
      rule_type: BadgeRuleType.SESSION_COUNT,
      rule_value: 120,
    },
    {
      code: 'PLATINUM',
      title: 'Platinum',
      description: 'Tier IV - Complete 100+ hours of focus time',
      category: BadgeCategory.VOLUME,
      rule_type: BadgeRuleType.SESSION_COUNT,
      rule_value: 240,
    },
    {
      code: 'DIAMOND',
      title: 'Diamond',
      description: 'Tier V - Complete 500+ hours of focus time',
      category: BadgeCategory.VOLUME,
      rule_type: BadgeRuleType.SESSION_COUNT,
      rule_value: 1200,
    },
    {
      code: 'ASCENDANT',
      title: 'Ascendant',
      description: 'Tier VI - Top 1% of all users',
      category: BadgeCategory.VOLUME,
      rule_type: BadgeRuleType.SESSION_COUNT,
      rule_value: 2400,
    },

    // Achievement Badges - Onboarding
    {
      code: 'FIRST_POMODORO',
      title: 'First Pomodoro',
      description: 'Complete your first Pomodoro session',
      category: BadgeCategory.ONBOARDING,
      rule_type: BadgeRuleType.SESSION_COUNT,
      rule_value: 1,
    },

    // Achievement Badges - Streaks
    {
      code: 'STREAK_3',
      title: '3-Day Streak',
      description: 'Achieve a 3-day streak',
      category: BadgeCategory.STREAK,
      rule_type: BadgeRuleType.STREAK_COUNT,
      rule_value: 3,
    },
    {
      code: 'STREAK_7',
      title: '7-Day Streak',
      description: 'Achieve a 7-day streak',
      category: BadgeCategory.STREAK,
      rule_type: BadgeRuleType.STREAK_COUNT,
      rule_value: 7,
    },
    {
      code: 'STREAK_30',
      title: '30-Day Streak',
      description: 'Achieve a 30-day streak',
      category: BadgeCategory.STREAK,
      rule_type: BadgeRuleType.STREAK_COUNT,
      rule_value: 30,
    },

    // Achievement Badges - Daily Intensity
    {
      code: 'DAILY_5',
      title: '5 in a Day',
      description: 'Complete 5 Pomodoros in a single day',
      category: BadgeCategory.INTENSITY,
      rule_type: BadgeRuleType.DAILY_COUNT,
      rule_value: 5,
    },
    {
      code: 'DAILY_10',
      title: '10 in a Day',
      description: 'Complete 10 Pomodoros in a single day',
      category: BadgeCategory.INTENSITY,
      rule_type: BadgeRuleType.DAILY_COUNT,
      rule_value: 10,
    },
  ];

  for (const badge of badges) {
    await prisma.badge_definitions.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }

  console.log(`✅ Seeded ${badges.length} badge definitions`);
}

async function main() {
  try {
    await seedBadgeDefinitions();
    console.log('✅ All seeds completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
