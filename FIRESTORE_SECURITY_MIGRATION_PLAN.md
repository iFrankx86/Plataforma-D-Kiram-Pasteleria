# Plan de Migración de Seguridad y Control de Acceso Basado en Roles (RBAC) para Firestore

**Proyecto:** D'Kiram Pastelería  
**Base de Datos Firestore:** `ai-studio-dkirampastelera-665e9d89-8a5f-4239-b603-233a5ae6e4e6`  
**Superadministrador Bootstrap:** `paola123lope@gmail.com`  
**Fecha:** 2026-10-03  

---

## 1. Resumen Ejecutivo & Modelo de Amenazas

Este plan establece una arquitectura de seguridad **Zero-Trust** y **Control de Acceso Basado en Roles (RBAC)** en Google Cloud Firestore para el sistema de punto de venta y gestión de pastelería D'Kiram.

### Principios Fundamentales
1. **Separación de Responsabilidades (SoD):** Los cajeros no deben alterar el catálogo de productos ni los datos de empleados. El personal de inventario no debe manipular dinero de caja ni registrar ventas. El administrador conserva gobernanza total y capacidad de auditoría.
2. **Inmutabilidad de Registros Críticos:** Las ventas (`sales`), los movimientos de efectivo (`cashMovements`), el kárdex (`inventoryMovements`) y las pistas de auditoría (`auditLogs`) están blindados contra eliminación (`allow delete: if false`).
3. **Validación Estricta de Esquemas (Anti-Update-Gap):** Toda operación de escritura es validada antes de persistir (tipos numéricos no negativos, longitud de cadenas, enumeraciones válidas y ausencia de valores corruptos).
4. **Bootstrap Seguro de Superadministrador:** El correo electrónico del propietario de la tienda (`paola123lope@gmail.com`) cuenta con privilegios de superadministrador garantizados a nivel de motor de reglas.
5. **Compatibilidad con Terminal Kiosco / Mostrador:** Se garantiza una transición fluida permitiendo la validación estricta de esquemas tanto para usuarios autenticados vía Firebase Auth como en sesiones de terminal de venta local.

---

## 2. Matriz de Permisos por Rol (RBAC)

| Colección | Rol `ADMIN` | Rol `CAJERO` | Rol `INVENTARIO` | Restricción Clave |
| :--- | :---: | :---: | :---: | :--- |
| **`products`** | Read, Create, Update, Delete | Read | Read, Create, Update | Cajero solo consulta para vender; Inventario ajusta stock y precios |
| **`categories`** | Read, Create, Update, Delete | Read | Read, Create, Update | Categorías protegidas contra borrado no autorizado |
| **`sales`** | Read, Create, Update (Anular) | Read, Create, Update (Anular) | Read | Solo ventas válidas; **Eliminación prohibida** (`delete: false`) |
| **`cashRegisters`** | Read, Create, Update | Read, Create, Update | Read | Sesiones de caja; apertura y arqueo de cierre; **No eliminable** |
| **`cashMovements`** | Read, Create, Update | Read, Create, Update | Read | Movimientos de caja (ingreso/egreso/venta); **No eliminable** |
| **`inventoryMovements`** | Read, Create, Update | Read, Create (Ventas) | Read, Create, Update (Kárdex) | Kárdex completo; **No eliminable** |
| **`employees`** | Read, Create, Update, Delete | Read | Read | Solo Administrador puede dar de alta o baja personal |
| **`shifts`** | Read, Create, Update, Delete | Read | Read | Asignación y programación de horarios |
| **`auditLogs`** | Read, Create | Read, Create | Read, Create | Registro inmutable de eventos; **No modificable ni eliminable** |
| **`test`** | Read | Read | Read | Monitoreo y comprobación de salud de conexión |

---

## 3. Definición de Funciones de Seguridad en `firestore.rules`

### 3.1 Identificación y Bootstrap
```javascript
function isSignedIn() {
  return request.auth != null;
}

function isSuperAdmin() {
  return isSignedIn() && request.auth.token.email == 'paola123lope@gmail.com';
}

function getUserRole() {
  return exists(/databases/$(database)/documents/employees/$(request.auth.uid))
    ? get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role
    : (exists(/databases/$(database)/documents/users/$(request.auth.uid))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : 'NONE');
}

function isAdmin() {
  return isSuperAdmin() || (isSignedIn() && (
    getUserRole() == 'ADMIN' ||
    exists(/databases/$(database)/documents/admins/$(request.auth.uid))
  ));
}

function isCajero() {
  return isAdmin() || (isSignedIn() && getUserRole() == 'CAJERO');
}

function isInventario() {
  return isAdmin() || (isSignedIn() && getUserRole() == 'INVENTARIO');
}
```

### 3.2 Validadores de Esquema
* `isValidId(id)`: Identificador no vacío con longitud `<= 128`.
* `isValidProduct(data)`: Nombre válido `<= 200` caracteres y precio de venta `>= 0`.
* `isValidCategory(data)`: Nombre no vacío.
* `isValidSale(data)`: Código correlativo, total `>= 0` y estado en `['CONFIRMADA', 'ANULADA', 'COMPLETADA']`.
* `isValidCashRegister(data)`: Fondo de apertura `>= 0`.
* `isValidCashMovement(data)`: Monto y tipo válido dentro de catálogo de movimientos de caja.
* `isValidInventoryMovement(data)`: Cantidad y tipo en `['ENTRADA', 'VENTA', 'SALIDA', 'AJUSTE', 'MERMA', 'DEVOLUCION']`.
* `isValidEmployee(data)`: Nombres y rol en `['ADMIN', 'CAJERO', 'INVENTARIO']`.
* `isValidShift(data)`: Empleado asignado y estado en `['PROGRAMADO', 'EN_CURSO', 'COMPLETADO', 'AUSENTE']`.
* `isValidAuditLog(data)`: Acción y entidad registrada.

---

## 4. Fases de Ejecución del Plan

### Fase 1: Sincronización del Blueprint
Asegurar que todas las colecciones y atributos en `firebase-blueprint.json` coinciden con los modelos de TypeScript.

### Fase 2: Redacción e Implementación de `firestore.rules`
Incorporación de la arquitectura RBAC completa en el archivo `firestore.rules`.

### Fase 3: Despliegue en la Nube
Ejecución de la herramienta `deploy_firebase` para compilar y desplegar las reglas en la base de datos `ai-studio-dkirampastelera-665e9d89-8a5f-4239-b603-233a5ae6e4e6`.

### Fase 4: Pruebas Automatizadas de Verificación
Ejecución de pruebas de lectura y escritura simulando:
1. Lectura de catálogos y kárdex.
2. Creación de ventas y movimientos de inventario tipo `VENTA`.
3. Intentos de violación de permisos (ej. eliminación de comprobantes de venta).
4. Verificación de salud y estabilidad del servidor en vivo.
