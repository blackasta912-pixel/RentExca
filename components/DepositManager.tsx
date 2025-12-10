import React, { useState } from 'react';
import { Transaction, Tenant } from '../types';
import { Search, Banknote, ArrowRightLeft, CheckCircle2, User, Calendar, Package } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface DepositManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  tenants: Tenant[];
}

const DepositManager: React.FC<DepositManagerProps> = ({ transactions, setTransactions, tenants }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'HELD' | 'RETURNED'>('HELD');
  const [selectedTrxId, setSelectedTrxId] = useState<string | null>(null);

  // Only transactions with depositAmount > 0
  const depositTransactions = transactions.filter(t => t.depositAmount > 0);

  const filteredTransactions = depositTransactions.filter(t => {
    const tenant = tenants.find(tn => tn.id === t.tenantId);
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    
    let matchesFilter = true;
    if (filterStatus === 'HELD') matchesFilter = !t.isDepositReturned;
    if (filterStatus === 'RETURNED') matchesFilter = t.isDepositReturned;

    return matchesSearch && matchesFilter;
  });

  const totalDepositHeld = depositTransactions
    .filter(t => !t.isDepositReturned)
    .reduce((acc, curr) => acc + curr.depositAmount, 0);

  const handleReturnDeposit = () => {
    if (selectedTrxId) {
      setTransactions(prev => prev.map(t => {
        if (t.id === selectedTrxId) {
          return { ...t, isDepositReturned: true };
        }
        return t;
      }));
      setSelectedTrxId(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
           <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manajemen Deposit</h2>
           <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300 mt-1">Kelola uang jaminan penyewa</p>
        </div>
        <div className="w-full xl:w-auto bg-blue-50 dark:bg-blue-900/20 px-4 py-3 md:px-6 md:py-4 rounded-2xl border-2 border-blue-200 dark:border-blue-800 flex items-center shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 md:p-3 rounded-xl mr-3 md:mr-4 text-blue-700 dark:text-blue-300 flex-shrink-0">
                <Banknote size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
                <p className="text-xs md:text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest">Total Deposit Tertahan</p>
                <p className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">Rp {totalDepositHeld.toLocaleString('id-ID')}</p>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder="Cari ID atau nama penyewa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base md:text-lg font-medium"
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            <button 
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${filterStatus === 'ALL' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
                Semua
            </button>
            <button 
                onClick={() => setFilterStatus('HELD')}
                className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center text-sm md:text-base ${filterStatus === 'HELD' ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
                <Banknote size={16} className="mr-2 md:w-[18px] md:h-[18px]" /> Tertahan
            </button>
            <button 
                onClick={() => setFilterStatus('RETURNED')}
                className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center text-sm md:text-base ${filterStatus === 'RETURNED' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
                <CheckCircle2 size={16} className="mr-2 md:w-[18px] md:h-[18px]" /> Selesai
            </button>
        </div>
      </div>

      {/* --- DESKTOP VIEW (Table) --- */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left text-base whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-700/50 border-b-2 border-slate-200 dark:border-slate-600">
                <tr>
                    <th className="px-6 py-5 font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">ID Transaksi</th>
                    <th className="px-6 py-5 font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">Penyewa</th>
                    <th className="px-6 py-5 font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider text-right">Nilai Deposit</th>
                    <th className="px-6 py-5 font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider text-center">Status</th>
                    <th className="px-6 py-5 font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider text-center">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredTransactions.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-lg">
                            Tidak ada data deposit yang sesuai.
                        </td>
                    </tr>
                ) : (
                    filteredTransactions.map(t => {
                        const tenant = tenants.find(tn => tn.id === t.tenantId);
                        return (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-5 font-mono font-bold text-slate-600 dark:text-slate-400">
                                    {t.id}
                                    <div className="text-xs font-normal text-slate-400 mt-1">{new Date(t.startDate).toLocaleDateString('id-ID')}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center font-bold text-slate-900 dark:text-white">
                                        <User size={18} className="mr-2 text-slate-400" />
                                        {tenant?.name || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-slate-500 ml-6 flex items-center mt-1">
                                        <Package size={12} className="mr-1" />
                                        {t.itemName} <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded ml-2 text-xs font-bold">x{t.quantity}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right font-extrabold text-slate-900 dark:text-white text-lg">
                                    Rp {t.depositAmount.toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-5 text-center">
                                    {t.isDepositReturned ? (
                                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                            <CheckCircle2 size={16} className="mr-2" /> Dikembalikan
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                            <Banknote size={16} className="mr-2" /> Tertahan
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-5 text-center">
                                    {!t.isDepositReturned ? (
                                        <button
                                            onClick={() => setSelectedTrxId(t.id)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center mx-auto"
                                        >
                                            <ArrowRightLeft size={16} className="mr-2" /> Kembalikan
                                        </button>
                                    ) : (
                                        <span className="text-slate-400 text-sm font-medium">Selesai</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>

      {/* --- MOBILE VIEW (Card Grid) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
         {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 border-dashed">
                <p className="text-slate-500 dark:text-slate-400 text-base italic">Tidak ada data deposit yang sesuai.
                </p>
            </div>
         ) : (
            filteredTransactions.map(t => {
                const tenant = tenants.find(tn => tn.id === t.tenantId);
                return (
                    <div key={t.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                            <div className="flex flex-col">
                                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded w-fit mb-1">{t.id}</span>
                                <div className="flex items-center text-xs text-slate-400">
                                    <Calendar size={12} className="mr-1" />
                                    {new Date(t.startDate).toLocaleDateString('id-ID')}
                                </div>
                            </div>
                            {t.isDepositReturned ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                    <CheckCircle2 size={12} className="mr-1" /> Selesai
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                    <Banknote size={12} className="mr-1" /> Tertahan
                                </span>
                            )}
                        </div>
                        
                        <div>
                            <div className="flex items-center mb-1">
                                <User size={16} className="text-slate-400 mr-2" />
                                <span className="font-bold text-slate-900 dark:text-white text-base">{tenant?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 ml-6">
                                <Package size={14} className="mr-1.5" />
                                <span className="truncate">{t.itemName} (x{t.quantity})</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                             <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Nilai Deposit</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">Rp {t.depositAmount.toLocaleString('id-ID')}</p>
                             </div>
                             {!t.isDepositReturned && (
                                <button
                                    onClick={() => setSelectedTrxId(t.id)}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center"
                                >
                                    <ArrowRightLeft size={16} className="mr-2" /> Kembalikan
                                </button>
                             )}
                        </div>
                    </div>
                );
            })
         )}
      </div>

      <ConfirmationModal 
        isOpen={!!selectedTrxId}
        onClose={() => setSelectedTrxId(null)}
        onConfirm={handleReturnDeposit}
        title="Kembalikan Deposit"
        message="Apakah Anda yakin ingin menandai deposit ini sebagai DIKEMBALIKAN? Pastikan Anda telah menyerahkan uang tunai/transfer kepada penyewa."
        confirmLabel="Ya, Kembalikan"
        cancelLabel="Batal"
      />
    </div>
  );
};

export default DepositManager;