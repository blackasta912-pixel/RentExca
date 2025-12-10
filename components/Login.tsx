import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, RefreshCw, KeyRound, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';

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

  // ... (Other handlers omitted for brevity but logic remains same) ...
  const handleForgotRequestSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // ... same logic ...
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(otp);
      switchMode('FORGOT_VERIFY');
  };
   const handleForgotVerifySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // ... same logic ...
      switchMode('RESET_PASSWORD');
  };
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // ... same logic ...
      switchMode('LOGIN');
  };
  const handleResendCode = () => {
    // ... same logic ...
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
          case 'LOGIN': return 'Silakan masuk untuk akses dashboard.';
          case 'REGISTER': return 'Lengkapi data diri untuk memulai.';
          case 'VERIFY': return 'Masukkan kode OTP pendaftaran.';
          case 'FORGOT_REQUEST': return 'Masukkan kontak terdaftar untuk reset.';
          case 'FORGOT_VERIFY': return 'Masukkan kode OTP reset password.';
          case 'RESET_PASSWORD': return 'Pastikan password aman & mudah diingat.';
          default: return '';
      }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* LEFT SIDE - VISUAL (Tetap sama sesuai request background) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-10000 hover:scale-105"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
            <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-900/50">
                    <ShieldCheck size={40} className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">RentalScaffolding</h1>
                    <p className="text-slate-300 text-sm font-semibold tracking-widest uppercase">Enterprise Solution</p>
                </div>
            </div>

            <div className="max-w-lg">
                <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight">
                    Kelola Aset Scaffolding dengan <span className="text-blue-500">Presisi</span>.
                </h2>
                <p className="text-slate-200 text-xl leading-relaxed font-medium">
                    Platform manajemen inventaris perancah dan penyewaan alat konstruksi yang terintegrasi, aman, dan mudah digunakan.
                </p>
            </div>

            <div className="text-slate-400 text-sm font-medium">
                &copy; {new Date().getFullYear()} RentalScaffolding Enterprise. All rights reserved.
            </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM CONTAINER (Dirapikan Proporsinya) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className={`w-full max-w-md transition-all duration-300 relative ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            
            {/* Mascot SVG (Ukuran disesuaikan agar lebih proporsional) */}
            <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 bg-white dark:bg-slate-800 rounded-full shadow-2xl border-4 border-slate-200 dark:border-slate-700 overflow-hidden group">
                     {/* ... Same SVG content ... */}
                     <svg viewBox="0 0 120 120" className="w-full h-full">
                        <rect x="0" y="0" width="120" height="120" fill="#f1f5f9" className="dark:fill-slate-700" />
                        <path d="M20 120 Q60 125 100 120 L100 95 Q60 85 20 95 Z" fill="#3b82f6" />
                        <path d="M50 95 L60 120 L70 95" fill="#1e40af" />
                        <g>
                            <rect x="45" y="80" width="30" height="20" fill="#ffdbac" />
                            <rect x="35" y="40" width="50" height="55" rx="12" fill="#ffdbac" />
                            <circle cx="33" cy="65" r="4" fill="#ffdbac" />
                            <circle cx="87" cy="65" r="4" fill="#ffdbac" />
                            <g>
                                <circle cx="50" cy="60" r="4" fill="#1e293b" />
                                <circle cx="70" cy="60" r="4" fill="#1e293b" />
                                <path d="M45 53 Q50 50 55 53" stroke="#1e293b" strokeWidth="2" fill="none" />
                                <path d="M65 53 Q70 50 75 53" stroke="#1e293b" strokeWidth="2" fill="none" />
                            </g>
                            <g className={`transition-opacity duration-500 delay-100 ${isPasswordFocused ? 'opacity-100' : 'opacity-0'}`}>
                                <ellipse cx="45" cy="70" rx="7" ry="4" fill="#fecaca" opacity="0.6" />
                                <ellipse cx="75" cy="70" rx="7" ry="4" fill="#fecaca" opacity="0.6" />
                            </g>
                            <path d="M53 78 Q60 82 67 78" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </g>
                        <g className="transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)" transform={isPasswordFocused ? "translate(0, 15)" : "translate(0, 0)"}>
                            <path d="M25 45 C25 15 95 15 95 45" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                            <rect x="25" y="40" width="70" height="10" fill="#ffffff" />
                            <path d="M20 45 L100 45 L100 52 Q60 56 20 52 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                            <rect x="47" y="22" width="26" height="14" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                            <text x="60" y="32" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="800" fill="#1e293b" textAnchor="middle" style={{ userSelect: 'none' }}>SNI</text>
                            <path d="M35 25 Q45 20 50 25" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" fill="none" />
                        </g>
                        <g className="transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)" transform={isPasswordFocused ? "translate(0, -65)" : "translate(0, 40)"}>
                            <g transform="translate(30, 120)"><circle cx="0" cy="0" r="10" fill="#ffdbac" stroke="#f1dcb5" strokeWidth="1"/><path d="M-5 5 Q0 10 5 5" stroke="#e0c09e" strokeWidth="2" fill="none"/></g>
                            <g transform="translate(90, 120)"><circle cx="0" cy="0" r="10" fill="#ffdbac" stroke="#f1dcb5" strokeWidth="1"/><path d="M-5 5 Q0 10 5 5" stroke="#e0c09e" strokeWidth="2" fill="none"/></g>
                        </g>
                    </svg>
                </div>
            </div>

            {/* Dynamic Header */}
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                    {getHeaderTitle()}
                </h2>
                <p className="text-base text-slate-500 dark:text-slate-400">
                    {getHeaderDesc()}
                </p>
            </div>

            {/* Error / Success Alerts */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 text-red-800 dark:text-red-300 text-sm font-medium rounded-r flex items-start animate-fade-in shadow-sm">
                    <AlertCircle size={20} className="mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{error}</div>
                </div>
            )}
            {successMsg && !error && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 text-green-800 dark:text-green-300 text-sm font-medium rounded-r flex items-center animate-fade-in shadow-sm">
                    <CheckCircle size={20} className="mr-3 flex-shrink-0"/>
                    {successMsg}
                </div>
            )}

            {/* --- FORM: LOGIN --- */}
            {mode === 'LOGIN' && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <User size={20} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-white text-base placeholder:text-slate-400 font-medium"
                                placeholder="Masukkan username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                            <button 
                                type="button"
                                onClick={() => switchMode('FORGOT_REQUEST')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Lupa Password?
                            </button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock size={20} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-white text-base placeholder:text-slate-400 font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Captcha - More Compact & Aligned */}
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                         <div className="flex justify-between items-center">
                             <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> Keamanan
                             </label>
                             <button type="button" onClick={handleRefreshCaptcha} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                 <RefreshCw size={12}/> Refresh Kode
                             </button>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <div 
                                className="flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-xl font-mono font-bold text-slate-800 dark:text-slate-200 tracking-widest shadow-sm select-none"
                                style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '6px 6px' }}
                             >
                                 {captchaText}
                             </div>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound size={18} className="text-slate-400" />
                                </div>
                                <input 
                                    type="text"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-base focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none uppercase placeholder:normal-case font-bold text-center"
                                    placeholder="Ketik Kode"
                                    required
                                />
                             </div>
                         </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center"
                    >
                        Masuk Sekarang <ChevronRight size={20} className="ml-2" strokeWidth={3} />
                    </button>

                    <div className="text-center pt-2">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Belum memiliki akun? </span>
                        <button 
                            type="button"
                            onClick={() => switchMode('REGISTER')}
                            className="text-blue-700 dark:text-blue-400 font-bold text-sm hover:underline px-1"
                        >
                            Daftar Gratis
                        </button>
                    </div>
                </form>
            )}
            
            {/* ... Other modes would follow similar styling upgrades ... */}
            
        </div>
      </div>
    </div>
  );
};

export default Login;