import React, { useState } from 'react';
import { HearingAid, Patient, Quotation, InvoiceItem, UserRole } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, getFinancialYear } from '../constants';
import { FileQuestion, Printer, Save, Plus, ArrowLeft, Search, CheckCircle, Trash2, Sparkles, ShieldCheck, Edit } from 'lucide-react';

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
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '' });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL/QT/${fy}/`;
    const sameFyQuotations = quotations.filter(q => q.id.startsWith(prefix));
    if (sameFyQuotations.length === 0) return `${prefix}001`;
    const numbers = sameFyQuotations.map(q => parseInt(q.id.split('/').pop() || '0', 10));
    const nextNo = Math.max(...numbers) + 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
  };

  const resetForm = () => { setStep('patient'); setPatient({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '' }); setSelectedItemIds([]); setDiscountValue(0); setWarranty('2 Years Standard Warranty'); setEditingId(null); setPatientSearchTerm(''); };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleSelectPatient = (p: Patient) => { setPatient(p); setPatientSearchTerm(''); };

  const handleSaveQuotation = () => {
    const finalId = editingId || generateNextId();
    const subtotal = inventory.filter(i => selectedItemIds.includes(i.id)).reduce((s,i)=>s+i.price, 0);
    const quotationData: Quotation = { id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: selectedItemIds.map(id => { const item = inventory.find(i=>i.id===id)!; return { hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, price: item.price, gstRate: 0, taxableValue: item.price, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: item.price }; }), subtotal, discountType: 'flat', discountValue, totalTaxableValue: subtotal - discountValue, totalTax: 0, finalTotal: subtotal - discountValue, date: new Date().toISOString().split('T')[0], warranty, patientDetails: patient, status: 'Draft' };
    if (editingId) onUpdateQuotation(quotationData); else onCreateQuotation(quotationData);
    setViewMode('list');
  };

  if (viewMode === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileQuestion className="text-primary" /> Quotations</h2><button onClick={handleStartNew} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow transition"><Plus size={20} /> Create Quotation</button></div>
            <div className="bg-white rounded-lg shadow overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase"><tr><th className="p-4">Quotation ID</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y text-sm">
                        {quotations.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-teal-700">{q.id}</td>
                                <td className="p-4 text-gray-500">{q.date}</td>
                                <td className="p-4 font-medium">{q.patientName}</td>
                                <td className="p-4 text-right font-bold">₹{q.finalTotal.toLocaleString()}</td>
                                <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${q.status === 'Converted' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>{q.status}</span></td>
                                <td className="p-4 flex justify-center gap-2"><button onClick={() => { setEditingId(q.id); setPatient(q.patientDetails!); setSelectedItemIds(q.items.map(i=>i.hearingAidId)); setDiscountValue(q.discountValue); setStep('review'); setViewMode('edit'); }} className="p-1 text-gray-500 hover:text-teal-600"><Edit size={18}/></button></td>
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
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Quotation</h2></div>
            <div className="flex gap-2">{['patient', 'product', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-4 py-1.5 rounded-full text-xs font-bold ${step === s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{idx+1}. {s.toUpperCase()}</button>))}</div>
        </div>
        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded shadow-2xl p-12 border relative overflow-hidden animate-fade-in">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                    <div className="flex gap-6">
                        <div className="h-24 w-24 flex items-center justify-center"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 uppercase leading-none">{COMPANY_NAME}</h1>
                            <p className="text-xs text-gray-500 font-bold mt-2 tracking-tight italic">{COMPANY_TAGLINE}</p>
                            <p className="text-[10px] text-gray-500 mt-3 leading-relaxed max-w-sm">{COMPANY_ADDRESS}</p>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Ph: {COMPANY_PHONES} | Email: {COMPANY_EMAIL}</p>
                        </div>
                    </div>
                    <div className="text-right"><div className="border-4 border-gray-800 px-6 py-1 inline-block mb-3"><h2 className="text-xl font-black uppercase tracking-widest">Quotation</h2></div><p className="text-sm font-black text-gray-700"># {editingId || generateNextId()}</p><p className="text-xs font-bold text-gray-400">Date: {new Date().toLocaleDateString('en-IN')}</p></div>
                </div>
                <div className="mb-10 text-sm"><div className="bg-gray-50 p-4 rounded-xl border w-64"><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b">Attention:</h4><p className="font-black text-lg text-gray-900">{patient.name}</p><p className="font-bold text-gray-600">{patient.phone}</p></div></div>
                <table className="w-full border-collapse border border-gray-300 text-sm mb-10 shadow-sm">
                    <thead className="bg-gray-800 text-white uppercase text-[10px] font-black tracking-widest"><tr><th className="p-4 text-left">Proposed Device Description</th><th className="p-4 text-right">Estimate Price</th></tr></thead>
                    <tbody>{selectedItemIds.map(id => { const item = inventory.find(i=>i.id===id)!; return (<tr key={id} className="border-b border-gray-200"><td className="p-4"><p className="font-black text-gray-800">{item.brand} {item.model}</p></td><td className="p-4 text-right font-black text-gray-900">₹{item.price.toLocaleString()}</td></tr>); })}</tbody>
                </table>
                <div className="flex justify-end mb-10">
                    <div className="w-1/2 space-y-2 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="flex justify-between items-center text-teal-900"><span className="text-sm font-black uppercase tracking-widest">Estimated Total</span><span className="text-3xl font-black">₹{(inventory.filter(i=>selectedItemIds.includes(i.id)).reduce((s,i)=>s+i.price,0) - discountValue).toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="flex justify-between items-end mt-20">
                    <div className="w-3/4"><p className="font-black text-[10px] uppercase border-b-2 border-gray-800 inline-block mb-3 tracking-widest">Standard Terms</p>
                        <div className="text-[8.5px] text-gray-500 font-bold space-y-1 leading-tight uppercase">
                            <p>1. This is a tentative estimate and valid for 15 days.</p>
                            <p>2. Hearing aids are classification HSN 9021 40 90 (GST Exempt).</p>
                            <p>3. Subject to Kolkata Jurisdiction.</p>
                        </div>
                    </div>
                    <div className="text-center">{signature ? <img src={signature} className="h-16 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-40 border-b-2 border-dashed border-gray-300 mb-2"></div>}<p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p></div>
                </div>
                <div className="mt-12 flex gap-4 print:hidden"><button onClick={() => setStep('product')} className="flex-1 py-4 border-2 border-gray-800 rounded-xl font-black uppercase tracking-widest hover:bg-gray-100 text-xs">Back</button><button onClick={handleSaveQuotation} className="flex-[2] bg-primary text-white py-4 px-12 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-teal-800 flex items-center justify-center gap-3 text-xs"> <Save size={18}/> Save Quotation</button></div>
            </div>
        )}
    </div>
  );
};
