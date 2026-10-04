import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { 
  FileText, 
  Search, 
  Eye, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign, 
  Printer, 
  AlertTriangle,
  User,
  Clock,
  RotateCcw,
  Filter,
  Layers,
  Sparkles,
  Smartphone,
  Wallet
} from 'lucide-react';

export const SalesHistoryScreen: React.FC = () => {
  const { 
    sales, 
    voidSale, 
    setActiveReceiptSale, 
    currentUser,
    cashRegisters,
    users,
    employees
  } = useApp();

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMADA' | 'ANULADA'>('ALL');
  
  // Date filter
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Seller / Encargado filter
  const [selectedSeller, setSelectedSeller] = useState('ALL');

  // Turno / Caja filter
  const [selectedShiftId, setSelectedShiftId] = useState('ALL');

  // Void modal
  const [voidingSale, setVoidingSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  // Detail Modal
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  // Dynamic list of all sellers / encargados
  const sellerOptions = useMemo(() => {
    const names = new Set<string>();
    sales.forEach(s => {
      if (s.employeeName) names.add(s.employeeName.trim());
    });
    users.forEach(u => {
      if (u.name) names.add(u.name.trim());
    });
    employees.forEach(e => {
      const fullName = `${e.firstName} ${e.lastName}`.trim();
      if (fullName) names.add(fullName);
    });
    return Array.from(names).filter(Boolean).sort();
  }, [sales, users, employees]);

  // Turnos / Cash registers options
  const shiftOptions = useMemo(() => {
    return [...cashRegisters].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [cashRegisters]);

  // Calculated date strings for Peru time
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const weekStartStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }, []);

  const monthStartStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }, []);

  // Filtered Sales Logic
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && sale.status !== statusFilter) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = sale.code.toLowerCase().includes(q);
        const matchEmp = sale.employeeName.toLowerCase().includes(q);
        const matchItem = sale.items.some(i => i.productName.toLowerCase().includes(q));
        if (!matchCode && !matchEmp && !matchItem) return false;
      }

      // 3. Encargado / Vendedor Filter
      if (selectedSeller !== 'ALL') {
        if (sale.employeeName !== selectedSeller && sale.employeeId !== selectedSeller) {
          return false;
        }
      }

      // 4. Turno / Caja Filter
      if (selectedShiftId !== 'ALL') {
        if (sale.cashRegisterId !== selectedShiftId) {
          return false;
        }
      }

      // 5. Date Filter
      const saleDateStr = sale.createdAt ? sale.createdAt.split('T')[0] : '';
      if (dateFilterMode === 'TODAY') {
        if (saleDateStr !== todayStr) return false;
      } else if (dateFilterMode === 'YESTERDAY') {
        if (saleDateStr !== yesterdayStr) return false;
      } else if (dateFilterMode === 'THIS_WEEK') {
        if (saleDateStr < weekStartStr || saleDateStr > todayStr) return false;
      } else if (dateFilterMode === 'THIS_MONTH') {
        if (saleDateStr < monthStartStr || saleDateStr > todayStr) return false;
      } else if (dateFilterMode === 'CUSTOM') {
        if (customStartDate && saleDateStr < customStartDate) return false;
        if (customEndDate && saleDateStr > customEndDate) return false;
      }

      return true;
    });
  }, [
    sales,
    statusFilter,
    searchQuery,
    selectedSeller,
    selectedShiftId,
    dateFilterMode,
    todayStr,
    yesterdayStr,
    weekStartStr,
    monthStartStr,
    customStartDate,
    customEndDate
  ]);

  // Aggregate Metrics for Filtered Subset
  const metrics = useMemo(() => {
    const confirmed = filteredSales.filter(s => s.status === 'CONFIRMADA');
    const totalAmount = confirmed.reduce((acc, s) => acc + s.total, 0);
    const totalDiscounts = confirmed.reduce((acc, s) => acc + (s.discount || 0), 0);
    const avgTicket = confirmed.length > 0 ? totalAmount / confirmed.length : 0;
    
    let cashTotal = 0;
    let yapeTotal = 0;
    let plinTotal = 0;
    let cardTotal = 0;

    confirmed.forEach(s => {
      s.payments.forEach(p => {
        if (p.method === 'EFECTIVO') cashTotal += p.amount;
        else if (p.method === 'YAPE') yapeTotal += p.amount;
        else if (p.method === 'PLIN') plinTotal += p.amount;
        else if (p.method === 'TARJETA') cardTotal += p.amount;
      });
    });

    return {
      totalSalesCount: filteredSales.length,
      confirmedCount: confirmed.length,
      annulledCount: filteredSales.length - confirmed.length,
      totalAmount,
      totalDiscounts,
      avgTicket,
      cashTotal,
      yapeTotal,
      plinTotal,
      cardTotal,
    };
  }, [filteredSales]);

  const isFiltered = 
    statusFilter !== 'ALL' || 
    searchQuery.trim() !== '' || 
    selectedSeller !== 'ALL' || 
    selectedShiftId !== 'ALL' || 
    dateFilterMode !== 'ALL' || 
    customStartDate !== '' || 
    customEndDate !== '';

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setSearchQuery('');
    setSelectedSeller('ALL');
    setSelectedShiftId('ALL');
    setDateFilterMode('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleOpenVoidModal = (sale: Sale) => {
    setVoidingSale(sale);
    setVoidReason('');
    setVoidError(null);
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingSale) return;
    if (!voidReason.trim()) {
      setVoidError('Debes ingresar una razón válida para la anulación.');
      return;
    }

    const res = voidSale(voidingSale.id, voidReason);
    if (res.success) {
      setVoidingSale(null);
    } else {
      setVoidError(res.error || 'No se pudo anular la venta.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-stone-900">
              Historial de Ventas Realizadas
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              {filteredSales.length} {filteredSales.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Filtra por fecha, turno de caja, encargado (vendedor) y audita comprobantes
          </p>
        </div>

        {/* Global Clear Filters Button if any active */}
        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="cursor-pointer self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Row 1: Search & Date Quick Pills */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por ticket V-XXXXX, vendedor o producto..."
              className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition"
            />
          </div>

          {/* Quick Date Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDateFilterMode('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilterMode === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setDateFilterMode('TODAY')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilterMode === 'TODAY' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilterMode('YESTERDAY')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilterMode === 'YESTERDAY' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => setDateFilterMode('THIS_WEEK')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilterMode === 'THIS_WEEK' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setDateFilterMode('THIS_MONTH')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilterMode === 'THIS_MONTH' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setDateFilterMode('CUSTOM')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilterMode === 'CUSTOM' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMADA')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'CONFIRMADA' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setStatusFilter('ANULADA')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'ANULADA' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              Anuladas
            </button>
          </div>
        </div>

        {/* Row 2: Encargado / Vendedor, Turno de Caja & Rango de Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-stone-100">
          
          {/* Encargado (Vendedor) Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Encargado / Vendedor:</span>
            </label>
            <select
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="ALL">👤 Todos los encargados</option>
              {sellerOptions.map(seller => (
                <option key={seller} value={seller}>
                  {seller}
                </option>
              ))}
            </select>
          </div>

          {/* Turno / Sesión de Caja Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Turno / Sesión de Caja:</span>
            </label>
            <select
              value={selectedShiftId}
              onChange={e => setSelectedShiftId(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="ALL">📦 Todos los turnos de caja</option>
              {shiftOptions.map(shift => {
                const dateStr = new Date(shift.openedAt).toLocaleDateString('es-PE', { dateStyle: 'short' });
                const timeStr = new Date(shift.openedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                return (
                  <option key={shift.id} value={shift.id}>
                    {shift.code} • {shift.employeeName} ({dateStr} {timeStr} - {shift.status})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Custom Date Range Pickers (Active when dateFilterMode is CUSTOM or manual selection) */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Rango de Fecha (Desde - Hasta):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={e => {
                  setCustomStartDate(e.target.value);
                  setDateFilterMode('CUSTOM');
                }}
                className="w-1/2 py-1.5 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="text-stone-400 text-xs">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => {
                  setCustomEndDate(e.target.value);
                  setDateFilterMode('CUSTOM');
                }}
                className="w-1/2 py-1.5 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS FOR CURRENT FILTER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Facturado */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Total Facturado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-serif-display text-stone-900">
              S/ {metrics.totalAmount.toFixed(2)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {metrics.confirmedCount} ventas confirmadas
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Ticket Promedio</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-serif-display text-stone-900">
              S/ {metrics.avgTicket.toFixed(2)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              por comprobante
            </div>
          </div>
        </div>

        {/* Efectivo Físico */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Efectivo en Caja</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-serif-display text-emerald-700">
              S/ {metrics.cashTotal.toFixed(2)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              recaudado en efectivo
            </div>
          </div>
        </div>

        {/* Pagos Digitales (Yape + Plin + Tarjeta) */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Billeteras & Tarjeta</span>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-serif-display text-purple-700">
              S/ {(metrics.yapeTotal + metrics.plinTotal + metrics.cardTotal).toFixed(2)}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1.5">
              <span>Yape: S/ {metrics.yapeTotal.toFixed(2)}</span>
              <span>•</span>
              <span>Plin: S/ {metrics.plinTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Turno / Caja</th>
                <th className="py-3 px-4">Encargado (Vendedor)</th>
                <th className="py-3 px-4">Ítems Vendidos</th>
                <th className="py-3 px-4">Método de Pago</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <FileText className="w-8 h-8 stroke-[1.2] mx-auto mb-2 text-stone-300" />
                    <p className="font-semibold text-stone-600">No se encontraron ventas para este criterio</p>
                    <p className="text-[11px] text-stone-400 mt-1">Prueba cambiando o limpiando los filtros seleccionados</p>
                    {isFiltered && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 px-3 py-1 rounded-xl bg-amber-600 text-white text-xs font-semibold"
                      >
                        Ver todas las ventas
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const associatedRegister = cashRegisters.find(cr => cr.id === sale.cashRegisterId);

                  return (
                    <tr key={sale.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {sale.code}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                        <div>{new Date(sale.createdAt).toLocaleDateString('es-PE')}</div>
                        <div className="text-[10px] text-stone-400">
                          {new Date(sale.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-mono font-medium">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {associatedRegister ? associatedRegister.code : (sale.cashRegisterId || 'Turno previo')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{sale.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                        {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {sale.payments.map((p, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.method === 'EFECTIVO' ? 'bg-emerald-100 text-emerald-800' :
                                p.method === 'YAPE' ? 'bg-purple-100 text-purple-800' :
                                p.method === 'PLIN' ? 'bg-cyan-100 text-cyan-800' :
                                'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {p.method}: S/ {p.amount.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-serif-display font-bold text-sm text-stone-900">
                        S/ {sale.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'CONFIRMADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveReceiptSale(sale)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                            title="Ver o Reimprimir Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailSale(sale)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                            title="Ver Detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {sale.status === 'CONFIRMADA' && currentUser.role !== 'INVENTARIO' && (
                            <button
                              onClick={() => handleOpenVoidModal(sale)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Anular Venta"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
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

      {/* DETAIL MODAL */}
      {detailSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-100">Detalle de Venta {detailSale.code}</h3>
                <p className="text-[11px] text-stone-400">Atendido por {detailSale.employeeName}</p>
              </div>
              <button onClick={() => setDetailSale(null)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {detailSale.items.map(i => (
                  <div key={i.id} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-stone-800">{i.productName}</div>
                      <div className="text-[11px] text-stone-500">{i.quantity} x S/ {i.unitPrice.toFixed(2)}</div>
                    </div>
                    <div className="font-bold text-stone-900">S/ {i.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="bg-stone-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>S/ {detailSale.subtotal.toFixed(2)}</span>
                </div>
                {detailSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Descuento:</span>
                    <span>- S/ {detailSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-200">
                  <span>Total:</span>
                  <span>S/ {detailSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-stone-50 p-3 rounded-xl space-y-1 text-stone-700">
                <span className="font-semibold text-stone-800 block mb-1">Desglose de Pagos:</span>
                {detailSale.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>{p.method}:</span>
                    <span className="font-mono font-semibold">S/ {p.amount.toFixed(2)}</span>
                  </div>
                ))}
                {detailSale.tenderedCash !== undefined && detailSale.tenderedCash > 0 && (
                  <>
                    <div className="flex justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                      <span>Efectivo entregado:</span>
                      <span>S/ {detailSale.tenderedCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-emerald-700">
                      <span>Vuelto:</span>
                      <span>S/ {(detailSale.change || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {detailSale.status === 'ANULADA' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                  <strong>Motivo de Anulación:</strong> {detailSale.voidReason}
                </div>
              )}
            </div>
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setDetailSale(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANULACION MODAL (Section 26 & 48 of Informe Técnico) */}
      {voidingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="bg-rose-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-sm">Anular Venta {voidingSale.code}</h3>
              </div>
              <button onClick={() => setVoidingSale(null)} className="text-rose-200 hover:text-white cursor-pointer">✕</button>
            </div>

            {voidError && (
              <div className="p-3 m-4 mb-0 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {voidError}
              </div>
            )}

            <form onSubmit={handleConfirmVoid} className="p-5 space-y-4">
              <p className="text-xs text-stone-600">
                Al anular esta venta por <strong>S/ {voidingSale.total.toFixed(2)}</strong>:
              </p>
              <ul className="text-[11px] text-stone-500 space-y-1 list-disc pl-4">
                <li>Los productos se devolverán al inventario automáticamente.</li>
                <li>Si fue pagada en efectivo, se registrará la salida del dinero en la caja.</li>
                <li>La anulación quedará registrada en el módulo de auditoría.</li>
              </ul>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Motivo obligatorio de anulación:
                </label>
                <textarea
                  rows={2}
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  placeholder="Ej: Error de digitación, cliente canceló pedido..."
                  required
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setVoidingSale(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
