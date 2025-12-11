import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Tenants from './components/Tenants';
import Cashier from './components/Cashier';
import Login from './components/Login';
import Admin from './components/Admin';
import AdminDashboard from './components/AdminDashboard';
import DepositManager from './components/DepositManager';
import { MOCK_ITEMS, MOCK_TENANTS, MOCK_TRANSACTIONS } from './constants';
import { Item, Tenant, Transaction, User, StoreSettings } from './types';
import { PanelLeft, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme');
      if (savedMode) {
        return savedMode === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Application State (Simulated Backend)
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  // Store Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'RentalScaffolding',
    address: 'Jl. Konstruksi Raya No. 88, Jakarta Industrial Park',
    phone: '0812-3456-7890',
    email: 'info@rentalscaffolding.com',
    bankName: 'BCA',
    accountNumber: '8830-1234-5678',
    accountName: 'RentalScaffolding Corporate',
    qrisUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
    adminPin: '123456' // Default PIN
  });

  // Navigation State
  const [highlightedTenantId, setHighlightedTenantId] = useState<string | null>(null);
  const [cashierInitData, setCashierInitData] = useState<{tab: 'new' | 'history', search: string} | null>(null);

  // Handle Dark Mode Side Effects
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle responsive sidebar on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleNavigateToTenant = (tenantId: string) => {
    setHighlightedTenantId(tenantId);
    setCurrentView('tenants');
  };

  const handleNavigateToTenantHistory = (tenant: Tenant) => {
    setCashierInitData({ tab: 'history', search: tenant.name });
    setCurrentView('cashier');
  };

  const handleViewAllTransactions = () => {
    setCashierInitData({ tab: 'history', search: '' });
    setCurrentView('cashier');
  };

  const handleViewChange = (view: string) => {
    if (view === 'cashier') {
        // Reset cashier filters if navigating manually via sidebar
        setCashierInitData(null);
    }
    setCurrentView(view);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            transactions={transactions} 
            items={items} 
            tenants={tenants} 
            storeSettings={storeSettings} 
            onViewAllTransactions={handleViewAllTransactions}
          />
        );
      case 'inventory':
        return <Inventory items={items} setItems={setItems} />;
      case 'tenants':
        return (
            <Tenants 
                tenants={tenants} 
                setTenants={setTenants} 
                highlightedId={highlightedTenantId}
                onViewHistory={handleNavigateToTenantHistory}
            />
        );
      case 'cashier':
        return (
          <Cashier 
            transactions={transactions} 
            setTransactions={setTransactions} 
            items={items}
            setItems={setItems}
            tenants={tenants}
            onNavigateToTenant={handleNavigateToTenant}
            initialTab={cashierInitData?.tab}
            initialSearchTerm={cashierInitData?.search}
            storeSettings={storeSettings}
          />
        );
      case 'deposit':
        return (
          <DepositManager
            transactions={transactions}
            setTransactions={setTransactions}
            tenants={tenants}
          />
        );
      case 'admin_dashboard':
        return (
          <AdminDashboard
            transactions={transactions} 
            items={items}
            storeSettings={storeSettings}
          />
        );
      case 'admin':
        return (
          <Admin 
            settings={storeSettings}
            onUpdateSettings={setStoreSettings}
            currentUser={user}
          />
        );
      default:
        return (
          <Dashboard 
            transactions={transactions} 
            items={items} 
            tenants={tenants} 
            storeSettings={storeSettings} 
            onViewAllTransactions={handleViewAllTransactions}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative">
      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        onChangeView={handleViewChange} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <main 
        className={`p-4 md:p-8 overflow-y-auto h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-7xl mx-auto pb-20 md:pb-0">
          {/* Header Bar with Toggle Button */}
          <div className="mb-6 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-30 py-2 transition-colors duration-200">
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-4 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                title={isSidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
              >
                <PanelLeft size={20} className={`${!isSidebarOpen && 'rotate-180'} transition-transform duration-300`} />
              </button>
              <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight truncate">{storeSettings.name}</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{user.role === 'admin' ? 'Administrator' : 'Kasir'}</span>
                </div>
                <button
                onClick={toggleDarkMode}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-yellow-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
                >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;