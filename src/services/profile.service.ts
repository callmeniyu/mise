/**
 * Business Profile Local Service
 */

import { storageService } from './storage.service';
import { BusinessProfile } from '@/types';

export const profileService = {
  getProfile(): BusinessProfile {
    const db = storageService.getDatabase();
    return db.profile;
  },

  updateProfile(updates: Partial<BusinessProfile>): BusinessProfile {
    const db = storageService.getDatabase();
    db.profile = {
      ...db.profile,
      ...updates,
    };
    storageService.saveDatabase(db);
    return db.profile;
  },
};
