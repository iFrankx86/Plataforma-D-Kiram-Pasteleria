import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Product, 
  Category, 
  Sale, 
  SaleDetail, 
  PaymentItem, 
  CashRegister, 
  CashMovement, 
  InventoryMovement, 
  Employee, 
  EmployeeShift, 
  AuditLog,
  InventoryMovementType,
  PendingSyncItem
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_EMPLOYEES, 
  INITIAL_SHIFTS 
} from '../data/mockData';
import { NOTEBOOK_PRODUCTS } from '../data/notebookProducts';
import {
  subscribeToProducts,
  subscribeToCategories,
  subscribeToSales,
  subscribeToCashRegisters,
  subscribeToCashMovements,
  subscribeToInventoryMovements,
  subscribeToEmployees,
  subscribeToShifts,
  subscribeToAuditLogs,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveSaleToFirestore,
  saveCashRegisterToFirestore,
  saveCashMovementToFirestore,
  saveInventoryMovementToFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveShiftToFirestore,
  saveAuditLogToFirestore
} from '../firebase/firestoreService';
import {
  getPendingSyncQueue,
  enqueuePendingSync,
  removePendingSyncItem,
  processSyncItem,
  syncAllPendingItems,
  getLastSyncTime
} from '../firebase/syncService';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  
  // Categories & Products
  categories: Category[];
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => { success: boolean; error?: string; product?: Product };
  updateProduct: (id: string, updates: Partial<Product>) => { success: boolean; error?: string };
  deleteProduct: (id: string) => { success: boolean; error?: string };
  toggleProductStatus: (id: string) => void;
  syncNotebookProducts: () => { addedCount: number; skippedCount: number };
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateCartQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  cartSubtotal: number;
  cartTotal: number;

  // Sales
  sales: Sale[];
  confirmSale: (params: {
    payments: PaymentItem[];
    tenderedCash?: number;
    change?: number;
  }) => { success: boolean; sale?: Sale; error?: string };
  voidSale: (saleId: string, reason: string) => { success: boolean; error?: string };

  // Cash Register
  currentCashRegister: CashRegister | null;
  cashRegisters: CashRegister[];
  cashMovements: CashMovement[];
  openCashRegister: (openingAmount: number) => { success: boolean; error?: string };
  closeCashRegister: (countedCash: number, notes?: string) => { success: boolean; error?: string };
  addManualCashMovement: (type: 'INGRESO' | 'EGRESO' | 'RETIRO' | 'AJUSTE' | 'ABONO_SENCILLO' | 'DEVOLUCION_SENCILLO', amount: number, reason: string) => { success: boolean; error?: string };

  // Inventory
  inventoryMovements: InventoryMovement[];
  addInventoryAdjustment: (params: {
    productId: string;
    type: 'ENTRADA' | 'MERMA' | 'AJUSTE';
    quantity: number;
    reason: string;
  }) => { success: boolean; error?: string };

  // Employees & Shifts
  employees: Employee[];
  shifts: EmployeeShift[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addShift: (shift: Omit<EmployeeShift, 'id'>) => void;
  updateShiftStatus: (id: string, status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO') => void;

  // Audit
  auditLogs: AuditLog[];
  addAuditLog: (action: string, entity: string, entityId: string, details: string) => void;

  // Recent Completed Sale for Receipt modal
  activeReceiptSale: Sale | null;
  setActiveReceiptSale: (sale: Sale | null) => void;

  // Offline & Cloud Sync Management
  isOnline: boolean;
  syncQueue: PendingSyncItem[];
  isSyncing: boolean;
  lastSyncSuccessTime: string | null;
  syncPendingTransactions: () => Promise<{ success: boolean; syncedCount: number; errors?: string[] }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'dkiram_current_user',
  CATEGORIES: 'dkiram_categories',
  PRODUCTS: 'dkiram_products',
  SALES: 'dkiram_sales',
  CASH_REGISTERS: 'dkiram_cash_registers',
  CASH_MOVEMENTS: 'dkiram_cash_movements',
  INVENTORY_MOVEMENTS: 'dkiram_inventory_movements',
  EMPLOYEES: 'dkiram_employees',
  SHIFTS: 'dkiram_shifts',
  AUDIT_LOGS: 'dkiram_audit_logs',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current User (Predeterminado: Frank Lope - Vendedor & Cajero activo de hoy)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Carlos Rivera' || parsed.name === 'Zaori Sanchez' || !INITIAL_USERS.some(u => u.id === parsed.id)) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
          return INITIAL_USERS[0]; // Frank Lope
        }
        return parsed;
      } catch (e) {
        console.error('Error reading currentUser:', e);
      }
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    return INITIAL_USERS[0]; // Frank Lope (CAJERO)
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if notebook products need to be merged without duplicating ("si existe no lo hagas")
          const existingNames = new Set(parsed.map((p: Product) => p.name.trim().toLowerCase()));
          const existingSkus = new Set(parsed.map((p: Product) => p.sku.trim().toLowerCase()));
          
          const missingNotebookItems = INITIAL_PRODUCTS.filter(
            ip => !existingNames.has(ip.name.trim().toLowerCase()) && !existingSkus.has(ip.sku.trim().toLowerCase())
          );

          if (missingNotebookItems.length > 0) {
            const merged = [...parsed, ...missingNotebookItems];
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      } catch (err) {
        console.error('Error reading stored products:', err);
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Cash Register (Frank Lope aperturó hoy a las 10:00 AM)
  const todayStr = new Date().toISOString().split('T')[0];
  const openingTimeToday = `${todayStr}T10:00:00`;

  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_REGISTERS);
    if (saved) {
      try {
        const parsed: CashRegister[] = JSON.parse(saved);
        // Actualizar caja abierta de hoy con Frank Lope a las 10:00 AM
        const updated = parsed.map(cr => {
          if (cr.employeeName === 'Carlos Rivera' || cr.employeeName === 'Zaori Sanchez') {
            return {
              ...cr,
              employeeName: 'Frank Lope',
              employeeId: INITIAL_USERS[0].id,
              openedAt: openingTimeToday,
            };
          }
          return cr;
        });
        localStorage.setItem(STORAGE_KEYS.CASH_REGISTERS, JSON.stringify(updated));
        return updated;
      } catch (e) {
        console.error('Error reading cashRegisters:', e);
      }
    }
    // Create an initial open cash register aperturada por Frank Lope a las 10:00 AM
    const initialRegister: CashRegister = {
      id: 'caja-1',
      code: 'CAJA-2026-001',
      employeeId: INITIAL_USERS[0].id,
      employeeName: 'Frank Lope',
      openedAt: openingTimeToday,
      openingAmount: 150.00,
      expectedCash: 153.00,
      status: 'ABIERTA',
    };
    localStorage.setItem(STORAGE_KEYS.CASH_REGISTERS, JSON.stringify([initialRegister]));
    return [initialRegister];
  });

  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_MOVEMENTS);
    if (saved) {
      try {
        const parsed: CashMovement[] = JSON.parse(saved);
        const updated = parsed.map(m => {
          if (m.createdBy === 'Carlos Rivera' || m.createdBy === 'Zaori Sanchez') {
            return {
              ...m,
              createdBy: 'Frank Lope',
              createdAt: m.type === 'APERTURA' ? openingTimeToday : m.createdAt,
              reason: m.type === 'APERTURA' ? 'Apertura de turno de caja - 10:00 AM' : m.reason
            };
          }
          return m;
        });
        localStorage.setItem(STORAGE_KEYS.CASH_MOVEMENTS, JSON.stringify(updated));
        return updated;
      } catch (e) {}
    }
    const initialMov: CashMovement[] = [
      {
        id: 'mov-1',
        cashRegisterId: 'caja-1',
        type: 'APERTURA',
        amount: 150.00,
        reason: 'Apertura de turno de caja - 10:00 AM',
        createdBy: 'Frank Lope',
        createdAt: openingTimeToday,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.CASH_MOVEMENTS, JSON.stringify(initialMov));
    return initialMov;
  });

  // Sales (Modificar primera venta V-100001 y ventas de Carlos Rivera por Frank Lope)
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      try {
        const parsed: Sale[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updated = parsed.map(s => {
            if (s.employeeName === 'Carlos Rivera' || s.employeeName === 'Zaori Sanchez' || s.code === 'V-100001') {
              return {
                ...s,
                employeeName: 'Frank Lope',
                employeeId: INITIAL_USERS[0].id,
              };
            }
            return s;
          });
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updated));
          return updated;
        }
      } catch (e) {
        console.error('Error reading sales:', e);
      }
    }
    return [];
  });

  // Inventory movements
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'inv-init-1',
        productId: 'prod-1',
        productName: 'Torta de Chocolate Húmeda',
        type: 'ENTRADA',
        quantity: 6,
        stockBefore: 0,
        stockAfter: 6,
        reason: 'Lote de producción matutina',
        referenceType: 'MANUAL',
        createdBy: 'Carlos Pomahuacre',
        createdAt: new Date().toISOString(),
      }
    ];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(e => e.firstName === 'Arsencia') && parsed.some(e => e.lastName?.includes('Pomahuacre'))) {
          return parsed;
        }
      } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_EMPLOYEES;
  });

  const [shifts, setShifts] = useState<EmployeeShift[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(s => s.employeeName?.includes('Carlos Pomahuacre'))) {
          return parsed;
        }
      } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS));
    return INITIAL_SHIFTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (saved) {
      try {
        const parsed: AuditLog[] = JSON.parse(saved);
        const updated = parsed.map(a => (a.userName === 'Carlos Rivera' || a.userName === 'Zaori Sanchez') ? { ...a, userName: 'Frank Lope' } : a);
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
        return updated;
      } catch (e) {}
    }
    return [
      {
        id: 'aud-1',
        userId: INITIAL_USERS[0].id,
        userName: INITIAL_USERS[0].name,
        action: 'APERTURA_CAJA',
        entity: 'CASH_REGISTER',
        entityId: 'caja-1',
        details: 'Apertura de turno de caja a las 10:00 AM con fondo S/ 150.00',
        createdAt: openingTimeToday,
      }
    ];
  });

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Offline & Synchronization State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [syncQueue, setSyncQueue] = useState<PendingSyncItem[]>(() => getPendingSyncQueue());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncSuccessTime, setLastSyncSuccessTime] = useState<string | null>(() => getLastSyncTime());

  // Background Sync Engine
  const syncPendingTransactions = async () => {
    if (isSyncing) return { success: false, syncedCount: 0 };
    const queue = getPendingSyncQueue();
    if (queue.length === 0) {
      setSyncQueue([]);
      return { success: true, syncedCount: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await syncAllPendingItems(products);
      setSyncQueue(result.remainingQueue);
      if (result.successCount > 0) {
        setLastSyncSuccessTime(new Date().toISOString());
      }
      setIsSyncing(false);
      return {
        success: result.failedCount === 0,
        syncedCount: result.successCount,
        errors: result.errors,
      };
    } catch (err) {
      console.error('Error during batch synchronization:', err);
      setIsSyncing(false);
      return { success: false, syncedCount: 0, errors: [String(err)] };
    }
  };

  // Connectivity Monitoring & Automatic Sync Recovery
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync immediately when network is recovered!
      syncPendingTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check on mount if online and queue has items
    if (typeof navigator !== 'undefined' && navigator.onLine && syncQueue.length > 0) {
      syncPendingTransactions();
    }

    // Periodic sync check every 25 seconds if there are items in the queue
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && getPendingSyncQueue().length > 0) {
        syncPendingTransactions();
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_REGISTERS, JSON.stringify(cashRegisters));
  }, [cashRegisters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_MOVEMENTS, JSON.stringify(cashMovements));
  }, [cashMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, JSON.stringify(inventoryMovements));
  }, [inventoryMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Real-time Firestore Sync with Offline Protection Reconciliation
  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubSales: (() => void) | undefined;
    let unsubRegisters: (() => void) | undefined;
    let unsubMovements: (() => void) | undefined;
    let unsubInvMovements: (() => void) | undefined;
    let unsubEmployees: (() => void) | undefined;
    let unsubShifts: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;

    try {
      unsubProducts = subscribeToProducts((prods) => {
        if (prods && prods.length > 0) setProducts(prods);
      });
      unsubCategories = subscribeToCategories((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      });
      unsubSales = subscribeToSales((remoteSales) => {
        if (remoteSales) {
          setSales(prev => {
            const currentQueue = getPendingSyncQueue();
            const pendingSaleIds = new Set(
              currentQueue.filter(q => q.type === 'SALE' && q.data.sale).map(q => q.data.sale!.id)
            );
            const pendingLocalSales = prev.filter(s => pendingSaleIds.has(s.id) && !remoteSales.some(r => r.id === s.id));
            return [...pendingLocalSales, ...remoteSales];
          });
        }
      });
      unsubRegisters = subscribeToCashRegisters((regs) => {
        if (regs && regs.length > 0) setCashRegisters(regs);
      });
      unsubMovements = subscribeToCashMovements((remoteMovs) => {
        if (remoteMovs) {
          setCashMovements(prev => {
            const currentQueue = getPendingSyncQueue();
            const pendingMovIds = new Set(
              currentQueue.filter(q => q.data.cashMovement).map(q => q.data.cashMovement!.id)
            );
            const pendingLocalMovs = prev.filter(m => pendingMovIds.has(m.id) && !remoteMovs.some(r => r.id === m.id));
            return [...pendingLocalMovs, ...remoteMovs];
          });
        }
      });
      unsubInvMovements = subscribeToInventoryMovements((remoteInvs) => {
        if (remoteInvs) {
          setInventoryMovements(prev => {
            const currentQueue = getPendingSyncQueue();
            const pendingInvIds = new Set(
              currentQueue.flatMap(q => q.data.inventoryMovements?.map(i => i.id) || [])
            );
            const pendingLocalInvs = prev.filter(inv => pendingInvIds.has(inv.id) && !remoteInvs.some(r => r.id === inv.id));
            return [...pendingLocalInvs, ...remoteInvs];
          });
        }
      });
      unsubEmployees = subscribeToEmployees((emps) => {
        if (emps && emps.length > 0) setEmployees(emps);
      });
      unsubShifts = subscribeToShifts((shfs) => {
        if (shfs && shfs.length > 0) setShifts(shfs);
      });
      unsubLogs = subscribeToAuditLogs((logs) => {
        if (logs && logs.length > 0) setAuditLogs(logs);
      });
    } catch (err) {
      console.warn("Error setting up Firestore subscriptions:", err);
    }

    return () => {
      unsubProducts?.();
      unsubCategories?.();
      unsubSales?.();
      unsubRegisters?.();
      unsubMovements?.();
      unsubInvMovements?.();
      unsubEmployees?.();
      unsubShifts?.();
      unsubLogs?.();
    };
  }, []);

  // Derived active cash register
  const currentCashRegister = cashRegisters.find(cr => cr.status === 'ABIERTA') || null;

  // Audit Helper
  const addAuditLog = (action: string, entity: string, entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      entity,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog).catch(console.warn);
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    if (!product.active) {
      return { success: false, message: 'El producto está inactivo' };
    }
    const existing = cart.find(item => item.product.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;

    if (requestedTotal > product.stockCurrent) {
      return { 
        success: false, 
        message: `Stock insuficiente. Disponible: ${product.stockCurrent} ${product.unit}(s)` 
      };
    }

    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: requestedTotal } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity }]);
    }
    return { success: true };
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }
    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Producto no encontrado' };

    if (quantity > product.stockCurrent) {
      return { 
        success: false, 
        message: `Stock insuficiente. Solo quedan ${product.stockCurrent} ${product.unit}(s)` 
      };
    }

    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  // Cash Register Actions
  const openCashRegister = (openingAmount: number) => {
    if (currentCashRegister) {
      return { success: false, error: 'Ya existe una caja abierta en este momento.' };
    }
    const newRegister: CashRegister = {
      id: `caja-${Date.now()}`,
      code: `CAJA-2026-${String(cashRegisters.length + 1).padStart(3, '0')}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      openedAt: new Date().toISOString(),
      openingAmount: Number(openingAmount.toFixed(2)),
      expectedCash: Number(openingAmount.toFixed(2)),
      status: 'ABIERTA',
    };

    const initialMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      cashRegisterId: newRegister.id,
      type: 'APERTURA',
      amount: openingAmount,
      reason: 'Apertura de turno de caja',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setCashRegisters(prev => [newRegister, ...prev]);
    setCashMovements(prev => [initialMovement, ...prev]);
    saveCashRegisterToFirestore(newRegister).catch(console.warn);
    saveCashMovementToFirestore(initialMovement).catch(console.warn);
    addAuditLog('APERTURA_CAJA', 'CASH_REGISTER', newRegister.id, `Monto inicial: S/ ${openingAmount.toFixed(2)} por ${currentUser.name}`);

    return { success: true };
  };

  const closeCashRegister = (countedCash: number, notes?: string) => {
    if (!currentCashRegister) {
      return { success: false, error: 'No hay ninguna caja abierta.' };
    }

    const difference = Number((countedCash - currentCashRegister.expectedCash).toFixed(2));
    const closedRegister: CashRegister = {
      ...currentCashRegister,
      closedAt: new Date().toISOString(),
      countedCash: Number(countedCash.toFixed(2)),
      difference,
      closingNotes: notes || '',
      status: 'CERRADA',
    };

    setCashRegisters(prev => prev.map(cr => cr.id === currentCashRegister.id ? closedRegister : cr));
    saveCashRegisterToFirestore(closedRegister).catch(console.warn);
    addAuditLog(
      'CIERRE_CAJA', 
      'CASH_REGISTER', 
      currentCashRegister.id, 
      `Efectivo Esperado: S/ ${currentCashRegister.expectedCash.toFixed(2)} | Contado: S/ ${countedCash.toFixed(2)} | Diferencia: S/ ${difference.toFixed(2)}${notes ? ' | Obs: ' + notes : ''}`
    );

    return { success: true };
  };

  const addManualCashMovement = (
    type: 'INGRESO' | 'EGRESO' | 'RETIRO' | 'AJUSTE' | 'ABONO_SENCILLO' | 'DEVOLUCION_SENCILLO', 
    amount: number, 
    reason: string
  ) => {
    if (!currentCashRegister) {
      return { success: false, error: 'La caja debe estar abierta para registrar movimientos de dinero.' };
    }
    if (amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0.' };
    }

    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      cashRegisterId: currentCashRegister.id,
      type,
      amount: Number(amount.toFixed(2)),
      reason,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    // Update expected cash:
    // INGRESO, ABONO_SENCILLO, AJUSTE (+) add cash to drawer
    // EGRESO, RETIRO, DEVOLUCION_SENCILLO (-) subtract cash from drawer
    let delta = 0;
    if (type === 'INGRESO' || type === 'ABONO_SENCILLO') delta = amount;
    else if (type === 'EGRESO' || type === 'RETIRO' || type === 'DEVOLUCION_SENCILLO') delta = -amount;
    else if (type === 'AJUSTE') delta = amount;

    const updatedExpected = Math.max(0, currentCashRegister.expectedCash + delta);
    const updatedRegister = { ...currentCashRegister, expectedCash: Number(updatedExpected.toFixed(2)) };

    setCashMovements(prev => [newMovement, ...prev]);
    setCashRegisters(prev => prev.map(cr => cr.id === currentCashRegister.id ? updatedRegister : cr));
    saveCashMovementToFirestore(newMovement).catch(console.warn);
    saveCashRegisterToFirestore(updatedRegister).catch(console.warn);
    addAuditLog('MOVIMIENTO_CAJA', 'CASH_MOVEMENT', newMovement.id, `${type}: S/ ${amount.toFixed(2)} - ${reason}`);

    return { success: true };
  };

  // Transactional Sale Confirmation
  // Follows Section 8, 9, 10, 11, 27 of Informe Técnico:
  // 1. Validar caja abierta
  // 2. Validar productos y stock
  // 3. Crear venta y detalles (preservar precio_unitario histórico)
  // 4. Registrar pagos (suma debe ser igual al total)
  // 5. Descontar stock e insertar inventory_movement
  // 6. Si hay pago en efectivo, incrementar SOLO esa porción en el efectivo esperado de caja (Yape y Plin no incrementan efectivo físico)
  const confirmSale = (params: {
    payments: PaymentItem[];
    tenderedCash?: number;
    change?: number;
  }) => {
    if (!currentCashRegister) {
      return { success: false, error: 'No se puede vender sin una caja abierta. Por favor, abre la caja primero.' };
    }

    if (cart.length === 0) {
      return { success: false, error: 'El carrito de ventas está vacío.' };
    }

    // Validate payments sum equals cartTotal
    const paymentSum = params.payments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(paymentSum - cartTotal) > 0.01) {
      return { 
        success: false, 
        error: `La suma de pagos (S/ ${paymentSum.toFixed(2)}) debe coincidir exactamente con el total (S/ ${cartTotal.toFixed(2)}).` 
      };
    }

    // Validate current stock for each product
    for (const item of cart) {
      const liveProduct = products.find(p => p.id === item.product.id);
      if (!liveProduct) {
        return { success: false, error: `El producto ${item.product.name} ya no existe.` };
      }
      if (!liveProduct.active) {
        return { success: false, error: `El producto ${item.product.name} está inactivo.` };
      }
      if (liveProduct.stockCurrent < item.quantity) {
        return { 
          success: false, 
          error: `Stock insuficiente para ${item.product.name}. Disponible: ${liveProduct.stockCurrent}, Solicitado: ${item.quantity}.` 
        };
      }
    }

    const saleCode = `V-${100000 + sales.length + 1}`;
    const saleId = `sale-${Date.now()}`;

    // Create Sale Items with historical prices
    const saleItems: SaleDetail[] = cart.map(item => ({
      id: `det-${Date.now()}-${item.product.id}`,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.salePrice,
      costPrice: item.product.costPrice,
      subtotal: item.product.salePrice * item.quantity,
    }));

    const newSale: Sale = {
      id: saleId,
      code: saleCode,
      cashRegisterId: currentCashRegister.id,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartTotal,
      payments: params.payments,
      ...(params.tenderedCash !== undefined && params.tenderedCash !== null ? { tenderedCash: params.tenderedCash } : {}),
      ...(params.change !== undefined && params.change !== null ? { change: params.change } : {}),
      status: 'CONFIRMADA',
      items: saleItems,
      createdAt: new Date().toISOString(),
    };

    // Update Product Stocks & Create Inventory Movements
    const newInventoryMovements: InventoryMovement[] = [];
    const updatedProducts = products.map(prod => {
      const inCart = cart.find(ci => ci.product.id === prod.id);
      if (inCart) {
        const newStock = prod.stockCurrent - inCart.quantity;
        newInventoryMovements.push({
          id: `inv-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          type: 'VENTA',
          quantity: inCart.quantity,
          stockBefore: prod.stockCurrent,
          stockAfter: newStock,
          reason: `Venta ${saleCode}`,
          referenceType: 'VENTA',
          referenceId: saleId,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
        });
        return { ...prod, stockCurrent: newStock };
      }
      return prod;
    });

    // Check if cash payment exists
    const cashPortion = params.payments.find(p => p.method === 'EFECTIVO')?.amount || 0;
    let cashMove: CashMovement | undefined = undefined;
    let updatedRegister: CashRegister | undefined = undefined;

    if (cashPortion > 0) {
      cashMove = {
        id: `mov-${Date.now()}`,
        cashRegisterId: currentCashRegister.id,
        type: 'VENTA_EFECTIVO',
        amount: cashPortion,
        reason: `Venta en efectivo ${saleCode}`,
        reference: saleId,
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      setCashMovements(prev => [cashMove!, ...prev]);

      // Only cash increases physical expected cash in register!
      const newExpectedCash = currentCashRegister.expectedCash + cashPortion;
      updatedRegister = { ...currentCashRegister, expectedCash: Number(newExpectedCash.toFixed(2)) };
      setCashRegisters(prev => prev.map(cr => cr.id === currentCashRegister.id ? updatedRegister! : cr));
    }

    setProducts(updatedProducts);
    setInventoryMovements(prev => [...newInventoryMovements, ...prev]);
    setSales(prev => [newSale, ...prev]);

    // Create Audit Log
    const saleLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'REGISTRAR_VENTA',
      entity: 'SALE',
      entityId: saleId,
      details: `Venta ${saleCode} por S/ ${cartTotal.toFixed(2)} - Pagos: ${params.payments.map(p => `${p.method}: S/ ${p.amount.toFixed(2)}`).join(', ')}`,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs(prev => [saleLog, ...prev]);

    // Offline-First Enqueue for Cloud Sync
    const syncItem = enqueuePendingSync({
      type: 'SALE',
      data: {
        sale: newSale,
        inventoryMovements: newInventoryMovements,
        updatedProducts: updatedProducts
          .filter(p => cart.some(ci => ci.product.id === p.id))
          .map(p => ({ id: p.id, stockCurrent: p.stockCurrent })),
        cashMovement: cashMove,
        updatedRegister: updatedRegister,
        auditLog: saleLog,
      },
    });
    setSyncQueue(getPendingSyncQueue());

    // Immediate background synchronization attempt if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      processSyncItem(syncItem, updatedProducts)
        .then(() => {
          removePendingSyncItem(syncItem.id);
          setSyncQueue(getPendingSyncQueue());
          setLastSyncSuccessTime(new Date().toISOString());
        })
        .catch((err) => {
          console.warn('Network issue writing sale to Firestore. Kept safely in offline queue:', err);
        });
    }

    // Reset Cart
    clearCart();
    setActiveReceiptSale(newSale);

    return { success: true, sale: newSale };
  };

  // Void Sale (Anular Venta)
  const voidSale = (saleId: string, reason: string) => {
    if (currentUser.role === 'INVENTARIO') {
      return { success: false, error: 'No tienes permisos para anular ventas.' };
    }

    const saleToVoid = sales.find(s => s.id === saleId);
    if (!saleToVoid) return { success: false, error: 'Venta no encontrada.' };
    if (saleToVoid.status === 'ANULADA') return { success: false, error: 'La venta ya se encuentra anulada.' };

    // Return stock
    const newInvMoves: InventoryMovement[] = [];
    const updatedProducts = products.map(prod => {
      const itemInSale = saleToVoid.items.find(i => i.productId === prod.id);
      if (itemInSale) {
        const newStock = prod.stockCurrent + itemInSale.quantity;
        newInvMoves.push({
          id: `inv-void-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          type: 'DEVOLUCION',
          quantity: itemInSale.quantity,
          stockBefore: prod.stockCurrent,
          stockAfter: newStock,
          reason: `Anulación de venta ${saleToVoid.code}: ${reason}`,
          referenceType: 'ANULACION',
          referenceId: saleId,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
        });
        return { ...prod, stockCurrent: newStock };
      }
      return prod;
    });

    // Revert cash movement if cash was paid
    const cashPortion = saleToVoid.payments.find(p => p.method === 'EFECTIVO')?.amount || 0;
    let cashReversal: CashMovement | undefined = undefined;
    let updatedRegister: CashRegister | undefined = undefined;

    if (cashPortion > 0 && currentCashRegister) {
      cashReversal = {
        id: `mov-void-${Date.now()}`,
        cashRegisterId: currentCashRegister.id,
        type: 'ANULACION_VENTA',
        amount: cashPortion,
        reason: `Reversión por anulación de venta ${saleToVoid.code}: ${reason}`,
        reference: saleId,
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      setCashMovements(prev => [cashReversal!, ...prev]);
      const newExpectedCash = Math.max(0, currentCashRegister.expectedCash - cashPortion);
      updatedRegister = { ...currentCashRegister, expectedCash: Number(newExpectedCash.toFixed(2)) };
      setCashRegisters(prev => prev.map(cr => cr.id === currentCashRegister.id ? updatedRegister! : cr));
    }

    const updatedSale: Sale = {
      ...saleToVoid,
      status: 'ANULADA',
      voidReason: reason,
      voidedAt: new Date().toISOString(),
    };

    setProducts(updatedProducts);
    setInventoryMovements(prev => [...newInvMoves, ...prev]);
    setSales(prev => prev.map(s => s.id === saleId ? updatedSale : s));

    const voidLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'ANULAR_VENTA',
      entity: 'SALE',
      entityId: saleId,
      details: `Anulada venta ${saleToVoid.code} por ${currentUser.name}. Motivo: ${reason}`,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs(prev => [voidLog, ...prev]);

    // Offline-First Enqueue for Cloud Sync
    const syncItem = enqueuePendingSync({
      type: 'VOID_SALE',
      data: {
        sale: updatedSale,
        inventoryMovements: newInvMoves,
        updatedProducts: updatedProducts
          .filter(p => saleToVoid.items.some(i => i.productId === p.id))
          .map(p => ({ id: p.id, stockCurrent: p.stockCurrent })),
        cashMovement: cashReversal,
        updatedRegister: updatedRegister,
        auditLog: voidLog,
      },
    });
    setSyncQueue(getPendingSyncQueue());

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      processSyncItem(syncItem, updatedProducts)
        .then(() => {
          removePendingSyncItem(syncItem.id);
          setSyncQueue(getPendingSyncQueue());
          setLastSyncSuccessTime(new Date().toISOString());
        })
        .catch(console.warn);
    }

    return { success: true };
  };

  // Inventory Adjustments (Entrada, Merma, Ajuste)
  const addInventoryAdjustment = (params: {
    productId: string;
    type: 'ENTRADA' | 'MERMA' | 'AJUSTE';
    quantity: number;
    reason: string;
  }) => {
    const product = products.find(p => p.id === params.productId);
    if (!product) return { success: false, error: 'Producto no encontrado.' };

    let newStock = product.stockCurrent;
    if (params.type === 'ENTRADA') {
      newStock += params.quantity;
    } else if (params.type === 'MERMA') {
      if (params.quantity > product.stockCurrent) {
        return { success: false, error: 'La merma no puede ser mayor al stock actual.' };
      }
      newStock -= params.quantity;
    } else if (params.type === 'AJUSTE') {
      newStock = params.quantity; // direct count adjustment
    }

    const movement: InventoryMovement = {
      id: `inv-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: params.type,
      quantity: params.type === 'AJUSTE' ? Math.abs(newStock - product.stockCurrent) : params.quantity,
      stockBefore: product.stockCurrent,
      stockAfter: newStock,
      reason: params.reason,
      referenceType: 'MANUAL',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const updatedProduct = { ...product, stockCurrent: newStock };
    setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
    setInventoryMovements(prev => [movement, ...prev]);
    saveProductToFirestore(updatedProduct).catch(console.warn);
    saveInventoryMovementToFirestore(movement).catch(console.warn);
    addAuditLog('AJUSTE_INVENTARIO', 'PRODUCT', product.id, `${params.type} de ${product.name}: Stock ${product.stockCurrent} -> ${newStock} (${params.reason})`);

    return { success: true };
  };

  // Product Duplicate Check: "si existe no lo hagas"
  const isProductDuplicate = (
    name: string,
    sku: string,
    excludeId?: string
  ): { isDuplicate: boolean; reason?: string } => {
    const cleanName = name.trim().toLowerCase();
    const cleanSku = sku.trim().toLowerCase();

    const dupName = products.find(
      p => (!excludeId || p.id !== excludeId) && p.name.trim().toLowerCase() === cleanName
    );
    if (dupName) {
      return {
        isDuplicate: true,
        reason: `Ya existe un producto con el nombre "${dupName.name}" (Código SKU: ${dupName.sku}). No se permiten duplicados.`,
      };
    }

    const dupSku = products.find(
      p => (!excludeId || p.id !== excludeId) && p.sku.trim().toLowerCase() === cleanSku
    );
    if (dupSku) {
      return {
        isDuplicate: true,
        reason: `Ya existe un producto con el código SKU "${dupSku.sku}" (${dupSku.name}). No se permiten duplicados.`,
      };
    }

    return { isDuplicate: false };
  };

  // Product CRUD with "si existe no lo hagas" verification
  const addProduct = (
    prodData: Omit<Product, 'id' | 'createdAt'>
  ): { success: boolean; error?: string; product?: Product } => {
    const check = isProductDuplicate(prodData.name, prodData.sku);
    if (check.isDuplicate) {
      return { success: false, error: check.reason };
    }

    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    setProducts(prev => [newProduct, ...prev]);
    saveProductToFirestore(newProduct).catch(console.warn);
    addAuditLog(
      'CREAR_PRODUCTO',
      'PRODUCT',
      newProduct.id,
      `Creado producto: ${newProduct.name} (${newProduct.sku}) Precio: S/ ${newProduct.salePrice.toFixed(2)} por ${currentUser.name}`
    );

    return { success: true, product: newProduct };
  };

  const updateProduct = (
    id: string,
    updates: Partial<Product>
  ): { success: boolean; error?: string } => {
    const oldProduct = products.find(p => p.id === id);
    if (!oldProduct) {
      return { success: false, error: 'Producto no encontrado.' };
    }

    const targetName = updates.name !== undefined ? updates.name : oldProduct.name;
    const targetSku = updates.sku !== undefined ? updates.sku : oldProduct.sku;

    const check = isProductDuplicate(targetName, targetSku, id);
    if (check.isDuplicate) {
      return { success: false, error: check.reason };
    }

    const updated = { ...oldProduct, ...updates };
    setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
    saveProductToFirestore(updated).catch(console.warn);
    addAuditLog(
      'EDITAR_PRODUCTO',
      'PRODUCT',
      id,
      `Actualizado ${oldProduct.name}: ${JSON.stringify(updates)}`
    );

    return { success: true };
  };

  const deleteProduct = (id: string): { success: boolean; error?: string } => {
    const prodToDelete = products.find(p => p.id === id);
    if (!prodToDelete) {
      return { success: false, error: 'Producto no encontrado.' };
    }

    // Remove from cart if present
    setCart(prev => prev.filter(item => item.product.id !== id));

    // Remove from products
    setProducts(prev => prev.filter(p => p.id !== id));
    deleteProductFromFirestore(id).catch(console.warn);

    addAuditLog(
      'ELIMINAR_PRODUCTO',
      'PRODUCT',
      id,
      `Eliminado producto: ${prodToDelete.name} (${prodToDelete.sku}) por ${currentUser.name}`
    );

    return { success: true };
  };

  const toggleProductStatus = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    updateProduct(id, { active: !prod.active });
  };

  // Sincronizar productos del cuaderno: "si existe no lo hagas"
  const syncNotebookProducts = (): { addedCount: number; skippedCount: number } => {
    let added = 0;
    let skipped = 0;
    const toAdd: Product[] = [];

    for (const item of NOTEBOOK_PRODUCTS) {
      const cleanName = item.name.trim().toLowerCase();
      const cleanSku = item.sku.trim().toLowerCase();

      const exists = products.some(
        p => p.name.trim().toLowerCase() === cleanName || p.sku.trim().toLowerCase() === cleanSku
      ) || toAdd.some(
        p => p.name.trim().toLowerCase() === cleanName || p.sku.trim().toLowerCase() === cleanSku
      );

      if (exists) {
        skipped++;
      } else {
        toAdd.push({
          id: `prod-nb-${Date.now()}-${added + 1}`,
          sku: item.sku,
          name: item.name,
          description: item.description,
          categoryId: item.categoryId,
          salePrice: item.salePrice,
          costPrice: item.costPrice,
          stockCurrent: item.stockCurrent,
          stockMinimum: item.stockMinimum,
          unit: item.unit,
          image: item.image,
          active: true,
          createdAt: new Date().toISOString(),
        });
        added++;
      }
    }

    if (toAdd.length > 0) {
      setProducts(prev => [...toAdd, ...prev]);
      for (const prod of toAdd) {
        saveProductToFirestore(prod).catch(console.warn);
      }
      addAuditLog(
        'IMPORTAR_PRODUCTOS',
        'PRODUCT',
        'BATCH',
        `Sincronizados ${added} productos del cuaderno de notas (Omitidos ${skipped} existentes)`
      );
    }

    return { addedCount: added, skippedCount: skipped };
  };

  // Employees & Shifts
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmp]);
    saveEmployeeToFirestore(newEmp).catch(console.warn);
    addAuditLog('CREAR_EMPLEADO', 'EMPLOYEE', newEmp.id, `Registrado empleado: ${newEmp.firstName} ${newEmp.lastName} (${newEmp.position})`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      const updatedEmp = { ...emp, ...updates };
      setEmployees(prev => prev.map(e => e.id === id ? updatedEmp : e));
      saveEmployeeToFirestore(updatedEmp).catch(console.warn);
    }
  };

  const addShift = (shiftData: Omit<EmployeeShift, 'id'>) => {
    const newShift: EmployeeShift = {
      ...shiftData,
      id: `shf-${Date.now()}`,
    };
    setShifts(prev => [newShift, ...prev]);
    saveShiftToFirestore(newShift).catch(console.warn);
    addAuditLog('CREAR_TURNO', 'SHIFT', newShift.id, `Turno para ${newShift.employeeName} (${newShift.date} ${newShift.startTime}-${newShift.endTime})`);
  };

  const updateShiftStatus = (id: string, status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO') => {
    const shf = shifts.find(s => s.id === id);
    if (shf) {
      const updatedShf = { ...shf, status };
      setShifts(prev => prev.map(s => s.id === id ? updatedShf : s));
      saveShiftToFirestore(updatedShf).catch(console.warn);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users: INITIAL_USERS,
        categories,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        syncNotebookProducts,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        cartSubtotal,
        cartTotal,
        sales,
        confirmSale,
        voidSale,
        currentCashRegister,
        cashRegisters,
        cashMovements,
        openCashRegister,
        closeCashRegister,
        addManualCashMovement,
        inventoryMovements,
        addInventoryAdjustment,
        employees,
        shifts,
        addEmployee,
        updateEmployee,
        addShift,
        updateShiftStatus,
        auditLogs,
        addAuditLog,
        activeReceiptSale,
        setActiveReceiptSale,
        isOnline,
        syncQueue,
        isSyncing,
        lastSyncSuccessTime,
        syncPendingTransactions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
