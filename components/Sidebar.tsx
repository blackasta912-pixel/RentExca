import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Users, Package, LogOut, X, Settings } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, isOpen, onCloseMobile }) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'cashier', label: 'Kasir & Transaksi', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventaris Stok', icon: Package },
    { id: 'tenants', label: 'Data Penyewa', icon: Users },
    { id: 'admin', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      <div 
        className={`h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
              <h1 className="text-xl font-bold tracking-tight">RentalExca Pro</h1>
              <p className="text-xs text-slate-400 mt-1">Sistem Manajemen Rental</p>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id);
                  if (window.innerWidth < 768 && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda akan berakhir."
        confirmLabel="Ya, Keluar"
        cancelLabel="Tetap Didalam"
      />
    </>
  );
};

export default Sidebar;