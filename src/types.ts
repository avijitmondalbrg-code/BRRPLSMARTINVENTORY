export interface HearingAid {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  price: number; // Base Price (Taxable Value)
  location: string; // e.g., 'Batanagar Mall', 'Fortis', 'AM'
  status: 'Available' | 'Sold' | 'In-Transit';
  addedDate: string;
  hsnCode?: string;
  gstRate?: number; // Percentage (e.g., 12, 18)
}

export interface Patient {
  id: string;
  name: string;
  address: string;
  state?: string;
  country?: string;
  phone: string;
  email?: string;
  referDoctor: string;
  audiologist: string;
  gstin?: string; // Patient's GSTIN (for B2B)
  addedDate?: string; // Date patient was added to system
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Account Transfer' | 'Cheque' | 'UPI' | 'EMI' | 'Credit Card' | 'Debit Card' | 'Credit Note';
  note?: string;
  bankDetails?: string; // Stores which company bank account received the money
}

export interface InvoiceItem {
  hearingAidId: string;
  brand: string;
  model: string;
  serialNumber: string;
  price: number; // Unit Price
  hsnCode?: string;
  gstRate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string; // Denormalized for display ease
  items: InvoiceItem[];
  
  // Financials
  subtotal: number; // Sum of Unit Prices
  discountType: 'flat' | 'percent';
  discountValue: number;
  totalDiscount: number;
  
  // Tax
  placeOfSupply: 'Intra-State' | 'Inter-State'; // Within State vs Outside
  totalTaxableValue: number; // (Subtotal - Discount)
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTax: number;
  
  finalTotal: number; // Taxable + Tax
  
  date: string;
  notes?: string;
  warranty?: string;
  patientDetails?: Patient; // Snapshot of patient details
  
  // Payment Tracking
  payments: PaymentRecord[];
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  balanceDue: number;
}

export interface Quotation {
  id: string;
  patientId: string;
  patientName: string;
  items: InvoiceItem[];
  
  subtotal: number;
  discountType: 'flat' | 'percent';
  discountValue: number;
  
  totalTaxableValue: number;
  totalTax: number;
  
  finalTotal: number;
  date: string;
  notes?: string;
  warranty?: string;
  patientDetails?: Patient;
  status: 'Draft' | 'Sent' | 'Converted';
}

export interface FinancialNote {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  date: string;
  patientId: string;
  patientName: string;
  referenceInvoiceId?: string;
  amount: number;
  reason: string;
  patientDetails?: Patient;
}

export interface StockTransfer {
  id: string;
  hearingAidId: string;
  brand: string;
  model: string;
  serialNumber: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  sender?: string;
  transporter?: string;
  receiver?: string;
  note?: string;
}

// CRM Types
export type LeadStatus = 'New' | 'Contacted' | 'Appointment' | 'Trial' | 'Won' | 'Lost';

export interface Activity {
  id: string;
  type: 'Call' | 'Visit' | 'WhatsApp' | 'Email' | 'Note' | 'SMS';
  date: string;
  content: string;
  outcome?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string; // e.g. 'Walk-in', 'Facebook', 'Referral'
  status: LeadStatus;
  assignedTo?: string;
  createdAt: string;
  nextFollowUp?: string;
  notes?: string;
  activities: Activity[];
  value?: number; // Potential value
}

export type ViewState = 'front-cover' | 'dashboard' | 'inventory' | 'billing' | 'quotation' | 'transfer' | 'patients' | 'credit-note' | 'debit-note' | 'crm' | 'settings' | 'receipts';
export type UserRole = 'admin' | 'user';

export const LOCATIONS = [
  'Batanagar Mall',
  'Fortis',
  'AM',
  'RNT',
  'NH SUPER',
  'NH MULTI',
  'NH BARASAT',
  'MANIPAL DHAKURIA',
  'MANIPAL SALTLAKE',
  'NIDAN',
  'OTHERS'
];

export const BRANDS = [
  'Phonak',
  'Resound',
  'Signia',
  'Unitron',
  'Alps'
];