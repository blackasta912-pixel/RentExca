import React, { useState, useEffect } from 'react';
import { Tenant } from '../types';
import { Plus, Search, Edit2, Trash2, Phone, MapPin, Mail, History, ShieldAlert } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface TenantsProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  highlightedId?: string | null;
  onViewHistory?: (tenant: Tenant) => void;
}

const Tenants: React.FC<TenantsProps> = ({ tenants, setTenants, highlightedId, onViewHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  
  // Local state to manage the temporary highlight effect
  const [tempHighlightId, setTempHighlightId] = useState<string | null>(null);

  // Effect to handle scrolling and highlighting when highlightedId changes
  useEffect(() => {
    if (highlightedId) {
      setTempHighlightId(highlightedId);
      
      // Allow a small delay for rendering to complete/search to clear if needed
      setTimeout(() => {
        const element = document.getElementById(`tenant-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Remove the highlight effect after a few seconds
      const timer = setTimeout(() => {
        setTempHighlightId(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  const handleOpenModal = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData(tenant);
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        ktp: '',
        phone: '',
        emergencyContact: '',
        address: '',
        email: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      setTenants(tenants.map(t => t.id === editingTenant.id ? { ...t, ...formData } as Tenant : t));
    } else {
      const newTenant = { ...formData, id: Date.now().toString() } as Tenant;
      setTenants([...tenants, newTenant]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTenantId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteTenantId) {
      setTenants(tenants.filter(t => t.id !== deleteTenantId));
      setDeleteTenantId(null);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Data Penyewa</h2>
           <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">Kelola informasi pelanggan dan kontak</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-bold text-lg"
        >
          <Plus size={24} className="mr-2" />
          Tambah Penyewa
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search size={24} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau no. telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTenants.map((tenant) => (
          <div 
            key={tenant.id} 
            id={`tenant-${tenant.id}`}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700 ${
              tempHighlightId === tenant.id ? 'ring-4 ring-blue-500/50 bg-blue-50 dark:bg-blue-900/20 shadow-xl scale-105' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-2xl border border-blue-200 dark:border-blue-800">
                {tenant.name.charAt(0)}
              </div>
              <div className="flex space-x-2">
                 {onViewHistory && (
                    <button 
                        onClick={() => onViewHistory(tenant)}
                        className="p-2 text-slate-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-transparent hover:border-green-200"
                        title="Lihat Riwayat Transaksi"
                    >
                        <History size={22} />
                    </button>
                 )}
                <button 
                  onClick={() => handleOpenModal(tenant)}
                  className="p-2 text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                  title="Edit Data"
                >
                  <Edit2 size={22} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(tenant.id)}
                  className="p-2 text-slate-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  title="Hapus Data"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{tenant.name}</h3>
            <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 mb-6 border border-slate-200 dark:border-slate-600">
                KTP: {tenant.ktp}
            </div>
            
            <div className="space-y-4 text-base text-slate-700 dark:text-slate-200">
              <div className="flex items-center">
                <Phone size={20} className="mr-3 text-slate-400" />
                <span className="font-medium">{tenant.phone}</span>
              </div>
              {tenant.emergencyContact && (
                 <div className="flex items-center text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/30 px-3 py-2 rounded-lg w-full border border-orange-200 dark:border-orange-800/50">
                    <ShieldAlert size={18} className="mr-2 flex-shrink-0" />
                    <span className="text-sm font-bold">Darurat: {tenant.emergencyContact}</span>
                 </div>
              )}
              <div className="flex items-center">
                <Mail size={20} className="mr-3 text-slate-400" />
                <span className="break-all">{tenant.email}</span>
              </div>
              <div className="flex items-start">
                <MapPin size={20} className="mr-3 text-slate-400 mt-1 flex-shrink-0" />
                <span className="flex-1 leading-relaxed">{tenant.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-8 max-h-[95vh] overflow-y-auto border-2 border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-200 pb-4">
                {editingTenant ? 'Edit Data Penyewa' : 'Tambah Penyewa Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-medium"
                />
              </div>
              <div>
                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2">
                  No. KTP / Identitas <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.ktp}
                  onChange={e => setFormData({...formData, ktp: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2">
                    No. Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2">
                    No. HP Darurat
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact || ''}
                    onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                    placeholder="Keluarga/Kerabat"
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-medium"
                  />
                </div>
              </div>
              <div>
                 <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                 <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-medium"
                  />
              </div>
              <div>
                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-medium"
                />
              </div>
              
              <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteTenantId}
        onClose={() => setDeleteTenantId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Penyewa"
        message="Apakah Anda yakin ingin menghapus data penyewa ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};

export default Tenants;