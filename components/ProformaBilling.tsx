import React, { useState, useMemo, useEffect } from 'react';
import { Patient, Invoice, InvoiceItem, PaymentRecord, UserRole, BRANDS } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, STAFF_NAMES, getFinancialYear, COMPANY_PAN } from '../constants';
import { FileText, Printer, Save, Eye, Plus, ArrowLeft, Search, Trash2, X, IndianRupee, Edit, Wrench, PackagePlus, CheckCircle2, Settings2, Download, ShieldCheck, RefreshCw } from 'lucide-react';

interface ProformaBillingProps {
  invoices: Invoice[];
  patients: Patient[];
  onCreateInvoice: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  onConvertToTaxInvoice: (invoice: Invoice) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
  backHandlerRef?: React.MutableRefObject<(() => boolean) | null>;
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

export const ProformaBilling: React.FC<ProformaBillingProps> = ({ invoices = [], patients, onCreateInvoice, onDelete, onConvertToTaxInvoice, logo, signature, userRole, backHandlerRef }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [gstMode, setGstMode] = useState<boolean>(true);

  useEffect(() => {
    if (!backHandlerRef) return;
    const handler = () => {
      if (viewMode !== 'list') {
        setViewMode('list');
        return true;
      }
      return false;
    };
    backHandlerRef.current = handler;
    return () => {
      if (backHandlerRef.current === handler) {
        backHandlerRef.current = null;
      }
    };
  }, [viewMode, backHandlerRef]);

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
    const fy = getFinancialYear();
    const prefix = `BRRPL-PI-${fy}-`;
    const sameFyInvoices = invoices.filter(inv => inv.id.startsWith(prefix));
    if (sameFyInvoices.length === 0) return `${prefix}001`;
    const numbers = sameFyInvoices
      .map(inv => parseInt(inv.id.split('-').pop() || '', 10))
      .filter(n => !isNaN(n));
    const nextNo = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
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
    const gstRate = tempManual.gst;
    const taxableValue = tempManual.price * qty;
    const totalTax = taxableValue * (gstRate / 100);
    const isInterState = patient.state && patient.state !== 'West Bengal';

    const newItem: InvoiceItem = {
        hearingAidId: `PI-${Date.now()}`,
        brand: tempManual.brand,
        model: tempManual.model,
        serialNumber: tempManual.serial || 'NOT AVAILABLE (PROFORMA)',
        price: tempManual.price,
        qty: qty,
        hsnCode: tempManual.hsn,
        gstRate: gstRate,
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

  const isInterState = patient.state && patient.state !== 'West Bengal';

  const processedItems = useMemo(() => {
    return manualItems.map(item => {
      const actualGst = gstMode ? item.gstRate : 0;
      const totalTax = item.taxableValue * (actualGst / 100);
      return {
        ...item,
        gstRate: actualGst,
        cgstAmount: isInterState ? 0 : totalTax / 2,
        sgstAmount: isInterState ? 0 : totalTax / 2,
        igstAmount: isInterState ? totalTax : 0,
        totalAmount: item.taxableValue + totalTax
      };
    });
  }, [manualItems, gstMode, isInterState]);

  const lineSubtotal = processedItems.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalTax = processedItems.reduce((sum, item) => sum + (item.cgstAmount + item.sgstAmount + item.igstAmount), 0);
  const finalTotal = Math.round(Math.max(0, (lineSubtotal + totalTax) - totalAdjustment));
  const roundOff = finalTotal - ((lineSubtotal + totalTax) - totalAdjustment);

  const gstSummary = React.useMemo(() => {
    const summary: Record<number, { taxable: number, cgst: number, sgst: number, igst: number }> = {};
    processedItems.forEach(item => {
      const rate = item.gstRate;
      if (!summary[rate]) summary[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      summary[rate].taxable += item.taxableValue;
      summary[rate].cgst += item.cgstAmount;
      summary[rate].sgst += item.sgstAmount;
      summary[rate].igst += item.igstAmount;
    });
    return summary;
  }, [processedItems]);

  const handleSaveInvoice = () => {
    const isEdit = viewMode === 'edit';
    const invoiceId = isEdit ? invoices.find(i => i.date === invoiceDate)?.id || generateNextId() : generateNextId();
    
    const invData: Invoice = { 
      id: invoiceId, patientId: patient.id || `P-PI`, patientName: patient.name, items: processedItems, 
      subtotal: lineSubtotal, discountType: 'flat', discountValue: totalAdjustment, totalDiscount: totalAdjustment, 
      placeOfSupply: isInterState ? 'Inter-State' : 'Intra-State', totalTaxableValue: lineSubtotal, 
      totalCGST: isInterState ? 0 : totalTax / 2, totalSGST: isInterState ? 0 : totalTax / 2, totalIGST: isInterState ? totalTax : 0, totalTax: totalTax, 
      finalTotal: finalTotal, date: invoiceDate, warranty, entryBy: entryBy, patientDetails: patient, notes: invoiceNotes,
      payments: [{ id: 'P1', amount: finalTotal, method: paymentMethod, date: invoiceDate }], balanceDue: 0, paymentStatus: 'Paid' 
    };
    onCreateInvoice(invData); 
    setViewMode('list');
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || p.phone.includes(patientSearchTerm));

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.items && inv.items.some(item => item.model.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const displayYearHeader = () => {
     return getFinancialYear();
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2"><FileText className="text-blue-600" /> Proforma Invoice Hub</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Generate draft and pre-delivery commercial quotes</p>
                </div>
                <button onClick={handleStartNew} className="bg-[#3159a6] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#254687] transition flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95 duration-100">
                    <Plus size={20} /> New Proforma Invoice
                </button>
           </div>

           <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
               <div className="p-5 border-b flex items-center gap-3 bg-gray-50/50">
                   <Search className="text-gray-400" size={18} />
                   <input type="text" placeholder="Search proforma bills..." className="flex-1 outline-none text-sm font-medium bg-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-900 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b">
                           <tr>
                               <th className="p-5">Proforma ID</th>
                               <th className="p-5">Date</th>
                               <th className="p-5">Patient</th>
                               <th className="p-5 text-right">Total Amount</th>
                               <th className="p-5 text-center">Actions</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y text-sm">
                           {filteredInvoices.length === 0 ? (
                               <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No proforma records found</td></tr>
                           ) : filteredInvoices.map(inv => (
                               <tr key={inv.id} className="hover:bg-blue-50/20 transition">
                                   <td className="p-5 font-black text-[#3159a6] uppercase">
                                       <div>{inv.id}</div>
                                       {inv.entryBy && (
                                           <div className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-wider normal-case">
                                               By: {inv.entryBy}
                                           </div>
                                       )}
                                   </td>
                                   <td className="p-5 font-bold text-gray-500">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                                   <td className="p-5 font-black text-gray-800 uppercase">{inv.patientName}</td>
                                   <td className="p-5 text-right font-black text-lg">₹{inv.finalTotal.toLocaleString()}</td>
                                   <td className="p-5 text-center">
                                       <div className="flex justify-center gap-2">
                                           <button 
                                               onClick={() => { 
                                                   if (window.confirm(`Are you sure you want to convert Proforma Invoice ${inv.id} to a Patient Tax Invoice?`)) {
                                                       onConvertToTaxInvoice(inv);
                                                   }
                                               }} 
                                               className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 font-bold text-xs" 
                                               title="Convert to standard Tax Invoice"
                                           >
                                               <RefreshCw size={12} />
                                               <span>Convert</span>
                                           </button>
                                           <button onClick={() => { setPatient(inv.patientDetails!); setManualItems(inv.items); setInvoiceDate(inv.date); setInvoiceNotes(inv.notes || ''); setTotalAdjustment(inv.discountValue); setStep('review'); setViewMode('edit'); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Print/View"><Printer size={18}/></button>
                                           {userRole === 'admin' && onDelete && (
                                               <button 
                                                   onClick={() => { 
                                                       if (window.confirm(`Are you sure you want to delete Proforma Invoice "${inv.id}"? This action has been backed up in the database.`)) {
                                                           onDelete(inv.id);
                                                       }
                                                   }} 
                                                   className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition" 
                                                   title="Permanently Delete Proforma Invoice"
                                               >
                                                   <Trash2 size={18}/>
                                               </button>
                                            )}
                                       </div>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 rounded-full text-gray-400 shadow-sm transition hover:text-slate-900 hover:border-slate-200">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Proforma Invoice Architect</h2>
        </div>

        {step !== 'review' && (
            <div className="flex justify-center gap-4 max-w-xl mx-auto border-4 border-white bg-gray-200 p-2 rounded-[2.5rem] shadow-inner mb-6">
                <button onClick={() => setStep('patient')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-[2rem] transition-all-300 ${step === 'patient' ? 'bg-white text-slate-800 shadow-lg' : 'text-slate-500'}`}>1. Identity</button>
                <button onClick={() => { if (patient.name) setStep('product'); }} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-[2rem] transition-all-300 ${step === 'product' ? 'bg-white text-slate-800 shadow-lg' : 'text-slate-500 opacity-60'}`} disabled={!patient.name}>2. Parameters & Items</button>
            </div>
        )}

        {step === 'patient' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-[3rem] shadow-xl border my-10 space-y-6">
                <div className="flex items-center gap-3 border-b pb-4 mb-4"><Search className="text-[#3159a6]"/><h3 className="text-base font-black text-gray-800 uppercase tracking-tight">Access Clinical Registry</h3></div>
                
                <div className="relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Search Patient Name or Mobile</label>
                    <input type="text" placeholder="Type name or phone number..." className="w-full pl-6 pr-4 py-4 border-2 border-slate-100 rounded-2xl outline-none font-bold text-gray-700 bg-slate-50 focus:bg-white focus:border-[#3159a6] transition" value={patientSearchTerm} onChange={e => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} onFocus={() => setShowPatientResults(true)} />
                    
                    {showPatientResults && patientSearchTerm && (
                        <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl max-h-64 overflow-y-auto divide-y">
                            {filteredPatients.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 italic font-medium">No patients found in standard clinical records.</div>
                            ) : (
                                filteredPatients.map(p => (
                                    <div key={p.id} className="p-4 hover:bg-slate-50 cursor-pointer transition flex justify-between items-center" onClick={() => handleSelectPatient(p)}>
                                        <div><p className="font-black text-gray-800 uppercase tracking-tight">{p.name}</p><p className="text-xs text-gray-400 font-bold leading-none mt-1">ID: {p.id.slice(-6)} | Phone: {p.phone}</p></div>
                                        <Plus className="text-blue-500" size={16} />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Quotation Target</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[9px] font-black uppercase text-slate-400">FullName</label><input type="text" className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-sm" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} placeholder="Direct Customer Name" /></div>
                        <div><label className="text-[9px] font-black uppercase text-slate-400">Mobile No</label><input type="text" className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-sm" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} placeholder="9876543210" /></div>
                        <div className="col-span-2">
                             <label className="text-[9px] font-black uppercase text-slate-400">Billing Address</label>
                             <textarea rows={2} className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-sm" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} placeholder="Full address details..." />
                        </div>
                        <div><label className="text-[9px] font-black uppercase text-slate-400">State Country</label><input type="text" className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-sm" value={patient.state || 'West Bengal'} onChange={e => setPatient({...patient, state: e.target.value})} /></div>
                        <div><label className="text-[9px] font-black uppercase text-slate-400">City District</label><input type="text" className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-sm" value={patient.district || 'Kolkata'} onChange={e => setPatient({...patient, district: e.target.value})} /></div>
                        <div><label className="text-[9px] font-black uppercase text-slate-400">Refer Doctor</label><input type="text" className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-sm" value={patient.referDoctor || ''} onChange={e => setPatient({...patient, referDoctor: e.target.value})} placeholder="Self Inquiry" /></div>
                        <div><label className="text-[9px] font-black uppercase text-slate-400">Consultant</label><input type="text" className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-sm" value={patient.audiologist || ''} onChange={e => setPatient({...patient, audiologist: e.target.value})} placeholder="Duty Audiologist" /></div>
                    </div>
                </div>

                <div className="flex justify-end p-2">
                    <button onClick={() => { if (patient.name) setStep('product'); }} className="bg-[#3159a6] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#254687] transition shadow-lg shadow-blue-900/10 active:scale-95 duration-100" disabled={!patient.name}>Continue to parameters</button>
                </div>
            </div>
        )}

        {step === 'product' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start my-8">
                <div className="bg-white p-6 rounded-[2rem] border shadow-xl space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3 mb-2"><PackagePlus className="text-[#3159a6]"/><h3 className="text-xs font-black uppercase tracking-widest text-[#3159a6]">Add Quotation Items</h3></div>
                    
                    <div className="space-y-4 font-semibold text-slate-800 text-sm">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">GST Mode</span>
                            <button onClick={() => setGstMode(!gstMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${gstMode ? 'bg-[#3159a6]' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gstMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-slate-400">Equipment Brand</label>
                            <select className="w-full p-2.5 border rounded-xl bg-white" value={tempManual.brand} onChange={e => setTempManual({ ...tempManual, brand: e.target.value })}>
                                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="text-[9px] font-black uppercase text-slate-400">Equipment model & specifications or Details</label>
                             <input type="text" placeholder="Signia Active Pro / Phonak Paradise" className="w-full p-2.5 border rounded-xl" value={tempManual.model} onChange={e => setTempManual({ ...tempManual, model: e.target.value })} />
                        </div>
                        <div>
                             <label className="text-[9px] font-black uppercase text-slate-400">Assigned Serial Number (Optional)</label>
                             <input type="text" placeholder="PROFORMA / TRIAL / S-12345" className="w-full p-2.5 border rounded-xl placeholder:italic text-xs font-mono font-black text-gray-700" value={tempManual.serial} onChange={e => setTempManual({ ...tempManual, serial: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[9px] font-black uppercase text-slate-400">HSN Code</label><input type="text" className="w-full p-2.5 border rounded-xl text-center font-mono" value={tempManual.hsn} onChange={e => setTempManual({ ...tempManual, hsn: e.target.value })} /></div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400">GST rate %</label>
                                <select disabled={!gstMode} className="w-full p-2.5 border rounded-xl bg-white disabled:opacity-50 font-mono text-center" value={gstMode ? tempManual.gst : 0} onChange={e => setTempManual({ ...tempManual, gst: Number(e.target.value) })}>
                                    <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[9px] font-black uppercase text-slate-400">Quantity</label><input type="number" className="w-full p-2.5 border rounded-xl text-center font-mono" value={tempManual.qty} onChange={e => setTempManual({ ...tempManual, qty: Number(e.target.value) })} /></div>
                            <div><label className="text-[9px] font-black uppercase text-slate-400">Rate / Price (₹)</label><input type="number" className="w-full p-2.5 border rounded-xl text-center font-mono" value={tempManual.price} onChange={e => setTempManual({ ...tempManual, price: Number(e.target.value) })} /></div>
                        </div>
                        <button onClick={handleAddLine} className="w-full py-3 bg-[#3159a6] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#254687] cursor-pointer transition">Commit Line Item</button>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-[3.25rem] border shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Parameters Summary</h3>
                            <p className="text-[10px] font-black text-slate-400 tracking-wider">FY {displayYearHeader()}</p>
                        </div>

                        {manualItems.length === 0 ? (
                            <div className="p-16 text-center border-2 border-dashed rounded-3xl border-slate-100 flex flex-col items-center justify-center text-slate-400">
                                <FileText size={48} className="mb-3 opacity-20"/>
                                <p className="font-bold italic">No items commited to proforma draft yet.</p>
                                <p className="text-xs leading-relaxed mt-2 max-w-xs text-center font-medium">Add equipment, series specifications, rates, and commit line items on the left module.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="divide-y max-h-96 overflow-y-auto pr-3">
                                    {processedItems.map((item, idx) => (
                                        <div key={item.hearingAidId} className="flex justify-between items-center py-4 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border-2 border-slate-50 mb-2 transition">
                                            <div>
                                                 <p className="font-black text-gray-800 uppercase tracking-tight text-sm">{item.brand} {item.model}</p>
                                                 <p className="text-[9px] text-[#3159a6] font-black tracking-widest mt-1 uppercase">S/N: {item.serialNumber} | HSN: {item.hsnCode}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="font-black text-slate-900">₹{item.totalAmount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Qty {item.qty} x rate ₹{item.price.toLocaleString()} {gstMode && `(${item.gstRate}% GST)`}</p>
                                                </div>
                                                <button onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))} className="p-2 bg-white hover:bg-red-50 text-red-500 border border-slate-100 rounded-xl transition shadow-sm"><X size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Adjustment Total Discount (₹)</label><input type="number" className="w-full bg-white border border-slate-100 rounded-xl p-3 font-mono font-black" value={totalAdjustment} onChange={e => setTotalAdjustment(Number(e.target.value))} /></div>
                                    <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Archived Staff Recorder</label><select className="w-full bg-white border border-slate-100 rounded-xl p-3 font-black text-xs" value={entryBy} onChange={e => setEntryBy(e.target.value)}>{STAFF_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                    <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Invoice Date stamp</label><input type="date" className="w-full bg-white border border-slate-100 rounded-xl p-3 font-bold text-xs" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
                                    <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Warranty Clause Terms</label><input type="text" className="w-full bg-white border border-slate-100 rounded-xl p-3 font-bold text-xs" value={warranty} onChange={e => setWarranty(e.target.value)} /></div>
                                    <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Archived Remarks (Notes)</label><input type="text" className="w-full bg-white border border-slate-100 rounded-xl p-3 font-bold text-xs" value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} placeholder="Terms valid for 30 days." /></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {manualItems.length > 0 && (
                        <div className="mt-8 border-t pt-6 flex justify-between items-center">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calculated Net Total</p><p className="text-3xl font-black text-[#3159a6] tracking-tighter">₹{finalTotal.toLocaleString()}</p></div>
                            <button onClick={() => setStep('review')} className="bg-[#3159a6] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#254687] shadow-lg shadow-blue-900/10 transition active:scale-95 duration-100 flex items-center gap-1">Generate Document &rarr;</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {step === 'review' && (
            <div className="animate-fade-in flex flex-col items-center py-6">
                 <div className="bg-white p-6 rounded-3xl shadow-xl mb-8 flex flex-wrap items-center gap-8 border border-gray-100 print:hidden w-full max-w-[900px]">
                    <div className="flex items-center gap-3"><Settings2 size={18} className="text-[#3159a6]"/><h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Document Settings</h4></div>
                    <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                        <span className="text-[10px] font-black uppercase text-gray-550 tracking-wider">GST Mode</span>
                        <button onClick={() => setGstMode(!gstMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${gstMode ? 'bg-[#3159a6]' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gstMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                     <div className="flex-1 flex justify-end gap-3 flex-wrap">
                         <button onClick={() => setStep('product')} className="bg-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-gray-100 hover:bg-slate-50 transition">Modify Draft</button>
                         <button 
                             onClick={() => {
                                 const invData: Invoice = { 
                                     id: viewMode === 'edit' ? invoices.find(i => i.date === invoiceDate)?.id || generateNextId() : generateNextId(), 
                                     patientId: patient.id || `P-PI`, 
                                     patientName: patient.name, 
                                     items: processedItems, 
                                     subtotal: lineSubtotal, 
                                     discountType: 'flat', 
                                     discountValue: totalAdjustment, 
                                     totalDiscount: totalAdjustment, 
                                     placeOfSupply: isInterState ? 'Inter-State' : 'Intra-State', 
                                     totalTaxableValue: lineSubtotal, 
                                     totalCGST: isInterState ? 0 : totalTax / 2, 
                                     totalSGST: isInterState ? 0 : totalTax / 2, 
                                     totalIGST: isInterState ? totalTax : 0, 
                                     totalTax: totalTax, 
                                     finalTotal: finalTotal, 
                                     date: invoiceDate, 
                                     warranty, 
                                     entryBy: entryBy, 
                                     patientDetails: patient, 
                                     notes: invoiceNotes,
                                     payments: [{ id: 'P1', amount: finalTotal, method: paymentMethod, date: invoiceDate }], 
                                     balanceDue: 0, 
                                     paymentStatus: 'Paid' 
                                 };
                                 if (window.confirm(`Are you sure you want to convert this active Proforma Invoice into a Patient Tax Invoice?`)) {
                                     onConvertToTaxInvoice(invData);
                                 }
                             }} 
                             className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition flex items-center gap-2"
                         >
                             <RefreshCw size={16}/> Convert to Tax Invoice
                         </button>
                         <button onClick={handleSaveInvoice} className="bg-[#3159a6] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#254687] transition flex items-center gap-2"><Save size={16}/> Save Proforma Invoice</button>
                         <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition flex items-center gap-2"><Printer size={16}/> Print Draft</button>
                     </div>
                 </div>

                 <div id="invoice-printable-area" className="bg-white shadow-2xl relative overflow-hidden mx-auto w-full max-w-[900px] p-[15mm] flex flex-col print:p-[5mm] print:shadow-none min-h-[297mm] border border-slate-200">
                    
                    {/* Notice headers for Proforma validation */}
                    <div className="bg-blue-50 border-2 border-dashed border-blue-200 text-blue-950 p-3 text-xs rounded-xl text-center mb-6 uppercase tracking-wider font-extrabold print:hidden leading-normal">
                         Clinical Quote: This is a **Proforma Invoice**, not a retail tax bill. You can edit this quote or trigger a conversion to actual Tax/Patient Invoice above.
                    </div>

                    <div className="hidden print:block text-slate-500 text-[10px] italic border-2 border-dashed border-slate-300 p-2.5 rounded-xl text-center mb-6 font-bold uppercase tracking-wider">
                         Proforma Invoice Notice: This is a Proforma Invoice for Sales/Service.
                    </div>

                    {/* Header exact display */}
                    <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-6">
                        <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
                        <div className="text-right flex flex-col items-end">
                            <div className="bg-blue-600 text-white px-6 py-2 mb-3 rounded-lg"><h2 className="text-lg font-black uppercase tracking-widest text-center">Proforma Invoice</h2></div>
                            <p className="text-sm font-black text-slate-900 uppercase"># {manualItems.length > 0 && invoices.length >= 0 ? (viewMode === 'edit' ? invoices.find(i => i.date === invoiceDate)?.id : generateNextId()) : 'DRAFT'}</p>
                            <p className="text-[11px] font-black text-slate-700 uppercase mt-1 tracking-widest">DATE: {new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Client Proposal Target</h4>
                            <p className="font-black text-xl text-slate-900 uppercase tracking-tight mb-1">{patient.name}</p>
                            <p className="font-bold text-slate-900 text-sm mb-2">{patient.phone}</p>
                            <p className="text-xs text-slate-800 uppercase font-semibold leading-relaxed italic">"{patient.address || 'Address provided on request'}"</p>
                            {patient.state && <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Region: {patient.district}, {patient.state}</p>}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                            <div className="space-y-3">
                                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Referring Professional</p><p className="text-xs font-black text-slate-900 uppercase">{patient.referDoctor || 'Self Inquiry'}</p></div>
                                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Consulting Audiologist</p><p className="text-xs font-black text-primary uppercase">{patient.audiologist || 'Internal Dept'}</p></div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Billing Provider</h4>
                                <p className="font-black text-[12px] text-slate-900 uppercase tracking-tight mb-1">{COMPANY_NAME}</p>
                                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight leading-tight">{COMPANY_ADDRESS}</p>
                                <div className="mt-2 space-y-0.5">
                                    <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">GSTIN: {CLINIC_GSTIN}</p>
                                    <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">PAN: {COMPANY_PAN}</p>
                                    <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">PH: {COMPANY_PHONES}</p>
                                    <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">EMAIL: {COMPANY_EMAIL}</p>
                                </div>
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
                                    {gstMode && (
                                        <>
                                            <th className="p-3 text-center border-r-2 border-white/20">GST %</th>
                                            {isInterState ? (
                                                <th className="p-3 text-right border-r-2 border-white/20">IGST</th>
                                            ) : (
                                                <th className="p-3 text-right border-r-2 border-white/20">C+S GST</th>
                                            )}
                                        </>
                                    )}
                                    <th className="p-3 text-right">Total Proposal</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-slate-900">
                                {processedItems.map(item => (
                                    <tr key={item.hearingAidId} className="border-b-2 border-slate-400 last:border-b-4 last:border-slate-900">
                                        <td className="p-2 border-r-2 border-slate-900">
                                            <p className="font-black uppercase text-[12px]">{item.brand} {item.model}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">S/N: {item.serialNumber}</p>
                                        </td>
                                        <td className="p-2 text-center border-r-2 border-slate-900 font-mono text-[10px]">{item.hsnCode}</td>
                                        <td className="p-2 text-center border-r-2 border-slate-900">{item.qty}</td>
                                        <td className="p-2 text-right border-r-2 border-slate-900">₹{item.price.toLocaleString()}</td>
                                        {gstMode && (
                                            <>
                                                <td className="p-2 text-center border-r-2 border-slate-900">{item.gstRate}%</td>
                                                <td className="p-2 text-right border-r-2 border-slate-900 text-slate-500">
                                                    {isInterState ? `₹${item.igstAmount.toFixed(2)}` : `₹${(item.cgstAmount + item.sgstAmount).toFixed(2)}`}
                                                </td>
                                            </>
                                        )}
                                        <td className="p-2 text-right font-black bg-slate-50/50">₹{item.totalAmount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6 items-start">
                        <div className="space-y-4">
                           {gstMode && (
                            <div className="mb-4">
                                <h4 className="text-[10px] font-black uppercase text-[#3159a6] mb-1 tracking-[0.2em]">GST Analysis ({isInterState ? 'Inter-State' : 'Intra-State'})</h4>
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px] text-center">
                                    <thead className="bg-slate-100 font-black text-slate-800">
                                        <tr className="border-b-2 border-slate-900">
                                            <th className="p-1.5 text-left border-r-2 border-slate-900">Rate</th>
                                            <th className="p-1.5 text-right border-r-2 border-slate-900">Taxable</th>
                                            {isInterState ? (
                                                <th className="p-1.5 text-right">IGST</th>
                                            ) : (
                                                <>
                                                    <th className="p-1.5 text-right border-r-2 border-slate-900">CGST</th>
                                                    <th className="p-1.5 text-right">SGST</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold text-slate-900 uppercase">
                                        {Object.entries(gstSummary).map(([rate, vals]: any) => (
                                            <tr key={rate} className="border-b-2 border-slate-200 last:border-b-0">
                                                <td className="p-1.5 text-left font-black bg-slate-50 border-r-2 border-slate-900">{rate}% GST</td>
                                                <td className="p-1.5 text-right border-r-2 border-slate-900">₹{vals.taxable.toFixed(2)}</td>
                                                {isInterState ? (
                                                    <td className="p-1.5 text-right font-black text-[#3159a6]">₹{vals.igst.toFixed(2)}</td>
                                                ) : (
                                                    <>
                                                        <td className="p-1.5 text-right border-r-2 border-slate-900">₹{vals.cgst.toFixed(2)}</td>
                                                        <td className="p-1.5 text-right">₹{vals.sgst.toFixed(2)}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                           )}

                           <div className="bg-amber-50/45 p-4 border-2 border-dashed border-amber-200 rounded-2xl">
                               <h4 className="text-[10px] font-black uppercase text-amber-800 mb-2 border-b border-amber-100 pb-1">Quotation Remarks / Terms:</h4>
                               <p className="text-xs text-amber-950 italic leading-relaxed font-semibold uppercase">"{invoiceNotes || 'Proforma proposal valid for 30 days.'}"</p>
                           </div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                               <p>Warranty Terms: {warranty}</p>
                               <p className="mt-1">Quote Prepared By: {entryBy}</p>
                           </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-lg font-bold text-slate-900">
                            <div className="flex justify-between text-[11px] uppercase text-slate-600 mb-1"><span>Gross Subtotal</span><span>₹{lineSubtotal.toLocaleString()}</span></div>
                            {gstMode && (
                                <div className="flex justify-between text-[11px] uppercase text-slate-600 mb-1"><span>Estimated GST</span><span>₹{totalTax.toLocaleString()}</span></div>
                            )}
                            <div className="flex justify-between text-[11px] uppercase text-red-600 mb-1"><span>Discount Allowed</span><span>-₹{totalAdjustment.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[11px] uppercase mb-3 text-green-600"><span>Round Off adjustment</span><span>{roundOff >= 0 ? '+' : ''}{roundOff.toFixed(2)}</span></div>
                            <div className="h-0.5 bg-slate-900 mb-3"></div>
                            <div className="flex justify-between items-center text-slate-900">
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Estimated Net</span>
                                <span className="text-4xl font-black tracking-tighter text-[#3159a6]">₹{finalTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#3159a6] text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-10 text-center">Grand Proposal Total: {numberToWords(finalTotal)}</div>

                    <div className="mt-auto flex justify-between items-end border-t-2 border-slate-100 pt-10">
                        <div className="w-[60%] text-[9px] text-slate-800 font-bold space-y-1.5 uppercase leading-tight tracking-tight">
                            <p className="font-black text-[11px] uppercase border-b-2 border-slate-900 inline-block mb-2">Terms & Validity</p>
                            <p>1. This is a Proforma estimate and does not constitute a Tax Invoice.</p>
                            <p>2. Our Udyam Registration Certificate No. UDYAM-WB-18-0032916 (Micro Enterprise)</p>
                            <p>3. Under the current taxation regime, all healthcare services doctors and hospitals provide are exempt from GST. These exemptions were provided vide Notifications No. 12/2017-Central Tax (Rate) and 9/2017 – Integrated Tax (R) dated 28th June 2017.</p>
                            <p>4. Hearing aids are classifiable under HSN 9021 40 90 and are exempt from GST by virtue of Sl.No 142 of Notf No 2/2017 CT(Rate) dated 28-06-2017.</p>    
                            <p>5. Proposal estimates are valid for 30 days from date of draft stamp.</p>
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
