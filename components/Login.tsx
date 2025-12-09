import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, RefreshCw, KeyRound, Mail, Phone, ArrowLeft, CheckCircle, ChevronRight, Building2, HardHat, Smartphone, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'VERIFY' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY' | 'RESET_PASSWORD';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation State for Mascot
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regMethod, setRegMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL'); 
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot Password State
  const [resetTarget, setResetTarget] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Captcha State
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Verification State
  const [verificationCode, setVerificationCode] = useState(''); 
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Generate random captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleRefreshCaptcha = () => {
    generateCaptcha();
    setCaptchaInput('');
  };

  const switchMode = (newMode: AuthMode) => {
    setIsAnimating(true);
    setError('');
    setSuccessMsg('');
    setVerificationCode(''); // Reset OTP input when switching
    setIsPasswordFocused(false); // Reset mascot
    setTimeout(() => {
        setMode(newMode);
        setIsAnimating(false);
    }, 300);
  };

  // --- LOGIN HANDLER ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate Captcha
    if (captchaInput.toUpperCase() !== captchaText) {
      setError('Kode Captcha tidak sesuai.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    if ((username === 'admin' && password === 'admin') || (username === regUsername && password === regPassword && regUsername !== '')) {
      onLogin();
    } else {
      setError('Username atau Password salah.');
      generateCaptcha();
      setCaptchaInput('');
    }
  };

  // --- REGISTER HANDLER ---
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Dynamic Validation based on method
    const isContactValid = regMethod === 'EMAIL' ? regEmail : regPhone;

    if (!regName || !regUsername || !regPassword || !isContactValid) {
      setError(`Mohon lengkapi seluruh data pendaftaran (${regMethod === 'EMAIL' ? 'Email' : 'No. HP'} wajib diisi).`);
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(otp);
    
    // Simulate Sending
    const target = regMethod === 'EMAIL' ? regEmail : regPhone;
    setTimeout(() => {
        alert(`[SISTEM VERIFIKASI]\n\nKode OTP Pendaftaran: ${otp}\n\n(Dikirim ke ${target})`);
    }, 500);
    
    switchMode('VERIFY');
    setSuccessMsg(`Kode OTP telah dikirim ke ${regMethod === 'EMAIL' ? 'email' : 'nomor HP'} Anda.`);
  };

  // --- VERIFICATION HANDLER (REGISTER) ---
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode === generatedCode) {
      alert('Selamat! Akun Anda berhasil diverifikasi.');
      switchMode('LOGIN');
      setUsername(regUsername);
      setPassword(regPassword);
      setSuccessMsg('Akun aktif. Silakan login.');
      setCaptchaInput('');
      generateCaptcha();
    } else {
      setError('Kode OTP salah. Silakan periksa kembali.');
    }
  };

  // --- FORGOT PASSWORD HANDLERS ---
  const handleForgotRequestSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!resetTarget) {
          setError(`Mohon masukkan ${regMethod === 'EMAIL' ? 'alamat email' : 'nomor HP'} yang terdaftar.`);
          return;
      }

      // Simulation: Check if account exists (Simple check against session registered data or just allow for demo)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(otp);

      setTimeout(() => {
          alert(`[RESET PASSWORD]\n\nKode OTP Reset: ${otp}\n\n(Dikirim ke ${resetTarget})`);
      }, 500);

      switchMode('FORGOT_VERIFY');
      setSuccessMsg(`Kode verifikasi dikirim ke ${resetTarget}`);
  };

  const handleForgotVerifySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (verificationCode === generatedCode) {
          switchMode('RESET_PASSWORD');
          setSuccessMsg('Verifikasi berhasil. Silakan buat password baru.');
      } else {
          setError('Kode OTP salah.');
      }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (newPassword.length < 4) {
          setError('Password minimal 4 karakter.');
          return;
      }

      if (newPassword !== confirmNewPassword) {
          setError('Konfirmasi password tidak cocok.');
          return;
      }

      setRegPassword(newPassword);
      if (!regUsername) setRegUsername(username || 'user_demo'); 

      alert('Password berhasil diubah! Silakan login dengan password baru.');
      switchMode('LOGIN');
      setPassword(''); // Clear password field
      setSuccessMsg('Password berhasil diperbarui.');
  };


  const handleResendCode = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(otp);
    
    let target = '';
    if (mode === 'VERIFY') {
        target = regMethod === 'EMAIL' ? regEmail : regPhone;
    } else {
        target = resetTarget;
    }

    alert(`[SISTEM RESEND]\n\nKode OTP Baru: ${otp}\n(Dikirim ke ${target})`);
    setSuccessMsg('Kode verifikasi baru telah dikirim.');
  };

  const getHeaderTitle = () => {
      switch(mode) {
          case 'LOGIN': return 'Selamat Datang';
          case 'REGISTER': return 'Buat Akun Baru';
          case 'VERIFY': return 'Verifikasi Pendaftaran';
          case 'FORGOT_REQUEST': return 'Lupa Password';
          case 'FORGOT_VERIFY': return 'Verifikasi Identitas';
          case 'RESET_PASSWORD': return 'Buat Password Baru';
          default: return '';
      }
  };

  const getHeaderDesc = () => {
      switch(mode) {
          case 'LOGIN': return 'Silakan masuk untuk mengakses dashboard.';
          case 'REGISTER': return 'Lengkapi data diri untuk memulai.';
          case 'VERIFY': return 'Masukkan kode OTP pendaftaran.';
          case 'FORGOT_REQUEST': return 'Masukkan kontak yang terdaftar untuk reset.';
          case 'FORGOT_VERIFY': return 'Masukkan kode OTP untuk reset password.';
          case 'RESET_PASSWORD': return 'Pastikan password aman dan mudah diingat.';
          default: return '';
      }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* LEFT SIDE - VISUAL & BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-10000 hover:scale-105"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2132&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600/90 backdrop-blur-sm p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
                    <ShieldCheck size={28} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">RentalExca Pro</h1>
                    <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Enterprise Solution</p>
                </div>
            </div>

            <div className="max-w-md">
                <div className="flex gap-2 mb-4">
                    <div className="bg-slate-800/50 backdrop-blur-md p-2 rounded-lg border border-slate-700/50">
                        <Building2 className="text-blue-400" size={20}/>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-md p-2 rounded-lg border border-slate-700/50">
                        <HardHat className="text-orange-400" size={20}/>
                    </div>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                    Kelola Aset Alat Berat dengan <span className="text-blue-500">Presisi</span>.
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                    Platform manajemen inventaris dan penyewaan terintegrasi untuk efisiensi bisnis konstruksi Anda.
                </p>
                
                <div className="mt-8 flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                                {String.fromCharCode(64+i)}
                            </div>
                        ))}
                    </div>
                    <p>Dipercaya oleh 500+ Perusahaan</p>
                </div>
            </div>

            <div className="text-slate-500 text-xs">
                &copy; {new Date().getFullYear()} RentalExca Pro Enterprise. All rights reserved.
            </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM CONTAINER */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none"></div>

        <div className={`w-full max-w-[420px] transition-all duration-300 relative ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            
            {/* --- MASCOT ANIMATION (HANDS PULLING HAT) --- */}
            <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 bg-white dark:bg-slate-800 rounded-full shadow-xl border-4 border-slate-100 dark:border-slate-700 overflow-hidden group">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                        {/* Background */}
                        <rect x="0" y="0" width="120" height="120" fill="#f1f5f9" className="dark:fill-slate-700" />

                        {/* Body / Shoulders */}
                        <path d="M20 120 Q60 125 100 120 L100 95 Q60 85 20 95 Z" fill="#3b82f6" /> {/* Kemeja Biru */}
                        <path d="M50 95 L60 120 L70 95" fill="#1e40af" /> {/* Dasi / Kerah */}

                        {/* Head/Face */}
                        <g>
                            {/* Neck */}
                            <rect x="45" y="80" width="30" height="20" fill="#ffdbac" />
                            {/* Face Shape */}
                            <rect x="35" y="40" width="50" height="55" rx="12" fill="#ffdbac" />
                            {/* Ears */}
                            <circle cx="33" cy="65" r="4" fill="#ffdbac" />
                            <circle cx="87" cy="65" r="4" fill="#ffdbac" />
                            
                            {/* Eyes */}
                            <g>
                                <circle cx="50" cy="60" r="4" fill="#1e293b" />
                                <circle cx="70" cy="60" r="4" fill="#1e293b" />
                                {/* Eyebrows */}
                                <path d="M45 53 Q50 50 55 53" stroke="#1e293b" strokeWidth="2" fill="none" />
                                <path d="M65 53 Q70 50 75 53" stroke="#1e293b" strokeWidth="2" fill="none" />
                            </g>

                            {/* Blush / Rona Merah (Malu) */}
                            <g className={`transition-opacity duration-500 delay-100 ${isPasswordFocused ? 'opacity-100' : 'opacity-0'}`}>
                                <ellipse cx="45" cy="70" rx="7" ry="4" fill="#fecaca" opacity="0.6" />
                                <ellipse cx="75" cy="70" rx="7" ry="4" fill="#fecaca" opacity="0.6" />
                            </g>

                            {/* Mouth */}
                            <path d="M53 78 Q60 82 67 78" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </g>

                        {/* Construction Helmet (Animated to slide down) */}
                        <g 
                            className="transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                            transform={isPasswordFocused ? "translate(0, 15)" : "translate(0, 0)"}
                        >
                            {/* Helmet Dome */}
                            <path d="M25 45 C25 15 95 15 95 45" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                            <rect x="25" y="40" width="70" height="10" fill="#ffffff" />
                            {/* Helmet Brim/Visor */}
                            <path d="M20 45 L100 45 L100 52 Q60 56 20 52 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                            
                            {/* Helmet Logo (SNI) */}
                            <rect x="47" y="22" width="26" height="14" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                            <text x="60" y="32" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="800" fill="#1e293b" textAnchor="middle" style={{ userSelect: 'none' }}>SNI</text>
                            
                            {/* Reflection */}
                            <path d="M35 25 Q45 20 50 25" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" fill="none" />
                        </g>

                        {/* Hands (Animated - Slide UP to grab helmet) */}
                        <g 
                            className="transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                            transform={isPasswordFocused ? "translate(0, -65)" : "translate(0, 40)"}
                        >
                            {/* Left Hand - Gripping */}
                            <g transform="translate(30, 120)">
                                <circle cx="0" cy="0" r="10" fill="#ffdbac" stroke="#f1dcb5" strokeWidth="1"/>
                                <path d="M-5 5 Q0 10 5 5" stroke="#e0c09e" strokeWidth="2" fill="none"/>
                            </g>
                            
                            {/* Right Hand - Gripping */}
                            <g transform="translate(90, 120)">
                                <circle cx="0" cy="0" r="10" fill="#ffdbac" stroke="#f1dcb5" strokeWidth="1"/>
                                <path d="M-5 5 Q0 10 5 5" stroke="#e0c09e" strokeWidth="2" fill="none"/>
                            </g>
                        </g>
                    </svg>
                </div>
            </div>

            {/* Dynamic Header */}
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {getHeaderTitle()}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {getHeaderDesc()}
                </p>
            </div>

            {/* Error / Success Alerts */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r flex items-start animate-fade-in">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{error}</div>
                </div>
            )}
            {successMsg && !error && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 text-sm rounded-r flex items-center animate-fade-in">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0"/>
                    {successMsg}
                </div>
            )}

            {/* --- FORM: LOGIN --- */}
            {mode === 'LOGIN' && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <User size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                                placeholder="Masukkan username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                            <button 
                                type="button"
                                onClick={() => switchMode('FORGOT_REQUEST')}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                            >
                                Lupa Password?
                            </button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Captcha */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                         <div className="flex justify-between items-center">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keamanan</label>
                             <div className="flex items-center gap-2 select-none">
                                 <div 
                                    className="bg-white dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-lg font-mono font-bold text-slate-700 dark:text-slate-200 tracking-widest"
                                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '4px 4px' }}
                                 >
                                     {captchaText}
                                 </div>
                                 <button type="button" onClick={handleRefreshCaptcha} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                     <RefreshCw size={16} className="text-slate-500"/>
                                 </button>
                             </div>
                         </div>
                         <div className="relative">
                            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase placeholder:normal-case"
                                placeholder="Ketik kode di atas"
                                required
                            />
                         </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center"
                    >
                        Masuk Sekarang <ChevronRight size={18} className="ml-2" />
                    </button>

                    <div className="text-center pt-2">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Belum memiliki akun? </span>
                        <button 
                            type="button"
                            onClick={() => switchMode('REGISTER')}
                            className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                        >
                            Daftar Gratis
                        </button>
                    </div>
                </form>
            )}

            {/* --- FORM: FORGOT PASSWORD REQUEST --- */}
            {mode === 'FORGOT_REQUEST' && (
                <form onSubmit={handleForgotRequestSubmit} className="space-y-5">
                    <button 
                        type="button" 
                        onClick={() => switchMode('LOGIN')}
                        className="flex items-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1"/> Kembali ke Login
                    </button>

                     {/* RECOVERY METHOD SWITCHER */}
                     <div className="space-y-1">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Metode Pemulihan</label>
                         <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                             <button
                                type="button"
                                onClick={() => { setRegMethod('EMAIL'); setResetTarget(''); }}
                                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                                    regMethod === 'EMAIL' 
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                             >
                                 <Mail size={16} className="mr-2" /> Email
                             </button>
                             <button
                                type="button"
                                onClick={() => { setRegMethod('PHONE'); setResetTarget(''); }}
                                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                                    regMethod === 'PHONE' 
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                             >
                                 <Smartphone size={16} className="mr-2" /> No. HP
                             </button>
                         </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                            {regMethod === 'EMAIL' ? 'Masukkan Email Terdaftar' : 'Masukkan No. HP Terdaftar'}
                        </label>
                        <div className="relative">
                            {regMethod === 'EMAIL' ? (
                                <>
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input
                                        type="email"
                                        value={resetTarget}
                                        onChange={(e) => setResetTarget(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="nama@email.com"
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input
                                        type="tel"
                                        value={resetTarget}
                                        onChange={(e) => setResetTarget(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="0812..."
                                        required
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        Kirim Kode Verifikasi
                    </button>
                </form>
            )}

            {/* --- FORM: FORGOT VERIFY & REGISTRATION VERIFY (SHARED UI STRUCTURE) --- */}
            {(mode === 'VERIFY' || mode === 'FORGOT_VERIFY') && (
                <form onSubmit={mode === 'VERIFY' ? handleVerifySubmit : handleForgotVerifySubmit} className="space-y-6">
                    <button 
                        type="button" 
                        onClick={() => switchMode(mode === 'VERIFY' ? 'REGISTER' : 'FORGOT_REQUEST')}
                        className="flex items-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1"/> Kembali
                    </button>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-800">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Kode OTP 6-digit telah dikirim ke: <br/>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {mode === 'VERIFY' 
                                    ? (regMethod === 'EMAIL' ? regEmail : regPhone) 
                                    : resetTarget
                                }
                            </span>
                        </p>
                    </div>

                    <div className="space-y-2 text-center">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Masukkan Kode OTP</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 dark:text-white transition-all"
                            placeholder="••••••"
                            autoFocus
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 transition-all transform hover:-translate-y-0.5"
                    >
                        {mode === 'VERIFY' ? 'Verifikasi Akun Saya' : 'Verifikasi & Reset Password'}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-slate-500">Belum menerima kode?</p>
                        <button 
                            type="button"
                            onClick={handleResendCode}
                            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 mt-1"
                        >
                            Kirim Ulang OTP
                        </button>
                    </div>
                </form>
            )}

            {/* --- FORM: RESET PASSWORD --- */}
            {mode === 'RESET_PASSWORD' && (
                 <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                     <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex items-start mb-2">
                        <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Silakan buat password baru untuk akun Anda. Jangan gunakan password yang sudah pernah digunakan sebelumnya.
                        </p>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password Baru</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                                placeholder="Minimal 4 karakter"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Konfirmasi Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <CheckCircle size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
                                placeholder="Ulangi password baru"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        Simpan Password Baru
                    </button>
                 </form>
            )}

            {/* --- FORM: REGISTER --- */}
            {mode === 'REGISTER' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <button 
                        type="button" 
                        onClick={() => switchMode('LOGIN')}
                        className="flex items-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1"/> Kembali ke Login
                    </button>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Lengkap</label>
                        <input
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* REGISTRATION METHOD SWITCHER */}
                    <div className="space-y-1">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Metode Pendaftaran</label>
                         <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                             <button
                                type="button"
                                onClick={() => setRegMethod('EMAIL')}
                                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                                    regMethod === 'EMAIL' 
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                             >
                                 <Mail size={16} className="mr-2" /> Email
                             </button>
                             <button
                                type="button"
                                onClick={() => setRegMethod('PHONE')}
                                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                                    regMethod === 'PHONE' 
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                             >
                                 <Smartphone size={16} className="mr-2" /> No. HP
                             </button>
                         </div>
                    </div>

                    {/* CONDITIONAL INPUT: EMAIL OR PHONE */}
                    <div className="space-y-1 animate-fade-in">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                            {regMethod === 'EMAIL' ? 'Alamat Email' : 'Nomor Handphone'}
                        </label>
                        <div className="relative">
                            {regMethod === 'EMAIL' ? (
                                <>
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input
                                        type="email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="nama@email.com"
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input
                                        type="tel"
                                        value={regPhone}
                                        onChange={(e) => setRegPhone(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="0812..."
                                        required
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username</label>
                            <input
                                type="text"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                required
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                            <input
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                         <button
                            type="submit"
                            className="w-full py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition-all shadow-lg"
                        >
                            Daftar & Kirim OTP
                        </button>
                    </div>
                </form>
            )}
            
            {/* Demo Credentials Footer */}
            {mode === 'LOGIN' && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-mono">
                        Demo Access: admin / admin
                    </span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;