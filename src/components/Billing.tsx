import React, { useState, useEffect } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole } from '../types';
import { generateInvoiceNote } from '../services/geminiService';
import { CLINIC_GSTIN, COUNTRIES, INDIAN_STATES, COMPANY_BANK_ACCOUNTS } from '../constants';
import { User, FileText, Printer, Save, Loader2, Sparkles, Ear, Eye, Download, Plus, ArrowLeft, Edit, Search, ShieldCheck, Users, Check, CreditCard, Banknote, X, Receipt as ReceiptIcon, MapPin, PenBox, History, Globe, Landmark, Trash2 } from 'lucide-react';
import { Receipt } from './Receipt';

interface BillingProps {
  inventory: HearingAid[];
  invoices?: Invoice[];
  patients: Patient[];
  onCreateInvoice: (invoice: Invoice, soldItemIds: string[]) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
}

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
    return inWords(Math.floor(num)) + 'Rupees Only';
};

export const Billing: React.FC<BillingProps> = ({ inventory, invoices = [], patients, onCreateInvoice, onUpdateInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'review'>('patient');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [newPaymentBank, setNewPaymentBank] = useState<string>('');
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalInvoice, setHistoryModalInvoice] = useState<Invoice | null>(null);
  const [receiptData, setReceiptData] = useState<{ payment: PaymentRecord, invoice: Invoice } | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' });
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
  const [paymentBank, setPaymentBank] = useState<string>('');
  const [aiNote, setAiNote] = useState<string>('');
  const [generatingNote, setGeneratingNote] = useState(false);

  useEffect(() => { if (patient.state) { setPlaceOfSupply(patient.state.toLowerCase() === 'west bengal' ? 'Intra-State' : 'Inter-State'); } }, [patient.state]);

  const resetForm = () => { setStep('patient'); setPatient({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' }); setPhoneError(''); setPlaceOfSupply('Intra-State'); setSelectedItemIds([]); setOriginalInvoiceItemIds([]); setGstOverrides({}); setDiscountValue(0); setWarranty('2 Years Standard Warranty'); setAiNote(''); setEditingInvoiceId(null); setPatientSearchTerm(''); setProductSearchTerm(''); setInitialPayment(0); setPaymentMethod('Cash'); setPaymentBank(''); };

  // FIX: Renamed generateNextInvoiceId to generateNextId for consistency with the rest of the component calls and fix the 'Cannot find name' error on line 267.
  const generateNextId = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    const yearIds = invoices.map(inv => inv.id).filter(id => id.startsWith(prefix));
    if (yearIds.length === 0) return `${prefix}001`;
    const maxSeq = yearIds.reduce((max, id) => { const parts = id.split('-'); const seq = parseInt(parts[parts.length - 1], 10); return !isNaN(seq) && seq > max ? seq : max; }, 0);
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleViewEdit = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setPatient(invoice.patientDetails || { id: invoice.patientId, name: invoice.patientName, address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '' });
    setPlaceOfSupply(invoice.placeOfSupply || 'Intra-State');
    const currentItemIds = invoice.items.map(i => i.hearingAidId);
    setSelectedItemIds(currentItemIds);
    setOriginalInvoiceItemIds(currentItemIds);
    const overrides: Record<string, number> = {};
    invoice.items.forEach(i => { overrides[i.hearingAidId] = i.gstRate; });
    setGstOverrides(overrides);
    setDiscountType(invoice.discountType);
    setDiscountValue(invoice.discountValue);
    setWarranty(invoice.warranty || '2 Years Standard Warranty');
    setAiNote(invoice.notes || '');
    setInitialPayment(0); 
    setViewMode('edit');
    setStep('review');
  };

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
      const cgst = placeOfSupply === 'Intra-State' ? taxAmount / 2 : 0;
      const sgst = placeOfSupply === 'Intra-State' ? taxAmount / 2 : 0;
      const igst = placeOfSupply === 'Inter-State' ? taxAmount : 0;
      runningTaxableTotal += itemTaxable; runningCGST += cgst; runningSGST += sgst; runningIGST += igst; runningFinalTotal += (itemTaxable + taxAmount);
      return { hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, price: item.price, hsnCode: item.hsnCode, gstRate, taxableValue: itemTaxable, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: itemTaxable + taxAmount };
  });

  const handleSaveInvoice = () => {
    // FIX: Renamed call from generateNextInvoiceId to generateNextId.
    const finalId = editingInvoiceId || generateNextId();
    let payments: PaymentRecord[] = [];
    if (!editingInvoiceId && initialPayment > 0) { payments.push({ id: `PAY-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: initialPayment, method: paymentMethod, note: 'Initial Payment', bankDetails: paymentBank || undefined }); }
    const invData: Invoice = { id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: invoiceItems, subtotal, discountType, discountValue, totalDiscount: discountAmount, placeOfSupply, totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: runningIGST, totalTax: runningCGST + runningSGST + runningIGST, finalTotal: runningFinalTotal, date: new Date().toISOString().split('T')[0], notes: aiNote, warranty, patientDetails: patient, payments: editingInvoiceId ? (invoices.find(i => i.id === editingInvoiceId)?.payments || []) : payments, balanceDue: Math.max(0, runningFinalTotal - (editingInvoiceId ? (invoices.find(i => i.id === editingInvoiceId)?.payments.reduce((s,p) => s+p.amount, 0) || 0) : initialPayment)), paymentStatus: 'Unpaid' };
    invData.paymentStatus = invData.balanceDue <= 1 ? 'Paid' : (invData.payments.length > 0 ? 'Partial' : 'Unpaid');
    if (editingInvoiceId && onUpdateInvoice) onUpdateInvoice(invData); else onCreateInvoice(invData, selectedItemIds);
    resetForm(); setViewMode('list');
  };

  const handleAddPayment = () => {
      if (!paymentModalInvoice || !onUpdateInvoice) return;
      const updatedPayments = [...paymentModalInvoice.payments, { id: `PAY-${Date.now()}`, date: newPaymentDate, amount: newPaymentAmount, method: newPaymentMethod, note: 'Payment', bankDetails: newPaymentBank || undefined }];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = Math.max(0, paymentModalInvoice.finalTotal - totalPaid);
      onUpdateInvoice({ ...paymentModalInvoice, payments: updatedPayments, balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : 'Partial' });
      setShowPaymentModal(false);
  };

  const handlePrint = () => window.print();

  if (viewMode === 'list') {
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-primary" /> Invoice Management</h2>
                  <button onClick={handleStartNew} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-800 transition"><Plus size={20} /> New Invoice</button>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden border">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                          <tr><th className="p-4">Invoice ID</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Balance</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y">
                          {invoices.filter(i => i.id.includes(searchTerm) || i.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map(inv => {
                              const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                              return (
                              <tr key={inv.id} className="hover:bg-gray-50 transition">
                                  <td className="p-4 font-mono text-sm text-teal-700">{inv.id}</td>
                                  <td className="p-4 text-sm text-gray-500">{inv.date}</td>
                                  <td className="p-4 font-medium">{inv.patientName}</td>
                                  <td className="p-4 text-right font-bold">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-right text-green-700">₹{totalPaid.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-right text-red-600">₹{inv.balanceDue.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-center">
                                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${inv.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{inv.paymentStatus}</span>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex justify-center items-center gap-1">
                                        <button onClick={() => handleViewEdit(inv)} className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded" title="View"><Eye size={18}/></button>
                                        <button onClick={() => { setPaymentModalInvoice(inv); setNewPaymentAmount(inv.balanceDue); setShowPaymentModal(true); }} disabled={inv.balanceDue <= 0} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-20" title="Add Payment"><CreditCard size={18}/></button>
                                        <button onClick={() => { setHistoryModalInvoice(inv); setShowHistoryModal(true); }} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="History"><History size={18}/></button>
                                        {userRole === 'admin' && onDelete && (
                                            <button onClick={() => { if(window.confirm(`Permanently delete invoice ${inv.id}?`)) onDelete(inv.id); }} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition" title="Delete Permanent"><Trash2 size={18}/></button>
                                        )}
                                      </div>
                                  </td>
                              </tr>
                          )})}
                      </tbody>
                  </table>
              </div>
              {showPaymentModal && paymentModalInvoice && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                          <div className="bg-primary p-4 text-white flex justify-between items-center rounded-t-xl"><h3 className="font-bold">Record Payment: {paymentModalInvoice.id}</h3><button onClick={() => setShowPaymentModal(false)}><X/></button></div>
                          <div className="p-6 space-y-4">
                              <div><label className="text-xs font-bold text-gray-500 uppercase">Amount Due: ₹{paymentModalInvoice.balanceDue}</label><input type="number" value={newPaymentAmount} onChange={e => setNewPaymentAmount(Number(e.target.value))} className="w-full border p-2 rounded mt-1 font-bold text-xl" /></div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase">Bank Account (Optional)</label><select className="w-full border p-2 rounded mt-1" value={newPaymentBank} onChange={e => setNewPaymentBank(e.target.value)}><option value="">None</option>{COMPANY_BANK_ACCOUNTS.map(b => <option key={b.accountNumber} value={b.name}>{b.name}</option>)}</select></div>
                              <button onClick={handleAddPayment} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">Confirm Payment</button>
                          </div>
                      </div>
                  </div>
              )}
              {showHistoryModal && historyModalInvoice && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                          <div className="bg-gray-100 p-4 border-b flex justify-between items-center rounded-t-xl"><h3 className="font-bold">Payment History: {historyModalInvoice.id}</h3><button onClick={() => setShowHistoryModal(false)}><X/></button></div>
                          <div className="max-h-80 overflow-y-auto p-4 space-y-2">
                              {historyModalInvoice.payments.map(p => (
                                  <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                      <div><p className="font-bold text-gray-800">₹{p.amount.toLocaleString()}</p><p className="text-xs text-gray-500">{p.date} via {p.method}</p></div>
                                      <button onClick={() => setReceiptData({ payment: p, invoice: historyModalInvoice })} className="text-teal-600 hover:underline text-sm font-bold flex items-center gap-1"><Printer size={14}/> Receipt</button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
              {receiptData && <Receipt payment={receiptData.payment} invoice={receiptData.invoice} onClose={() => setReceiptData(null)} logo={logo} signature={signature} />}
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold text-gray-800">{editingInvoiceId ? 'View/Edit' : 'New'} Invoice</h2></div>
            <div className="flex gap-2">
                {['patient', 'product', 'review'].map((s, idx) => (
                    <button key={s} onClick={() => setStep(s as any)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${step === s ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}>{idx+1}. {s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
            </div>
        </div>
        {step === 'patient' && (
            <div className="bg-white rounded-xl shadow border p-6 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700">1. Patient Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name *</label><input required className="w-full border rounded p-2" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone *</label><input required className="w-full border rounded p-2" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label><input className="w-full border rounded p-2" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div>
                </div>
                <div className="mt-8 flex justify-end"><button onClick={() => setStep('product')} className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-teal-800">Next &rarr;</button></div>
            </div>
        )}
        {step === 'product' && (
            <div className="bg-white rounded-xl shadow border p-6 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700">2. Select Hearing Aid</h3>
                <div className="max-h-60 overflow-y-auto border rounded mb-6">
                    <table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr><th className="p-3 w-10">Select</th><th className="p-3">Device</th><th className="p-3">Serial</th><th className="p-3 text-right">Price</th></tr></thead>
                        <tbody>{inventory.filter(i => i.status === 'Available' || selectedItemIds.includes(i.id)).map(item => (
                            <tr key={item.id} className={selectedItemIds.includes(item.id) ? 'bg-teal-50' : 'hover:bg-gray-50'}>
                                <td className="p-3 text-center"><input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td>
                                <td className="p-3 font-medium">{item.brand} {item.model}</td>
                                <td className="p-3 font-mono text-xs">{item.serialNumber}</td>
                                <td className="p-3 text-right font-bold">₹{item.price.toLocaleString()}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded border"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Special Consideration (INR)</label><input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="w-full border p-2 rounded font-bold" /></div>
                    <div className="p-4 bg-gray-50 rounded border"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Warranty Period</label><input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border p-2 rounded" /></div>
                </div>
                <div className="mt-8 flex justify-between items-center"><p className="text-xl font-bold">Grand Total: ₹{runningFinalTotal.toLocaleString()}</p><button onClick={() => setStep('review')} className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-teal-800">Review &rarr;</button></div>
            </div>
        )}
        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded shadow-lg p-10 border relative overflow-hidden">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                    <div className="flex gap-4">
                        <div className="h-20 w-20 flex items-center justify-center"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                        <div><h1 className="text-xl font-bold text-gray-800 uppercase">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1><p className="text-xs text-gray-500 font-bold mt-1 tracking-tight italic">Bengal's Largest Hospital Based Hearing and Speech Chain</p><p className="text-[10px] text-gray-400 mt-2">Kalipur, Purba Nischintapur, Kolkata - 700138, WB</p></div>
                    </div>
                    {/* FIX: Corrected function call to generateNextId here. */}
                    <div className="text-right"><h2 className="text-xl font-black uppercase tracking-tighter">Tax Invoice</h2><p className="text-sm font-bold text-gray-600 mt-1"># {editingInvoiceId || generateNextId()}</p><p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-10 mb-10 text-sm">
                    <div><h4 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b w-16">Bill To:</h4><p className="font-bold text-lg">{patient.name}</p><p className="text-gray-600">{patient.phone}</p><p className="text-gray-600">{patient.address}</p></div>
                    <div className="text-right"><h4 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b ml-auto w-16 text-right">Details:</h4><p className="text-gray-700">Ref Doctor: <b>{patient.referDoctor || '-'}</b></p><p className="text-gray-700">Audiologist: <b>{patient.audiologist || '-'}</b></p></div>
                </div>
                <table className="w-full border-collapse border border-gray-300 text-sm mb-10">
                    <thead className="bg-gray-100 uppercase text-[10px]"><tr><th className="border border-gray-300 p-2 text-left">Description</th><th className="border border-gray-300 p-2 text-center">HSN</th><th className="border border-gray-300 p-2 text-right">Amount</th></tr></thead>
                    <tbody>{invoiceItems.map(item => (<tr key={item.hearingAidId}><td className="border border-gray-300 p-3"><p className="font-bold">{item.brand} {item.model}</p><p className="text-xs text-gray-500 font-mono">SN: {item.serialNumber}</p></td><td className="border border-gray-300 p-3 text-center">{item.hsnCode || '902140'}</td><td className="border border-gray-300 p-3 text-right font-bold">₹{item.price.toLocaleString()}</td></tr>))}</tbody>
                </table>
                <div className="flex justify-end mb-10">
                    <div className="w-1/2 space-y-2 text-sm"><div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div><div className="flex justify-between text-red-600"><span>Discount</span><span>-₹{discountAmount.toLocaleString()}</span></div><div className="flex justify-between font-black text-xl border-t-2 border-gray-800 pt-2"><span>GRAND TOTAL</span><span>₹{runningFinalTotal.toLocaleString()}</span></div></div>
                </div>
                <div className="text-xs font-bold text-gray-600 mb-10 p-4 bg-gray-50 border rounded uppercase tracking-wider"><span className="text-gray-400 mr-2">Amount in Words:</span> {numberToWords(runningFinalTotal)}</div>
                <div className="flex justify-between items-end mt-20"><div className="w-2/3 text-[10px] text-gray-400 space-y-1"><p className="font-bold uppercase mb-2">Terms & Declarations:</p><p>1. Hearing aids are exempt from GST under Notification 2/2017 CT(Rate).</p><p>2. Subject to Kolkata Jurisdiction. All equipment sales are final.</p></div><div className="text-center font-bold uppercase text-xs">{signature ? <img src={signature} className="h-16 mb-2 mx-auto" /> : <div className="h-16 w-40 border-b border-gray-300 mb-2"></div>}<p>Authorized Signatory</p></div></div>
                <div className="mt-12 flex gap-4 print:hidden"><button onClick={() => setStep('product')} className="flex-1 py-3 border-2 border-gray-800 rounded font-black uppercase tracking-widest hover:bg-gray-100">Back to Edit</button><button onClick={handleSaveInvoice} className="flex-2 bg-primary text-white py-3 px-12 rounded font-black uppercase tracking-widest shadow-xl hover:bg-teal-800 flex items-center justify-center gap-2"><Save size={20}/> {editingInvoiceId ? 'Update' : 'Confirm & Save'}</button><button onClick={handlePrint} className="p-3 border rounded text-gray-500 hover:text-gray-800 hover:bg-gray-50"><Printer/></button></div>
            </div>
        )}
    </div>
  );
};