export interface HearingAid {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  price: number; // Base Price (Taxable Value)
  location: string;
  status: 'Available' | 'Sold' | 'In-Transit';
  addedDate: string;
  hsnCode?: string;
  gstRate?: number;
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
  gstin?: string;
  addedDate?: string; // Standardized added date for patients
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Account Transfer' | 'Cheque' | 'UPI' | 'EMI' | 'Credit Card' | 'Debit Card' | 'Credit Note';
  note?: string;
  bankDetails?: string;
}

export interface InvoiceItem {
  hearingAidId: string;
  brand: string;
  model: string;
  serialNumber: string;
  price: number;
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
  patientName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'flat' | 'percent';
  discountValue: number;
  totalDiscount: number;
  placeOfSupply: 'Intra-State' | 'Inter-State';
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTax: number;
  finalTotal: number;
  date: string;
  notes?: string;
  warranty?: string;
  patientDetails?: Patient;
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
  source: string;
  status: LeadStatus;
  assignedTo?: string;
  createdAt: string;
  nextFollowUp?: string;
  notes?: string;
  activities: Activity[];
  value?: number;
}

export type ViewState = 'front-cover' | 'dashboard' | 'inventory' | 'billing' | 'quotation' | 'transfer' | 'patients' | 'credit-note' | 'debit-note' | 'crm' | 'settings' | 'receipts';
export type UserRole = 'admin' | 'user';

export const LOCATIONS = ['Batanagar Mall', 'Fortis', 'AM', 'RNT', 'NH SUPER', 'NH MULTI', 'NH BARASAT', 'MANIPAL DHAKURIA', 'MANIPAL SALTLAKE', 'NIDAN', 'OTHERS'];
export const BRANDS = ['Phonak', 'Resound', 'Signia', 'Unitron', 'Alps'];