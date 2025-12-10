import React, { useState, useRef } from 'react';
import { StoreSettings } from '../types';
import { Save, Upload, X, Building, CreditCard, QrCode } from 'lucide-react';

interface AdminProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
}

const Admin: React.FC<AdminProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
};

export default Admin;