import React, { useMemo } from 'react';
import { Transaction, Item, Tenant, TransactionStatus, ItemStatus, StoreSettings } from '../types';
import { AlertCircle, TrendingUp, Calendar, AlertTriangle, Layers, Clock, Users, CheckCircle2, ArrowRight, PackageX, Package, User } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  items: Item[];
  tenants: Tenant[];
  storeSettings: StoreSettings;
  onViewAllTransactions?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, items, tenants, storeSettings, onViewAllTransactions }) => {
  // --- STATISTICS LOGIC ---
  const stats = useMemo(() => {
    const activeRentals = transactions.filter(t => t.status === TransactionStatus.ACTIVE).length;
    
    // Items overdue: End date passed AND not completed OR status is explicitly OVERDUE
    const overdueRentals = transactions.filter(t => {
       const isLate = new Date(t.endDate) < new Date() && t.status !== TransactionStatus.COMPLETED;
       return isLate || t.status === TransactionStatus.OVERDUE;
    }).length;

    // Calculate Available Stock Breakdown
    const categoryStockCounts: Record<string, number> = {};
    let totalAvailableStock = 0;

    items.forEach(i => {
        const available = i.stock - i.rentedCount;
        if (available > 0 && i.status !== ItemStatus.MAINTENANCE) {
            categoryStockCounts[i.category] = (categoryStockCounts[i.category] || 0) + available;
            totalAvailableStock += available;
        }
    });

    const categoryStockList = Object.entries(categoryStockCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return { activeRentals, overdueRentals, categoryStockList, totalAvailableStock };
  }, [transactions, items]);

  // --- LISTS LOGIC ---
  
  // 1. Active Transactions (For Main Table)
  const activeTransactions = useMemo(() => {
    return transactions
      .filter(t => t.status === TransactionStatus.ACTIVE || t.status === TransactionStatus.OVERDUE)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) // Sort by due date ascending (soonest first)
      .slice(0, 50); // Increased limit to show scrolling effect
  }, [transactions]);

  // 2. Out of Stock (Critical)
  const outOfStockItems = useMemo(() => {
    return items.filter(i => {
        const available = i.stock - i.rentedCount;
        return available === 0 && i.status !== ItemStatus.MAINTENANCE;
    });
  }, [items]);

  // 3. Low Stock (Warning)
  const lowStockItems = useMemo(() => {
    return items.filter(i => {
        const available = i.stock - i.rentedCount;
        return available > 0 && available <= 2 && i.status !== ItemStatus.MAINTENANCE;
    });
  }, [items]);

  // 4. Overdue Details
  const overdueDetails = useMemo(() => {
      return transactions.filter(t => {
          const isLate = new Date(t.endDate) < new Date() && t.status !== TransactionStatus.COMPLETED;
          return isLate || t.status === TransactionStatus.OVERDUE;
      });
  }, [transactions]);

  // Helper to get Tenant Name
  const getTenantName = (id: string) => tenants.find(t => t.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
           <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Ringkasan Operasional</h2>
           <p className="text-slate-600 dark:text-slate-400 mt-1">
             Halo, Admin! Berikut status toko per hari ini.
           </p>
        </div>
        <div className="flex items-center bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm text-slate-700 dark:text-slate-200 font-semibold text-sm">
            <Calendar size={18} className="mr-3 text-blue-600 dark:text-blue-400" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {/* --- TOP ROW: KEY METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Rentals */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Sedang Disewa</p>
                    <h3 className="text-3xl font-extrabold mt-1">{stats.activeRentals}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp size={24} className="text-white" />
                </div>
            </div>
            <p className="text-blue-100 text-sm font-medium flex items-center">
                <Users size={16} className="mr-2" /> Transaksi Aktif
            </p>
        </div>

        {/* Card 2: Total Stock (With Hover Highlight) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden">
            {/* Default Content (Visible when not hovering) */}
            <div className="transition-opacity duration-300 group-hover:opacity-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Stok Tersedia</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.totalAvailableStock}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 transition-transform">
                        <Layers size={24} />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {stats.categoryStockList.slice(0, 3).map((cat, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                            {cat.name}: {cat.count}
                        </span>
                    ))}
                    {stats.categoryStockList.length > 3 && (
                        <span className="text-xs text-slate-400 font-bold self-center">...</span>
                    )}
                </div>
            </div>

            {/* Hover Content (Overlay List) */}
            <div className="absolute inset-0 bg-white dark:bg-slate-800 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col z-10 translate-y-4 group-hover:translate-y-0">
                 <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                    <p className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider">Rincian Semua Stok</p>
                    <Layers size={14} className="text-slate-400"/>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                    {stats.categoryStockList.map((cat, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm group/item hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{cat.name}</span>
                            <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs">{cat.count}</span>
                        </div>
                    ))}
                    {stats.categoryStockList.length === 0 && (
                        <p className="text-center text-xs text-slate-400 italic mt-4">Stok habis</p>
                    )}
                 </div>
            </div>
        </div>

        {/* Card 3: Issues */}
        <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow relative group ${
            stats.overdueRentals > 0 
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${stats.overdueRentals > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        Perlu Perhatian
                    </p>
                    <h3 className={`text-3xl font-extrabold mt-1 ${stats.overdueRentals > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>
                        {stats.overdueRentals}
                    </h3>
                </div>
                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${stats.overdueRentals > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                    {stats.overdueRentals > 0 ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                </div>
            </div>
            <p className={`text-sm font-medium flex items-center ${stats.overdueRentals > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {stats.overdueRentals > 0 ? 'Transaksi Terlambat' : 'Semua Tepat Waktu'}
            </p>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVE RENTALS MONITOR (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[600px] md:h-auto">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800 sticky top-0 z-20">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                        <Clock className="mr-3 text-blue-600 dark:text-blue-400" size={20} />
                        Monitor Sewa Aktif
                    </h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                        {activeTransactions.length} Aktif
                    </span>
                </div>
                
                {/* --- DESKTOP TABLE VIEW --- */}
                <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto relative no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-700/90 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider shadow-sm backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4">Penyewa</th>
                                <th className="px-6 py-4">Barang</th>
                                <th className="px-6 py-4 text-center">Qty</th>
                                <th className="px-6 py-4">Jatuh Tempo</th>
                                <th className="px-6 py-4 text-center">Sisa Waktu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                            {activeTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        Tidak ada penyewaan aktif saat ini.
                                    </td>
                                </tr>
                            ) : (
                                activeTransactions.map(t => {
                                    const tenantName = getTenantName(t.tenantId);
                                    const dueDate = new Date(t.endDate);
                                    const today = new Date();
                                    const diffTime = dueDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    const isLate = diffDays < 0;
                                    const isUrgent = diffDays <= 2 && diffDays >= 0;

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center mr-3 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                                        {tenantName.charAt(0)}
                                                    </div>
                                                    <span className="truncate max-w-[120px]" title={tenantName}>{tenantName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                                                {t.itemName}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 rounded-lg mx-auto w-fit">
                                                {t.quantity}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                                                {dueDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isLate ? (
                                                    <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
                                                        Terlambat {Math.abs(diffDays)} Hari
                                                    </span>
                                                ) : isUrgent ? (
                                                    <span className="inline-flex items-center text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                                                        {diffDays === 0 ? 'Hari Ini' : `${diffDays} Hari Lagi`}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                                                        {diffDays} Hari
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- MOBILE CARD VIEW --- */}
                <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                    {activeTransactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 italic">
                            Tidak ada penyewaan aktif saat ini.
                        </div>
                    ) : (
                        activeTransactions.map(t => {
                            const tenantName = getTenantName(t.tenantId);
                            const dueDate = new Date(t.endDate);
                            const today = new Date();
                            const diffTime = dueDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const isLate = diffDays < 0;

                            return (
                                <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shrink-0">
                                                {tenantName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{tenantName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{t.id}</p>
                                            </div>
                                        </div>
                                        {isLate ? (
                                            <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-200 dark:border-red-800">
                                                Telat {Math.abs(diffDays)} Hr
                                            </span>
                                        ) : (
                                            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-200 dark:border-green-800">
                                                {diffDays} Hr Lagi
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="pl-[52px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Package size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{t.itemName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                                                Qty: {t.quantity}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                                                <Calendar size={12} className="mr-1" />
                                                Sampai {dueDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center sticky bottom-0 z-20">
                    <button 
                        onClick={onViewAllTransactions}
                        className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center justify-center mx-auto"
                    >
                        Lihat Semua Transaksi <ArrowRight size={16} className="ml-1" />
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: ALERTS & STATUS (Span 1) */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                    <AlertTriangle className="mr-3 text-orange-500" size={20} />
                    Pusat Peringatan
                </h3>

                <div className="space-y-4">
                    {/* Empty State */}
                    {outOfStockItems.length === 0 && overdueDetails.length === 0 && lowStockItems.length === 0 && (
                        <div className="text-center py-8 px-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3 opacity-80" />
                            <p className="font-bold text-green-800 dark:text-green-300 text-sm">Semua Terkendali</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Tidak ada stok kritis atau keterlambatan.</p>
                        </div>
                    )}

                    {/* 1. Out of Stock Alerts */}
                    {outOfStockItems.map(item => (
                        <div key={item.id} className="flex items-start bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border-l-4 border-red-500 shadow-sm">
                            <div className="bg-white dark:bg-red-900 p-2 rounded-lg mr-3 shadow-sm text-red-600 dark:text-red-300">
                                <PackageX size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                                <p className="text-xs font-semibold text-red-600 dark:text-red-300 mt-0.5">Stok Habis (0)</p>
                            </div>
                        </div>
                    ))}

                    {/* 2. Overdue Alerts (Limit to top 3 to save space) */}
                    {overdueDetails.slice(0, 3).map(t => (
                        <div key={t.id} className="flex items-start bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                            <div className="bg-white dark:bg-orange-900 p-2 rounded-lg mr-3 shadow-sm text-orange-600 dark:text-orange-300">
                                <Clock size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{getTenantName(t.tenantId)}</p>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{t.itemName}</p>
                                <p className="text-xs font-bold text-orange-600 dark:text-orange-300 mt-1">
                                    Telat sejak: {new Date(t.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                </p>
                            </div>
                        </div>
                    ))}
                    {overdueDetails.length > 3 && (
                        <p className="text-center text-xs font-bold text-orange-600 dark:text-orange-400 mt-2">
                            +{overdueDetails.length - 3} keterlambatan lainnya
                        </p>
                    )}

                    {/* 3. Low Stock Alerts */}
                    {lowStockItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center min-w-0">
                                <AlertCircle size={16} className="text-yellow-500 mr-2 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
                                Sisa {item.stock - item.rentedCount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;