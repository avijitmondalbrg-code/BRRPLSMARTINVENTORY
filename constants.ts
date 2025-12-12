

import { HearingAid, Invoice, Quotation, FinancialNote, Lead } from './types';

export const CLINIC_GSTIN = "19AALCB1534C1ZY"; // Updated GSTIN

export const COUNTRIES = ["India", "Bangladesh", "Nepal", "Bhutan", "Sri Lanka", "Others"];

export const INDIAN_STATES = [
  "West Bengal", "Bihar", "Jharkhand", "Odisha", "Assam", "Sikkim", 
  "Tripura", "Meghalaya", "Manipur", "Nagaland", "Mizoram", "Arunachal Pradesh",
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala",
  "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Punjab", "Haryana", "Other"
];

// FIX: Add and export COMPANY_BANK_ACCOUNTS to resolve import error in ReceiptsManager.
export const COMPANY_BANK_ACCOUNTS = [
  {
    name: "SBI (Current Account)",
    accountNumber: "42367906742",
    ifsc: "SBIN0001357",
    branch: "Thakurpukur"
  },
  {
    name: "SBI (Cash Credit)",
    accountNumber: "42736238038",
    ifsc: "SBIN0001357",
    branch: "Thakurpukur"
  },
  {
    name: "IDFC Bank",
    accountNumber: "10140107256",
    ifsc: "IDFB0060117",
    branch: "Kolkata, Sarat Bose Road"
  },
  {
    name: "Indian Bank",
    accountNumber: "7364388282",
    ifsc: "IDIB000N601",
    branch: "Nischintapur"
  }
];

export const INITIAL_INVENTORY: HearingAid[] = [
  {
    id: '1',
    brand: 'Phonak',
    model: 'Audeo Lumity L90',
    serialNumber: 'PH-234-889',
    price: 185000,
    location: 'Batanagar Mall',
    status: 'Available',
    addedDate: '2023-10-01',
    hsnCode: '902140',
    gstRate: 0
  },
  {
    id: '2',
    brand: 'Phonak',
    model: 'Audeo Lumity L90',
    serialNumber: 'PH-234-890',
    price: 185000,
    location: 'Fortis',
    status: 'Available',
    addedDate: '2023-10-01',
    hsnCode: '902140',
    gstRate: 0
  },
  {
    id: '3',
    brand: 'Signia',
    model: 'Pure Charge&Go 7AX',
    serialNumber: 'SG-991-002',
    price: 165000,
    location: 'Batanagar Mall',
    status: 'Available',
    addedDate: '2023-10-05',
    hsnCode: '902140',
    gstRate: 0
  },
  {
    id: '4',
    brand: 'Widex',
    model: 'Moment Sheer 440',
    serialNumber: 'WX-112-334',
    price: 192000,
    location: 'Batanagar Mall',
    status: 'Sold',
    addedDate: '2023-09-15',
    hsnCode: '902140',
    gstRate: 0
  },
  {
    id: '5',
    brand: 'Starkey',
    model: 'Evolv AI 2400',
    serialNumber: 'ST-776-123',
    price: 175000,
    location: 'AM',
    status: 'Available',
    addedDate: '2023-10-12',
    hsnCode: '902140',
    gstRate: 0
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2023-001',
    patientId: 'P-101',
    patientName: 'Rahul Sharma',
    items: [
      {
        hearingAidId: '4',
        brand: 'Widex',
        model: 'Moment Sheer 440',
        serialNumber: 'WX-112-334',
        price: 192000,
        hsnCode: '902140',
        gstRate: 0,
        taxableValue: 190000,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 190000
      }
    ],
    subtotal: 192000,
    discountType: 'flat',
    discountValue: 2000,
    totalDiscount: 2000,
    placeOfSupply: 'Intra-State',
    totalTaxableValue: 190000,
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalTax: 0,
    finalTotal: 190000,
    date: '2023-10-20',
    notes: 'Patient was referred by Dr. Gupta. Standard 2 year warranty applied.',
    warranty: '2 Years Standard Warranty',
    patientDetails: {
        id: 'P-101',
        name: 'Rahul Sharma',
        address: '123, Lake Gardens',
        state: 'West Bengal',
        country: 'India',
        phone: '9876543210',
        referDoctor: 'Dr. Gupta',
        audiologist: 'Ms. Sen'
    },
    payments: [
        {
            id: 'PAY-1',
            date: '2023-10-20',
            amount: 190000,
            method: 'Credit Card',
            note: 'Full payment'
        }
    ],
    paymentStatus: 'Paid',
    balanceDue: 0
  }
];

export const INITIAL_QUOTATIONS: Quotation[] = [];

export const INITIAL_FINANCIAL_NOTES: FinancialNote[] = [];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'L-001',
    name: 'Amit Roy',
    phone: '9800112233',
    source: 'Facebook Ad',
    status: 'New',
    createdAt: '2023-10-25',
    nextFollowUp: '2023-10-27',
    notes: 'Interested in invisible hearing aids.',
    activities: [],
    value: 150000
  },
  {
    id: 'L-002',
    name: 'Sneha Das',
    phone: '9811223344',
    source: 'Walk-in',
    status: 'Trial',
    createdAt: '2023-10-20',
    nextFollowUp: '2023-10-28',
    notes: 'Trial given for Signia Pure. Waiting for family decision.',
    activities: [
      { id: 'A-1', type: 'Visit', date: '2023-10-20', content: 'Initial Audiometry done. Mild loss.' },
      { id: 'A-2', type: 'Call', date: '2023-10-24', content: 'Called to check fit. Patient comfortable.' }
    ],
    value: 180000
  }
];

// Reliable SVG Data URI for the Blue Heart/Ear Logo (Fixed Namespace)
export const COMPANY_LOGO_BASE64 = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='https://bengalrehabilitationgroup.com/images/brg_logo.png' viewBox='0 0 200 200'%3E%3Cpath fill='none' stroke='%231e40af' stroke-width='8' d='M100,185 C30,130 10,90 10,55 C10,20 40,5 70,5 C90,5 100,20 100,20 C100,20 110,5 130,5 C160,5 190,20 190,55 C190,90 170,130 100,185 Z'/%3E%3Cpath fill='%231e40af' d='M135,45 C125,45 115,55 115,75 C115,95 125,115 135,115 C145,115 150,100 150,90' stroke='%231e40af' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Cpath d='M70,60 L90,60 M60,80 L100,80 M70,100 L90,100' stroke='%231e40af' stroke-width='6' stroke-linecap='round'/%3E%3Ctext x='100' y='150' font-family='sans-serif' font-size='12' fill='%231e40af' text-anchor='middle' opacity='0'%3EBRG%3C/text%3E%3C/svg%3E`;