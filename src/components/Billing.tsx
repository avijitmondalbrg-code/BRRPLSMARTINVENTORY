import React, { useState, useEffect } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, CLINIC_UDYAM, getFinancialYear } from '../constants';
import { FileText, Printer, Save, Eye, Plus, ArrowLeft, Search, CreditCard, History, Trash2, Calendar, X } from 'lucide-react';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentBank, setNewPaymentBank] = useState<string>('');
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalInvoice, setHistoryModalInvoice] = useState<Invoice | null>(null);
  const [receiptData, setReceiptData] = useState<{ payment: PaymentRecord, invoice: Invoice } | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>({});
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [paymentBank, setPaymentBank] = useState<string>('');

  // FIX: Added handlePrint function
  const handlePrint = () => window.print();

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL/SR/${fy}/`;
    const sameFyInvoices = invoices.filter(inv => inv.id.startsWith(prefix));
    if (sameFyInvoices.length === 0) return `${prefix}001`;
    const numbers = sameFyInvoices.map(inv => {
        const parts = inv.id.split('/');
        return parseInt(parts[parts.length - 1], 10);
    });
    const nextNo = Math.max(...numbers) + 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
  };

  const resetForm = () => { setStep('patient'); setPatient({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' }); setSelectedItemIds([]); setGstOverrides({}); setDiscountValue(0); setWarranty('2 Years Standard Warranty'); setEditingInvoiceId(null); setPatientSearchTerm(''); setInitialPayment(0); setPaymentMethod('Cash'); setPaymentBank(''); };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleSelectPatient = (p: Patient) => { setPatient({ ...p, state: p.state || 'West Bengal', country: p.country || 'India' }); setShowPatientResults(false); };

  const handleViewEdit = (invoice: Invoice) => { setEditingInvoiceId(invoice.id); setPatient(invoice.patientDetails || { ...patient, name: invoice.patientName }); setSelectedItemIds(invoice.items.map(i => i.hearingAidId)); setDiscountValue(invoice.discountValue); setWarranty(invoice.warranty || '2 Years Standard Warranty'); setViewMode('edit'); setStep('review'); };

  const selectedInventoryItems = inventory.filter(i => selectedItemIds.includes(i.id));
  const subtotal = selectedInventoryItems.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = discountValue;
  
  let runningTaxableTotal = 0, runningCGST = 0, runningSGST = 0, runningFinalTotal = 0;
  const invoiceItems: InvoiceItem[] = selectedInventoryItems.map(item => {
      const itemRatio = subtotal > 0 ? item.price / subtotal : 0;
      const itemTaxable = item.price - (discountAmount * itemRatio);
      const gstRate = gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0);
      const cgst = (itemTaxable * (gstRate / 100)) / 2;
      const sgst = (itemTaxable * (gstRate / 100)) / 2;
      runningTaxableTotal += itemTaxable; runningCGST += cgst; runningSGST += sgst; runningFinalTotal += (itemTaxable + cgst + sgst);
      return { hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, price: item.price, gstRate, taxableValue: itemTaxable, cgstAmount: cgst, sgstAmount: sgst, igstAmount: 0, totalAmount: itemTaxable + cgst + sgst };
  });

  const handleSaveInvoice = () => {
    const finalId = editingInvoiceId || generateNextId();
    const invData: Invoice = { id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: invoiceItems, subtotal, discountType: 'flat', discountValue, totalDiscount: discountAmount, placeOfSupply: 'Intra-State', totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: 0, totalTax: runningCGST + runningSGST, finalTotal: runningFinalTotal, date: new Date().toISOString().split('T')[0], warranty, patientDetails: patient, payments: editingInvoiceId ? (invoices.find(i => i.id === editingInvoiceId)?.payments || []) : (initialPayment > 0 ? [{ id: `PAY-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: initialPayment, method: paymentMethod, bankDetails: paymentBank }] : []), balanceDue: Math.max(0, runningFinalTotal - (editingInvoiceId ? (invoices.find(i => i.id === editingInvoiceId)?.payments.reduce((s,p) => s+p.amount, 0) || 0) : initialPayment)), paymentStatus: 'Unpaid' };
    invData.paymentStatus = invData.balanceDue <= 1 ? 'Paid' : (invData.payments.length > 0 ? 'Partial' : 'Unpaid');
    if (editingInvoiceId && onUpdateInvoice) onUpdateInvoice(invData); else onCreateInvoice(invData, selectedItemIds);
    setViewMode('list');
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || inv.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
    return matchesSearch && matchesDate;
  });

  if (viewMode === 'list') {
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-primary" /> Billing</h2>
                  <button onClick={handleStartNew} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow hover:bg-teal-800 transition"><Plus size={20} /> New Invoice</button>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border md:flex md:items-center md:gap-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="text" placeholder="Search Invoice ID or Patient..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <input type="date" className="border p-2 rounded text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      <span className="text-gray-400">to</span>
                      <input type="date" className="border p-2 rounded text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden border">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase">
                          <tr><th className="p-4">Invoice No</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Balance</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y text-sm">
                          {filteredInvoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                  <td className="p-4 font-bold text-teal-700">{inv.id}</td>
                                  <td className="p-4 text-gray-500">{inv.date}</td>
                                  <td className="p-4 font-medium">{inv.patientName}</td>
                                  <td className="p-4 text-right font-bold">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-right text-red-600 font-bold">₹{inv.balanceDue.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-800 border-orange-200'}`}>{inv.paymentStatus}</span></td>
                                  <td className="p-4"><div className="flex justify-center gap-2"><button onClick={() => handleViewEdit(inv)} className="p-1 text-gray-500 hover:text-teal-600"><Eye size={18}/></button><button onClick={() => { setHistoryModalInvoice(inv); setShowHistoryModal(true); }} className="p-1 text-gray-500 hover:text-blue-600"><History size={18}/></button></div></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              {showHistoryModal && historyModalInvoice && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                          <div className="bg-gray-100 p-4 border-b flex justify-between items-center font-bold"><h3>History: {historyModalInvoice.id}</h3><button onClick={() => setShowHistoryModal(false)}><X/></button></div>
                          <div className="p-4 space-y-2">{historyModalInvoice.payments.map(p => (<div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border"><div><p className="font-bold">₹{p.amount.toLocaleString()}</p><p className="text-xs text-gray-500">{p.date} - {p.method}</p></div><button onClick={() => setReceiptData({ payment: p, invoice: historyModalInvoice })} className="text-teal-600 text-sm font-bold flex items-center gap-1"><Printer size={14}/> Receipt</button></div>))}</div>
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
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">{editingInvoiceId ? 'View' : 'New'} Invoice</h2></div>
            <div className="flex gap-2">{['patient', 'product', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-4 py-1.5 rounded-full text-xs font-bold ${step === s ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}>{idx+1}. {s.toUpperCase()}</button>))}</div>
        </div>
        
        {step === 'patient' && (
            <div className="bg-white rounded-xl shadow border p-8 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-6 border-b pb-2">1. Patient Details</h3>
                <div className="mb-6 relative">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Search Existing Patient</label>
                    <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Type name or phone..." className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" value={patientSearchTerm} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} /></div>
                    {showPatientResults && patientSearchTerm && (<div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border max-h-60 overflow-y-auto">{patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || p.phone.includes(patientSearchTerm)).map(p => (<button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-5 py-3 hover:bg-teal-50 border-b last:border-0 flex justify-between items-center transition-colors"><div><p className="font-bold">{p.name}</p><p className="text-xs text-gray-500">{p.phone}</p></div><span className="text-teal-600 text-xs font-bold">Select</span></button>))}</div>)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">NAME *</label><input required className="w-full border rounded-lg p-2.5" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">PHONE *</label><input required className="w-full border rounded-lg p-2.5" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">ADDRESS</label><input className="w-full border rounded-lg p-2.5" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div>
                </div>
                <div className="mt-8 flex justify-end"><button onClick={() => setStep('product')} className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-800">Next Step &rarr;</button></div>
            </div>
        )}

        {step === 'product' && (
            <div className="bg-white rounded-xl shadow border p-8 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-6 border-b pb-2">2. Select Device & Pricing</h3>
                <div className="max-h-64 overflow-y-auto border rounded-xl mb-6 shadow-inner">
                    <table className="w-full text-left text-xs"><thead className="bg-gray-50 sticky top-0 uppercase font-bold text-gray-400"><tr><th className="p-4 w-10"></th><th className="p-4">Brand/Model</th><th className="p-4">Serial No</th><th className="p-4">GST %</th><th className="p-4 text-right">Price</th></tr></thead>
                        <tbody className="divide-y">{inventory.filter(i => i.status === 'Available' || selectedItemIds.includes(i.id)).map(item => (
                            <tr key={item.id} className={selectedItemIds.includes(item.id) ? 'bg-teal-50' : 'hover:bg-gray-50'}>
                                <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-teal-600" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td>
                                <td className="p-4 font-bold">{item.brand} {item.model}</td>
                                <td className="p-4 font-mono">{item.serialNumber}</td>
                                <td className="p-4">{selectedItemIds.includes(item.id) && (<select className="border rounded p-1" value={gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0)} onChange={(e) => setGstOverrides({...gstOverrides, [item.id]: Number(e.target.value)})}>
                                    <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option></select>)}</td>
                                <td className="p-4 text-right font-black text-gray-900">₹{item.price.toLocaleString()}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-4 bg-gray-50 rounded-xl border"><label className="block text-xs font-bold text-gray-400 mb-2">ADJUSTMENT / DISCOUNT (INR)</label><input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="w-full border-2 p-2 rounded-lg font-bold text-lg outline-none focus:border-teal-500" /></div>
                    <div className="p-4 bg-gray-50 rounded-xl border"><label className="block text-xs font-bold text-gray-400 mb-2">WARRANTY PERIOD</label><input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border-2 p-2 rounded-lg font-medium outline-none focus:border-teal-500" /></div>
                </div>
                <div className="mt-8 flex justify-between items-center"><div className="text-teal-900"><p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Payable</p><p className="text-3xl font-black">₹{runningFinalTotal.toLocaleString('en-IN')}</p></div><button onClick={() => setStep('review')} className="bg-primary text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-800">Preview Invoice &rarr;</button></div>
            </div>
        )}

        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded shadow-2xl p-12 border relative overflow-hidden">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                    <div className="flex gap-6">
                        <div className="h-24 w-24 flex items-center justify-center"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 uppercase leading-none">{COMPANY_NAME}</h1>
                            <p className="text-xs text-gray-500 font-bold mt-2 tracking-tight italic">{COMPANY_TAGLINE}</p>
                            <p className="text-[10px] text-gray-500 mt-3 leading-relaxed max-w-sm">{COMPANY_ADDRESS}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase">GSTIN: {CLINIC_GSTIN} | UDYAM: {CLINIC_UDYAM}</p>
                            <p className="text-[10px] text-gray-500 mt-1">Ph: {COMPANY_PHONES} | Email: {COMPANY_EMAIL}</p>
                        </div>
                    </div>
                    <div className="text-right"><div className="border-4 border-gray-800 px-6 py-1 inline-block mb-3"><h2 className="text-xl font-black uppercase tracking-widest">Tax Invoice</h2></div><p className="text-sm font-black text-gray-700"># {editingInvoiceId || generateNextId()}</p><p className="text-xs font-bold text-gray-400">Date: {new Date().toLocaleDateString('en-IN')}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-12 mb-10 text-sm">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b">Billed To:</h4><p className="font-black text-lg text-gray-900">{patient.name}</p><p className="font-bold text-gray-600">{patient.phone}</p><p className="text-xs text-gray-500 mt-1 uppercase">{patient.address}</p></div>
                    <div className="text-right flex flex-col justify-center gap-2"><div><h4 className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Reference Doctor</h4><p className="font-black text-gray-700">{patient.referDoctor || '-'}</p></div><div><h4 className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Audiologist</h4><p className="font-black text-teal-700">{patient.audiologist || '-'}</p></div></div>
                </div>
                <table className="w-full border-collapse border border-gray-300 text-sm mb-10 shadow-sm">
                    <thead className="bg-gray-800 text-white uppercase text-[10px] font-black tracking-widest"><tr><th className="p-4 text-left">Device Description</th><th className="p-4 text-center">HSN</th><th className="p-4 text-right">Taxable Value</th><th className="p-4 text-center">GST%</th><th className="p-4 text-right">Total</th></tr></thead>
                    <tbody>{invoiceItems.map(item => (<tr key={item.hearingAidId} className="border-b border-gray-200"><td className="p-4"><p className="font-black text-gray-800">{item.brand} {item.model}</p><p className="text-[10px] text-gray-400 font-bold uppercase">S/N: {item.serialNumber}</p></td><td className="p-4 text-center font-mono">902140</td><td className="p-4 text-right font-medium">₹{item.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td><td className="p-4 text-center font-bold">{item.gstRate}%</td><td className="p-4 text-right font-black text-gray-900">₹{item.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>))}</tbody>
                </table>
                <div className="flex justify-end mb-10">
                    <div className="w-1/2 space-y-2 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Gross Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs font-bold text-red-600 uppercase"><span>Adjustment</span><span>-₹{discountAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Total GST</span><span>₹{(runningCGST+runningSGST).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
                        <div className="h-px bg-gray-300 my-2"></div>
                        <div className="flex justify-between items-center text-teal-900"><span className="text-sm font-black uppercase tracking-widest">Grand Total</span><span className="text-3xl font-black">₹{Math.round(runningFinalTotal).toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 border rounded-xl text-[10px] font-black uppercase mb-12 tracking-widest text-gray-600"><span className="opacity-40 mr-2">Amount in Words:</span> Rupees {numberToWords(runningFinalTotal)}</div>
                <div className="flex justify-between items-end mt-20">
                    <div className="w-3/4"><p className="font-black text-[10px] uppercase border-b-2 border-gray-800 inline-block mb-3 tracking-widest">Legal Declarations & Terms</p>
                        <div className="text-[8.5px] text-gray-500 font-bold space-y-1 leading-tight uppercase">
                            <p>1. Keep this invoice for all warranty and service claims.</p>
                            <p>2. Hearing aids (HSN 9021 40 90) are exempt from GST vide Sl.No 142 of Notification No 2/2017 CT (Rate).</p>
                            <p>3. Healthcare services provided by clinics are exempt from GST as per Notification No. 12/2017-Central Tax.</p>
                            <p>4. All sales are final. Subject to Kolkata Jurisdiction.</p>
                        </div>
                    </div>
                    <div className="text-center">{signature ? <img src={signature} className="h-16 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-40 border-b-2 border-dashed border-gray-300 mb-2"></div>}<p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p></div>
                </div>
                <div className="mt-12 flex gap-4 print:hidden"><button onClick={() => setStep('product')} className="flex-1 py-4 border-2 border-gray-800 rounded-xl font-black uppercase tracking-widest hover:bg-gray-100 text-xs">Back to Edit</button><button onClick={handleSaveInvoice} className="flex-[2] bg-primary text-white py-4 px-12 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-teal-800 flex items-center justify-center gap-3 text-xs"> <Save size={18}/> {editingInvoiceId ? 'Update Record' : 'Confirm & Save Invoice'}</button><button onClick={handlePrint} className="p-4 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black"><Printer/></button></div>
            </div>
        )}
    </div>
  );
};