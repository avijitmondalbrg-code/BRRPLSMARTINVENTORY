
import React, { useState } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole, AdvanceBooking } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, getFinancialYear } from '../constants';
import { FileText, Printer, Save, Eye, Plus, ArrowLeft, Search, History, Trash2, X, User, Wallet, IndianRupee, Edit, MessageSquare, Stethoscope, UserCheck, Building2 } from 'lucide-react';

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
    const prefix = `BRRPL-SR-${fy}-`;
    const fyInvoices = (invoices || []).filter(inv => inv.id.startsWith(prefix));
    const maxSeq = fyInvoices.length === 0 ? 0 : Math.max(...fyInvoices.map(inv => parseInt(inv.id.split('-').pop() || '0', 10)));
    return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
  };

  const resetForm = () => { 
    setStep('patient'); 
    setPatient({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' }); 
    setSelectedItemIds([]); 
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
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };
  
  const handleEditInvoice = (inv: Invoice, startStep: 'patient' | 'review' = 'review') => {
    setEditingInvoiceId(inv.id);
    setPatient(inv.patientDetails || { id: inv.patientId, name: inv.patientName, address: '', phone: '', referDoctor: '', audiologist: '' });
    setSelectedItemIds(inv.items.map(i => i.hearingAidId));
    const discounts: Record<string, number> = {};
    inv.items.forEach(i => { discounts[i.hearingAidId] = i.discount || 0; });
    setItemDiscounts(discounts);
    setTotalAdjustment(inv.discountValue || 0);
    setInvoiceNotes(inv.notes || '');
    setWarranty(inv.warranty || '2 Years Standard Warranty');
    setExistingPayments(inv.payments || []);
    setInitialPayment(0);
    setProductSearchTerm('');
    setStep(startStep);
    setViewMode('edit');
  };

  const handleSelectPatient = (p: Patient) => { setPatient({ ...p }); setPatientSearchTerm(p.name); setShowPatientResults(false); };

  const selectedInventoryItems = inventory.filter(i => selectedItemIds.includes(i.id));
  const subtotal = selectedInventoryItems.reduce((sum, item) => sum + item.price, 0);
  
  let runningTaxableTotal: number = 0;
  let runningCGST: number = 0;
  let runningSGST: number = 0;
  
  const invoiceItems: InvoiceItem[] = selectedInventoryItems.map(item => {
      const itemDisc: number = (itemDiscounts[item.id] as number) || 0;
      const itemTaxable: number = Math.max(0, item.price - itemDisc);
      const gstRate: number = gstOverrides[item.id] !== undefined ? (gstOverrides[item.id] as number) : (item.gstRate || 0);
      const cgst: number = (itemTaxable * (gstRate / 100)) / 2;
      const sgst: number = (itemTaxable * (gstRate / 100)) / 2;
      runningTaxableTotal += itemTaxable; 
      runningCGST += cgst; 
      runningSGST += sgst; 
      return { 
          hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, 
          price: item.price, discount: itemDisc, gstRate, taxableValue: itemTaxable, 
          cgstAmount: cgst, sgstAmount: sgst, igstAmount: 0, totalAmount: itemTaxable + cgst + sgst, 
          hsnCode: item.hsnCode || '90214090' 
      };
  });

  const finalTotal: number = Math.max(0, (runningTaxableTotal + runningCGST + runningSGST) - totalAdjustment);
  const totalItemDiscounts: number = (Object.values(itemDiscounts) as number[]).reduce((a: number, b: number) => a + b, 0);

  const gstSummary = React.useMemo(() => {
    const summary: Record<number, { taxable: number, cgst: number, sgst: number }> = {};
    invoiceItems.forEach(item => {
      const rate = item.gstRate;
      if (!summary[rate]) summary[rate] = { taxable: 0, cgst: 0, sgst: 0 };
      summary[rate].taxable += item.taxableValue;
      summary[rate].cgst += item.cgstAmount;
      summary[rate].sgst += item.sgstAmount;
    });
    return summary;
  }, [invoiceItems]);

  const handleSaveInvoice = () => {
    const finalId = editingInvoiceId || generateNextId();
    const currentPayments = [...existingPayments];
    if (initialPayment > 0) {
      currentPayments.push({
        id: `PAY-${Date.now()}`, date: new Date().toISOString().split('T')[0],
        amount: initialPayment, method: paymentMethod, bankDetails: paymentBank || ""
      });
    }
    const totalPaid = currentPayments.reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0);
    const balanceDue = Math.max(0, finalTotal - totalPaid);
    const invData: Invoice = { 
      id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: invoiceItems, 
      subtotal, discountType: 'flat', discountValue: totalAdjustment, totalDiscount: totalItemDiscounts + totalAdjustment, 
      placeOfSupply: 'Intra-State', totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: 0, totalTax: runningCGST + runningSGST, 
      finalTotal: finalTotal, date: new Date().toISOString().split('T')[0], warranty, patientDetails: patient, notes: invoiceNotes,
      payments: currentPayments, balanceDue: balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid') 
    };
    onCreateInvoice(invData, selectedItemIds); 
    setViewMode('list');
  };

  const handleApplyAdvance = (adv: AdvanceBooking) => {
      const newPayment: PaymentRecord = {
          id: `PAY-ADV-${Date.now()}`, date: new Date().toISOString().split('T')[0],
          amount: adv.amount, method: 'Advance', note: `Ref: ${adv.id}`, bankDetails: 'N/A'
      };
      setExistingPayments([...existingPayments, newPayment]);
  };

  const handleConfirmCollection = () => {
      if (!collectingInvoice || !onUpdateInvoice || newPaymentAmount <= 0) return;
      const newPayment: PaymentRecord = { id: `PAY-${Date.now()}`, date: payDate, amount: newPaymentAmount, method: payMethod, bankDetails: payBank || "" };
      const updatedPayments = [...(collectingInvoice.payments || []), newPayment];
      const totalPaid = updatedPayments.reduce((sum, p: PaymentRecord) => sum + p.amount, 0);
      const balanceDue = Math.max(0, collectingInvoice.finalTotal - totalPaid);
      const updatedInvoice: Invoice = { ...collectingInvoice, payments: updatedPayments, balanceDue: balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : 'Partial' };
      onUpdateInvoice(updatedInvoice);
      setShowCollectModal(false);
      setCollectingInvoice(null);
      setNewPaymentAmount(0);
  };

  const openCollectModal = (inv: Invoice) => {
      setCollectingInvoice(inv);
      setNewPaymentAmount(inv.balanceDue);
      setShowCollectModal(true);
  };

  if (viewMode === 'list') {
      const filteredInvoices = invoices.filter(inv => 
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.patientName.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-[#3159a6]" /> Billing & Sales</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input className="pl-10 pr-4 py-2 border rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-[#3159a6]" placeholder="Find invoice..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={handleStartNew} className="bg-[#3159a6] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition whitespace-nowrap"><Plus size={16} /> New Invoice</button>
                  </div>
              </div>
              <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#3159a6] text-white font-black border-b text-[10px] uppercase tracking-[0.2em]">
                            <tr><th className="p-5">Invoice No</th><th className="p-5">Date</th><th className="p-5">Patient</th><th className="p-5 text-right">Grand Total</th><th className="p-5 text-right">Outstanding</th><th className="p-5 text-center">Status</th><th className="p-5 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-blue-50/30 transition">
                                    <td className="p-5 font-black text-[#3159a6]">{inv.id}</td>
                                    <td className="p-5 text-gray-500 font-bold whitespace-nowrap">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                                    <td className="p-5 font-black text-gray-800 uppercase tracking-tighter">{inv.patientName}</td>
                                    <td className="p-5 text-right font-black">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                                    <td className="p-5 text-right font-black text-red-600">₹{(inv.balanceDue || 0).toLocaleString('en-IN')}</td>
                                    <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : inv.paymentStatus === 'Partial' ? 'bg-orange-50 text-orange-800 border-orange-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{inv.paymentStatus}</span></td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            <button onClick={() => handleEditInvoice(inv, 'review')} className="p-2 text-[#3159a6] hover:bg-blue-50 rounded-lg transition" title="View Details"><Eye size={18}/></button>
                                            <button onClick={() => handleEditInvoice(inv, 'patient')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit Invoice"><Edit size={18}/></button>
                                            <button onClick={() => openCollectModal(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Add Payment" disabled={inv.balanceDue <= 0}><Wallet size={18} className={inv.balanceDue <= 0 ? 'opacity-20' : ''}/></button>
                                            {userRole === 'admin' && onDelete && (<button onClick={() => { if(window.confirm(`Delete invoice ${inv.id}? Items will be restocked.`)) onDelete(inv.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 size={18}/></button>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
              {showCollectModal && collectingInvoice && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border-4 border-white">
                          <div className="bg-slate-900 p-6 text-white flex justify-between items-center"><div><h3 className="font-black uppercase tracking-widest text-xs">Collection Entry</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{collectingInvoice.id}</p></div><button onClick={() => setShowCollectModal(false)}><X size={24}/></button></div>
                          <div className="p-10 space-y-8">
                              <div className="flex justify-between items-end border-b-2 border-dashed border-gray-100 pb-6"><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Amount</p><p className="text-4xl font-black text-red-600 tracking-tighter">₹{collectingInvoice.balanceDue.toLocaleString()}</p></div><div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Invoice</p><p className="text-lg font-black text-gray-700">₹{collectingInvoice.finalTotal.toLocaleString()}</p></div></div>
                              <div className="space-y-5">
                                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Receipt Date</label><input type="date" className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-[#3159a6] outline-none font-black text-slate-700 bg-gray-50 focus:bg-white transition" value={payDate} onChange={e=>setPayDate(e.target.value)} /></div>
                                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Collected Amount (INR)</label><div className="relative"><IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3159a6]" size={20} /><input type="number" className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:border-[#3159a6] outline-none text-2xl font-black text-slate-800 bg-gray-50 focus:bg-white transition" value={newPaymentAmount} onChange={e => setNewPaymentAmount(Math.min(Number(e.target.value), collectingInvoice.balanceDue))} /></div></div>
                                  <div className="grid grid-cols-2 gap-5">
                                      <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Payment Method</label><select className="w-full border-2 border-gray-50 rounded-2xl p-4 outline-none font-black text-slate-700 bg-gray-50 focus:border-[#3159a6]" value={payMethod} onChange={e => setPayMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Account Transfer">Transfer</option><option value="Cheque">Cheque</option><option value="EMI">EMI</option></select></div>
                                      <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Bank Hub</label><select className="w-full border-2 border-gray-50 rounded-2xl p-4 outline-none font-black text-[#3159a6] bg-gray-50 focus:border-[#3159a6]" value={payBank} onChange={e => setPayBank(e.target.value)}> <option value="">None (Cash)</option>{COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}</select></div>
                                  </div>
                              </div>
                              <button onClick={handleConfirmCollection} className="w-full py-5 bg-[#3159a6] text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition active:scale-95">Finalize Collection</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  const patientAdvances = advanceBookings.filter(b => 
    b.patientId === patient.id && 
    b.status === 'Active' && 
    !existingPayments.some(p => p.note?.includes(b.id))
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
        <div className="mb-8 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 hover:bg-gray-100 rounded-full text-gray-400 shadow-sm transition"><ArrowLeft size={24} /></button><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Invoice Architect</h2></div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl border">{['patient', 'product', 'payment', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'bg-[#3159a6] text-white shadow-lg' : 'bg-transparent text-gray-400'}`}>{idx+1}. {s}</button>))}</div>
        </div>
        
        {step === 'patient' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 1: Client Selection</h3>
                <div className="mb-10 relative"><label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Recall Registered Patient</label><div className="relative"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Start typing name or mobile..." className="w-full pl-12 pr-4 py-5 border-2 border-gray-50 bg-gray-50/50 rounded-2xl outline-none focus:border-[#3159a6] focus:bg-white transition-all shadow-sm font-bold text-lg" value={patientSearchTerm} onFocus={() => setShowPatientResults(true)} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} /></div>{showPatientResults && (<div className="absolute z-50 left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto custom-scrollbar p-2"><div className="space-y-1">{patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(<button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-6 py-4 hover:bg-blue-50 rounded-2xl border-b border-gray-50 last:border-0 flex justify-between items-center transition-all group"><div><p className="font-black text-gray-800 uppercase tracking-tight">{p.name}</p><p className="text-[10px] text-gray-400 font-bold">{p.phone}</p></div><span className="text-[#3159a6] text-[9px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full group-hover:bg-[#3159a6] group-hover:text-white transition-all">Select</span></button>))}</div></div>)}</div>
                <div className="bg-blue-50/30 p-8 rounded-[2rem] border-2 border-dashed border-blue-100 space-y-8">
                    <p className="text-[10px] font-black text-[#3159a6] uppercase tracking-[0.2em]">Verification & Contact Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Patient Full Name *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Active Phone *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Referrer Doctor</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.referDoctor} onChange={e => setPatient({...patient, referDoctor: e.target.value})} placeholder="Dr. Name" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Audiologist</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.audiologist} onChange={e => setPatient({...patient, audiologist: e.target.value})} placeholder="Name" /></div>
                      <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Full Postal Address</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div>
                    </div>
                </div>
                <div className="mt-12 flex justify-end"><button onClick={() => setStep('product')} disabled={!patient.name} className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs disabled:opacity-50">Proceed to Product Selection &rarr;</button></div>
            </div>
        )}

        {step === 'product' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 2: Inventory Assignment</h3>
                <div className="relative mb-6 flex gap-4"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Find serial number or model..." className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 bg-gray-50/50 rounded-2xl focus:bg-white focus:border-[#3159a6] outline-none transition font-bold" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)}/></div></div>
                <div className="max-h-96 overflow-y-auto border-2 border-gray-50 rounded-[2rem] mb-10 shadow-inner custom-scrollbar overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#3159a6] text-white sticky top-0 uppercase font-black text-[10px] tracking-widest">
                            <tr><th className="p-5 w-14"></th><th className="p-5">Device Unit</th><th className="p-5">Serial No</th><th className="p-5 text-center">Tax %</th><th className="p-5 text-center">Discount (₹)</th><th className="p-5 text-right">Unit MRP</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {inventory.filter(i => {
                                const match = i.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) || i.model.toLowerCase().includes(productSearchTerm.toLowerCase()) || i.serialNumber.toLowerCase().includes(productSearchTerm.toLowerCase());
                                return (i.status === 'Available' || selectedItemIds.includes(i.id)) && match;
                            }).map(item => (
                                <tr key={item.id} className={`${selectedItemIds.includes(item.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition`}>
                                    <td className="p-5 text-center"><input type="checkbox" className="h-5 w-5 rounded-lg border-2 border-gray-200 text-[#3159a6] focus:ring-[#3159a6] transition" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) { setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); const newDiscounts = {...itemDiscounts}; delete newDiscounts[item.id]; setItemDiscounts(newDiscounts); } else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td>
                                    <td className="p-5 font-black text-gray-800 uppercase tracking-tighter">{item.brand} {item.model}</td>
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
                                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Mode</label><select className="w-full border-2 border-gray-50 rounded-2xl p-4 outline-none focus:border-[#3159a6] font-black text-gray-700 bg-gray-50 transition" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="UPI">UPI (QR)</option><option value="Account Transfer">Bank Transfer</option><option value="Cheque">Bank Cheque</option><option value="EMI">EMI Finance</option></select></div>
                                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Account</label><select className="w-full border-2 border-gray-50 rounded-2xl p-4 outline-none focus:border-[#3159a6] font-black text-[#3159a6] bg-gray-50 transition" value={paymentBank} onChange={e => setPaymentBank(e.target.value)}><option value="">-- No Bank (Cash) --</option>{COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}</select></div>
                            </div>
                        </div>
                        {patientAdvances.length > 0 && (
                            <div className="bg-amber-50/50 rounded-3xl border-2 border-amber-100 p-8">
                                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.3em] mb-5 ml-1">Unclaimed Advance Tokens</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{patientAdvances.map(adv => (<div key={adv.id} className="flex items-center justify-between bg-white p-5 rounded-2xl border-2 border-amber-100 shadow-sm transition-all hover:border-amber-400"><div><p className="font-black text-amber-900 text-lg">₹{adv.amount.toLocaleString()}</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{adv.date}</p></div><button onClick={() => handleApplyAdvance(adv)} className="px-6 py-2 bg-amber-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-amber-700 transition active:scale-95 shadow-lg shadow-amber-900/10">Apply</button></div>))}</div>
                            </div>
                        )}
                        {existingPayments.length > 0 && (
                            <div className="bg-green-50/50 rounded-3xl border-2 border-green-100 p-8">
                                <h4 className="text-[10px] font-black text-green-800 uppercase tracking-[0.3em] mb-5 ml-1">Payment Accumulation</h4>
                                <div className="space-y-3">{existingPayments.map(p => (<div key={p.id} className="flex justify-between items-center text-sm bg-white px-5 py-3 rounded-xl border-2 border-green-50 shadow-sm"><span className="text-green-900 font-black uppercase tracking-widest text-[10px]">{p.method} {p.note ? `[${p.note}]` : ''}</span><span className="font-black text-green-900 text-lg">₹{p.amount.toLocaleString()}</span></div>))}</div>
                            </div>
                        )}
                    </div>
                    <div className="p-8 bg-[#3159a6] rounded-[2.5rem] shadow-2xl shadow-blue-900/40 flex flex-col justify-center items-center text-center h-full relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none -rotate-12 translate-y-12 scale-150"></div><p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.4em] mb-4 relative z-10">Outstanding Balance</p><p className="text-5xl font-black text-white tracking-tighter relative z-10">₹{(finalTotal - (existingPayments.reduce((s: number, p: PaymentRecord)=>s+p.amount,0) + initialPayment)).toLocaleString()}</p></div>
                </div>
                <div className="mt-16 flex justify-end"><button onClick={() => setStep('review')} className="bg-[#3159a6] text-white px-16 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs">Review Digital Draft &rarr;</button></div>
            </div>
        )}

        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded shadow-2xl p-12 border relative overflow-hidden animate-fade-in print:p-0">
                <div className="flex justify-between items-start border-b-4 border-gray-900 pb-8 mb-8">
                    <div className="flex gap-6"><img src={logo} alt="Logo" className="h-32 w-32 object-contain" /><div><h1 className="text-4xl font-black text-gray-900 uppercase leading-none">{COMPANY_NAME}</h1><p className="text-sm text-gray-500 font-bold mt-2 tracking-tight italic">{COMPANY_TAGLINE}</p><p className="text-xs text-gray-500 font-bold mt-2 uppercase tracking-widest">GSTIN: {CLINIC_GSTIN}</p></div></div>
                    <div className="text-right"><div className="bg-[#3159a6] text-white px-8 py-2 inline-block mb-4 rounded-lg"><h2 className="text-2xl font-black uppercase tracking-[0.3em]">Tax Invoice</h2></div><p className="text-base font-black text-gray-900 tracking-widest mt-1 uppercase"># {editingInvoiceId || generateNextId()}</p><p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-1">ISSUED: {new Date().toLocaleDateString('en-IN')}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-12 mb-10 text-sm">
                  {/* Bill To Section */}
                  <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-50 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><User size={100}/></div>
                    <h4 className="text-xs font-black uppercase text-gray-400 mb-4 border-b border-gray-200 pb-1 tracking-[0.2em]">Consignee / Bill To:</h4>
                    <p className="font-black text-3xl text-gray-900 uppercase tracking-tighter">{patient.name}</p>
                    <p className="font-bold text-gray-600 text-sm mt-1">{patient.phone}</p>
                    <p className="text-xs text-gray-500 mt-3 uppercase font-semibold leading-relaxed">{patient.address}</p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-blue-100 rounded text-[#3159a6]"><Stethoscope size={14}/></div>
                          <div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ref. Doctor</p><p className="text-xs font-black text-gray-800">{patient.referDoctor || 'Self'}</p></div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-blue-100 rounded text-[#3159a6]"><UserCheck size={14}/></div>
                          <div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Audiologist</p><p className="text-xs font-black text-gray-800">{patient.audiologist || 'Internal'}</p></div>
                        </div>
                    </div>
                  </div>

                  {/* Bill By Section */}
                  <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-50 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Building2 size={100}/></div>
                    <h4 className="text-xs font-black uppercase text-gray-400 mb-4 border-b border-gray-200 pb-1 tracking-[0.2em]">Biller / Bill By:</h4>
                    <p className="font-black text-xl text-gray-900 uppercase tracking-tighter mb-2">BENGAL REHABILITATION & RESEARCH PRIVATE LIMITED</p>
                    <div className="space-y-1 text-xs text-gray-600 font-bold">
                        <p><span className="text-gray-400 uppercase tracking-widest mr-1 font-black">Add:</span> 34 Das Para Budge Budge, KOLKATA, WB, India-700138</p>
                        <p><span className="text-gray-400 uppercase tracking-widest mr-1 font-black">PAN:</span> AALCB1534C</p>
                        <p><span className="text-gray-400 uppercase tracking-widest mr-1 font-black">Email:</span> infobrg18@gmail.com</p>
                        <p><span className="text-gray-400 uppercase tracking-widest mr-1 font-black">Phone:</span> +91 98749 25867</p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h5 className="text-[10px] font-black uppercase text-[#3159a6] tracking-widest mb-2">Settlement Hub (Bank Details):</h5>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] uppercase font-black text-gray-500">
                            <div><span className="text-gray-400 mr-1">IFSC:</span> SBIN0001357</div>
                            <div><span className="text-gray-400 mr-1">Branch:</span> SBI THAKURPUKUR</div>
                            <div className="col-span-2 mt-1"><span className="text-gray-400 mr-1">ACC NO:</span> <span className="text-gray-900 text-sm tracking-widest">42367906742</span></div>
                        </div>
                    </div>
                  </div>
                </div>

                <table className="w-full border-collapse border-2 border-gray-900 text-sm mb-8 overflow-hidden rounded-xl">
                  <thead className="bg-[#3159a6] text-white uppercase text-xs font-black tracking-[0.2em]">
                    <tr><th className="p-5 text-left border-r border-white/20">Description of Goods</th><th className="p-5 text-center border-r border-white/20">HSN</th><th className="p-5 text-right border-r border-white/20">Unit Price</th><th className="p-5 text-center border-r border-white/20">GST</th><th className="p-5 text-right border-r border-white/20">Disc.</th><th className="p-5 text-right">Taxable Val</th></tr>
                  </thead>
                  <tbody className="font-bold text-base">
                    {invoiceItems.map(item => (
                        <tr key={item.hearingAidId} className="border-b-2 border-gray-900">
                            <td className="p-5 border-r-2 border-gray-900"><p className="font-black text-gray-900 uppercase text-base tracking-tighter">{item.brand} {item.model}</p><p className="text-[11px] text-[#3159a6] font-black uppercase mt-1 tracking-widest opacity-80">SERIAL NO: {item.serialNumber}</p></td>
                            <td className="p-5 text-center font-mono text-xs border-r-2 border-gray-900">{item.hsnCode}</td>
                            <td className="p-5 text-right border-r-2 border-gray-900">₹{item.price.toLocaleString()}</td>
                            <td className="p-5 text-center border-r-2 border-gray-900">{item.gstRate}%</td>
                            <td className="p-5 text-right text-red-600 border-r-2 border-gray-900">{item.discount > 0 ? `-₹${item.discount.toLocaleString()}` : '0.00'}</td>
                            <td className="p-5 text-right font-black bg-gray-50/50">₹{item.totalAmount.toFixed(2)}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mb-10 flex flex-col sm:flex-row justify-between gap-10">
                    <div className="max-w-xl flex-grow">
                        <h4 className="text-[11px] font-black uppercase text-[#3159a6] mb-3 tracking-[0.3em]">GST Computation (Statutory)</h4>
                        <table className="w-full border-collapse border-2 border-gray-900 text-[11px] text-center rounded-lg overflow-hidden">
                            <thead className="bg-gray-100 font-black uppercase text-gray-600"><tr className="border-b-2 border-gray-900"><th className="p-3 text-left border-r border-gray-900">Tax Rate</th><th className="p-3 text-right border-r border-gray-900">Taxable</th><th className="p-3 text-right border-r border-gray-800">CGST</th><th className="p-3 text-right border-r border-gray-800">SGST</th><th className="p-3 text-right">Total GST</th></tr></thead>
                            <tbody className="font-bold">{Object.entries(gstSummary).map(([rate, vals]: any) => (<tr key={rate} className="border-b border-gray-900"><td className="p-3 text-left font-black bg-gray-50 border-r border-gray-900">{rate}% GST</td><td className="p-3 text-right border-r border-gray-900">₹{vals.taxable.toFixed(2)}</td><td className="p-3 text-right border-r border-gray-800">₹{vals.cgst.toFixed(2)}</td><td className="p-3 text-right border-r border-gray-800">₹{vals.sgst.toFixed(2)}</td><td className="p-3 text-right font-black text-gray-900">₹{(vals.cgst + vals.sgst).toFixed(2)}</td></tr>))}</tbody>
                        </table>
                    </div>
                    {invoiceNotes && (<div className="sm:w-1/3 bg-blue-50/50 p-6 border-2 border-dashed border-blue-100 rounded-3xl"><h4 className="text-xs font-black uppercase text-[#3159a6] mb-3 border-b border-blue-100 pb-1 tracking-widest">Architectural Notes:</h4><p className="text-sm text-slate-700 italic leading-relaxed font-medium">"{invoiceNotes}"</p></div>)}
                </div>
                <div className="mt-12 mb-10">
                    <h4 className="text-xs font-black uppercase text-[#3159a6] mb-4 border-b-4 border-blue-50 pb-2 tracking-[0.3em]">Transaction Registry (settlement history)</h4>
                    <table className="w-full text-xs border-2 border-gray-900 rounded-xl overflow-hidden shadow-sm">
                        <thead className="bg-gray-100 text-gray-600 uppercase font-black tracking-widest"><tr><th className="p-4 border-r border-gray-900 text-left">Date</th><th className="p-4 border-r border-gray-900 text-left">Settlement Mode</th><th className="p-4 border-r border-gray-900 text-left">Reference / Bank</th><th className="p-4 text-right">Amount</th></tr></thead>
                        <tbody className="font-bold">
                            {existingPayments.map(p => (<tr key={p.id} className="border-t border-gray-900"><td className="p-4 border-r border-gray-900">{new Date(p.date).toLocaleDateString('en-IN')}</td><td className="p-4 border-r border-gray-900 uppercase">{p.method}</td><td className="p-4 border-r border-gray-900 text-gray-500 uppercase">{p.bankDetails || p.note || 'Direct Node'}</td><td className="p-4 text-right text-gray-900">₹{p.amount.toLocaleString()}</td></tr>))}
                            {initialPayment > 0 && (<tr className="border-t-2 border-gray-900 bg-blue-50/50"><td className="p-4 border-r border-gray-900">{new Date().toLocaleDateString('en-IN')}</td><td className="p-4 border-r border-gray-900 uppercase font-black text-[#3159a6]">{paymentMethod} (NOW)</td><td className="p-4 border-r border-gray-900 text-gray-500 uppercase">{paymentBank || 'Direct Node'}</td><td className="p-4 text-right font-black text-[#3159a6]">₹{initialPayment.toLocaleString()}</td></tr>)}
                        </tbody>
                        <tfoot className="bg-[#3159a6] text-white font-black text-sm"><tr><td colSpan={3} className="p-5 text-right uppercase tracking-[0.2em] border-r border-white/20">Total Settlement Received:</td><td className="p-5 text-right">₹{(existingPayments.reduce((s: number, p: PaymentRecord)=>s+p.amount,0) + initialPayment).toLocaleString()} /-</td></tr></tfoot>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-stretch gap-10 mb-12">
                    <div className="flex-1 bg-red-50 p-8 rounded-[2rem] border-4 border-white shadow-xl flex flex-col justify-center"><p className="text-xs font-black text-red-400 uppercase tracking-[0.4em] mb-2 text-center">Net Outstanding Payable</p><p className="text-4xl font-black text-red-600 text-center tracking-tighter">₹{(finalTotal - (existingPayments.reduce((s: number, p: PaymentRecord)=>s+p.amount,0) + initialPayment)).toLocaleString()} /-</p></div>
                    <div className="w-full sm:w-1/2 space-y-3 bg-gray-50 p-8 rounded-[2rem] border-2 border-white shadow-inner font-bold">
                        <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest"><span>Gross Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs text-red-500 uppercase tracking-widest"><span>Applied Rebates</span><span>-₹{(totalItemDiscounts + totalAdjustment).toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest"><span>Net Statutory GST</span><span>₹{(runningCGST + runningSGST).toFixed(2)}</span></div>
                        <div className="h-px bg-gray-200 my-4"></div>
                        <div className="flex justify-between items-center text-gray-900"><span className="text-sm font-black uppercase tracking-[0.3em]">Final Net Payable</span><span className="text-5xl font-black tracking-tighter text-[#3159a6]">₹{Math.round(finalTotal).toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="bg-[#3159a6] text-white p-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] mb-16 shadow-lg">Amount In Words: {numberToWords(finalTotal)}</div>
                <div className="flex justify-between items-end mt-24">
                    <div className="w-2/3"><p className="font-black text-xs uppercase border-b-4 border-gray-900 inline-block mb-4 tracking-[0.3em]">Terms & Conditions:</p><div className="text-[11px] text-gray-500 font-black space-y-2 leading-tight uppercase tracking-wider">
                    <p>1. Please keep this Invoice safe for future correspondence</p>
                    <p>2. Our Udyam Registration Certificate No. UDYAM-WB-18-0032916 (Micro Enterprise)</p>
                    <p>3. Under the current taxation regime, all healthcare services doctors and hospitals provide are exempt from GST. Theseexemptions were provided vide Notifications No. 12/2017-Central Tax (Rate) and 9/2017 – Integrated Tax (R) dated 28th June2017.</p>
                    <p>4. Hearing aids are classified under HSN 9021 40 90 and are exempt from GST by virtue of Sl.No 142 of Notf No 2/2017 CT(Rate) dated 28-06-2017.</p>
                    <p>5. Subject to jurisdiction of Courts in Kolkata, WB.</p></div></div>
                    <div className="text-center w-64">{signature ? <img src={signature} className="h-24 mb-3 mx-auto mix-blend-multiply opacity-90" /> : <div className="h-24 w-full border-b-4 border-dashed border-gray-200 mb-3"></div>}<p className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 border-t-2 border-gray-900 pt-2">Authorized Signatory</p></div>
                </div>
                <div className="mt-16 flex gap-5 print:hidden"><button onClick={() => setStep('payment')} className="flex-1 py-5 border-4 border-gray-900 rounded-[2rem] font-black uppercase tracking-[0.3em] hover:bg-gray-100 text-[10px] transition-all">Revise Settlement</button><button onClick={handleSaveInvoice} className="flex-[2] bg-[#3159a6] text-white py-5 px-12 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 hover:bg-slate-800 flex items-center justify-center gap-4 text-[10px] transition-all"> <Save size={20}/> Certify & Finalize</button><button onClick={() => window.print()} className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-xl hover:bg-black transition-all flex items-center justify-center"><Printer/></button></div>
            </div>
        )}
    </div>
  );
};
