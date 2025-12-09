export enum ItemStatus {
  AVAILABLE = 'Tersedia',
  RENTED = 'Disewa',
  MAINTENANCE = 'Perbaikan',
}

export interface Item {
  id: string;
  name: string;
  category: string;
  stock: number;
  rentedCount: number;
  pricePerDay: number;
  status: ItemStatus;
  imageUrl?: string;
}

export interface Tenant {
  id: string;
  name: string;
  ktp: string;
  phone: string;
  emergencyContact: string;
  address: string;
  email: string;
}

export enum TransactionStatus {
  ACTIVE = 'Aktif', // Barang masih di penyewa
  COMPLETED = 'Selesai', // Barang sudah kembali
  OVERDUE = 'Terlambat', // Melewati batas waktu
}

export enum PaymentStatus {
  PAID = 'Lunas',
  PARTIAL = 'DP / Sebagian',
  UNPAID = 'Belum Bayar',
}

export interface Transaction {
  id: string;
  tenantId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  totalAmount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  status: TransactionStatus;
  notes?: string;
  paymentProofUrl?: string; // New field for payment proof image
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'cashier';
}

export interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrisUrl: string;
}