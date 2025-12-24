import { AuthProvider } from "@prisma/client";

export interface SignupDto {
    email: string;
    auth_provider: AuthProvider;
    auth_provider_id: string;
}

export interface SignupResponseDto {
    user: {
        id: string;
        email: string;
        auth_provider: string;
    };
    access_token: string;
}
