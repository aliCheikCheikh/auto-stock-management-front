export interface LoginRequest {
    readonly email: string;
    readonly password: string;
}

export type UserRole = 'OWNER' | 'SELLER';

export interface AuthenticatedUser {
    readonly userId: string;
    readonly role: UserRole;
}