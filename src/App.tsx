import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { POSScreen } from './components/pos/POSScreen';
import { CashRegisterScreen } from './components/cash/CashRegisterScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { SalesHistoryScreen } from './components/sales/SalesHistoryScreen';
import { ProductsScreen } from './components/products/ProductsScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { ShiftsScreen } from './components/shifts/ShiftsScreen';
import { AuditScreen } from './components/audit/AuditScreen';
import { ReceiptModal } from './components/pos/ReceiptModal';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('pos');
  const { activeReceiptSale, setActiveReceiptSale, currentUser } = useApp();

  // If user role does not have access to current tab, fallback to allowed tab
  const getSafeTab = (): TabType => {
    if (currentUser.role === 'INVENTARIO' && ['pos', 'cash', 'sales-history', 'reports', 'shifts', 'audit'].includes(currentTab)) {
      return 'inventory';
    }
    if (currentUser.role === 'CAJERO' && ['inventory', 'reports', 'shifts', 'audit'].includes(currentTab)) {
      return 'pos';
    }
    return currentTab;
  };

  const activeSafeTab = getSafeTab();

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      <Header />
      <Navigation currentTab={activeSafeTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-24 md:pb-12">
        {activeSafeTab === 'pos' && (
          <POSScreen onGoToCash={() => setCurrentTab('cash')} />
        )}
        {activeSafeTab === 'cash' && (
          <CashRegisterScreen />
        )}
        {activeSafeTab === 'inventory' && (
          <InventoryScreen />
        )}
        {activeSafeTab === 'sales-history' && (
          <SalesHistoryScreen />
        )}
        {activeSafeTab === 'products' && (
          <ProductsScreen />
        )}
        {activeSafeTab === 'reports' && (
          <ReportsScreen />
        )}
        {activeSafeTab === 'shifts' && (
          <ShiftsScreen />
        )}
        {activeSafeTab === 'audit' && (
          <AuditScreen />
        )}
      </main>

      {/* Global Thermal Receipt Modal */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
