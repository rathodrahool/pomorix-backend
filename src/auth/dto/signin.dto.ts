import { AuthProvider } from "@prisma/client";

export interface SigninDto {
    email: string;
    auth_provider: AuthProvider;
    auth_provider_id: string;
}

export interface SigninResponseDto {
    user: {
        id: string;
        email: string;
        auth_provider: string;
        auth_provider_id: string;
        status: string
    };
    access_token: string;
}
