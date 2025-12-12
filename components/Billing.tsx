
import React, { useState, useEffect } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole } from '../types';
import { generateInvoiceNote } from '../services/geminiService';
import { CLINIC_GSTIN, COUNTRIES, INDIAN_STATES } from '../constants';
import { User, FileText, Printer, Save, Loader2, Sparkles, Ear, Eye, Download, Plus, ArrowLeft, Edit, Search, ShieldCheck, Users, Check, CreditCard, Banknote, X, Receipt as ReceiptIcon, MapPin, PenBox, History, Globe, Trash2 } from 'lucide-react';
import { Receipt } from './Receipt';

interface BillingProps {
  inventory: HearingAid[];
  invoices?: Invoice[];
  patients: Patient[];
  onCreateInvoice: (invoice: Invoice, soldItemIds: string[]) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
  // FIX: Added onDelete prop to fix Error in file App.tsx on line 305
  onDelete?: (invoiceId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
}

// Utility to convert number to words (Indian System)
const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
        if ((n = n.toString() as any).length > 9) return 'overflow';
        const n_array: any[] = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/) || [];
        if (!n_array) return '';
        let str = '';
        str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
        str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
        str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
        str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
        str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
        return str;
    };

    const wholePart = Math.floor(num);
    return inWords(wholePart) + 'Rupees Only';
};

