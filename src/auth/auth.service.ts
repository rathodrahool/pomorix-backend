import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';
import { SignupDto, SignupResponseDto } from './dto/signup.dto';
import { MESSAGE } from '../common/response-messages';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async signup(dto: SignupDto): Promise<SignupResponseDto> {
        // Check if user already exists
        const existingUser = await this.prisma.users.findUnique({
            where: { email: dto.email },
        });

        if (existingUser && !existingUser.deleted_at) {
            throw new ConflictException(MESSAGE.ERROR.ALREADY_EXISTS('User'));
        }

        // If user was soft-deleted, restore and update
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

        // Create new user
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
