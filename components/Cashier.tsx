import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, Item, Tenant, TransactionStatus, PaymentStatus, StoreSettings } from '../types';
import { Plus, Search, Check, Clock, AlertTriangle, FileText, X, Filter, Bell, Edit2, Trash2, History, Eye, User, Package, Calendar, CreditCard, ChevronDown, ExternalLink, Download, Printer, Receipt, Banknote, QrCode, Copy, ArrowUpDown, Image as ImageIcon, Upload, PiggyBank } from 'lucide-react';
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
  const [months, setMonths] = useState(1); // Changed from days to months
  const [quantity, setQuantity] = useState(1);
  const [depositAmount, setDepositAmount] = useState(''); // New State for Deposit
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
  
  // Calculate cost based on MONTHS now
  const rentalCost = selectedItemData ? selectedItemData.pricePerMonth * months * quantity : 0;
  const depositCost = parseInt(depositAmount) || 0;
  const totalCost = rentalCost; // Transaction.totalAmount stores RENTAL ONLY
  const grandTotal = rentalCost + depositCost; // For display and initial payment logic
  
  // Check if quantity is valid
  const isQuantityValid = selectedItemData ? (quantity <= availableStock && quantity > 0) : false;

  // Update initial pay amount when total cost changes if status is PAID or PARTIAL default
  useEffect(() => {
    if (customPaymentStatus === PaymentStatus.PAID) {
      setInitialPayAmount(grandTotal.toString());
    } else if (customPaymentStatus === PaymentStatus.UNPAID) {
      setInitialPayAmount('0');
    }
  }, [grandTotal, rentalCost, depositCost, customPaymentStatus]);

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
    // Add Months instead of Days
    end.setMonth(end.getMonth() + months);

    // Determine amount paid
    let finalPaidAmount = 0;
    if (customPaymentStatus === PaymentStatus.PAID) {
        finalPaidAmount = grandTotal;
    } else {
        // Default to manual input (usually 0 if unpaid)
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
      totalAmount: rentalCost, // Only Rent
      depositAmount: depositCost, // Separate Deposit
      isDepositReturned: false,
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
    setMonths(1);
    setQuantity(1);
    setDepositAmount('');
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
      const grandTotal = t.totalAmount + t.depositAmount;
      const remaining = grandTotal - t.amountPaid;
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
      const grandTotal = t.totalAmount + t.depositAmount;
      
      let pStatus = PaymentStatus.UNPAID; // Default to UNPAID if incomplete
      if (newPaid >= grandTotal) pStatus = PaymentStatus.PAID;
      
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
          depositAmount: Number(editFormData.depositAmount),
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
    // ... (Invoice HTML Generation Code - No changes needed)
    const tenant = tenants.find(tn => tn.id === t.tenantId);
    const item = items.find(i => i.id === t.itemId);
    
    // Calculate months duration based on calendar difference to align with creation logic
    const d1 = new Date(t.startDate);
    const d2 = new Date(t.endDate);
    let durationMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    
    // Edge case handling
    const dayDiff = (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
    if (durationMonths <= 0 || (durationMonths === 1 && dayDiff < 15)) {
         durationMonths = Math.max(1, Math.round(dayDiff / 30));
    }

    // Calculate price per month per unit (Round to avoid floating point errors)
    const pricePerMonth = Math.round(t.totalAmount / t.quantity / durationMonths);
    const grandTotal = t.totalAmount + t.depositAmount;

    // Create many watermarks
    const watermarkText = storeSettings.name;
    const watermarkRepeats = Array(50).fill(`<div class="watermark-item">${watermarkText}</div>`).join('');

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${t.id}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14pt; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6; position: relative; overflow-x: hidden; }
          .watermark-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            display: flex;
            flex-wrap: wrap;
            align-content: space-around;
            justify-content: space-around;
            pointer-events: none;
            overflow: hidden;
            opacity: 0.6;
          }
          .watermark-item {
            width: 180px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-30deg);
            font-size: 14px;
            font-weight: 900;
            color: rgba(200, 200, 200, 0.3);
            text-transform: uppercase;
            user-select: none;
            text-align: center;
            line-height: 1.2;
          }
          .header { border-bottom: 3px solid #eee; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start; position: relative; z-index: 10; }
          .company-name { font-size: 28px; font-weight: bold; color: #2563eb; }
          .invoice-title { font-size: 36px; font-weight: bold; color: #1e293b; text-align: right; }
          .meta { text-align: right; color: #64748b; font-size: 16px; font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; position: relative; z-index: 10; }
          .box { background: #f8fafc; padding: 25px; border-radius: 12px; border: 2px solid #e2e8f0; }
          .box h3 { margin-top: 0; font-size: 16px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 10px; font-weight: bold; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; position: relative; z-index: 10; }
          .table th { text-align: left; padding: 15px; background: #f1f5f9; border-bottom: 3px solid #e2e8f0; font-size: 14px; text-transform: uppercase; color: #475569; font-weight: bold; }
          .table td { padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 16px; }
          .totals { width: 350px; margin-left: auto; font-size: 16px; position: relative; z-index: 10; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; }
          .total-row.final { font-size: 22px; font-weight: bold; border-top: 3px solid #333; margin-top: 15px; padding-top: 15px; }
          .payment-info { margin-top: 50px; display: flex; gap: 30px; border-top: 2px solid #eee; padding-top: 30px; position: relative; z-index: 10; }
          .payment-details { flex: 1; font-size: 16px; }
          .qr-code { width: 120px; height: 120px; background: #eee; }
          .footer { margin-top: 80px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 2px solid #eee; padding-top: 20px; position: relative; z-index: 10; }
          .status { display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: 14px; font-weight: bold; }
          .paid { background: #dcfce7; color: #166534; }
          .unpaid { background: #fee2e2; color: #991b1b; }
          .partial { background: #ffedd5; color: #9a3412; }
          
          /* Print Specific */
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
            .box { background: #f8fafc !important; border: 2px solid #e2e8f0 !important; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark-container">
            ${watermarkRepeats}
        </div>
        <div class="header">
          <div>
            <div class="company-name">${storeSettings.name}</div>
            <div style="font-size: 16px; margin-top: 6px; color: #64748b; max-width: 350px;">${storeSettings.address}</div>
            <div style="font-size: 16px; color: #64748b; font-weight: bold; margin-top: 4px;">${storeSettings.phone}</div>
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
            <div style="font-weight: bold; font-size: 20px; margin-bottom: 8px;">${tenant?.name || '-'}</div>
            <div style="font-size: 16px;">${tenant?.phone || '-'}</div>
            <div style="font-size: 16px;">${tenant?.address || '-'}</div>
          </div>
          <div class="box">
            <h3>Detail Sewa:</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Tgl Mulai:</span>
              <strong>${new Date(t.startDate).toLocaleDateString('id-ID')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Tgl Kembali:</span>
              <strong>${new Date(t.endDate).toLocaleDateString('id-ID')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
              <span>Status Pembayaran:</span>
              <span class="status ${t.paymentStatus === 'Lunas' ? 'paid' : 'unpaid'}">${t.paymentStatus}</span>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Deskripsi Item</th>
              <th>Kategori</th>
              <th style="text-align: right">Harga/Bulan</th>
              <th style="text-align: center">Durasi</th>
              <th style="text-align: center">Qty</th>
              <th style="text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${t.itemName}</strong></td>
              <td>${item?.category || '-'}</td>
              <td style="text-align: right">Rp ${pricePerMonth.toLocaleString('id-ID')}</td>
              <td style="text-align: center">${durationMonths} Bulan</td>
              <td style="text-align: center">${t.quantity}</td>
              <td style="text-align: right">Rp ${t.totalAmount.toLocaleString('id-ID')}</td>
            </tr>
            ${t.depositAmount > 0 ? `
            <tr>
              <td><strong>Deposit Jaminan</strong></td>
              <td>Keamanan</td>
              <td style="text-align: right">-</td>
              <td style="text-align: center">-</td>
              <td style="text-align: center">-</td>
              <td style="text-align: right">Rp ${t.depositAmount.toLocaleString('id-ID')}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal Sewa</span>
            <span>Rp ${t.totalAmount.toLocaleString('id-ID')}</span>
          </div>
          ${t.depositAmount > 0 ? `
          <div class="total-row">
            <span>Deposit</span>
            <span>Rp ${t.depositAmount.toLocaleString('id-ID')}</span>
          </div>
          ` : ''}
          <div class="total-row" style="font-weight: bold; border-top: 1px dashed #ccc;">
            <span>Grand Total</span>
            <span>Rp ${grandTotal.toLocaleString('id-ID')}</span>
          </div>
           <div class="total-row" style="color: #166534; font-weight: bold;">
            <span>Sudah Dibayar</span>
            <span>(Rp ${t.amountPaid.toLocaleString('id-ID')})</span>
          </div>
          <div class="total-row final">
            <span>Sisa Tagihan</span>
            <span>Rp ${(grandTotal - t.amountPaid).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div class="payment-info">
            <div class="payment-details">
                <h3>Informasi Pembayaran</h3>
                <p>Silakan lakukan pembayaran melalui:</p>
                <p style="margin-top: 10px;"><strong>Bank ${storeSettings.bankName}</strong><br>
                No. Rek: <span style="font-size: 18px; font-weight: bold;">${storeSettings.accountNumber}</span><br>
                A.n: ${storeSettings.accountName}</p>
            </div>
            ${storeSettings.qrisUrl ? `<img src="${storeSettings.qrisUrl}" alt="QRIS Code" class="qr-code" style="width: 140px; height: 140px; object-fit: contain; border: 2px solid #ccc; padding: 5px;"/>` : ''}
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
      // ... (Receipt HTML Code - No Changes needed)
    const tenant = tenants.find(tn => tn.id === t.tenantId);
    
    // Fix: Exact month calculation
    const d1 = new Date(t.startDate);
    const d2 = new Date(t.endDate);
    let durationMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    // Fallback for short duration edge cases
    if (durationMonths <= 0) {
        const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        durationMonths = Math.max(1, Math.round(diffDays / 30));
    }

    const grandTotal = t.totalAmount + (t.depositAmount || 0);
    const remaining = grandTotal - t.amountPaid;

    // Create many watermarks
    const watermarkText = storeSettings.name;
    const watermarkRepeats = Array(50).fill(`<div class="watermark-item">${watermarkText}</div>`).join('');

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Kwitansi - ${t.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; max-width: 800px; margin: 0 auto; padding: 20px; color: #000; font-size: 16px; position: relative; overflow-x: hidden; }
          .watermark-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            display: flex;
            flex-wrap: wrap;
            align-content: space-around;
            justify-content: space-around;
            pointer-events: none;
            overflow: hidden;
            opacity: 0.6;
          }
          .watermark-item {
            width: 180px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-30deg);
            font-size: 14px;
            font-weight: 900;
            color: rgba(200, 200, 200, 0.3);
            text-transform: uppercase;
            user-select: none;
            text-align: center;
            line-height: 1.2;
          }
          .receipt { border: 4px solid #000; padding: 40px; position: relative; z-index: 10; background: transparent; }
          .header { text-align: center; border-bottom: 4px double #000; padding-bottom: 20px; margin-bottom: 40px; }
          .title { font-size: 32px; font-weight: bold; margin-bottom: 10px; letter-spacing: 3px; }
          .company { font-size: 18px; text-transform: uppercase; font-weight: bold; }
          .row { display: flex; margin-bottom: 20px; align-items: baseline; }
          .label { width: 220px; font-weight: bold; flex-shrink: 0; font-size: 18px; }
          .value { flex-grow: 1; border-bottom: 2px dotted #555; padding-bottom: 4px; font-size: 18px; font-weight: 500; }
          .amount-box { background: #f0f0f0; padding: 20px; font-weight: bold; font-size: 28px; text-align: center; border: 3px solid #000; margin: 30px 0; width: fit-content; min-width: 250px; box-shadow: 4px 4px 0px #999; }
          .footer { display: flex; justify-content: space-between; margin-top: 60px; }
          .sign { text-align: center; width: 250px; }
          .sign-space { height: 100px; }
          .meta { position: absolute; top: 25px; right: 25px; text-align: right; font-size: 14px; font-weight: bold; }
          @media print {
            body { margin: 0; padding: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark-container">
            ${watermarkRepeats}
        </div>
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
            <div class="value">Sewa ${t.itemName} (${durationMonths} Bulan) ${t.depositAmount > 0 ? `+ Deposit` : ''} - Qty: ${t.quantity}</div>
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

  const handlePrintDirectly = (t: Transaction) => {
    const htmlContent = getInvoiceHtml(t);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handlePrintReceipt = (t: Transaction) => {
    const htmlContent = getReceiptHtml(t);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handlePrintFilteredReport = () => {
    // ... (Print Filtered Report Code - No Changes needed)
    const printContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <title>Laporan Transaksi</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e293b; margin-bottom: 5px; }
          p.subtitle { text-align: center; color: #64748b; margin-top: 0; margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            @page { size: landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <h1>${storeSettings.name} - Laporan Transaksi</h1>
        <p class="subtitle">Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
        
        <table>
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Tgl Mulai</th>
              <th>Tgl Selesai</th>
              <th>Penyewa</th>
              <th>Barang</th>
              <th class="text-center">Qty</th>
              <th>Status</th>
              <th class="text-right">Biaya Sewa</th>
              <th class="text-right">Deposit</th>
              <th class="text-right">Total</th>
              <th class="text-right">Dibayar</th>
              <th class="text-right">Sisa</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(t => {
              const tenant = tenants.find(tn => tn.id === t.tenantId);
              const grandTotal = t.totalAmount + (t.depositAmount || 0);
              const remaining = grandTotal - t.amountPaid;
              return `
                <tr>
                  <td>${t.id}</td>
                  <td>${new Date(t.startDate).toLocaleDateString('id-ID')}</td>
                  <td>${new Date(t.endDate).toLocaleDateString('id-ID')}</td>
                  <td>${tenant?.name || '-'}</td>
                  <td>${t.itemName}</td>
                  <td class="text-center">${t.quantity}</td>
                  <td>${t.status}</td>
                  <td class="text-right">Rp ${t.totalAmount.toLocaleString('id-ID')}</td>
                  <td class="text-right">Rp ${(t.depositAmount || 0).toLocaleString('id-ID')}</td>
                  <td class="text-right">Rp ${grandTotal.toLocaleString('id-ID')}</td>
                  <td class="text-right">Rp ${t.amountPaid.toLocaleString('id-ID')}</td>
                  <td class="text-right" style="color: ${remaining > 0 ? 'red' : 'black'}">Rp ${remaining.toLocaleString('id-ID')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
             <tr style="background-color: #f8fafc">
                <td colspan="7" class="text-right" style="font-weight:bold; padding: 10px;">TOTAL</td>
                <td class="text-right" style="font-weight:bold">Rp ${filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0).toLocaleString('id-ID')}</td>
                <td class="text-right" style="font-weight:bold">Rp ${filteredTransactions.reduce((acc, t) => acc + (t.depositAmount || 0), 0).toLocaleString('id-ID')}</td>
                <td class="text-right" style="font-weight:bold">Rp ${filteredTransactions.reduce((acc, t) => acc + t.totalAmount + (t.depositAmount || 0), 0).toLocaleString('id-ID')}</td>
                <td class="text-right" style="font-weight:bold">Rp ${filteredTransactions.reduce((acc, t) => acc + t.amountPaid, 0).toLocaleString('id-ID')}</td>
                <td class="text-right" style="font-weight:bold">Rp ${filteredTransactions.reduce((acc, t) => acc + ((t.totalAmount + (t.depositAmount || 0)) - t.amountPaid), 0).toLocaleString('id-ID')}</td>
             </tr>
          </tfoot>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
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
          case 'date-desc':
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          case 'date-asc':
              return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
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
    <div className="space-y-6 md:space-y-8">
      {/* Notification Banner */}
      {showNotifications && overdueUnpaidTransactions.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-4 md:p-6 flex items-start justify-between animate-fade-in shadow-md">
          <div className="flex gap-4 md:gap-5">
            <div className="bg-orange-100 dark:bg-orange-900/50 p-2 md:p-3 rounded-xl h-fit">
              <Bell className="text-orange-700 dark:text-orange-300 w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-bold text-orange-900 dark:text-orange-200">Peringatan Pembayaran Jatuh Tempo</h4>
              <p className="text-sm md:text-lg text-orange-800 dark:text-orange-300 mt-1 md:mt-2 max-w-4xl leading-relaxed">
                Terdapat <span className="font-extrabold underline">{overdueUnpaidTransactions.length} transaksi</span> yang telah melewati tanggal jatuh tempo dan belum lunas.
                Harap segera lakukan pengecekan dan penagihan.
              </p>
              <div className="mt-3 md:mt-4 flex gap-3 md:gap-4 flex-wrap">
                <button 
                  onClick={() => setActiveTab('history')}
                  className="text-sm md:text-base font-bold bg-orange-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl hover:bg-orange-700 transition-colors shadow-lg"
                >
                  Lihat di Riwayat
                </button>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-sm md:text-base font-bold text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/40 px-4 py-2 md:px-5 md:py-2.5 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors border border-orange-200 dark:border-orange-800"
                >
                  Tutup Notifikasi
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowNotifications(false)}
            className="text-orange-400 hover:text-orange-700 dark:hover:text-orange-200 transition-colors p-2"
          >
            <X size={24} className="md:w-7 md:h-7" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Kasir & Transaksi</h2>
           <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 mt-1">Kelola penyewaan dan pembayaran</p>
        </div>
        <div className="flex w-full md:w-auto bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 md:flex-none px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-bold transition-all ${
              activeTab === 'new' ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-200 shadow-md ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sewa Baru
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-bold transition-all ${
              activeTab === 'history' ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-200 shadow-md ring-1 ring-black/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Riwayat
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Form Penyewaan Baru</h3>
          <form onSubmit={handleCreateTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div className="space-y-5 md:space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Penyewa</label>
                <select 
                  required
                  value={selectedTenantId}
                  onChange={e => setSelectedTenantId(e.target.value)}
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-medium"
                >
                  <option value="">-- Pilih Penyewa --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pilih Barang</label>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold transition-colors flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-1 md:px-3 md:py-1 rounded-lg"
                    >
                        <History size={14} className="mr-1 md:mr-2" />
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
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-medium"
                >
                  <option value="">-- Pilih Barang --</option>
                  {items.filter(i => (i.stock - i.rentedCount) > 0).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stok: {i.stock - i.rentedCount}) - Rp {i.pricePerMonth.toLocaleString('id-ID')}/bln
                    </option>
                  ))}
                </select>
                {selectedItemData && (
                    <div className="mt-2 flex items-center text-xs md:text-sm text-blue-700 dark:text-blue-300 animate-fade-in bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                        <Package size={16} className="mr-2" />
                        <span className="font-bold">Stok Tersedia: {availableStock} unit</span>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                 <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Jumlah Unit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => {
                      let val = parseInt(e.target.value);
                      setQuantity(isNaN(val) ? 0 : val);
                    }}
                    className={`w-full px-3 py-2.5 md:px-4 md:py-3 border-2 rounded-xl focus:ring-4 text-base font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                        !isQuantityValid && selectedItemData
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-600'
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                  {!isQuantityValid && selectedItemData && (
                    <div className="flex items-center mt-2 text-red-700 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg">
                        <AlertTriangle size={14} className="mr-1" />
                        <span>Max: {availableStock}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Durasi (Bulan)</label>
                  <input
                    type="number"
                    min="1"
                    value={months}
                    onChange={e => setMonths(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-bold"
                  />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Biaya Deposit (Jaminan)</label>
                    <div className="relative">
                        <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          placeholder="0"
                          className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base font-bold"
                        />
                    </div>
                  </div>
               </div>

              <div className="border-t-2 border-slate-100 dark:border-slate-700 pt-6 mt-6">
                <h4 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 mb-4 bg-slate-100 dark:bg-slate-700 w-fit px-3 py-1 rounded-lg">Opsi Lanjutan (Opsional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                        <label className="block text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Status Transaksi</label>
                        <select
                            value={customStatus}
                            onChange={(e) => setCustomStatus(e.target.value as TransactionStatus)}
                            className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:ring-4 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                        >
                            {Object.values(TransactionStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Status Pembayaran</label>
                        <select
                            value={customPaymentStatus}
                            onChange={(e) => setCustomPaymentStatus(e.target.value as PaymentStatus)}
                            className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:ring-4 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                        >
                            {Object.values(PaymentStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Jumlah Dibayar Awal</label>
                    <div className="relative">
                        <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">Rp</span>
                        <input 
                            type="number"
                            min="0"
                            value={initialPayAmount}
                            onChange={(e) => setInitialPayAmount(e.target.value)}
                            disabled={customPaymentStatus === PaymentStatus.UNPAID || customPaymentStatus === PaymentStatus.PAID}
                            placeholder="0"
                            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-base font-bold focus:ring-4 focus:border-blue-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 p-6 md:p-8 rounded-2xl flex flex-col justify-between h-full border-2 border-slate-100 dark:border-slate-600/50">
              <div>
                <h4 className="text-sm md:text-base font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 md:mb-6 border-b border-slate-200 pb-2">Ringkasan Biaya</h4>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Harga Satuan (Bln)</span>
                    <span className="font-bold text-slate-900 dark:text-white">Rp {selectedItemData?.pricePerMonth.toLocaleString('id-ID') || 0}</span>
                  </div>
                   <div className="flex justify-between text-sm md:text-base">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Jumlah Unit</span>
                    <span className="font-bold text-slate-900 dark:text-white">x {quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Durasi Sewa</span>
                    <span className="font-bold text-slate-900 dark:text-white">{months} Bulan</span>
                  </div>
                  <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-2 pt-2">
                    <div className="flex justify-between text-sm md:text-base font-medium">
                        <span className="text-slate-700 dark:text-slate-300">Subtotal Sewa</span>
                        <span>Rp {rentalCost.toLocaleString('id-ID')}</span>
                    </div>
                    {depositCost > 0 && (
                        <div className="flex justify-between text-sm md:text-base font-medium text-orange-700 dark:text-orange-400 mt-2">
                            <span>Biaya Deposit</span>
                            <span>+ Rp {depositCost.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                  </div>
                  <div className="border-t-2 border-slate-200 dark:border-slate-600 my-4 pt-4 flex justify-between text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                    <span>Total</span>
                    <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {/* Dynamic payment preview */}
                   {customPaymentStatus !== PaymentStatus.UNPAID && (
                    <div className="flex justify-between text-base md:text-lg text-green-700 dark:text-green-300 font-bold pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600 mt-2">
                        <span>Akan Dibayar</span>
                        <span>Rp {(customPaymentStatus === PaymentStatus.PAID ? grandTotal : (parseInt(initialPayAmount) || 0)).toLocaleString('id-ID')}</span>
                    </div>
                   )}
                </div>

                {/* Info Pembayaran */}
                <div className="mt-6 md:mt-8 pt-6 border-t-2 border-slate-200 dark:border-slate-600">
                    <h4 className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Informasi Rekening</h4>
                    <div className="flex gap-4 items-center">
                         {storeSettings.qrisUrl ? (
                             <img 
                                src={storeSettings.qrisUrl} 
                                alt="QRIS" 
                                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg bg-white p-1 border-2 border-slate-200 shadow-sm"
                            />
                         ) : (
                             <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-500 border-2 border-slate-300 font-bold">No QR</div>
                         )}
                        <div className="text-xs md:text-sm text-slate-700 dark:text-slate-200 space-y-1">
                            <p className="font-extrabold text-base md:text-lg">{storeSettings.bankName}</p>
                            <p className="font-mono bg-white dark:bg-slate-600 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-500 w-fit">{storeSettings.accountNumber}</p>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{storeSettings.accountName}</p>
                        </div>
                    </div>
                </div>

              </div>
              
              <button
                type="submit"
                disabled={!selectedItemId || !selectedTenantId || !isQuantityValid}
                className="w-full mt-8 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Buat Pesanan Sekarang
              </button>
            </div>
          </form>
        </div>
      ) : (
        // ... (History View) ...
        <div className="space-y-6">
           {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row gap-4 md:gap-6">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                      type="text"
                      placeholder="Cari ID, penyewa, atau barang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 md:pl-12 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base placeholder:text-slate-400"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full xl:w-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-1">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 md:px-4 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium appearance-none"
                        >
                          <option value="ALL">Status Transaksi</option>
                          {Object.values(TransactionStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>

                        <select
                          value={paymentFilter}
                          onChange={(e) => setPaymentFilter(e.target.value)}
                          className="px-3 md:px-4 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium appearance-none"
                        >
                          <option value="ALL">Status Bayar</option>
                          {Object.values(PaymentStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>

                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="px-3 md:px-4 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium appearance-none"
                        >
                          <option value="ALL">Kategori</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>

                        {/* SORT BY DROPDOWN */}
                        <div className="relative w-full">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full appearance-none pl-4 pr-8 md:pr-10 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium cursor-pointer"
                            >
                                <option value="date-desc">Terbaru</option>
                                <option value="date-asc">Terlama</option>
                                <option value="item-asc">Nama Barang (A-Z)</option>
                                <option value="category-asc">Kategori (A-Z)</option>
                            </select>
                            <ArrowUpDown size={16} className="absolute right-8 md:right-10 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handlePrintFilteredReport}
                        className="px-4 py-3 bg-slate-800 dark:bg-slate-600 text-white rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-500 transition-all shadow-md flex items-center justify-center whitespace-nowrap text-sm"
                        title="Cetak Laporan Filter"
                    >
                        <Printer size={18} className="mr-2" />
                        Cetak Laporan
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* --- DESKTOP TABLE VIEW --- */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-700/50 border-b-2 border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">ID & Tanggal</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">Barang & Penyewa</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs text-center">Status</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs text-right">Pembayaran</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-lg italic">
                                        Tidak ada transaksi yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(t => {
                                    const tenant = tenants.find(tn => tn.id === t.tenantId);
                                    
                                    // Status Flags
                                    const isOverdue = (new Date(t.endDate) < new Date() && t.status !== TransactionStatus.COMPLETED) || t.status === TransactionStatus.OVERDUE;
                                    const isCompleted = t.status === TransactionStatus.COMPLETED;
                                    const isPaid = t.paymentStatus === PaymentStatus.PAID;

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-4 py-4 md:px-6 md:py-5">
                                                <div className="font-mono font-bold text-slate-600 dark:text-slate-400 text-xs md:text-sm">{t.id}</div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-500 mt-1">
                                                    {new Date(t.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-5">
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{t.itemName}</div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center mt-1">
                                                    <User size={12} className="mr-1" />
                                                    {tenant?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-5 text-center">
                                                {isCompleted ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                        <Check size={12} className="mr-1 md:mr-1.5" /> Selesai
                                                    </span>
                                                ) : isOverdue ? (
                                                     <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                        <AlertTriangle size={12} className="mr-1 md:mr-1.5" /> Terlambat
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                        <Clock size={12} className="mr-1 md:mr-1.5" /> Disewa
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-5 text-right">
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                    Rp {t.amountPaid.toLocaleString('id-ID')}
                                                </div>
                                                <div className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                                    dari Rp {(t.totalAmount + t.depositAmount).toLocaleString('id-ID')}
                                                </div>
                                                <div className={`text-[10px] md:text-xs font-bold mt-1 uppercase ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {t.paymentStatus}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-5 text-right">
                                                <div className="flex justify-end gap-1 md:gap-2">
                                                    <button 
                                                        onClick={() => handleViewDetail(t)}
                                                        className="p-1.5 md:p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={18} className="md:w-5 md:h-5" />
                                                    </button>
                                                    {!isPaid && (
                                                        <button 
                                                            onClick={() => openPaymentModal(t)}
                                                            className="p-1.5 md:p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                            title="Bayar"
                                                        >
                                                            <Banknote size={18} className="md:w-5 md:h-5" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleEditClick(t)}
                                                        className="p-1.5 md:p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} className="md:w-5 md:h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(t.id)}
                                                        className="p-1.5 md:p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={18} className="md:w-5 md:h-5" />
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

                {/* --- MOBILE CARD VIEW --- */}
                <div className="md:hidden p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 italic">
                            Tidak ada transaksi yang sesuai dengan filter.
                        </div>
                    ) : (
                        filteredTransactions.map(t => {
                            const tenant = tenants.find(tn => tn.id === t.tenantId);
                            const isOverdue = (new Date(t.endDate) < new Date() && t.status !== TransactionStatus.COMPLETED) || t.status === TransactionStatus.OVERDUE;
                            const isCompleted = t.status === TransactionStatus.COMPLETED;
                            const isPaid = t.paymentStatus === PaymentStatus.PAID;

                            return (
                                <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{t.id}</span>
                                                <span className="text-xs text-slate-400">{new Date(t.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                            </div>
                                        </div>
                                        {isCompleted ? (
                                            <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg border border-green-200 dark:border-green-800 flex items-center">
                                                <Check size={10} className="mr-1" /> Selesai
                                            </span>
                                        ) : isOverdue ? (
                                                <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg border border-red-200 dark:border-red-800 flex items-center">
                                                <AlertTriangle size={10} className="mr-1" /> Terlambat
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center">
                                                <Clock size={10} className="mr-1" /> Disewa
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white text-base mb-1">{t.itemName}</div>
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                            <User size={14} className="mr-1.5 text-slate-400" />
                                            {tenant?.name || 'Unknown'}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Pembayaran</p>
                                            <p className={`text-xs font-bold uppercase ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                                {t.paymentStatus}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Rp {t.amountPaid.toLocaleString('id-ID')}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Total: Rp {(t.totalAmount + t.depositAmount).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 pt-2">
                                        <button 
                                            onClick={() => handleViewDetail(t)}
                                            className="col-span-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg flex justify-center items-center"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => openPaymentModal(t)}
                                            disabled={isPaid}
                                            className="col-span-1 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Banknote size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(t)}
                                            className="col-span-1 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg flex justify-center items-center"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(t.id)}
                                            className="col-span-1 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg flex justify-center items-center"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentTargetTrx && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-slate-200 dark:border-slate-700 animate-scale-up">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Input Pembayaran</h3>
                     <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                 </div>
                 <form onSubmit={submitPayment}>
                     <div className="mb-4">
                         <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Total Tagihan (Sewa + Deposit)</p>
                         <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Rp {(paymentTargetTrx.totalAmount + paymentTargetTrx.depositAmount).toLocaleString('id-ID')}</p>
                     </div>
                     <div className="mb-4">
                         <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Sudah Dibayar</p>
                         <p className="text-base md:text-lg font-bold text-green-600 dark:text-green-400">Rp {paymentTargetTrx.amountPaid.toLocaleString('id-ID')}</p>
                     </div>
                     <div className="mb-6">
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Jumlah Bayar Sekarang</label>
                         <div className="relative">
                             <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                             <input 
                                type="number" 
                                value={paymentInputAmount}
                                onChange={e => setPaymentInputAmount(e.target.value)}
                                className="w-full pl-8 md:pl-10 pr-4 py-2.5 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-bold text-base md:text-lg focus:ring-4 focus:ring-blue-500/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                autoFocus
                             />
                         </div>
                     </div>
                     <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-base md:text-lg hover:bg-green-700 transition-colors shadow-lg">
                         Simpan Pembayaran
                     </button>
                 </form>
             </div>
         </div>
      )}

      {/* Detail Modal/View (Overlay) */}
      {detailTransaction && (
         <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto backdrop-blur-sm" ref={detailViewRef}>
             <div className="min-h-screen px-4 text-center flex items-center justify-center">
                 <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl my-8 text-left relative border-2 border-slate-200 dark:border-slate-700">
                     <button 
                        onClick={() => setDetailTransaction(null)}
                        className="absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors z-10"
                     >
                         <X size={20} className="md:w-6 md:h-6" />
                     </button>

                     <div className="p-4 md:p-8">
                         <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 mb-6 md:mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
                             <div>
                                 <div className="flex items-center gap-3 mb-2">
                                     <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Detail Transaksi</h2>
                                     <span className="px-2 py-0.5 md:px-3 md:py-1 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs md:text-sm font-mono font-bold text-slate-600 dark:text-slate-300">#{detailTransaction.id}</span>
                                 </div>
                                 <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center text-sm md:text-base">
                                     <Calendar size={16} className="mr-2"/> 
                                     {new Date(detailTransaction.startDate).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                 </p>
                             </div>
                             <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                                 <button onClick={() => handlePrintReceipt(detailTransaction)} className="flex-1 md:flex-none flex items-center justify-center px-3 py-2 md:px-4 md:py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors text-sm md:text-base">
                                     <Receipt size={16} className="mr-2" /> Kwitansi
                                 </button>
                                 <button onClick={() => handlePrintDirectly(detailTransaction)} className="flex-1 md:flex-none flex items-center justify-center px-3 py-2 md:px-4 md:py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl font-bold transition-colors text-sm md:text-base">
                                     <Printer size={16} className="mr-2" /> Invoice
                                 </button>
                             </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                             {/* Col 1: Info Utama */}
                             <div className="md:col-span-2 space-y-6 md:space-y-8">
                                 {/* Item Info */}
                                 <div className="bg-slate-50 dark:bg-slate-700/30 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-600/50">
                                     <h4 className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Informasi Barang</h4>
                                     <div className="flex items-start gap-4">
                                         <div className="bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm hidden md:block">
                                             <Package size={32} className="text-blue-600 dark:text-blue-400" />
                                         </div>
                                         <div>
                                             <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{detailTransaction.itemName}</p>
                                             <div className="flex flex-wrap gap-4 mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300">
                                                 <span className="flex items-center"><Copy size={14} className="mr-1"/> Qty: {detailTransaction.quantity}</span>
                                                 <span className="flex items-center"><Calendar size={14} className="mr-1"/> Sampai: {new Date(detailTransaction.endDate).toLocaleDateString('id-ID')}</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Tenant Info */}
                                 <div className="bg-slate-50 dark:bg-slate-700/30 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-600/50">
                                     <h4 className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Penyewa</h4>
                                     <div className="flex items-start gap-4">
                                         <div className="bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm hidden md:block">
                                             <User size={32} className="text-purple-600 dark:text-purple-400" />
                                         </div>
                                         <div>
                                             <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{getDetailTenant()?.name}</p>
                                             <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">{getDetailTenant()?.phone}</p>
                                             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">{getDetailTenant()?.address}</p>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Payment Proof */}
                                 <div>
                                     <div className="flex justify-between items-center mb-4">
                                         <h4 className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bukti Pembayaran</h4>
                                         <button onClick={() => detailFileInputRef.current?.click()} className="text-xs md:text-sm text-blue-600 hover:underline font-bold flex items-center">
                                             <Upload size={14} className="mr-1"/> Upload Baru
                                         </button>
                                         <input ref={detailFileInputRef} type="file" className="hidden" accept="image/*" onChange={handleQuickProofUpload} />
                                     </div>
                                     <div className="w-full h-40 md:h-48 bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative group">
                                         {detailTransaction.paymentProofUrl ? (
                                             <img src={detailTransaction.paymentProofUrl} alt="Bukti Transfer" className="w-full h-full object-contain" />
                                         ) : (
                                             <div className="text-center text-slate-400">
                                                 <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                                 <p className="text-xs md:text-sm font-medium">Belum ada bukti pembayaran</p>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             {/* Col 2: Financials */}
                             <div className="bg-slate-900 text-white p-4 md:p-6 rounded-2xl h-fit shadow-xl">
                                 <h4 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Ringkasan Tagihan</h4>
                                 <div className="space-y-3 md:space-y-4">
                                     <div className="flex justify-between text-sm md:text-base">
                                         <span className="text-slate-300">Biaya Sewa</span>
                                         <span className="font-bold">Rp {detailTransaction.totalAmount.toLocaleString('id-ID')}</span>
                                     </div>
                                     <div className="flex justify-between text-sm md:text-base">
                                         <span className="text-slate-300">Deposit Jaminan</span>
                                         <span className="font-bold">Rp {detailTransaction.depositAmount.toLocaleString('id-ID')}</span>
                                     </div>
                                     <div className="border-t border-slate-700 pt-4 flex justify-between text-lg md:text-xl font-extrabold text-blue-400">
                                         <span>Total</span>
                                         <span>Rp {(detailTransaction.totalAmount + detailTransaction.depositAmount).toLocaleString('id-ID')}</span>
                                     </div>
                                     
                                     <div className="bg-slate-800 rounded-xl p-4 mt-6">
                                         <div className="flex justify-between text-xs md:text-sm mb-2">
                                             <span className="text-slate-400">Sudah Dibayar</span>
                                             <span className="font-bold text-green-400">Rp {detailTransaction.amountPaid.toLocaleString('id-ID')}</span>
                                         </div>
                                         <div className="flex justify-between text-xs md:text-sm">
                                             <span className="text-slate-400">Sisa Tagihan</span>
                                             <span className="font-bold text-red-400">Rp {((detailTransaction.totalAmount + detailTransaction.depositAmount) - detailTransaction.amountPaid).toLocaleString('id-ID')}</span>
                                         </div>
                                         <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                             <div 
                                                className="bg-green-500 h-full transition-all duration-500" 
                                                style={{ width: `${Math.min(100, (detailTransaction.amountPaid / (detailTransaction.totalAmount + detailTransaction.depositAmount)) * 100)}%` }} 
                                             />
                                         </div>
                                     </div>

                                     <div className="pt-6 mt-6 border-t border-slate-700">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => {
                                                    setDetailTransaction(null);
                                                    openPaymentModal(detailTransaction);
                                                }}
                                                disabled={detailTransaction.amountPaid >= (detailTransaction.totalAmount + detailTransaction.depositAmount)}
                                                className="w-full py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                                            >
                                                Bayar
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setDetailTransaction(null);
                                                    handleEditClick(detailTransaction);
                                                }}
                                                className="w-full py-2.5 md:py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors text-sm md:text-base"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingTransaction && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto border-2 border-slate-200 dark:border-slate-700 animate-scale-up">
                 <h3 className="text-xl md:text-2xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">Edit Transaksi</h3>
                 <form onSubmit={handleUpdateTransaction} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                         <div>
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Mulai</label>
                             <input type="date" value={editFormData.startDate as string} onChange={e => setEditFormData({...editFormData, startDate: e.target.value})} className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium" />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Selesai</label>
                             <input type="date" value={editFormData.endDate as string} onChange={e => setEditFormData({...editFormData, endDate: e.target.value})} className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium" />
                         </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4 md:gap-6">
                         <div>
                             <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Total Sewa</label>
                             <input type="number" value={editFormData.totalAmount} onChange={e => setEditFormData({...editFormData, totalAmount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium" />
                         </div>
                         <div>
                             <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Deposit</label>
                             <input type="number" value={editFormData.depositAmount} onChange={e => setEditFormData({...editFormData, depositAmount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium" />
                         </div>
                         <div>
                             <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sudah Dibayar</label>
                             <input type="number" value={editFormData.amountPaid} onChange={e => setEditFormData({...editFormData, amountPaid: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium" />
                         </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                         <div>
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status Transaksi</label>
                             <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as TransactionStatus})} className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium">
                                 {Object.values(TransactionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status Pembayaran</label>
                             <select value={editFormData.paymentStatus} onChange={e => setEditFormData({...editFormData, paymentStatus: e.target.value as PaymentStatus})} className="w-full px-3 py-2.5 md:px-4 md:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium">
                                 {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                         </div>
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bukti Pembayaran</label>
                         <div className="flex items-center gap-4">
                            {editFormData.paymentProofUrl && (
                                <img src={editFormData.paymentProofUrl} alt="Proof" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                            )}
                            <input type="file" ref={editFileInputRef} onChange={handleEditImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300" />
                         </div>
                     </div>

                     <div className="flex justify-end gap-4 pt-6">
                         <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm md:text-base">Batal</button>
                         <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 text-sm md:text-base">Simpan Perubahan</button>
                     </div>
                 </form>
             </div>
         </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTransactionId}
        onClose={() => setDeleteTransactionId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan."
      />
    </div>
  );
};

export default Cashier;