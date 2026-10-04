import { PendingSyncItem, Product } from '../types';
import {
  saveSaleToFirestore,
  saveInventoryMovementToFirestore,
  saveProductToFirestore,
  saveCashMovementToFirestore,
  saveCashRegisterToFirestore,
  saveAuditLogToFirestore
} from './firestoreService';

const SYNC_QUEUE_KEY = 'dkiram_pending_sync_queue';
const LAST_SYNC_KEY = 'dkiram_last_sync_timestamp';

/**
 * Reads pending sync queue from localStorage
 */
export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading pending sync queue:', e);
    return [];
  }
}

/**
 * Saves pending sync queue to localStorage
 */
export function savePendingSyncQueue(queue: PendingSyncItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving pending sync queue:', e);
  }
}

/**
 * Enqueues an operation for offline synchronization
 */
export function enqueuePendingSync(
  item: Omit<PendingSyncItem, 'id' | 'timestamp' | 'attempts'>
): PendingSyncItem {
  const queue = getPendingSyncQueue();
  const newItem: PendingSyncItem = {
    ...item,
    id: `sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    attempts: 0,
  };
  
  queue.push(newItem);
  savePendingSyncQueue(queue);
  return newItem;
}

/**
 * Removes an item from the queue by ID
 */
export function removePendingSyncItem(id: string): void {
  const queue = getPendingSyncQueue();
  const updated = queue.filter(item => item.id !== id);
  savePendingSyncQueue(updated);
}

/**
 * Gets the timestamp of the last successful sync
 */
export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets the timestamp of the last successful sync
 */
export function setLastSyncTime(timestamp: string): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  } catch {}
}

/**
 * Processes a single pending item and uploads to Firestore
 */
export async function processSyncItem(item: PendingSyncItem, currentProducts: Product[]): Promise<void> {
  const { type, data } = item;

  if (type === 'SALE' && data.sale) {
    // 1. Upload Sale Document
    await saveSaleToFirestore(data.sale);

    // 2. Upload Inventory Movements
    if (data.inventoryMovements && data.inventoryMovements.length > 0) {
      for (const inv of data.inventoryMovements) {
        await saveInventoryMovementToFirestore(inv);
      }
    }

    // 3. Update Product stock in Firestore
    if (data.updatedProducts && data.updatedProducts.length > 0) {
      for (const up of data.updatedProducts) {
        const prod = currentProducts.find(p => p.id === up.id);
        if (prod) {
          await saveProductToFirestore({ ...prod, stockCurrent: up.stockCurrent });
        }
      }
    }

    // 4. Upload Cash Movement (if sale had cash)
    if (data.cashMovement) {
      await saveCashMovementToFirestore(data.cashMovement);
    }

    // 5. Update Cash Register Drawer Expected Cash
    if (data.updatedRegister) {
      await saveCashRegisterToFirestore(data.updatedRegister);
    }

    // 6. Upload Audit Log
    if (data.auditLog) {
      await saveAuditLogToFirestore(data.auditLog);
    }
  } else if (type === 'VOID_SALE' && data.sale) {
    // 1. Update voided Sale Document
    await saveSaleToFirestore(data.sale);

    // 2. Upload Return Inventory Movements
    if (data.inventoryMovements) {
      for (const inv of data.inventoryMovements) {
        await saveInventoryMovementToFirestore(inv);
      }
    }

    // 3. Restock Products in Firestore
    if (data.updatedProducts) {
      for (const up of data.updatedProducts) {
        const prod = currentProducts.find(p => p.id === up.id);
        if (prod) {
          await saveProductToFirestore({ ...prod, stockCurrent: up.stockCurrent });
        }
      }
    }

    // 4. Upload Reversal Cash Movement
    if (data.cashMovement) {
      await saveCashMovementToFirestore(data.cashMovement);
    }

    // 5. Update Cash Register
    if (data.updatedRegister) {
      await saveCashRegisterToFirestore(data.updatedRegister);
    }

    // 6. Upload Audit Log
    if (data.auditLog) {
      await saveAuditLogToFirestore(data.auditLog);
    }
  } else if (type === 'CASH_REGISTER' && data.updatedRegister) {
    await saveCashRegisterToFirestore(data.updatedRegister);
    if (data.cashMovement) {
      await saveCashMovementToFirestore(data.cashMovement);
    }
    if (data.auditLog) {
      await saveAuditLogToFirestore(data.auditLog);
    }
  } else if (type === 'CASH_MOVEMENT' && data.cashMovement) {
    await saveCashMovementToFirestore(data.cashMovement);
    if (data.updatedRegister) {
      await saveCashRegisterToFirestore(data.updatedRegister);
    }
    if (data.auditLog) {
      await saveAuditLogToFirestore(data.auditLog);
    }
  } else if (type === 'INVENTORY_ADJUSTMENT') {
    if (data.inventoryMovements) {
      for (const inv of data.inventoryMovements) {
        await saveInventoryMovementToFirestore(inv);
      }
    }
    if (data.updatedProducts) {
      for (const up of data.updatedProducts) {
        const prod = currentProducts.find(p => p.id === up.id);
        if (prod) {
          await saveProductToFirestore({ ...prod, stockCurrent: up.stockCurrent });
        }
      }
    }
    if (data.auditLog) {
      await saveAuditLogToFirestore(data.auditLog);
    }
  }
}

/**
 * Synchronizes all pending queue items sequentially to guarantee FIFO order
 */
export async function syncAllPendingItems(currentProducts: Product[]): Promise<{
  successCount: number;
  failedCount: number;
  remainingQueue: PendingSyncItem[];
  errors: string[];
}> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { successCount: 0, failedCount: 0, remainingQueue: [], errors: [] };
  }

  let successCount = 0;
  let failedCount = 0;
  const remainingQueue: PendingSyncItem[] = [];
  const errors: string[] = [];

  for (const item of queue) {
    try {
      await processSyncItem(item, currentProducts);
      successCount++;
    } catch (err: unknown) {
      failedCount++;
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Item ${item.id}: ${errMsg}`);
      
      remainingQueue.push({
        ...item,
        attempts: item.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError: errMsg,
      });
    }
  }

  savePendingSyncQueue(remainingQueue);

  if (successCount > 0) {
    setLastSyncTime(new Date().toISOString());
  }

  return {
    successCount,
    failedCount,
    remainingQueue,
    errors,
  };
}
