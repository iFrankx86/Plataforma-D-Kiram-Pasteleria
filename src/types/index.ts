export type Role = 'ADMIN' | 'CAJERO' | 'INVENTARIO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  position: string;
}

export type CategoryName = 
  | 'Tortas'
  | 'Postres'
  | 'Pasteles y Queques'
  | 'Bocaditos'
  | 'Bebidas'
  | 'Regalos / Extras';

export interface Category {
  id: string;
  name: CategoryName;
  description: string;
  icon?: string;
  active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  salePrice: number;
  costPrice: number;
  stockCurrent: number;
  stockMinimum: number;
  unit: string; // 'unidad', 'porción', 'caja', 'kg'
  image: string;
  active: boolean;
  createdAt: string;
}

export type PaymentMethodType = 'EFECTIVO' | 'YAPE' | 'PLIN';

export interface PaymentItem {
  method: PaymentMethodType;
  amount: number;
}

export interface SaleDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  code: string;
  cashRegisterId: string;
  employeeId: string;
  employeeName: string;
  subtotal: number;
  discount: number;
  total: number;
  payments: PaymentItem[];
  tenderedCash?: number;
  change?: number;
  status: 'CONFIRMADA' | 'ANULADA';
  voidReason?: string;
  voidedAt?: string;
  items: SaleDetail[];
  createdAt: string;
}

export type CashMovementType = 
  | 'APERTURA'
  | 'INGRESO'
  | 'ABONO_SENCILLO'
  | 'DEVOLUCION_SENCILLO'
  | 'VENTA_EFECTIVO'
  | 'EGRESO'
  | 'RETIRO'
  | 'AJUSTE'
  | 'ANULACION_VENTA';

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  reference?: string;
  createdBy: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  code: string;
  employeeId: string;
  employeeName: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  expectedCash: number;
  countedCash?: number;
  difference?: number;
  closingNotes?: string;
  status: 'ABIERTA' | 'CERRADA';
}

export type InventoryMovementType = 
  | 'ENTRADA'
  | 'VENTA'
  | 'MERMA'
  | 'AJUSTE'
  | 'DEVOLUCION';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceType?: 'VENTA' | 'COMPRA' | 'MANUAL' | 'ANULACION';
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  position: string;
  role: Role;
  active: boolean;
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO';
  notes: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}
