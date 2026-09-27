# 🍰 D'Kiram Pastelería — Sistema de Punto de Venta (POS) & Gestión Comercial

Sistema web integral de Punto de Venta (POS), control de caja con arqueo ciego, gestión de inventario de pastelería artesanal, catálogo con 131 productos y administración de colaboradores y turnos para **D'Kiram Pastelería**.

---

## 🌟 Características Principales

1. **Punto de Venta (POS) Rápido & Táctil**:
   - Catálogo visual interactivo organizado por categorías: Tortas, Postres, Kekes & Queques, Bocaditos, Bebidas y Accesorios.
   - Búsqueda en tiempo real por nombre, SKU o categoría.
   - Carrito persistente con cálculo automático de subtotales, descuentos y totales en Soles (S/).
   - Soporte para pagos únicos o combinados (Efectivo, Yape, Plin, Tarjeta).
   - Generación e impresión de ticket térmico oficial de venta con identificación del vendedor.

2. **Control de Caja & Arqueo**:
   - Apertura de caja con fondo inicial configurable.
   - Registro de ingresos y egresos de efectivo (compras menores, insumos, cambio).
   - Arqueo con desglose por billetes y monedas en Soles (S/ 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10).
   - Cálculo automático de descuadres (sobrantes / faltantes) y cierre oficial de turno.

3. **Catálogo & 131 Productos del Cuaderno**:
   - 131 referencias reales del cuaderno de operaciones cargadas e integradas al sistema.
   - Edición y creación ágil de nuevos productos con SKU, precios de costo, precios de venta, stock mínimo y unidades.

4. **Gestión de Personal & Roles (RBAC)**:
   - **Administración General**: Arsencia Osorio (`ADMIN`) — Acceso total a reportes, márgenes, personal y auditoría.
   - **Ventas & Mostrador**: Frank Lope y Zaori Sanchez (`CAJERO`) — Punto de venta, cobros, apertura y cierre de caja.
   - **Taller & Inventario**: Carlos Pomahuacre (`INVENTARIO`) — Control de existencias, recetas, lotes de producción y mermas.
   - Registro y programación de turnos de atención (Mañana, Tarde, Taller).

5. **Auditoría & Trazabilidad**:
   - Registro inmutable de cada acción (apertura de caja, ventas confirmadas, anulaciones con motivo y ajustes de inventario).

---

## 🚀 Pila Tecnológica (Tech Stack)

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconografía**: [Lucide React](https://lucide.dev/)

---

## 💻 Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) o [bun](https://bun.sh/)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TU_USUARIO/dkiram-pasteleria.git
cd dkiram-pasteleria
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 4. Compilar para Producción
```bash
npm run build
```

### 5. Validar Tipos (Lint)
```bash
npm run lint
```

---

## 👥 Equipo y Colaboradores Registrados

| Nombre | Rol | Cargo |
| :--- | :--- | :--- |
| **Frank Lope** | `CAJERO` | Vendedor & Cajero |
| **Zaori Sanchez** | `CAJERO` | Vendedora & Cajera |
| **Arsencia Osorio** | `ADMIN` | Administradora General |
| **Carlos Pomahuacre** | `INVENTARIO` | Encargado de Inventario & Producción |

---

## 📄 Licencia

Este proyecto está bajo los términos de uso interno y comercial de **D'Kiram Pastelería**.
