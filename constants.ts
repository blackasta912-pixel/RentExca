import { Item, ItemStatus, Tenant, Transaction, TransactionStatus, PaymentStatus } from './types';

export const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Kamera Sony A7III', category: 'Kamera', stock: 5, rentedCount: 2, pricePerDay: 250000, status: ItemStatus.AVAILABLE },
  { id: '2', name: 'Lensa Canon 24-70mm', category: 'Lensa', stock: 3, rentedCount: 0, pricePerDay: 150000, status: ItemStatus.AVAILABLE },
  { id: '3', name: 'Lighting Godox SL60W', category: 'Lighting', stock: 10, rentedCount: 5, pricePerDay: 75000, status: ItemStatus.AVAILABLE },
  { id: '4', name: 'Tripod Manfrotto', category: 'Aksesoris', stock: 8, rentedCount: 1, pricePerDay: 50000, status: ItemStatus.AVAILABLE },
  { id: '5', name: 'Drone DJI Mavic Air 2', category: 'Drone', stock: 2, rentedCount: 2, pricePerDay: 350000, status: ItemStatus.RENTED },
];

export const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: 'Budi Santoso', ktp: '3201234567890001', phone: '081234567890', emergencyContact: '08111222333', address: 'Jl. Merdeka No. 10, Jakarta', email: 'budi@example.com' },
  { id: '2', name: 'Siti Aminah', ktp: '3201234567890002', phone: '081234567891', emergencyContact: '08122333444', address: 'Jl. Sudirman No. 45, Bandung', email: 'siti@example.com' },
  { id: '3', name: 'Rizky Pratama', ktp: '3201234567890003', phone: '081234567892', emergencyContact: '08133444555', address: 'Jl. Ahmad Yani No. 8, Surabaya', email: 'rizky@example.com' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: 'TRX-001', 
    tenantId: '1', 
    itemId: '1', 
    itemName: 'Kamera Sony A7III', 
    quantity: 1, 
    startDate: '2023-10-25', 
    endDate: '2023-10-27', 
    totalAmount: 500000, 
    amountPaid: 500000, 
    paymentStatus: PaymentStatus.PAID, 
    status: TransactionStatus.COMPLETED 
  },
  { 
    id: 'TRX-002', 
    tenantId: '2', 
    itemId: '5', 
    itemName: 'Drone DJI Mavic Air 2', 
    quantity: 1, 
    startDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    endDate: new Date(Date.now() + 86400000).toISOString(), // Ends tomorrow
    totalAmount: 1050000, 
    amountPaid: 500000, 
    paymentStatus: PaymentStatus.PARTIAL, 
    status: TransactionStatus.ACTIVE 
  },
  { 
    id: 'TRX-003', 
    tenantId: '3', 
    itemId: '3', 
    itemName: 'Lighting Godox SL60W', 
    quantity: 2, 
    startDate: new Date(Date.now() - 86400000 * 5).toISOString(), 
    endDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (Overdue)
    totalAmount: 600000, 
    amountPaid: 0, 
    paymentStatus: PaymentStatus.UNPAID, 
    status: TransactionStatus.OVERDUE 
  },
];