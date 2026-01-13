import { UserStatus, AuthProvider } from '@prisma/client';

export interface AuthenticatedUser {
    id: string;
    email: string;
    auth_provider: AuthProvider;
    status: UserStatus;
}
