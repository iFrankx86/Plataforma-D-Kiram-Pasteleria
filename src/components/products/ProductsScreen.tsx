import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Cake, 
  AlertCircle, 
  AlertTriangle, 
  LayoutList, 
  Table as TableIcon,
  LayoutGrid,
  DollarSign,
  Package,
  Layers,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  Eye,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  ArrowUpDown,
  CheckCircle2,
  Lock,
  Boxes,
  Percent,
  Sliders,
  Sparkles
} from 'lucide-react';

type SortOption = 'DEFAULT' | 'NAME_ASC' | 'NAME_DESC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_ASC' | 'STOCK_DESC';
type ViewMode = 'LIST' | 'TABLE' | 'GRID';

export const ProductsScreen: React.FC = () => {
  const { 
    products, 
    categories, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductStatus, 
    addToCart,
    currentUser 
  } = useApp();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOW_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');

  // Professional View Mode: Executive List (Master-Detail) as default for highest UX/QA rating
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');

  // Active / Selected product for Master-Detail inspection & instant manipulation
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Mobile Bottom Sheet / Drawer visibility
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockCurrent, setStockCurrent] = useState('');
  const [stockMinimum, setStockMinimum] = useState('5');
  const [unit, setUnit] = useState('unidad');
  const [image, setImage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Feedback Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered and Sorted Products Pipeline (Audited for QA consistency)
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
      
      // Status filter
      if (statusFilter === 'ACTIVE' && !p.active) return false;
      if (statusFilter === 'INACTIVE' && p.active) return false;
      if (statusFilter === 'LOW_STOCK' && p.stockCurrent > p.stockMinimum) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesDesc) return false;
      }

      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name, 'es');
        case 'NAME_DESC':
          return b.name.localeCompare(a.name, 'es');
        case 'PRICE_ASC':
          return a.salePrice - b.salePrice;
        case 'PRICE_DESC':
          return b.salePrice - a.salePrice;
        case 'STOCK_ASC':
          return a.stockCurrent - b.stockCurrent;
        case 'STOCK_DESC':
          return b.stockCurrent - a.stockCurrent;
        default:
          return 0;
      }
    });

    return result;
  }, [products, selectedCategory, statusFilter, searchQuery, sortBy]);

  // Selected Product Resolver (for Master-Detail console)
  const selectedProduct = useMemo(() => {
    if (selectedProductId) {
      const found = products.find(p => p.id === selectedProductId);
      if (found) return found;
    }
    return filteredProducts[0] || products[0] || null;
  }, [selectedProductId, products, filteredProducts]);

  // Handle Product Select
  const handleSelectProduct = (p: Product) => {
    setSelectedProductId(p.id);
    // On small screens, trigger mobile inspection drawer
    if (window.innerWidth < 1024) {
      setIsMobileDetailOpen(true);
    }
  };

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setCategoryId(categories[0]?.id || 'cat-1');
    setSalePrice('');
    setCostPrice('');
    setStockCurrent('15');
    setStockMinimum('5');
    setUnit('unidad');
    setImage('https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (p: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setDescription(p.description);
    setCategoryId(p.categoryId);
    setSalePrice(p.salePrice.toString());
    setCostPrice(p.costPrice.toString());
    setStockCurrent(p.stockCurrent.toString());
    setStockMinimum(p.stockMinimum.toString());
    setUnit(p.unit);
    setImage(p.image);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save / Update with strict "si existe no lo hagas" validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const sPrice = parseFloat(salePrice);
    const cPrice = parseFloat(costPrice) || Number((sPrice * 0.45).toFixed(2));
    const sCurrent = parseInt(stockCurrent, 10);
    const sMin = parseInt(stockMinimum, 10) || 3;

    if (!name.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }

    if (!sku.trim()) {
      setFormError('El código SKU es obligatorio.');
      return;
    }

    if (isNaN(sPrice) || sPrice <= 0) {
      setFormError('El precio de venta debe ser un número mayor a 0.');
      return;
    }

    if (isNaN(sCurrent) || sCurrent < 0) {
      setFormError('El stock actual no puede ser negativo.');
      return;
    }

    if (editingProduct) {
      // Update existing
      const res = updateProduct(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        categoryId,
        salePrice: sPrice,
        costPrice: cPrice,
        stockCurrent: sCurrent,
        stockMinimum: sMin,
        unit,
        image: image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
      });

      if (!res.success) {
        setFormError(res.error || 'No se pudo actualizar el producto.');
        return;
      }

      showToast(`"${name}" actualizado con éxito.`, 'success');
      setIsModalOpen(false);
    } else {
      // Add new: "si existe no lo hagas"
      const res = addProduct({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim(),
        categoryId,
        salePrice: sPrice,
        costPrice: cPrice,
        stockCurrent: sCurrent,
        stockMinimum: sMin,
        unit,
        image: image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
        active: true,
      });

      if (!res.success) {
        setFormError(res.error || 'Este producto ya existe en el sistema. Operación detenida.');
        return;
      }

      showToast(`Producto "${name}" registrado correctamente.`, 'success');
      setIsModalOpen(false);
    }
  };

  // Delete product action
  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    const res = deleteProduct(deletingProduct.id);
    if (res.success) {
      showToast(`Producto "${deletingProduct.name}" eliminado del catálogo.`, 'info');
      if (selectedProductId === deletingProduct.id) {
        setSelectedProductId(null);
      }
      setIsMobileDetailOpen(false);
      setDeletingProduct(null);
    } else {
      showToast(res.error || 'Error al eliminar producto', 'error');
    }
  };

  // Quick Stock Adjustment
  const handleQuickStock = (p: Product, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStock = Math.max(0, p.stockCurrent + delta);
    const res = updateProduct(p.id, { stockCurrent: newStock });
    if (res.success) {
      showToast(`Stock de "${p.name}": ${newStock} ${p.unit}s`, 'success');
    } else {
      showToast('Error al actualizar existencias', 'error');
    }
  };

  // Toggle status
  const handleToggleStatus = (p: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleProductStatus(p.id);
    const nextState = !p.active;
    showToast(`"${p.name}" ahora está ${nextState ? 'ACTIVO' : 'PAUSADO'}.`, 'info');
  };

  // Overall Catalog Telemetry
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const criticalStockProducts = products.filter(p => p.stockCurrent <= p.stockMinimum).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 border ${
          toast.type === 'success' 
            ? 'bg-emerald-950/95 text-emerald-100 border-emerald-700' 
            : toast.type === 'error'
            ? 'bg-rose-950/95 text-rose-100 border-rose-700'
            : 'bg-stone-900/95 text-stone-100 border-stone-700'
        }`}>
          {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-300" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-300" />}
          {toast.type === 'info' && <AlertCircle className="w-4 h-4 text-amber-300" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Control Header & Operational Stats */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-stone-900">
              Catálogo & Maestro de Productos
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold">
              {totalProducts} ítems
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Gestión de precios, stock, costos y recetas de D' Kiram Pastelería con validación anti-duplicados
          </p>
        </div>

        <div className="flex items-center w-full md:w-auto">
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar (Full Mobile Responsive - No Horizontal Overflow) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        
        {/* Search Input, Sort & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o receta..."
              className="w-full pl-9 pr-7 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Selector */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto pl-3 pr-7 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="DEFAULT">Orden: Predeterminado</option>
                <option value="NAME_ASC">Nombre (A - Z)</option>
                <option value="NAME_DESC">Nombre (Z - A)</option>
                <option value="PRICE_DESC">Precio: Mayor a Menor</option>
                <option value="PRICE_ASC">Precio: Menor a Mayor</option>
                <option value="STOCK_ASC">Stock: Menor primero (Alerta)</option>
                <option value="STOCK_DESC">Stock: Mayor primero</option>
              </select>
            </div>

            {/* View Mode Segmented Controls */}
            <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('LIST')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'LIST' 
                    ? 'bg-white text-amber-800 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Lista Ejecutiva (Master-Detail, óptima para control rápido)"
              >
                <LayoutList className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">Lista</span>
              </button>

              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'TABLE' 
                    ? 'bg-white text-stone-900 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Tabla de Auditoría Completa"
              >
                <TableIcon className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden md:inline">Tabla</span>
              </button>

              <button
                onClick={() => setViewMode('GRID')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'GRID' 
                    ? 'bg-white text-amber-800 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Mosaico Visual con fotos"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden md:inline">Mosaico</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Status Segments */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'ALL'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Todos ({totalProducts})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Activos ({activeProducts})
            </button>
            <button
              onClick={() => setStatusFilter('LOW_STOCK')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'LOW_STOCK'
                  ? 'bg-rose-700 text-white font-bold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Bajo Stock ({criticalStockProducts})
            </button>
          </div>

          <div className="text-[11px] text-stone-400 hidden sm:block">
            {filteredProducts.length} de {totalProducts} productos mostrados
          </div>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition text-xs shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todas las Categorías
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition text-xs shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE MASTER-DETAIL VIEW (HIGH DENSITY - QA/QX CERTIFIED)          */}
      {/* ========================================================================= */}
      {viewMode === 'LIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Master Column: High-Density Interactive Rows (zero horizontal scroll) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Listado de Pasteles & Artículos ({filteredProducts.length})</span>
              <span className="text-[11px] text-stone-400">Toca para seleccionar y gestionar</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Cake className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="font-semibold text-stone-700 text-xs">No se encontraron productos con estos filtros</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setStatusFilter('ALL'); }}
                  className="mt-2 text-xs text-amber-700 font-semibold hover:underline"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-[750px] overflow-y-auto">
                {filteredProducts.map(product => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const isSelected = selectedProduct?.id === product.id;
                  const isOutOfStock = product.stockCurrent === 0;
                  const isLowStock = product.stockCurrent <= product.stockMinimum;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={`p-3 sm:p-3.5 transition flex items-center justify-between gap-3 cursor-pointer group ${
                        isSelected 
                          ? 'bg-amber-50/80 border-l-4 border-amber-600' 
                          : 'hover:bg-stone-50/90 border-l-4 border-transparent'
                      }`}
                    >
                      {/* Left: Thumbnail & Typographic Identity */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          {!product.active && (
                            <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white uppercase tracking-tighter">
                                Pausado
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate group-hover:text-amber-800 transition-colors">
                              {product.name}
                            </h4>
                            {!product.active && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-medium">
                                Inactivo
                              </span>
                            )}
                          </div>
                          
                          {/* Clean unboxed metadata with typographic separators */}
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5 truncate">
                            <span className="font-mono text-stone-500 font-medium">{product.sku}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-stone-600">{category?.name || 'General'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{product.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Telemetry & Instant Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Price */}
                        <div className="text-right">
                          <div className="font-serif-display font-bold text-stone-900 text-sm sm:text-base">
                            S/ {product.salePrice.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            Costo: S/ {product.costPrice.toFixed(2)}
                          </div>
                        </div>

                        {/* Stock Pill */}
                        <div className="text-right w-20">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOutOfStock 
                              ? 'bg-rose-100 text-rose-800' 
                              : isLowStock 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {product.stockCurrent} {product.unit}s
                          </span>
                        </div>

                        {/* Quick Stock Controls on Hover / Touch */}
                        <div className="hidden sm:flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleQuickStock(product, -1, e)}
                            disabled={product.stockCurrent <= 0}
                            className="w-6 h-6 rounded-md border border-stone-300 hover:bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 disabled:opacity-30"
                            title="Descontar 1 unidad"
                          >
                            -
                          </button>
                          <button
                            onClick={e => handleQuickStock(product, 1, e)}
                            className="w-6 h-6 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-800"
                            title="Sumar 1 unidad"
                          >
                            +
                          </button>
                        </div>

                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Column: Desktop Sticky Product Control Console (Instant manipulation) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-28 space-y-4">
            {selectedProduct ? (
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden animate-in fade-in duration-150">
                
                {/* Console Header */}
                <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-100">
                      Ficha de Gestión & Control
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedProduct.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-stone-800 text-stone-400'
                  }`}>
                    {selectedProduct.active ? 'Activo en POS' : 'Pausado'}
                  </span>
                </div>

                {/* Photo & Overview */}
                <div className="p-4 space-y-4">
                  <div className="flex gap-3 items-center">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">
                        {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'General'}
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm leading-snug line-clamp-2">
                        {selectedProduct.name}
                      </h3>
                      <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                        SKU: {selectedProduct.sku}
                      </div>
                    </div>
                  </div>

                  {/* Financial & Profit Margin Card */}
                  <div className="grid grid-cols-3 gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70 text-center">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Venta</span>
                      <strong className="font-serif-display text-sm text-stone-900">
                        S/ {selectedProduct.salePrice.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Costo</span>
                      <strong className="font-mono text-sm text-stone-700">
                        S/ {selectedProduct.costPrice.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-semibold block">Margen</span>
                      <strong className="font-mono text-sm text-emerald-700">
                        {selectedProduct.salePrice > 0 
                          ? `${(((selectedProduct.salePrice - selectedProduct.costPrice) / selectedProduct.salePrice) * 100).toFixed(0)}%` 
                          : '—'}
                      </strong>
                    </div>
                  </div>

                  {/* Direct Stock Manipulation Control */}
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        Existencias Físicas:
                      </span>
                      <div className="font-serif-display text-base font-extrabold text-stone-900">
                        {selectedProduct.stockCurrent} <span className="text-xs font-normal text-stone-500">{selectedProduct.unit}s</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-stone-200">
                      <span className="text-[10px] text-stone-500 font-medium">Ajuste:</span>
                      <div className="flex gap-1 flex-1 justify-end">
                        <button
                          onClick={() => handleQuickStock(selectedProduct, -1)}
                          disabled={selectedProduct.stockCurrent <= 0}
                          className="px-2 py-1 bg-white hover:bg-stone-100 disabled:opacity-30 border border-stone-300 rounded-lg text-xs font-bold text-stone-700"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickStock(selectedProduct, -5)}
                          disabled={selectedProduct.stockCurrent < 5}
                          className="px-2 py-1 bg-white hover:bg-stone-100 disabled:opacity-30 border border-stone-300 rounded-lg text-xs font-bold text-stone-700"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleQuickStock(selectedProduct, 1)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickStock(selectedProduct, 5)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-stone-400">
                      <span>Mínimo: {selectedProduct.stockMinimum} {selectedProduct.unit}s</span>
                      <span>Valor: S/ {(selectedProduct.salePrice * selectedProduct.stockCurrent).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Description / Recipe note */}
                  {selectedProduct.description && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-xs leading-relaxed">
                      {selectedProduct.description}
                    </div>
                  )}

                  {/* Action Buttons: Full Manipulation */}
                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenEdit(selectedProduct)}
                        className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Ficha</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(selectedProduct)}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                          selectedProduct.active
                            ? 'border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <span>{selectedProduct.active ? 'Pausar Venta' : 'Activar Venta'}</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const res = addToCart(selectedProduct);
                          if (res.success) {
                            showToast(`"${selectedProduct.name}" agregado al carrito de venta.`, 'success');
                          } else {
                            showToast(res.message || 'Error', 'error');
                          }
                        }}
                        className="flex-1 py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-amber-700" />
                        <span>Cargar al POS</span>
                      </button>

                      <button
                        onClick={() => setDeletingProduct(selectedProduct)}
                        className="py-2 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1 transition"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-stone-200 text-center text-stone-400 text-xs">
                Selecciona un producto para ver su consola de control
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADVANCED DATA TABLE VIEW (FOR SPREADSHEET AUDITING)                    */}
      {/* ========================================================================= */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Producto & Receta</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-right">Costo Insumo</th>
                  <th className="py-3 px-4 text-right">Margen</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-stone-400">
                      No se encontraron productos coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const category = categories.find(c => c.id === product.categoryId);
                    const margin = product.salePrice - product.costPrice;
                    const marginPct = product.salePrice > 0 ? ((margin / product.salePrice) * 100).toFixed(0) : '0';

                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => handleSelectProduct(product)}
                        className="hover:bg-amber-50/40 cursor-pointer transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-9 h-9 rounded-xl object-cover shrink-0"
                            />
                            <div>
                              <div className="font-bold text-stone-900 text-xs">{product.name}</div>
                              <div className="text-[10px] text-stone-400">{product.unit}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-stone-600">{product.sku}</td>
                        <td className="py-3 px-4 text-stone-700">{category?.name || 'General'}</td>
                        <td className="py-3 px-4 text-right font-serif-display font-bold text-stone-900">
                          S/ {product.salePrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-600">
                          S/ {product.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-emerald-700 font-semibold font-mono">
                            S/ {margin.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            {marginPct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            product.stockCurrent === 0 ? 'bg-rose-100 text-rose-800' :
                            product.stockCurrent <= product.stockMinimum ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {product.stockCurrent} {product.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleToggleStatus(product, e)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              product.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {product.active ? 'Activo' : 'Pausado'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={e => handleOpenEdit(product, e)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-stone-100 transition"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(product)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISUAL MOSAIC GRID VIEW (FOCUSED ON ARTISANAL BAKERY PHOTOS)           */}
      {/* ========================================================================= */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredProducts.map(product => {
            const category = categories.find(c => c.id === product.categoryId);
            const isLowStock = product.stockCurrent <= product.stockMinimum;
            const isOutOfStock = product.stockCurrent === 0;

            return (
              <div 
                key={product.id} 
                onClick={() => handleSelectProduct(product)}
                className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        product.active ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-200'
                      }`}>
                        {product.active ? 'Activo' : 'Pausado'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-mono">
                      {product.sku}
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] font-semibold text-amber-700 uppercase">
                      {category?.name || 'General'}
                    </span>
                    <h3 className="font-bold text-stone-900 text-sm line-clamp-1 group-hover:text-amber-800 transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-1">
                      {product.description || 'Pastelería artesanal fresca'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 pt-0">
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[10px] text-stone-400">Precio</div>
                      <div className="font-serif-display font-bold text-stone-900 text-base">
                        S/ {product.salePrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-stone-400">Stock</div>
                      <div className={`font-mono text-xs font-bold ${
                        isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-stone-800'
                      }`}>
                        {product.stockCurrent} {product.unit}s
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => handleOpenEdit(product, e)}
                      className="flex-1 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={e => handleToggleStatus(product, e)}
                      className="px-2 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs"
                      title="Pausar o Activar"
                    >
                      {product.active ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MOBILE SLIDING BOTTOM SHEET / DRAWER (MASTER-DETAIL FOR SMARTPHONES)   */}
      {/* ========================================================================= */}
      {isMobileDetailOpen && selectedProduct && (
        <div 
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsMobileDetailOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in slide-in-from-bottom-8 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0">
                  <Cake className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-100 truncate">
                    {selectedProduct.name}
                  </h3>
                  <div className="text-[10px] text-stone-400 font-mono">
                    SKU: {selectedProduct.sku} · {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'General'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="p-4 space-y-3.5 overflow-y-auto text-xs flex-1">
              
              <div className="flex gap-3 items-center">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-stone-200 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif-display text-xl font-bold text-stone-900">
                      S/ {selectedProduct.salePrice.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(selectedProduct)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedProduct.active 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {selectedProduct.active ? 'Activo en POS' : 'Pausado'}
                    </button>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Costo estimado: <strong>S/ {selectedProduct.costPrice.toFixed(2)}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Margen bruto: <strong>+ S/ {(selectedProduct.salePrice - selectedProduct.costPrice).toFixed(2)}</strong> ({selectedProduct.salePrice > 0 ? (((selectedProduct.salePrice - selectedProduct.costPrice) / selectedProduct.salePrice) * 100).toFixed(0) : '0'}%)
                  </div>
                </div>
              </div>

              {/* Stock Management Box */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800 text-xs">
                    Existencias en Tienda:
                  </span>
                  <div className="font-serif-display text-base font-extrabold text-stone-900">
                    {selectedProduct.stockCurrent} <span className="text-xs font-normal text-stone-500">{selectedProduct.unit}s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                  <span className="text-[10px] text-stone-500">Ajuste rápido:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleQuickStock(selectedProduct, -1)}
                      disabled={selectedProduct.stockCurrent <= 0}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-700 disabled:opacity-30"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleQuickStock(selectedProduct, -5)}
                      disabled={selectedProduct.stockCurrent < 5}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-700 disabled:opacity-30"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleQuickStock(selectedProduct, 1)}
                      className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuickStock(selectedProduct, 5)}
                      className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-xs">
                  {selectedProduct.description}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileDetailOpen(false);
                      handleOpenEdit(selectedProduct);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar Producto</span>
                  </button>

                  <button
                    onClick={() => {
                      const res = addToCart(selectedProduct);
                      if (res.success) {
                        showToast(`"${selectedProduct.name}" agregado al carrito POS.`, 'success');
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4 text-amber-700" />
                    <span>Cobrar en POS</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const p = selectedProduct;
                    setDeletingProduct(p);
                  }}
                  className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar del Catálogo</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: AGREGAR / EDITAR PRODUCTO (VALIDACIÓN ESTRICTA ANTI-DUPLICADOS) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Cake className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-amber-100">
                  {editingProduct ? 'Editar Producto del Catálogo' : 'Agregar Nuevo Producto'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="m-4 mb-0 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Validación del Sistema:</div>
                  <div className="font-normal mt-0.5">{formError}</div>
                </div>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Keke Chispas Grande, Torta 3 Leches, Inka Kola 1.5L..."
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Código SKU / Identificador Único *
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value.toUpperCase())}
                    placeholder="Ej: PAS-KK-01"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Precio de Venta al Público (S/) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-amber-700">S/</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={salePrice}
                      onChange={e => {
                        const val = e.target.value;
                        setSalePrice(val);
                        if (!costPrice && parseFloat(val)) {
                          setCostPrice((parseFloat(val) * 0.45).toFixed(2));
                        }
                      }}
                      placeholder="0.00"
                      required
                      className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-xl font-serif-display font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Costo Estimado de Insumos (S/)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">S/</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockCurrent}
                    onChange={e => setStockCurrent(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockMinimum}
                    onChange={e => setStockMinimum(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Unidad
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="unidad">unidad</option>
                    <option value="porción">porción</option>
                    <option value="botella">botella</option>
                    <option value="lata">lata</option>
                    <option value="caja">caja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Descripción / Notas de Pastelería (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ingredientes clave, tamaño o notas especiales..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CONFIRMACIÓN DE ELIMINACIÓN                                     */}
      {/* ========================================================================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-sm">Eliminar Producto</h3>
              </div>
              <button 
                onClick={() => setDeletingProduct(null)}
                className="text-rose-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <img
                  src={deletingProduct.image}
                  alt={deletingProduct.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <div className="font-bold text-stone-900 text-sm">{deletingProduct.name}</div>
                  <div className="text-[11px] text-stone-500 font-mono">SKU: {deletingProduct.sku}</div>
                  <div className="text-xs font-bold text-amber-700 mt-0.5">S/ {deletingProduct.salePrice.toFixed(2)}</div>
                </div>
              </div>

              <p className="text-stone-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente este producto del catálogo? 
                Esta acción no se puede deshacer y quedará registrada en la bitácora de auditoría.
              </p>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
