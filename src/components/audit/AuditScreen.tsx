import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Clock, User, Info, FileSpreadsheet } from 'lucide-react';

export const AuditScreen: React.FC = () => {
  const { auditLogs } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif-display text-xl font-bold text-stone-900">
              Bitácora de Auditoría & Trazabilidad
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro inmutable de operaciones sensibles (Caja, Anulaciones, Ajustes de Stock y Precios)
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-stone-100 text-stone-700">
          {auditLogs.length} eventos auditados
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Operación</th>
                <th className="py-3 px-4">Entidad</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Detalle / Valor Anterior vs Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-4 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString('es-PE')} {new Date(log.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      log.action.includes('ANULAR') ? 'bg-rose-100 text-rose-800' :
                      log.action.includes('APERTURA') ? 'bg-blue-100 text-blue-800' :
                      log.action.includes('CIERRE') ? 'bg-purple-100 text-purple-800' :
                      log.action.includes('VENTA') ? 'bg-emerald-100 text-emerald-800' :
                      'bg-stone-200 text-stone-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-stone-600 text-[11px]">
                    {log.entity}
                  </td>
                  <td className="py-3 px-4 font-semibold text-stone-800 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4 text-stone-700 font-mono text-[11px]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
