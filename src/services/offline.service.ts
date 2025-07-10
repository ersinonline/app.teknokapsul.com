import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  portfolioItems: {
    key: string;
    value: any;
  };
  creditCards: {
    key: string;
    value: any;
  };
  loans: {
    key: string;
    value: any;
  };
  cashAdvanceAccounts: {
    key: string;
    value: any;
  };
  expenses: {
    key: string;
    value: any;
  };
  income: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      collection: string;
      data: any;
      timestamp: number;
      userId: string;
    };
  };
}

class OfflineService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private readonly DB_NAME = 'TeknoKapsulOfflineDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains('portfolioItems')) {
            db.createObjectStore('portfolioItems', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('creditCards')) {
            db.createObjectStore('creditCards', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('loans')) {
            db.createObjectStore('loans', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('cashAdvanceAccounts')) {
            db.createObjectStore('cashAdvanceAccounts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('expenses')) {
            db.createObjectStore('expenses', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('income')) {
            db.createObjectStore('income', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('syncQueue')) {
            db.createObjectStore('syncQueue', { keyPath: 'id' });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  async saveData(collection: 'creditCards' | 'loans' | 'cashAdvanceAccounts' | 'portfolioItems' | 'expenses' | 'income' | 'syncQueue', data: any): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      await this.db.put(collection, data);
    } catch (error) {
      console.error(`Failed to save data to ${collection}:`, error);
    }
  }

  async getData(collection: 'creditCards' | 'loans' | 'cashAdvanceAccounts' | 'portfolioItems' | 'expenses' | 'income' | 'syncQueue', key?: string): Promise<any> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      if (key) {
        return await this.db.get(collection, key);
      } else {
        return await this.db.getAll(collection);
      }
    } catch (error) {
      console.error(`Failed to get data from ${collection}:`, error);
      return null;
    }
  }

  async deleteData(collection: 'creditCards' | 'loans' | 'cashAdvanceAccounts' | 'portfolioItems' | 'expenses' | 'income' | 'syncQueue', key: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      await this.db.delete(collection, key);
    } catch (error) {
      console.error(`Failed to delete data from ${collection}:`, error);
    }
  }

  async addToSyncQueue(action: 'create' | 'update' | 'delete', collection: string, data: any, userId: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const queueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      collection,
      data,
      timestamp: Date.now(),
      userId
    };

    try {
      await this.db.put('syncQueue', queueItem);
    } catch (error) {
      console.error('Failed to add item to sync queue:', error);
    }
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      return await this.db.getAll('syncQueue');
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      await this.db.clear('syncQueue');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      await this.db.delete('syncQueue', id);
    } catch (error) {
      console.error('Failed to remove sync queue item:', error);
    }
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // Sync offline data when back online
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline()) {
      console.log('Still offline, cannot sync');
      return;
    }

    const syncQueue = await this.getSyncQueue();
    if (syncQueue.length === 0) {
      console.log('No items to sync');
      return;
    }

    console.log(`Syncing ${syncQueue.length} items...`);

    for (const item of syncQueue) {
      try {
        // Here you would implement the actual sync logic
        // For now, we'll just log the items
        console.log('Syncing item:', item);
        
        // Remove from queue after successful sync
        await this.removeSyncQueueItem(item.id);
      } catch (error) {
        console.error('Failed to sync item:', item, error);
        // Keep item in queue for retry
      }
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;