// Authentication helper functions
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    User,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole, AuthProvider, UserProfile } from './types';

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    name: string,
    role: UserRole
): Promise<User> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await createUserProfile(user.uid, {
            name,
            email,
            role,
            provider: 'password',
        });

        return user;
    } catch (error: any) {
        throw new Error(error.message || 'SIGNUP_FAILED');
    }
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update last login timestamp
        await updateUserProfile(user.uid, {
            lastLoginAt: serverTimestamp(),
        });

        return user;
    } catch (error: any) {
        throw new Error(error.message || 'LOGIN_FAILED');
    }
}

/**
 * Sign in with Google OAuth using redirect (avoids COOP issues)
 */
export async function signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    // This will redirect the page - user will come back after auth
    await signInWithRedirect(auth, provider);
}

/**
 * Handle redirect result after Google OAuth
 * Call this when the page loads to check if user just returned from Google auth
 */
export async function handleGoogleRedirectResult(): Promise<User | null> {
    try {
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        console.log('Redirect result:', result);
        if (!result) {
            console.log('No redirect result found');
            return null; // No redirect result
        }

        const user = result.user;

        // Check if user profile exists
        const profileExists = await getUserProfile(user.uid);

        if (!profileExists) {
            // New user - profile will be created after role selection
            return user;
        } else {
            // Existing user - update last login
            await updateUserProfile(user.uid, {
                lastLoginAt: serverTimestamp(),
            });
            return user;
        }
    } catch (error: any) {
        throw new Error(error.message || 'GOOGLE_AUTH_FAILED');
    }
}

/**
 * Create a new user profile in Firestore
 */
export async function createUserProfile(
    uid: string,
    userData: {
        name: string;
        email: string;
        role: UserRole;
        provider: AuthProvider;
    }
): Promise<void> {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });
    } catch (error: any) {
        throw new Error('FIRESTORE_WRITE_FAILED');
    }
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(
    uid: string,
    updates: Partial<{
        name: string;
        email: string;
        role: UserRole;
        lastLoginAt: any;
    }>
): Promise<void> {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, updates);
    } catch (error: any) {
        throw new Error('FIRESTORE_UPDATE_FAILED');
    }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                uid,
                name: data.name,
                email: data.email,
                role: data.role,
                provider: data.provider,
                createdAt: (data.createdAt as Timestamp).toDate(),
                lastLoginAt: (data.lastLoginAt as Timestamp).toDate(),
            };
        }
        return null;
    } catch (error: any) {
        throw new Error('FIRESTORE_READ_FAILED');
    }
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error('SIGNOUT_FAILED');
    }
}

/**
 * Get role-based dashboard route
 */
export function getDashboardRoute(role: UserRole): string {
    switch (role) {
        case 'student':
            return '/student/dashboard';
        case 'recruiter':
            return '/dashboard/recruiter';
        case 'college_admin':
            return '/dashboard/admin';
        default:
            return '/';
    }
}


