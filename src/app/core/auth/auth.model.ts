export interface LoginRequest {
    readonly email: string;
    readonly password: string;
}

export type UserRole = 'OWNER' | 'SELLER';

export interface AuthenticatedUser {
    readonly userId: string;
    readonly displayName: string;
    readonly email: string;
    readonly role: UserRole;
    readonly passwordTemporary: boolean;
}

export interface ChangePasswordRequest {
    readonly currentPassword: string;
    readonly newPassword: string;
}

/** Point d'entrée utile selon l'état et le rôle de l'utilisateur. */
export function landingRouteFor(user: AuthenticatedUser): string {
    if (user.passwordTemporary) {
        return '/change-password';
    }
    return user.role === 'OWNER' ? '/dashboard' : '/products';
}
