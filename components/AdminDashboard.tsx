import React, { useMemo, useState } from 'react';
import { Transaction, Item, StoreSettings, PaymentStatus, ItemStatus } from '../types';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Calendar, FileBarChart, Printer, ChevronLeft, ChevronRight, Lock, ShieldCheck, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface AdminDashboardProps {
  transactions: Transaction[];
  items: Item[];
  storeSettings: StoreSettings;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ transactions, items, storeSettings }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [reportDate, setReportDate] = useState(new Date());

  const CORRECT_PIN = '123456'; // Default PIN

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('PIN salah. Silakan coba lagi.');
      setPin('');
    }
  };

  // Helper to calculate REAL revenue (excluding deposit)
  // Revenue = Cash Received - Deposit. If Cash Received < Deposit, Revenue is 0.
  // Assumes Deposit is paid first.
  const calculateRevenue = (t: Transaction) => {
      const deposit = t.depositAmount || 0;
      const paid = t.amountPaid || 0;
      // Revenue is the portion of payment exceeding the deposit
      return Math.max(0, paid - deposit);
  };

  // --- Statistics Logic ---
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.paymentStatus !== PaymentStatus.UNPAID)
      .reduce((acc, curr) => acc + calculateRevenue(curr), 0);
    
    return { totalIncome };
  }, [transactions]);

  // --- Chart Data Logic ---
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = months.map(m => ({ name: m, income: 0 }));
    
    transactions.forEach(t => {
      const date = new Date(t.startDate);
      const year = date.getFullYear();
      if (year === new Date().getFullYear()) {
          const monthIndex = date.getMonth();
          // Add Real Revenue
          data[monthIndex].income += calculateRevenue(t);
      }
    });
    
    return data;
  }, [transactions]);

  // --- Report Logic ---
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

    const currentIncome = currentMonthTrx.reduce((acc, t) => acc + calculateRevenue(t), 0);
    const prevIncome = prevMonthTrx.reduce((acc, t) => acc + calculateRevenue(t), 0);

    const growth = prevIncome === 0 ? (currentIncome > 0 ? 100 : 0) : ((currentIncome - prevIncome) / prevIncome) * 100;

    // Category Breakdown
    const categoryBreakdown: Record<string, { income: number; count: number }> = {};
    
    currentMonthTrx.forEach(t => {
        const item = items.find(i => i.id === t.itemId);
        if (item) {
            if (!categoryBreakdown[item.category]) {
                categoryBreakdown[item.category] = { income: 0, count: 0 };
            }
            categoryBreakdown[item.category].income += calculateRevenue(t);
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
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; font-size: 14pt; }
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
        </head>
        <body class="p-8 bg-white text-slate-900">
            <div class="max-w-4xl mx-auto">
                <div class="flex justify-between items-start mb-8 border-b-2 border-slate-300 pb-6">
                    <div>
                        <h1 class="text-4xl font-bold text-slate-900 mb-2">${storeSettings.name}</h1>
                        <p class="text-slate-600 text-lg">Sistem Manajemen Rental Profesional</p>
                    </div>
                    <div class="text-right">
                        <p class="text-slate-600 uppercase tracking-widest text-sm font-bold mb-1">Laporan Bulanan</p>
                        <h2 class="text-2xl font-bold text-blue-700">${monthYear}</h2>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-8 mb-8">
                    <div class="bg-slate-50 p-8 rounded-xl border-2 border-slate-300">
                        <p class="text-lg font-semibold text-slate-600 mb-2">Total Pendapatan Bersih</p>
                        <p class="text-sm text-slate-500 mb-1">(Tanpa Uang Jaminan)</p>
                        <p class="text-4xl font-bold text-slate-900">Rp ${reportData.currentIncome.toLocaleString('id-ID')}</p>
                    </div>
                     <div class="bg-slate-50 p-8 rounded-xl border-2 border-slate-300">
                        <p class="text-lg font-semibold text-slate-600 mb-2">Pertumbuhan (MoM)</p>
                        <div class="flex items-end gap-3">
                             <p class="text-4xl font-bold ${reportData.growth >= 0 ? 'text-green-700' : 'text-red-700'}">
                                ${reportData.growth >= 0 ? '+' : ''}${reportData.growth.toFixed(1)}%
                            </p>
                            <p class="text-sm text-slate-500 mb-1.5 font-medium">vs Bulan Lalu</p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-slate-900 mb-4 flex items-center">
                        <span class="w-2 h-8 bg-blue-600 rounded-full mr-3"></span>
                        Rincian Pendapatan Kategori
                    </h3>
                    <table class="w-full text-lg border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-700 uppercase text-sm tracking-wider border-y-2 border-slate-300">
                                <th class="py-4 px-4 text-left font-bold">Kategori</th>
                                <th class="py-4 px-4 text-center font-bold">Jumlah Transaksi</th>
                                <th class="py-4 px-4 text-right font-bold">Pendapatan Bersih</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y-2 divide-slate-100">
                            ${reportData.categories.length > 0 ? reportData.categories.map(cat => `
                                <tr>
                                    <td class="py-4 px-4 text-slate-900 font-semibold">${cat.name}</td>
                                    <td class="py-4 px-4 text-center text-slate-700">${cat.count}</td>
                                    <td class="py-4 px-4 text-right text-slate-900 font-bold">Rp ${cat.income.toLocaleString('id-ID')}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="3" class="py-8 text-center text-slate-500 italic">Tidak ada data transaksi</td></tr>`}
                        </tbody>
                        <tfoot>
                            <tr class="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                                <td class="py-4 px-4" colspan="2">TOTAL</td>
                                <td class="py-4 px-4 text-right text-xl">Rp ${reportData.currentIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="mt-16 text-center text-sm text-slate-500 border-t border-slate-200 pt-6">
                    <p>Dicetak secara otomatis pada ${printedDate}</p>
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

  // --- PIN ACCESS SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Akses Admin</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Masukkan PIN 6 digit untuk mengakses data keuangan.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-center text-2xl font-bold tracking-widest focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                placeholder="••••••"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Buka Akses
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-4 italic">Default PIN: 123456</p>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD CONTENT ---
  return (
    <div className="space-y-8 pb-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-6">
            <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin & Keuangan</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">Laporan pendapatan bersih (diluar deposit)</p>
            </div>
            <button 
                onClick={() => setIsAuthenticated(false)}
                className="text-sm font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            >
                Kunci Kembali
            </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Total Pendapatan */}
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border-l-8 border-l-green-500 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Pendapatan Bersih</p>
                        <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white">Rp {stats.totalIncome.toLocaleString('id-ID')}</h3>
                    </div>
                    <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-2xl text-green-700 dark:text-green-300 shadow-inner">
                        <Wallet size={36} strokeWidth={2.5} />
                    </div>
                </div>
                <div className="flex items-center text-base font-bold text-green-700 dark:text-green-400 relative z-10 bg-green-50 dark:bg-green-900/20 w-fit px-4 py-2 rounded-xl border border-green-100 dark:border-green-800">
                    <ArrowUpRight size={20} className="mr-2" strokeWidth={3} />
                    <span>Arus Kas Lancar</span>
                </div>
            </div>

            {/* Card 2: Chart Summary */}
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border-l-8 border-l-blue-500 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-center">
                 <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Performa Tahun Ini</p>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">Grafik Tersedia</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Lihat detail di bawah</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Grafik Pendapatan</h3>
                <span className="text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">Tahun Ini</span>
            </div>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" className="dark:stroke-slate-600" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fill: '#64748b', fontWeight: 'bold'}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} tick={{fontSize: 14, fill: '#64748b', fontWeight: 'bold'}} />
                    <Tooltip 
                    cursor={{fill: 'transparent'}}
                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        backgroundColor: '#1e293b', 
                        color: '#f8fafc',
                        padding: '16px',
                        fontSize: '16px'
                    }}
                    itemStyle={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}
                    />
                    <Bar dataKey="income" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#3b82f6" className="hover:opacity-80 transition-opacity" />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Report Section */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-slate-200 dark:border-slate-700 pb-8">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
                        <FileBarChart size={32} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan Bulanan</h3>
                        <div className="flex items-center gap-2 text-base font-medium text-slate-600 dark:text-slate-400 mt-1">
                            <Calendar size={18} />
                            <span>Periode: {reportDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1.5 border border-slate-200 dark:border-slate-600">
                        <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-all shadow-sm" aria-label="Bulan Sebelumnya"><ChevronLeft size={24}/></button>
                        <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-all shadow-sm" aria-label="Bulan Berikutnya"><ChevronRight size={24}/></button>
                    </div>
                    <button
                        onClick={handlePrintReport}
                        className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-slate-600 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-500 transition-all shadow-lg text-lg font-bold"
                    >
                        <Printer size={20} className="mr-3" /> Cetak
                    </button>
                </div>
            </div>

            {/* ... Report Grid ... */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 md:col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-blue-100 text-base font-bold mb-2 uppercase tracking-wide">Pendapatan Bersih</p>
                            <h4 className="text-4xl font-extrabold mb-6">Rp {reportData.currentIncome.toLocaleString('id-ID')}</h4>
                            <div className="flex items-center gap-3 text-base bg-white/20 w-fit px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                                {reportData.growth >= 0 ? <ArrowUpRight size={20} strokeWidth={3}/> : <TrendingDown size={20} strokeWidth={3}/>}
                                <span className="font-extrabold">{Math.abs(reportData.growth).toFixed(1)}%</span>
                                <span className="opacity-90 font-medium">vs bulan lalu</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-span-12 md:col-span-8 flex flex-col">
                    <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-4 flex items-center">
                        <PieChartIcon className="mr-2 text-blue-600 dark:text-blue-400" size={24} />
                        Rincian Performa Kategori
                    </h4>

                    {/* PIE CHART SECTION */}
                    <div className="mb-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600 p-4 h-64 flex items-center justify-center relative">
                        {reportData.categories.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={reportData.categories}
                                        dataKey="income"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={40}
                                        fill="#8884d8"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {reportData.categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                         formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                                         contentStyle={{ 
                                            borderRadius: '8px', 
                                            backgroundColor: '#1e293b', 
                                            color: '#fff',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-400 dark:text-slate-500 italic text-sm">Tidak ada data untuk grafik</div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex-1">
                        <table className="w-full text-base text-left">
                            <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold border-b-2 border-slate-200 dark:border-slate-700 uppercase text-sm tracking-wider">
                                <tr>
                                    <th className="py-4 px-6">Kategori</th>
                                    <th className="py-4 px-6 text-center">Transaksi</th>
                                    <th className="py-4 px-6 text-right">Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                {reportData.categories.length > 0 ? (
                                    reportData.categories.map((cat, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                                <span 
                                                    className="w-3 h-3 rounded-full mr-2" 
                                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                ></span>
                                                {cat.name}
                                            </td>
                                            <td className="py-4 px-6 text-center text-slate-700 dark:text-slate-400 font-medium">{cat.count}</td>
                                            <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-slate-100">Rp {cat.income.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400 italic">
                                            Tidak ada transaksi bulan ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;