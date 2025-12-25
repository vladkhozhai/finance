/**
 * Common authentication types
 */

/**
 * Authenticated user information
 */
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User session information
 */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * Authentication state
 */
export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; session: AuthSession }
  | { status: "unauthenticated" };

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password update request
 */
export interface PasswordUpdateRequest {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}
