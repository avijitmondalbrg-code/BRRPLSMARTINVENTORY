import React, { useState, useMemo } from 'react';
/* FIX: Moved BRANDS import from ../constants to ../types as it is exported from types.ts */
import { Patient, Invoice, InvoiceItem, PaymentRecord, UserRole, BRANDS } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, STAFF_NAMES } from '../constants';
import { FileText, Printer, Save, Eye, Plus, ArrowLeft, Search, Trash2, X, IndianRupee, Edit, Wrench, PackagePlus, CheckCircle2, Settings2, Download, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';

interface DemoBillingProps {
  invoices: Invoice[];
  patients: Patient[];
  onCreateInvoice: (invoice: Invoice) => void;
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

export const DemoBilling: React.FC<DemoBillingProps> = ({ invoices = [], patients, onCreateInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'review'>('patient');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Print Customization State
  const [printScale, setPrintScale] = useState(100);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', state: 'West Bengal', district: 'Kolkata', phone: '', referDoctor: '', audiologist: '' });
  
  const [manualItems, setManualItems] = useState<InvoiceItem[]>([]);
  const [tempManual, setTempManual] = useState({ brand: BRANDS[0], model: '', hsn: '90214090', price: 0, gst: 0, qty: 1, serial: '' });
  const [totalAdjustment, setTotalAdjustment] = useState<number>(0); 
  const [invoiceNotes, setInvoiceNotes] = useState<string>(''); 
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [entryBy, setEntryBy] = useState<string>(STAFF_NAMES[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const generateNextId = () => {
    return `BRRPL-DEMO-${Date.now().toString().slice(-6)}`;
  };

  const resetForm = () => { 
    setStep('patient'); 
    setPatient({ id: '', name: '', address: '', state: 'West Bengal', district: 'Kolkata', phone: '', referDoctor: '', audiologist: '' }); 
    setManualItems([]);
    setTotalAdjustment(0);
    setInvoiceNotes('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setWarranty('2 Years Standard Warranty'); 
    setEntryBy(STAFF_NAMES[0]);
    setPatientSearchTerm(''); 
    setTempManual({ brand: BRANDS[0], model: '', hsn: '90214090', price: 0, gst: 0, qty: 1, serial: '' });
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleSelectPatient = (p: Patient) => { 
    setPatient({ ...p, state: p.state || 'West Bengal', district: p.district || 'Kolkata' }); 
    setPatientSearchTerm(p.name); 
    setShowPatientResults(false); 
  };

  const handleAddLine = () => {
    if (!tempManual.model || tempManual.price <= 0) return;
    const qty = tempManual.qty || 1;
    const taxableValue = tempManual.price * qty;
    const totalTax = taxableValue * (tempManual.gst / 100);
    const isInterState = patient.state && patient.state !== 'West Bengal';

    const newItem: InvoiceItem = {
        hearingAidId: `DEMO-${Date.now()}`,
        brand: tempManual.brand,
        model: tempManual.model,
        serialNumber: tempManual.serial || 'N/A',
        price: tempManual.price,
        qty: qty,
        hsnCode: tempManual.hsn,
        gstRate: tempManual.gst,
        discount: 0,
        taxableValue: taxableValue,
        cgstAmount: isInterState ? 0 : totalTax / 2,
        sgstAmount: isInterState ? 0 : totalTax / 2,
        igstAmount: isInterState ? totalTax : 0,
        totalAmount: taxableValue + totalTax
    };
    setManualItems([...manualItems, newItem]);
    setTempManual({ brand: BRANDS[0], model: '', hsn: '90214090', price: 0, gst: 0, qty: 1, serial: '' });
  };

  const lineSubtotal = manualItems.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalTax = manualItems.reduce((sum, item) => sum + (item.cgstAmount + item.sgstAmount + item.igstAmount), 0);
  const finalTotal = Math.round(Math.max(0, (lineSubtotal + totalTax) - totalAdjustment));
  const roundOff = finalTotal - ((lineSubtotal + totalTax) - totalAdjustment);

  const handleSaveInvoice = () => {
    const invData: Invoice = { 
      id: generateNextId(), patientId: patient.id || `P-DEMO`, patientName: patient.name, items: manualItems, 
      subtotal: lineSubtotal, discountType: 'flat', discountValue: totalAdjustment, totalDiscount: totalAdjustment, 
      placeOfSupply: (patient.state !== 'West Bengal') ? 'Inter-State' : 'Intra-State', totalTaxableValue: lineSubtotal, totalCGST: 0, totalSGST: 0, totalIGST: 0, totalTax: totalTax, 
      finalTotal: finalTotal, date: invoiceDate, warranty, entryBy: entryBy, patientDetails: patient, notes: invoiceNotes,
      payments: [{ id: 'P1', amount: finalTotal, method: paymentMethod, date: invoiceDate }], balanceDue: 0, paymentStatus: 'Paid' 
    };
    onCreateInvoice(invData); 
    setViewMode('list');
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShieldCheck className="text-pink-600" /> Demo Invoicing Hub</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Reimbursement Segment (Non-Financial)</p>
              </div>
              <button onClick={handleStartNew} className="bg-pink-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-pink-700 transition">
                  <Plus size={20} /> Create Demo Bill
              </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
              <Search className="text-gray-400" size={20} />
              <input type="text" placeholder="Search demo bills..." className="flex-1 outline-none text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b">
                      <tr><th className="p-5">Demo ID</th><th className="p-5">Date</th><th className="p-5">Patient</th><th className="p-5 text-right">Total Amount</th><th className="p-5 text-center">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                      {filteredInvoices.length === 0 ? (
                          <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No demo records found</td></tr>
                      ) : filteredInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-pink-50/30 transition">
                              <td className="p-5 font-black text-pink-600 uppercase">{inv.id}</td>
                              <td className="p-5 font-bold text-gray-500">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                              <td className="p-5 font-black text-gray-800 uppercase">{inv.patientName}</td>
                              <td className="p-5 text-right font-black text-lg">₹{inv.finalTotal.toLocaleString()}</td>
                              <td className="p-5 text-center">
                                  <div className="flex justify-center gap-2">
                                      <button onClick={() => { setPatient(inv.patientDetails!); setManualItems(inv.items); setInvoiceDate(inv.date); setInvoiceNotes(inv.notes || ''); setTotalAdjustment(inv.discountValue); setStep('review'); setViewMode('edit'); }} className="p-2 text-pink-600 hover:bg-pink-50 rounded-xl transition"><Printer size={18}/></button>
                                      {userRole === 'admin' && onDelete && (
                                          <button onClick={() => onDelete(inv.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={18}/></button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
        <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 rounded-full text-gray-400 shadow-sm transition"><ArrowLeft size={24} /></button><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Demo Bill Architect</h2></div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl border">{['patient', 'product', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'bg-pink-600 text-white shadow-lg' : 'bg-transparent text-gray-400'}`}>{idx+1}. {s}</button>))}</div>
        </div>
        
        {step === 'patient' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-pink-600 uppercase tracking-[0.3em] mb-10 border-b-2 border-pink-50 pb-4">Phase 1: Client Identity</h3>
                <div className="mb-10 relative">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Recall Registered Patient</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search registry..." className="w-full pl-12 pr-4 py-5 border-2 border-gray-50 bg-gray-50/50 rounded-2xl outline-none focus:border-pink-600 focus:bg-white transition-all shadow-sm font-bold text-lg" value={patientSearchTerm} onFocus={() => setShowPatientResults(true)} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} />
                  </div>
                  {showPatientResults && patientSearchTerm && (
                    <div className="absolute z-50 left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto custom-scrollbar p-2">
                      {patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(
                        <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-6 py-4 hover:bg-pink-50 rounded-2xl border-b border-gray-50 last:border-0 flex justify-between items-center transition-all group">
                          <div><p className="font-black text-gray-800 uppercase tracking-tight">{p.name}</p><p className="text-[10px] text-gray-400 font-bold">{p.phone}</p></div>
                          <span className="text-pink-600 text-[9px] font-black uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full group-hover:bg-pink-600 group-hover:text-white transition-all">Select</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-pink-50/30 p-8 rounded-[2rem] border-2 border-dashed border-pink-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Patient Name *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-pink-600 font-bold shadow-sm" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Active Phone *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-pink-600 font-bold shadow-sm" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-1"><UserCheck size={12}/> Ref. Dr.</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-pink-600 font-bold shadow-sm" value={patient.referDoctor} onChange={e => setPatient({...patient, referDoctor: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-1"><Stethoscope size={12}/> Audiologist</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-pink-600 font-bold shadow-sm" value={patient.audiologist} onChange={e => setPatient({...patient, audiologist: e.target.value})} /></div>
                      <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Postal Address</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-pink-600 font-bold shadow-sm" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div>
                    </div>
                </div>
                <div className="mt-12 flex justify-end"><button onClick={() => setStep('product')} disabled={!patient.name} className="bg-pink-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all text-xs">Next Phase &rarr;</button></div>
            </div>
        )}

        {step === 'product' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-pink-600 uppercase tracking-[0.3em] mb-10 border-b-2 border-pink-50 pb-4">Phase 2: Manual Device Entry</h3>
                
                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand</label>
                            <select className="w-full border-2 border-white rounded-xl p-3 font-bold text-sm" value={tempManual.brand} onChange={e=>setTempManual({...tempManual, brand: e.target.value})}>
                                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Model Name *</label>
                            <input className="w-full border-2 border-white rounded-xl p-3 font-bold text-sm" placeholder="e.g. Marvel M50" value={tempManual.model} onChange={e=>setTempManual({...tempManual, model: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Serial Number</label>
                            <input className="w-full border-2 border-white rounded-xl p-3 font-mono font-bold text-sm uppercase" placeholder="Unique S/N" value={tempManual.serial} onChange={e=>setTempManual({...tempManual, serial: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HSN Code</label>
                            <input className="w-full border-2 border-white rounded-xl p-3 font-mono text-sm" value={tempManual.hsn} onChange={e=>setTempManual({...tempManual, hsn: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rate (Base)</label>
                            <input type="number" className="w-full border-2 border-white rounded-xl p-3 font-black text-sm" value={tempManual.price || ''} onChange={e=>setTempManual({...tempManual, price: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qty</label>
                            <input type="number" className="w-full border-2 border-white rounded-xl p-3 font-bold text-sm" value={tempManual.qty} onChange={e=>setTempManual({...tempManual, qty: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST %</label>
                            <select className="w-full border-2 border-white rounded-xl p-3 font-bold text-sm" value={tempManual.gst} onChange={e=>setTempManual({...tempManual, gst: Number(e.target.value)})}>
                                <option value="0">0% (Exempt)</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleAddLine} className="w-full bg-pink-600 text-white p-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg"><Plus size={18}/> Add to Bill</button>
                        </div>
                    </div>
                </div>

                <div className="border-2 border-gray-50 rounded-[2rem] overflow-hidden mb-10">
                    <table className="w-full text-left text-xs font-bold">
                        <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest">
                            <tr><th className="p-5">Device Detail</th><th className="p-5">HSN</th><th className="p-5 text-center">Qty</th><th className="p-5 text-right">Amount</th><th className="p-5"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 uppercase">
                            {manualItems.map(item => (
                                <tr key={item.hearingAidId} className="hover:bg-gray-50">
                                    <td className="p-5"><p className="font-black text-gray-800">{item.brand} {item.model}</p><p className="text-[9px] text-pink-600 font-mono">S/N: {item.serialNumber}</p></td>
                                    <td className="p-5 font-mono text-gray-400">{item.hsnCode}</td>
                                    <td className="p-5 text-center">{item.qty}</td>
                                    <td className="p-5 text-right font-black">₹{item.totalAmount.toLocaleString()}</td>
                                    <td className="p-5 text-center"><button onClick={()=>setManualItems(manualItems.filter(i=>i.hearingAidId!==item.hearingAidId))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Invoice Date</label><input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl font-bold shadow-sm" /></div>
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Adjustment (Disc)</label><input type="number" value={totalAdjustment || ''} onChange={e => setTotalAdjustment(Number(e.target.value))} className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xl text-pink-600 shadow-sm" /></div>
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Payment Mode</label><select className="w-full border-2 border-white bg-white p-3 rounded-xl font-black shadow-sm" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as any)}><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Account Transfer">Bank</option></select></div>
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Warranty</label><input className="w-full border-2 border-white bg-white p-3 rounded-xl font-bold shadow-sm" value={warranty} onChange={e=>setWarranty(e.target.value)} /></div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-gray-50 p-8 rounded-3xl border-2 border-pink-100">
                    <div><p className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] mb-1">Total Demo Value</p><p className="text-4xl font-black text-gray-900 tracking-tighter">₹{finalTotal.toLocaleString()}</p></div>
                    <button onClick={() => setStep('review')} disabled={manualItems.length === 0} className="bg-pink-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all text-xs disabled:opacity-50">Generate Preview &rarr;</button>
                </div>
            </div>
        )}

        {step === 'review' && (
            <div className="flex flex-col items-center bg-gray-200/50 p-4 sm:p-10 min-h-screen print:bg-white print:p-0 print:block">
                <div className="bg-white p-6 rounded-3xl shadow-xl mb-8 flex flex-wrap items-center gap-8 border border-gray-100 print:hidden w-full max-w-[900px]">
                    <div className="flex items-center gap-3"><Settings2 size={18} className="text-pink-600"/><h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Document Settings</h4></div>
                    <div className="flex-1 flex justify-end gap-3">
                        <button onClick={() => setStep('product')} className="bg-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-gray-100">Modify</button>
                        <button onClick={handleSaveInvoice} className="bg-pink-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-pink-700 transition flex items-center gap-2"><Save size={16}/> Archive & Save</button>
                        <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition flex items-center gap-2"><Printer size={16}/> Print Bill</button>
                    </div>
                </div>

                <div id="invoice-printable-area" className="bg-white shadow-2xl relative overflow-hidden mx-auto w-full max-w-[900px] p-[15mm] flex flex-col print:p-[5mm] print:shadow-none min-h-[297mm]">
                    {/* Header same as Patient Billing */}
                    <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-6">
                        <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
                        <div className="text-right flex flex-col items-end">
                            <div className="bg-[#3159a6] text-white px-6 py-2 mb-3 rounded-lg"><h2 className="text-lg font-black uppercase tracking-widest text-center">Tax Invoice</h2></div>
                            <p className="text-sm font-black text-slate-900 uppercase"># DEMO-{Date.now().toString().slice(-6)}</p>
                            <p className="text-[11px] font-black text-slate-700 uppercase mt-1 tracking-widest">DATE: {new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Client Details</h4>
                            <p className="font-black text-xl text-slate-900 uppercase tracking-tight mb-1">{patient.name}</p>
                            <p className="font-bold text-slate-900 text-sm mb-2">{patient.phone}</p>
                            <p className="text-xs text-slate-800 uppercase font-semibold leading-relaxed italic">"{patient.address || 'Address provided on request'}"</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex flex-col justify-between">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Billing Info</h4>
                                <p className="font-black text-[12px] text-slate-900 uppercase tracking-tight mb-1">{COMPANY_NAME}</p>
                                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight leading-tight">{COMPANY_ADDRESS}</p>
                                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight mt-2">GSTIN: {CLINIC_GSTIN}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <table className="w-full border-collapse border-4 border-slate-900 text-[12px]">
                            <thead className="bg-[#3159a6] text-white uppercase font-black tracking-tight">
                                <tr>
                                    <th className="p-3 text-left border-r-2 border-white/20">Description</th>
                                    <th className="p-3 text-center border-r-2 border-white/20">HSN</th>
                                    <th className="p-3 text-center border-r-2 border-white/20">Qty</th>
                                    <th className="p-3 text-right border-r-2 border-white/20">Rate</th>
                                    <th className="p-3 text-center border-r-2 border-white/20">GST %</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-slate-900">
                                {manualItems.map(item => (
                                    <tr key={item.hearingAidId} className="border-b-2 border-slate-400 last:border-b-4 last:border-slate-900">
                                        <td className="p-2 border-r-2 border-slate-900">
                                            <p className="font-black uppercase text-[12px]">{item.brand} {item.model}</p>
                                            <p className="text-[10px] text-[#3159a6] font-black uppercase tracking-[0.2em] mt-1">S/N: {item.serialNumber}</p>
                                        </td>
                                        <td className="p-2 text-center border-r-2 border-slate-900 font-mono text-[10px]">{item.hsnCode}</td>
                                        <td className="p-2 text-center border-r-2 border-slate-900">{item.qty}</td>
                                        <td className="p-2 text-right border-r-2 border-slate-900">₹{item.price.toLocaleString()}</td>
                                        <td className="p-2 text-center border-r-2 border-slate-900">{item.gstRate}%</td>
                                        <td className="p-2 text-right font-black bg-slate-50/50">₹{item.totalAmount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6 items-start">
                        <div className="space-y-4">
                           <div className="bg-blue-50/50 p-4 border-2 border-dashed border-blue-200 rounded-2xl">
                               <h4 className="text-[10px] font-black uppercase text-[#3159a6] mb-2 border-b border-blue-100 pb-1">Summary Remarks:</h4>
                               <p className="text-xs text-slate-800 italic leading-relaxed font-semibold uppercase">"{invoiceNotes || 'Standard reimbursement invoice copy.'}"</p>
                           </div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                               <p>Warranty: {warranty}</p>
                               <p className="mt-1">Mode: {paymentMethod} (Full Settlement)</p>
                           </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border-4 border-white shadow-xl font-bold text-slate-900">
                            <div className="flex justify-between text-[11px] uppercase text-slate-600 mb-1"><span>Gross Subtotal</span><span>₹{lineSubtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[11px] uppercase text-slate-600 mb-1"><span>Total GST</span><span>₹{totalTax.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[11px] uppercase text-red-600 mb-1"><span>Adjustment</span><span>-₹{totalAdjustment.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[11px] uppercase mb-3 text-green-600"><span>Round Off</span><span>{roundOff >= 0 ? '+' : ''}{roundOff.toFixed(2)}</span></div>
                            <div className="h-0.5 bg-slate-900 mb-3"></div>
                            <div className="flex justify-between items-center text-slate-900">
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Net Payable</span>
                                <span className="text-4xl font-black tracking-tighter text-[#3159a6]">₹{finalTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#3159a6] text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-10 text-center">Grand Total: {numberToWords(finalTotal)}</div>

                    <div className="mt-auto flex justify-between items-end border-t-2 border-slate-100 pt-10">
                        <div className="w-[60%] text-[9px] text-slate-800 font-bold space-y-1.5 uppercase leading-tight tracking-tight">
                            <p className="font-black text-[11px] uppercase border-b-2 border-slate-900 inline-block mb-2">Terms & Validity</p>
                            <p>1. This invoice is generated specifically for reimbursement claims.</p>
                            <p>2. Hearing aids are classified under HSN 9021 and are GST exempted.</p>
                            <p>3. Fitting services provided under clinical observation.</p>
                        </div>
                        <div className="text-center w-64">
                            {signature ? <img src={signature} className="h-20 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-full border-b-2 border-dashed border-slate-200 mb-2"></div>}
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-t-2 border-slate-900 pt-2">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};