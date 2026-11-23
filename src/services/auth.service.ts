/**
 * Authentication Service (Local Demo Only)
 * Manages local browser sessions and credentials validation.
 */

import { storageService } from './storage.service';
import { User } from '@/types';

export const DEMO_CREDENTIALS = {
  email: 'admin@mise.demo',
  password: 'MiseDemo123',
  displayName: 'Chef Patron & Operations Lead',
  role: 'admin' as const,
};

const DEMO_USER: User = {
  id: 'USR-ADMIN-001',
  email: DEMO_CREDENTIALS.email,
  firstName: 'Julian',
  lastName: 'Mercer',
  phone: '+92 300 8472911',
  role: 'admin',
  isActive: true,
};

export const authService = {
  getCurrentUser(): User | null {
    return storageService.getSession();
  },

  login(credentials: { email: string; password?: string }): { success: boolean; user?: User; error?: string } {
    const trimmedEmail = credentials.email.trim().toLowerCase();
    
    // Accept demo credentials or any reasonable demo sign-in
    if (trimmedEmail === DEMO_CREDENTIALS.email.toLowerCase()) {
      if (credentials.password && credentials.password !== DEMO_CREDENTIALS.password) {
        return { success: false, error: 'Invalid password. Please use the demo credentials provided.' };
      }
      storageService.setSession(DEMO_USER);
      return { success: true, user: DEMO_USER };
    }

    // Also support quick single-click demo login
    if (!credentials.password || trimmedEmail.includes('demo')) {
      storageService.setSession(DEMO_USER);
      return { success: true, user: DEMO_USER };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please click "Use Demo Account" or sign in with admin@mise.demo',
    };
  },

  loginDemoUser(): User {
    storageService.setSession(DEMO_USER);
    return DEMO_USER;
  },

  logout(): void {
    storageService.clearSession();
  },

  isAuthenticated(): boolean {
    return !!storageService.getSession();
  },
};
