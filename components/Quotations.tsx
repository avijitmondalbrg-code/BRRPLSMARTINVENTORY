
import React, { useState } from 'react';
import { HearingAid, Patient, Quotation, InvoiceItem, UserRole } from '../types';
import { generateInvoiceNote } from '../services/geminiService';
import { FileText, Printer, Save, Loader2, Sparkles, Download, Plus, ArrowLeft, Edit, Search, ShieldCheck, CheckCircle, FileQuestion, Trash2 } from 'lucide-react';

interface QuotationsProps {
  inventory: HearingAid[];
  quotations: Quotation[];
  patients: Patient[];
  onCreateQuotation: (quotation: Quotation) => void;
  onUpdateQuotation: (quotation: Quotation) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
  // FIX: Added onDelete prop to fix Error in file App.tsx on line 306
  onDelete: (quotationId: string) => void;
  logo: string;
  signature: string | null;
  // FIX: Added userRole prop to handle permission checks
  userRole: UserRole;
}

export const Quotations: React.FC<QuotationsProps> = ({ inventory, quotations, patients, onCreateQuotation, onUpdateQuotation, onConvertToInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'review'>('patient');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '' });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [aiNote, setAiNote] = useState<string>('');
  const [generatingNote, setGeneratingNote] = useState(false);

  const resetForm = () => { setStep('patient'); setPatient({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '' }); setSelectedItemIds([]); setDiscountValue(0); setWarranty('2 Years Standard Warranty'); setAiNote(''); setEditingId(null); setPatientSearchTerm(''); };

  const generateNextId = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `QTN-${currentYear}-`;
    const yearIds = quotations.filter(q => q.id.startsWith(prefix)).map(q => q.id);
    if (yearIds.length === 0) return `${prefix}001`;
    const maxSeq = yearIds.reduce((max, id) => { const parts = id.split('-'); const seq = parseInt(parts[parts.length - 1], 10); return !isNaN(seq) && seq > max ? seq : max; }, 0);
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleViewEdit = (quotation: Quotation) => {
    setEditingId(quotation.id);
    setPatient(quotation.patientDetails || { id: quotation.patientId, name: quotation.patientName, address: '', phone: '', referDoctor: '', audiologist: '' });
    setSelectedItemIds(quotation.items.map(i => i.hearingAidId));
    setDiscountType(quotation.discountType);
    setDiscountValue(quotation.discountValue);
    setWarranty(quotation.warranty || '2 Years Standard Warranty');
    setAiNote(quotation.notes || '');
    setViewMode('edit');
    setStep('review');
  };

  const handleSelectPatient = (p: Patient) => { setPatient(p); setPatientSearchTerm(''); setShowPatientResults(false); };

  const handleSaveQuotation = async () => {
    const finalId = editingId || generateNextId();
    const detailedItems: InvoiceItem[] = inventory.filter(i => selectedItemIds.includes(i.id)).map(item => ({
        hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, price: item.price, hsnCode: item.hsnCode, gstRate: item.gstRate || 0, taxableValue: item.price, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: item.price
    }));
    const quotationData: Quotation = { id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: detailedItems, subtotal: detailedItems.reduce((s,i)=>s+i.price,0), discountType, discountValue, totalTaxableValue: detailedItems.reduce((s,i)=>s+i.price,0), totalTax: 0, finalTotal: detailedItems.reduce((s,i)=>s+i.price,0) - (discountType === 'flat' ? discountValue : (detailedItems.reduce((s,i)=>s+i.price,0)*discountValue/100)), date: new Date().toISOString().split('T')[0], notes: aiNote, warranty, patientDetails: patient, status: 'Draft' };
    if (editingId) onUpdateQuotation(quotationData); else onCreateQuotation(quotationData);
    resetForm(); setViewMode('list');
  };

  const handleConvertClick = (quotation: Quotation) => { if (window.confirm(`Convert Quotation ${quotation.id} to Sales Invoice?`)) { onConvertToInvoice(quotation); setViewMode('list'); } };

  if (viewMode === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileQuestion className="text-primary" />Quotations & Estimates</h2><button onClick={handleStartNew} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"><Plus size={20} />Create Quotation</button></div>
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b"><tr><th className="p-4">Quotation ID</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{quotations.filter(q => q.id.toLowerCase().includes(searchTerm.toLowerCase()) || q.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map(q => (
                        <tr key={q.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 font-mono text-sm text-teal-700">{q.id}</td>
                            <td className="p-4 text-gray-600 text-sm">{q.date}</td>
                            <td className="p-4 font-medium">{q.patientName}</td>
                            <td className="p-4 font-bold text-gray-800">₹{q.finalTotal.toLocaleString('en-IN')}</td>
                            <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${q.status === 'Converted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{q.status}</span></td>
                            <td className="p-4 flex gap-2">
                                <button onClick={() => handleViewEdit(q)} className="text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition text-sm flex items-center gap-1"><Edit size={16} /> Open</button>
                                {q.status !== 'Converted' && <button onClick={() => handleConvertClick(q)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition text-sm flex items-center gap-1"><CheckCircle size={16} /> Bill</button>}
                                {userRole === 'admin' && (
                                    <button onClick={() => { if(window.confirm(`Permanently delete quotation ${q.id}?`)) onDelete(q.id); }} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition text-sm flex items-center gap-1" title="Delete"><Trash2 size={16} /></button>
                                )}
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Edit' : 'New'} Quotation</h2></div>
            <div className="flex space-x-2">
                {['patient', 'product', 'review'].map((s, idx) => (
                    <button key={s} onClick={() => setStep(s as any)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${step === s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{idx+1}. {s}</button>
                ))}
            </div>
        </div>
        {step === 'patient' && (
            <div className="bg-white rounded-lg shadow p-6 border animate-fade-in print:hidden">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700">1. Patient Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input required placeholder="Patient Name" className="w-full border p-2 rounded" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} />
                    <input required placeholder="Phone Number" className="w-full border p-2 rounded" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} />
                    <textarea placeholder="Address" className="w-full border p-2 rounded md:col-span-2" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} />
                </div>
                <div className="mt-8 flex justify-end"><button onClick={() => setStep('product')} className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-teal-800">Next &rarr;</button></div>
            </div>
        )}
        {step === 'product' && (
            <div className="bg-white rounded-lg shadow p-6 border animate-fade-in print:hidden">
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
                <div className="mt-8 flex justify-end"><button onClick={() => setStep('review')} className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-teal-800">Review &rarr;</button></div>
            </div>
        )}
        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded shadow-lg p-10 border relative overflow-hidden">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                    <div className="flex gap-4">
                        <div className="h-20 w-20 flex items-center justify-center"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                        <div><h1 className="text-xl font-bold text-gray-800 uppercase">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1><p className="text-xs text-gray-500 font-bold mt-1 italic">Bengal's Largest Hospital Based Hearing chain</p></div>
                    </div>
                    <div className="text-right"><h2 className="text-xl font-black uppercase">Quotation</h2><p className="text-sm font-bold text-gray-600 mt-1"># {editingId || generateNextId()}</p><p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-10 mb-10 text-sm">
                    <div><h4 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b w-16">For:</h4><p className="font-bold text-lg">{patient.name}</p><p className="text-gray-600">{patient.phone}</p></div>
                </div>
                <table className="w-full border-collapse border border-gray-300 text-sm mb-10">
                    <thead className="bg-gray-100 uppercase text-[10px]"><tr><th className="border border-gray-300 p-2 text-left">Description</th><th className="border border-gray-300 p-2 text-right">Amount</th></tr></thead>
                    <tbody>{inventory.filter(i=>selectedItemIds.includes(i.id)).map(item => (<tr key={item.id}><td className="border border-gray-300 p-3"><p className="font-bold">{item.brand} {item.model}</p></td><td className="border border-gray-300 p-3 text-right font-bold">₹{item.price.toLocaleString()}</td></tr>))}</tbody>
                </table>
                <div className="flex justify-between items-end mt-20"><div className="text-center font-bold uppercase text-xs">{signature ? <img src={signature} className="h-16 mb-2 mx-auto" /> : <div className="h-16 w-40 border-b border-gray-300 mb-2"></div>}<p>Authorized Signatory</p></div></div>
                <div className="mt-12 flex gap-4 print:hidden"><button onClick={handleSaveQuotation} className="flex-1 bg-primary text-white py-3 rounded font-black uppercase tracking-widest shadow-xl hover:bg-teal-800 flex items-center justify-center gap-2"><Save size={20}/> Save Quotation</button></div>
            </div>
        )}
    </div>
  );
};