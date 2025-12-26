
import React, { useState, useMemo } from 'react';
import { HearingAid, Patient, Quotation, InvoiceItem, UserRole } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, getFinancialYear } from '../constants';
import { FileQuestion, Printer, Save, Plus, ArrowLeft, Search, CheckCircle, Trash2, Sparkles, ShieldCheck, Edit, MessageSquare, Download, Calendar, X } from 'lucide-react';

interface QuotationsProps {
  inventory: HearingAid[];
  quotations: Quotation[];
  patients: Patient[];
  onCreateQuotation: (quotation: Quotation) => void;
  onUpdateQuotation: (quotation: Quotation) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
  onDelete: (quotationId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
}

export const Quotations: React.FC<QuotationsProps> = ({ inventory, quotations, patients, onCreateQuotation, onUpdateQuotation, onConvertToInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'review'>('patient');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearchTerm, setListSearchTerm] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '' });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [quotationNotes, setQuotationNotes] = useState<string>(''); 

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL/QT/${fy}/`;
    const sameFyQuotations = quotations.filter(q => q.id.startsWith(prefix));
    if (sameFyQuotations.length === 0) return `${prefix}001`;
    const numbers = sameFyQuotations.map(q => parseInt(q.id.split('/').pop() || '0', 10));
    const nextNo = Math.max(...numbers) + 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
  };

  const resetForm = () => { setStep('patient'); setPatient({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '' }); setSelectedItemIds([]); setDiscountValue(0); setWarranty('2 Years Standard Warranty'); setQuotationNotes(''); setEditingId(null); setPatientSearchTerm(''); setSearchTerm(''); };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleSelectPatient = (p: Patient) => { setPatient(p); setPatientSearchTerm(''); };

  const handleEditClick = (q: Quotation) => {
    setEditingId(q.id);
    setPatient(q.patientDetails || { id: q.patientId, name: q.patientName, address: '', phone: '', referDoctor: '', audiologist: '' });
    setSelectedItemIds(q.items.map(i => i.hearingAidId));
    setDiscountValue(q.discountValue);
    setQuotationNotes(q.notes || '');
    setWarranty(q.warranty || '2 Years Standard Warranty');
    setStep('review');
    setViewMode('edit');
  };

  const handlePrint = () => { window.print(); };

  const handleSaveQuotation = () => {
    const finalId = editingId || generateNextId();
    const subtotal = inventory.filter(i => selectedItemIds.includes(i.id)).reduce((s,i)=>s+i.price, 0);
    const quotationData: Quotation = { 
      id: finalId, 
      patientId: patient.id || `P-${Date.now()}`, 
      patientName: patient.name, 
      items: selectedItemIds.map(id => { 
        const item = inventory.find(i=>i.id===id)!; 
        return { 
          hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, 
          price: item.price, discount: 0, gstRate: 0, taxableValue: item.price, 
          cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: item.price 
        }; 
      }), 
      subtotal, 
      discountType: 'flat', 
      discountValue, 
      totalTaxableValue: subtotal - discountValue, 
      totalTax: 0, 
      finalTotal: subtotal - discountValue, 
      date: new Date().toISOString().split('T')[0], 
      warranty, 
      notes: quotationNotes,
      patientDetails: patient, 
      status: 'Draft' 
    };
    if (editingId) onUpdateQuotation(quotationData); else onCreateQuotation(quotationData);
    setViewMode('list');
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch = q.id.toLowerCase().includes(listSearchTerm.toLowerCase()) || 
                          q.patientName.toLowerCase().includes(listSearchTerm.toLowerCase());
      const matchesStart = !startDate || q.date >= startDate;
      const matchesEnd = !endDate || q.date <= endDate;
      return matchSearch && matchesStart && matchesEnd;
    });
  }, [quotations, listSearchTerm, startDate, endDate]);

  const exportToCSV = () => {
    const headers = ['Quotation ID', 'Date', 'Patient Name', 'Amount', 'Status', 'Items'];
    const rows = filteredQuotations.map(q => [
      q.id,
      q.date,
      `"${q.patientName}"`,
      q.finalTotal.toFixed(2),
      q.status,
      `"${q.items.map(i => `${i.brand} ${i.model}`).join('; ')}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `quotations_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewMode === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileQuestion className="text-primary" /> Quotations Ledger</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow transition uppercase text-[10px] tracking-widest"><Download size={18}/> Export CSV</button>
                    <button onClick={handleStartNew} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow transition whitespace-nowrap uppercase text-[10px] tracking-widest"><Plus size={20} /> Create Quotation</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:grid md:grid-cols-3 items-center gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Find by ID or Patient..." value={listSearchTerm} onChange={e => setListSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 col-span-2 w-full">
                    <Calendar size={16} className="text-gray-400 ml-2"/>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Date Range:</span>
                    <input type="date" className="bg-transparent text-xs font-bold outline-none" value={startDate} onChange={e=>setStartDate(e.target.value)} />
                    <span className="text-gray-300">-</span>
                    <input type="date" className="bg-transparent text-xs font-bold outline-none" value={endDate} onChange={e=>setEndDate(e.target.value)} />
                    {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-red-500 p-1"><X size={14}/></button>}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase"><tr><th className="p-4">Quotation ID</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y text-sm">
                        {filteredQuotations.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">No quotations found</td></tr>
                        ) : filteredQuotations.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-teal-700">{q.id}</td>
                                <td className="p-4 text-gray-500">{new Date(q.date).toLocaleDateString('en-IN')}</td>
                                <td className="p-4 font-medium">{q.patientName}</td>
                                <td className="p-4 text-right font-bold">₹{q.finalTotal.toLocaleString()}</td>
                                <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${q.status === 'Converted' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>{q.status}</span></td>
                                <td className="p-4 flex justify-center items-center gap-2">
                                    <button onClick={() => handleEditClick(q)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View/Edit"><Edit size={18}/></button>
                                    <button onClick={() => { handleEditClick(q); setTimeout(() => window.print(), 500); }} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Print"><Printer size={18}/></button>
                                    {userRole === 'admin' && (
                                        <button onClick={() => { if(window.confirm(`Delete quotation ${q.id}?`)) onDelete(q.id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 size={18}/></button>
                                    )}
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
    <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Quotation Builder</h2></div>
            <div className="flex gap-2">{['patient', 'product', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${step === s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{idx+1}. {s.toUpperCase()}</button>))}</div>
        </div>
        {step === 'patient' && (
            <div className="bg-white rounded-xl shadow border p-8 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-6 border-b pb-2 flex items-center gap-2">1. Patient Selection</h3>
                <div className="mb-8 relative"><label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Search Existing Patient</label><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Type Name or Phone Number..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-primary transition-all shadow-sm" value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} /></div>{patientSearchTerm && (<div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-64 overflow-y-auto"><div className="p-2">{patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(<button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-5 py-3 hover:bg-teal-50 border-b last:border-0 flex justify-between items-center transition-colors group"><div><p className="font-bold">{p.name}</p><p className="text-xs text-gray-500">{p.phone}</p></div><span className="text-teal-600 text-[10px] font-black uppercase">Select</span></button>))}</div></div>)}</div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 space-y-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Identity Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-gray-500 mb-1">PATIENT NAME *</label><input required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">PHONE NUMBER *</label><input required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div><div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">RESIDENTIAL ADDRESS</label><input className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div></div>
                </div>
                <div className="mt-8 flex justify-end"><button onClick={() => setStep('product')} disabled={!patient.name} className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-800 transition-all">Next Step: Select Product &rarr;</button></div>
            </div>
        )}
        {step === 'product' && (
            <div className="bg-white rounded-xl shadow border p-8 animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-6 border-b pb-2">2. Select Device Estimate</h3>
                <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search Devices..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
                <div className="max-h-64 overflow-y-auto border rounded-xl mb-6 shadow-inner"><table className="w-full text-left text-xs"><thead className="bg-gray-50 sticky top-0 uppercase font-bold text-gray-400"><tr><th className="p-4 w-10"></th><th className="p-4">Brand/Model</th><th className="p-4">Serial No</th><th className="p-4 text-right">Price</th></tr></thead><tbody className="divide-y">{inventory.filter(i => { const match = i.brand.toLowerCase().includes(searchTerm.toLowerCase()) || i.model.toLowerCase().includes(searchTerm.toLowerCase()); return (i.status === 'Available' || selectedItemIds.includes(i.id)) && match; }).map(item => (<tr key={item.id} className={selectedItemIds.includes(item.id) ? 'bg-teal-50' : 'hover:bg-gray-50'}><td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-teal-600" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td><td className="p-4 font-bold">{item.brand} {item.model}</td><td className="p-4 font-mono">{item.serialNumber}</td><td className="p-4 text-right font-black text-gray-900">₹{item.price.toLocaleString()}</td></tr>))}</tbody></table></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl border"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Adjustment / Global Discount (INR)</label><input type="number" value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))} className="w-full border-2 p-2 rounded-lg font-bold text-lg outline-none focus:border-teal-500" placeholder="0.00" /></div>
                        <div className="p-4 bg-gray-50 rounded-xl border"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Warranty Period</label><input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border-2 p-2 rounded-lg font-medium outline-none focus:border-teal-500" /></div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border flex flex-col">
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1"><MessageSquare size={12}/> Detailed Quotation Notes</label>
                        <textarea value={quotationNotes} onChange={e => setQuotationNotes(e.target.value)} className="w-full border-2 p-2 rounded-lg text-xs flex-1 min-h-[100px] resize-none outline-none focus:border-teal-500" placeholder="Add custom notes, pricing validity, special offers or clinical remarks..." />
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center"><div className="text-teal-900"><p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Estimated Total</p><p className="text-3xl font-black">₹{(inventory.filter(i=>selectedItemIds.includes(i.id)).reduce((s,i)=>s+i.price,0) - discountValue).toLocaleString()}</p></div><button onClick={() => setStep('review')} className="bg-primary text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-800 transition">Preview Quotation &rarr;</button></div>
            </div>
        )}
        {step === 'review' && (
            <div className="flex flex-col items-center bg-gray-100/50 p-4 sm:p-10 min-h-screen print:p-0 print:bg-white">
                <div id="invoice-printable-area" className="bg-white rounded shadow-2xl p-12 border relative overflow-hidden animate-fade-in print:p-0 print:shadow-none print:border-0 w-full max-w-[900px]">
                    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                        <div className="flex gap-6">
                            <div className="h-24 w-24 flex items-center justify-center"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                            <div className="min-h-[100px]">
                                 <h1 className="text-2xl font-black text-slate-900 uppercase leading-none tracking-tighter">{COMPANY_NAME}</h1>
                                <p className="text-[11px] text-slate-800 font-bold tracking-tight italic mt-1">{COMPANY_TAGLINE}</p>
                                <p className="text-[10px] text-slate-900 mt-2 leading-tight max-w-md font-semibold">{COMPANY_ADDRESS}</p>
                                <p className="text-[11px] text-slate-900 font-black mt-1 uppercase tracking-widest">GSTIN: {CLINIC_GSTIN}</p>
                            </div>
                        </div>
                        <div className="text-right"><div className="bg-[#3159a6] text-white px-6 py-1 inline-block mb-3 rounded-lg"><h2 className="text-xl font-black uppercase tracking-widest">Quotation</h2></div><p className="text-sm font-black text-gray-900"># {editingId || generateNextId()}</p><p className="text-xs font-bold text-gray-600">Date: {new Date().toLocaleDateString('en-IN')}</p></div>
                    </div>
                    <div className="mb-10 text-sm"><div className="bg-gray-50 p-4 rounded-xl border w-64"><h4 className="text-[10px] font-black uppercase text-gray-600 mb-2 border-b">Attention:</h4><p className="font-black text-lg text-gray-900">{patient.name}</p><p className="font-bold text-gray-800">{patient.phone}</p></div></div>
                    <table className="w-full border-collapse border border-gray-300 text-sm mb-10 shadow-sm">
                        <thead className="bg-[#3159a6] text-white uppercase text-[10px] font-black tracking-widest"><tr><th className="p-4 text-left">Proposed Device Description</th><th className="p-4 text-right">Estimate Price</th></tr></thead>
                        <tbody>{selectedItemIds.map(id => { const item = inventory.find(i=>i.id===id)!; return (<tr key={id} className="border-b border-gray-200"><td className="p-4"><p className="font-black text-gray-900 uppercase">{item.brand} {item.model}</p></td><td className="p-4 text-right font-black text-gray-900">₹{item.price.toLocaleString()}</td></tr>); })}</tbody>
                    </table>
                    
                    <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
                        <div className="flex-grow">
                            {quotationNotes && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300">
                                    <h4 className="text-[9px] font-black uppercase text-gray-600 mb-2 border-b border-slate-200 pb-1 tracking-widest">Quotation Notes / Custom Remarks:</h4>
                                    <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{quotationNotes}</p>
                                </div>
                            )}
                        </div>
                        <div className="w-full sm:w-1/2 space-y-2 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                            <div className="flex justify-between items-center text-teal-900"><span className="text-sm font-black uppercase tracking-widest">Estimated Net Total</span><span className="text-4xl font-black">₹{(inventory.filter(i=>selectedItemIds.includes(i.id)).reduce((s,i)=>s+i.price,0) - discountValue).toLocaleString()}</span></div>
                            <p className="text-[9px] text-right text-gray-600 font-bold uppercase tracking-wider">Adjustment of ₹{discountValue.toLocaleString()} applied</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mt-20">
                        <div className="w-3/4"><p className="font-black text-[10px] uppercase border-b-2 border-gray-900 inline-block mb-3 tracking-widest text-gray-900">Standard Terms</p>
                            <div className="text-[8.5px] text-gray-800 font-bold space-y-1 leading-tight uppercase">
                                <p>1. This is an estimated price based on selected model and valid for 15 days from date of issuance.</p>
                                <p>2. Hearing Aid will be delivered within 7 days of receipt of the confirmed order.</p>
                                <p>3. Cheque payment is subject to the realization.</p>
                                <p>4. Hearing aids are classified under HSN 9021 40 90 (GST Exempted).</p>
                                <p>5. Subject to jurisdiction of Courts in Kolkata, WB.</p>
                            </div>
                        </div>
                        <div className="text-center">{signature ? <img src={signature} className="h-16 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-40 border-b-2 border-dashed border-gray-300 mb-2"></div>}<p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Authorized Signatory</p></div>
                    </div>
                </div>
                
                <div className="mt-12 flex gap-4 w-full max-w-[900px] print:hidden">
                    <button onClick={() => setStep('product')} className="flex-1 py-4 border-2 border-gray-800 rounded-xl font-black uppercase tracking-widest hover:bg-gray-100 text-xs text-gray-900">Edit Details</button>
                    <button onClick={handleSaveQuotation} className="flex-[2] bg-primary text-white py-4 px-8 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-teal-800 flex items-center justify-center gap-3 text-xs transition-all active:scale-95"> <Save size={18}/> Save Quotation</button>
                    <button onClick={handlePrint} className="p-4 bg-slate-900 text-white rounded-xl shadow-xl hover:bg-black transition-all flex items-center justify-center active:scale-90" title="Print Now"><Printer size={22}/></button>
                </div>
            </div>
        )}
    </div>
  );
};
