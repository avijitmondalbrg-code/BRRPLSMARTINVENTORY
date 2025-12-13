import React, { useState } from 'react';
import { FinancialNote, Patient, Invoice, UserRole } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, CLINIC_GSTIN, getFinancialYear } from '../constants';
// FIX: Added Eye to the lucide-react import list
import { Search, Plus, FileMinus, FilePlus, Printer, Save, ArrowLeft, FileText, Lock, Trash2, X, Eye } from 'lucide-react';

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
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [viewNote, setViewNote] = useState<FinancialNote | null>(null);

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefixStr = type === 'CREDIT' ? 'CN' : 'DN';
    const prefix = `BRRPL/${prefixStr}/${fy}/`;
    const sameFyNotes = notes.filter(n => n.id.startsWith(prefix) && n.type === type);
    if (sameFyNotes.length === 0) return `${prefix}001`;
    const numbers = sameFyNotes.map(n => parseInt(n.id.split('/').pop() || '0', 10));
    const nextNo = Math.max(...numbers) + 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
  };

  const handleSave = () => {
    if (!selectedPatient || amount <= 0 || !reason) { alert("Please fill all required fields."); return; }
    const newNote: FinancialNote = { id: generateNextId(), type, date: new Date().toISOString().split('T')[0], patientId: selectedPatient.id, patientName: selectedPatient.name, patientDetails: selectedPatient, amount, reason, referenceInvoiceId: linkedInvoiceId || undefined };
    onSave(newNote); setViewMode('list');
  };

  const renderDocument = (note: FinancialNote) => (
      <div id="invoice-printable-area" className="bg-white rounded-xl shadow-2xl p-12 border relative overflow-hidden animate-fade-in">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
            <div className="flex gap-6">
                <div className="h-24 w-24 flex items-center justify-center"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                <div>
                    <h1 className="text-2xl font-black text-gray-800 uppercase leading-none">{COMPANY_NAME}</h1>
                    <p className="text-xs text-gray-500 font-bold mt-2 tracking-tight italic">{COMPANY_TAGLINE}</p>
                    <p className="text-[10px] text-gray-500 mt-3 leading-relaxed max-w-sm">{COMPANY_ADDRESS}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold">Ph: {COMPANY_PHONES} | Email: {COMPANY_EMAIL}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-black text-xl uppercase ${note.type === 'CREDIT' ? 'text-red-600' : 'text-blue-600'}`}>{note.type} NOTE</p>
                <p className="text-gray-700 font-black">#{note.id}</p>
                <p className="text-xs text-gray-400 font-bold">Date: {note.date}</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-12 mb-10 text-sm">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b">Issued To:</h4><p className="font-black text-lg text-gray-900">{note.patientName}</p></div>
            <div className="text-right flex flex-col justify-center"><div><h4 className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Amount</h4><p className={`text-3xl font-black ${note.type === 'CREDIT' ? 'text-red-600' : 'text-blue-600'}`}>₹{note.amount.toLocaleString('en-IN')}</p></div></div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl border mb-10"><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b">Reason / Description</h4><p className="font-medium text-gray-700">{note.reason}</p></div>
        <div className="flex justify-between items-end mt-20">
            <div><p className="text-[8.5px] text-gray-400 font-bold uppercase tracking-widest">This is a computer generated document.</p></div>
            <div className="text-center">{signature ? <img src={signature} className="h-16 mb-2 mx-auto" /> : <div className="h-16 w-40 border-b-2 border-dashed border-gray-300 mb-2"></div>}<p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p></div>
        </div>
      </div>
  );

  if (viewMode === 'list') {
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">{type === 'CREDIT' ? <FileMinus className="text-red-600" /> : <FilePlus className="text-blue-600" />} {type === 'CREDIT' ? 'Credit Notes' : 'Debit Notes'}</h2>{userRole === 'admin' && <button onClick={() => setViewMode('create')} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow transition"><Plus size={20} /> Create Note</button>}</div>
              <div className="bg-white rounded-lg shadow overflow-hidden border">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase"><tr><th className="p-4">Note ID</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Actions</th></tr></thead>
                      <tbody className="divide-y text-sm">{notes.filter(n => n.type === type).map(n => (<tr key={n.id} className="hover:bg-gray-50"><td className="p-4 font-bold">{n.id}</td><td className="p-4 text-gray-500">{n.date}</td><td className="p-4 font-medium">{n.patientName}</td><td className="p-4 text-right font-bold">₹{n.amount.toLocaleString()}</td><td className="p-4 flex justify-center gap-2"><button onClick={() => { setViewNote(n); setViewMode('view'); }} className="p-1 text-gray-500 hover:text-teal-600"><Eye size={18}/></button></td></tr>))}</tbody>
                  </table>
              </div>
          </div>
      );
  }

  if (viewMode === 'view' && viewNote) {
      return (<div className="max-w-4xl mx-auto space-y-6"><div className="flex justify-between items-center print:hidden"><button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-gray-600"><ArrowLeft size={20} /> Back</button><button onClick={() => window.print()} className="bg-white border p-2 rounded shadow-sm flex items-center gap-2"><Printer size={20} /> Print</button></div>{renderDocument(viewNote)}</div>);
  }

  return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow border animate-fade-in"><h2 className="text-xl font-bold mb-6">Create {type} Note</h2><div className="space-y-4">
          <div className="relative"><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Select Patient</label><input className="w-full border p-2 rounded-lg" value={patientSearchTerm} onChange={e=>{setPatientSearchTerm(e.target.value); setShowPatientResults(true);}} />{showPatientResults && patientSearchTerm && (<div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">{patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(<button key={p.id} onClick={()=>{setSelectedPatient(p); setShowPatientResults(false);}} className="w-full text-left p-2 hover:bg-teal-50 border-b text-sm font-medium">{p.name}</button>))}</div>)}</div>
          {selectedPatient && <div className="p-2 bg-teal-50 text-teal-700 rounded text-sm font-bold">Target: {selectedPatient.name}</div>}
          <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount (INR)</label><input type="number" className="w-full border p-2 rounded-lg font-bold" value={amount} onChange={e=>setAmount(Number(e.target.value))} /></div>
          <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Reason</label><textarea className="w-full border p-2 rounded-lg" rows={3} value={reason} onChange={e=>setReason(e.target.value)} /></div>
          <div className="flex gap-4 pt-4"><button onClick={()=>setViewMode('list')} className="flex-1 py-3 border rounded-xl font-bold">Cancel</button><button onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg">Save Note</button></div>
      </div></div>
  );
};