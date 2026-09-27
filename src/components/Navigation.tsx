import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Wallet, 
  Package, 
  FileText, 
  Cake, 
  BarChart3, 
  Users, 
  ShieldCheck 
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
  const { currentUser, cart } = useApp();

  const allNavItems: {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    roles: ('ADMIN' | 'CAJERO' | 'INVENTARIO')[];
    badge?: number;
  }[] = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      icon: <ShoppingCart className="w-4 h-4" />,
      roles: ['ADMIN', 'CAJERO'],
      badge: cart.length > 0 ? cart.reduce((s, i) => s + i.quantity, 0) : undefined,
    },
    {
      id: 'cash',
      label: 'Caja & Arqueo',
      icon: <Wallet className="w-4 h-4" />,
      roles: ['ADMIN', 'CAJERO'],
    },
    {
      id: 'inventory',
      label: 'Inventario',
      icon: <Package className="w-4 h-4" />,
      roles: ['ADMIN', 'INVENTARIO'],
    },
    {
      id: 'sales-history',
      label: 'Ventas Realizadas',
      icon: <FileText className="w-4 h-4" />,
      roles: ['ADMIN', 'CAJERO'],
    },
    {
      id: 'products',
      label: 'Catálogo de Pastelería',
      icon: <Cake className="w-4 h-4" />,
      roles: ['ADMIN', 'INVENTARIO', 'CAJERO'],
    },
    {
      id: 'reports',
      label: 'Reportes & Margen',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      id: 'shifts',
      label: 'Personal & Turnos',
      icon: <Users className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      id: 'audit',
      label: 'Auditoría',
      icon: <ShieldCheck className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
  ];

  // Filter allowed tabs based on role
  const visibleItems = allNavItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="bg-stone-100 border-b border-stone-200 sticky top-16 z-20 overflow-x-auto no-scrollbar shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {visibleItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
              >
                <span>{item.icon}</span>
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
  );
};
