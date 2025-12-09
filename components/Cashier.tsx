import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, Item, Tenant, TransactionStatus, PaymentStatus, StoreSettings } from '../types';
import { Plus, Search, Check, Clock, AlertTriangle, FileText, X, Filter, Bell, Edit2, Trash2, History, Eye, User, Package, Calendar, CreditCard, ChevronDown, ExternalLink, Download, Printer, Receipt, Banknote, QrCode, Copy, ArrowUpDown, Image as ImageIcon, Upload } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface CashierProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  tenants: Tenant[];
  onNavigateToTenant?: (tenantId: string) => void;
  initialTab?: 'new' | 'history';
  initialSearchTerm?: string;
  storeSettings: StoreSettings;
}

const Cashier: React.FC<CashierProps> = ({ 
  transactions, 
  setTransactions, 
  items, 
  setItems, 
  tenants, 
  onNavigateToTenant,
  initialTab = 'new',
  initialSearchTerm = '',
  storeSettings
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('date-desc'); // New state for sorting
  const [showNotifications, setShowNotifications] = useState(true);
  
  // New Transaction Form State
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [days, setDays] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Manual Override State
  const [customStatus, setCustomStatus] = useState<TransactionStatus>(TransactionStatus.ACTIVE);
  const [customPaymentStatus, setCustomPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [initialPayAmount, setInitialPayAmount] = useState<string>('');

  // Invoice Modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Edit & Delete State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetTrx, setPaymentTargetTrx] = useState<Transaction | null>(null);
  const [paymentInputAmount, setPaymentInputAmount] = useState<string>('');

  // Detail View State
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const detailViewRef = useRef<HTMLDivElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCats = new Set(items.map(i => i.category));
    return Array.from(uniqueCats).sort();
  }, [items]);

  // Auto-update overdue transactions
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const needsUpdate = transactions.some(t => {
      // Logic: Update if date is passed AND status is NOT Completed AND NOT Already Overdue
      const isNotFinal = t.status !== TransactionStatus.COMPLETED && t.status !== TransactionStatus.OVERDUE;
      if (isNotFinal) {
        const endDate = new Date(t.endDate);
        endDate.setHours(0, 0, 0, 0);
        return today > endDate;
      }
      return false;
    });

    if (needsUpdate) {
      setTransactions(prevTransactions => 
        prevTransactions.map(t => {
          const isNotFinal = t.status !== TransactionStatus.COMPLETED && t.status !== TransactionStatus.OVERDUE;
          if (isNotFinal) {
            const endDate = new Date(t.endDate);
            endDate.setHours(0, 0, 0, 0);
            if (today > endDate) {
              return { ...t, status: TransactionStatus.OVERDUE };
            }
          }
          return t;
        })
      );
    }
  }, [transactions, setTransactions]);

  // Notification Logic
  const overdueUnpaidTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isDatePassed = new Date(t.endDate) < new Date();
      const isUnpaid = t.paymentStatus !== PaymentStatus.PAID;
      return isDatePassed && isUnpaid;
    });
  }, [transactions]);

  const selectedItemData = items.find(i => i.id === selectedItemId);
  const availableStock = selectedItemData ? (selectedItemData.stock - selectedItemData.rentedCount) : 0;
  const totalCost = selectedItemData ? selectedItemData.pricePerDay * days * quantity : 0;
  
  // Check if quantity is valid
  const isQuantityValid = selectedItemData ? (quantity <= availableStock && quantity > 0) : false;

  // Update initial pay amount when total cost changes if status is PAID or PARTIAL default
  useEffect(() => {
    if (customPaymentStatus === PaymentStatus.PAID) {
      setInitialPayAmount(totalCost.toString());
    } else if (customPaymentStatus === PaymentStatus.UNPAID) {
      setInitialPayAmount('0');
    } else if (customPaymentStatus === PaymentStatus.PARTIAL) {
      // Default 30% Down Payment
      setInitialPayAmount(Math.ceil(totalCost * 0.3).toString());
    }
  }, [totalCost, customPaymentStatus]);

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    const item = items.find(i => i.id === selectedItemId);
    const tenant = tenants.find(t => t.id === selectedTenantId);
    
    if (!item || !tenant) return;

    if (customStatus !== TransactionStatus.COMPLETED && item.stock - item.rentedCount < quantity) {
      alert('Stok tidak mencukupi!');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const totalAmount = item.pricePerDay * days * quantity;
    
    // Determine amount paid
    let finalPaidAmount = 0;
    if (customPaymentStatus === PaymentStatus.PAID) {
        finalPaidAmount = totalAmount;
    } else if (customPaymentStatus === PaymentStatus.PARTIAL) {
        finalPaidAmount = parseInt(initialPayAmount) || 0;
    }

    const newTrx: Transaction = {
      id: `TRX-${Date.now()}`,
      tenantId: selectedTenantId,
      itemId: selectedItemId,
      itemName: item.name,
      quantity,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalAmount,
      amountPaid: finalPaidAmount,
      paymentStatus: customPaymentStatus,
      status: customStatus
    };

    setTransactions([newTrx, ...transactions]);
    
    // Update Item Stock Count only if transaction is active/overdue
    if (customStatus !== TransactionStatus.COMPLETED) {
        setItems(items.map(i => i.id === selectedItemId ? { ...i, rentedCount: i.rentedCount + quantity } : i));
    }
    
    // Reset Form
    setActiveTab('history');
    setSelectedItemId('');
    setSelectedTenantId('');
    setDays(1);
    setQuantity(1);
    setCustomStatus(TransactionStatus.ACTIVE);
    setCustomPaymentStatus(PaymentStatus.UNPAID);
    setInitialPayAmount('');
  };

  const handleStatusUpdate = (trxId: string, newStatus: TransactionStatus) => {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx) return;

    // If returning item, restore stock
    if (newStatus === TransactionStatus.COMPLETED && trx.status !== TransactionStatus.COMPLETED) {
       setItems(items.map(i => i.id === trx.itemId ? { ...i, rentedCount: i.rentedCount - trx.quantity } : i));
    }
    // If reactivating item (rare case, e.g. accidental click), consume stock
    else if (newStatus !== TransactionStatus.COMPLETED && trx.status === TransactionStatus.COMPLETED) {
       setItems(items.map(i => i.id === trx.itemId ? { ...i, rentedCount: i.rentedCount + trx.quantity } : i));
    }

    setTransactions(transactions.map(t => t.id === trxId ? { ...t, status: newStatus } : t));
  };

  const openPaymentModal = (t: Transaction) => {
      const remaining = t.totalAmount - t.amountPaid;
      setPaymentTargetTrx(t);
      setPaymentInputAmount(remaining.toString());
      setIsPaymentModalOpen(true);
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetTrx) return;

    const amount = parseInt(paymentInputAmount);
    if (isNaN(amount) || amount <= 0) {
        alert("Mohon masukkan jumlah pembayaran yang valid");
        return;
    }

    handlePaymentUpdate(paymentTargetTrx.id, amount);
    setIsPaymentModalOpen(false);
    setPaymentTargetTrx(null);
  };

  const handlePaymentUpdate = (trxId: string, paidAmount: number) => {
    setTransactions(transactions.map(t => {
      if (t.id !== trxId) return t;
      
      const newPaid = t.amountPaid + paidAmount;
      let pStatus = PaymentStatus.PARTIAL;
      if (newPaid >= t.totalAmount) pStatus = PaymentStatus.PAID;
      
      return { ...t, amountPaid: newPaid, paymentStatus: pStatus };
    }));
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTransactionId(id);
  };

  const handleConfirmDelete = () => {
    if (!deleteTransactionId) return;
    
    const trx = transactions.find(t => t.id === deleteTransactionId);
    if (trx) {
      // If deleting an active/overdue transaction, restore stock
      if (trx.status !== TransactionStatus.COMPLETED) {
        setItems(prevItems => prevItems.map(i => {
          if (i.id === trx.itemId) {
            return { ...i, rentedCount: Math.max(0, i.rentedCount - trx.quantity) };
          }
          return i;
        }));
      }
      setTransactions(prev => prev.filter(t => t.id !== deleteTransactionId));
      if (detailTransaction?.id === deleteTransactionId) {
          setDetailTransaction(null);
      }
    }
    setDeleteTransactionId(null);
  };

  const handleEditClick = (trx: Transaction) => {
    setEditingTransaction(trx);
    setEditFormData({
        ...trx,
        startDate: new Date(trx.startDate).toISOString().split('T')[0],
        endDate: new Date(trx.endDate).toISOString().split('T')[0],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTransaction) return;

      const oldTrx = editingTransaction;
      const newStatus = editFormData.status as TransactionStatus;

      // Handle Stock Changes if Status Changed
      if (oldTrx.status !== TransactionStatus.COMPLETED && newStatus === TransactionStatus.COMPLETED) {
          // Marking as completed -> Reduce rented count (Return item)
          setItems(prev => prev.map(i => i.id === oldTrx.itemId ? { ...i, rentedCount: i.rentedCount - oldTrx.quantity } : i));
      } else if (oldTrx.status === TransactionStatus.COMPLETED && newStatus !== TransactionStatus.COMPLETED) {
          // Marking as active/overdue -> Increase rented count (Take item out)
          setItems(prev => prev.map(i => i.id === oldTrx.itemId ? { ...i, rentedCount: i.rentedCount + oldTrx.quantity } : i));
      }

      const updatedTrx = {
          ...oldTrx,
          ...editFormData,
          startDate: new Date(editFormData.startDate!).toISOString(),
          endDate: new Date(editFormData.endDate!).toISOString(),
          totalAmount: Number(editFormData.totalAmount),
          amountPaid: Number(editFormData.amountPaid),
      } as Transaction;

      setTransactions(prev => prev.map(t => {
          if (t.id === oldTrx.id) {
              return updatedTrx;
          }
          return t;
      }));
      
      // Update Detail View if active
      if (detailTransaction?.id === updatedTrx.id) {
          setDetailTransaction(updatedTrx);
      }

      setIsEditModalOpen(false);
      setEditingTransaction(null);
  };

  // Image Upload Handlers
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Maksimal 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({ ...prev, paymentProofUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && detailTransaction) {
          if (file.size > 5 * 1024 * 1024) {
              alert("Ukuran file terlalu besar (Maksimal 5MB)");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              // Update state immediately
              setTransactions(prev => prev.map(t => t.id === detailTransaction.id ? { ...t, paymentProofUrl: result } : t));
              setDetailTransaction(prev => prev ? { ...prev, paymentProofUrl: result } : null);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleViewDetail = (trx: Transaction) => {
      setDetailTransaction(trx);
      setTimeout(() => {
          detailViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
  };

  // Helper to generate Invoice HTML string
  const getInvoiceHtml = (t: Transaction) => {
    const tenant = tenants.find(tn => tn.id === t.tenantId);
    const item = items.find(i => i.id === t.itemId);
    const duration = Math.max(1, Math.ceil((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 3600 * 24)));
    const pricePerDay = t.totalAmount / t.quantity / duration;

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${t.id}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6; }
          .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start; }
          .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
          .invoice-title { font-size: 32px; font-weight: bold; color: #1e293b; text-align: right; }
          .meta { text-align: right; color: #64748b; font-size: 14px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .box h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 10px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { text-align: left; padding: 12px; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #475569; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .totals { width: 300px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-row.final { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
          .payment-info { margin-top: 40px; display: flex; gap: 20px; border-top: 1px solid #eee; padding-top: 20px; }
          .payment-details { flex: 1; }
          .qr-code { width: 100px; height: 100px; background: #eee; }
          .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
          .paid { background: #dcfce7; color: #166534; }
          .unpaid { background: #fee2e2; color: #991b1b; }
          .partial { background: #ffedd5; color: #9a3412; }
          
          /* Print Specific */
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
            .box { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${storeSettings.name}</div>
            <div style="font-size: 12px; margin-top: 4px; color: #64748b; max-width: 300px;">${storeSettings.address}</div>
            <div style="font-size: 12px; color: #64748b;">${storeSettings.phone}</div>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="meta">#${t.id}</div>
            <div class="meta">${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h3>Ditagihkan Kepada:</h3>
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">${tenant?.name || '-'}</div>
            <div>${tenant?.phone || '-'}</div>
            <div>${tenant?.address || '-'}</div>
          </div>
          <div class="box">
            <h3>Detail Sewa:</h3>
            <div style="display: flex; justify-content: space-between;">
              <span>Tgl Mulai:</span>
              <strong>${new Date(t.startDate).toLocaleDateString('id-ID')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Tgl Kembali:</span>
              <strong>${new Date(t.endDate).toLocaleDateString('id-ID')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
              <span>Status Pembayaran:</span>
              <span class="status ${t.paymentStatus === 'Lunas' ? 'paid' : t.paymentStatus === 'Belum Bayar' ? 'unpaid' : 'partial'}">${t.paymentStatus}</span>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Deskripsi Item</th>
              <th>Kategori</th>
              <th style="text-align: right">Harga/Hari</th>
              <th style="text-align: center">Durasi</th>
              <th style="text-align: center">Qty</th>
              <th style="text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${t.itemName}</strong></td>
              <td>${item?.category || '-'}</td>
              <td style="text-align: right">Rp ${pricePerDay.toLocaleString('id-ID')}</td>
              <td style="text-align: center">${duration} Hari</td>
              <td style="text-align: center">${t.quantity}</td>
              <td style="text-align: right">Rp ${t.totalAmount.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>Rp ${t.totalAmount.toLocaleString('id-ID')}</span>
          </div>
           <div class="total-row" style="color: #166534;">
            <span>Sudah Dibayar</span>
            <span>(Rp ${t.amountPaid.toLocaleString('id-ID')})</span>
          </div>
          <div class="total-row final">
            <span>Sisa Tagihan</span>
            <span>Rp ${(t.totalAmount - t.amountPaid).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div class="payment-info">
            <div class="payment-details">
                <h3>Informasi Pembayaran</h3>
                <p>Silakan lakukan pembayaran melalui:</p>
                <p><strong>Bank ${storeSettings.bankName}</strong><br>
                No. Rek: ${storeSettings.accountNumber}<br>
                A.n: ${storeSettings.accountName}</p>
            </div>
            ${storeSettings.qrisUrl ? `<img src="${storeSettings.qrisUrl}" alt="QRIS Code" class="qr-code" style="width: 120px; height: 120px; object-fit: contain; border: 1px solid #ccc; padding: 5px;"/>` : ''}
        </div>

        <div class="footer">
          <p>Terima kasih atas kepercayaan Anda menggunakan jasa ${storeSettings.name}.</p>
          <p>Bukti pembayaran ini sah dan diterbitkan secara otomatis oleh sistem.</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
  };

  const getReceiptHtml = (t: Transaction) => {
    const tenant = tenants.find(tn => tn.id === t.tenantId);
    const duration = Math.max(1, Math.ceil((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 3600 * 24)));
    const remaining = t.totalAmount - t.amountPaid;

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Kwitansi - ${t.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
          .receipt { border: 2px solid #333; padding: 40px; position: relative; }
          .header { text-align: center; border-bottom: 2px double #333; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px; }
          .company { font-size: 14px; text-transform: uppercase; }
          .row { display: flex; margin-bottom: 15px; align-items: baseline; }
          .label { width: 180px; font-weight: bold; flex-shrink: 0; }
          .value { flex-grow: 1; border-bottom: 1px dotted #999; padding-bottom: 2px; }
          .amount-box { background: #eee; padding: 15px; font-weight: bold; font-size: 20px; text-align: center; border: 2px solid #ccc; margin: 20px 0; width: fit-content; min-width: 200px; }
          .footer { display: flex; justify-content: space-between; margin-top: 50px; }
          .sign { text-align: center; width: 200px; }
          .sign-space { height: 80px; }
          .meta { position: absolute; top: 20px; right: 20px; text-align: right; font-size: 12px; }
          @media print {
            body { margin: 0; padding: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="meta">
            <div>No: KW-${t.id.replace('TRX-', '')}</div>
            <div>Tgl: ${new Date().toLocaleDateString('id-ID')}</div>
          </div>
          <div class="header">
            <div class="title">KWITANSI PEMBAYARAN</div>
            <div class="company">${storeSettings.name}</div>
          </div>

          <div class="row">
            <div class="label">Telah terima dari</div>
            <div class="value">${tenant?.name || '-'}</div>
          </div>

          <div class="row">
            <div class="label">Uang sejumlah</div>
            <div class="value">Rp ${t.amountPaid.toLocaleString('id-ID')}</div>
          </div>

          <div class="row">
            <div class="label">Guna pembayaran</div>
            <div class="value">Sewa ${t.itemName} (${duration} Hari) - Qty: ${t.quantity}</div>
          </div>

          <div class="row">
            <div class="label">Status</div>
            <div class="value">${t.paymentStatus} (Sisa Tagihan: Rp ${remaining.toLocaleString('id-ID')})</div>
          </div>

          <div class="amount-box">
            Rp ${t.amountPaid.toLocaleString('id-ID')}
          </div>

          <div class="footer">
            <div class="sign">
              <div>Penyetor</div>
              <div class="sign-space"></div>
              <div>(${tenant?.name || '....................'})</div>
            </div>
            <div class="sign">
              <div>Penerima</div>
              <div class="sign-space"></div>
              <div>( Admin ${storeSettings.name} )</div>
            </div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
  };

  const handleDownloadInvoice = (t: Transaction) => {
    const htmlContent = getInvoiceHtml(t);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${t.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReceipt = (t: Transaction) => {
    const htmlContent = getReceiptHtml(t);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kwitansi-${t.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintDirectly = (t: Transaction) => {
    const htmlContent = getInvoiceHtml(t);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Filter & Sort Logic
  const filteredTransactions = transactions.filter(t => {
    const tenant = tenants.find(tn => tn.id === t.tenantId);
    const item = items.find(i => i.id === t.itemId);
    const tenantName = tenant ? tenant.name.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = 
      t.id.toLowerCase().includes(searchLower) || 
      t.itemName.toLowerCase().includes(searchLower) ||
      tenantName.includes(searchLower);
      
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || t.paymentStatus === paymentFilter;
    const matchesCategory = categoryFilter === 'ALL' || (item?.category === categoryFilter);
    
    return matchesSearch && matchesStatus && matchesPayment && matchesCategory;
  }).sort((a, b) => {
      const itemA = items.find(i => i.id === a.itemId);
      const itemB = items.find(i => i.id === b.itemId);

      switch (sortBy) {
          case 'date-asc':
              return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          case 'date-desc':
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          case 'item-asc':
              return a.itemName.localeCompare(b.itemName);
          case 'category-asc':
              return (itemA?.category || '').localeCompare(itemB?.category || '');
          default:
              return 0;
      }
  });
  
  // Helpers for Detail View
  const getDetailTenant = () => tenants.find(t => t.id === detailTransaction?.tenantId);
  const getDetailItem = () => items.find(i => i.id === detailTransaction?.itemId);

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {showNotifications && overdueUnpaidTransactions.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start justify-between animate-fade-in shadow-sm">
          <div className="flex gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-full h-fit mt-1">
              <Bell className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm md:text-base">Peringatan Pembayaran Jatuh Tempo</h4>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1 max-w-3xl">
                Terdapat <span className="font-bold">{overdueUnpaidTransactions.length} transaksi</span> yang telah melewati tanggal jatuh tempo dan belum lunas.
                Harap segera lakukan pengecekan dan penagihan kepada penyewa terkait.
              </p>
              <div className="mt-3 flex gap-3">
                <button 
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 transition-colors shadow-sm"
                >
                  Lihat di Riwayat
                </button>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 px-3 py-1.5 rounded hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
                >
                  Tutup Notifikasi
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowNotifications(false)}
            className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Kasir & Transaksi</h2>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
              activeTab === 'new' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Sewa Baru
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
              activeTab === 'history' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Riwayat
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 dark:text-white">Form Penyewaan Baru</h3>
          <form onSubmit={handleCreateTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Penyewa</label>
                <select 
                  required
                  value={selectedTenantId}
                  onChange={e => setSelectedTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Penyewa --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Barang</label>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors flex items-center"
                    >
                        <History size={12} className="mr-1" />
                        Cek Riwayat
                    </button>
                </div>
                <select 
                  required
                  value={selectedItemId}
                  onChange={e => {
                    setSelectedItemId(e.target.value);
                    setQuantity(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Barang --</option>
                  {items.filter(i => (i.stock - i.rentedCount) > 0).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stok Tersedia: {i.stock - i.rentedCount}) - Rp {i.pricePerDay.toLocaleString('id-ID')}/hari
                    </option>
                  ))}
                </select>
                {selectedItemData && (
                    <div className="mt-1 flex items-center text-xs text-blue-600 dark:text-blue-400 animate-fade-in">
                        <Package size={12} className="mr-1" />
                        <span className="font-medium">Stok Tersedia: {availableStock} unit</span>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah Unit
                      {selectedItemData && (
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
                              (Maks: {availableStock})
                          </span>
                      )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => {
                      let val = parseInt(e.target.value);
                      setQuantity(isNaN(val) ? 0 : val);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                        !isQuantityValid && selectedItemData
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {!isQuantityValid && selectedItemData && (
                    <div className="flex items-center mt-1.5 text-red-600 dark:text-red-400 text-xs font-medium animate-pulse">
                        <AlertTriangle size={12} className="mr-1" />
                        <span>Stok melebihi batas tersedia ({availableStock})</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Durasi (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    value={days}
                    onChange={e => setDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Opsi Lanjutan (Opsional)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status Transaksi</label>
                        <select
                            value={customStatus}
                            onChange={(e) => setCustomStatus(e.target.value as TransactionStatus)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            {Object.values(TransactionStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status Pembayaran</label>
                        <select
                            value={customPaymentStatus}
                            onChange={(e) => setCustomPaymentStatus(e.target.value as PaymentStatus)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            {Object.values(PaymentStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Jumlah Dibayar Awal</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                        <input 
                            type="number"
                            min="0"
                            value={initialPayAmount}
                            onChange={(e) => setInitialPayAmount(e.target.value)}
                            disabled={customPaymentStatus === PaymentStatus.UNPAID || customPaymentStatus === PaymentStatus.PAID}
                            placeholder="0"
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    {customPaymentStatus === PaymentStatus.PARTIAL && (
                        <p className="text-xs text-slate-400 mt-1 italic">
                            Otomatis diset ke 30% dari total ({Math.ceil(totalCost * 0.3).toLocaleString('id-ID')}). Anda dapat mengubahnya.
                        </p>
                    )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl flex flex-col justify-between h-full">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Ringkasan Biaya</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Harga per unit</span>
                    <span className="font-medium text-slate-800 dark:text-white">Rp {selectedItemData?.pricePerDay.toLocaleString('id-ID') || 0}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Jumlah</span>
                    <span className="font-medium text-slate-800 dark:text-white">x {quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Durasi</span>
                    <span className="font-medium text-slate-800 dark:text-white">{days} Hari</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-600 my-2 pt-2 flex justify-between text-lg font-bold text-slate-800 dark:text-white">
                    <span>Total</span>
                    <span>Rp {totalCost.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {/* Dynamic payment preview */}
                   {customPaymentStatus !== PaymentStatus.UNPAID && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium pt-2 border-t border-dashed border-slate-200 dark:border-slate-600 mt-2">
                        <span>Akan Dibayar</span>
                        <span>Rp {(customPaymentStatus === PaymentStatus.PAID ? totalCost : (parseInt(initialPayAmount) || 0)).toLocaleString('id-ID')}</span>
                    </div>
                   )}
                </div>

                {/* Info Pembayaran */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Informasi Pembayaran</h4>
                    <div className="flex gap-3">
                         {storeSettings.qrisUrl ? (
                             <img 
                                src={storeSettings.qrisUrl} 
                                alt="QRIS" 
                                className="w-16 h-16 object-cover rounded bg-white p-1 border border-slate-200"
                            />
                         ) : (
                             <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400 border border-slate-200">No QR</div>
                         )}
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                            <p className="font-bold">{storeSettings.bankName}</p>
                            <p>{storeSettings.accountNumber}</p>
                            <p className="text-slate-400 dark:text-slate-500">{storeSettings.accountName}</p>
                        </div>
                    </div>
                </div>

              </div>
              
              <button
                type="submit"
                disabled={!selectedItemId || !selectedTenantId || !isQuantityValid}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                Buat Pesanan
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
           {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col xl:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                      type="text"
                      placeholder="Cari ID transaksi, nama penyewa, atau barang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm w-full sm:w-auto"
                    >
                      <option value="ALL">Semua Status Transaksi</option>
                      {Object.values(TransactionStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>

                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm w-full sm:w-auto"
                    >
                      <option value="ALL">Semua Status Pembayaran</option>
                      {Object.values(PaymentStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm w-full sm:w-auto"
                    >
                      <option value="ALL">Semua Kategori</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {/* SORT BY DROPDOWN */}
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium cursor-pointer"
                        >
                            <option value="date-desc">Terbaru</option>
                            <option value="date-asc">Terlama</option>
                            <option value="item-asc">Nama Barang (A-Z)</option>
                            <option value="category-asc">Kategori (A-Z)</option>
                        </select>
                        <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">ID & Tanggal</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Barang & Penyewa</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Pembayaran</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 italic">
                                        Tidak ada transaksi yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(t => {
                                    const tenant = tenants.find(tn => tn.id === t.tenantId);
                                    
                                    // Status Flags
                                    const isOverdue = (new Date(t.endDate) < new Date() && t.status !== TransactionStatus.COMPLETED) || t.status === TransactionStatus.OVERDUE;
                                    const isCompleted = t.status === TransactionStatus.COMPLETED;
                                    
                                    // Row Styling
                                    let rowClass = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
                                    if (isOverdue && !isCompleted) rowClass += " bg-red-50/30 dark:bg-red-900/10";
                                    
                                    return (
                                        <tr key={t.id} className={rowClass}>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mb-1">{t.id}</div>
                                                <div className="text-slate-800 dark:text-white font-medium">
                                                    {new Date(t.startDate).toLocaleDateString('id-ID')}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    s/d {new Date(t.endDate).toLocaleDateString('id-ID')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 dark:text-white mb-1">
                                                    {t.itemName} <span className="font-normal text-slate-500">x{t.quantity}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                                                    <User size={12} className="mr-1" />
                                                    {tenant?.name || 'Unknown'}
                                                    {onNavigateToTenant && tenant && (
                                                        <button 
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              onNavigateToTenant(tenant.id);
                                                          }}
                                                          className="ml-1.5 text-blue-500 hover:text-blue-700"
                                                          title="Lihat Penyewa"
                                                        >
                                                            <ExternalLink size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    isCompleted 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : isOverdue 
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                    {isOverdue && !isCompleted && <AlertTriangle size={10} className="mr-1" />}
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-medium text-slate-800 dark:text-white">
                                                    Rp {t.totalAmount.toLocaleString('id-ID')}
                                                </div>
                                                <div className={`text-xs mt-0.5 ${
                                                    t.paymentStatus === PaymentStatus.PAID 
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : t.paymentStatus === PaymentStatus.UNPAID 
                                                        ? 'text-red-600 dark:text-red-400' 
                                                        : 'text-orange-600 dark:text-orange-400'
                                                }`}>
                                                    {t.paymentStatus}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleViewDetail(t)}
                                                        className="flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs font-medium border border-blue-200 dark:border-blue-800"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={14} className="mr-1.5" />
                                                        Detail
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleEditClick(t)}
                                                        className="flex items-center px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors text-xs font-medium border border-yellow-200 dark:border-yellow-800"
                                                        title="Edit Transaksi"
                                                    >
                                                        <Edit2 size={14} className="mr-1.5" />
                                                        Edit
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleDeleteClick(t.id)}
                                                        className="flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs font-medium border border-red-200 dark:border-red-800"
                                                        title="Hapus Transaksi"
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
            
            {/* Detailed View Section */}
            {detailTransaction && (
                <div ref={detailViewRef} className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
                    {/* ... (rest of detail view remains unchanged) ... */}
                    <div className="bg-slate-800 dark:bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center">
                            <FileText className="mr-2" size={20} />
                            Detail Transaksi: <span className="ml-2 font-mono opacity-80">{detailTransaction.id}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                             {/* Extra Actions in Detail Header */}
                            <button onClick={() => handleDownloadInvoice(detailTransaction)} className="p-2 hover:bg-white/10 rounded-full" title="Download Invoice">
                                <Download size={18} />
                            </button>
                             {detailTransaction.amountPaid < detailTransaction.totalAmount && (
                                <button onClick={() => openPaymentModal(detailTransaction)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-xs font-bold rounded shadow-sm">
                                    Bayar
                                </button>
                             )}
                            <button onClick={() => setDetailTransaction(null)} className="text-slate-400 hover:text-white transition-colors ml-2">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Summary Cards */}
                             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <div className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Status Sewa</div>
                                <div className={`text-lg font-bold ${detailTransaction.status === TransactionStatus.OVERDUE ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                                    {detailTransaction.status}
                                </div>
                            </div>
                             <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                <div className="text-xs text-green-500 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Status Pembayaran</div>
                                <div className="text-lg font-bold text-slate-800 dark:text-white">{detailTransaction.paymentStatus}</div>
                            </div>
                             <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                                <div className="text-xs text-purple-500 dark:text-purple-400 font-bold uppercase tracking-wider mb-1">Total Biaya</div>
                                <div className="text-lg font-bold text-slate-800 dark:text-white">Rp {detailTransaction.totalAmount.toLocaleString('id-ID')}</div>
                            </div>
                             <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Durasi</div>
                                <div className="text-lg font-bold text-slate-800 dark:text-white">
                                    {Math.ceil((new Date(detailTransaction.endDate).getTime() - new Date(detailTransaction.startDate).getTime()) / (1000 * 60 * 60 * 24))} Hari
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="flex items-center text-slate-800 dark:text-white font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                                        <User size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                                        Informasi Penyewa
                                    </h4>
                                    {getDetailTenant() ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Nama</span>
                                                <span className="col-span-2 font-medium text-slate-800 dark:text-white flex items-center">
                                                  {getDetailTenant()?.name}
                                                  {onNavigateToTenant && (
                                                    <button 
                                                      onClick={() => onNavigateToTenant(getDetailTenant()!.id)}
                                                      className="ml-2 text-blue-500 dark:text-blue-400 hover:text-blue-700"
                                                      title="Lihat Detail Penyewa"
                                                    >
                                                      <ExternalLink size={14} />
                                                    </button>
                                                  )}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Telepon</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">{getDetailTenant()?.phone}</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">KTP</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">{getDetailTenant()?.ktp}</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Alamat</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">{getDetailTenant()?.address}</span>
                                            </div>
                                             <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Email</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">{getDetailTenant()?.email}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">Data penyewa tidak ditemukan.</p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="flex items-center text-slate-800 dark:text-white font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                                        <Package size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                                        Detail Barang
                                    </h4>
                                    {getDetailItem() ? (
                                         <div className="space-y-2 text-sm">
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Nama Barang</span>
                                                <span className="col-span-2 font-medium text-slate-800 dark:text-white">{getDetailItem()?.name}</span>
                                            </div>
                                             <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Kategori</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">{getDetailItem()?.category}</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Jumlah Sewa</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">{detailTransaction.quantity} Unit</span>
                                            </div>
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Harga Satuan</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">Rp {getDetailItem()?.pricePerDay.toLocaleString('id-ID')} / hari</span>
                                            </div>
                                         </div>
                                    ) : (
                                        <div className="space-y-2 text-sm">
                                            <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Nama Barang</span>
                                                <span className="col-span-2 font-medium text-slate-800 dark:text-white">{detailTransaction.itemName}</span>
                                            </div>
                                             <div className="grid grid-cols-3">
                                                <span className="text-slate-500 dark:text-slate-400">Jumlah Sewa</span>
                                                <span className="col-span-2 text-slate-800 dark:text-white">{detailTransaction.quantity} Unit</span>
                                            </div>
                                            <p className="text-xs text-orange-500 italic mt-2">Item ini mungkin telah dihapus dari inventaris.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="flex items-center text-slate-800 dark:text-white font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                                        <Calendar size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                                        Jadwal Penyewaan
                                    </h4>
                                    <div className="space-y-4 text-sm">
                                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-100 dark:border-slate-600">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Mulai Sewa</p>
                                            <p className="font-medium text-slate-800 dark:text-white">
                                                {new Date(detailTransaction.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className={`bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-100 dark:border-slate-600 ${detailTransaction.status === TransactionStatus.OVERDUE ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : ''}`}>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Jatuh Tempo / Selesai</p>
                                            <p className={`font-medium ${detailTransaction.status === TransactionStatus.OVERDUE ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                                                {new Date(detailTransaction.endDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            {detailTransaction.status === TransactionStatus.OVERDUE && (
                                                <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-1 flex items-center">
                                                    <AlertTriangle size={12} className="mr-1" /> Lewat Jatuh Tempo
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="flex items-center text-slate-800 dark:text-white font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                                        <CreditCard size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                                        Rincian Pembayaran
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700">
                                            <span className="text-slate-600 dark:text-slate-400">Total Tagihan</span>
                                            <span className="font-bold text-slate-800 dark:text-white text-base">Rp {detailTransaction.totalAmount.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700">
                                            <span className="text-slate-600 dark:text-slate-400 flex items-center">
                                                Sudah Dibayar
                                                {detailTransaction.amountPaid > 0 && (
                                                    <span className="ml-2 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">TERCATAT</span>
                                                )}
                                            </span>
                                            <span className="font-bold text-green-600 dark:text-green-400">Rp {detailTransaction.amountPaid.toLocaleString('id-ID')}</span>
                                        </div>
                                         <div className="flex justify-between items-center py-2">
                                            <span className="text-slate-600 dark:text-slate-400">Sisa Pembayaran</span>
                                            <span className={`font-bold text-base ${(detailTransaction.totalAmount - detailTransaction.amountPaid) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                                Rp {(detailTransaction.totalAmount - detailTransaction.amountPaid).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        
                                        {(detailTransaction.totalAmount - detailTransaction.amountPaid) > 0 && (
                                             <div className="mt-4 pt-4 flex gap-3">
                                                 <button 
                                                    onClick={() => openPaymentModal(detailTransaction)}
                                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                                >
                                                    Bayar Tagihan
                                                </button>
                                             </div>
                                        )}
                                    </div>

                                    {/* Payment Proof Section - Detail View */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                            Bukti Pembayaran (Transfer)
                                        </h5>
                                        {detailTransaction.paymentProofUrl ? (
                                            <div className="relative group">
                                                <img 
                                                    src={detailTransaction.paymentProofUrl} 
                                                    alt="Bukti Transfer" 
                                                    className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                                                    onClick={() => window.open(detailTransaction.paymentProofUrl, '_blank')}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                                                    <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Klik untuk perbesar</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-600">
                                                <ImageIcon size={24} className="mx-auto text-slate-300 dark:text-slate-500 mb-1" />
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Belum ada bukti pembayaran diupload</p>
                                                
                                                {/* Allow quick upload if not paid fully */}
                                                {(detailTransaction.paymentStatus === PaymentStatus.UNPAID || detailTransaction.paymentStatus === PaymentStatus.PARTIAL) && (
                                                    <div>
                                                        <input
                                                            ref={detailFileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleQuickProofUpload}
                                                            className="hidden"
                                                        />
                                                        <button 
                                                            onClick={() => detailFileInputRef.current?.click()}
                                                            className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                                        >
                                                            Upload Bukti
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
      )}

      {/* Payment Modal with QR */}
      {/* ... (rest of modals remain unchanged) ... */}
      {isPaymentModalOpen && paymentTargetTrx && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-scale-up">
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                          <Banknote size={20} className="mr-2 text-green-600 dark:text-green-400" />
                          Pembayaran Tagihan
                      </h3>
                      <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      <div className="text-center mb-6">
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Sisa Tagihan</p>
                          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                              Rp {(paymentTargetTrx.totalAmount - paymentTargetTrx.amountPaid).toLocaleString('id-ID')}
                          </h2>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
                          <div className="flex flex-col items-center">
                              <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-3 flex items-center">
                                  <QrCode size={14} className="mr-1.5" /> Scan QRIS
                              </h4>
                              <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                                  {storeSettings.qrisUrl ? (
                                      <img 
                                          src={storeSettings.qrisUrl} 
                                          alt="QR Code Pembayaran" 
                                          className="w-32 h-32 object-contain"
                                      />
                                  ) : (
                                      <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400 text-center">
                                          QR Code belum disetting oleh Admin
                                      </div>
                                  )}
                              </div>
                              <div className="text-center w-full border-t border-blue-200 dark:border-blue-800 pt-3 mt-1">
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Atau Transfer Bank:</p>
                                  <p className="font-bold text-slate-800 dark:text-white text-sm">{storeSettings.bankName}</p>
                                  <div className="flex items-center justify-center gap-2 mt-1">
                                      <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 text-sm font-mono">
                                          {storeSettings.accountNumber}
                                      </code>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">a.n {storeSettings.accountName}</p>
                              </div>
                          </div>
                      </div>

                      <form onSubmit={submitPayment}>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Nominal Pembayaran (Rp)
                          </label>
                          <input 
                              type="number" 
                              min="1"
                              max={paymentTargetTrx.totalAmount - paymentTargetTrx.amountPaid}
                              value={paymentInputAmount}
                              onChange={(e) => setPaymentInputAmount(e.target.value)}
                              className="w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-lg mb-4"
                              placeholder="0"
                              autoFocus
                          />
                          
                          <button 
                              type="submit"
                              className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all transform active:scale-95"
                          >
                              Konfirmasi Pembayaran
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* Invoice Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-xl shadow-2xl relative">
                <button 
                    onClick={() => setSelectedTransaction(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    <X size={20} />
                </button>
                
                <div className="text-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">INVOICE</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{storeSettings.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{selectedTransaction.id}</p>
                </div>

                <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Penyewa</span>
                        <span className="font-medium text-slate-800 dark:text-white">{tenants.find(t => t.id === selectedTransaction.tenantId)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Barang</span>
                        <span className="font-medium text-slate-800 dark:text-white">{selectedTransaction.itemName} (x{selectedTransaction.quantity})</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Tanggal Kembali</span>
                        <span className="font-medium text-slate-800 dark:text-white">{new Date(selectedTransaction.endDate).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-600 pt-2 flex justify-between font-bold text-lg text-slate-800 dark:text-white">
                        <span>Total</span>
                        <span>Rp {selectedTransaction.totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                     <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Dibayar</span>
                        <span>Rp {selectedTransaction.amountPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-medium text-red-600 dark:text-red-400">
                        <span>Sisa</span>
                        <span>Rp {(selectedTransaction.totalAmount - selectedTransaction.amountPaid).toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <button 
                        onClick={() => handlePrintDirectly(selectedTransaction)}
                        className="w-full py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
                    >
                         <Printer size={18} className="mr-2" />
                        Cetak Invoice
                    </button>
                    <button 
                        onClick={() => handleDownloadInvoice(selectedTransaction)}
                        className="w-full py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                    >
                        <Download size={16} className="mr-2" />
                        Unduh Invoice
                    </button>
                     {selectedTransaction.amountPaid > 0 && (
                        <button 
                            onClick={() => handleDownloadReceipt(selectedTransaction)}
                            className="w-full py-2 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center"
                        >
                            <Receipt size={16} className="mr-2" />
                            Unduh Kwitansi
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
                  <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Edit Transaksi</h3>
                  <form onSubmit={handleUpdateTransaction} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Penyewa</label>
                          <select
                              value={editFormData.tenantId}
                              onChange={e => setEditFormData({ ...editFormData, tenantId: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          >
                              {tenants.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Mulai</label>
                              <input
                                  type="date"
                                  value={editFormData.startDate}
                                  onChange={e => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Kembali</label>
                              <input
                                  type="date"
                                  value={editFormData.endDate}
                                  onChange={e => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Tagihan (Rp)</label>
                              <input
                                  type="number"
                                  value={editFormData.totalAmount}
                                  onChange={e => setEditFormData({ ...editFormData, totalAmount: Number(e.target.value) })}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sudah Dibayar (Rp)</label>
                              <input
                                  type="number"
                                  value={editFormData.amountPaid}
                                  onChange={e => setEditFormData({ ...editFormData, amountPaid: Number(e.target.value) })}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Transaksi</label>
                              <select
                                  value={editFormData.status}
                                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value as TransactionStatus })}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                              >
                                  {Object.values(TransactionStatus).map(s => (
                                      <option key={s} value={s}>{s}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Pembayaran</label>
                              <select
                                  value={editFormData.paymentStatus}
                                  onChange={e => setEditFormData({ ...editFormData, paymentStatus: e.target.value as PaymentStatus })}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                              >
                                  {Object.values(PaymentStatus).map(s => (
                                      <option key={s} value={s}>{s}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      {/* Payment Proof Upload in Edit Modal */}
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bukti Pembayaran (Transfer)</label>
                          {editFormData.paymentProofUrl ? (
                            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 group">
                                <img 
                                    src={editFormData.paymentProofUrl} 
                                    alt="Bukti Transfer" 
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditFormData({ ...editFormData, paymentProofUrl: '' });
                                        if (editFileInputRef.current) editFileInputRef.current.value = '';
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 hover:bg-red-700 transition-all shadow-sm"
                                    title="Hapus Gambar"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                          ) : (
                             <div 
                                onClick={() => editFileInputRef.current?.click()}
                                className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center justify-center text-slate-400"
                            >
                                <Upload size={24} className="mb-2" />
                                <span className="text-sm font-medium">Upload Bukti Transfer</span>
                                <span className="text-xs mt-1 text-slate-400">(JPG, PNG, WebP)</span>
                            </div>
                          )}
                           <input
                                ref={editFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleEditImageUpload}
                                className="hidden"
                            />
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                          <button
                              type="button"
                              onClick={() => setIsEditModalOpen(false)}
                              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                              Batal
                          </button>
                          <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                              Simpan Perubahan
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <ConfirmationModal
          isOpen={!!deleteTransactionId}
          onClose={() => setDeleteTransactionId(null)}
          onConfirm={handleConfirmDelete}
          title="Hapus Transaksi"
          message="Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan. Jika transaksi berstatus Aktif, stok barang akan dikembalikan."
      />
    </div>
  );
};

export default Cashier;