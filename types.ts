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

// FIX: Added missing Vendor interface to resolve import errors
export interface Vendor {
  id: string;
  name: string;
  address: string;
  gstin: string;
  addedDate: string;
}

// FIX: Added missing PurchaseRecord interface to resolve import errors
export interface PurchaseRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  brand: string;
  model: string;
  serialNumber: string;
  hsnCode: string;
  mrp: number;
  discountAmount: number;
  purchaseAmount: number;
  location: string; // Where to add in stock
  createdAt: string;
}

export interface CompanyAsset {
  id: string;
  name: string;
  serialNumber: string;
  location: string;
  type: string;
  addedDate: string;
  notes?: string;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  assetName: string;
  serialNumber: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  sender: string;
  transporter: string;
  receiver: string;
  note: string;
}

export interface Patient {
  id: string;
  name: string;
  address: string;
  district?: string;
  state?: string;
  country?: string;
  phone: string;
  email?: string;
  referDoctor: string;
  audiologist: string;
  gstin?: string; // Patient's GSTIN (for B2B)
  addedDate?: string; // Date patient was added to system
  notes?: string; // Paragraph notes about the patient
  dob?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  gstin?: string;
  pan?: string; // Added PAN field
  contactPerson?: string;
  phone?: string;
}

export interface ServiceInvoiceLine {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  discount: number; // Added item-wise discount
  taxableAmount: number; // Added taxable amount after discount
  amount: number; // Final line amount
}

export interface ServiceInvoice {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalDetails: Hospital;
  date: string;
  items: ServiceInvoiceLine[];
  subtotal: number;
  itemDiscount: number; // Total of line-item discounts
  globalAdjustment: number; // Additional global discount
  totalDiscount: number; // sum of both
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  bankAccountName?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Account Transfer' | 'Cheque' | 'UPI' | 'EMI' | 'Credit Card' | 'Debit Card' | 'Credit Note' | 'Advance';
  note?: string;
  bankDetails?: string; // Stores which company bank account received the money
}

export interface InvoiceItem {
  hearingAidId: string;
  brand: string;
  model: string;
  serialNumber: string;
  price: number; // Unit Price
  qty?: number; // Quantity
  hsnCode?: string;
  gstRate: number;
  discount: number; // Item-specific discount
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
  discountValue: number; // Sum of all item discounts
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
  entryBy?: string; // Staff member who created invoice
  
  // Payment Tracking
  payments: PaymentRecord[];
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  balanceDue: number;
}

export interface AdvanceBooking {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  address?: string;
  amount: number;
  date: string;
  modelInterest: string;
  paymentMethod: PaymentRecord['method'];
  status: 'Active' | 'Consumed' | 'Refunded';
  notes?: string;
  bankDetails?: string;
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
  entryBy?: string; // Staff member who created quotation
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

// FIX: Restored CRM Types to resolve Module not found errors
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
  address?: string;
  dob?: string;
  comment?: string;
  problem?: string;
  referDoctor?: string;
  haPotential?: 'Yes' | 'No';
  entryBy?: string;
  source: string; // e.g. 'Walk-in', 'Facebook', 'Referral'
  status: LeadStatus;
  assignedTo?: string;
  createdAt: string;
  nextFollowUp?: string;
  notes?: string;
  activities: Activity[];
  value?: number; // Potential value
  hospital?: string;
  hearingLoss?: string;
  audiologist?: string;
}

// FIX: Added 'purchases' and 'vendors' to ViewState to resolve navigation state errors
export type ViewState = 'front-cover' | 'dashboard' | 'inventory' | 'billing' | 'service-billing' | 'quotation' | 'transfer' | 'asset-transfer' | 'patients' | 'credit-note' | 'debit-note' | 'crm' | 'settings' | 'receipts' | 'advance-booking' | 'assets' | 'purchases' | 'vendors';
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
  'Home Visit'
];

export const BRANDS = [
  'Phonak',
  'Resound',
  'Signia',
  'Unitron',
  'Alps',
  'Widex',
  'Battery 13',
  'Battery 675',
  'Battery 312',
  'Battery 10',
];