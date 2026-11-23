import { describe, it, expect, beforeEach } from 'vitest';
import { storageService, STORAGE_KEYS } from '@/services/storage.service';

describe('StorageService & Persistence Layer', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes seed database when storage is empty', () => {
    const db = storageService.getDatabase();
    expect(db).toBeDefined();
    expect(db.version).toBe(1);
    expect(db.menuItems.length).toBeGreaterThanOrEqual(12);
    expect(db.inventory.length).toBeGreaterThanOrEqual(20);
    expect(db.suppliers.length).toBeGreaterThanOrEqual(8);
    expect(db.orders.length).toBeGreaterThanOrEqual(20);
    expect(db.purchases.length).toBeGreaterThanOrEqual(15);
    expect(db.payments.length).toBeGreaterThanOrEqual(15);
    expect(db.profile.name).toContain('Mise');
  });

  it('persists changes across subsequent reads without overwriting', () => {
    const db = storageService.getDatabase();
    const initialOrdersCount = db.orders.length;

    // Add a custom order
    db.orders.push({
      id: 'TEST-ORD-PERSIST',
      clientName: 'Persistence Test Client',
      clientType: 'Individual',
      eventDate: '2026-12-31',
      eventType: 'Private Event',
      guestCount: 50,
      pricePerHead: 1000,
      menuItems: [],
      totalValue: 50000,
      advanceReceived: 25000,
      remainingBalance: 25000,
      status: 'Confirmed',
      createdAt: '2026-11-23',
    });
    storageService.saveDatabase(db);

    // Re-fetch
    const reloadedDb = storageService.getDatabase();
    expect(reloadedDb.orders.length).toBe(initialOrdersCount + 1);
    expect(reloadedDb.orders.some((o) => o.id === 'TEST-ORD-PERSIST')).toBe(true);
  });

  it('gracefully recovers from corrupted JSON in storage', () => {
    window.localStorage.setItem(STORAGE_KEYS.DATABASE, '{invalid_json_corrupted: true,');

    const recoveredDb = storageService.getDatabase();
    expect(recoveredDb).toBeDefined();
    expect(recoveredDb.version).toBe(1);
    expect(recoveredDb.orders.length).toBeGreaterThanOrEqual(20);
  });

  it('resets database to original seed data while preserving unrelated localStorage keys', () => {
    // Set unrelated key
    window.localStorage.setItem('unrelated_app_key', 'do_not_delete_this');

    // Mutate database
    const db = storageService.getDatabase();
    db.orders = [];
    storageService.saveDatabase(db);
    expect(storageService.getDatabase().orders.length).toBe(0);

    // Trigger reset
    const resetDb = storageService.resetToSeed();
    expect(resetDb.orders.length).toBeGreaterThanOrEqual(20);

    // Unrelated key must remain intact
    expect(window.localStorage.getItem('unrelated_app_key')).toBe('do_not_delete_this');
  });

  it('exports and imports dataset correctly', () => {
    const exportedJson = storageService.exportDataset();
    expect(exportedJson).toContain('"version": 1');

    const importResult = storageService.importDataset(exportedJson);
    expect(importResult.success).toBe(true);

    const invalidImport = storageService.importDataset('not valid json');
    expect(invalidImport.success).toBe(false);
  });
});
