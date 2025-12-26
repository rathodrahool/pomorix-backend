import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../../jwt/jwt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGE } from '../../common/response-messages';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Extract token from Authorization header
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException(MESSAGE.ERROR.AUTH.NO_TOKEN);
        }

        try {
            // Verify token
            const payload = await this.jwtService.verifyToken(token);

            // Fetch user from database
            const user = await this.prisma.users.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    auth_provider: true,
                    status: true,
                    deleted_at: true,
                },
            });

            // Check if user exists and is active
            if (!user || user.deleted_at) {
                throw new UnauthorizedException(MESSAGE.ERROR.AUTH.USER_NOT_FOUND);
            }

            // Attach user to request object
            request.user = user;

            return true;
        } catch (error) {
            throw new UnauthorizedException(MESSAGE.ERROR.AUTH.INVALID_TOKEN);
        }
    }

    private extractTokenFromHeader(request: any): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return null;
        }

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : null;
    }
}
