import React, { useState, useRef } from 'react';
import { Item, ItemStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Filter, Image as ImageIcon, AlertCircle, Upload, X, Wrench, CheckCircle2, Clock, Package } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface InventoryProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

const ItemThumbnail = ({ src, alt, size = "md" }: { src?: string; alt: string; size?: "sm" | "md" | "lg" }) => {
  const [hasError, setHasError] = useState(false);
  
  const sizeClasses = {
      sm: "h-12 w-12",
      md: "h-16 w-16",
      lg: "h-24 w-full md:w-24"
  };

  if (!src || hasError) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 flex-shrink-0`}>
        <ImageIcon size={size === 'sm' ? 20 : 28} />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${sizeClasses[size]} rounded-xl object-cover bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 shadow-sm flex-shrink-0`}
      onError={() => setHasError(true)}
    />
  );
};

const Inventory: React.FC<InventoryProps> = ({ items, setItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Low Stock Threshold
  const LOW_STOCK_THRESHOLD = 2;
  
  // Form State
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    category: '',
    stock: 0,
    pricePerMonth: 0,
    status: ItemStatus.AVAILABLE,
    imageUrl: ''
  });

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        stock: 1,
        rentedCount: 0,
        pricePerMonth: 0,
        status: ItemStatus.AVAILABLE,
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Maksimal 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageUrl: '' });
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } as Item : i));
    } else {
      const newItem: Item = {
        ...formData,
        id: Date.now().toString(),
        rentedCount: 0,
      } as Item;
      setItems([...items, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteItemId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteItemId) {
      setItems(items.filter(i => i.id !== deleteItemId));
      setDeleteItemId(null);
    }
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    const available = i.stock - i.rentedCount;

    if (statusFilter !== 'ALL') {
        if (statusFilter === ItemStatus.MAINTENANCE) {
            matchesStatus = i.status === ItemStatus.MAINTENANCE;
        } else if (statusFilter === 'AVAILABLE') {
            matchesStatus = i.status !== ItemStatus.MAINTENANCE && available > 0;
        } else if (statusFilter === 'LOW_STOCK') {
            matchesStatus = i.status !== ItemStatus.MAINTENANCE && available <= LOW_STOCK_THRESHOLD && available > 0;
        } else if (statusFilter === 'OUT_OF_STOCK') {
            matchesStatus = i.status !== ItemStatus.MAINTENANCE && available === 0;
        }
    }
    
    return matchesSearch && matchesStatus;
  });

  // Helper function for status badge (Used in both Mobile and Desktop view)
  const renderStatusBadge = (item: Item) => {
    const available = item.stock - item.rentedCount;
    const isLowStock = available > 0 && available <= LOW_STOCK_THRESHOLD;
    
    let statusLabel = '';
    let statusClass = '';
    let StatusIcon = CheckCircle2;

    if (item.stock === 0) {
        statusLabel = 'Stok Kosong';
        statusClass = 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
        StatusIcon = X;
    } else if (item.status === ItemStatus.MAINTENANCE) {
        statusLabel = 'Perbaikan';
        statusClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
        StatusIcon = Wrench;
    } else if (available === 0) {
        statusLabel = 'Disewa Penuh';
        statusClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        StatusIcon = Clock;
    } else if (isLowStock) {
        statusLabel = 'Stok Menipis';
        statusClass = 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
        StatusIcon = AlertCircle;
    } else {
        statusLabel = 'Tersedia';
        statusClass = 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
        StatusIcon = CheckCircle2;
    }

    return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${statusClass}`}>
            <StatusIcon size={14} className="mr-1.5" strokeWidth={2.5} />
            {statusLabel}
        </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
           <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Inventaris Stok</h2>
           <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 mt-1">Kelola data barang dan harga sewa</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-bold text-base md:text-lg active:scale-95"
        >
          <Plus size={20} className="mr-2" />
          Tambah Barang
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama barang atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base placeholder:text-slate-400"
          />
        </div>
        
        <div className="relative w-full md:w-auto">
             <Filter size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
             <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto pl-11 pr-10 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-base font-medium cursor-pointer appearance-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="AVAILABLE">Tersedia</option>
              <option value="LOW_STOCK">Stok Menipis</option>
              <option value="OUT_OF_STOCK">Stok Habis</option>
              <option value={ItemStatus.MAINTENANCE}>Sedang Perbaikan</option>
            </select>
        </div>
      </div>

      {/* --- DESKTOP VIEW (Table) --- */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-700/50 border-b-2 border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">Gambar</th>
                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">Nama Barang</th>
                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">Kategori</th>
                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs text-center">Stok (Sisa/Total)</th>
                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs text-right">Harga/Bulan</th>
                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs text-center">Status</th>
                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-lg italic">
                        Tidak ada barang yang ditemukan.
                    </td>
                </tr>
              ) : (
              filteredItems.map((item) => {
                const available = item.stock - item.rentedCount;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <ItemThumbnail src={item.imageUrl} alt={item.name} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-base">{item.name}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-1 text-base">
                          <span className={`font-extrabold ${available === 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                            {item.status === ItemStatus.MAINTENANCE ? 0 : available}
                          </span>
                          <span className="text-slate-400 mx-1 font-light">/</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">{item.stock}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200 text-base">
                      Rp {item.pricePerMonth.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE VIEW (Card Grid) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 border-dashed">
                <p className="text-slate-500 dark:text-slate-400 text-base italic">Tidak ada barang yang ditemukan.</p>
            </div>
        ) : (
            filteredItems.map((item) => {
                const available = item.stock - item.rentedCount;
                return (
                    <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex gap-4">
                            <ItemThumbnail src={item.imageUrl} alt={item.name} size="md" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate pr-2">{item.name}</h3>
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 flex-shrink-0">
                                        {item.category}
                                    </span>
                                </div>
                                <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-2">
                                    Rp {item.pricePerMonth.toLocaleString('id-ID')}<span className="text-xs text-slate-400 font-normal">/bln</span>
                                </p>
                                <div className="flex items-center justify-between">
                                    {renderStatusBadge(item)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                                <Package size={16} className="mr-2 text-slate-400" />
                                <span>Stok: </span>
                                <span className={`ml-1 font-bold ${available === 0 ? 'text-red-600' : ''}`}>
                                    {item.status === ItemStatus.MAINTENANCE ? 0 : available}
                                </span>
                                <span className="mx-1">/</span>
                                <span>{item.stock}</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleOpenModal(item)}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg active:scale-95 transition-transform"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg active:scale-95 transition-transform"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Modal - Responsive Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 md:p-8 border-2 border-slate-200 dark:border-slate-700 animate-scale-up my-auto">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">
                {editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Barang</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-medium"
                  placeholder="Contoh: Main Frame 170cm"
                />
              </div>
              
              <div>
                <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Foto Barang</label>
                
                {formData.imageUrl ? (
                    <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 group">
                        <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-3 right-3 p-2 md:p-3 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 hover:bg-red-700 transition-all shadow-lg"
                            title="Hapus Gambar"
                        >
                            <X size={20} />
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 md:h-40 border-2 border-dashed border-slate-400 dark:border-slate-500 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center justify-center text-slate-500 dark:text-slate-400"
                    >
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm font-bold">Klik untuk upload gambar</span>
                    </div>
                )}
                
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                  <input
                    required
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Stok Total</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, stock: isNaN(val) ? 0 : Math.max(0, val)});
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-medium"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Harga Sewa / Bulan</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 font-bold text-base">Rp</div>
                      <input
                        required
                        type="number"
                        min="0"
                        value={formData.pricePerMonth}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            setFormData({...formData, pricePerMonth: isNaN(val) ? 0 : Math.max(0, val)});
                        }}
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-bold"
                      />
                    </div>
                  </div>
                  <div>
                     <label className="block text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Status Operasional</label>
                     <select
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as ItemStatus})}
                        className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-medium appearance-none"
                     >
                        <option value={ItemStatus.AVAILABLE}>Aktif (Bisa Disewa)</option>
                        <option value={ItemStatus.MAINTENANCE}>Dalam Perbaikan</option>
                     </select>
                  </div>
              </div>
              
              <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm md:text-base"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm md:text-base shadow-lg hover:shadow-xl transition-all"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Barang"
        message="Apakah Anda yakin ingin menghapus barang ini? Data yang dihapus tidak dapat dikembalikan."
      />
    </div>
  );
};

export default Inventory;