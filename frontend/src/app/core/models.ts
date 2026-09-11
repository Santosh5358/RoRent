export type Role = 'OWNER' | 'TENANT';
export type RoomStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type TenantStatus = 'ACTIVE' | 'INACTIVE';
export type ReadingSource = 'OCR' | 'MANUAL';
export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentCategory = 'RENT' | 'ELECTRICITY' | 'BOTH' | 'OTHER';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  tenantId?: number;
  mustChangePassword?: boolean;
}

export interface Property {
  id: number;
  name: string;
  address?: string;
  defaultElectricityRate?: number;
}

export interface Room {
  id: number;
  propertyId: number;
  roomNumber: string;
  floor?: string;
  monthlyRent: number;
  electricityRate?: number;
  electricityBillingMethod?: string;
  status: RoomStatus;
  currentTenantId?: number;
}

export interface Tenant {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  idDocumentNumber?: string;
  moveInDate?: string;
  moveOutDate?: string;
  securityDeposit?: number;
  propertyId?: number;
  roomId?: number;
  monthlyRent?: number;
  status: TenantStatus;
}

export interface MeterReading {
  id: number;
  roomId: number;
  tenantId?: number;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  pricePerUnit: number;
  electricityAmount: number;
  imageUrl?: string;
  readingSource: ReadingSource;
  ocrDetectedReading?: string;
  meterReset: boolean;
  createdAt: string;
}

export interface Bill {
  id: number;
  tenantId: number;
  roomId: number;
  billingMonth: string;
  rentAmount: number;
  previousReading?: number;
  currentReading?: number;
  unitsConsumed?: number;
  pricePerUnit?: number;
  electricityAmount: number;
  otherCharges: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  dueDate: string;
  status: BillStatus;
}

export interface Payment {
  id: number;
  billId: number;
  tenantId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}

export interface OcrScanResponse {
  imageUrl: string;
  previousReading: number;
  detectedReading?: string;
  confidence: number;
  provider: string;
  rawText: string;
  appliedRate: number;
}

export interface Dashboard {
  totalProperties: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  rentThisMonth: number;
  electricityThisMonth: number;
  totalBilledThisMonth: number;
  totalCollected: number;
  totalPending: number;
  recentPayments: Payment[];
  recentReadings: MeterReading[];
  recentBills: Bill[];
  overdueBills: Bill[];
  notifications: string[];
}

export interface ElectricityRate {
  id: number;
  propertyId?: number;
  roomId?: number;
  pricePerUnit: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface TenantProfile {
  tenantId: number;
  name: string;
  phone?: string;
  email?: string;
  propertyName?: string;
  roomNumber?: string;
  floor?: string;
  monthlyRent?: number;
  currentElectricityRate?: number;
  totalOutstanding: number;
  totalBills: number;
  unpaidBills: number;
}

export interface PaymentSubmission {
  id: number;
  ownerId: number;
  tenantId: number;
  billId: number;
  category: PaymentCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  note?: string;
  slipImageUrl: string;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewNote?: string;
  paymentId?: number;
}
