import React, { useState, useRef } from 'react';
import { Item, ItemStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Filter, Image as ImageIcon, AlertCircle, Upload, X, Wrench, CheckCircle2, Clock } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface InventoryProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

const ItemThumbnail = ({ src, alt }: { src?: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400">
        <ImageIcon size={20} />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className="h-10 w-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
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
    pricePerDay: 0,
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
        pricePerDay: 0,
        status: ItemStatus.AVAILABLE,
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (misal max 5MB)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inventaris Stok</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Tambah Barang
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama barang atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm cursor-pointer"
        >
          <option value="ALL">Semua Status</option>
          <option value="AVAILABLE">Tersedia</option>
          <option value="LOW_STOCK">Stok Menipis</option>
          <option value="OUT_OF_STOCK">Stok Habis</option>
          <option value={ItemStatus.MAINTENANCE}>Sedang Perbaikan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 w-20">Gambar</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Nama Barang</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Kategori</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-center">Stok (Tersedia / Total)</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Harga/Hari</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 italic">
                        Tidak ada barang yang ditemukan.
                    </td>
                </tr>
              ) : (
              filteredItems.map((item) => {
                const available = item.stock - item.rentedCount;
                const isLowStock = available > 0 && available <= LOW_STOCK_THRESHOLD;
                
                // Calculate Display Status
                let statusLabel = '';
                let statusClass = '';
                let StatusIcon = CheckCircle2;

                if (item.stock === 0) {
                    statusLabel = 'Stok Kosong';
                    statusClass = 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50';
                    StatusIcon = X;
                } else if (item.status === ItemStatus.MAINTENANCE) {
                    statusLabel = 'Dalam Perbaikan';
                    statusClass = 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
                    StatusIcon = Wrench;
                } else if (available === 0) {
                    statusLabel = 'Disewa Penuh';
                    statusClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50';
                    StatusIcon = Clock;
                } else if (isLowStock) {
                    statusLabel = 'Stok Menipis';
                    statusClass = 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50';
                    StatusIcon = AlertCircle;
                } else {
                    statusLabel = 'Tersedia';
                    statusClass = 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50';
                    StatusIcon = CheckCircle2;
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <ItemThumbnail src={item.imageUrl} alt={item.name} />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-1">
                          <span className={`font-bold ${
                            item.stock === 0 ? 'text-red-600 dark:text-red-400' :
                            item.status === ItemStatus.MAINTENANCE ? 'text-yellow-600 dark:text-yellow-400' :
                            available === 0 ? 'text-blue-600 dark:text-blue-400' : 
                            isLowStock ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-white'
                          }`}>
                            {item.status === ItemStatus.MAINTENANCE ? 0 : available}
                          </span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="font-medium text-slate-600 dark:text-slate-400">{item.stock}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                      Rp {item.pricePerDay.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                        <StatusIcon size={12} className="mr-1.5" />
                        {statusLabel}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs font-medium border border-blue-200 dark:border-blue-800"
                          title="Edit Barang"
                        >
                          <Edit2 size={14} className="mr-1.5" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs font-medium border border-red-200 dark:border-red-800"
                          title="Hapus Barang"
                        >
                          <Trash2 size={14} className="mr-1.5" />
                          Hapus
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Barang</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Foto Barang</label>
                
                {formData.imageUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 group">
                        <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 hover:bg-red-700 transition-all shadow-sm"
                            title="Hapus Gambar"
                        >
                            <X size={16} />
                        </button>
                         <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Gambar terpilih
                        </div>
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center justify-center text-slate-400"
                    >
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm font-medium">Klik untuk upload gambar</span>
                        <span className="text-xs mt-1 text-slate-400">(Format: JPG, PNG, WebP)</span>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <input
                    required
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stok Total</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, stock: isNaN(val) ? 0 : Math.max(0, val)});
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Sewa / Hari</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">Rp</div>
                      <input
                        required
                        type="number"
                        min="0"
                        value={formData.pricePerDay}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            setFormData({...formData, pricePerDay: isNaN(val) ? 0 : Math.max(0, val)});
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Operasional</label>
                     <select
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as ItemStatus})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                     >
                        <option value={ItemStatus.AVAILABLE}>Aktif (Bisa Disewa)</option>
                        <option value={ItemStatus.MAINTENANCE}>Dalam Perbaikan</option>
                     </select>
                  </div>
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