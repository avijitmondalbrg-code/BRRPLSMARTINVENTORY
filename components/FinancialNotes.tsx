
import React, { useState } from 'react';
import { FinancialNote, Patient, Invoice, UserRole } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, CLINIC_GSTIN, getFinancialYear } from '../constants';
// Added CheckCircle2 and IndianRupee to imports to fix "Cannot find name" errors on lines 309 and 356
import { Search, Plus, FileMinus, FilePlus, Printer, Save, ArrowLeft, FileText, Lock, Trash2, X, Eye, Link, CheckCircle2, IndianRupee } from 'lucide-react';

interface FinancialNotesProps {
  type: 'CREDIT' | 'DEBIT';
  notes: FinancialNote[];
  patients: Patient[];
  invoices: Invoice[];
  onSave: (note: FinancialNote) => void;
  onDelete: (noteId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
}

export const FinancialNotes: React.FC<FinancialNotesProps> = ({ type, notes, patients, invoices, onSave, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [showInvoiceResults, setShowInvoiceResults] = useState(false);
  
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [viewNote, setViewNote] = useState<FinancialNote | null>(null);

  const generateNextId = () => {
    const fy = getFinancialYear();
    const typeCode = type === 'CREDIT' ? 'CN' : 'DN';
    const prefix = `BRRPL-${typeCode}-${fy}-`;
    const sameFyNotes = notes.filter(n => n.id.startsWith(prefix) && n.type === type);
    if (sameFyNotes.length === 0) return `${prefix}001`;
    const numbers = sameFyNotes.map(n => {
        const parts = n.id.split('-');
        return parseInt(parts[parts.length - 1], 10);
    }).filter(num => !isNaN(num));
    const nextNo = Math.max(...numbers, 0) + 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
  };

  const handleSelectInvoice = (inv: Invoice) => {
      setSelectedInvoice(inv);
      setInvoiceSearchTerm(inv.id);
      setShowInvoiceResults(false);
      
      // Auto-set patient from invoice
      if (inv.patientDetails) {
          setSelectedPatient(inv.patientDetails);
          setPatientSearchTerm(inv.patientDetails.name);
      } else {
          const patientObj = patients.find(p => p.id === inv.patientId);
          if (patientObj) {
              setSelectedPatient(patientObj);
              setPatientSearchTerm(patientObj.name);
          }
      }
      
      // Default amount to balance if Debit or just suggested
      if (type === 'DEBIT') setAmount(inv.balanceDue);
  };

  const handleSave = () => {
    if (!selectedPatient || amount <= 0 || !reason) { 
        alert("Please select a patient, enter an amount, and provide a reason."); 
        return; 
    }
    const newNote: FinancialNote = { 
        id: generateNextId(), 
        type, 
        date: new Date().toISOString().split('T')[0], 
        patientId: selectedPatient.id, 
        patientName: selectedPatient.name, 
        patientDetails: selectedPatient, 
        referenceInvoiceId: selectedInvoice?.id,
        amount, 
        reason 
    };
    onSave(newNote); 
    setViewMode('list');
    resetForm();
  };

  const resetForm = () => {
      setSelectedPatient(null);
      setPatientSearchTerm('');
      setSelectedInvoice(null);
      setInvoiceSearchTerm('');
      setAmount(0);
      setReason('');
  };

  const renderDocument = (note: FinancialNote) => (
      <div id="invoice-printable-area" className="bg-white rounded-[2.5rem] shadow-2xl p-16 border-4 border-white relative overflow-hidden animate-fade-in print:p-8 print:border-0 print:shadow-none">
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
                <div className={`inline-block px-8 py-2 rounded-xl mb-4 text-white font-black uppercase tracking-widest ${note.type === 'CREDIT' ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {note.type} NOTE
                </div>
                <p className="text-slate-900 font-black text-xl">#{note.id}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Date: {new Date(note.date).toLocaleDateString('en-IN')}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 border-b-2 border-slate-200 pb-1 tracking-widest">Issued To:</h4>
                <p className="font-black text-2xl text-slate-900 uppercase tracking-tight">{note.patientName}</p>
                {note.patientDetails?.phone && <p className="text-sm font-bold text-slate-600 mt-1">{note.patientDetails.phone}</p>}
                {note.referenceInvoiceId && (
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 flex items-center gap-2 text-[#3159a6] font-black uppercase text-[10px] tracking-widest">
                        <Link size={12}/> Ref Invoice: {note.referenceInvoiceId}
                    </div>
                )}
            </div>
            <div className="text-right flex flex-col justify-center items-end">
                <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 min-w-[200px]">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest text-center">Note Amount</h4>
                    <p className={`text-4xl font-black text-center tracking-tighter ${note.type === 'CREDIT' ? 'text-red-600' : 'text-blue-600'}`}>₹{note.amount.toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 mb-12 shadow-inner">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 border-b-2 border-slate-200 pb-1 tracking-widest">Adjustment Reason / Professional Remarks</h4>
            <p className="text-lg font-bold text-slate-700 leading-relaxed italic">"{note.reason}"</p>
        </div>

        <div className="flex justify-between items-end mt-20">
            <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.5em] mb-1">Clinic Authorization Node</p>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">This is a computer-generated secure clinical financial instrument.</p>
            </div>
            <div className="text-center">
                {signature ? <img src={signature} className="h-20 mb-3 mx-auto mix-blend-multiply" /> : <div className="h-16 w-56 border-b-4 border-dashed border-slate-200 mb-4"></div>}
                <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-900 border-t-4 border-slate-900 pt-3">Authorized Signatory</p>
            </div>
        </div>
      </div>
  );

  if (viewMode === 'list') {
      const filteredNotes = notes.filter(n => 
        n.type === type && (
            n.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.referenceInvoiceId?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {type === 'CREDIT' ? <FileMinus className="text-red-600" /> : <FilePlus className="text-blue-600" />} 
                        {type === 'CREDIT' ? 'Credit Notes Ledger' : 'Debit Notes Ledger'}
                      </h2>
                      <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Financial Adjustments & Returns</p>
                  </div>
                  {userRole === 'admin' && (
                    <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-[#3159a6] hover:bg-slate-800 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-2xl transition active:scale-95">
                        <Plus size={18} /> Create New {type}
                    </button>
                  )}
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <Search className="text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by ID, Patient or Ref Invoice..." 
                    className="flex-1 outline-none text-sm font-medium" 
                    value={searchTerm} 
                    onChange={e=>setSearchTerm(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 font-black border-b text-[10px] uppercase tracking-widest">
                            <tr><th className="p-5">Note ID</th><th className="p-5">Date</th><th className="p-5">Patient</th><th className="p-5">Ref. Invoice</th><th className="p-5 text-right">Amount</th><th className="p-5 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y text-sm font-medium text-slate-600">
                            {filteredNotes.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No entries found</td></tr>
                            ) : filteredNotes.map(n => (
                                <tr key={n.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-5 font-black text-slate-900 uppercase">{n.id}</td>
                                    <td className="p-5 font-bold text-slate-400">{new Date(n.date).toLocaleDateString('en-IN')}</td>
                                    <td className="p-5 font-black text-slate-800 uppercase tracking-tight">{n.patientName}</td>
                                    <td className="p-5">
                                        {n.referenceInvoiceId ? (
                                            <span className="text-[10px] font-black text-[#3159a6] bg-blue-50 px-2 py-1 rounded border border-blue-100">{n.referenceInvoiceId}</span>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 uppercase">None</span>
                                        )}
                                    </td>
                                    <td className={`p-5 text-right font-black text-lg ${type === 'CREDIT' ? 'text-red-600' : 'text-blue-600'}`}>₹{n.amount.toLocaleString('en-IN')}</td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => { setViewNote(n); setViewMode('view'); }} className="p-2 text-[#3159a6] hover:bg-blue-50 rounded-xl transition" title="View/Print"><Eye size={20}/></button>
                                            {userRole === 'admin' && (
                                                <button onClick={() => { if(window.confirm(`Delete note ${n.id}?`)) onDelete(n.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition" title="Remove"><Trash2 size={20}/></button>
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

  if (viewMode === 'view' && viewNote) {
      return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center print:hidden">
                <button onClick={() => setViewMode('list')} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest transition">
                    <ArrowLeft size={20} /> Back to Ledger
                </button>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 hover:bg-black transition-all font-black uppercase text-[10px] tracking-widest active:scale-95">
                        <Printer size={20} /> Print Document
                    </button>
                </div>
            </div>
            {renderDocument(viewNote)}
        </div>
      );
  }

  return (
      <div className="max-w-2xl mx-auto pb-10">
          <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 rounded-full text-gray-400 hover:bg-gray-100 shadow-sm transition"><ArrowLeft size={24}/></button>
              <div>
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Issue {type} Note</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Financial Adjustment Node</p>
              </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 space-y-8 animate-fade-in">
                {/* Invoice Linking Section */}
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-[#3159a6] uppercase tracking-[0.2em] ml-1">Link to Invoice (Optional)</label>
                    <div className="relative">
                        <div className="relative">
                            <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                className="w-full pl-12 pr-4 py-4 bg-blue-50/50 border-2 border-blue-50 rounded-2xl outline-none focus:border-[#3159a6] focus:bg-white transition-all font-bold text-gray-700 shadow-inner" 
                                placeholder="Search by Invoice # or Patient..." 
                                value={invoiceSearchTerm} 
                                onChange={e => { setInvoiceSearchTerm(e.target.value); setShowInvoiceResults(true); }}
                                onFocus={() => setShowInvoiceResults(true)}
                            />
                            {selectedInvoice && (
                                <button onClick={() => { setSelectedInvoice(null); setInvoiceSearchTerm(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600"><X size={18}/></button>
                            )}
                        </div>
                        {showInvoiceResults && invoiceSearchTerm && (
                            <div className="absolute z-20 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar p-2">
                                {invoices.filter(i => 
                                    i.id.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || 
                                    i.patientName.toLowerCase().includes(invoiceSearchTerm.toLowerCase())
                                ).map(inv => (
                                    <button 
                                        key={inv.id} 
                                        type="button"
                                        onClick={() => handleSelectInvoice(inv)} 
                                        className="w-full text-left p-4 hover:bg-blue-50 rounded-2xl border-b border-gray-50 last:border-0 transition flex justify-between items-center group"
                                    >
                                        <div>
                                            <p className="font-black text-slate-800 uppercase tracking-tight">{inv.id}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{inv.patientName} • {inv.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-[#3159a6]">₹{inv.finalTotal.toLocaleString()}</p>
                                            <p className="text-[9px] text-red-400 font-black uppercase">Due: ₹{inv.balanceDue}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedInvoice && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-green-600 uppercase bg-green-50 px-4 py-2 rounded-xl border border-green-100 self-start animate-fade-in">
                            <CheckCircle2 size={12}/> Successfully Linked: {selectedInvoice.id}
                        </div>
                    )}
                </div>

                <hr className="border-dashed border-gray-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Patient Selection */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Consignee Patient *</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:border-[#3159a6] outline-none transition-all font-bold text-gray-700 bg-gray-50 focus:bg-white shadow-sm" 
                                placeholder="Search by name..." 
                                value={patientSearchTerm} 
                                onChange={e => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }}
                                onFocus={() => setShowPatientResults(true)}
                                disabled={!!selectedInvoice}
                            />
                            {showPatientResults && patientSearchTerm && !selectedInvoice && (
                                <div className="absolute z-10 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar p-2">
                                    {patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(
                                        <button 
                                            key={p.id} 
                                            type="button"
                                            onClick={()=>{setSelectedPatient(p); setShowPatientResults(false); setPatientSearchTerm(p.name);}} 
                                            className="w-full text-left p-3 hover:bg-blue-50 rounded-xl border-b border-gray-50 last:border-0 font-black uppercase text-xs text-slate-700 tracking-tighter"
                                        >
                                            {p.name} <span className="text-[9px] text-gray-400 ml-2">({p.phone})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedPatient && !selectedInvoice && (
                            <div className="text-[10px] font-black text-[#3159a6] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 uppercase tracking-widest inline-block animate-fade-in">
                                Selection: {selectedPatient.name}
                            </div>
                        )}
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Adjustment Amount (INR) *</label>
                        <div className="relative">
                            <IndianRupee className={`absolute left-4 top-1/2 -translate-y-1/2 ${type === 'CREDIT' ? 'text-red-600' : 'text-blue-600'}`} size={20} />
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl font-black text-2xl outline-none focus:border-[#3159a6] bg-gray-50 focus:bg-white shadow-inner transition-all" 
                                value={amount || ''} 
                                onChange={e=>setAmount(Number(e.target.value))} 
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Professional Reason for Issuance *</label>
                    <textarea 
                        className="w-full border-2 border-gray-50 rounded-3xl p-5 outline-none focus:border-[#3159a6] bg-gray-50 focus:bg-white transition-all h-32 resize-none font-medium text-slate-700 shadow-inner" 
                        value={reason} 
                        onChange={e=>setReason(e.target.value)} 
                        placeholder="Describe why this note is being issued (e.g., Device return, Goodwill discount, Overcharge correction)..."
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-5 pt-4">
                    <button onClick={() => setViewMode('list')} className="flex-1 py-5 border-2 border-gray-100 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] text-gray-400 hover:bg-gray-50 transition active:scale-95">Cancel Entry</button>
                    <button onClick={handleSave} className="flex-[2] py-5 bg-[#3159a6] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition active:scale-95">Confirm & Issue {type} Note</button>
                </div>
          </div>
      </div>
  );
};
