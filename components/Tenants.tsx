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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Data Penyewa</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Tambah Penyewa
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau no. telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <div 
            key={tenant.id} 
            id={`tenant-${tenant.id}`}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:shadow-md transition-all duration-500 ${
              tempHighlightId === tenant.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                {tenant.name.charAt(0)}
              </div>
              <div className="flex space-x-1">
                 {onViewHistory && (
                    <button 
                        onClick={() => onViewHistory(tenant)}
                        className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                        title="Lihat Riwayat Transaksi"
                    >
                        <History size={16} />
                    </button>
                 )}
                <button 
                  onClick={() => handleOpenModal(tenant)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Edit Data"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(tenant.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Hapus Data"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{tenant.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">KTP: {tenant.ktp}</p>
            
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-slate-400" />
                <span>{tenant.phone}</span>
              </div>
              {tenant.emergencyContact && (
                 <div className="flex items-center text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded w-fit">
                    <ShieldAlert size={14} className="mr-2" />
                    <span className="text-xs font-semibold">Darurat: {tenant.emergencyContact}</span>
                 </div>
              )}
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-slate-400" />
                {tenant.email}
              </div>
              <div className="flex items-start">
                <MapPin size={16} className="mr-2 text-slate-400 mt-0.5" />
                <span className="flex-1">{tenant.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{editingTenant ? 'Edit Penyewa' : 'Tambah Penyewa Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. KTP / Identitas <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.ktp}
                  onChange={e => setFormData({...formData, ktp: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. HP Darurat
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact || ''}
                    onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                    placeholder="Keluarga/Kerabat"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                 <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
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