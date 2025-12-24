import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

export interface JwtPayload {
    userId: string;
    email: string;
}

@Injectable()
export class JwtService {
    constructor(private readonly nestJwtService: NestJwtService) { }

    async generateToken(payload: JwtPayload): Promise<string> {
        return this.nestJwtService.signAsync({
            sub: payload.userId,
            email: payload.email,
        });
    }

    async verifyToken(token: string): Promise<any> {
        try {
            return await this.nestJwtService.verifyAsync(token);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    decodeToken(token: string): any {
        return this.nestJwtService.decode(token);
    }
}
