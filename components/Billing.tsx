import React, { useState, useEffect } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, CLINIC_UDYAM, getFinancialYear } from '../constants';
import { FileText, Printer, Save, Eye, Plus, ArrowLeft, Search, CreditCard, History, Trash2, Calendar, X, User, Wallet, IndianRupee, Building2, CheckCircle2, Stethoscope, UserCheck, Receipt } from 'lucide-react';

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
  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'payment' | 'review'>('patient');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Manage Payment State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectingInvoice, setCollectingInvoice] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentRecord['method']>('Cash');
  const [payBank, setPayBank] = useState<string>('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form State for new invoice
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState(''); // New state for product search
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>({});
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  
  // Existing Payments for when editing
  const [existingPayments, setExistingPayments] = useState<PaymentRecord[]>([]);

  // Payment Received (Initial)
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [paymentBank, setPaymentBank] = useState<string>('');

  const handlePrint = () => window.print();

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
    setDiscountValue(0); 
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
  
  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setPatient(inv.patientDetails || { id: inv.patientId, name: inv.patientName, address: '', phone: '', referDoctor: '', audiologist: '' });
    setSelectedItemIds(inv.items.map(i => i.hearingAidId));
    setDiscountValue(inv.totalDiscount);
    setWarranty(inv.warranty || '2 Years Standard Warranty');
    setExistingPayments(inv.payments || []);
    setInitialPayment(0);
    setProductSearchTerm('');
    setStep('review');
    setViewMode('edit');
  };

  const handleSelectPatient = (p: Patient) => { setPatient({ ...p }); setPatientSearchTerm(p.name); setShowPatientResults(false); };

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
      
      runningTaxableTotal += itemTaxable; 
      runningCGST += cgst; 
      runningSGST += sgst; 
      runningFinalTotal += (itemTaxable + cgst + sgst);
      
      return { 
          hearingAidId: item.id, 
          brand: item.brand, 
          model: item.model, 
          serialNumber: item.serialNumber, 
          price: item.price, 
          gstRate, 
          taxableValue: itemTaxable, 
          cgstAmount: cgst, 
          sgstAmount: sgst, 
          igstAmount: 0, 
          totalAmount: itemTaxable + cgst + sgst, 
          hsnCode: item.hsnCode || '90214090' 
      };
  });

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
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: initialPayment,
        method: paymentMethod,
        bankDetails: paymentBank || ""
      });
    }
    const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, runningFinalTotal - totalPaid);
    const invData: Invoice = { 
      id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: invoiceItems, subtotal, discountType: 'flat', discountValue, totalDiscount: discountAmount, placeOfSupply: 'Intra-State', totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: 0, totalTax: runningCGST + runningSGST, finalTotal: runningFinalTotal, date: new Date().toISOString().split('T')[0], warranty, patientDetails: patient, payments: currentPayments, balanceDue: balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid') 
    };
    onCreateInvoice(invData, selectedItemIds); 
    setViewMode('list');
  };

  const handleConfirmCollection = () => {
      if (!collectingInvoice || !onUpdateInvoice || newPaymentAmount <= 0) return;
      const newPayment: PaymentRecord = { id: `PAY-${Date.now()}`, date: payDate, amount: newPaymentAmount, method: payMethod, bankDetails: payBank || "" };
      const updatedPayments = [...(collectingInvoice.payments || []), newPayment];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
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
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-primary" /> Billing & Invoices</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary" placeholder="Search invoice or patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={handleStartNew} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow hover:bg-teal-800 transition whitespace-nowrap"><Plus size={20} /> New Invoice</button>
                  </div>
              </div>
              <div className="bg-white rounded-xl shadow overflow-hidden border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-black border-b text-[10px] uppercase tracking-widest">
                            <tr><th className="p-4">Invoice No</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4 text-right">Grand Total</th><th className="p-4 text-right">Balance Due</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-bold text-teal-700">{inv.id}</td>
                                    <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                                    <td className="p-4 font-medium">{inv.patientName}</td>
                                    <td className="p-4 text-right font-bold">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-right font-black text-red-600">₹{(inv.balanceDue || 0).toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-center"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border shadow-sm ${inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : inv.paymentStatus === 'Partial' ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{inv.paymentStatus}</span></td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center items-center gap-1.5">
                                            <button onClick={() => handleEditInvoice(inv)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition" title="View/Edit"><Eye size={18}/></button>
                                            <button onClick={() => openCollectModal(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="Collect Payment" disabled={inv.balanceDue <= 0}><Wallet size={18} className={inv.balanceDue <= 0 ? 'opacity-20' : ''}/></button>
                                            {userRole === 'admin' && onDelete && (<button onClick={() => { if(window.confirm(`Are you sure you want to delete invoice ${inv.id}? Items will be restocked.`)) onDelete(inv.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete"><Trash2 size={18}/></button>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
              {showCollectModal && collectingInvoice && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                          <div className="bg-slate-900 p-5 text-white flex justify-between items-center"><div><h3 className="font-black uppercase tracking-widest text-sm">Add Payment</h3><p className="text-[10px] text-slate-400 font-bold uppercase">{collectingInvoice.id} • {collectingInvoice.patientName}</p></div><button onClick={() => setShowCollectModal(false)}><X size={24}/></button></div>
                          <div className="p-8 space-y-6">
                              <div className="flex justify-between items-end border-b border-dashed pb-4"><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Balance</p><p className="text-3xl font-black text-red-600">₹{collectingInvoice.balanceDue.toLocaleString()}</p></div><div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invoice</p><p className="text-lg font-black text-gray-700">₹{collectingInvoice.finalTotal.toLocaleString()}</p></div></div>
                              <div className="space-y-4">
                                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Date</label><input type="date" className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-teal-500 outline-none font-bold text-slate-700" value={payDate} onChange={e=>setPayDate(e.target.value)} /></div>
                                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Amount (INR)</label><div className="relative"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600" size={20} /><input type="number" className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl focus:border-teal-500 outline-none text-xl font-black text-slate-800" value={newPaymentAmount} onChange={e => setNewPaymentAmount(Math.min(Number(e.target.value), collectingInvoice.balanceDue))} /></div></div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Method</label><select className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold text-slate-700 bg-slate-50" value={payMethod} onChange={e => setPayMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Account Transfer">Bank Transfer</option><option value="Cheque">Cheque</option><option value="EMI">EMI</option></select></div>
                                      <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Bank</label><select className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold text-teal-700 bg-slate-50" value={payBank} onChange={e => setPayBank(e.target.value)}> <option value="">No Bank (Cash)</option>{COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}</select></div>
                                  </div>
                              </div>
                              <button onClick={handleConfirmCollection} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-teal-900/20 hover:bg-teal-700 transition active:scale-95">Confirm Receipt</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Invoice Builder</h2></div>
            <div className="flex gap-2">{['patient', 'product', 'payment', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${step === s ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}>{idx+1}. {s.toUpperCase()}</button>))}</div>
        </div>
        
        {step === 'patient' && (
            <div className="bg-white rounded-xl shadow border p-8 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-6 border-b pb-2 flex items-center gap-2"><User className="text-primary"/> 1. Patient & Clinic Details</h3>
                <div className="mb-8 relative"><label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Search Existing Patient</label><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Type Name or Phone Number to fetch patient..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-primary transition-all shadow-sm" value={patientSearchTerm} onFocus={() => setShowPatientResults(true)} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} /></div>{showPatientResults && (<div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-64 overflow-y-auto"><div className="p-2">{patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(<button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-5 py-3 hover:bg-teal-50 border-b last:border-0 flex justify-between items-center transition-colors group"><div><p className="font-bold">{p.name}</p><p className="text-xs text-gray-500">{p.phone}</p></div><span className="text-teal-600 text-[10px] font-black uppercase">Select</span></button>))}</div></div>)}</div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 space-y-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Identity Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-500 mb-1">PATIENT NAME *</label><input required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">PHONE NUMBER *</label><input required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div><div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">RESIDENTIAL ADDRESS</label><input className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div></div>
                </div>
                <div className="mt-8 flex justify-end"><button onClick={() => setStep('product')} disabled={!patient.name} className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-800 transition-all">Next Step: Select Product &rarr;</button></div>
            </div>
        )}

        {step === 'product' && (
            <div className="bg-white rounded-xl shadow border p-8 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-6 border-b pb-2">2. Select Device & Pricing</h3>
                
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Available Devices (Brand, Model, Serial)..." 
                        className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-shadow"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-xl mb-6 shadow-inner"><table className="w-full text-left text-xs"><thead className="bg-gray-50 sticky top-0 uppercase font-bold text-gray-400"><tr><th className="p-4 w-10"></th><th className="p-4">Brand/Model</th><th className="p-4">Serial No</th><th className="p-4">GST %</th><th className="p-4 text-right">Price</th></tr></thead><tbody className="divide-y">{inventory.filter(i => {
                    const match = i.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
                                  i.model.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
                                  i.serialNumber.toLowerCase().includes(productSearchTerm.toLowerCase());
                    return (i.status === 'Available' || selectedItemIds.includes(i.id)) && match;
                }).map(item => (<tr key={item.id} className={selectedItemIds.includes(item.id) ? 'bg-teal-50' : 'hover:bg-gray-50'}><td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-teal-600" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td><td className="p-4 font-bold">{item.brand} {item.model}</td><td className="p-4 font-mono">{item.serialNumber}</td><td className="p-4">{selectedItemIds.includes(item.id) && (<select className="border rounded p-1" value={gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0)} onChange={(e) => setGstOverrides({...gstOverrides, [item.id]: Number(e.target.value)})}> <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option></select>)}</td><td className="p-4 text-right font-black text-gray-900">₹{item.price.toLocaleString()}</td></tr>))}</tbody></table></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"><div className="p-4 bg-gray-50 rounded-xl border"><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Discount (INR)</label><input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="w-full border-2 p-2 rounded-lg font-bold text-lg outline-none focus:border-teal-500" /></div><div className="p-4 bg-gray-50 rounded-xl border"><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Warranty Period</label><input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border-2 p-2 rounded-lg font-medium outline-none focus:border-teal-500" /></div></div>
                <div className="mt-8 flex justify-between items-center"><div className="text-teal-900"><p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Gross Amount</p><p className="text-3xl font-black">₹{runningFinalTotal.toLocaleString('en-IN')}</p></div><button onClick={() => setStep('payment')} className="bg-primary text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-800">Next: Payment Details &rarr;</button></div>
            </div>
        )}

        {step === 'payment' && (
            <div className="bg-white rounded-xl shadow border p-8 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-6 border-b pb-2 flex items-center gap-2"><Wallet className="text-primary"/> 3. Payment Collection</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border shadow-inner"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount Collected Now (INR)</label><div className="relative"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600" size={20} /><input type="number" className="w-full pl-10 pr-4 py-4 border-2 border-gray-100 rounded-xl outline-none focus:border-primary text-2xl font-black text-gray-800" value={initialPayment || ''} onChange={e => setInitialPayment(Number(e.target.value))} placeholder="0.00" /></div></div>
                    <div className="p-6 bg-white rounded-2xl border space-y-4">
                        <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mode</label><select className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold text-gray-700 bg-gray-50" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Account Transfer">Bank Transfer</option><option value="Cheque">Cheque</option><option value="EMI">EMI</option></select></div>
                        <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bank</label><select className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold text-teal-700 bg-gray-50" value={paymentBank} onChange={e => setPaymentBank(e.target.value)}><option value="">-- No Bank (Cash) --</option>{COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}</select></div>
                    </div>
                    <div className="p-6 bg-teal-50 rounded-2xl border border-teal-100 flex flex-col justify-center items-center text-center"><p className="text-[10px] font-black text-teal-800 uppercase tracking-widest mb-1">Remaining Balance</p><p className="text-3xl font-black text-teal-900">₹{(runningFinalTotal - (existingPayments.reduce((s,p)=>s+p.amount,0) + initialPayment)).toLocaleString()}</p></div>
                </div>
                <div className="mt-12 flex justify-end"><button onClick={() => setStep('review')} className="bg-primary text-white px-12 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-800 transition-all">Preview Invoice &rarr;</button></div>
            </div>
        )}

        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded shadow-2xl p-12 border relative overflow-hidden animate-fade-in print:p-0">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                    <div className="flex gap-6"><img src={LOGO_URL} alt="Logo" className="h-24 w-24 object-contain" /><div><h1 className="text-2xl font-black text-gray-800 uppercase leading-none">{COMPANY_NAME}</h1><p className="text-xs text-gray-500 font-bold mt-2 tracking-tight italic">{COMPANY_TAGLINE}</p><p className="text-[10px] text-gray-500 mt-3 leading-relaxed max-w-sm">{COMPANY_ADDRESS}</p><p className="text-[10px] text-gray-500 font-bold mt-2 uppercase">GSTIN: {CLINIC_GSTIN}</p></div></div>
                    <div className="text-right"><div className="border-4 border-gray-800 px-6 py-1 inline-block mb-3"><h2 className="text-xl font-black uppercase tracking-widest">Tax Invoice</h2></div><p className="text-sm font-black text-gray-700"># {editingInvoiceId || generateNextId()}</p><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date: {new Date().toLocaleDateString('en-IN')}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-12 mb-10 text-sm"><div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b">Billed To:</h4><p className="font-black text-lg text-gray-900">{patient.name}</p><p className="font-bold text-gray-600">{patient.phone}</p><p className="text-xs text-gray-500 mt-1 uppercase">{patient.address}</p></div></div>
                
                <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                  <thead className="bg-gray-800 text-white uppercase text-[10px] font-black tracking-widest">
                    <tr>
                        <th className="p-4 text-left">Device Description</th>
                        <th className="p-4 text-center">HSN/SAC</th>
                        <th className="p-4 text-right">Unit MRP</th>
                        <th className="p-4 text-center">GST%</th>
                        <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map(item => (
                        <tr key={item.hearingAidId} className="border-b border-gray-200">
                            <td className="p-4">
                                <p className="font-black text-gray-800 uppercase">{item.brand} {item.model}</p>
                                <p className="text-[10px] text-teal-600 font-bold uppercase">S/N: {item.serialNumber}</p>
                            </td>
                            <td className="p-4 text-center font-mono text-xs">{item.hsnCode || '90214090'}</td>
                            <td className="p-4 text-right font-bold text-gray-700">₹{item.price.toLocaleString()}</td>
                            <td className="p-4 text-center">{item.gstRate}%</td>
                            <td className="p-4 text-right font-black">₹{item.totalAmount.toFixed(2)}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>

                {/* GST Tax Breakdown Section */}
                <div className="mb-8 max-w-lg">
                    <h4 className="text-[9px] font-black uppercase text-teal-700 mb-1.5 tracking-widest">GST Tax Breakdown (ট্যাক্স বিবরণ)</h4>
                    <table className="w-full border-collapse border border-gray-200 text-[10px] text-center">
                        <thead className="bg-teal-50 font-bold uppercase text-teal-700"><tr className="border-b"><th className="p-2 text-left">Rate (%)</th><th className="p-2 text-right">Taxable Val</th><th className="p-2 text-right">CGST</th><th className="p-2 text-right">SGST</th><th className="p-2 text-right">Total Tax</th></tr></thead>
                        <tbody>
                            {Object.entries(gstSummary).map(([rate, vals]: any) => (
                                <tr key={rate} className="border-b border-gray-50">
                                    <td className="p-2 text-left font-bold">{rate}%</td>
                                    <td className="p-2 text-right">₹{vals.taxable.toFixed(2)}</td>
                                    <td className="p-2 text-right">₹{vals.cgst.toFixed(2)}</td>
                                    <td className="p-2 text-right">₹{vals.sgst.toFixed(2)}</td>
                                    <td className="p-2 text-right font-bold text-gray-800">₹{(vals.cgst + vals.sgst).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detailed Payment History Section */}
                <div className="mt-10 mb-8">
                    <h4 className="text-[10px] font-black uppercase text-teal-700 mb-3 border-b-2 border-teal-100 pb-1 tracking-widest">Payment History (ট্রানজ্যাকশন বিবরণ)</h4>
                    <table className="w-full text-[11px] border border-gray-200">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                            <tr>
                                <th className="p-2 border text-left">Date (তারিখ)</th>
                                <th className="p-2 border text-left">Payment Mode (পেমেন্ট মোড)</th>
                                <th className="p-2 border text-left">Bank/Ref (ব্যাংক)</th>
                                <th className="p-2 border text-right">Amount (টাকা)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {existingPayments.map(p => (
                                <tr key={p.id}>
                                    <td className="p-2 border">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                                    <td className="p-2 border font-bold uppercase">{p.method}</td>
                                    <td className="p-2 border text-gray-500">{p.bankDetails || 'Direct/Cash'}</td>
                                    <td className="p-2 border text-right font-black text-teal-800">₹{p.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {initialPayment > 0 && (
                                <tr className="bg-teal-50">
                                    <td className="p-2 border">{new Date().toLocaleDateString('en-IN')}</td>
                                    <td className="p-2 border font-bold uppercase">{paymentMethod}</td>
                                    <td className="p-2 border text-gray-500">{paymentBank || 'Direct/Cash'}</td>
                                    <td className="p-2 border text-right font-black text-teal-800">₹{initialPayment.toLocaleString()}</td>
                                </tr>
                            )}
                            {(existingPayments.length === 0 && initialPayment <= 0) && (
                                <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">No payments recorded yet.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 font-black">
                            <tr>
                                <td colSpan={3} className="p-2 text-right uppercase border">Total Received (মোট সংগৃহীত):</td>
                                <td className="p-2 text-right border text-teal-800">₹{(existingPayments.reduce((s,p)=>s+p.amount,0) + initialPayment).toLocaleString()} /-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10">
                    <div className="flex-1 w-full sm:w-auto"><div className="p-6 bg-slate-50 border-2 border-teal-100 rounded-3xl"><div className="space-y-3 text-xs"><div className="flex justify-between font-black text-red-600 text-sm"><span>Outstanding Balance (বাকি):</span><span>₹{(runningFinalTotal - (existingPayments.reduce((s,p)=>s+p.amount,0) + initialPayment)).toLocaleString()} /-</span></div></div></div></div>
                    <div className="w-full sm:w-1/2 space-y-2 bg-gray-50 p-6 rounded-3xl border-2 border-gray-100"><div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Subtotal (Gross MRP)</span><span>₹{subtotal.toLocaleString()}</span></div><div className="flex justify-between text-xs font-bold text-red-600 uppercase"><span>Adjustment</span><span>-₹{discountAmount.toLocaleString()}</span></div><div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold"><span>Total GST</span><span>₹{(runningCGST + runningSGST).toFixed(2)}</span></div><div className="h-px bg-gray-300 my-2"></div><div className="flex justify-between items-center text-teal-900"><span className="text-sm font-black uppercase tracking-widest">Net Payable</span><span className="text-4xl font-black">₹{Math.round(runningFinalTotal).toLocaleString()}</span></div></div>
                </div>

                <div className="bg-gray-50 p-4 border rounded-xl text-[10px] font-black uppercase mb-12 tracking-widest text-gray-600">Words: {numberToWords(runningFinalTotal)}</div>
                <div className="flex justify-between items-end mt-20"><div className="w-3/4"><p className="font-black text-[10px] uppercase border-b-2 border-gray-800 inline-block mb-3 tracking-widest">Terms & Conditions</p><div className="text-[8.5px] text-gray-500 font-bold space-y-1 leading-tight uppercase"><p>1. Please keep this Invoice safe.</p><p>2. Hearing aids are classification HSN 9021 40 90 (GST Exempt).</p><p>3. Warranty: {warranty}.</p></div></div><div className="text-center">{signature ? <img src={signature} className="h-16 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-40 border-b-2 border-dashed border-gray-300 mb-2"></div>}<p className="text-[10px] font-black uppercase tracking-widest text-gray-800">Authorized Signatory</p></div></div>
                <div className="mt-12 flex gap-4 print:hidden"><button onClick={() => setStep('payment')} className="flex-1 py-4 border-2 border-gray-800 rounded-xl font-black uppercase tracking-widest hover:bg-gray-100 text-xs">Edit Payment</button><button onClick={handleSaveInvoice} className="flex-[2] bg-primary text-white py-4 px-12 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-teal-800 flex items-center justify-center gap-3 text-xs"> <Save size={18}/> Confirm & Save</button><button onClick={handlePrint} className="p-4 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black transition-colors"><Printer/></button></div>
            </div>
        )}
    </div>
  );
};