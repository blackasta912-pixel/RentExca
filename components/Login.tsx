import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, Lock, Mail, HardHat, CheckCircle2, Smartphone, MessageSquare, ArrowLeft, RefreshCw, Shield, ChevronRight, LayoutGrid, KeyRound, AlertCircle, Timer, Edit2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // View State: 'selection' (Choose Role) or 'auth' (Login/Register/Forgot Form)
  const [viewState, setViewState] = useState<'selection' | 'auth'>('selection');
  
  // Expanded activeTab to include 'forgot'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Registration States
  const [regStep, setRegStep] = useState<1 | 2>(1); // 1: Input Data, 2: Verification (OTP)
  const [regMethod, setRegMethod] = useState<'email' | 'phone'>('email');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'cashier'>('admin'); // Used for logic context
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0); // Timer for resend button

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Check Contact, 2: Reset Password
  const [resetContact, setResetContact] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // --- CAPTCHA STATE (ALPHANUMERIC) ---
  const generateCaptcha = () => {
    // Simple Alphanumeric Set (Readable)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  
  // Ref for auto-focusing
  const captchaInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    contact: '', // Holds email or phone based on regMethod
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Background Image (Scaffolding/Construction theme)
  const BG_IMAGE = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop";

  // Reset Captcha when tab changes
  useEffect(() => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError(false);
  }, [activeTab, viewState]);

  // Handle Resend Timer Countdown
  useEffect(() => {
    let interval: any;
    if (regStep === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, resendTimer]);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError(false);
    // Auto focus back to input
    captchaInputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelection = (role: 'admin' | 'cashier') => {
      setSelectedRole(role);
      setViewState('auth');
      setActiveTab('login'); // Always default to login first
      // Optional: Clear form or prepopulate for demo purposes
      setFormData({ username: '', password: '', fullName: '', contact: '' });
  };

  const handleBackToSelection = () => {
      if (activeTab === 'forgot') {
          setActiveTab('login');
          setForgotStep(1);
          setResetContact('');
          setNewPassword('');
          setConfirmNewPassword('');
          return;
      }
      setViewState('selection');
      setRegisterSuccess(false);
      setRegStep(1);
  };

  const handleAdminLogin = () => {
    onLogin({
      username: 'admin',
      name: 'Admin Utama',
      role: 'admin'
    });
  };

  const handleCashierLogin = () => {
    onLogin({
      username: 'cashier',
      name: 'Kasir Shift 1',
      role: 'cashier'
    });
  };

  // Step 1: Send OTP / Proceed to Verification
  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnimating(true);
    
    // Simulate API delay for sending OTP
    setTimeout(() => {
        setIsAnimating(false);
        setRegStep(2); // Move to OTP step
        setResendTimer(30); // Start 30s countdown
    }, 1500);
  };

  const handleResendOtp = () => {
      setResendTimer(30);
      // Logic to resend OTP via API would go here
      alert(`Kode verifikasi baru telah dikirim ke ${formData.contact}`);
  };

  // Step 2: Verify OTP and Finalize Registration
  const handleVerifyOtp = (e: React.FormEvent) => {
      e.preventDefault();
      setIsAnimating(true);

      // Simulate verification
      setTimeout(() => {
        setRegisterSuccess(true);
        setIsAnimating(false);
        // Auto switch back to login after 2 seconds
        setTimeout(() => {
            setRegisterSuccess(false);
            setRegStep(1);
            setOtpCode('');
            setFormData({ ...formData, contact: '', password: '', fullName: '' });
            setActiveTab('login');
        }, 2000);
      }, 1500);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // Captcha Validation (String Check) - Kept only for Login
      if (captchaInput.toUpperCase() !== captchaCode) {
        setCaptchaError(true);
        setCaptchaCode(generateCaptcha()); // Reset code on error
        setCaptchaInput('');
        captchaInputRef.current?.focus(); // Focus back to input on error
        return;
      }

      // Mock validation logic based on input or selected role
      if (selectedRole === 'admin') {
          handleAdminLogin();
      } else {
          handleCashierLogin();
      }
  };

  // --- FORGOT PASSWORD HANDLERS ---
  
  const handleForgotCheckContact = (e: React.FormEvent) => {
      e.preventDefault();
      setResetLoading(true);
      
      // Simulate checking database
      setTimeout(() => {
          setResetLoading(false);
          setForgotStep(2); // Move to password input
      }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmNewPassword) {
          alert("Password tidak cocok!");
          return;
      }
      
      setResetLoading(true);
      
      // Simulate updating password
      setTimeout(() => {
          setResetLoading(false);
          setResetSuccess(true);
          
          // Redirect to login after success
          setTimeout(() => {
              setResetSuccess(false);
              setForgotStep(1);
              setResetContact('');
              setNewPassword('');
              setConfirmNewPassword('');
              setActiveTab('login');
          }, 2500);
      }, 1500);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-900">
       {/* Background Image with Overlay */}
       <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${BG_IMAGE}')` }}
       >
         <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]"></div>
       </div>

       {/* Main Card Container */}
       <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-700/50 animate-scale-up">
          
          {/* Left Side: Visual Branding */}
          <div className="w-full md:w-5/12 bg-blue-600 relative overflow-hidden flex flex-col justify-between p-8 md:p-12 text-white">
             {/* Pattern Overlay */}
             <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 opacity-90"></div>
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
             
             {/* Content */}
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
                        <LayoutGrid size={28} className="text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-wide">RentalScaffolding</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                    Sistem Manajemen Profesional
                </h2>
                <p className="text-blue-100 text-lg leading-relaxed">
                    Solusi terintegrasi untuk pengelolaan stok, penyewaan, dan laporan keuangan bisnis scaffolding Anda.
                </p>
             </div>

             <div className="relative z-10 mt-8">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                    <div className="bg-yellow-400 p-2 rounded-lg text-slate-900">
                        <HardHat size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Standar Keamanan Tinggi</p>
                        <p className="text-xs text-blue-100 opacity-80">Memastikan setiap unit terdata dengan baik.</p>
                    </div>
                </div>
                <p className="text-xs text-blue-200 mt-6 font-medium">
                    &copy; {new Date().getFullYear()} RentalScaffolding Enterprise System
                </p>
             </div>
          </div>

          {/* Right Side: Dynamic Content */}
          <div className="w-full md:w-7/12 p-8 md:p-12 bg-white dark:bg-slate-900 flex flex-col justify-center relative">
             
             {/* 
                VIEW 1: SELECTION SCREEN 
             */}
             {viewState === 'selection' && (
                 <div className="animate-fade-in w-full max-w-md mx-auto">
                     <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Selamat Datang</h1>
                     <p className="text-slate-500 dark:text-slate-400 mb-8">Silakan pilih akses untuk melanjutkan.</p>

                     <div className="grid grid-cols-1 gap-4">
                         <button 
                            onClick={() => handleRoleSelection('admin')}
                            className="group relative flex items-center p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-300 text-left"
                         >
                             <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 mr-5 group-hover:scale-110 transition-transform">
                                 <ShieldCheck size={32} className="text-blue-600 dark:text-blue-400" />
                             </div>
                             <div className="flex-1">
                                 <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Masuk Sebagai Admin</h3>
                                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola stok, keuangan, dan pengaturan.</p>
                             </div>
                             <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                         </button>

                         <button 
                            onClick={() => handleRoleSelection('cashier')}
                            className="group relative flex items-center p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all duration-300 text-left"
                         >
                             <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 mr-5 group-hover:scale-110 transition-transform">
                                 <UserIcon size={32} className="text-green-600 dark:text-green-400" />
                             </div>
                             <div className="flex-1">
                                 <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">Masuk Sebagai Kasir</h3>
                                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Proses transaksi dan data penyewa.</p>
                             </div>
                             <ChevronRight className="text-slate-300 group-hover:text-green-500 transition-colors" />
                         </button>
                     </div>
                 </div>
             )}

             {/* 
                VIEW 2: AUTH SCREEN (Login/Register/Forgot Form) 
             */}
             {viewState === 'auth' && (
                 <div className="max-w-md w-full mx-auto mt-10 md:mt-0 animate-scale-up">
                    
                    {/* Back Button */}
                    <button 
                        onClick={handleBackToSelection}
                        className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft size={18} className="mr-2" /> 
                        {activeTab === 'forgot' ? 'Kembali Login' : 'Kembali Pilih Akses'}
                    </button>

                    {/* Header Text */}
                    {!registerSuccess && !resetSuccess && (
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {activeTab === 'login' 
                                    ? `Login ${selectedRole === 'admin' ? 'Administrator' : 'Kasir'}`
                                    : activeTab === 'register' && regStep === 1 
                                        ? 'Buat Akun Baru' 
                                        : activeTab === 'forgot'
                                            ? 'Reset Password'
                                            : 'Verifikasi Akun'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">
                                {activeTab === 'login' 
                                    ? 'Silakan masukkan kredensial Anda untuk masuk.' 
                                    : activeTab === 'forgot'
                                        ? (forgotStep === 1 ? 'Masukkan kontak terdaftar untuk pemulihan.' : 'Buat password baru untuk akun Anda.')
                                        : regStep === 1
                                            ? 'Daftarkan toko atau cabang baru Anda.'
                                            : `Masukkan kode 6 digit yang telah dikirim ke ${regMethod === 'email' ? 'Email' : 'WhatsApp'} Anda.`}
                            </p>
                        </div>
                    )}

                    {/* Tab Switcher */}
                    {!registerSuccess && !resetSuccess && regStep === 1 && activeTab !== 'forgot' && (
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                            <button 
                                onClick={() => setActiveTab('login')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'login' 
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-md' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Masuk
                            </button>
                            <button 
                                onClick={() => setActiveTab('register')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'register' 
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-md' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Daftar
                            </button>
                        </div>
                    )}

                    {/* --- CONTENT SWITCER --- */}
                    {activeTab === 'forgot' ? (
                        // --- FORGOT PASSWORD FLOW ---
                        resetSuccess ? (
                            <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-2xl border border-green-200 dark:border-green-800 text-center animate-scale-up mt-10">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-300 shadow-inner">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Password Diperbarui!</h3>
                                <p className="text-slate-500 dark:text-slate-400">Silakan login kembali menggunakan password baru Anda.</p>
                                <div className="mt-6 flex items-center justify-center text-sm text-slate-400">
                                    <RefreshCw size={16} className="mr-2 animate-spin" /> Mengalihkan ke Login...
                                </div>
                            </div>
                        ) : forgotStep === 1 ? (
                            // Step 1: Input Contact
                            <form onSubmit={handleForgotCheckContact} className="space-y-5 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email / No. HP Terdaftar</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input 
                                            required
                                            type="text"
                                            value={resetContact}
                                            onChange={(e) => setResetContact(e.target.value)}
                                            placeholder="Contoh: user@email.com"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 flex items-center">
                                        <AlertCircle size={12} className="mr-1" />
                                        Kami akan mengirimkan tautan verifikasi ke kontak ini.
                                    </p>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={resetLoading || !resetContact}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resetLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : 'Lanjut Verifikasi'}
                                </button>
                            </form>
                        ) : (
                            // Step 2: Input New Password
                            <form onSubmit={handleResetPassword} className="space-y-5 animate-scale-up">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl mb-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Reset untuk: <span className="font-bold text-slate-800 dark:text-white">{resetContact}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password Baru</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input 
                                            required
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Masukkan password baru"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Konfirmasi Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input 
                                            required
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            placeholder="Ulangi password baru"
                                            className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-4 outline-none transition-all dark:text-white font-medium ${
                                                confirmNewPassword && newPassword !== confirmNewPassword 
                                                ? 'border-red-500 focus:ring-red-500/20' 
                                                : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                                            }`}
                                        />
                                    </div>
                                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                                        <p className="text-xs text-red-500 mt-1 font-bold">Password tidak cocok.</p>
                                    )}
                                </div>

                                <button 
                                    type="submit"
                                    disabled={resetLoading || !newPassword || newPassword !== confirmNewPassword}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resetLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : 'Simpan Password Baru'}
                                </button>
                            </form>
                        )
                    ) : activeTab === 'login' ? (
                        // --- LOGIN FORM ---
                        <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Username</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input 
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan username"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveTab('forgot')}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        Lupa Password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input 
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                    />
                                </div>
                            </div>

                            {/* Captcha Field - INLINED TO FIX FOCUS */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Kode Keamanan</label>
                                     {captchaError && <span className="text-xs font-bold text-red-500 animate-pulse">Kode salah!</span>}
                                </div>
                                
                                <div className="flex gap-3 h-14">
                                    {/* Visual Captcha Box */}
                                    <div 
                                        className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden select-none border-2 border-slate-200 dark:border-slate-600"
                                        style={{ 
                                            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' 
                                        }}
                                    >
                                        {/* Clean, big text without blur */}
                                        <div className="text-3xl font-mono font-black tracking-[0.5em] text-slate-800 dark:text-white z-10 skew-x-3 drop-shadow-sm">
                                            {captchaCode}
                                        </div>
                                        
                                        {/* Subtle Strike-through line */}
                                        <div className="absolute w-full h-0.5 bg-slate-400/30 rotate-12 top-1/2 left-0 pointer-events-none"></div>
                                    </div>
                                    
                                    {/* Refresh Button */}
                                    <button 
                                        type="button"
                                        onClick={handleRefreshCaptcha}
                                        className="px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-600"
                                        title="Ganti Kode"
                                    >
                                        <RefreshCw size={20} />
                                    </button>
                                </div>
                                
                                {/* Input Field */}
                                <div className="relative group">
                                     <Shield className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${captchaError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} size={20} />
                                    <input 
                                        ref={captchaInputRef}
                                        type="text"
                                        value={captchaInput}
                                        onChange={(e) => {
                                            // Allow only alphanumeric input and limit length
                                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                            if (val.length <= 4) {
                                                setCaptchaInput(val);
                                                setCaptchaError(false);
                                            }
                                        }}
                                        maxLength={4}
                                        autoComplete="off"
                                        placeholder="Ketik 4 karakter di atas"
                                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl focus:ring-4 outline-none transition-all dark:text-white font-bold text-lg uppercase tracking-widest ${
                                            captchaError 
                                            ? 'border-red-500 focus:ring-red-500/20 focus:border-red-600 placeholder:text-red-300 text-red-600' 
                                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                                        }`}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 text-base"
                            >
                                Masuk Aplikasi
                            </button>

                             {/* Demo Login Shortcuts (Hidden for production simplicity, but kept for demo ease) */}
                            <div className="mt-4 text-center">
                                <button
                                    type="button" 
                                    onClick={selectedRole === 'admin' ? handleAdminLogin : handleCashierLogin}
                                    className="text-xs text-slate-400 hover:text-blue-600 underline"
                                >
                                    (Demo: Klik untuk auto-login sebagai {selectedRole})
                                </button>
                            </div>

                        </form>
                    ) : (
                        // --- REGISTER FLOW ---
                        <>
                            {registerSuccess ? (
                                // SUCCESS STATE
                                <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-2xl border border-green-200 dark:border-green-800 text-center animate-scale-up mt-10">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-300 shadow-inner">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Akun Terverifikasi!</h3>
                                    <p className="text-slate-500 dark:text-slate-400">Akun Anda berhasil dibuat sebagai <span className="font-bold text-green-600 dark:text-green-400 capitalize">{selectedRole}</span>.</p>
                                    <div className="mt-6 flex items-center justify-center text-sm text-slate-400">
                                        <RefreshCw size={16} className="mr-2 animate-spin" /> Mengalihkan...
                                    </div>
                                </div>
                            ) : regStep === 1 ? (
                                // STEP 1: INPUT DATA
                                <form onSubmit={handleRegisterStep1} className="space-y-4 animate-fade-in">
                                    <div className="hidden">
                                        {/* Hidden Role Selector since it's already selected in previous screen, 
                                            but kept in state logic if needed */}
                                        <input type="hidden" value={selectedRole} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                            <input 
                                                required
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                placeholder="Nama Lengkap Anda"
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Metode Daftar</label>
                                            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => { setRegMethod('email'); setFormData({...formData, contact: ''}) }}
                                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${regMethod === 'email' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    Email
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setRegMethod('phone'); setFormData({...formData, contact: ''}) }}
                                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${regMethod === 'phone' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-300 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    No. HP
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            {regMethod === 'email' ? (
                                                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                            ) : (
                                                 <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={20} />
                                            )}
                                            <input 
                                                required
                                                type={regMethod === 'email' ? 'email' : 'tel'}
                                                name="contact"
                                                value={formData.contact}
                                                onChange={handleInputChange}
                                                placeholder={regMethod === 'email' ? "contoh@email.com" : "0812-xxxx-xxxx (WhatsApp)"}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                            <input 
                                                required
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Buat password kuat"
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Captcha Field Removed for Registration */}

                                    <button 
                                        type="submit"
                                        disabled={isAnimating}
                                        className="w-full bg-slate-800 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 text-base flex justify-center items-center mt-2"
                                    >
                                        {isAnimating ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Kirim Kode Verifikasi <MessageSquare size={18} className="ml-2" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                // STEP 2: VERIFICATION (OTP)
                                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-scale-up">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col items-center text-center">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-3 text-blue-600 dark:text-blue-300">
                                            {regMethod === 'email' ? <Mail size={24} /> : <Smartphone size={24} />}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                            Masukkan kode 6 digit yang telah dikirim ke:
                                        </p>
                                        <p className="font-bold text-slate-900 dark:text-white text-lg mt-1 break-all px-4">
                                            {formData.contact}
                                        </p>
                                        <button 
                                            type="button"
                                            onClick={() => setRegStep(1)}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-3 font-bold flex items-center"
                                        >
                                            <Edit2 size={12} className="mr-1" /> Ubah {regMethod === 'email' ? 'Email' : 'Nomor'}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 text-center uppercase tracking-widest">
                                            Kode Verifikasi (OTP)
                                        </label>
                                        <div className="relative">
                                            <input 
                                                required
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="------"
                                                className="w-full px-4 py-4 text-center text-4xl tracking-[0.5em] font-extrabold bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700"
                                                autoFocus
                                            />
                                        </div>
                                        <p className="text-xs text-center text-slate-400 mt-3 flex justify-center items-center">
                                            <ShieldCheck size={14} className="mr-1.5" /> 
                                            Jangan berikan kode ini kepada siapa pun.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <button 
                                            type="submit"
                                            disabled={isAnimating || otpCode.length < 6}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 text-base flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                        >
                                            {isAnimating ? (
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Verifikasi Akun <CheckCircle2 size={18} className="ml-2" />
                                                </>
                                            )}
                                        </button>
                                        
                                        <div className="flex items-center justify-between text-sm px-1">
                                            <span className="text-slate-500 dark:text-slate-400">Belum terima kode?</span>
                                            {resendTimer > 0 ? (
                                                <span className="font-bold text-slate-400 flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <Timer size={14} className="mr-1.5 animate-pulse" /> 
                                                    Kirim Ulang ({resendTimer}s)
                                                </span>
                                            ) : (
                                                <button 
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center transition-colors"
                                                >
                                                    <RefreshCw size={14} className="mr-1.5" /> Kirim Ulang Kode
                                                </button>
                                            )}
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => setRegStep(1)}
                                            className="w-full mt-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold py-3 rounded-xl transition-all text-sm flex justify-center items-center"
                                        >
                                            <ArrowLeft size={16} className="mr-2" /> Kembali ke Data Diri
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                 </div>
             )}

          </div>
       </div>
    </div>
  );
};

export default Login;