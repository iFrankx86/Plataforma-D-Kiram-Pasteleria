import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  Database,
  CloudOff,
  Cloud,
  ArrowUpRight
} from 'lucide-react';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ isOpen, onClose }) => {
  const { 
    isOnline, 
    syncQueue, 
    isSyncing, 
    lastSyncSuccessTime, 
    syncPendingTransactions 
  } = useApp();

  if (!isOpen) return null;

  const handleManualSync = async () => {
    await syncPendingTransactions();
  };

  const formattedLastSync = lastSyncSuccessTime
    ? new Date(lastSyncSuccessTime).toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    : 'Aún no sincronizado';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Estado de Sincronización Cloud
              </h3>
              <p className="text-xs text-stone-400">
                Google Firestore & Modo Offline Resiliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Cards */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Network Status */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isOnline 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">Conectividad</span>
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div className="mt-2">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {isOnline ? 'En Línea' : 'Sin Conexión'}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {isOnline ? 'Internet disponible' : 'Trabajando en modo local'}
                </div>
              </div>
            </div>

            {/* Pending Queue Count */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              syncQueue.length === 0 
                ? 'bg-stone-50 border-stone-200' 
                : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">Cola Pendiente</span>
                <Database className="w-4 h-4 text-stone-500" />
              </div>
              <div className="mt-2">
                <div className="font-bold text-base text-stone-900">
                  {syncQueue.length} {syncQueue.length === 1 ? 'registro' : 'registros'}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {syncQueue.length === 0 
                    ? 'Todo sincronizado' 
                    : 'Esperando subir a Firestore'}
                </div>
              </div>
            </div>
          </div>

          {/* Sync Information Alert */}
          {syncQueue.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Operaciones realizadas sin conexión</span>
              </div>
              <p className="text-amber-800/90 text-[11px] leading-relaxed">
                El sistema POS continúa cobrando normalmente. Cuando se restablezca la conexión, estas operaciones se sincronizarán solas de forma automática.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Base de datos en la nube al día. No hay ventas pendientes.</span>
            </div>
          )}

          {/* Pending items list */}
          {syncQueue.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Ventas y Movimientos Pendientes
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-100">
                {syncQueue.map((item) => (
                  <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs bg-stone-50 p-2 rounded-lg border border-stone-200">
                    <div>
                      <div className="font-semibold text-stone-800">
                        {item.type === 'SALE' && item.data.sale ? (
                          <span>Venta {item.data.sale.code}</span>
                        ) : item.type === 'VOID_SALE' && item.data.sale ? (
                          <span className="text-rose-600">Anulación {item.data.sale.code}</span>
                        ) : item.type === 'CASH_MOVEMENT' ? (
                          <span>Movimiento de caja</span>
                        ) : (
                          <span>Ajuste de inventario</span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                    {item.data.sale && (
                      <div className="font-mono font-bold text-stone-900">
                        S/ {item.data.sale.total.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last sync and manual sync button */}
          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-[11px] text-stone-500">
              <span className="font-medium text-stone-700">Última sincronización: </span>
              {formattedLastSync}
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline || syncQueue.length === 0}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700 active:scale-95 text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
