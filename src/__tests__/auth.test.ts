import { describe, it, expect, beforeEach } from 'vitest';
import { authService, DEMO_CREDENTIALS } from '@/services/auth.service';

describe('Local Demo Authentication', () => {
  beforeEach(() => {
    authService.logout();
  });

  it('allows login with valid demo credentials', () => {
    const res = authService.login({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.email).toBe(DEMO_CREDENTIALS.email);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('rejects invalid password when email matches demo account', () => {
    const res = authService.login({
      email: DEMO_CREDENTIALS.email,
      password: 'WrongPasswordXYZ',
    });
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('provides single-click instant demo login', () => {
    const user = authService.loginDemoUser();
    expect(user).toBeDefined();
    expect(user.email).toBe(DEMO_CREDENTIALS.email);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('clears session on logout', () => {
    authService.loginDemoUser();
    expect(authService.isAuthenticated()).toBe(true);

    authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getCurrentUser()).toBeNull();
  });
});
