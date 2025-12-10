import { Item, ItemStatus, Tenant, Transaction, TransactionStatus, PaymentStatus } from './types';

export const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Main Frame 170cm', category: 'Frame', stock: 500, rentedCount: 150, pricePerMonth: 45000, status: ItemStatus.AVAILABLE },
  { id: '2', name: 'Cross Brace 220cm', category: 'Bracing', stock: 1000, rentedCount: 300, pricePerMonth: 35000, status: ItemStatus.AVAILABLE },
  { id: '3', name: 'Joint Pin', category: 'Aksesoris', stock: 2000, rentedCount: 600, pricePerMonth: 10000, status: ItemStatus.AVAILABLE },
  { id: '4', name: 'Jack Base 60cm', category: 'Base', stock: 400, rentedCount: 100, pricePerMonth: 30000, status: ItemStatus.AVAILABLE },
  { id: '5', name: 'Catwalk / Platform', category: 'Platform', stock: 200, rentedCount: 195, pricePerMonth: 75000, status: ItemStatus.AVAILABLE },
  { id: '6', name: 'U-Head Jack', category: 'Base', stock: 300, rentedCount: 50, pricePerMonth: 32000, status: ItemStatus.AVAILABLE },
  { id: '7', name: 'Pipe Support / Steer', category: 'Support', stock: 100, rentedCount: 100, pricePerMonth: 60000, status: ItemStatus.RENTED },
  { id: '8', name: 'Ladder Frame 90cm', category: 'Frame', stock: 150, rentedCount: 10, pricePerMonth: 42000, status: ItemStatus.AVAILABLE },
];

export const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: 'PT. Konstruksi Jaya', ktp: '3201234567890001', phone: '081234567890', emergencyContact: '08111222333', address: 'Jl. Merdeka No. 10, Jakarta', email: 'procurement@konstruksijaya.com' },
  { id: '2', name: 'CV. Bangun Mandiri', ktp: '3201234567890002', phone: '081234567891', emergencyContact: '08122333444', address: 'Jl. Sudirman No. 45, Bandung', email: 'admin@bangunmandiri.com' },
  { id: '3', name: 'Bapak Ahmad (Personal)', ktp: '3201234567890003', phone: '081234567892', emergencyContact: '08133444555', address: 'Jl. Ahmad Yani No. 8, Surabaya', email: 'ahmad.reno@gmail.com' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: 'TRX-001', 
    tenantId: '1', 
    itemId: '1', 
    itemName: 'Main Frame 170cm', 
    quantity: 100, 
    startDate: '2023-10-25', 
    endDate: '2023-11-25', 
    totalAmount: 4500000,
    depositAmount: 1000000, // Deposit example
    isDepositReturned: true,
    amountPaid: 5500000, // Total + Deposit
    paymentStatus: PaymentStatus.PAID, 
    status: TransactionStatus.COMPLETED 
  },
  { 
    id: 'TRX-002', 
    tenantId: '2', 
    itemId: '5', 
    itemName: 'Catwalk / Platform', 
    quantity: 50, 
    startDate: new Date(Date.now() - 86400000 * 15).toISOString(), 
    endDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    totalAmount: 3750000,
    depositAmount: 500000,
    isDepositReturned: false,
    amountPaid: 2000000, // Paid Deposit (500k) + Partial Rent (1.5m)
    paymentStatus: PaymentStatus.PARTIAL, 
    status: TransactionStatus.ACTIVE 
  },
  { 
    id: 'TRX-003', 
    tenantId: '3', 
    itemId: '4', 
    itemName: 'Jack Base 60cm', 
    quantity: 20, 
    startDate: new Date(Date.now() - 86400000 * 40).toISOString(), 
    endDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    totalAmount: 600000, 
    depositAmount: 0,
    isDepositReturned: false,
    amountPaid: 0, 
    paymentStatus: PaymentStatus.UNPAID, 
    status: TransactionStatus.OVERDUE 
  },
];