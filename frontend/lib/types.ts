// TypeScript types for authentication and user management

export type UserRole = "student" | "recruiter" | "college_admin";

export type AuthProvider = "password" | "google";

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    provider: AuthProvider;
    createdAt: Date;
    lastLoginAt: Date;
}

export interface AuthFormData {
    name?: string;
    email: string;
    password?: string;
    role: UserRole | "";
}
