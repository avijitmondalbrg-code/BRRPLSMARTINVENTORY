
import React, { useState, useMemo } from 'react';
import { HearingAid, Patient, Quotation, InvoiceItem, UserRole } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, getFinancialYear } from '../constants';
import { FileQuestion, Printer, Save, Plus, ArrowLeft, Search, CheckCircle, Trash2, Edit, MessageSquare, Download, Calendar, X, UserCheck, Stethoscope, Wrench, PackagePlus } from 'lucide-react';

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
  const [listSearchTerm, setListSearchTerm] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '', state: 'West Bengal', district: 'Kolkata' });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [manualItems, setManualItems] = useState<InvoiceItem[]>([]);
  const [tempManual, setTempManual] = useState({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>({});
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [quotationNotes, setQuotationNotes] = useState<string>(''); 
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL/QT/${fy}/`;
    const sameFyQuotations = quotations.filter(q => q.id.startsWith(prefix));
    if (sameFyQuotations.length === 0) return `${prefix}001`;
    const numbers = sameFyQuotations.map(q => parseInt(q.id.split('/').pop() || '0', 10));
    const nextNo = Math.max(...numbers) + 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
  };

  const resetForm = () => { 
    setStep('patient'); 
    setPatient({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '', state: 'West Bengal', district: 'Kolkata' }); 
    setSelectedItemIds([]); 
    setManualItems([]);
    setDiscountValue(0); 
    setGstOverrides({});
    setQuoteDate(new Date().toISOString().split('T')[0]);
    setWarranty('2 Years Standard Warranty'); 
    setQuotationNotes(''); 
    setEditingId(null); 
    setPatientSearchTerm(''); 
    setTempManual({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleSelectPatient = (p: Patient) => { 
    setPatient({ ...p, state: p.state || 'West Bengal', district: p.district || 'Kolkata' }); 
    setPatientSearchTerm(p.name); 
  };

  const handleEditClick = (q: Quotation) => {
    setEditingId(q.id);
    setPatient(q.patientDetails || { id: q.patientId, name: q.patientName, address: '', phone: '', referDoctor: '', audiologist: '', state: 'West Bengal', district: 'Kolkata' });
    
    const inventoryIds = q.items.filter(i => i.hearingAidId && !i.hearingAidId.startsWith('MAN-')).map(i => i.hearingAidId);
    const manItems = q.items.filter(i => !i.hearingAidId || i.hearingAidId.startsWith('MAN-'));
    
    setSelectedItemIds(inventoryIds);
    setManualItems(manItems);
    setDiscountValue(q.discountValue);
    setQuotationNotes(q.notes || '');
    setQuoteDate(q.date);
    setWarranty(q.warranty || '2 Years Standard Warranty');
    
    const overrides: Record<string, number> = {};
    q.items.forEach(item => {
      overrides[item.hearingAidId] = item.gstRate;
    });
    setGstOverrides(overrides);
    
    setStep('review');
    setViewMode('edit');
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
        totalAmount: 0
    };
    setManualItems([...manualItems, newItem]);
    setTempManual({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  };

  const handleRemoveManualItem = (id: string) => {
    setManualItems(manualItems.filter(i => i.hearingAidId !== id));
  };

  const isInterState = patient.state && patient.state !== 'West Bengal';
  
  const processedItems: InvoiceItem[] = useMemo(() => {
    const invItems = selectedItemIds.map(id => {
      const item = inventory.find(i => i.id === id);
      if (!item) return null;
      const gstRate = gstOverrides[id] !== undefined ? gstOverrides[id] : (item.gstRate || 0);
      const taxableValue = item.price;
      const totalTax = taxableValue * (gstRate / 100);
      
      let cgst = 0, sgst = 0, igst = 0;
      if (isInterState) igst = totalTax; else { cgst = totalTax / 2; sgst = totalTax / 2; }

      return {
        hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber,
        price: item.price, hsnCode: item.hsnCode || '90214090', gstRate, discount: 0,
        taxableValue, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: taxableValue + totalTax
      };
    }).filter(i => i !== null) as InvoiceItem[];

    const manProcessed = manualItems.map(item => {
        const totalTax = item.taxableValue * (item.gstRate / 100);
        let cgst = 0, sgst = 0, igst = 0;
        if (isInterState) igst = totalTax; else { cgst = totalTax / 2; sgst = totalTax / 2; }
        return { ...item, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: item.taxableValue + totalTax };
    });

    return [...invItems, ...manProcessed];
  }, [selectedItemIds, inventory, gstOverrides, isInterState, manualItems]);

  const subtotal = processedItems.reduce((sum, i) => sum + i.taxableValue, 0);
  const totalTax = processedItems.reduce((sum, i) => sum + (i.cgstAmount + i.sgstAmount + i.igstAmount), 0);
  const finalTotal = Math.max(0, (subtotal + totalTax) - discountValue);

  const handleSaveQuotation = () => {
    const finalId = editingId || generateNextId();
    const quotationData: Quotation = { 
      id: finalId, 
      patientId: patient.id || `P-${Date.now()}`, 
      patientName: patient.name, 
      items: processedItems, 
      subtotal, 
      discountType: 'flat', 
      discountValue, 
      totalTaxableValue: subtotal, 
      totalTax, 
      finalTotal, 
      date: quoteDate, 
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

  const sbiAccount = COMPANY_BANK_ACCOUNTS.find(b => b.name.includes('SBI')) || COMPANY_BANK_ACCOUNTS[0];

  if (viewMode === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileQuestion className="text-primary" /> Quotations Ledger</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleStartNew} className="bg-primary hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl transition whitespace-nowrap"><Plus size={16} /> New Quotation</button>
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

            <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-[#3159a6] text-white font-black border-b text-[10px] uppercase tracking-[0.2em]"><tr><th className="p-5">Quotation No</th><th className="p-5">Date</th><th className="p-5">Patient</th><th className="p-5 text-right">Estimate Total</th><th className="p-5 text-center">Status</th><th className="p-5 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y text-sm">
                        {filteredQuotations.length === 0 ? (
                            <tr><td colSpan={6} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest text-[10px]">No quotations matching filters</td></tr>
                        ) : filteredQuotations.map(q => (
                            <tr key={q.id} className="hover:bg-blue-50/30 transition">
                                <td className="p-5 font-black text-primary uppercase">{q.id}</td>
                                <td className="p-5 text-gray-500 font-bold">{new Date(q.date).toLocaleDateString('en-IN')}</td>
                                <td className="p-5 font-black text-gray-800 uppercase tracking-tight">{q.patientName}</td>
                                <td className="p-5 text-right font-black">₹{q.finalTotal.toLocaleString()}</td>
                                <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${q.status === 'Converted' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-800 border-yellow-100'}`}>{q.status}</span></td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center items-center gap-1">
                                        <button onClick={() => handleEditClick(q)} className="p-2 text-primary hover:bg-blue-50 rounded-xl transition" title="View/Edit"><Edit size={18}/></button>
                                        <button onClick={() => { handleEditClick(q); setTimeout(() => window.print(), 500); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition" title="Print"><Printer size={18}/></button>
                                        {userRole === 'admin' && (
                                            <button onClick={() => { if(window.confirm(`Delete quotation ${q.id}?`)) onDelete(q.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition" title="Delete"><Trash2 size={18}/></button>
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
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 hover:bg-gray-100 rounded-full text-gray-400 shadow-sm transition"><ArrowLeft size={24} /></button><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Quotation Architect</h2></div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl border">{['patient', 'product', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'bg-primary text-white shadow-lg' : 'bg-transparent text-gray-400'}`}>{idx+1}. {s}</button>))}</div>
        </div>
        
        {step === 'patient' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 1: Client & Clinic Metadata</h3>
                <div className="mb-10 relative">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Recall Registered Patient</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Start typing name or phone..." className="w-full pl-12 pr-4 py-5 border-2 border-gray-50 bg-gray-50/50 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all shadow-sm font-bold text-lg" value={patientSearchTerm} onFocus={() => setPatientSearchTerm('')} onChange={(e) => setPatientSearchTerm(e.target.value)} />
                  </div>
                  {patientSearchTerm && (
                    <div className="absolute z-50 left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto custom-scrollbar p-2">
                      {patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(
                        <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-6 py-4 hover:bg-blue-50 rounded-2xl border-b border-gray-50 last:border-0 flex justify-between items-center transition-all group">
                          <div><p className="font-black text-gray-800 uppercase tracking-tight">{p.name}</p><p className="text-[10px] text-gray-400 font-bold">{p.phone} • {p.address}</p></div>
                          <span className="text-primary text-[9px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-white transition-all">Select</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50/30 p-8 rounded-[2rem] border-2 border-dashed border-blue-100 space-y-8">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Clinical Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Patient Name *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-primary font-bold shadow-sm" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Active Phone *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-primary font-bold shadow-sm" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-1"><UserCheck size={12}/> Ref. Dr.</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-primary font-bold shadow-sm" value={patient.referDoctor} onChange={e => setPatient({...patient, referDoctor: e.target.value})} placeholder="Referring Doctor" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-1"><Stethoscope size={12}/> Audiologist</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-primary font-bold shadow-sm" value={patient.audiologist} onChange={e => setPatient({...patient, audiologist: e.target.value})} placeholder="Consulting Audiologist" /></div>
                      <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Full Postal Address *</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-primary font-bold shadow-sm" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} placeholder="House/Flat No, Area, City" /></div>
                    </div>
                </div>
                <div className="mt-12 flex justify-end"><button onClick={() => setStep('product')} disabled={!patient.name || !patient.address} className="bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs disabled:opacity-50">Proceed to Device Estimate &rarr;</button></div>
            </div>
        )}
        
        {step === 'product' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 2: Product & Tax Configuration</h3>
                
                <div className="max-h-80 overflow-y-auto border-2 border-gray-50 rounded-[2rem] mb-8 shadow-inner custom-scrollbar overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-primary text-white sticky top-0 uppercase font-black text-[10px] tracking-widest">
                            <tr><th className="p-5 w-14"></th><th className="p-5">Device Description</th><th className="p-5">Serial No</th><th className="p-5 text-center">GST %</th><th className="p-5 text-right">MRP (Base)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {inventory.filter(i => (i.status === 'Available' || selectedItemIds.includes(i.id))).map(item => (
                                <tr key={item.id} className={`${selectedItemIds.includes(item.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition`}>
                                    <td className="p-5 text-center"><input type="checkbox" className="h-5 w-5 rounded-lg border-2 border-gray-200 text-primary focus:ring-primary transition" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td>
                                    <td className="p-5 font-black text-gray-800 uppercase tracking-tighter">{item.brand} {item.model}</td>
                                    <td className="p-5 font-mono text-gray-400 font-bold">{item.serialNumber}</td>
                                    <td className="p-5 text-center">
                                        {selectedItemIds.includes(item.id) && (
                                            <select className="border-2 border-blue-100 rounded-xl p-1.5 font-bold text-primary bg-white outline-none" value={gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0)} onChange={(e) => setGstOverrides({...gstOverrides, [item.id]: Number(e.target.value)})}> 
                                                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="p-5 text-right font-black text-gray-900 text-lg">₹{item.price.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Service/Manual Entry Section */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">
                        <Wrench size={14}/> Manual Service / Non-Inventory Entry
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                        <div className="md:col-span-2">
                            <input className="w-full border-2 border-white rounded-xl p-3 text-sm font-bold outline-none focus:border-primary" placeholder="Service (e.g. Repair / Ear Mold)" value={tempManual.model} onChange={e=>setTempManual({...tempManual, model: e.target.value})} />
                        </div>
                        <div>
                            <input className="w-full border-2 border-white rounded-xl p-3 text-sm font-mono outline-none focus:border-primary" placeholder="HSN (902190)" value={tempManual.hsn} onChange={e=>setTempManual({...tempManual, hsn: e.target.value})} />
                        </div>
                        <div>
                            <input type="number" className="w-full border-2 border-white rounded-xl p-3 text-sm font-bold outline-none focus:border-primary" placeholder="Rate" value={tempManual.price || ''} onChange={e=>setTempManual({...tempManual, price: Number(e.target.value)})} />
                        </div>
                        <div className="flex gap-2">
                            <select className="border-2 border-white rounded-xl p-3 text-xs font-bold outline-none flex-1" value={tempManual.gst} onChange={e=>setTempManual({...tempManual, gst: Number(e.target.value)})}>
                                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                            </select>
                            <button onClick={handleAddManualItem} className="bg-primary text-white p-3 rounded-xl hover:bg-slate-800 transition shadow-lg"><PackagePlus size={20}/></button>
                        </div>
                    </div>

                    {manualItems.length > 0 && (
                        <div className="space-y-2 mt-4">
                            {manualItems.map(item => (
                                <div key={item.hearingAidId} className="flex justify-between items-center bg-white p-3 px-5 rounded-xl border border-slate-100 shadow-sm animate-fade-in">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800 uppercase">{item.model}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">HSN: {item.hsnCode} • GST: {item.gstRate}%</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-black text-primary">₹{item.price.toLocaleString()}</span>
                                        <button onClick={() => handleRemoveManualItem(item.hearingAidId)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    <div className="p-4 bg-gray-50 rounded-[2rem] border-2 border-gray-50">
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Quotation Date</label>
                        <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl font-bold outline-none shadow-sm" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-[2rem] border-2 border-gray-50">
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Special Consideration (Discount)</label>
                        <input type="number" value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))} className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xl text-primary outline-none shadow-sm" placeholder="0.00" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-[2rem] border-2 border-gray-50">
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Warranty Coverage</label>
                        <input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl font-bold outline-none shadow-sm" />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-[2rem] border-2 border-gray-50 flex flex-col">
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1 ml-1"><MessageSquare size={12}/> Custom Remarks</label>
                        <textarea value={quotationNotes} onChange={e => setQuotationNotes(e.target.value)} className="w-full border-2 border-white bg-white p-2 rounded-xl text-xs h-16 resize-none outline-none shadow-sm font-medium" placeholder="Validity details..." />
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-gray-50 p-8 rounded-3xl border-2 border-blue-50 shadow-inner">
                    <div><p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Estimated Net Total</p><p className="text-4xl font-black text-gray-900 tracking-tighter">₹{finalTotal.toLocaleString()}</p></div>
                    <button onClick={() => setStep('review')} className="bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs">Preview Professional Quote &rarr;</button>
                </div>
            </div>
        )}

        {step === 'review' && (
            <div className="flex flex-col items-center bg-gray-200/50 p-4 sm:p-10 min-h-screen print:p-0 print:bg-white">
                <div id="invoice-printable-area" className="bg-white rounded-[2.5rem] shadow-2xl p-16 border-4 border-white relative overflow-hidden animate-fade-in print:p-8 print:border-0 print:shadow-none print:rounded-none w-full max-w-[900px]">
                    <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
                        <div className="flex gap-8">
                            <div className="h-28 w-28 flex items-center justify-center bg-white rounded-3xl p-2 border-2 border-slate-50"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                            <div>
                                 <h1 className="text-3xl font-black text-slate-900 uppercase leading-none tracking-tighter">{COMPANY_NAME}</h1>
                                <p className="text-sm text-slate-600 font-bold mt-2 tracking-tight italic">{COMPANY_TAGLINE}</p>
                                <p className="text-[11px] text-slate-800 mt-4 leading-relaxed max-w-sm font-semibold">{COMPANY_ADDRESS}</p>
                                <p className="text-[11px] text-slate-900 font-black uppercase tracking-widest">Ph: {COMPANY_PHONES} | Email: {COMPANY_EMAIL}</p>
                            </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-primary text-white px-8 py-2 inline-block mb-4 rounded-xl shadow-lg">
                            <h2 className="text-lg font-black uppercase tracking-widest">Quotation</h2>
                          </div>
                          <p className="text-xl font-black text-slate-900"># {editingId || generateNextId()}</p>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Date: {new Date(quoteDate).toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10 mb-10">
                        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 border-b-2 border-slate-200 pb-1 tracking-widest">Attention Patient:</h4>
                            <p className="font-black text-2xl text-slate-900 uppercase tracking-tight mb-1">{patient.name}</p>
                            <p className="font-bold text-slate-600 text-sm mb-3">{patient.phone} • {patient.district}, {patient.state}</p>
                            <p className="text-xs text-slate-700 font-bold uppercase leading-relaxed min-h-[40px] italic">"{patient.address}"</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col justify-center">
                            <div className="space-y-4">
                                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Referring Professional</p><p className="text-xs font-black text-slate-900 uppercase">{patient.referDoctor || 'Self Inquiry'}</p></div>
                                <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Consulting Audiologist</p><p className="text-xs font-black text-primary uppercase">{patient.audiologist || 'Internal Dept'}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 overflow-hidden rounded-3xl border-4 border-slate-900">
                        <table className="w-full border-collapse text-[12px]">
                            <thead className="bg-primary text-white uppercase font-black tracking-tight">
                                <tr>
                                    <th className="p-4 text-left border-r-2 border-white/20">Description of Goods</th>
                                    <th className="p-4 text-center border-r-2 border-white/20">HSN</th>
                                    <th className="p-4 text-right border-r-2 border-white/20">Taxable Value</th>
                                    <th className="p-4 text-center border-r-2 border-white/20">GST %</th>
                                    <th className="p-4 text-right">Estimated Total</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-slate-900">
                                {processedItems.map((item, idx) => (
                                    <tr key={item.hearingAidId || idx} className="border-b-2 border-slate-400 last:border-b-0">
                                        <td className="p-4 border-r-2 border-slate-900">
                                            <p className="font-black text-slate-900 uppercase text-[13px] tracking-tight">{item.brand} {item.model}</p>
                                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">
                                                {item.serialNumber === 'N/A' ? 'SERVICE ESTIMATE' : `Estimate Ref: ${item.serialNumber}`}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center border-r-2 border-slate-900 font-mono text-[10px]">{item.hsnCode}</td>
                                        <td className="p-4 text-right border-r-2 border-slate-900 font-mono">₹{item.taxableValue.toLocaleString()}</td>
                                        <td className="p-4 text-center border-r-2 border-slate-900">{item.gstRate}%</td>
                                        <td className="p-4 text-right font-black bg-slate-50">₹{item.totalAmount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10 items-start mb-10">
                        <div className="space-y-6">
                            {quotationNotes && (
                                <div className="bg-blue-50/50 p-6 rounded-3xl border-2 border-dashed border-blue-200">
                                    <h4 className="text-[10px] font-black uppercase text-primary mb-2 border-b border-blue-100 pb-1 tracking-widest">Estimate Remarks:</h4>
                                    <p className="text-xs text-slate-800 italic leading-relaxed font-semibold uppercase">"{quotationNotes}"</p>
                                </div>
                            )}
                            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                                <h4 className="text-[10px] font-black uppercase text-primary mb-3 border-b border-slate-200 pb-1 tracking-[0.2em]">Bank Settlement Node (SBI):</h4>
                                <div className="grid grid-cols-2 text-[10px] uppercase font-black text-slate-800 gap-y-1">
                                    <p>A/C Name:</p><p className="text-right">BENGAL REHABILITATION</p>
                                    <p>SBI A/C No:</p><p className="text-right text-slate-900">{sbiAccount.accountNumber}</p>
                                    <p>IFSC Code:</p><p className="text-right text-slate-900">{sbiAccount.ifsc}</p>
                                    <p>Branch:</p><p className="text-right">{sbiAccount.branch}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none -rotate-12 translate-y-12 scale-150"></div>
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest"><span>Gross Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest"><span>Taxes ({isInterState ? 'IGST' : 'CGST+SGST'})</span><span>₹{totalTax.toLocaleString()}</span></div>
                                <div className="flex justify-between text-[10px] font-black uppercase text-red-400 tracking-widest"><span>Special Consideration</span><span>-₹{discountValue.toLocaleString()}</span></div>
                                <div className="h-0.5 bg-white/20 my-4"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Final Estimate</span>
                                    <span className="text-4xl font-black tracking-tighter">₹{Math.round(finalTotal).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mt-20">
                        <div className="w-2/3"><p className="font-black text-[11px] uppercase border-b-4 border-slate-900 inline-block mb-4 tracking-widest text-slate-900">Validity & Terms</p>
                            <div className="text-[9px] text-slate-800 font-bold space-y-2 leading-tight uppercase tracking-tight">
                                <p>1. Estimate Valid for 15 days from Date of Issue.</p>
                                <p>2. Hearing Aids are classification under HSN 9021 (GST Exempted).</p>
                                <p>3. Fitting & Follow-up services included for 6 months.</p>
                                <p>4. Advance paid is adjustable against final invoice but non-refundable.</p>
                                <p>5. Judicial Jurisdiction: Kolkata Courts only.</p>
                            </div>
                        </div>
                        <div className="text-center w-60">
                            {signature ? <img src={signature} className="h-20 mb-3 mx-auto mix-blend-multiply transition-all hover:scale-110" /> : <div className="h-16 w-full border-b-4 border-dashed border-slate-200 mb-4"></div>}
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-t-4 border-slate-900 pt-3">Authorized Signatory</p>
                        </div>
                    </div>
                    
                    <div className="mt-16 text-center opacity-20 pointer-events-none print:opacity-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.8em] text-slate-600">BENGAL REHABILITATION & RESEARCH PVT. LTD.</p>
                    </div>
                </div>
                
                <div className="mt-12 flex gap-6 w-full max-w-[900px] print:hidden">
                    <button onClick={() => setStep('product')} className="flex-1 py-5 border-4 border-slate-800 rounded-3xl font-black uppercase tracking-widest hover:bg-white text-xs transition-all active:scale-95">Edit Metadata</button>
                    <button onClick={handleSaveQuotation} className="flex-[2] bg-primary text-white py-5 px-12 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 flex items-center justify-center gap-4 text-xs transition-all active:scale-95"> <Save size={22}/> Archive Estimate</button>
                    <button onClick={() => window.print()} className="p-5 bg-slate-900 text-white rounded-3xl shadow-2xl hover:bg-black transition-all flex items-center justify-center active:scale-90" title="Download PDF"><Download size={28}/></button>
                </div>
            </div>
        )}
    </div>
  );
};
