/**
 * Centralized Storage Service for Mise
 * Handles localStorage persistence, schema versioning, seed initialization,
 * corrupted data recovery, and safe resets.
 */

import { MiseDatabase, getInitialDatabase } from '@/data/seedData';
import { User } from '@/types';

export const STORAGE_KEYS = {
  DATABASE: 'mise:database:v1',
  SESSION: 'mise:session:v1',
  SETTINGS: 'mise:settings:v1',
  NOTIFICATIONS: 'mise:notifications:v1',
} as const;

const SCHEMA_VERSION = 1;

class StorageService {
  private memoryFallback: Map<string, string> = new Map();

  /**
   * Safe check for localStorage availability (e.g. incognito or restricted sandbox)
   */
  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__mise_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      return window.localStorage.getItem(key);
    }
    return this.memoryFallback.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn('localStorage setItem failed, falling back to memory store', e);
        this.memoryFallback.set(key, value);
      }
    } else {
      this.memoryFallback.set(key, value);
    }
  }

  public removeItem(key: string): void {
    if (this.isLocalStorageAvailable()) {
      window.localStorage.removeItem(key);
    }
    this.memoryFallback.delete(key);
  }

  /**
   * Validate that an object has the essential structure of a MiseDatabase
   */
  private isValidDatabase(data: any): data is MiseDatabase {
    return (
      data &&
      typeof data === 'object' &&
      data.version === SCHEMA_VERSION &&
      Array.isArray(data.menuItems) &&
      Array.isArray(data.inventory) &&
      Array.isArray(data.orders) &&
      Array.isArray(data.purchases) &&
      Array.isArray(data.payments) &&
      data.profile &&
      typeof data.profile.name === 'string'
    );
  }

  /**
   * Get the entire Mise database, initializing seed if absent or corrupted
   */
  public getDatabase(): MiseDatabase {
    const raw = this.getItem(STORAGE_KEYS.DATABASE);

    if (!raw) {
      const initial = getInitialDatabase();
      this.saveDatabase(initial);
      return initial;
    }

    try {
      const parsed = JSON.parse(raw);
      if (this.isValidDatabase(parsed)) {
        return parsed;
      } else {
        console.warn('Mise database found in storage has an invalid or outdated schema. Re-seeding...');
        const initial = getInitialDatabase();
        this.saveDatabase(initial);
        return initial;
      }
    } catch (err) {
      console.error('Failed to parse Mise database from localStorage (corrupted JSON). Recovering with seed data...', err);
      const initial = getInitialDatabase();
      this.saveDatabase(initial);
      return initial;
    }
  }

  /**
   * Persist the database state to storage
   */
  public saveDatabase(db: MiseDatabase): void {
    try {
      this.setItem(STORAGE_KEYS.DATABASE, JSON.stringify(db));
    } catch (err) {
      console.error('Failed to save Mise database:', err);
    }
  }

  /**
   * Reset database back to seed data. Clears only Mise-owned keys.
   */
  public resetToSeed(): MiseDatabase {
    const initial = getInitialDatabase();
    this.saveDatabase(initial);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('mise:storage:reset'));
      } catch {
        // ignore in non-dom tests
      }
    }
    return initial;
  }

  /**
   * Export the entire local dataset as a JSON string
   */
  public exportDataset(): string {
    const db = this.getDatabase();
    return JSON.stringify(db, null, 2);
  }

  /**
   * Import a valid compatible Mise dataset
   */
  public importDataset(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!this.isValidDatabase(parsed)) {
        return { success: false, error: 'Uploaded file is not a valid compatible Mise database structure.' };
      }
      this.saveDatabase(parsed);
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        try {
          window.dispatchEvent(new CustomEvent('mise:storage:reset'));
        } catch {
          // ignore
        }
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid JSON file format.' };
    }
  }

  // --- Session Management ---

  public getSession(): User | null {
    const raw = this.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      this.removeItem(STORAGE_KEYS.SESSION);
      return null;
    }
  }

  public setSession(user: User): void {
    this.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  }

  public clearSession(): void {
    this.removeItem(STORAGE_KEYS.SESSION);
  }

  /**
   * Generate clean predictable or unique IDs
   */
  public generateId(prefix: string): string {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomSuffix}`;
  }
}

export const storageService = new StorageService();
