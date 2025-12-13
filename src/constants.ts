import { HearingAid, Invoice, Quotation, FinancialNote, Lead } from './types';

export const CLINIC_GSTIN = "19AALCB1534C1ZY"; 
export const CLINIC_UDYAM = "WB-18-0032916";

export const COMPANY_NAME = "Bengal Rehabilitation & Research Pvt. Ltd.";
export const COMPANY_TAGLINE = "Bengal's Largest Hospital-based Hearing & Speech Chain";
export const COMPANY_ADDRESS = "Kalipur, Purba Nischintapur, Pujali, Budge Budge, Kolkata-700138, WB, India";
export const COMPANY_PHONES = "6291236283 / 9874925867";
export const COMPANY_EMAIL = "infobrg18@gmail.com";

export const COUNTRIES = ["India", "Bangladesh", "Nepal", "Bhutan", "Sri Lanka", "Others"];

export const INDIAN_STATES = [
  "West Bengal", "Bihar", "Jharkhand", "Odisha", "Assam", "Sikkim", 
  "Tripura", "Meghalaya", "Manipur", "Nagaland", "Mizoram", "Arunachal Pradesh",
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala",
  "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Punjab", "Haryana", "Other"
];

export const COMPANY_BANK_ACCOUNTS = [
  {
    name: "SBI CA",
    accountNumber: "42367906742",
    ifsc: "SBIN0001357",
    branch: "Thakurpukur"
  },
  {
    name: "SBI CC",
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
  }
];

export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
export const INITIAL_FINANCIAL_NOTES: FinancialNote[] = [];
export const INITIAL_LEADS: Lead[] = [];

export const COMPANY_LOGO_BASE64 = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='https://bengalrehabilitationgroup.com/images/brg_logo.png' viewBox='0 0 200 200'%3E%3Cpath fill='none' stroke='%231e40af' stroke-width='8' d='M100,185 C30,130 10,90 10,55 C10,20 40,5 70,5 C90,5 100,20 100,20 C100,20 110,5 130,5 C160,5 190,20 190,55 C190,90 170,130 100,185 Z'/%3E%3Cpath fill='%231e40af' d='M135,45 C125,45 115,55 115,75 C115,95 125,115 135,115 C145,115 150,100 150,90' stroke='%231e40af' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Cpath d='M70,60 L90,60 M60,80 L100,80 M70,100 L90,100' stroke='%231e40af' stroke-width='6' stroke-linecap='round'/%3E%3Ctext x='100' y='150' font-family='sans-serif' font-size='12' fill='%231e40af' text-anchor='middle' opacity='0'%3EBRG%3C/text%3E%3C/svg%3E`;
