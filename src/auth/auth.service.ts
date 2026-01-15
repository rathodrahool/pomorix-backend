import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { MESSAGE } from '../common/response-messages';
import { UserStatus } from '@prisma/client';
import { SigninDto, SigninResponseDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async signin(dto: SigninDto): Promise<SigninResponseDto> {
        // Special case: Guest mode for testing
        // Just check if guest user exists and allow login
        if (dto.email === 'guest@pomorix.space') {
            const guestUser = await this.prisma.users.findUnique({
                where: { email: 'guest@pomorix.space' },
                select: {
                    id: true,
                    email: true,
                    auth_provider: true,
                    auth_provider_id: true,
                    status: true,
                    deleted_at: true,
                },
            });

            // If guest user exists and is not deleted, allow login
            if (guestUser && !guestUser.deleted_at) {
                const access_token = await this.jwtService.generateToken({
                    userId: guestUser.id,
                    email: guestUser.email,
                });

                return {
                    user: {
                        id: guestUser.id,
                        email: guestUser.email,
                        auth_provider: guestUser.auth_provider,
                        auth_provider_id: guestUser.auth_provider_id,
                        status: guestUser.status,
                    },
                    access_token,
                };
            }
        }

        // Check if user already exists
        const existingUser = await this.prisma.users.findUnique({
            where: { email: dto.email },
            select: {
                id: true,
                email: true,
                auth_provider: true,
                auth_provider_id: true,
                status: true,
                deleted_at: true,
            },
        });

        // Case 1: User exists and is active - Login (return token)
        if (existingUser && !existingUser.deleted_at) {
            const access_token = await this.jwtService.generateToken({
                userId: existingUser.id,
                email: existingUser.email,
            });

            return {
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    auth_provider: existingUser.auth_provider,
                    auth_provider_id: existingUser.auth_provider_id,
                    status: existingUser.status,
                },
                access_token,
            };
        }

        // Case 2: User was soft-deleted - Restore and login
        if (existingUser && existingUser.deleted_at) {
            const restoredUser = await this.prisma.users.update({
                where: { id: existingUser.id },
                data: {
                    auth_provider: dto.auth_provider,
                    auth_provider_id: dto.auth_provider_id,
                    status: UserStatus.ACTIVE,
                    deleted_at: null,
                },
                select: {
                    id: true,
                    email: true,
                    auth_provider: true,
                    auth_provider_id: true,
                    status: true,
                },
            });

            const access_token = await this.jwtService.generateToken({
                userId: restoredUser.id,
                email: restoredUser.email,
            });

            return {
                user: restoredUser,
                access_token,
            };
        }

        // Case 3: New user - Signup
        const user = await this.prisma.users.create({
            data: {
                email: dto.email,
                auth_provider: dto.auth_provider,
                auth_provider_id: dto.auth_provider_id,
                status: UserStatus.ACTIVE,
            },
            select: {
                id: true,
                email: true,
                auth_provider: true,
                auth_provider_id: true,
                status: true,
            },
        });

        // Generate JWT token
        const access_token = await this.jwtService.generateToken({
            userId: user.id,
            email: user.email,
        });

        return {
            user,
            access_token,
        };
    }
}
