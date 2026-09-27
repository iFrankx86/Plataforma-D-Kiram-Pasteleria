import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Unlock, 
  Clock, 
  Coins,
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  Banknote,
  RotateCcw,
  Sparkles
} from 'lucide-react';

type CashModalType = 'ABONO_SENCILLO' | 'DEVOLUCION_SENCILLO' | 'EGRESO' | 'INGRESO' | 'RETIRO' | 'AJUSTE';

export const CashRegisterScreen: React.FC = () => {
  const { 
    currentCashRegister, 
    cashRegisters, 
    cashMovements, 
    openCashRegister, 
    closeCashRegister, 
    addManualCashMovement, 
    sales,
    currentUser 
  } = useApp();

  // Apertura modal/form
  const [openingAmountInput, setOpeningAmountInput] = useState<string>('150.00');

  // Movement modal
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<CashModalType>('ABONO_SENCILLO');
  const [movementAmount, setMovementAmount] = useState<string>('50.00');
  const [movementReason, setMovementReason] = useState<string>('Dotación de sencillo para cambio / vueltos en gaveta');
  const [movementError, setMovementError] = useState<string | null>(null);

  // Cierre modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [closeError, setCloseError] = useState<string | null>(null);

  // Stats calculation for current open cash register
  const currentRegisterMovements = currentCashRegister 
    ? cashMovements.filter(m => m.cashRegisterId === currentCashRegister.id)
    : [];

  const salesInCurrentRegister = currentCashRegister
    ? sales.filter(s => s.cashRegisterId === currentCashRegister.id && s.status === 'CONFIRMADA')
    : [];

  // Cash vs Digital totals
  const cashSalesTotal = salesInCurrentRegister.reduce((sum, s) => {
    const cashP = s.payments.find(p => p.method === 'EFECTIVO');
    return sum + (cashP ? cashP.amount : 0);
  }, 0);

  const yapeSalesTotal = salesInCurrentRegister.reduce((sum, s) => {
    const p = s.payments.find(p => p.method === 'YAPE');
    return sum + (p ? p.amount : 0);
  }, 0);

  const plinSalesTotal = salesInCurrentRegister.reduce((sum, s) => {
    const p = s.payments.find(p => p.method === 'PLIN');
    return sum + (p ? p.amount : 0);
  }, 0);

  const totalSalesAll = cashSalesTotal + yapeSalesTotal + plinSalesTotal;

  // Specific movements breakdown
  const abonosSencilloTotal = currentRegisterMovements
    .filter(m => m.type === 'ABONO_SENCILLO')
    .reduce((sum, m) => sum + m.amount, 0);

  const devolucionesSencilloTotal = currentRegisterMovements
    .filter(m => m.type === 'DEVOLUCION_SENCILLO')
    .reduce((sum, m) => sum + m.amount, 0);

  const manualIngresos = currentRegisterMovements
    .filter(m => m.type === 'INGRESO' || (m.type === 'AJUSTE' && m.amount > 0))
    .reduce((sum, m) => sum + m.amount, 0);

  const manualEgresos = currentRegisterMovements
    .filter(m => m.type === 'EGRESO' || m.type === 'RETIRO' || m.type === 'ANULACION_VENTA')
    .reduce((sum, m) => sum + m.amount, 0);

  // Total base de cambio disponible en caja (Fondo Inicial + Abonos de Sencillo - Devoluciones)
  const totalBaseSencillo = (currentCashRegister?.openingAmount || 0) + abonosSencilloTotal - devolucionesSencilloTotal;

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingAmountInput);
    if (isNaN(amount) || amount < 0) {
      alert('Ingresa un monto de apertura válido.');
      return;
    }
    openCashRegister(amount);
  };

  const openAbonoSencilloModal = () => {
    setMovementType('ABONO_SENCILLO');
    setMovementAmount('50.00');
    setMovementReason('Dotación de sencillo para cambio / vueltos en gaveta');
    setMovementError(null);
    setIsMovementModalOpen(true);
  };

  const openEgresoModal = () => {
    setMovementType('EGRESO');
    setMovementAmount('');
    setMovementReason('');
    setMovementError(null);
    setIsMovementModalOpen(true);
  };

  const openIngresoModal = () => {
    setMovementType('INGRESO');
    setMovementAmount('');
    setMovementReason('');
    setMovementError(null);
    setIsMovementModalOpen(true);
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError(null);
    const amount = parseFloat(movementAmount);
    if (isNaN(amount) || amount <= 0) {
      setMovementError('El monto debe ser mayor a S/ 0.00');
      return;
    }
    if (!movementReason.trim()) {
      setMovementError('Debes indicar el motivo o justificación del movimiento.');
      return;
    }

    const res = addManualCashMovement(movementType, amount, movementReason);
    if (res.success) {
      setIsMovementModalOpen(false);
      setMovementAmount('');
      setMovementReason('');
    } else {
      setMovementError(res.error || 'Error al registrar movimiento');
    }
  };

  const handleOpenCloseModal = () => {
    if (!currentCashRegister) return;
    setCountedCashInput(currentCashRegister.expectedCash.toFixed(2));
    setClosingNotes('');
    setCloseError(null);
    setIsCloseModalOpen(true);
  };

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    setCloseError(null);
    const counted = parseFloat(countedCashInput);
    if (isNaN(counted) || counted < 0) {
      setCloseError('Ingresa una cantidad de efectivo contado válida.');
      return;
    }

    const res = closeCashRegister(counted, closingNotes);
    if (res.success) {
      setIsCloseModalOpen(false);
    } else {
      setCloseError(res.error || 'Error al cerrar caja');
    }
  };

  const countedNum = parseFloat(countedCashInput) || 0;
  const differenceValue = currentCashRegister ? countedNum - currentCashRegister.expectedCash : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner / Current Status */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
            currentCashRegister ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-rose-600 ring-4 ring-rose-100'
          }`}>
            {currentCashRegister ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-display text-xl font-bold text-stone-900">
                {currentCashRegister ? `Caja Activa (${currentCashRegister.code})` : 'Caja Cerrada'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                currentCashRegister ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {currentCashRegister ? 'EN OPERACIÓN' : 'INACTIVA'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {currentCashRegister 
                ? `Aperturada por ${currentCashRegister.employeeName} el ${new Date(currentCashRegister.openedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
                : 'No hay ninguna sesión de caja abierta actualmente en el turno.'
              }
            </p>
          </div>
        </div>

        {/* Top Actions */}
        {currentCashRegister ? (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* DESTACADO: Botón Abonar Sencillo */}
            <button
              onClick={openAbonoSencilloModal}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              title="Registrar dinero adicional para vuelto (no afecta ventas)"
            >
              <Coins className="w-4 h-4 text-stone-950" />
              <span>+ Abonar Sencillo</span>
            </button>

            <button
              onClick={openEgresoModal}
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <MinusCircle className="w-4 h-4 text-rose-500" />
              <span>Gasto / Salida</span>
            </button>

            <button
              onClick={openIngresoModal}
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              <span>Ingreso Extra</span>
            </button>

            <button
              onClick={handleOpenCloseModal}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Arqueo y Cierre</span>
            </button>
          </div>
        ) : (
          <div className="w-full md:w-auto">
            <form onSubmit={handleOpenRegister} className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">S/</span>
                <input
                  type="number"
                  step="0.5"
                  value={openingAmountInput}
                  onChange={e => setOpeningAmountInput(e.target.value)}
                  placeholder="Fondo inicial"
                  className="pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold w-32 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Turno de Caja</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Cash vs Digital Dashboard when Open */}
      {currentCashRegister && (
        <div className="space-y-6">
          
          {/* Main Financial KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Fondo de Sencillo (Apertura + Abonos) */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  Fondo de Sencillo Total
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                  Para dar Vuelto
                </span>
              </div>
              <div className="font-serif-display text-2xl font-bold text-stone-900 mt-2">
                S/ {totalBaseSencillo.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex flex-wrap items-center gap-x-2">
                <span>Base Inicial: <strong>S/ {currentCashRegister.openingAmount.toFixed(2)}</strong></span>
                {abonosSencilloTotal > 0 && (
                  <span className="text-emerald-700 font-semibold">
                    (+ S/ {abonosSencilloTotal.toFixed(2)} abono)
                  </span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                🔒 No suma a las ventas ni infla ingresos
              </div>
            </div>

            {/* 2. Ventas Efectivo */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                  Ventas Cobradas en Efectivo
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                  Ingreso Real
                </span>
              </div>
              <div className="font-serif-display text-2xl font-bold text-emerald-700 mt-2">
                + S/ {cashSalesTotal.toFixed(2)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {salesInCurrentRegister.filter(s => s.payments.some(p => p.method === 'EFECTIVO')).length} cobro(s) de clientes
              </p>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-emerald-600 font-medium">
                Suma directo a las ventas del negocio
              </div>
            </div>

            {/* 3. Egresos & Gastos de Caja */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                  Egresos & Salidas de Caja
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                  Gastos
                </span>
              </div>
              <div className="font-serif-display text-2xl font-bold text-rose-700 mt-2">
                - S/ {manualEgresos.toFixed(2)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Pagos a proveedores o insumos
              </p>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-rose-600 font-medium">
                Resta dinero físico de la gaveta
              </div>
            </div>

            {/* 4. TOTAL EFECTIVO FÍSICO ESPERADO (THE MAIN METRIC) */}
            <div className="bg-amber-600 text-white p-5 rounded-2xl shadow-md border border-amber-700">
              <div className="flex items-center justify-between text-amber-200 text-xs font-semibold">
                <span className="flex items-center gap-1 text-white font-bold">
                  <Wallet className="w-4 h-4 text-amber-200" />
                  Efectivo Físico en Gaveta
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/80 text-white font-bold">
                  Total Esperado
                </span>
              </div>
              <div className="font-serif-display text-3xl font-extrabold text-white mt-2">
                S/ {currentCashRegister.expectedCash.toFixed(2)}
              </div>
              <p className="text-[11px] text-amber-100 font-medium mt-1">
                Base Sencillo (S/ {totalBaseSencillo.toFixed(2)}) + Ventas netas
              </p>
              <div className="mt-2 pt-2 border-t border-amber-500/50 text-[10px] text-amber-200">
                Debe coincidir con el conteo de billetes y monedas
              </div>
            </div>

          </div>

          {/* Educational Callout: Solución Contable al Percance del Sencillo */}
          <div className="bg-gradient-to-r from-amber-50 via-stone-50 to-orange-50 rounded-3xl p-5 border border-amber-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-stone-900">
                      Control de Sencillo y Vueltos en D' Kiram Pastelería
                    </h3>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Protección Contable
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 max-w-3xl leading-relaxed">
                    Si el encargado dejó <strong>S/ 150.00</strong> y se le entregan <strong>S/ 50.00</strong> al personal para tener sencillo, 
                    el botón <span className="font-semibold text-amber-800 bg-amber-100 px-1 rounded">+ Abonar Sencillo</span> lo ingresa 
                    a la gaveta <strong>sin inflar el total de ventas del día</strong>. Así, el conteo físico cuadra a la perfección y la venta 
                    esperada refleja únicamente pasteles y postres cobrados.
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={openAbonoSencilloModal}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Abonar Sencillo Ahora</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sales Breakdown: Efectivo vs Digital */}
          <div className="bg-stone-900 text-stone-100 p-5 rounded-3xl border border-stone-800 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold">
                    Ventas del Turno
                  </span>
                  <h3 className="font-bold text-sm text-stone-100">
                    Ventas Totales Reales (Efectivo + Yape + Plin)
                  </h3>
                </div>
                <p className="text-xs text-stone-400 mt-1 max-w-2xl">
                  Total de ventas del negocio: <strong>S/ {totalSalesAll.toFixed(2)}</strong>. 
                  Los abonos de sencillo no alteran esta cifra, garantizando un reporte de ventas 100% fidedigno.
                </p>
              </div>

              {/* Digital Metrics Pills */}
              <div className="flex flex-wrap gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-stone-800 border border-emerald-500/30 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <div>
                    <div className="text-[10px] text-stone-400">Efectivo</div>
                    <div className="text-xs font-bold text-emerald-300">S/ {cashSalesTotal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-stone-800 border border-purple-500/30 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400"></div>
                  <div>
                    <div className="text-[10px] text-stone-400">Yape (Banco)</div>
                    <div className="text-xs font-bold text-purple-300">S/ {yapeSalesTotal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-stone-800 border border-cyan-500/30 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                  <div>
                    <div className="text-[10px] text-stone-400">Plin (Banco)</div>
                    <div className="text-xs font-bold text-cyan-300">S/ {plinSalesTotal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div>
                    <div className="text-[10px] text-amber-300">Total Facturado</div>
                    <div className="text-xs font-bold text-amber-200">S/ {totalSalesAll.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Movements Table for Current Register */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Movimientos de Dinero en Turno Actual
                </h3>
                <p className="text-xs text-stone-500">
                  Trazabilidad cronológica de entradas, salidas y dotaciones de sencillo en gaveta
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                  {currentRegisterMovements.length} registro(s)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Hora</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4">Motivo / Concepto</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4 text-right">Efecto Gaveta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {currentRegisterMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        No hay movimientos registrados aún
                      </td>
                    </tr>
                  ) : (
                    currentRegisterMovements.map(mov => {
                      const isPositive = mov.type === 'APERTURA' || mov.type === 'VENTA_EFECTIVO' || mov.type === 'INGRESO' || mov.type === 'ABONO_SENCILLO';
                      
                      let badgeColor = 'bg-stone-100 text-stone-700';
                      let badgeText: string = mov.type;

                      if (mov.type === 'APERTURA') {
                        badgeColor = 'bg-blue-100 text-blue-800';
                        badgeText = 'FONDO APERTURA';
                      } else if (mov.type === 'ABONO_SENCILLO') {
                        badgeColor = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
                        badgeText = '🪙 ABONO DE SENCILLO';
                      } else if (mov.type === 'DEVOLUCION_SENCILLO') {
                        badgeColor = 'bg-purple-100 text-purple-900 font-bold';
                        badgeText = '↩ DEVOLUCIÓN SENCILLO';
                      } else if (mov.type === 'VENTA_EFECTIVO') {
                        badgeColor = 'bg-emerald-100 text-emerald-800';
                        badgeText = 'VENTA EFECTIVO';
                      } else if (mov.type === 'INGRESO') {
                        badgeColor = 'bg-teal-100 text-teal-800';
                        badgeText = 'INGRESO EXTRA';
                      } else if (mov.type === 'ANULACION_VENTA') {
                        badgeColor = 'bg-orange-100 text-orange-800';
                        badgeText = 'REVERSO VENTA';
                      } else {
                        badgeColor = 'bg-rose-100 text-rose-800';
                        badgeText = mov.type === 'EGRESO' ? 'GASTO / EGRESO' : mov.type;
                      }

                      return (
                        <tr key={mov.id} className="hover:bg-stone-50 transition">
                          <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                            {new Date(mov.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${badgeColor}`}>
                              {badgeText}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-stone-800">
                            {mov.reason}
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {mov.createdBy}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold font-mono ${
                            isPositive ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {isPositive ? '+' : '-'} S/ {mov.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* History of Past Cash Registers & Discrepancies */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-stone-200">
          <h3 className="font-bold text-stone-900 text-sm">
            Historial de Cajas y Arqueos Anteriores
          </h3>
          <p className="text-xs text-stone-500">
            Registro de cierres, efectivo esperado vs contado y diferencias detectadas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Código Caja</th>
                <th className="py-3 px-4">Cajero</th>
                <th className="py-3 px-4">Apertura</th>
                <th className="py-3 px-4">Cierre</th>
                <th className="py-3 px-4 text-right">Fondo Base</th>
                <th className="py-3 px-4 text-right">Efectivo Esperado</th>
                <th className="py-3 px-4 text-right">Efectivo Contado</th>
                <th className="py-3 px-4 text-right">Diferencia</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cashRegisters.map(cr => (
                <tr key={cr.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-4 font-bold font-mono text-stone-900">{cr.code}</td>
                  <td className="py-3 px-4 text-stone-700">{cr.employeeName}</td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(cr.openedAt).toLocaleDateString('es-PE')} {new Date(cr.openedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-stone-500">
                    {cr.closedAt 
                      ? `${new Date(cr.closedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
                      : '—'
                    }
                  </td>
                  <td className="py-3 px-4 text-right text-stone-700">S/ {cr.openingAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium text-stone-900">S/ {cr.expectedCash.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-stone-900">
                    {cr.countedCash !== undefined ? `S/ ${cr.countedCash.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    {cr.difference !== undefined ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        cr.difference === 0 ? 'bg-emerald-100 text-emerald-800' :
                        cr.difference > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {cr.difference > 0 ? `+ S/ ${cr.difference.toFixed(2)} (Sobrante)` :
                         cr.difference < 0 ? `- S/ ${Math.abs(cr.difference).toFixed(2)} (Faltante)` :
                         'S/ 0.00 (Cuadrada)'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cr.status === 'ABIERTA' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {cr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: REGISTRAR MOVIMIENTO MANUAL (CON SOPORTE DE SENCILLO)  */}
      {/* ============================================================ */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-amber-100">
                  Movimiento de Caja & Sencillo
                </h3>
              </div>
              <button 
                onClick={() => setIsMovementModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {movementError && (
              <div className="p-3 m-4 mb-0 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {movementError}
              </div>
            )}

            <form onSubmit={handleAddMovement} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Tipo de Operación
                </label>
                
                {/* Opciones con distinción clara */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('ABONO_SENCILLO');
                      if (!movementAmount) setMovementAmount('50.00');
                      setMovementReason('Dotación de sencillo para cambio / vueltos en gaveta');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      movementType === 'ABONO_SENCILLO'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-bold ring-2 ring-amber-400/30'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                      <Coins className="w-4 h-4" />
                      <span>Abonar Sencillo</span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                      Fondo extra para dar vuelto
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('DEVOLUCION_SENCILLO');
                      setMovementReason('Devolución de fondo prestado de sencillo');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      movementType === 'DEVOLUCION_SENCILLO'
                        ? 'border-purple-500 bg-purple-50/80 text-purple-950 font-bold ring-2 ring-purple-400/30'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-purple-700 font-bold">
                      <RotateCcw className="w-4 h-4" />
                      <span>Devolver Sencillo</span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                      Devolver fondo a admin
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('EGRESO');
                      setMovementReason('');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      movementType === 'EGRESO'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-400/30'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                      <MinusCircle className="w-4 h-4" />
                      <span>Gasto / Egreso</span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                      Compras o insumos
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('INGRESO');
                      setMovementReason('');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      movementType === 'INGRESO'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-400/30'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <PlusCircle className="w-4 h-4" />
                      <span>Ingreso Extra</span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                      Otro ingreso a caja
                    </p>
                  </button>
                </div>
              </div>

              {/* Informative Help Box for the selected type */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] leading-relaxed">
                {movementType === 'ABONO_SENCILLO' && (
                  <p className="text-amber-900">
                    💡 <strong>Abono de Sencillo:</strong> Suma efectivo físico a la gaveta para que tengas cambio, pero <strong>NO se cuenta como venta</strong> ni infla los ingresos del negocio.
                  </p>
                )}
                {movementType === 'DEVOLUCION_SENCILLO' && (
                  <p className="text-purple-900">
                    💡 <strong>Devolución de Sencillo:</strong> Retira de la gaveta el fondo de cambio que fue prestado al turno, sin registrarse como gasto operativo.
                  </p>
                )}
                {movementType === 'EGRESO' && (
                  <p className="text-rose-900">
                    💡 <strong>Gasto de Caja:</strong> Retiro de dinero para compras menores (ej: fresas, servilletas, empaques, pasajes).
                  </p>
                )}
                {movementType === 'INGRESO' && (
                  <p className="text-emerald-900">
                    💡 <strong>Ingreso Extra:</strong> Entrada de efectivo adicional no ligada a una venta de catálogo estándar.
                  </p>
                )}
              </div>

              {/* Quick amount chips for Abono Sencillo */}
              {movementType === 'ABONO_SENCILLO' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Atajos de Sencillo más comunes:
                  </label>
                  <div className="flex gap-2">
                    {['20.00', '50.00', '100.00', '150.00'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMovementAmount(val)}
                        className={`flex-1 py-1 rounded-lg border text-xs font-semibold transition ${
                          movementAmount === val 
                            ? 'bg-amber-500 text-stone-950 border-amber-600 font-bold' 
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Monto en Soles (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">S/</span>
                  <input
                    type="number"
                    step="0.5"
                    value={movementAmount}
                    onChange={e => setMovementAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Motivo o Detalle
                </label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={e => setMovementReason(e.target.value)}
                  placeholder={
                    movementType === 'ABONO_SENCILLO' 
                      ? 'Ej: Dotación de monedas de S/ 1, 2 y 5 dada por el Administrador'
                      : 'Motivo del movimiento...'
                  }
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-4 h-4" />
                  <span>Confirmar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ARQUEO Y CIERRE DE CAJA (CON DESGLOSE DE SENCILLO)    */}
      {/* ============================================================ */}
      {isCloseModalOpen && currentCashRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Arqueo y Cierre de Turno de Caja
                </h3>
                <p className="text-[11px] text-stone-400">
                  {currentCashRegister.code} • Cajero: {currentCashRegister.employeeName}
                </p>
              </div>
              <button 
                onClick={() => setIsCloseModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {closeError && (
              <div className="p-3 m-4 mb-0 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {closeError}
              </div>
            )}

            <form onSubmit={handleConfirmClose} className="p-5 space-y-4">
              
              {/* Comprehensive Breakdown */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-200 flex items-center justify-between">
                  <span>Conciliación de Efectivo</span>
                  <span>Impacto</span>
                </div>

                <div className="flex justify-between text-stone-700">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Fondo Inicial Apertura:
                  </span>
                  <span className="font-mono">S/ {currentCashRegister.openingAmount.toFixed(2)}</span>
                </div>

                {abonosSencilloTotal > 0 && (
                  <div className="flex justify-between text-amber-800 font-semibold bg-amber-50/80 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      (+) Abono de Sencillo (Vueltos):
                    </span>
                    <span className="font-mono">+ S/ {abonosSencilloTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-800 font-medium pt-1 border-t border-stone-100">
                  <span className="text-stone-500">(=) Total Fondo Base de Vuelto:</span>
                  <span className="font-mono font-bold text-stone-900">S/ {totalBaseSencillo.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>(+) Ventas Cobradas en Efectivo:</span>
                  <span className="font-mono font-bold">+ S/ {cashSalesTotal.toFixed(2)}</span>
                </div>

                {manualIngresos > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span>(+) Otros Ingresos Extra:</span>
                    <span className="font-mono">+ S/ {manualIngresos.toFixed(2)}</span>
                  </div>
                )}

                {manualEgresos > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>(-) Gastos de Caja / Salidas:</span>
                    <span className="font-mono">- S/ {manualEgresos.toFixed(2)}</span>
                  </div>
                )}

                {devolucionesSencilloTotal > 0 && (
                  <div className="flex justify-between text-purple-700">
                    <span>(-) Devolución de Sencillo:</span>
                    <span className="font-mono">- S/ {devolucionesSencilloTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-extrabold text-stone-950 pt-2 border-t-2 border-stone-300 text-sm">
                  <span>(=) Efectivo Físico Esperado en Gaveta:</span>
                  <span className="font-mono text-amber-700">S/ {currentCashRegister.expectedCash.toFixed(2)}</span>
                </div>
              </div>

              {/* Counted Cash Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Efectivo Físico Contado en Gaveta:
                  </label>
                  <button
                    type="button"
                    onClick={() => setCountedCashInput(currentCashRegister.expectedCash.toFixed(2))}
                    className="text-[11px] text-amber-700 font-semibold hover:underline"
                  >
                    Usar esperado exacto
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">S/</span>
                  <input
                    type="number"
                    step="0.1"
                    value={countedCashInput}
                    onChange={e => setCountedCashInput(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-base font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Difference Indicator */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                Math.abs(differenceValue) < 0.01 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : differenceValue > 0 
                  ? 'bg-blue-50 border-blue-300 text-blue-900' 
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {Math.abs(differenceValue) < 0.01 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Arqueo Cuadrado Exacto</span>
                    </>
                  ) : differenceValue > 0 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span>Sobrante en Gaveta:</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Faltante en Gaveta:</span>
                    </>
                  )}
                </div>
                <div className="font-serif-display font-extrabold text-base">
                  {differenceValue > 0 ? `+ S/ ${differenceValue.toFixed(2)}` :
                   differenceValue < 0 ? `- S/ ${Math.abs(differenceValue).toFixed(2)}` :
                   'S/ 0.00'}
                </div>
              </div>

              {/* Handover / Retiro Recommendation */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-stone-700 space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-amber-700" />
                  Sugerencia para Entrega de Turno:
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Dejar en caja para sencillo de mañana:</span>
                  <strong className="text-stone-900">S/ {totalBaseSencillo.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Dinero neto de ventas a retirar / depositar:</span>
                  <strong className="text-emerald-800">
                    S/ {Math.max(0, countedNum - totalBaseSencillo).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Observaciones de Cierre (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="Ej: Se dejó S/ 200 en monedas y billetes chicos para el turno mañana..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Confirmar Cierre</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
