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
  { name: "SBI CA", accountNumber: "42367906742", ifsc: "SBIN0001357", branch: "Thakurpukur" },
  { name: "SBI CC", accountNumber: "42736238038", ifsc: "SBIN0001357", branch: "Thakurpukur" },
  { name: "IDFC Bank", accountNumber: "10140107256", ifsc: "IDFB0060117", branch: "Kolkata, Sarat Bose Road" },
  { name: "Indian Bank", accountNumber: "7364388282", ifsc: "IDIB000N601", branch: "Nischintapur" }
];

export const INITIAL_INVENTORY: HearingAid[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
export const INITIAL_FINANCIAL_NOTES: FinancialNote[] = [];
export const INITIAL_LEADS: Lead[] = [];

// Forcefully set the logo URL
export const COMPANY_LOGO_BASE64 = `https://bengalrehabilitationgroup.com/images/brg_logo.png`;

export const getFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) {
    const nextYear = (year + 1).toString().slice(-2);
    return `${year.toString().slice(-2)}-${nextYear}`;
  } else {
    const prevYear = (year - 1).toString().slice(-2);
    return `${prevYear}-${year.toString().slice(-2)}`;
  }
};