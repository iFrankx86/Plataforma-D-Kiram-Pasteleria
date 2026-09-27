import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryName, PaymentItem, PaymentMethodType, Product } from '../../types';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Check, 
  ArrowRight, 
  X, 
  QrCode, 
  DollarSign, 
  Smartphone, 
  Sparkles,
  Layers,
  ChevronRight,
  Receipt,
  Eye
} from 'lucide-react';

interface POSScreenProps {
  onGoToCash: () => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({ onGoToCash }) => {
  const { 
    products, 
    categories, 
    cart, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    cartDiscount, 
    setCartDiscount, 
    cartSubtotal, 
    cartTotal,
    confirmSale,
    currentCashRegister,
    currentUser,
    setCurrentUser,
    users
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cart Drawer / Modal for quick order summary & checkout (Accessible from top button and floating mobile bar)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Payment Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'SINGLE' | 'SPLIT'>('SINGLE');
  const [singleMethod, setSingleMethod] = useState<PaymentMethodType>('EFECTIVO');
  const [tenderedCash, setTenderedCash] = useState<string>('');

  // Split Payment state
  const [splitMethod1, setSplitMethod1] = useState<PaymentMethodType>('YAPE');
  const [splitAmount1, setSplitAmount1] = useState<string>('');
  const [splitMethod2, setSplitMethod2] = useState<PaymentMethodType>('EFECTIVO');
  const [splitAmount2, setSplitAmount2] = useState<string>('');
  const [splitCashTendered, setSplitCashTendered] = useState<string>('');

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Filter products
  const filteredProducts = products.filter(product => {
    if (!product.active) return false;
    const matchesCategory = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    const res = addToCart(product, 1);
    if (!res.success) {
      showToast(res.message || 'No se pudo agregar');
    }
  };

  const handleOpenCheckout = () => {
    if (!currentCashRegister) {
      showToast('⚠️ Debes abrir la caja antes de registrar ventas');
      return;
    }
    if (cart.length === 0) return;

    setCheckoutError(null);
    setPaymentMode('SINGLE');
    setSingleMethod('EFECTIVO');
    setTenderedCash(cartTotal.toFixed(2));
    
    // Default split values
    const half = (cartTotal / 2).toFixed(2);
    setSplitAmount1(half);
    setSplitAmount2((cartTotal - parseFloat(half)).toFixed(2));
    setSplitCashTendered('');
    
    // Close the cart drawer if open, and open payment modal
    setIsCartDrawerOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleConfirmCheckout = () => {
    setCheckoutError(null);

    let payments: PaymentItem[] = [];
    let cashGiven: number | undefined = undefined;
    let changeVal: number | undefined = undefined;

    if (paymentMode === 'SINGLE') {
      payments = [{ method: singleMethod, amount: cartTotal }];

      if (singleMethod === 'EFECTIVO') {
        const tenderedNum = parseFloat(tenderedCash) || 0;
        if (tenderedNum < cartTotal) {
          setCheckoutError(`El efectivo entregado (S/ ${tenderedNum.toFixed(2)}) es menor al total.`);
          return;
        }
        cashGiven = tenderedNum;
        changeVal = Math.max(0, tenderedNum - cartTotal);
      }
    } else {
      // Split payment
      const amt1 = parseFloat(splitAmount1) || 0;
      const amt2 = parseFloat(splitAmount2) || 0;
      const sum = Number((amt1 + amt2).toFixed(2));

      if (Math.abs(sum - cartTotal) > 0.01) {
        setCheckoutError(`La suma (S/ ${sum.toFixed(2)}) debe coincidir exactamente con el total de S/ ${cartTotal.toFixed(2)}.`);
        return;
      }

      payments = [
        { method: splitMethod1, amount: amt1 },
        { method: splitMethod2, amount: amt2 },
      ];

      // Check if any split part is Cash
      const cashPart = payments.find(p => p.method === 'EFECTIVO');
      if (cashPart) {
        if (splitCashTendered) {
          const tenderedNum = parseFloat(splitCashTendered);
          if (tenderedNum < cashPart.amount) {
            setCheckoutError(`El efectivo entregado para la parte en efectivo (S/ ${tenderedNum.toFixed(2)}) es menor a S/ ${cashPart.amount.toFixed(2)}`);
            return;
          }
          cashGiven = tenderedNum;
          changeVal = Math.max(0, tenderedNum - cashPart.amount);
        } else {
          cashGiven = cashPart.amount;
          changeVal = 0;
        }
      }
    }

    const res = confirmSale({
      payments,
      tenderedCash: cashGiven,
      change: changeVal,
    });

    if (res.success) {
      setIsCheckoutOpen(false);
    } else {
      setCheckoutError(res.error || 'Error al procesar la venta');
    }
  };

  // Quick cash buttons helper
  const handleQuickCash = (amount: number) => {
    setTenderedCash(amount.toFixed(2));
  };

  const singleTenderedNum = parseFloat(tenderedCash) || 0;
  const singleChange = Math.max(0, singleTenderedNum - cartTotal);

  // Cart Content Renderer (Used on Desktop Sidebar AND Mobile Drawer)
  const renderCartItemsAndSummary = () => (
    <div className="flex flex-col h-full">
      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100">
        {cart.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-stone-400 text-center p-4">
            <ShoppingCart className="w-10 h-10 stroke-[1.2] mb-2 text-stone-300" />
            <p className="text-xs font-semibold text-stone-700">Bandeja de venta vacía</p>
            <p className="text-[11px] text-stone-400 mt-1">
              Toca los postres del catálogo para agregarlos a la orden
            </p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.product.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] text-stone-500 font-mono">
                    S/ {item.product.salePrice.toFixed(2)} c/u
                  </div>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold shadow-xs transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-stone-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold shadow-xs transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right w-16 shrink-0">
                <div className="font-bold text-xs font-serif-display text-stone-900">
                  S/ {(item.product.salePrice * item.quantity).toFixed(2)}
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-stone-300 hover:text-rose-600 transition p-1 shrink-0"
                title="Quitar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Action */}
      <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3 shrink-0">
        
        {/* Discount field */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-600 font-medium">Descuento autorizado:</span>
          <div className="flex items-center gap-1">
            <span className="text-stone-400 font-bold">S/</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={cartDiscount || ''}
              onChange={e => setCartDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-20 px-2 py-1 bg-white border border-stone-300 rounded-lg text-right font-bold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-stone-500 pt-1">
          <span>Subtotal:</span>
          <span className="font-semibold text-stone-700">S/ {cartSubtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
          <span className="font-bold text-xs sm:text-sm text-stone-900">Total a Pagar:</span>
          <span className="font-serif-display font-extrabold text-2xl text-amber-700">
            S/ {cartTotal.toFixed(2)}
          </span>
        </div>

        {/* Action button */}
        {currentCashRegister ? (
          <button
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition ${
              cart.length === 0
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:scale-[0.99]'
            }`}
          >
            <span>Proceder a Cobrar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onGoToCash}
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Abrir Caja para Cobrar</span>
          </button>
        )}

      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-rose-900/90 text-rose-100 border border-rose-700 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cash Warning Banner if Closed */}
      {!currentCashRegister && (
        <div className="mb-4 sm:mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-stone-900 text-sm">Caja Cerrada</div>
              <p className="text-xs text-stone-600">
                Para registrar ventas es necesario realizar la apertura de turno de caja con su fondo inicial.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToCash}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shrink-0 shadow-xs"
          >
            Abrir Caja Ahora →
          </button>
        </div>
      )}

      {/* MAIN LAYOUT: Side-by-side on desktop (al lado), never underneath on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / MAIN COLUMN: Product Catalog (12 cols on mobile, 7-8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
          
          {/* Top Search & Cart Trigger Bar */}
          <div className="flex items-center gap-2.5 bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, SKU o ingrediente..."
                className="w-full pl-9 pr-7 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
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

            {/* DEDICATED CART BUTTON (BUTTON DEL CARRITO) */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0 active:scale-[0.98]"
              title="Ver resumen de compra y cobrar"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito ({cartItemCount})</span>
              {cartTotal > 0 && (
                <span className="hidden sm:inline bg-amber-800 text-amber-100 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  S/ {cartTotal.toFixed(2)}
                </span>
              )}
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              Todos los Productos ({products.filter(p => p.active).length})
            </button>
            {categories.filter(c => c.active).map(cat => {
              const count = products.filter(p => p.active && p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredProducts.map(product => {
              const inCart = cart.find(ci => ci.product.id === product.id);
              const isOutOfStock = product.stockCurrent <= 0;
              const isLowStock = product.stockCurrent > 0 && product.stockCurrent <= product.stockMinimum;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`group relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isOutOfStock ? 'opacity-50 cursor-not-allowed bg-stone-100' : 'hover:border-amber-400'
                  }`}
                >
                  {/* Image */}
                  <div>
                    <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      
                      {/* Stock Pill Badge */}
                      <div className="absolute top-2 right-2">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-xs">
                            Agotado
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] shadow-xs">
                            Quedan {product.stockCurrent}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-stone-900/75 text-stone-200 font-medium text-[10px] backdrop-blur-xs">
                            {product.stockCurrent} {product.unit}s
                          </span>
                        )}
                      </div>

                      {/* Cart counter indicator */}
                      {inCart && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-white animate-in zoom-in-75">
                          {inCart.quantity}
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 sm:p-3">
                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-amber-800 transition">
                        {product.name}
                      </h3>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {product.sku}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 pt-0">
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-stone-400">Precio</div>
                        <div className="font-serif-display font-bold text-stone-900 text-sm sm:text-base">
                          S/ {product.salePrice.toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) handleAddToCart(product);
                        }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition shadow-xs ${
                          isOutOfStock
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-amber-100 hover:bg-amber-600 text-amber-900 hover:text-white'
                        }`}
                        title="Agregar al pedido"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: POS Cart Panel SIDE-BY-SIDE ON DESKTOP ONLY (`hidden lg:flex`) */}
        {/* On mobile screens, it is NOT rendered underneath! It opens via the Cart Button */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-stone-200 shadow-sm flex-col sticky top-28 overflow-hidden min-h-[520px] max-h-[calc(100vh-140px)]">
          
          {/* Cart Header */}
          <div className="p-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-bold text-sm text-stone-100">Orden de Venta</h2>
                <span className="text-[11px] text-stone-400">
                  {cartItemCount} ítem(s) en bandeja
                </span>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-stone-400 hover:text-rose-400 p-1 rounded transition text-xs flex items-center gap-1"
                title="Vaciar orden"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[10px]">Vaciar</span>
              </button>
            )}
          </div>

          {/* Vendedor / Responsable en mostrador */}
          <div className="px-3.5 py-1.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[11px] text-stone-500 font-medium">Vendedor:</span>
              <span className="font-bold text-stone-800 truncate">{currentUser.name}</span>
            </div>
            {users.filter(u => u.role === 'CAJERO').length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const sellers = users.filter(u => u.role === 'CAJERO');
                  const nextSeller = sellers.find(s => s.id !== currentUser.id) || sellers[0];
                  setCurrentUser(nextSeller);
                  showToast(`Vendedor cambiado a: ${nextSeller.name}`);
                }}
                className="text-[10px] text-amber-700 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md transition shadow-2xs"
                title="Alternar vendedor de turno"
              >
                Cambiar a {users.filter(u => u.role === 'CAJERO').find(s => s.id !== currentUser.id)?.name.split(' ')[0] || 'Compañero'}
              </button>
            )}
          </div>

          {/* Cart Items and Checkout Footer */}
          {renderCartItemsAndSummary()}

        </div>

      </div>

      {/* ============================================================ */}
      {/* FLOATING ACTION BAR ON MOBILE (WHEN CART HAS ITEMS)          */}
      {/* ============================================================ */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-3 right-3 z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-stone-900 text-white p-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center justify-between gap-3">
            <div 
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-stone-400 font-medium">
                  {cartItemCount} producto(s) seleccionados
                </div>
                <div className="font-serif-display font-extrabold text-base text-amber-400">
                  S/ {cartTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition"
              >
                Ver Resumen
              </button>
              <button
                onClick={handleOpenCheckout}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 active:scale-95"
              >
                <span>Cobrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DRAWER / MODAL: RESUMEN DE COMPRA & CARRITO (ACCESO RÁPIDO)  */}
      {/* ============================================================ */}
      {isCartDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsCartDrawerOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-stone-100">Resumen de Compra</h3>
                  <span className="text-[11px] text-stone-400">
                    {cartItemCount} ítem(s) en orden
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-stone-400 hover:text-rose-400 px-2 py-1 rounded text-xs"
                    title="Vaciar"
                  >
                    Vaciar
                  </button>
                )}
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body & Summary */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {renderCartItemsAndSummary()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CHECKOUT MODAL: Single or Split Payment (Section 9 & 35)    */}
      {/* ============================================================ */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-amber-100">Cobro de Venta</h3>
                <p className="text-[11px] text-stone-400">
                  Atendido por: <strong className="text-amber-300 font-semibold">{currentUser.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Banner */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 text-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-900">
                Monto Total a Cobrar
              </span>
              <div className="font-serif-display font-extrabold text-3xl text-amber-700 mt-0.5">
                S/ {cartTotal.toFixed(2)}
              </div>
            </div>

            {/* Error Message */}
            {checkoutError && (
              <div className="m-4 mb-0 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="p-4 sm:p-5 space-y-4">
              
              {/* Payment Mode Selector: Normal vs Split */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMode('SINGLE')}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    paymentMode === 'SINGLE'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Pago Único (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('SPLIT')}
                  className={`py-2 text-xs font-semibold rounded-lg transition ${
                    paymentMode === 'SPLIT'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  🔀 Pago Dividido / Mixto
                </button>
              </div>

              {/* SINGLE PAYMENT MODE */}
              {paymentMode === 'SINGLE' && (
                <div className="space-y-4">
                  {/* Method Buttons: EFECTIVO, YAPE, PLIN */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleMethod('EFECTIVO')}
                      className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1.5 ${
                        singleMethod === 'EFECTIVO'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <DollarSign className={`w-5 h-5 ${singleMethod === 'EFECTIVO' ? 'text-emerald-600' : 'text-stone-400'}`} />
                      <span className="text-xs font-bold">Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleMethod('YAPE')}
                      className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1.5 ${
                        singleMethod === 'YAPE'
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <Smartphone className={`w-5 h-5 ${singleMethod === 'YAPE' ? 'text-purple-600' : 'text-stone-400'}`} />
                      <span className="text-xs font-bold">Yape</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleMethod('PLIN')}
                      className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1.5 ${
                        singleMethod === 'PLIN'
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-900 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <Smartphone className={`w-5 h-5 ${singleMethod === 'PLIN' ? 'text-cyan-600' : 'text-stone-400'}`} />
                      <span className="text-xs font-bold">Plin</span>
                    </button>
                  </div>

                  {/* Cash Specific Controls */}
                  {singleMethod === 'EFECTIVO' ? (
                    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-600 font-medium">Efectivo Entregado por Cliente:</span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">S/</span>
                          <input
                            type="number"
                            step="0.5"
                            value={tenderedCash}
                            onChange={e => setTenderedCash(e.target.value)}
                            className="w-28 pl-7 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl font-bold text-sm text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Quick Tender Bills in Peruvian Soles */}
                      <div className="flex gap-1.5 overflow-x-auto pt-1">
                        <button
                          type="button"
                          onClick={() => handleQuickCash(cartTotal)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-[11px] font-semibold text-stone-700 whitespace-nowrap"
                        >
                          Exacto (S/{cartTotal.toFixed(2)})
                        </button>
                        {[20, 50, 100].map(bill => (
                          <button
                            key={bill}
                            type="button"
                            onClick={() => handleQuickCash(bill)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-[11px] font-semibold text-stone-700 whitespace-nowrap"
                          >
                            S/ {bill}.00
                          </button>
                        ))}
                      </div>

                      {/* Change calculation */}
                      <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900">Vuelto a entregar:</span>
                        <span className="font-serif-display font-black text-lg text-emerald-800">
                          S/ {singleChange.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Digital Payment Info (Yape or Plin) */
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0">
                        <QrCode className="w-7 h-7 text-stone-700" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-stone-900">
                          Transferencia digital {singleMethod}
                        </div>
                        <div className="text-stone-600 font-mono text-[11px]">
                          Número: 987 654 321
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Titular: D' Kiram Pastelería S.A.C.
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* SPLIT PAYMENT MODE (Section 9: Caso excepcional Yape S/20 + Efectivo S/5.50) */}
              {paymentMode === 'SPLIT' && (
                <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div className="text-xs font-bold text-stone-800 mb-1">
                    Dividir Total (S/ {cartTotal.toFixed(2)}) entre dos métodos:
                  </div>

                  {/* Part 1 */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700">Primer Método:</span>
                      <select
                        value={splitMethod1}
                        onChange={e => setSplitMethod1(e.target.value as PaymentMethodType)}
                        className="text-xs font-bold px-2 py-1 border border-stone-300 rounded-lg bg-stone-50"
                      >
                        <option value="YAPE">🟣 Yape</option>
                        <option value="PLIN">🔵 Plin</option>
                        <option value="EFECTIVO">💵 Efectivo</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500">Monto:</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">S/</span>
                        <input
                          type="number"
                          step="0.5"
                          value={splitAmount1}
                          onChange={e => {
                            const val = e.target.value;
                            setSplitAmount1(val);
                            const num = parseFloat(val) || 0;
                            setSplitAmount2(Math.max(0, cartTotal - num).toFixed(2));
                          }}
                          className="w-28 pl-7 pr-3 py-1 bg-stone-50 border border-stone-300 rounded-lg font-bold text-xs text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part 2 */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700">Segundo Método:</span>
                      <select
                        value={splitMethod2}
                        onChange={e => setSplitMethod2(e.target.value as PaymentMethodType)}
                        className="text-xs font-bold px-2 py-1 border border-stone-300 rounded-lg bg-stone-50"
                      >
                        <option value="EFECTIVO">💵 Efectivo</option>
                        <option value="YAPE">🟣 Yape</option>
                        <option value="PLIN">🔵 Plin</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500">Monto:</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">S/</span>
                        <input
                          type="number"
                          step="0.5"
                          value={splitAmount2}
                          onChange={e => {
                            const val = e.target.value;
                            setSplitAmount2(val);
                            const num = parseFloat(val) || 0;
                            setSplitAmount1(Math.max(0, cartTotal - num).toFixed(2));
                          }}
                          className="w-28 pl-7 pr-3 py-1 bg-stone-50 border border-stone-300 rounded-lg font-bold text-xs text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Split validation reminder */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-stone-500">Total asignado:</span>
                    <span className={`font-bold ${
                      Math.abs(((parseFloat(splitAmount1) || 0) + (parseFloat(splitAmount2) || 0)) - cartTotal) < 0.01
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}>
                      S/ {((parseFloat(splitAmount1) || 0) + (parseFloat(splitAmount2) || 0)).toFixed(2)} / S/ {cartTotal.toFixed(2)}
                    </span>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                className="flex-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Venta</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
