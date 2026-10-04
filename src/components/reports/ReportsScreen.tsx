import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Calendar, 
  Award, 
  ShoppingBag, 
  Clock, 
  AlertCircle,
  FileDown,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Smartphone,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { generateSalesReportPDF, generateAuditReportPDF } from '../../utils/pdfGenerator';

export const ReportsScreen: React.FC = () => {
  const { sales, products, categories, cashRegisters, auditLogs, currentUser } = useApp();

  // Active view: Sales metrics or Audit preview
  const [activeTab, setActiveTab] = useState<'SALES' | 'AUDIT'>('SALES');

  // Date Filter
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Export notification state
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Peruvian date calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
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

  // Filtered sales
  const validSales = useMemo(() => {
    return sales.filter(s => {
      if (s.status !== 'CONFIRMADA') return false;
      const sDate = s.createdAt.split('T')[0];
      if (dateFilter === 'TODAY') return sDate === todayStr;
      if (dateFilter === 'YESTERDAY') return sDate === yesterdayStr;
      if (dateFilter === 'THIS_WEEK') return sDate >= weekStartStr && sDate <= todayStr;
      if (dateFilter === 'THIS_MONTH') return sDate >= monthStartStr && sDate <= todayStr;
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && sDate < customStartDate) return false;
        if (customEndDate && sDate > customEndDate) return false;
        return true;
      }
      return true; // ALL
    });
  }, [sales, dateFilter, todayStr, yesterdayStr, weekStartStr, monthStartStr, customStartDate, customEndDate]);

  // All sales in period (including annulled, for full ledger)
  const allPeriodSales = useMemo(() => {
    return sales.filter(s => {
      const sDate = s.createdAt.split('T')[0];
      if (dateFilter === 'TODAY') return sDate === todayStr;
      if (dateFilter === 'YESTERDAY') return sDate === yesterdayStr;
      if (dateFilter === 'THIS_WEEK') return sDate >= weekStartStr && sDate <= todayStr;
      if (dateFilter === 'THIS_MONTH') return sDate >= monthStartStr && sDate <= todayStr;
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && sDate < customStartDate) return false;
        if (customEndDate && sDate > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [sales, dateFilter, todayStr, yesterdayStr, weekStartStr, monthStartStr, customStartDate, customEndDate]);

  // Filtered audit logs
  const periodAuditLogs = useMemo(() => {
    return auditLogs.filter(l => {
      const lDate = l.createdAt.split('T')[0];
      if (dateFilter === 'TODAY') return lDate === todayStr;
      if (dateFilter === 'YESTERDAY') return lDate === yesterdayStr;
      if (dateFilter === 'THIS_WEEK') return lDate >= weekStartStr && lDate <= todayStr;
      if (dateFilter === 'THIS_MONTH') return lDate >= monthStartStr && lDate <= todayStr;
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && lDate < customStartDate) return false;
        if (customEndDate && lDate > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [auditLogs, dateFilter, todayStr, yesterdayStr, weekStartStr, monthStartStr, customStartDate, customEndDate]);

  // Period label for human-friendly documents
  const periodLabel = useMemo(() => {
    if (dateFilter === 'TODAY') return `Ventas del Día (${todayStr})`;
    if (dateFilter === 'YESTERDAY') return `Día Anterior (${yesterdayStr})`;
    if (dateFilter === 'THIS_WEEK') return `Semana en Curso (${weekStartStr} al ${todayStr})`;
    if (dateFilter === 'THIS_MONTH') return `Mes en Curso (${monthStartStr} al ${todayStr})`;
    if (dateFilter === 'CUSTOM') return `Rango (${customStartDate || 'Inicio'} al ${customEndDate || 'Hoy'})`;
    return 'Histórico Completo';
  }, [dateFilter, todayStr, yesterdayStr, weekStartStr, monthStartStr, customStartDate, customEndDate]);

  // Financial Totals
  const totalRevenue = validSales.reduce((sum, s) => sum + s.total, 0);

  // Payment Breakdown
  const cashTotal = validSales.reduce((sum, s) => {
    const p = s.payments.find(pay => pay.method === 'EFECTIVO');
    return sum + (p ? p.amount : 0);
  }, 0);

  const yapeTotal = validSales.reduce((sum, s) => {
    const p = s.payments.find(pay => pay.method === 'YAPE');
    return sum + (p ? p.amount : 0);
  }, 0);

  const plinTotal = validSales.reduce((sum, s) => {
    const p = s.payments.find(pay => pay.method === 'PLIN');
    return sum + (p ? p.amount : 0);
  }, 0);

  const cardTotal = validSales.reduce((sum, s) => {
    const p = s.payments.find(pay => (pay.method as string) === 'TARJETA');
    return sum + (p ? p.amount : 0);
  }, 0);

  // Cost & Margins
  const totalCost = validSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, item) => iSum + (item.costPrice * item.quantity), 0);
  }, 0);

  const grossMargin = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? ((grossMargin / totalRevenue) * 100).toFixed(1) : '0';

  // Product sales aggregate
  const productSalesMap: { [id: string]: { name: string; quantity: number; revenue: number } } = {};
  validSales.forEach(s => {
    s.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += item.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const totalItemsSold = validSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0;
  }, 0);

  // Handlers for PDF Export
  const handleExportSalesReportPDF = () => {
    generateSalesReportPDF({
      sales: allPeriodSales,
      products,
      periodLabel,
      generatedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Administración D\'Kiram',
    });
    setExportSuccessMessage('Reporte Contable de Ventas exportado a PDF correctamente.');
    setTimeout(() => setExportSuccessMessage(null), 5000);
  };

  const handleExportAuditReportPDF = () => {
    generateAuditReportPDF({
      auditLogs: periodAuditLogs,
      cashRegisters,
      sales: allPeriodSales,
      periodLabel,
      generatedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Auditoría D\'Kiram',
    });
    setExportSuccessMessage('Informe de Auditoría y Control Interno exportado a PDF correctamente.');
    setTimeout(() => setExportSuccessMessage(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast Notification */}
      {exportSuccessMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header with PDF Export Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-stone-900">
              Reportes Contables & Auditoría
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              Documentos Oficiales
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Consolidado financiero, rentabilidad, arqueos de caja y exportación en formato PDF para contabilidad
          </p>
        </div>

        {/* Action Buttons for PDF Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportSalesReportPDF}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold shadow-xs transition"
            title="Exportar reporte de ventas y liquidación contable en PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar Ventas PDF</span>
          </button>

          <button
            onClick={handleExportAuditReportPDF}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 active:scale-95 text-white text-xs font-bold shadow-xs transition"
            title="Exportar informe de auditoría, control interno y turnos de caja en PDF"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Exportar Auditoría PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SALES')}
            className={`cursor-pointer px-4 py-1.5 rounded-lg transition ${
              activeTab === 'SALES' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Métricas de Ventas & Márgenes
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`cursor-pointer px-4 py-1.5 rounded-lg transition ${
              activeTab === 'AUDIT' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Bitácora de Auditoría ({periodAuditLogs.length})
          </button>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setDateFilter('TODAY')}
            className={`cursor-pointer px-3 py-1 rounded-lg transition ${
              dateFilter === 'TODAY' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDateFilter('YESTERDAY')}
            className={`cursor-pointer px-3 py-1 rounded-lg transition ${
              dateFilter === 'YESTERDAY' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ayer
          </button>
          <button
            onClick={() => setDateFilter('THIS_WEEK')}
            className={`cursor-pointer px-3 py-1 rounded-lg transition ${
              dateFilter === 'THIS_WEEK' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setDateFilter('THIS_MONTH')}
            className={`cursor-pointer px-3 py-1 rounded-lg transition ${
              dateFilter === 'THIS_MONTH' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setDateFilter('ALL')}
            className={`cursor-pointer px-3 py-1 rounded-lg transition ${
              dateFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setDateFilter('CUSTOM')}
            className={`cursor-pointer px-3 py-1 rounded-lg transition ${
              dateFilter === 'CUSTOM' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      {/* Custom Date Pickers (if CUSTOM selected) */}
      {dateFilter === 'CUSTOM' && (
        <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-amber-900">Seleccionar período específico:</span>
          <div className="flex items-center gap-2">
            <label className="text-stone-500">Desde:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="py-1 px-2.5 bg-white border border-stone-200 rounded-xl"
            />
            <label className="text-stone-500 ml-2">Hasta:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="py-1 px-2.5 bg-white border border-stone-200 rounded-xl"
            />
          </div>
        </div>
      )}

      {/* VIEW 1: SALES & MARGIN METRICS */}
      {activeTab === 'SALES' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Sales */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Ventas Facturadas</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="font-serif-display text-2xl font-bold text-stone-900 mt-2">
                S/ {totalRevenue.toFixed(2)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">{validSales.length} transacciones confirmadas</p>
            </div>

            {/* Gross Margin */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Margen Bruto Estimado</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-serif-display text-2xl font-bold text-emerald-700 mt-2">
                S/ {grossMargin.toFixed(2)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {marginPercentage}% de rentabilidad bruta
              </p>
            </div>

            {/* Cost of Goods */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Costo de Insumos (COGS)</span>
                <ShoppingBag className="w-4 h-4 text-stone-400" />
              </div>
              <div className="font-serif-display text-2xl font-bold text-stone-700 mt-2">
                S/ {totalCost.toFixed(2)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Costo total de materias primas</p>
            </div>

            {/* Items Sold */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Porciones / Unidades</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-serif-display text-2xl font-bold text-amber-800 mt-2">
                {totalItemsSold}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Postres y queques despachados</p>
            </div>

          </div>

          {/* Payment Methods & Top Products Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Payment Methods Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-600" />
                  <span>Participación por Método de Pago</span>
                </h3>
                <span className="text-[11px] text-stone-400">Total: S/ {totalRevenue.toFixed(2)}</span>
              </div>

              <div className="space-y-4 pt-2">
                {/* Efectivo */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      Efectivo Físico (Gaveta)
                    </span>
                    <span className="text-stone-900">
                      S/ {cashTotal.toFixed(2)} ({totalRevenue > 0 ? ((cashTotal / totalRevenue) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalRevenue > 0 ? (cashTotal / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Yape */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-purple-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                      Yape (Transferencia Móvil BCP)
                    </span>
                    <span className="text-stone-900">
                      S/ {yapeTotal.toFixed(2)} ({totalRevenue > 0 ? ((yapeTotal / totalRevenue) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalRevenue > 0 ? (yapeTotal / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Plin */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-cyan-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                      Plin (Interbancario)
                    </span>
                    <span className="text-stone-900">
                      S/ {plinTotal.toFixed(2)} ({totalRevenue > 0 ? ((plinTotal / totalRevenue) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalRevenue > 0 ? (plinTotal / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Tarjeta */}
                {cardTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-sky-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                        Tarjeta (Terminal POS)
                      </span>
                      <span className="text-stone-900">
                        S/ {cardTotal.toFixed(2)} ({totalRevenue > 0 ? ((cardTotal / totalRevenue) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalRevenue > 0 ? (cardTotal / totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top 5 Products */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Top 5 Postres Más Vendidos</span>
              </h3>

              <div className="divide-y divide-stone-100">
                {topProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    Aún no hay ventas para calcular el ranking
                  </div>
                ) : (
                  topProducts.map((p, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-stone-900">{p.name}</div>
                          <div className="text-[11px] text-stone-500">{p.quantity} unidades despachadas</div>
                        </div>
                      </div>
                      <div className="font-serif-display font-bold text-stone-900">
                        S/ {p.revenue.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: AUDIT TRAIL & INTERNAL CONTROL */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6">
          
          {/* Audit Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500">Eventos en Bitácora</span>
              <div className="text-xl font-bold font-serif-display text-stone-900 mt-2">
                {periodAuditLogs.length} acciones
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Trazabilidad de operaciones</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500">Sesiones de Caja</span>
              <div className="text-xl font-bold font-serif-display text-amber-700 mt-2">
                {cashRegisters.length} aperturas / cierres
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Supervisión de gaveta física</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500">Ventas Anuladas</span>
              <div className="text-xl font-bold font-serif-display text-rose-700 mt-2">
                {allPeriodSales.filter(s => s.status === 'ANULADA').length} comprobantes
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Con justificación obligatoria</span>
            </div>
          </div>

          {/* Audit Logs Table Preview */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Bitácora de Auditoría en Tiempo Real</h3>
                <p className="text-[11px] text-stone-500">Registro inmutable de acciones realizadas en el sistema</p>
              </div>
              <button
                onClick={handleExportAuditReportPDF}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
              >
                <FileDown className="w-3.5 h-3.5 text-stone-600" />
                <span>Descargar PDF</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Acción</th>
                    <th className="py-3 px-4">Entidad</th>
                    <th className="py-3 px-4">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {periodAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        No hay registros de auditoría para este período
                      </td>
                    </tr>
                  ) : (
                    periodAuditLogs.slice(0, 50).map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                          {new Date(log.createdAt).toLocaleDateString('es-PE')} {new Date(log.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-800">
                          {log.userName || log.userId}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-700 text-[11px]">
                          <span className={`px-2 py-0.5 rounded-md ${
                            log.action.includes('ANULAR') ? 'bg-rose-100 text-rose-800' :
                            log.action.includes('VENTA') ? 'bg-emerald-100 text-emerald-800' :
                            log.action.includes('CAJA') ? 'bg-amber-100 text-amber-800' :
                            'bg-stone-100 text-stone-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-600 text-[11px]">
                          {log.entity}
                        </td>
                        <td className="py-3 px-4 text-stone-600 max-w-sm truncate text-[11px]">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
