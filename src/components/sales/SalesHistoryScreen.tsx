import React, { useState } from 'react';
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
  AlertTriangle 
} from 'lucide-react';

export const SalesHistoryScreen: React.FC = () => {
  const { sales, voidSale, setActiveReceiptSale, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMADA' | 'ANULADA'>('ALL');
  
  // Void modal
  const [voidingSale, setVoidingSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  // Detail Modal
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter(sale => {
    const matchesStatus = statusFilter === 'ALL' || sale.status === statusFilter;
    const matchesSearch = 
      sale.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="font-serif-display text-lg font-bold text-stone-900">
            Historial de Ventas & Comprobantes
          </h2>
          <p className="text-xs text-stone-500">
            Consulta de tickets, auditoría de pagos y anulación controlada
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por código V-XXXXX o producto..."
              className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Todas ({sales.length})
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMADA')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'CONFIRMADA' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'
              }`}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setStatusFilter('ANULADA')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'ANULADA' ? 'bg-white text-rose-800 shadow-xs' : 'text-stone-600'
              }`}
            >
              Anuladas
            </button>
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
                <th className="py-3 px-4">Cajero</th>
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
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No se encontraron ventas registradas
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {sale.code}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                      {new Date(sale.createdAt).toLocaleDateString('es-PE')} {new Date(sale.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-stone-700 font-medium">
                      {sale.employeeName}
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
                              'bg-cyan-100 text-cyan-800'
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
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition"
                          title="Ver o Reimprimir Ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDetailSale(sale)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.status === 'CONFIRMADA' && currentUser.role !== 'INVENTARIO' && (
                          <button
                            onClick={() => handleOpenVoidModal(sale)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Anular Venta"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
              <button onClick={() => setDetailSale(null)} className="text-stone-400 hover:text-white">✕</button>
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

              {detailSale.status === 'ANULADA' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                  <strong>Motivo de Anulación:</strong> {detailSale.voidReason}
                </div>
              )}
            </div>
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setDetailSale(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold"
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
              <button onClick={() => setVoidingSale(null)} className="text-rose-200 hover:text-white">✕</button>
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
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
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