export const Billing: React.FC<BillingProps> = ({ inventory, invoices = [], patients, onCreateInvoice, onUpdateInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'review'>('patient');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Payment History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalInvoice, setHistoryModalInvoice] = useState<Invoice | null>(null);

  // FIX: Added helper functions to handle opening modals with proper state initialization
  const openPaymentModal = (invoice: Invoice) => {
    setPaymentModalInvoice(invoice);
    setNewPaymentAmount(invoice.balanceDue);
    setShowPaymentModal(true);
  };

  const openHistoryModal = (invoice: Invoice) => {
    setHistoryModalInvoice(invoice);
    setShowHistoryModal(true);
  };

  // Receipt State
  const [receiptData, setReceiptData] = useState<{ payment: PaymentRecord, invoice: Invoice } | null>(null);

  // Patient Search State
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  // Product Search State
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Form State
  const [patient, setPatient] = useState<Patient>({
    id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState<'Intra-State' | 'Inter-State'>('Intra-State');

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [originalInvoiceItemIds, setOriginalInvoiceItemIds] = useState<string[]>([]); 
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>({});
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [aiNote, setAiNote] = useState<string>('');
  const [generatingNote, setGeneratingNote] = useState(false);

  useEffect(() => {
    if (patient.state) {
        const isWestBengal = patient.state.toLowerCase() === 'west bengal';
        setPlaceOfSupply(isWestBengal ? 'Intra-State' : 'Inter-State');
    }
  }, [patient.state]);

  const resetForm = () => {
    setStep('patient');
    setPatient({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' });
    setPhoneError('');
    setPlaceOfSupply('Intra-State');
    setSelectedItemIds([]);
    setOriginalInvoiceItemIds([]);
    setGstOverrides({});
    setDiscountValue(0);
    setWarranty('2 Years Standard Warranty');
    setAiNote('');
    setEditingInvoiceId(null);
    setPatientSearchTerm('');
    setProductSearchTerm('');
    setInitialPayment(0);
    setPaymentMethod('Cash');
  };

  // FIX: Renamed generateNextInvoiceId to generateNextId for consistency with other components
  const generateNextId = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    const yearIds = invoices.map(inv => inv.id).filter(id => id.startsWith(prefix));
    if (yearIds.length === 0) return `${prefix}001`;
    const maxSeq = yearIds.reduce((max, id) => {
        const parts = id.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        return !isNaN(seq) && seq > max ? seq : max;
    }, 0);
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const handleStartNew = () => {
    resetForm();
    setViewMode('create');
  };

  const handleViewEdit = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    if (invoice.patientDetails) {
        setPatient(invoice.patientDetails);
    } else {
        setPatient({
            id: invoice.patientId, name: invoice.patientName, address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: ''
        });
    }
    setPlaceOfSupply(invoice.placeOfSupply || 'Intra-State');
    
    const currentItemIds = invoice.items.map(i => i.hearingAidId);
    setSelectedItemIds(currentItemIds);
    setOriginalInvoiceItemIds(currentItemIds);

    const overrides: Record<string, number> = {};
    invoice.items.forEach(i => {
        overrides[i.hearingAidId] = i.gstRate;
    });
    setGstOverrides(overrides);

    setDiscountType(invoice.discountType);
    setDiscountValue(invoice.discountValue);
    setWarranty(invoice.warranty || '2 Years Standard Warranty');
    setAiNote(invoice.notes || '');
    setInitialPayment(0); 
    setViewMode('edit');
    setStep('review');
  };

  const handleSelectPatient = (p: Patient) => {
    setPatient({
        ...p,
        state: p.state || 'West Bengal',
        country: p.country || 'India'
    });
    setPhoneError('');
    setPatientSearchTerm('');
    setShowPatientResults(false);
  };

  const handlePatientPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setPatient({ ...patient, phone });

    const phoneRegex = /^[6-9]\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
    } else {
      setPhoneError("");
    }
  };
  
  const handleGoToProductStep = () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!patient.phone || !phoneRegex.test(patient.phone)) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!patient.name) {
        alert("Patient Name is required.");
        return;
    }
    setStep('product');
  };

  const availableInventory = inventory.filter(i => 
    i.status === 'Available' || 
    (editingInvoiceId && originalInvoiceItemIds.includes(i.id))
  );

  const selectedInventoryItems = inventory.filter(i => selectedItemIds.includes(i.id));
  const subtotal = selectedInventoryItems.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = discountType === 'flat' ? discountValue : (subtotal * discountValue) / 100;
  
  let runningTaxableTotal = 0, runningCGST = 0, runningSGST = 0, runningIGST = 0, runningFinalTotal = 0;

  const invoiceItems: InvoiceItem[] = selectedInventoryItems.map(item => {
      const itemRatio = subtotal > 0 ? item.price / subtotal : 0;
      const itemDiscount = discountAmount * itemRatio;
      const itemTaxable = item.price - itemDiscount;
      const gstRate = gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0);
      const taxAmount = itemTaxable * (gstRate / 100);
      const isIntra = placeOfSupply === 'Intra-State';
      const cgst = isIntra ? taxAmount / 2 : 0;
      const sgst = isIntra ? taxAmount / 2 : 0;
      const igst = isIntra ? 0 : taxAmount;
      runningTaxableTotal += itemTaxable; runningCGST += cgst; runningSGST += sgst; runningIGST += igst; runningFinalTotal += (itemTaxable + taxAmount);
      return {
          hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber,
          price: item.price, hsnCode: item.hsnCode, gstRate, taxableValue: itemTaxable,
          cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: itemTaxable + taxAmount
      };
  });

  const finalTotal = runningFinalTotal;
  const totalTax = runningCGST + runningSGST + runningIGST;

  const handleSaveInvoice = async () => {
    const finalId = editingInvoiceId || generateNextId();
    let payments: PaymentRecord[] = [];
    let balanceDue = finalTotal;
    let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';

    if (editingInvoiceId) {
        const existing = invoices.find(i => i.id === editingInvoiceId);
        payments = existing ? existing.payments : [];
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        balanceDue = Math.max(0, finalTotal - totalPaid);
        if (balanceDue <= 1) paymentStatus = 'Paid';
        else if (totalPaid > 0) paymentStatus = 'Partial';
    } else {
        if (initialPayment > 0) {
            payments.push({ id: `PAY-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: initialPayment, method: paymentMethod, note: 'Initial Payment' });
            balanceDue = Math.max(0, finalTotal - initialPayment);
            paymentStatus = balanceDue <= 1 ? 'Paid' : 'Partial';
        }
    }

    const invoiceData: Invoice = {
      id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: invoiceItems,
      subtotal, discountType, discountValue, totalDiscount: discountAmount, placeOfSupply,
      totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: runningIGST, totalTax,
      finalTotal, date: new Date().toISOString().split('T')[0], notes: aiNote, warranty, patientDetails: patient, payments, balanceDue, paymentStatus
    };

    if (editingInvoiceId && onUpdateInvoice) onUpdateInvoice(invoiceData);
    else onCreateInvoice(invoiceData, selectedItemIds);
    resetForm(); setViewMode('list');
  };

  const handleAddPayment = () => {
      if (!paymentModalInvoice || !onUpdateInvoice) return;
      if (newPaymentAmount <= 0) { alert("Please enter a valid amount"); return; }
      const updatedPayments = [...paymentModalInvoice.payments, { id: `PAY-${Date.now()}`, date: newPaymentDate, amount: newPaymentAmount, method: newPaymentMethod, note: 'Additional Payment' }];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = paymentModalInvoice.finalTotal - totalPaid;
      let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = balanceDue <= 0.1 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
      onUpdateInvoice({ ...paymentModalInvoice, payments: updatedPayments, balanceDue: Math.max(0, balanceDue), paymentStatus });
      setShowPaymentModal(false);
  };

  const handlePrint = () => window.print();

  const renderInvoiceOrEdit = () => {
      const existingPayments = editingInvoiceId && invoices.find(i => i.id === editingInvoiceId)?.payments || [];
      const totalPaidAmount = editingInvoiceId ? existingPayments.reduce((acc, curr) => acc + curr.amount, 0) : initialPayment;
      const currentBalanceDue = Math.max(0, finalTotal - totalPaidAmount);
      let displayStatus = currentBalanceDue <= 1 ? 'Paid' : (totalPaidAmount > 0 ? 'Part Paid' : 'Unpaid');

      return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600"><ArrowLeft size={24} /></button>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-primary" />{viewMode === 'edit' ? 'View / Edit Invoice' : 'New Invoice'}</h2>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => setStep('patient')} className={`px-3 py-1 rounded-full text-sm font-medium transition ${step === 'patient' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>1. Patient</button>
                    <button onClick={() => setStep('product')} disabled={!patient.name} className={`px-3 py-1 rounded-full text-sm font-medium transition ${step === 'product' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>2. Select Device</button>
                    <button onClick={() => setStep('review')} disabled={selectedItemIds.length === 0} className={`px-3 py-1 rounded-full text-sm font-medium transition ${step === 'review' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>3. Review & Pay</button>
                </div>
            </div>

            {step === 'patient' && (
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200 animate-fade-in print:hidden">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Patient Information</h3>
                    <div className="mb-6 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Existing Patient</label>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input type="text" placeholder="Start typing name or phone..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={patientSearchTerm} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} />
                        </div>
                        {showPatientResults && patientSearchTerm && (
                            <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                                {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || p.phone.includes(patientSearchTerm)).map(p => (
                                    <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-4 py-3 hover:bg-teal-50 border-b border-gray-50 last:border-0 flex justify-between items-center">
                                        <div><p className="font-medium text-gray-800">{p.name}</p><p className="text-xs text-gray-500">{p.phone}</p></div>
                                        <span className="text-teal-600 text-xs bg-teal-100 px-2 py-1 rounded-full">Select</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label><input required className="w-full border rounded-lg p-2" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input required className={`w-full border rounded-lg p-2 focus:ring-2 ${phoneError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500'}`} value={patient.phone} onChange={handlePatientPhoneChange} />{phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}</div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label><input type="email" className="w-full border rounded-lg p-2" value={patient.email || ''} onChange={e => setPatient({...patient, email: e.target.value})} placeholder="Optional" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (Optional)</label><input className="w-full border rounded-lg p-2" value={patient.gstin || ''} onChange={e => setPatient({...patient, gstin: e.target.value})} placeholder="For B2B" /></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input className="w-full border rounded-lg p-2" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div>
                    </div>
                    <div className="flex justify-end mt-4"><button onClick={handleGoToProductStep} disabled={!patient.name || !patient.phone || !!phoneError} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition disabled:opacity-50">Next: Select Device &rarr;</button></div>
                </div>
            )}

            {step === 'product' && (
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200 print:hidden">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Select Hearing Aid(s)</h3>
                    <div className="mb-6 max-h-80 overflow-y-auto border rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 sticky top-0 z-10"><tr><th className="p-3">Select</th><th className="p-3">Details</th><th className="p-3">Serial</th><th className="p-3 text-right">Price (Base)</th></tr></thead>
                            <tbody className="divide-y">
                                {availableInventory.map(item => (
                                    <tr key={item.id} className={selectedItemIds.includes(item.id) ? "bg-teal-50" : "hover:bg-gray-50"}>
                                        <td className="p-3"><input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) setSelectedItemIds(selectedItemIds.filter(id=>id!==item.id)); else setSelectedItemIds([...selectedItemIds, item.id]); }} className="h-4 w-4 text-teal-600"/></td>
                                        <td className="p-3 font-medium">{item.brand} {item.model}</td>
                                        <td className="p-3 font-mono text-xs">{item.serialNumber}</td>
                                        <td className="p-3 font-medium">₹{item.price.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-medium mb-3 flex items-center gap-2"><Sparkles size={16}/> Discount</h4>
                            <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="border rounded p-2 w-full" />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-medium mb-3 flex items-center gap-2"><ShieldCheck size={16}/> Warranty</h4>
                            <input type="text" value={warranty} onChange={(e) => setWarranty(e.target.value)} className="border rounded p-2 w-full" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={() => setStep('patient')} className="text-gray-600 hover:underline">Back</button>
                        <button onClick={() => setStep('review')} disabled={selectedItemIds.length === 0} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition">Next: Review &rarr;</button>
                    </div>
                </div>
            )}

            {step === 'review' && (
                <div id="invoice-printable-area" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 bg-gray-50 border-b flex justify-between items-center print:hidden">
                        <h3 className="text-xl font-bold text-gray-800">Invoice Preview</h3>
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white border px-3 py-1 rounded shadow-sm hover:shadow"><Printer size={18}/> Print</button>
                            <button onClick={handleSaveInvoice} className="flex items-center gap-2 bg-primary text-white px-4 py-1 rounded shadow-md hover:bg-teal-800"><Save size={18}/> {editingInvoiceId ? 'Update' : 'Save'}</button>
                        </div>
                    </div>
                    <div className="p-8 space-y-6 text-sm text-gray-800">
                        <div className="flex justify-between items-start border-b pb-6">
                            <div className="flex gap-4">
                                <div className="h-20 w-20 flex items-center justify-center overflow-hidden"><img src={logo} alt="Logo" className="h-full w-full object-contain"/></div>
                                <div><h1 className="text-xl font-bold text-gray-800 uppercase">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1><p className="text-xs font-semibold text-gray-500 italic">Bengal's Largest Hearing Chain</p><p>GSTIN: <b>{CLINIC_GSTIN}</b></p></div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-xl uppercase tracking-wider">TAX INVOICE</p>
                                <p className="text-gray-500 mb-1">#{editingInvoiceId || generateNextId()}</p>
                                <p><b>Date:</b> {new Date().toLocaleDateString()}</p>
                                <div className={`mt-2 px-2 py-1 text-xs font-bold uppercase inline-block rounded border ${displayStatus === 'Paid' ? 'text-green-600 border-green-600' : 'text-orange-600 border-orange-600'}`}>{displayStatus}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div><h4 className="font-bold text-gray-700 uppercase text-xs mb-2 border-b w-20">Bill To</h4><p className="font-bold">{patient.name}</p><p>{patient.address}</p><p>{patient.phone}</p></div>
                            <div><h4 className="font-bold text-gray-700 uppercase text-xs mb-2 border-b w-20">Details</h4><p><b>Referred By:</b> {patient.referDoctor}</p><p><b>Audiologist:</b> {patient.audiologist}</p></div>
                        </div>
                        <table className="w-full mt-4 border-collapse border border-gray-300 text-xs">
                            <thead className="bg-gray-100 text-gray-700"><tr><th className="border border-gray-300 p-2 text-left w-10">#</th><th className="border border-gray-300 p-2 text-left">Description</th><th className="border border-gray-300 p-2 text-right">Base Price</th><th className="border border-gray-300 p-2 text-right">Total</th></tr></thead>
                            <tbody>{invoiceItems.map((item, idx) => (
                                <tr key={item.hearingAidId}><td className="border border-gray-300 p-2 text-center">{idx + 1}</td><td className="border border-gray-300 p-2"><p className="font-bold">{item.brand} {item.model}</p><p className="text-gray-500">SN: {item.serialNumber}</p></td><td className="border border-gray-300 p-2 text-right">₹{item.price.toLocaleString()}</td><td className="border border-gray-300 p-2 text-right">₹{item.totalAmount.toLocaleString()}</td></tr>
                            ))}</tbody>
                        </table>
                        <div className="flex justify-end mt-4"><div className="w-1/2">
                            <table className="w-full text-xs border border-gray-300"><tbody>
                                <tr><td className="p-2 border-b font-medium text-right">Subtotal:</td><td className="p-2 border-b text-right font-mono">₹{subtotal.toLocaleString()}</td></tr>
                                <tr><td className="p-2 border-b font-medium text-right text-gray-600">Discount:</td><td className="p-2 border-b text-right font-mono text-gray-600">-₹{discountAmount.toLocaleString()}</td></tr>
                                <tr className="bg-gray-100 text-sm"><td className="p-2 font-bold text-right border-b">Grand Total:</td><td className="p-2 text-right font-bold font-mono border-b">₹{finalTotal.toLocaleString()}</td></tr>
                            </tbody></table>
                        </div></div>
                        <div className="text-xs text-gray-500 border-b pb-4"><p className="mb-1"><span className="font-bold">Amount in Words:</span> <span className="uppercase font-medium text-gray-800">{numberToWords(Math.round(finalTotal))}</span></p></div>
                        <div className="mt-8 pt-4 flex justify-between items-end text-xs text-gray-500">
                            <div className="w-3/4 pr-4"><p className="font-bold mb-1">Declarations:</p><p className="text-[10px] text-gray-600">Hearing aids are exempt from GST under Notification 2/2017 CT(Rate).</p></div>
                            <div className="text-center flex-shrink-0">{signature ? <img src={signature} alt="Signature" className="h-16 mb-2 mx-auto object-contain" /> : <div className="h-16 w-40 border-b border-gray-300 mb-2"></div>}<p className="font-bold uppercase">Authorized Signatory</p></div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'list' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />Invoice Management</h2>
                        <button onClick={handleStartNew} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"><Plus size={20} />New Invoice</button>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b"><tr><th className="p-4">Invoice ID</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Actions</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">{invoices.filter(inv => inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || inv.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-mono text-sm text-teal-700">{inv.id}</td>
                                    <td className="p-4 text-gray-600 text-sm">{inv.date}</td>
                                    <td className="p-4 font-medium">{inv.patientName}</td>
                                    <td className="p-4 text-right font-bold text-gray-800">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${inv.balanceDue <= 1 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{inv.balanceDue <= 1 ? 'Paid' : 'Unpaid'}</span></td>
                                    <td className="p-4 flex justify-center gap-1">
                                        <button onClick={() => handleViewEdit(inv)} className="text-gray-600 hover:text-teal-600 p-1.5 rounded transition"><Eye size={18} /></button>
                                        <button onClick={() => openPaymentModal(inv)} disabled={inv.balanceDue <= 0} className="text-gray-600 hover:text-green-600 p-1.5 rounded transition disabled:opacity-20"><CreditCard size={18} /></button>
                                        <button onClick={() => openHistoryModal(inv)} className="text-gray-600 hover:text-blue-600 p-1.5 rounded transition"><History size={18} /></button>
                                        {userRole === 'admin' && onDelete && (
                                            <button onClick={() => { if(window.confirm(`Permanently delete invoice ${inv.id}?`)) onDelete(inv.id); }} className="text-red-500 hover:text-red-700 p-1.5 rounded-full transition" title="Delete"><Trash2 size={18}/></button>
                                        )}
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return renderInvoiceOrEdit();
};
