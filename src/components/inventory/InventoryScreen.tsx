import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, InventoryMovementType } from '../../types';
import { 
  Package, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { products, categories, inventoryMovements, addInventoryAdjustment, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'STOCK' | 'MOVEMENTS'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'ENTRADA' | 'MERMA' | 'AJUSTE'>('ENTRADA');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Filter low stock
  const lowStockProducts = products.filter(p => p.active && p.stockCurrent <= p.stockMinimum);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesQuery = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleOpenModal = (product: Product, type: 'ENTRADA' | 'MERMA' | 'AJUSTE' = 'ENTRADA') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setQuantityInput('');
    setReasonInput(type === 'ENTRADA' ? 'Lote de producción de taller' : '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setModalError(null);

    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty < (adjustType === 'AJUSTE' ? 0 : 1)) {
      setModalError('Ingresa una cantidad válida.');
      return;
    }
    if (!reasonInput.trim()) {
      setModalError('Debes ingresar una justificación o motivo.');
      return;
    }

    const res = addInventoryAdjustment({
      productId: selectedProduct.id,
      type: adjustType,
      quantity: qty,
      reason: reasonInput,
    });

    if (res.success) {
      setIsModalOpen(false);
    } else {
      setModalError(res.error || 'Error al actualizar inventario');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner: Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                Alerta de Stock Crítico: {lowStockProducts.length} producto(s) por debajo del mínimo
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Los siguientes ítems necesitan reposición urgente en vitrina o taller de pastelería:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {lowStockProducts.map(p => (
                  <span
                    key={p.id}
                    onClick={() => handleOpenModal(p, 'ENTRADA')}
                    className="cursor-pointer px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-300 border border-amber-400 text-amber-900 font-semibold text-[11px] flex items-center gap-1 transition"
                  >
                    <span>{p.name} ({p.stockCurrent} / min: {p.stockMinimum})</span>
                    <Plus className="w-3 h-3 text-amber-800" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'STOCK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Existencias Actuales</span>
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'MOVEMENTS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Kárdex & Movimientos ({inventoryMovements.length})</span>
          </button>
        </div>

        {activeTab === 'STOCK' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: STOCK & INVENTORY TABLE */}
      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Unidad</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-center">Stock Mínimo</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Nivel</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map(product => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const isOutOfStock = product.stockCurrent <= 0;
                  const isLow = product.stockCurrent > 0 && product.stockCurrent <= product.stockMinimum;

                  return (
                    <tr key={product.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                          />
                          <div>
                            <div className="font-bold text-stone-900">{product.name}</div>
                            <div className="text-[10px] text-stone-400 font-mono">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-medium">
                        {category?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500">
                        {product.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-serif-display font-bold text-stone-900">
                        S/ {product.salePrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500 font-mono">
                        {product.stockMinimum}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        <span className={isOutOfStock ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}>
                          {product.stockCurrent}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Agotado
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Bajo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Óptimo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(product, 'ENTRADA')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition flex items-center gap-1"
                            title="Entrada de producción / lote"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Entrada</span>
                          </button>
                          <button
                            onClick={() => handleOpenModal(product, 'MERMA')}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition"
                            title="Registrar merma o daño"
                          >
                            Merma
                          </button>
                          <button
                            onClick={() => handleOpenModal(product, 'AJUSTE')}
                            className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition"
                            title="Ajuste físico de stock"
                          >
                            Ajuste
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KARDEX & AUDITED MOVEMENTS */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Fecha/Hora</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Tipo de Movimiento</th>
                  <th className="py-3 px-4 text-center">Antes</th>
                  <th className="py-3 px-4 text-center">Variación</th>
                  <th className="py-3 px-4 text-center">Después</th>
                  <th className="py-3 px-4">Motivo / Documento</th>
                  <th className="py-3 px-4">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventoryMovements.map(mov => {
                  const isAdd = mov.type === 'ENTRADA' || mov.type === 'DEVOLUCION';
                  return (
                    <tr key={mov.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                        {new Date(mov.createdAt).toLocaleDateString('es-PE')} {new Date(mov.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {mov.productName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          mov.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' :
                          mov.type === 'VENTA' ? 'bg-blue-100 text-blue-800' :
                          mov.type === 'MERMA' ? 'bg-rose-100 text-rose-800' :
                          mov.type === 'DEVOLUCION' ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-200 text-stone-800'
                        }`}>
                          {mov.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-stone-500 font-mono">
                        {mov.stockBefore}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono font-bold ${
                        isAdd ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {isAdd ? '+' : '-'}{mov.quantity}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">
                        {mov.stockAfter}
                      </td>
                      <td className="py-3 px-4 text-stone-700 max-w-xs truncate">
                        {mov.reason}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {mov.createdBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REGISTRAR ENTRADA, MERMA O AJUSTE                    */}
      {/* ============================================================ */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-100">
                  Movimiento de Inventario
                </h3>
                <p className="text-[11px] text-stone-400">
                  {selectedProduct.name} • Stock actual: {selectedProduct.stockCurrent} {selectedProduct.unit}s
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 m-4 mb-0 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('ENTRADA');
                      setReasonInput('Lote de producción de taller');
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                      adjustType === 'ENTRADA'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    + Entrada
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('MERMA');
                      setReasonInput('Producto caducado o muestra dañada');
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                      adjustType === 'MERMA'
                        ? 'border-rose-600 bg-rose-50 text-rose-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    - Merma
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('AJUSTE');
                      setReasonInput('Conteo físico de inventario');
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                      adjustType === 'AJUSTE'
                        ? 'border-amber-600 bg-amber-50 text-amber-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Recuento
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {adjustType === 'ENTRADA' ? `Cantidad a ingresar (${selectedProduct.unit}s):` :
                   adjustType === 'MERMA' ? `Cantidad de merma a descontar (${selectedProduct.unit}s):` :
                   `Nuevo stock total verificado (${selectedProduct.unit}s):`}
                </label>
                <input
                  type="number"
                  min={adjustType === 'AJUSTE' ? '0' : '1'}
                  value={quantityInput}
                  onChange={e => setQuantityInput(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-base font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Motivo / Observación Obligatoria:
                </label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder="Ej: Lote matutino de queques, rotura accidental..."
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  Guardar Movimiento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
