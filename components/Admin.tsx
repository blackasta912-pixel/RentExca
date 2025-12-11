import React, { useState, useRef } from 'react';
import { StoreSettings, User } from '../types';
import { Save, Upload, X, Building, CreditCard, QrCode, Lock, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AdminProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  currentUser: User;
}

const Admin: React.FC<AdminProps> = ({ settings, onUpdateSettings, currentUser }) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PIN Change State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [passwordVerify, setPasswordVerify] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Check if using default PIN
  const isDefaultPin = settings.adminPin === '123456';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Maksimal 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, qrisUrl: reader.result as string }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChangePin = (e: React.FormEvent) => {
      e.preventDefault();
      setPinError('');

      // SECURITY CHECK: Ensure only admin can perform this
      if (currentUser.role !== 'admin') {
          setPinError('Akses Ditolak: Hanya Administrator yang dapat mengubah PIN.');
          return;
      }

      // 1. Verify Password 
      // (Note: In a real app this checks backend. Here we mock it as 'admin' or allow bypass if empty for demo ease, 
      // but strict logic requires the current session password)
      if (passwordVerify !== 'admin') { 
          setPinError('Password akun salah! Verifikasi gagal.');
          return;
      }

      // 2. Validate PIN format
      if (newPin.length !== 6 || isNaN(Number(newPin))) {
          setPinError('PIN harus 6 digit angka.');
          return;
      }

      // 3. Confirm PIN
      if (newPin !== confirmNewPin) {
          setPinError('Konfirmasi PIN tidak cocok.');
          return;
      }

      // 4. Update
      setFormData(prev => ({ ...prev, adminPin: newPin }));
      onUpdateSettings({ ...formData, adminPin: newPin }); // Immediate save for PIN
      
      alert('PIN Admin berhasil diperbarui!');
      setIsPinModalOpen(false);
      setPasswordVerify('');
      setNewPin('');
      setConfirmNewPin('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Pengaturan Toko</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola informasi toko, rekening, dan pembayaran digital.</p>
        </div>
        {isSaved && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in flex items-center">
                <Save size={16} className="mr-2" />
                Perubahan tersimpan!
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Umum */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <Building size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                Informasi Umum
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Toko / Rental</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="Contoh: RentalScaffolding Pro"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor Telepon</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0812-3456-7890"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="info@rental.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
                    <textarea
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="Jl. Raya Utama No. 123..."
                    />
                </div>
            </div>
        </div>

        <div className="space-y-6">
            {/* Keamanan & Akses (ONLY FOR ADMIN) */}
            {currentUser.role === 'admin' ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-1.5 h-full ${isDefaultPin ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                        <ShieldAlert size={20} className={`mr-2 ${isDefaultPin ? 'text-orange-600' : 'text-green-600'}`} />
                        Keamanan & Akses Admin
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-800 dark:text-white">PIN Dashboard Keuangan</p>
                                {isDefaultPin ? (
                                    <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                                        Default
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex items-center">
                                        <CheckCircle2 size={10} className="mr-1"/> Aman
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {isDefaultPin 
                                    ? "Anda menggunakan PIN bawaan (123456). Segera buat baru." 
                                    : "PIN aktif digunakan untuk melindungi laporan keuangan."}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPinModalOpen(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center whitespace-nowrap ${
                                isDefaultPin 
                                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            <KeyRound size={16} className="mr-2" />
                            {isDefaultPin ? 'Buat PIN Baru' : 'Ganti PIN'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Lock size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">Pengaturan Keamanan Terkunci (Hanya Admin)</p>
                    </div>
                </div>
            )}

            {/* Informasi Bank */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                    <CreditCard size={20} className="mr-2 text-green-600 dark:text-green-400" />
                    Rekening Bank
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Bank</label>
                        <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            placeholder="BCA / Mandiri / BRI"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor Rekening</label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Atas Nama</label>
                            <input
                                type="text"
                                name="accountName"
                                value={formData.accountName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* QRIS / QR Code */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                    <QrCode size={20} className="mr-2 text-purple-600 dark:text-purple-400" />
                    QR Code Pembayaran (QRIS)
                </h3>
                
                <div className="flex items-center gap-6">
                    <div className="w-32 h-32 flex-shrink-0 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden flex items-center justify-center">
                        {formData.qrisUrl ? (
                            <img src={formData.qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-xs text-slate-400 text-center px-2">Belum ada QR</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors mb-2 flex items-center justify-center"
                        >
                            <Upload size={16} className="mr-2" /> Upload Gambar QR
                        </button>
                        {formData.qrisUrl && (
                             <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, qrisUrl: '' }))}
                                className="w-full px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center"
                            >
                                <X size={16} className="mr-2" /> Hapus QR
                            </button>
                        )}
                        <p className="text-xs text-slate-400 mt-2">Format: JPG, PNG. Maks 2MB.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
            <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center"
            >
                <Save size={18} className="mr-2" />
                Simpan Pengaturan
            </button>
        </div>
      </form>

      {/* PIN Change Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-slate-200 dark:border-slate-700 animate-scale-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                        <KeyRound size={20} className="mr-2 text-blue-600" />
                        {isDefaultPin ? 'Buat PIN Admin Baru' : 'Ubah PIN Admin'}
                    </h3>
                    <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24}/>
                    </button>
                </div>
                
                <form onSubmit={handleChangePin} className="space-y-4">
                    {pinError && (
                         <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold mb-4">
                             {pinError}
                         </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Verifikasi Password Akun
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                type="password" 
                                placeholder="Masukkan password login Anda"
                                value={passwordVerify}
                                onChange={(e) => setPasswordVerify(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 italic">
                           Ketik <span className="font-mono font-bold bg-slate-100 px-1 rounded">admin</span> untuk demo verifikasi.
                        </p>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                            PIN Baru (6 Digit)
                        </label>
                        <input 
                            type="password" 
                            maxLength={6}
                            placeholder="Contoh: 123456"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white tracking-widest text-center font-bold text-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Konfirmasi PIN Baru
                        </label>
                        <input 
                            type="password" 
                            maxLength={6}
                            placeholder="Ulangi PIN Baru"
                            value={confirmNewPin}
                            onChange={(e) => setConfirmNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white tracking-widest text-center font-bold text-lg"
                            required
                        />
                    </div>

                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg mt-4">
                        Simpan PIN Baru
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Admin;