import React, { useState } from 'react';
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
  AlertCircle 
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { sales, products, categories, cashRegisters } = useApp();

  const [dateFilter, setDateFilter] = useState<'TODAY' | 'ALL'>('TODAY');

  const validSales = sales.filter(s => {
    if (s.status !== 'CONFIRMADA') return false;
    if (dateFilter === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      return s.createdAt.startsWith(today);
    }
    return true;
  });

  // Totals
  const totalRevenue = validSales.reduce((sum, s) => sum + s.total, 0);

  // Payments breakdown
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

  // Total cost & gross margin calculation (Section 20: margen_bruto = precio_venta - costo_unitario)
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
    return sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="font-serif-display text-xl font-bold text-stone-900">
            Métricas de Ventas & Margen Bruto
          </h2>
          <p className="text-xs text-stone-500">
            Consolidado de ingresos, rendimiento por método de pago y utilidad bruta
          </p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setDateFilter('TODAY')}
            className={`px-4 py-1.5 rounded-lg transition ${
              dateFilter === 'TODAY' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            Ventas de Hoy
          </button>
          <button
            onClick={() => setDateFilter('ALL')}
            className={`px-4 py-1.5 rounded-lg transition ${
              dateFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            Histórico Completo
          </button>
        </div>
      </div>

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
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-600" />
            <span>Participación por Método de Pago</span>
          </h3>

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
                  Yape (Transferencia Móvil)
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
  );
};
