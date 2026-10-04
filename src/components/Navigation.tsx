import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Wallet, 
  Package, 
  FileText, 
  Cake, 
  BarChart3, 
  Users, 
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  UserCircle2,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Download,
  FileDown
} from 'lucide-react';

export type TabType = 
  | 'pos' 
  | 'cash' 
  | 'inventory' 
  | 'sales-history' 
  | 'products' 
  | 'reports' 
  | 'shifts' 
  | 'audit';

interface NavigationProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, setCurrentTab }) => {
  const { 
    currentUser, 
    setCurrentUser,
    users,
    cart, 
    currentCashRegister,
    isOnline,
    syncQueue
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allNavItems: {
    id: TabType;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    roles: ('ADMIN' | 'CAJERO' | 'INVENTARIO')[];
    badge?: number;
    description?: string;
  }[] = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      shortLabel: 'POS',
      icon: <ShoppingCart className="w-5 h-5" />,
      roles: ['ADMIN', 'CAJERO'],
      badge: cart.length > 0 ? cart.reduce((s, i) => s + i.quantity, 0) : undefined,
      description: 'Registrar ventas y cobrar en mostrador',
    },
    {
      id: 'cash',
      label: 'Caja & Arqueo',
      shortLabel: 'Caja',
      icon: <Wallet className="w-5 h-5" />,
      roles: ['ADMIN', 'CAJERO'],
      description: 'Apertura, arqueos y movimientos de caja chica',
    },
    {
      id: 'sales-history',
      label: 'Ventas Realizadas',
      shortLabel: 'Ventas',
      icon: <FileText className="w-5 h-5" />,
      roles: ['ADMIN', 'CAJERO'],
      description: 'Consulta de tickets, auditoría y reimpresión',
    },
    {
      id: 'inventory',
      label: 'Inventario & Kárdex',
      shortLabel: 'Inventario',
      icon: <Package className="w-5 h-5" />,
      roles: ['ADMIN', 'INVENTARIO'],
      description: 'Control de stock físico, entradas y mermas',
    },
    {
      id: 'products',
      label: 'Catálogo de Pastelería',
      shortLabel: 'Catálogo',
      icon: <Cake className="w-5 h-5" />,
      roles: ['ADMIN', 'INVENTARIO', 'CAJERO'],
      description: 'Precios, recetas, costos y categorías',
    },
    {
      id: 'reports',
      label: 'Reportes & Margen',
      shortLabel: 'Reportes',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['ADMIN'],
      description: 'Métricas financieras, margen bruto y exportación PDF',
    },
    {
      id: 'shifts',
      label: 'Personal & Turnos',
      shortLabel: 'Personal',
      icon: <Users className="w-5 h-5" />,
      roles: ['ADMIN'],
      description: 'Horarios de trabajo, colaboradores y asistencia',
    },
    {
      id: 'audit',
      label: 'Auditoría & Seguridad',
      shortLabel: 'Auditoría',
      icon: <ShieldCheck className="w-5 h-5" />,
      roles: ['ADMIN'],
      description: 'Bitácora inmutable de eventos y cierres',
    },
  ];

  // Filter allowed tabs based on role
  const visibleItems = allNavItems.filter(item => item.roles.includes(currentUser.role));

  // Primary bottom navigation items for mobile (Max 4 direct + 1 "More" button)
  const mobilePrimaryTabIds: TabType[] = currentUser.role === 'INVENTARIO'
    ? ['inventory', 'products']
    : ['pos', 'cash', 'sales-history', 'inventory'];

  const mobilePrimaryItems = visibleItems.filter(i => mobilePrimaryTabIds.includes(i.id));
  const isCurrentTabInMoreMenu = !mobilePrimaryTabIds.includes(currentTab);

  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. DESKTOP / TABLET TOP NAVIGATION BAR (md and up)          */}
      {/* ============================================================ */}
      <div className="hidden md:block bg-stone-100 border-b border-stone-200 sticky top-16 z-20 overflow-x-auto no-scrollbar shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
            {visibleItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`cursor-pointer relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-amber-800 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MOBILE BOTTOM NAVIGATION BAR (md:hidden)                  */}
      {/* ============================================================ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <nav className="grid grid-flow-col auto-cols-fr h-16 items-center px-1">
          {mobilePrimaryItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`cursor-pointer relative flex flex-col items-center justify-center py-1 px-1 transition active:scale-90 ${
                  isActive ? 'text-amber-600 font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div className="relative">
                  <span className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                    {item.icon}
                  </span>
                  
                  {/* Badge counter (e.g. cart items) */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-amber-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}

                  {/* Cash status dot */}
                  {item.id === 'cash' && (
                    <span 
                      className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full border border-white ${
                        currentCashRegister ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`} 
                    />
                  )}
                </div>

                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                  {item.shortLabel}
                </span>

                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-1 w-6 h-0.5 bg-amber-600 rounded-full" />
                )}
              </button>
            );
          })}

          {/* "MÁS" (MORE MENU) BUTTON */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`cursor-pointer relative flex flex-col items-center justify-center py-1 px-1 transition active:scale-90 ${
              isMobileMenuOpen || isCurrentTabInMoreMenu ? 'text-amber-600 font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {isCurrentTabInMoreMenu && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-500 border border-white" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Más</span>
            {(isMobileMenuOpen || isCurrentTabInMoreMenu) && (
              <span className="absolute bottom-1 w-6 h-0.5 bg-amber-600 rounded-full" />
            )}
          </button>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* 3. MOBILE "MÁS" ACTION SHEET / SLIDE-UP DRAWER               */}
      {/* ============================================================ */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[88vh] flex flex-col overflow-hidden border-t border-stone-200 animate-in slide-in-from-bottom-8 duration-200"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Drawer Drag Bar & Header */}
            <div className="pt-3 pb-2 px-5 border-b border-stone-100 flex flex-col">
              <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mb-2" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-display font-bold text-base text-stone-900">
                    Menú de Gestión & Módulos
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    D'Kiram Pastelería Fina • Panel Rápido
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 space-y-4 text-xs pb-10">
              
              {/* CURRENT USER & 1-TAP QUICK SWITCHER */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-bold text-stone-900">{currentUser.name}</div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        Rol: {currentUser.role} • {currentUser.position}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    En Turno
                  </span>
                </div>

                {/* Quick Staff Switch Buttons for Cashier/POS convenience */}
                <div className="pt-2 border-t border-stone-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-stone-400 shrink-0 font-medium">Cambiar:</span>
                  {users.map(u => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => setCurrentUser(u)}
                        className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-semibold transition shrink-0 ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {u.name.split(' ')[0]} ({u.role[0]})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STORE STATUS OVERVIEW (CAJA & CONEXIÓN) */}
              <div className="grid grid-cols-2 gap-2">
                <div 
                  onClick={() => handleSelectTab('cash')}
                  className="cursor-pointer p-3 bg-stone-50 rounded-2xl border border-stone-200 hover:border-amber-300 transition"
                >
                  <div className="text-[10px] text-stone-500 font-medium flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-stone-400" />
                    <span>Estado de Caja</span>
                  </div>
                  <div className="font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${currentCashRegister ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="truncate">
                      {currentCashRegister ? `S/ ${currentCashRegister.expectedCash.toFixed(2)}` : 'Cerrada'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-medium flex items-center gap-1">
                    {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
                    <span>Sincronización</span>
                  </div>
                  <div className="font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="truncate">
                      {isOnline ? 'En Línea' : `${syncQueue.length} pendientes`}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIST OF MODULES & SECTIONS */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block px-1">
                  Módulos del Sistema
                </span>

                {visibleItems.map(item => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`cursor-pointer w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                        isActive
                          ? 'bg-amber-50 border border-amber-200 text-amber-950 font-bold'
                          : 'bg-stone-50 hover:bg-stone-100 border border-stone-200/70 text-stone-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs">{item.label}</div>
                          {item.description && (
                            <div className="text-[10px] text-stone-400 font-normal">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* QUICK ACTIONS: WORD REPORT & CLOSE */}
              <div className="pt-2 border-t border-stone-200">
                <a
                  href="/INFORME_TECNICO_DKIRAM_PASTELERIA.docx"
                  download="INFORME_TECNICO_DKIRAM_PASTELERIA.docx"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 rounded-xl font-bold text-xs transition"
                >
                  <FileDown className="w-4 h-4 text-amber-700" />
                  <span>Descargar Informe Técnico Word (.docx)</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};
