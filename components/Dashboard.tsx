import React, { useMemo, useState } from 'react';
import { Transaction, Item, Tenant, TransactionStatus, PaymentStatus, ItemStatus, StoreSettings } from '../types';
import { Package, AlertCircle, TrendingUp, ChevronLeft, ChevronRight, TrendingDown, Calendar, FileBarChart, Printer, AlertTriangle, AlertOctagon, Layers, ArrowUpRight, Clock, Users, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  items: Item[];
  tenants: Tenant[];
  storeSettings: StoreSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, items, tenants, storeSettings }) => {
  const [reportDate, setReportDate] = useState(new Date());

  // Statistics Logic
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.paymentStatus !== PaymentStatus.UNPAID)
      .reduce((acc, curr) => acc + curr.amountPaid, 0);
    
    const activeRentals = transactions.filter(t => t.status === TransactionStatus.ACTIVE).length;
    
    const overdueRentals = transactions.filter(t => {
       const isLate = new Date(t.endDate) < new Date() && t.status !== TransactionStatus.COMPLETED;
       return isLate || t.status === TransactionStatus.OVERDUE;
    }).length;

    // Calculate Available Stock by Category
    const categoryStockCounts: Record<string, number> = {};
    let totalAvailableStock = 0;

    items.forEach(i => {
        const available = i.stock - i.rentedCount;
        if (available > 0 && i.status !== ItemStatus.MAINTENANCE) {
            categoryStockCounts[i.category] = (categoryStockCounts[i.category] || 0) + available;
            totalAvailableStock += available;
        }
    });

    // Convert to array, sort by count desc
    const categoryStockList = Object.entries(categoryStockCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return { totalIncome, activeRentals, overdueRentals, categoryStockList, totalAvailableStock };
  }, [transactions, items]);

  // Logic for Out of Stock (Critical)
  const outOfStockItems = useMemo(() => {
    return items.filter(i => {
        const available = i.stock - i.rentedCount;
        return available === 0 && i.status !== ItemStatus.MAINTENANCE;
    });
  }, [items]);

  // Logic for Low Stock (Warning: 1 or 2 items left)
  const lowStockItems = useMemo(() => {
    return items.filter(i => {
        const available = i.stock - i.rentedCount;
        return available > 0 && available <= 2 && i.status !== ItemStatus.MAINTENANCE;
    });
  }, [items]);

  // Chart Data Logic
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = months.map(m => ({ name: m, income: 0 }));
    
    transactions.forEach(t => {
      const date = new Date(t.startDate);
      const year = date.getFullYear();
      if (year === new Date().getFullYear()) {
          const monthIndex = date.getMonth();
          data[monthIndex].income += t.amountPaid;
      }
    });
    
    return data;
  }, [transactions]);

  // Report Logic
  const reportData = useMemo(() => {
    const year = reportDate.getFullYear();
    const month = reportDate.getMonth();

    const prevDate = new Date(year, month - 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const currentMonthTrx = transactions.filter(t => {
      const d = new Date(t.startDate);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const prevMonthTrx = transactions.filter(t => {
      const d = new Date(t.startDate);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const currentIncome = currentMonthTrx.reduce((acc, t) => acc + t.amountPaid, 0);
    const prevIncome = prevMonthTrx.reduce((acc, t) => acc + t.amountPaid, 0);

    const growth = prevIncome === 0 ? (currentIncome > 0 ? 100 : 0) : ((currentIncome - prevIncome) / prevIncome) * 100;

    // Category Breakdown
    const categoryBreakdown: Record<string, { income: number; count: number }> = {};
    
    currentMonthTrx.forEach(t => {
        const item = items.find(i => i.id === t.itemId);
        if (item) {
            if (!categoryBreakdown[item.category]) {
                categoryBreakdown[item.category] = { income: 0, count: 0 };
            }
            categoryBreakdown[item.category].income += t.amountPaid;
            categoryBreakdown[item.category].count += 1;
        }
    });

    const categories = Object.entries(categoryBreakdown)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.income - a.income);

    return {
        currentIncome,
        prevIncome,
        growth,
        categories
    };
  }, [transactions, items, reportDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(reportDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setReportDate(newDate);
  };

  const handlePrintReport = () => {
    const monthYear = reportDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const printedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Keuangan - ${monthYear}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body class="p-8 bg-white text-slate-900">
            <div class="max-w-3xl mx-auto">
                <div class="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
                    <div>
                        <h1 class="text-3xl font-bold text-slate-800 mb-1">${storeSettings.name}</h1>
                        <p class="text-slate-500 text-sm">Sistem Manajemen Rental Profesional</p>
                    </div>
                    <div class="text-right">
                        <p class="text-slate-500 uppercase tracking-widest text-xs font-semibold mb-1">Laporan Bulanan</p>
                        <h2 class="text-xl font-bold text-blue-600">${monthYear}</h2>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6 mb-8">
                    <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <p class="text-sm font-medium text-slate-500 mb-2">Total Pendapatan</p>
                        <p class="text-3xl font-bold text-slate-800">Rp ${reportData.currentIncome.toLocaleString('id-ID')}</p>
                    </div>
                     <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <p class="text-sm font-medium text-slate-500 mb-2">Pertumbuhan (MoM)</p>
                        <div class="flex items-end gap-2">
                             <p class="text-3xl font-bold ${reportData.growth >= 0 ? 'text-green-600' : 'text-red-600'}">
                                ${reportData.growth >= 0 ? '+' : ''}${reportData.growth.toFixed(1)}%
                            </p>
                            <p class="text-xs text-slate-400 mb-1.5">vs Bulan Lalu</p>
                        </div>
                    </div>
                </div>

                <div class="mb-8">
                    <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <span class="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
                        Rincian Kategori Barang
                    </h3>
                    <table class="w-full text-sm border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-600 uppercase text-xs tracking-wider border-y border-slate-200">
                                <th class="py-3 px-4 text-left font-semibold">Kategori</th>
                                <th class="py-3 px-4 text-center font-semibold">Jumlah Transaksi</th>
                                <th class="py-3 px-4 text-right font-semibold">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${reportData.categories.length > 0 ? reportData.categories.map(cat => `
                                <tr>
                                    <td class="py-3 px-4 text-slate-800 font-medium">${cat.name}</td>
                                    <td class="py-3 px-4 text-center text-slate-600">${cat.count}</td>
                                    <td class="py-3 px-4 text-right text-slate-800 font-semibold">Rp ${cat.income.toLocaleString('id-ID')}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="3" class="py-8 text-center text-slate-400 italic">Tidak ada data transaksi</td></tr>`}
                        </tbody>
                        <tfoot>
                            <tr class="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                <td class="py-3 px-4" colspan="2">TOTAL</td>
                                <td class="py-3 px-4 text-right">Rp ${reportData.currentIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="mt-16 text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
                    <p>Dicetak secara otomatis pada ${printedDate}</p>
                    <p class="mt-1">&copy; ${new Date().getFullYear()} ${storeSettings.name}. Dokumen ini sah dan dihasilkan oleh sistem komputer.</p>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
  };

  // Alert Logic
  const overdueTransactions = transactions.filter(t => {
      const isLate = new Date(t.endDate) < new Date() && t.status !== TransactionStatus.COMPLETED;
      return isLate || t.status === TransactionStatus.OVERDUE;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ringkasan Bisnis</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pantau performa rental dan stok secara real-time</p>
        </div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
            <Calendar size={16} className="mr-2 text-blue-500" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {/* --- TOP ROW: STATISTICS (REDESIGNED) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Total Pendapatan */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-l-4 border-l-green-500 border-y border-r border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Pendapatan</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Rp {stats.totalIncome.toLocaleString('id-ID')}</h3>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                    <Wallet size={24} />
                </div>
            </div>
            <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-400 relative z-10">
                <ArrowUpRight size={14} className="mr-1" />
                <span>Arus Kas Lancar</span>
            </div>
            {/* Background Icon Decoration */}
            <Wallet size={80} className="absolute -bottom-4 -right-4 text-green-50 dark:text-green-900/10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Card 2: Sedang Disewa */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-l-4 border-l-blue-500 border-y border-r border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sedang Disewa</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.activeRentals} <span className="text-sm font-medium text-slate-400">Unit</span></h3>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <TrendingUp size={24} />
                </div>
            </div>
            <div className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 relative z-10">
                <Users size={14} className="mr-1" />
                <span>Transaksi Aktif</span>
            </div>
            <TrendingUp size={80} className="absolute -bottom-4 -right-4 text-blue-50 dark:text-blue-900/10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Card 3: Stok Tersedia (Interactive Hover) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-l-4 border-l-purple-500 border-y border-r border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-default">
            
            {/* Fixed Header */}
            <div className="flex justify-between items-start mb-2 relative z-20">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Stok Tersedia</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white transition-all group-hover:scale-105 origin-left">
                        {stats.totalAvailableStock} <span className="text-sm font-medium text-slate-400">Unit</span>
                    </h3>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                    <Layers size={24} />
                </div>
            </div>
            
            {/* View Default (Limited List) */}
            <div className="mt-2 relative z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-300 absolute">
                <div className="flex flex-wrap gap-1.5">
                    {stats.categoryStockList.slice(0, 3).map((cat, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                            {cat.name}: {cat.count}
                        </span>
                    ))}
                    {stats.categoryStockList.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            +{stats.categoryStockList.length - 3} Lainnya
                        </span>
                    )}
                </div>
            </div>

            {/* View Hover (Full List) */}
            <div className="absolute left-0 right-0 top-[4.5rem] bottom-0 px-6 pb-4 overflow-y-auto no-scrollbar opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 translate-y-4 group-hover:translate-y-0 bg-gradient-to-b from-transparent via-white/95 to-white dark:via-slate-800/95 dark:to-slate-800">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pt-2">Rincian Lengkap</p>
                 <div className="flex flex-wrap gap-1.5">
                    {stats.categoryStockList.map((cat, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-600 shadow-sm">
                            {cat.name}: {cat.count}
                        </span>
                    ))}
                </div>
            </div>

            {/* Background Icon */}
            <Layers size={80} className="absolute -bottom-4 -right-4 text-purple-50 dark:text-purple-900/10 opacity-50 group-hover:scale-150 group-hover:rotate-12 group-hover:opacity-10 transition-all duration-700 ease-out z-0" />
        </div>

        {/* Card 4: Terlambat */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border-l-4 border-l-red-500 border-y border-r border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Jatuh Tempo</p>
                    <h3 className={`text-2xl font-bold ${stats.overdueRentals > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                        {stats.overdueRentals} <span className="text-sm font-medium text-slate-400">Unit</span>
                    </h3>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                    <AlertCircle size={24} />
                </div>
            </div>
            <div className="flex items-center text-xs font-medium text-red-600 dark:text-red-400 relative z-10">
                {stats.overdueRentals > 0 ? (
                    <>
                        <AlertTriangle size={14} className="mr-1" />
                        <span>Perlu Tindakan Segera</span>
                    </>
                ) : (
                    <>
                        <CheckCircle2 size={14} className="mr-1 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">Semua Aman</span>
                    </>
                )}
            </div>
            <AlertCircle size={80} className="absolute -bottom-4 -right-4 text-red-50 dark:text-red-900/10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>

      {/* --- MIDDLE ROW: CHART & ALERTS --- */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Chart Column */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Grafik Pendapatan</h3>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">Tahun Ini</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e293b', 
                    color: '#f8fafc',
                    padding: '12px'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '13px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                />
                <Bar dataKey="income" radius={[6, 6, 0, 0]} maxBarSize={50}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" className="hover:opacity-80 transition-opacity" />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Column (Combined) */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/20">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                <AlertCircle className="mr-2 text-slate-400" size={18} />
                Status & Peringatan
             </h3>
             <span className="text-xs font-bold bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {outOfStockItems.length + lowStockItems.length + overdueTransactions.length}
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 transition-colors">
             {/* 1. Out of Stock */}
             {outOfStockItems.length > 0 && (
                <div>
                   <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-3 flex items-center">
                       <AlertOctagon size={14} className="mr-1.5" /> Stok Habis
                   </h4>
                   <div className="space-y-2">
                        {outOfStockItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-red-900 dark:text-red-200 truncate">{item.name}</p>
                                    <p className="text-[10px] text-red-700 dark:text-red-400">{item.category}</p>
                                </div>
                                <span className="text-[10px] font-bold bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded">0 Unit</span>
                            </div>
                        ))}
                   </div>
                </div>
             )}

             {/* 2. Overdue Transactions */}
             {overdueTransactions.length > 0 && (
                <div>
                   <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-3 flex items-center">
                       <Clock size={14} className="mr-1.5" /> Terlambat Kembali
                   </h4>
                   <div className="space-y-2">
                        {overdueTransactions.map(t => (
                            <div key={t.id} className="p-3 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-900/50 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate pr-2">{t.itemName}</p>
                                    <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">Telat</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                        <Users size={12} className="mr-1" />
                                        <span className="truncate max-w-[80px]">{tenants.find(tn => tn.id === t.tenantId)?.name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                        {new Date(t.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                    </span>
                                </div>
                            </div>
                        ))}
                   </div>
                </div>
             )}

             {/* 3. Low Stock */}
             {lowStockItems.length > 0 && (
                <div>
                   <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-3 flex items-center">
                       <AlertTriangle size={14} className="mr-1.5" /> Stok Menipis
                   </h4>
                   <div className="space-y-2">
                        {lowStockItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 truncate">{item.name}</p>
                                    <p className="text-[10px] text-orange-700 dark:text-orange-400">{item.category}</p>
                                </div>
                                <span className="text-[10px] font-bold bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded">
                                    {item.stock - item.rentedCount} Tersedia
                                </span>
                            </div>
                        ))}
                   </div>
                </div>
             )}

             {outOfStockItems.length === 0 && overdueTransactions.length === 0 && lowStockItems.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 size={40} className="mb-2 text-green-500 opacity-50" />
                    <p className="text-sm font-medium">Semua berjalan lancar</p>
                    <p className="text-xs">Tidak ada peringatan saat ini</p>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: REPORT SECTION --- */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        {/* Header Report */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-700 pb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20">
                    <FileBarChart size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Laporan Bulanan</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        <Calendar size={14} />
                        <span>Periode: {reportDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-600 dark:text-slate-300 transition-all"><ChevronLeft size={18}/></button>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-600 dark:text-slate-300 transition-all"><ChevronRight size={18}/></button>
                </div>
                <button
                    onClick={handlePrintReport}
                    className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-slate-900 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-all shadow-sm text-sm font-medium"
                >
                    <Printer size={16} className="mr-2" /> Cetak
                </button>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
            {/* Financial Summary Column (4 cols) */}
            <div className="col-span-12 md:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-medium mb-1">Pendapatan Bersih</p>
                        <h4 className="text-3xl font-bold mb-4">Rp {reportData.currentIncome.toLocaleString('id-ID')}</h4>
                        <div className="flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                            {reportData.growth >= 0 ? <ArrowUpRight size={16}/> : <TrendingDown size={16}/>}
                            <span className="font-bold">{Math.abs(reportData.growth).toFixed(1)}%</span>
                            <span className="opacity-80">vs bulan lalu</span>
                        </div>
                    </div>
                    {/* Decorative Rings */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full border-[16px] border-white/10"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full border-[12px] border-white/10"></div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Bulan Lalu</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Rp {reportData.prevIncome.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mt-3">
                        <div 
                            className="bg-indigo-500 h-1.5 rounded-full" 
                            style={{ width: `${reportData.prevIncome > 0 ? Math.min((reportData.currentIncome / reportData.prevIncome) * 100, 100) : 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Table Column (8 cols) */}
            <div className="col-span-12 md:col-span-8">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 dark:text-white">Performa Kategori</h4>
                </div>
                
                {reportData.categories.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-3 px-5">Kategori</th>
                                    <th className="py-3 px-5 text-center">Transaksi</th>
                                    <th className="py-3 px-5 text-right">Pendapatan</th>
                                    <th className="py-3 px-5 text-right hidden sm:table-cell">Kontribusi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                {reportData.categories.map((cat, idx) => {
                                    const percentage = (cat.income / reportData.currentIncome) * 100;
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="py-3 px-5 font-medium text-slate-700 dark:text-slate-200">{cat.name}</td>
                                            <td className="py-3 px-5 text-center text-slate-600 dark:text-slate-400">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-bold">{cat.count}</span>
                                            </td>
                                            <td className="py-3 px-5 text-right font-semibold text-slate-800 dark:text-slate-200">
                                                Rp {cat.income.toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3 px-5 text-right hidden sm:table-cell">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{percentage.toFixed(0)}%</span>
                                                    <div className="w-12 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white">
                                <tr>
                                    <td className="py-3 px-5" colSpan={2}>Total Pendapatan</td>
                                    <td className="py-3 px-5 text-right">Rp {reportData.currentIncome.toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-5 text-right hidden sm:table-cell">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                        <Package size={32} className="mb-2 opacity-50" />
                        <p>Belum ada data transaksi.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;