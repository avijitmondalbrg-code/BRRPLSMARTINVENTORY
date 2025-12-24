
import React, { useState } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole, AdvanceBooking } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, getFinancialYear } from '../constants';
import { FileText, Printer, Save, Eye, Plus, ArrowLeft, Search, Trash2, X, Wallet, IndianRupee, Edit, MessageSquare, Wrench, PackagePlus, CheckCircle2 } from 'lucide-react';

interface BillingProps {
  inventory: HearingAid[];
  invoices?: Invoice[];
  patients: Patient[];
  advanceBookings?: AdvanceBooking[];
  onCreateInvoice: (invoice: Invoice, soldItemIds: string[]) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
}

const numberToWords = (amount: number): string => {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (num: number): string => {
    if (num < 20) return units[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convert(num % 10000000) : '');
  };

  if (amount === 0) return 'Zero Rupees Only';
  return convert(Math.floor(amount)) + ' Rupees Only';
};

export const Billing: React.FC<BillingProps> = ({ inventory, invoices = [], patients, advanceBookings = [], onCreateInvoice, onUpdateInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'payment' | 'review'>('patient');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectingInvoice, setCollectingInvoice] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentRecord['method']>('Cash');
  const [payBank, setPayBank] = useState<string>('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState(''); 
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' });
  
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [manualItems, setManualItems] = useState<InvoiceItem[]>([]);
  const [tempManual, setTempManual] = useState({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>({});
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  const [totalAdjustment, setTotalAdjustment] = useState<number>(0); 
  const [invoiceNotes, setInvoiceNotes] = useState<string>(''); 
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [existingPayments, setExistingPayments] = useState<PaymentRecord[]>([]);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [paymentBank, setPaymentBank] = useState<string>('');

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL-HA-${fy}-`;
    const fyInvoices = (invoices || []).filter(inv => inv.id.startsWith(prefix));
    const maxSeq = fyInvoices.length === 0 ? 0 : Math.max(...fyInvoices.map(inv => parseInt(inv.id.split('-').pop() || '0', 10)));
    return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
  };

  const resetForm = () => { 
    setStep('patient'); 
    setPatient({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' }); 
    setSelectedItemIds([]); 
    setManualItems([]);
    setGstOverrides({}); 
    setItemDiscounts({}); 
    setTotalAdjustment(0);
    setInvoiceNotes('');
    setWarranty('2 Years Standard Warranty'); 
    setEditingInvoiceId(null); 
    setPatientSearchTerm(''); 
    setProductSearchTerm(''); 
    setInitialPayment(0); 
    setPaymentMethod('Cash'); 
    setPaymentBank(''); 
    setExistingPayments([]);
    setTempManual({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };
  
  const handleEditInvoice = (inv: Invoice, startStep: 'patient' | 'review' = 'review') => {
    setEditingInvoiceId(inv.id);
    setPatient(inv.patientDetails || { id: inv.patientId, name: inv.patientName, address: '', phone: '', referDoctor: '', audiologist: '' });
    const inventoryIds = inv.items.filter(i => i.hearingAidId && !i.hearingAidId.startsWith('MAN-')).map(i => i.hearingAidId);
    const manItems = inv.items.filter(i => !i.hearingAidId || i.hearingAidId.startsWith('MAN-'));
    setSelectedItemIds(inventoryIds);
    setManualItems(manItems);
    const discounts: Record<string, number> = {};
    inv.items.forEach(i => { if(i.hearingAidId) discounts[i.hearingAidId] = i.discount || 0; });
    setItemDiscounts(discounts);
    setTotalAdjustment(inv.discountValue || 0);
    setInvoiceNotes(inv.notes || '');
    setWarranty(inv.warranty || '2 Years Standard Warranty');
    setExistingPayments(inv.payments || []);
    setInitialPayment(0);
    setStep(startStep);
    setViewMode('edit');
  };

  const handleSelectPatient = (p: Patient) => { 
    setPatient({ ...p, state: p.state || 'West Bengal', referDoctor: p.referDoctor || '' }); 
    setPatientSearchTerm(p.name); 
    setShowPatientResults(false); 
  };

  const handleAddManualItem = () => {
    if (!tempManual.model || tempManual.price <= 0) return;
    const newItem: InvoiceItem = {
      hearingAidId: `MAN-${Date.now()}`,
      brand: tempManual.brand,
      model: tempManual.model,
      serialNumber: 'N/A',
      price: tempManual.price,
      hsnCode: tempManual.hsn,
      gstRate: tempManual.gst,
      discount: 0,
      taxableValue: tempManual.price,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: tempManual.price * (1 + tempManual.gst / 100)
    };
    setManualItems([...manualItems, newItem]);
    setTempManual({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  };

  const isInterState = patient.state && patient.state !== 'West Bengal';
  const selectedInventoryItems = inventory.filter(i => selectedItemIds.includes(i.id));
  
  let runningTaxableTotal = 0;
  let runningCGST = 0;
  let runningSGST = 0;
  let runningIGST = 0;
  let totalSubtotal = 0;

  const allItems = [...selectedInventoryItems.map(item => {
    const disc = itemDiscounts[item.id] || 0;
    const taxable = Math.max(0, item.price - disc);
    const gstRate = gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0);
    const totalTax = taxable * (gstRate / 100);
    let cgst = 0, sgst = 0, igst = 0;
    if (isInterState) { igst = totalTax; runningIGST += igst; } 
    else { cgst = totalTax / 2; sgst = totalTax / 2; runningCGST += cgst; runningSGST += sgst; }
    runningTaxableTotal += taxable; totalSubtotal += item.price;
    return { 
      hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, 
      price: item.price, discount: disc, gstRate, taxableValue: taxable, 
      cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: taxable + totalTax, 
      hsnCode: item.hsnCode || '90214090' 
    };
  }), ...manualItems.map(item => {
    const totalTax = item.taxableValue * (item.gstRate / 100);
    let cgst = 0, sgst = 0, igst = 0;
    if (isInterState) { igst = totalTax; runningIGST += igst; } 
    else { cgst = totalTax / 2; sgst = totalTax / 2; runningCGST += cgst; runningSGST += sgst; }
    runningTaxableTotal += item.taxableValue; totalSubtotal += item.price;
    return { ...item, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: item.taxableValue + totalTax };
  })];

  const finalTotal = Math.max(0, (runningTaxableTotal + runningCGST + runningSGST + runningIGST) - totalAdjustment);

  const handleSaveInvoice = () => {
    const finalId = editingInvoiceId || generateNextId();
    const currentPayments = [...existingPayments];
    if (initialPayment > 0) {
      currentPayments.push({
        id: `PAY-${Date.now()}`, date: new Date().toISOString().split('T')[0],
        amount: initialPayment, method: paymentMethod, bankDetails: paymentBank || ""
      });
    }
    const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, finalTotal - totalPaid);
    const invData: Invoice = { 
      id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: allItems, 
      subtotal: totalSubtotal, discountType: 'flat', discountValue: totalAdjustment, totalDiscount: (totalSubtotal - runningTaxableTotal) + totalAdjustment, 
      placeOfSupply: isInterState ? 'Inter-State' : 'Intra-State', totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: runningIGST, totalTax: runningCGST + runningSGST + runningIGST, 
      finalTotal, date: new Date().toISOString().split('T')[0], warranty, patientDetails: patient, notes: invoiceNotes,
      payments: currentPayments, balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid') 
    };
    onCreateInvoice(invData, selectedItemIds); 
    setViewMode('list');
  };

  const handleConfirmCollection = () => {
    if (!collectingInvoice || !onUpdateInvoice || newPaymentAmount <= 0) return;
    const newPayment: PaymentRecord = { id: `PAY-${Date.now()}`, date: payDate, amount: newPaymentAmount, method: payMethod, bankDetails: payBank || "" };
    const updatedPayments = [...(collectingInvoice.payments || []), newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, Math.round(collectingInvoice.finalTotal) - totalPaid);
    onUpdateInvoice({ ...collectingInvoice, payments: updatedPayments, balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : 'Partial' });
    setShowCollectModal(false);
    setCollectingInvoice(null);
  };

  if (viewMode === 'list') {
    const filteredInvoices = invoices.filter(inv => 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items.some(it => it.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-[#3159a6]" /> Billing & Sales</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input className="pl-10 pr-4 py-2 border rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#3159a6]" placeholder="Find by ID, Patient or Serial..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleStartNew} className="bg-[#3159a6] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition whitespace-nowrap"><Plus size={16} /> New Invoice</button>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#3159a6] text-white font-black border-b text-[10px] uppercase tracking-[0.2em]">
                <tr><th className="p-5">Invoice No</th><th className="p-5">Date</th><th className="p-5">Patient</th><th className="p-5">Device Units</th><th className="p-5 text-right">Total</th><th className="p-5 text-right">Outstanding</th><th className="p-5 text-center">Status</th><th className="p-5 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-5 font-black text-[#3159a6]">{inv.id}</td>
                    <td className="p-5 text-gray-500 font-bold whitespace-nowrap">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                    <td className="p-5 font-black text-gray-800 uppercase tracking-tighter">{inv.patientName}</td>
                    <td className="p-5">
                      {inv.items.map((it, idx) => (
                        <div key={idx} className="mb-1">
                          <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{it.brand} {it.model}</p>
                          <p className="text-[9px] font-bold text-teal-600 font-mono tracking-widest mt-0.5">S/N: {it.serialNumber}</p>
                        </div>
                      ))}
                    </td>
                    <td className="p-5 text-right font-black">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                    <td className="p-5 text-right font-black text-red-600">₹{(inv.balanceDue || 0).toLocaleString('en-IN')}</td>
                    <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : inv.paymentStatus === 'Partial' ? 'bg-orange-50 text-orange-800 border-orange-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{inv.paymentStatus}</span></td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button onClick={() => handleEditInvoice(inv, 'review')} className="p-1.5 text-[#3159a6] hover:bg-blue-50 rounded-lg transition"><Eye size={18}/></button>
                        <button onClick={() => handleEditInvoice(inv, 'patient')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit size={18}/></button>
                        <button onClick={() => { setCollectingInvoice(inv); setNewPaymentAmount(inv.balanceDue); setShowCollectModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" disabled={inv.balanceDue <= 1}><Wallet size={18} className={inv.balanceDue <= 1 ? 'opacity-20' : ''}/></button>
                        {userRole === 'admin' && onDelete && <button onClick={() => onDelete(inv.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showCollectModal && collectingInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-white">
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-xs ml-2">Record Outstanding Payment</h3>
                <button onClick={() => setShowCollectModal(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
              </div>
              <div className="p-10 space-y-6 bg-gray-50/50">
                <div className="bg-white p-4 rounded-2xl border-2 border-blue-50 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice Reference</p>
                  <p className="font-black text-gray-800 text-lg">{collectingInvoice.id} - {collectingInvoice.patientName}</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400">Mode</label>
                      <select className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-700" value={payMethod} onChange={e=>setPayMethod(e.target.value as any)}>
                        <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Account Transfer">Bank Transfer</option><option value="Cheque">Cheque</option><option value="EMI">Finance</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400">Date</label>
                      <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-2.5 font-bold text-gray-700" value={payDate} onChange={e=>setPayDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400">Amount (INR)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={24} />
                      <input type="number" className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl text-3xl font-black text-gray-800" value={newPaymentAmount || ''} onChange={e=>setNewPaymentAmount(Number(e.target.value))} />
                    </div>
                    <p className="text-[9px] text-red-500 font-bold uppercase text-right">Due: ₹{collectingInvoice.balanceDue.toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={handleConfirmCollection} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition active:scale-95 text-[10px] flex items-center justify-center gap-2">
                  <CheckCircle2 size={16}/> Finalize Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Rest of the multi-step form (patient, product, review steps) remains same as before but ensured robust UI */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 hover:bg-gray-100 rounded-full text-gray-400 shadow-sm transition"><ArrowLeft size={24} /></button><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Invoice Architect</h2></div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl border">{['patient', 'product', 'payment', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'bg-[#3159a6] text-white shadow-lg' : 'bg-transparent text-gray-400'}`}>{idx+1}. {s}</button>))}</div>
      </div>
      
      {step === 'patient' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
          <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 1: Client Selection</h3>
          <div className="mb-10 relative"><label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Recall Registered Patient</label><div className="relative"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Start typing name or mobile..." className="w-full pl-12 pr-4 py-5 border-2 border-gray-50 bg-gray-50/50 rounded-2xl outline-none focus:border-[#3159a6] focus:bg-white transition-all shadow-sm font-bold text-lg" value={patientSearchTerm} onFocus={() => setShowPatientResults(true)} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} /></div>{showPatientResults && (<div className="absolute z-50 left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto custom-scrollbar p-2"><div className="space-y-1">{patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(<button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-6 py-4 hover:bg-blue-50 rounded-2xl border-b border-gray-50 last:border-0 flex justify-between items-center transition-all group"><div><p className="font-black text-gray-800 uppercase tracking-tight">{p.name}</p><p className="text-[10px] text-gray-400 font-bold">{p.phone} • {p.state}</p></div><span className="text-[#3159a6] text-[9px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full group-hover:bg-[#3159a6] group-hover:text-white transition-all">Select</span></button>))}</div></div>)}</div>
          <div className="bg-blue-50/30 p-8 rounded-[2rem] border-2 border-dashed border-blue-100 space-y-8">
            <p className="text-[10px] font-black text-[#3159a6] uppercase tracking-[0.2em]">Verification & Contact Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Patient Full Name *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Active Phone *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Ref. Dr. (Referrer)</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.referDoctor} onChange={e => setPatient({...patient, referDoctor: e.target.value})} placeholder="e.g. Dr. Name" /></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">State (Supply Destination)</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.state} onChange={e => setPatient({...patient, state: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Audiologist</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.audiologist} onChange={e => setPatient({...patient, audiologist: e.target.value})} placeholder="Name" /></div>
              <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Full Postal Address</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div>
            </div>
          </div>
          <div className="mt-12 flex justify-end"><button onClick={() => setStep('product')} disabled={!patient.name} className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs disabled:opacity-50">Proceed to Product Selection &rarr;</button></div>
        </div>
      )}

      {step === 'product' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
          <div className="flex justify-between items-center mb-6 border-b-2 border-blue-50 pb-4">
            <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em]">Phase 2: Inventory Assignment</h3>
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${isInterState ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
              {isInterState ? `INTER-STATE (IGST MODE) - ${patient.state}` : `INTRA-STATE (CGST/SGST MODE)`}
            </div>
          </div>
          <div className="relative mb-6"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Find serial number or model..." className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 bg-gray-50/50 rounded-2xl focus:bg-white focus:border-[#3159a6] outline-none transition font-bold" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)}/></div></div>
          <div className="max-h-80 overflow-y-auto border-2 border-gray-50 rounded-[2rem] mb-8 shadow-inner custom-scrollbar overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#3159a6] text-white sticky top-0 uppercase font-black text-[10px] tracking-widest">
                <tr><th className="p-5 w-14"></th><th className="p-5">Device Unit</th><th className="p-5 text-center">HSN Code</th><th className="p-5">Serial No</th><th className="p-5 text-center">Tax %</th><th className="p-5 text-center">Discount (₹)</th><th className="p-5 text-right">Unit MRP</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inventory.filter(i => {
                  const match = i.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) || i.model.toLowerCase().includes(productSearchTerm.toLowerCase()) || i.serialNumber.toLowerCase().includes(productSearchTerm.toLowerCase());
                  return (i.status === 'Available' || selectedItemIds.includes(i.id)) && match;
                }).map(item => (
                  <tr key={item.id} className={`${selectedItemIds.includes(item.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition`}>
                    <td className="p-5 text-center"><input type="checkbox" className="h-5 w-5 rounded-lg border-2 border-gray-200 text-[#3159a6]" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) { setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); const newDiscounts = {...itemDiscounts}; delete newDiscounts[item.id]; setItemDiscounts(newDiscounts); } else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td>
                    <td className="p-5 font-black text-gray-800 uppercase tracking-tighter">{item.brand} {item.model}</td>
                    <td className="p-5 text-center font-mono font-bold text-gray-400">{item.hsnCode || '90214090'}</td>
                    <td className="p-5 font-mono font-black text-[#3159a6] tracking-widest">{item.serialNumber}</td>
                    <td className="p-5 text-center">
                      {selectedItemIds.includes(item.id) && (
                        <select className="border-2 border-blue-100 rounded-xl p-1.5 font-bold text-[#3159a6] bg-white outline-none" value={gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0)} onChange={(e) => setGstOverrides({...gstOverrides, [item.id]: Number(e.target.value)})}> 
                          <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                        </select>
                      )}
                    </td>
                    <td className="p-5 text-center">{selectedItemIds.includes(item.id) && (<input type="number" className="border-2 border-blue-100 rounded-xl p-1.5 w-24 text-right outline-none focus:border-[#3159a6] font-bold" placeholder="0" value={itemDiscounts[item.id] || ''} onChange={(e) => setItemDiscounts({...itemDiscounts, [item.id]: Number(e.target.value)})}/>)}</td>
                    <td className="p-5 text-right font-black text-gray-900 text-lg">₹{item.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">
              <Wrench size={14}/> Manual Service / Non-Inventory Entry
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              <div className="md:col-span-2"><input className="w-full border-2 border-white rounded-xl p-3 text-sm font-bold outline-none focus:border-[#3159a6]" placeholder="Description (e.g. Shell Repair: / Service:)" value={tempManual.model} onChange={e=>setTempManual({...tempManual, model: e.target.value})} /></div>
              <div><input className="w-full border-2 border-white rounded-xl p-3 text-sm font-mono outline-none focus:border-[#3159a6]" placeholder="HSN (9987)" value={tempManual.hsn} onChange={e=>setTempManual({...tempManual, hsn: e.target.value})} /></div>
              <div><input type="number" className="w-full border-2 border-white rounded-xl p-3 text-sm font-bold outline-none focus:border-[#3159a6]" placeholder="Rate" value={tempManual.price || ''} onChange={e=>setTempManual({...tempManual, price: Number(e.target.value)})} /></div>
              <div className="flex gap-2">
                <select className="border-2 border-white rounded-xl p-3 text-xs font-bold outline-none flex-1" value={tempManual.gst} onChange={e=>setTempManual({...tempManual, gst: Number(e.target.value)})}>
                  <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                </select>
                <button onClick={handleAddManualItem} className="bg-[#3159a6] text-white p-3 rounded-xl hover:bg-slate-800 transition shadow-lg"><PackagePlus size={20}/></button>
              </div>
            </div>
            {manualItems.length > 0 && (
              <div className="space-y-2 mt-4">
                {manualItems.map(item => (
                  <div key={item.hearingAidId} className="flex justify-between items-center bg-white p-3 px-5 rounded-xl border border-slate-100 shadow-sm animate-fade-in">
                    <div className="flex flex-col"><span className="text-xs font-black text-slate-800 uppercase">{item.model}</span><span className="text-[9px] text-slate-400 font-bold uppercase">HSN: {item.hsnCode} • GST: {item.gstRate}%</span></div>
                    <div className="flex items-center gap-6"><span className="font-black text-[#3159a6]">₹{item.price.toLocaleString()}</span><button onClick={() => setManualItems(manualItems.filter(i=>i.hearingAidId!==item.hearingAidId))} className="text-red-400 hover:text-red-600 transition"><Trash2 size={16}/></button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Global Adjustment</label><input type="number" value={totalAdjustment || ''} onChange={e => setTotalAdjustment(Number(e.target.value))} className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xl text-[#3159a6] outline-none shadow-sm" placeholder="0.00" /></div>
            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Warranty Period</label><input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl font-bold outline-none shadow-sm" /></div>
            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-1"><MessageSquare size={12}/> Remarks</label><textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl text-xs h-16 resize-none outline-none shadow-sm" placeholder="Internal clinical notes..." /></div>
          </div>
          <div className="mt-8 flex justify-between items-center bg-gray-50 p-8 rounded-3xl border-2 border-blue-50 shadow-inner">
            <div><p className="text-[10px] font-black text-[#3159a6] uppercase tracking-[0.2em] mb-1">Estimated Net Payable</p><p className="text-4xl font-black text-gray-900 tracking-tighter">₹{finalTotal.toLocaleString('en-IN')}</p></div>
            <button onClick={() => setStep('payment')} className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs">Proceed to Settlement &rarr;</button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
          <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 3: Financial Settlement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-blue-50/50 rounded-3xl border-2 border-blue-50 shadow-inner"><label className="block text-[10px] font-black text-[#3159a6] uppercase tracking-widest mb-4 ml-1">Immediate Collection (INR)</label><div className="relative"><IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3159a6]" size={24} /><input type="number" className="w-full pl-12 pr-4 py-5 border-2 border-white bg-white rounded-2xl outline-none focus:border-[#3159a6] text-3xl font-black text-gray-800 shadow-sm" value={initialPayment || ''} onChange={e => setInitialPayment(Number(e.target.value))} placeholder="0.00" /></div></div>
                <div className="p-8 bg-white rounded-3xl border-2 border-gray-50 space-y-5">
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Mode</label><select className="w-full border-2 border-gray-50 rounded-2xl p-4 outline-none focus:border-[#3159a6] font-black text-gray-700 bg-gray-50 transition" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Account Transfer">Transfer</option><option value="Cheque">Cheque</option><option value="EMI">EMI</option></select></div>
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Account</label><select className="w-full border-2 border-gray-50 rounded-2xl p-4 outline-none focus:border-[#3159a6] font-black text-[#3159a6] bg-gray-50 transition" value={paymentBank} onChange={e => setPaymentBank(e.target.value)}><option value="">-- No Bank (Cash) --</option>{COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}</select></div>
                </div>
              </div>
              {existingPayments.length > 0 && (
                <div className="bg-green-50/50 rounded-3xl border-2 border-green-100 p-8">
                  <h4 className="text-[10px] font-black text-green-800 uppercase tracking-[0.3em] mb-5 ml-1">Payment Accumulation</h4>
                  <div className="space-y-3">{existingPayments.map(p => (<div key={p.id} className="flex justify-between items-center text-sm bg-white px-5 py-3 rounded-xl border-2 border-green-50 shadow-sm"><span className="text-green-900 font-black uppercase tracking-widest text-[10px]">{p.method} {p.note ? `[${p.note}]` : ''}</span><span className="font-black text-green-900 text-lg">₹{p.amount.toLocaleString()}</span></div>))}</div>
                </div>
              )}
            </div>
            <div className="p-8 bg-[#3159a6] rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center text-center h-full relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none -rotate-12 translate-y-12 scale-150"></div><p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.4em] mb-4 relative z-10">Outstanding Balance</p><p className="text-5xl font-black text-white tracking-tighter relative z-10">₹{(finalTotal - (existingPayments.reduce((s,p)=>s+p.amount,0) + initialPayment)).toLocaleString()}</p></div>
          </div>
          <div className="mt-12 flex justify-end"><button onClick={() => setStep('review')} className="bg-[#3159a6] text-white px-16 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs">Review Digital Draft &rarr;</button></div>
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col items-center bg-gray-200/50 p-4 sm:p-10 min-h-screen">
          <div id="invoice-printable-area" className="bg-white shadow-2xl relative overflow-hidden animate-fade-in mx-auto w-full max-w-[900px] p-[10mm] flex flex-col print:max-w-none print:shadow-none print:p-0">
            {/* Header, Items Table, Financials (Similar to Quotations Review but with Invoice Details) */}
            <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-6">
              <div className="flex items-center gap-6"><img src={logo} alt="Logo" className="h-24 w-auto object-contain" /><div><h1 className="text-2xl font-black text-slate-900 uppercase leading-none tracking-tighter">{COMPANY_NAME}</h1><p className="text-[11px] text-slate-800 font-bold tracking-tight italic mt-1">{COMPANY_TAGLINE}</p><p className="text-[11px] text-slate-900 font-black mt-1 uppercase tracking-widest">GSTIN: {CLINIC_GSTIN}</p></div></div>
              <div className="text-right flex flex-col items-end"><div className="bg-[#3159a6] text-white px-6 py-2 mb-3 rounded-lg"><h2 className="text-lg font-black uppercase tracking-widest">Tax Invoice</h2></div><p className="text-sm font-black text-slate-900 uppercase"># {editingInvoiceId || generateNextId()}</p><p className="text-[11px] font-black text-slate-700 uppercase mt-1">DATE: {new Date().toLocaleDateString('en-IN')}</p></div>
            </div>
            {/* Client Section */}
            <div className="grid grid-cols-2 gap-8 mb-6"><div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100"><h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Client Details</h4><p className="font-black text-xl text-slate-900 uppercase tracking-tight leading-none mb-1">{patient.name}</p><p className="font-bold text-slate-900 text-sm mb-2">{patient.phone} • {patient.state}</p><p className="text-xs text-slate-800 uppercase font-semibold leading-relaxed">{patient.address || 'No Address Provided'}</p></div><div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100"><h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Billing Info</h4><p className="font-black text-[12px] text-slate-900 uppercase mb-1">{COMPANY_NAME}</p><p className="text-[10px] text-slate-800 font-bold uppercase">{COMPANY_EMAIL}</p><p className="text-[10px] text-slate-800 font-bold uppercase">{COMPANY_PHONES}</p></div></div>
            {/* Table */}
            <table className="w-full border-collapse border-4 border-slate-900 text-[12px] mb-6">
              <thead className="bg-[#3159a6] text-white uppercase font-black"><tr><th className="p-3 text-left border-r-2 border-white/20 w-[40%]">Description of Goods</th><th className="p-3 text-center border-r-2 border-white/20 w-[15%]">HSN</th><th className="p-3 text-right border-r-2 border-white/20 w-[15%]">Price</th><th className="p-3 text-center border-r-2 border-white/20 w-[10%]">GST %</th><th className="p-3 text-right w-[20%]">Total</th></tr></thead>
              <tbody className="font-bold text-slate-900">
                {allItems.map((item, idx) => (
                  <tr key={idx} className="border-b-2 border-slate-400"><td className="p-2 border-r-2 border-slate-900"><p className="font-black text-slate-900 uppercase">{item.brand} {item.model}</p><p className="text-[9px] text-[#3159a6] font-black">S/N: {item.serialNumber}</p></td><td className="p-2 text-center border-r-2 border-slate-900 font-mono">{item.hsnCode}</td><td className="p-2 text-right border-r-2 border-slate-900">₹{item.taxableValue.toLocaleString()}</td><td className="p-2 text-center border-r-2 border-slate-900">{item.gstRate}%</td><td className="p-2 text-right font-black bg-slate-50/50">₹{item.totalAmount.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
            {/* Totals Section */}
            <div className="bg-[#3159a6] text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 text-center shadow-lg">Grand Total in Words: {numberToWords(finalTotal)}</div>
            <div className="mt-8 flex justify-between items-end"><div className="w-[60%]"><p className="font-black text-[11px] uppercase border-b-4 border-slate-900 inline-block mb-3 tracking-widest">Legal Terms</p><div className="text-[10px] text-slate-800 font-bold space-y-1 uppercase tracking-tight"><p>1. Certified Medical Hearing aids (HSN 90214090).</p><p>2. Non-Refundable clinical goods. Warranty: {warranty}.</p></div></div><div className="text-center w-64">{signature ? <img src={signature} className="h-20 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-full border-b-4 border-dashed border-slate-200 mb-2"></div>}<p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-t-4 border-slate-900 pt-2">Authorized Signatory</p></div></div>
          </div>
          <div className="mt-10 flex gap-6 w-full max-w-[900px] print:hidden"><button onClick={() => setStep('payment')} className="flex-1 py-5 border-4 border-slate-800 rounded-3xl font-black uppercase text-xs transition-all">Go Back</button><button onClick={handleSaveInvoice} className="flex-[2] bg-[#3159a6] text-white py-5 px-12 rounded-3xl font-black uppercase shadow-2xl hover:bg-slate-800 flex items-center justify-center gap-4 text-xs transition-all active:scale-95"><Save size={22}/> Save Database Record</button><button onClick={() => window.print()} className="p-5 bg-slate-900 text-white rounded-3xl shadow-2xl hover:bg-black transition-all flex items-center justify-center active:scale-90"><Printer size={28}/></button></div>
        </div>
      )}
    </div>
  );
};
