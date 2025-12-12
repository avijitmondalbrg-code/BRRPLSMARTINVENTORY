
import React, { useState } from 'react';
import { FinancialNote, Patient, Invoice, UserRole } from '../types';
import { Search, Plus, FileMinus, FilePlus, Printer, Save, ArrowLeft, FileText, Lock, Trash2 } from 'lucide-react';

interface FinancialNotesProps {
  type: 'CREDIT' | 'DEBIT';
  notes: FinancialNote[];
  patients: Patient[];
  invoices: Invoice[];
  onSave: (note: FinancialNote) => void;
  // FIX: Added onDelete prop to fix Error in file App.tsx on lines 310, 311
  onDelete: (id: string) => void;
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
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [viewNote, setViewNote] = useState<FinancialNote | null>(null);

  const filteredNotes = notes.filter(n => 
    n.type === type && 
    (n.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     n.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.phone.includes(patientSearchTerm)
  );

  // Helper to generate ID
  const generateNextId = () => {
    const prefix = type === 'CREDIT' ? 'CN' : 'DN';
    const currentYear = new Date().getFullYear();
    const fullPrefix = `${prefix}-${currentYear}-`;
    
    const existingIds = notes
        .filter(n => n.id.startsWith(fullPrefix))
        .map(n => n.id);

    if (existingIds.length === 0) return `${fullPrefix}001`;

    const maxSeq = existingIds.reduce((max, id) => {
        const parts = id.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        return !isNaN(seq) && seq > max ? seq : max;
    }, 0);

    return `${fullPrefix}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const handleSave = () => {
    if (!selectedPatient || amount <= 0 || !reason) {
        alert("Please fill all required fields (Patient, Amount, Reason)");
        return;
    }

    const newNote: FinancialNote = {
        id: generateNextId(),
        type,
        date: new Date().toISOString().split('T')[0],
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientDetails: selectedPatient,
        amount,
        reason,
        referenceInvoiceId: linkedInvoiceId || undefined
    };

    onSave(newNote);
    resetForm();
    setViewMode('list');
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearchTerm('');
    setAmount(0);
    setReason('');
    setLinkedInvoiceId('');
  };

  const handleView = (note: FinancialNote) => {
    setViewNote(note);
    setViewMode('view');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderDocument = (note: FinancialNote, isPreview = false) => (
      <div id="invoice-printable-area" className={`bg-white ${isPreview ? 'shadow-none p-0' : 'rounded-lg shadow-lg p-8 border border-gray-200'}`}>
        <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4">
                <div className="flex-shrink-0 h-20 w-20 flex items-center justify-center overflow-hidden"><img src={logo} alt="Logo" className="h-full w-full object-contain" /></div>
                <div className="pt-1">
                    <h1 className="text-xl font-bold text-gray-700 uppercase leading-tight">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1>
                    <div className="w-full h-px bg-blue-400 my-1.5"></div>
                    <p className="text-gray-500 text-xs font-semibold italic">Bengal's Largest Hearing Chain</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-xl uppercase ${note.type === 'CREDIT' ? 'text-red-600' : 'text-blue-600'}`}>{note.type} NOTE</p>
                <p className="text-gray-500 font-mono">#{note.id}</p>
                <p className="text-sm text-gray-600 mt-1">Date: {note.date}</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-8 border-t border-b border-gray-100 py-6 mb-6">
            <div><h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Issued To:</h4><p className="font-bold text-gray-800">{note.patientName}</p></div>
            <div className="text-right"><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Amount:</h4><p className="text-2xl font-bold text-gray-900">₹{note.amount.toLocaleString('en-IN')}</p></div></div>
        </div>
        <table className="w-full mb-8">
            <thead><tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"><th className="p-3">Reason</th><th className="p-3 text-right">Amount</th></tr></thead>
            <tbody><tr><td className="p-4 border-b border-gray-100 text-gray-700">{note.reason}</td><td className="p-4 border-b border-gray-100 text-right font-medium">₹{note.amount.toLocaleString('en-IN')}</td></tr></tbody>
        </table>
        <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end text-xs text-gray-500">
            <div>{signature ? <img src={signature} className="h-16 mb-2 mx-auto" /> : <div className="h-16 w-40 border-b border-gray-300 mb-2"></div>}<p className="font-bold uppercase">Authorized Signatory</p></div>
        </div>
      </div>
  );

  if (viewMode === 'view' && viewNote) {
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center print:hidden"><button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-gray-600"><ArrowLeft size={20} /> Back</button><button onClick={handlePrint} className="bg-white border p-2 rounded shadow-sm flex items-center gap-2"><Printer size={20} /> Print</button></div>
              {renderDocument(viewNote)}
          </div>
      )
  }

  if (viewMode === 'create') {
      return (
          <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold text-gray-800">New {type === 'CREDIT' ? 'Credit' : 'Debit'} Note</h2></div>
              <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                    {selectedPatient ? (
                        <div className="flex justify-between items-center p-3 bg-teal-50 border border-teal-100 rounded-lg"><div><p className="font-medium">{selectedPatient.name}</p></div><button onClick={() => setSelectedPatient(null)} className="text-xs text-red-500 hover:underline">Change</button></div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input type="text" placeholder="Search patient..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={patientSearchTerm} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} />
                            {showPatientResults && patientSearchTerm && (
                                <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border max-h-60 overflow-y-auto">
                                    {filteredPatients.map(p => (
                                        <button key={p.id} onClick={() => { setSelectedPatient(p); setShowPatientResults(false); }} className="w-full text-left px-4 py-2 hover:bg-teal-50 border-b last:border-0">{p.name}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <input type="number" placeholder="Amount" className="w-full border p-2 rounded" value={amount || ''} onChange={(e) => setAmount(parseFloat(e.target.value))}/>
                <textarea className="w-full border p-2 rounded" rows={3} placeholder="Reason..." value={reason} onChange={(e) => setReason(e.target.value)}/>
                <button onClick={handleSave} className="w-full bg-primary text-white py-3 rounded-lg font-bold shadow hover:bg-teal-800 transition">Save Note</button>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">{type === 'CREDIT' ? <FileMinus className="text-red-500" /> : <FilePlus className="text-blue-500" />} {type === 'CREDIT' ? 'Credit Notes' : 'Debit Notes'}</h2>
            {userRole === 'admin' ? (
                <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"><Plus size={20} /> Create Note</button>
            ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-100 px-3 py-1.5 rounded-full border"><Lock size={14} /> Read-Only</div>
            )}
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden border">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b"><tr><th className="p-4">Note ID</th><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4">Reason</th><th className="p-4 text-right">Amount</th><th className="p-4">Actions</th></tr></thead>
                <tbody className="divide-y">{filteredNotes.map(note => (
                    <tr key={note.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-sm">{note.id}</td>
                        <td className="p-4 text-gray-600 text-sm">{note.date}</td>
                        <td className="p-4 font-medium">{note.patientName}</td>
                        <td className="p-4 text-gray-600 text-sm truncate max-w-xs">{note.reason}</td>
                        <td className={`p-4 text-right font-bold ${type === 'CREDIT' ? 'text-red-600' : 'text-blue-600'}`}>₹{note.amount.toLocaleString()}</td>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleView(note)} className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 px-3 py-1 rounded transition text-sm flex items-center gap-1"><FileText size={16} /> View</button>
                                {userRole === 'admin' && (
                                    <button onClick={() => { if(window.confirm("Permanently delete this note?")) onDelete(note.id); }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition" title="Delete"><Trash2 size={16}/></button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}</tbody>
            </table>
        </div>
    </div>
  );
};