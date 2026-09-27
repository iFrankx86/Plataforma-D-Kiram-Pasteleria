import React from 'react';
import { Sale } from '../../types';
import { Printer, X, CheckCircle, Sparkles } from 'lucide-react';
import { DKiramLogo } from '../common/DKiramLogo';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header Bar */}
        <div className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-amber-200" />
            <span className="font-semibold text-sm">Venta Confirmada</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-700 text-amber-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 bg-stone-50 font-mono text-xs text-stone-800 space-y-4 print:p-0 print:bg-white">
          
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-3">
            <DKiramLogo height={36} withContour={false} className="mx-auto mb-1.5" />
            <h2 className="font-serif-display text-lg font-bold tracking-wider text-stone-900">
              D' KIRAM PASTELERÍA
            </h2>
            <p className="text-[11px] text-stone-600">R.U.C. 20608912345</p>
            <p className="text-[10px] text-stone-500">Av. Las Delicias 450, Miraflores, Lima</p>
            <p className="text-[10px] text-stone-500">Tel: (01) 456-7890 | @dkiram.pasteleria</p>
            <div className="pt-2 text-[11px] font-semibold text-stone-700">
              TICKET DE VENTA: {sale.code}
            </div>
            <div className="text-[10px] text-stone-500">{formattedDate}</div>
            <div className="text-[10px] text-stone-500">Atendido por: {sale.employeeName}</div>
          </div>

          {/* Items Table */}
          <div className="border-b border-dashed border-stone-300 pb-3">
            <div className="grid grid-cols-12 font-bold text-stone-700 border-b border-stone-200 pb-1 mb-1 text-[11px]">
              <span className="col-span-6">DESCRIPCIÓN</span>
              <span className="col-span-2 text-center">CANT</span>
              <span className="col-span-2 text-right">P.U.</span>
              <span className="col-span-2 text-right">TOTAL</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {sale.items.map(item => (
                <div key={item.id} className="grid grid-cols-12 text-[11px] items-center">
                  <span className="col-span-6 font-sans font-medium text-stone-900 truncate">
                    {item.productName}
                  </span>
                  <span className="col-span-2 text-center">{item.quantity}</span>
                  <span className="col-span-2 text-right">S/{item.unitPrice.toFixed(2)}</span>
                  <span className="col-span-2 text-right font-semibold">S/{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 text-right">
            <div className="flex justify-between">
              <span className="text-stone-500">SUBTOTAL:</span>
              <span>S/ {sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>DESCUENTO:</span>
                <span>- S/ {sale.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-200">
              <span>TOTAL A PAGAR:</span>
              <span>S/ {sale.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="space-y-1 border-b border-dashed border-stone-300 pb-3">
            <div className="font-semibold text-[11px] text-stone-700">FORMA DE PAGO:</div>
            {sale.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-stone-600 font-medium">
                  {p.method === 'EFECTIVO' ? '💵 Efectivo' : p.method === 'YAPE' ? '🟣 Yape' : '🔵 Plin'}:
                </span>
                <span className="font-bold">S/ {p.amount.toFixed(2)}</span>
              </div>
            ))}
            {sale.tenderedCash !== undefined && sale.tenderedCash > 0 && (
              <>
                <div className="flex justify-between text-[11px] text-stone-500 pt-1">
                  <span>Efectivo recibido:</span>
                  <span>S/ {sale.tenderedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-emerald-700">
                  <span>Vuelto:</span>
                  <span>S/ {(sale.change || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer message */}
          <div className="text-center pt-1 text-[10px] text-stone-500 space-y-1">
            <p className="flex items-center justify-center gap-1 text-amber-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              ¡Gracias por endulzar tu día con D' Kiram!
            </p>
            <p>Conserve este ticket para cualquier cambio o consulta.</p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-stone-200 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprobante
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition"
          >
            Nueva Venta
          </button>
        </div>

      </div>
    </div>
  );
};
