import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './index';
import { handleFirestoreError, OperationType } from './errorHandler';
import { 
  Product, 
  Category, 
  Sale, 
  CashRegister, 
  CashMovement, 
  InventoryMovement, 
  Employee, 
  EmployeeShift, 
  AuditLog 
} from '../types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_EMPLOYEES, 
  INITIAL_SHIFTS 
} from '../data/mockData';

// Subscriptions
export function subscribeToProducts(onData: (products: Product[]) => void) {
  const collectionPath = 'products';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (snapshot.empty) {
        // First run on new database: seed products
        seedInitialProducts();
        return;
      }
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Product);
      });

      // If remote collection has fewer products than initial catalog, seed missing in background
      if (items.length < INITIAL_PRODUCTS.length) {
        seedInitialProducts();
      }

      // Sort by name or sku
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToCategories(onData: (categories: Category[]) => void) {
  const collectionPath = 'categories';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (snapshot.empty) {
        seedInitialCategories();
        return;
      }
      const items: Category[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Category);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToSales(onData: (sales: Sale[]) => void) {
  const collectionPath = 'sales';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: Sale[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Sale);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToCashRegisters(onData: (registers: CashRegister[]) => void) {
  const collectionPath = 'cashRegisters';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: CashRegister[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as CashRegister);
      });
      items.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToCashMovements(onData: (movements: CashMovement[]) => void) {
  const collectionPath = 'cashMovements';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: CashMovement[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as CashMovement);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToInventoryMovements(onData: (movements: InventoryMovement[]) => void) {
  const collectionPath = 'inventoryMovements';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: InventoryMovement[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as InventoryMovement);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToEmployees(onData: (employees: Employee[]) => void) {
  const collectionPath = 'employees';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (snapshot.empty) {
        seedInitialEmployees();
        return;
      }
      const items: Employee[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Employee);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToShifts(onData: (shifts: EmployeeShift[]) => void) {
  const collectionPath = 'shifts';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      if (snapshot.empty) {
        seedInitialShifts();
        return;
      }
      const items: EmployeeShift[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as EmployeeShift);
      });
      items.sort((a, b) => a.startTime.localeCompare(b.startTime));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

export function subscribeToAuditLogs(onData: (logs: AuditLog[]) => void) {
  const collectionPath = 'auditLogs';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const items: AuditLog[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as AuditLog);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

/**
 * Recursively strips undefined values from an object before sending to Firestore
 * to prevent: "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedFields(value);
    }
  }
  return cleaned as T;
}

// Writers
export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), removeUndefinedFields(product));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSaleToFirestore(sale: Sale): Promise<void> {
  const path = `sales/${sale.id}`;
  try {
    await setDoc(doc(db, 'sales', sale.id), removeUndefinedFields(sale));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveCashRegisterToFirestore(register: CashRegister): Promise<void> {
  const path = `cashRegisters/${register.id}`;
  try {
    await setDoc(doc(db, 'cashRegisters', register.id), removeUndefinedFields(register));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCashMovementToFirestore(movement: CashMovement): Promise<void> {
  const path = `cashMovements/${movement.id}`;
  try {
    await setDoc(doc(db, 'cashMovements', movement.id), removeUndefinedFields(movement));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveInventoryMovementToFirestore(movement: InventoryMovement): Promise<void> {
  const path = `inventoryMovements/${movement.id}`;
  try {
    await setDoc(doc(db, 'inventoryMovements', movement.id), removeUndefinedFields(movement));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveEmployeeToFirestore(employee: Employee): Promise<void> {
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), removeUndefinedFields(employee));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveShiftToFirestore(shift: EmployeeShift): Promise<void> {
  const path = `shifts/${shift.id}`;
  try {
    await setDoc(doc(db, 'shifts', shift.id), removeUndefinedFields(shift));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string): Promise<void> {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteShiftFromFirestore(shiftId: string): Promise<void> {
  const path = `shifts/${shiftId}`;
  try {
    await deleteDoc(doc(db, 'shifts', shiftId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAuditLogToFirestore(log: AuditLog): Promise<void> {
  const path = `auditLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'auditLogs', log.id), removeUndefinedFields(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Initial Seed Helpers (run in batches of 300 to respect Firestore 500 limit)
export async function seedInitialProducts(): Promise<void> {
  try {
    const existing = await getDocs(collection(db, 'products'));
    const existingIds = new Set<string>();
    const existingNames = new Set<string>();
    existing.forEach((doc) => {
      existingIds.add(doc.id);
      const data = doc.data() as Product;
      if (data.name) existingNames.add(data.name.trim().toLowerCase());
    });

    const missingProducts = INITIAL_PRODUCTS.filter(
      (p) => !existingIds.has(p.id) && !existingNames.has(p.name.trim().toLowerCase())
    );

    if (missingProducts.length === 0) return;

    const batches = [];
    let currentBatch = writeBatch(db);
    let count = 0;

    for (const prod of missingProducts) {
      const docRef = doc(db, 'products', prod.id);
      currentBatch.set(docRef, removeUndefinedFields(prod));
      count++;
      if (count % 300 === 0) {
        batches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
      }
    }
    if (count % 300 !== 0) {
      batches.push(currentBatch.commit());
    }
    await Promise.all(batches);
    console.log(`Seeded ${missingProducts.length} missing products to Firestore.`);
  } catch (e) {
    console.warn('Could not seed initial products to Firestore:', e);
  }
}

export async function seedInitialCategories(): Promise<void> {
  try {
    const existing = await getDocs(collection(db, 'categories'));
    if (!existing.empty) return;

    const batch = writeBatch(db);
    for (const cat of INITIAL_CATEGORIES) {
      batch.set(doc(db, 'categories', cat.id), cat);
    }
    await batch.commit();
  } catch (e) {
    console.warn('Could not seed categories:', e);
  }
}

export async function seedInitialEmployees(): Promise<void> {
  try {
    const existing = await getDocs(collection(db, 'employees'));
    if (!existing.empty) return;

    const batch = writeBatch(db);
    for (const emp of INITIAL_EMPLOYEES) {
      batch.set(doc(db, 'employees', emp.id), emp);
    }
    await batch.commit();
  } catch (e) {
    console.warn('Could not seed employees:', e);
  }
}

export async function seedInitialShifts(): Promise<void> {
  try {
    const existing = await getDocs(collection(db, 'shifts'));
    if (!existing.empty) return;

    const batch = writeBatch(db);
    for (const shf of INITIAL_SHIFTS) {
      batch.set(doc(db, 'shifts', shf.id), shf);
    }
    await batch.commit();
  } catch (e) {
    console.warn('Could not seed shifts:', e);
  }
}
