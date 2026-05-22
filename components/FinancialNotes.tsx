
import React, { useState, useEffect } from 'react';
import { FinancialNote, Patient, Invoice, UserRole, Vendor, HearingAid, Hospital, ServiceInvoice } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, CLINIC_GSTIN, getFinancialYear } from '../constants';
// Added CheckCircle2 and IndianRupee to imports to fix "Cannot find name" errors on lines 309 and 356
import { Search, Plus, FileMinus, FilePlus, Printer, Save, ArrowLeft, FileText, Lock, Trash2, X, Eye, Link, CheckCircle2, IndianRupee, User, Building2, Package, Edit, PlusCircle, Calendar } from 'lucide-react';

interface FinancialNotesProps {
  type: 'CREDIT' | 'DEBIT';
  notes: FinancialNote[];
  patients: Patient[];
  vendors: Vendor[];
  invoices: Invoice[];
  serviceInvoices: ServiceInvoice[];
  hospitals: Hospital[];
  inventory: HearingAid[];
  onSave: (note: FinancialNote) => void;
  onDelete: (noteId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
  backHandlerRef?: React.MutableRefObject<(() => boolean) | null>;
}

export const FinancialNotes: React.FC<FinancialNotesProps> = ({ type, notes, patients, vendors, invoices, serviceInvoices, hospitals, inventory, onSave, onDelete, logo, signature, userRole, backHandlerRef }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');

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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [targetType, setTargetType] = useState<'PATIENT' | 'VENDOR' | 'HOSPITAL'>('PATIENT');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [showVendorResults, setShowVendorResults] = useState(false);

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState('');
  const [showHospitalResults, setShowHospitalResults] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [showInvoiceResults, setShowInvoiceResults] = useState(false);

  const [selectedServiceInvoice, setSelectedServiceInvoice] = useState<ServiceInvoice | null>(null);
  const [serviceInvoiceSearchTerm, setServiceInvoiceSearchTerm] = useState('');
  const [showServiceInvoiceResults, setShowServiceInvoiceResults] = useState(false);

  // Hearing Aid Selection for Debit Notes
  const [selectedHearingAids, setSelectedHearingAids] = useState<string[]>([]);
  const [haSearchTerm, setHaSearchTerm] = useState('');
  const [showHaResults, setShowHaResults] = useState(false);
  
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [noteDate, setNoteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState<FinancialNoteItem[]>([{ id: '1', description: '', amount: 0 }]);
  const [tdsAmount, setTdsAmount] = useState<number>(0);
  const [viewNote, setViewNote] = useState<FinancialNote | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const calculateTotalBeforeTds = () => lineItems.reduce((sum, item) => sum + item.amount, 0);
  const calculateFinalAmount = () => calculateTotalBeforeTds() - tdsAmount;

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), description: '', amount: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof FinancialNoteItem, value: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

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
      setTargetType('PATIENT');
      
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

  const handleSelectServiceInvoice = (inv: ServiceInvoice) => {
    setSelectedServiceInvoice(inv);
    setServiceInvoiceSearchTerm(inv.id);
    setShowServiceInvoiceResults(false);
    setTargetType('HOSPITAL');
    
    // Auto-set hospital from invoice
    setSelectedHospital(inv.hospitalDetails);
    setHospitalSearchTerm(inv.hospitalName);
    
    // Suggest amount
    setAmount(inv.totalAmount);
  };

  const handleEdit = (note: FinancialNote) => {
    setEditingNoteId(note.id);
    setNoteDate(note.date);
    setAmount(note.amount);
    setReason(note.reason);
    setLineItems(note.lineItems && note.lineItems.length > 0 ? note.lineItems : [{ id: '1', description: note.reason, amount: note.amount }]);
    setTdsAmount(note.tdsAmount || 0);
    setTargetType(note.targetType || 'PATIENT');
    
    if (note.targetType === 'PATIENT' || !note.targetType) {
        setSelectedPatient(note.patientDetails || null);
        setPatientSearchTerm(note.targetName || note.patientName || '');
    } else if (note.targetType === 'VENDOR') {
        setSelectedVendor(note.vendorDetails || null);
        setVendorSearchTerm(note.targetName || '');
        if (note.hearingAidIds) setSelectedHearingAids(note.hearingAidIds);
    } else if (note.targetType === 'HOSPITAL') {
        setSelectedHospital(note.hospitalDetails || null);
        setHospitalSearchTerm(note.targetName || '');
    }

    if (note.referenceInvoiceId) {
        const inv = invoices.find(i => i.id === note.referenceInvoiceId);
        if (inv) {
            setSelectedInvoice(inv);
            setInvoiceSearchTerm(inv.id);
        } else {
            const sInv = serviceInvoices.find(i => i.id === note.referenceInvoiceId);
            if (sInv) {
                setSelectedServiceInvoice(sInv);
                setServiceInvoiceSearchTerm(sInv.id);
            }
        }
    }

    setViewMode('create');
  };

  const handleSave = () => {
    const finalAmount = calculateFinalAmount();
    const totalBeforeTds = calculateTotalBeforeTds();

    if (targetType === 'PATIENT' && (!selectedPatient || finalAmount <= 0 || !reason)) { 
        alert("Please select a patient, enter an amount, and provide a reason."); 
        return; 
    }
    if (targetType === 'VENDOR' && (!selectedVendor || finalAmount <= 0 || !reason)) { 
        alert("Please select a vendor, enter an amount, and provide a reason."); 
        return; 
    }
    if (targetType === 'HOSPITAL' && (!selectedHospital || finalAmount <= 0 || !reason)) {
        alert("Please select a hospital, enter an amount, and provide a reason.");
        return;
    }

    const newNote: FinancialNote = { 
        id: editingNoteId || generateNextId(), 
        type, 
        date: noteDate, 
        targetType,
        targetId: targetType === 'PATIENT' ? selectedPatient!.id : targetType === 'VENDOR' ? selectedVendor!.id : selectedHospital!.id,
        targetName: targetType === 'PATIENT' ? selectedPatient!.name : targetType === 'VENDOR' ? selectedVendor!.name : selectedHospital!.name,
        patientDetails: targetType === 'PATIENT' ? selectedPatient! : undefined,
        vendorDetails: targetType === 'VENDOR' ? selectedVendor! : undefined,
        hospitalDetails: targetType === 'HOSPITAL' ? selectedHospital! : undefined,
        referenceInvoiceId: selectedInvoice?.id || selectedServiceInvoice?.id,
        amount: finalAmount, 
        reason,
        lineItems,
        tdsAmount,
        totalBeforeTds,
        hearingAidIds: type === 'DEBIT' && targetType === 'VENDOR' ? selectedHearingAids : 
                      (type === 'CREDIT' && targetType === 'PATIENT' && selectedInvoice && finalAmount >= selectedInvoice.finalTotal ? selectedInvoice.items.map(i => i.hearingAidId) : undefined),
        linkedItems: type === 'DEBIT' && targetType === 'VENDOR' ? inventory.filter(i => selectedHearingAids.includes(i.id)) : 
                    (type === 'CREDIT' && targetType === 'PATIENT' && selectedInvoice && finalAmount >= selectedInvoice.finalTotal ? selectedInvoice.items.map(i => ({
                        id: i.hearingAidId,
                        brand: i.brand,
                        model: i.model,
                        serialNumber: i.serialNumber,
                        price: i.price,
                        location: selectedInvoice.hospitalName || 'Main Stock',
                        status: 'Available',
                        addedDate: new Date().toISOString().split('T')[0],
                        gstRate: i.gstRate,
                        hsnCode: i.hsnCode
                    } as HearingAid)) : undefined)
    };
    onSave(newNote); 
    setViewMode('list');
    resetForm();
  };

  const resetForm = () => {
      setTargetType('PATIENT');
      setSelectedPatient(null);
      setPatientSearchTerm('');
      setSelectedVendor(null);
      setVendorSearchTerm('');
      setSelectedHospital(null);
      setHospitalSearchTerm('');
      setSelectedInvoice(null);
      setInvoiceSearchTerm('');
      setSelectedServiceInvoice(null);
      setServiceInvoiceSearchTerm('');
      setSelectedHearingAids([]);
      setHaSearchTerm('');
      setAmount(0);
      setReason('');
      setNoteDate(new Date().toISOString().split('T')[0]);
      setLineItems([{ id: '1', description: '', amount: 0 }]);
      setTdsAmount(0);
      setEditingNoteId(null);
  };

  const toggleHearingAid = (id: string) => {
    setSelectedHearingAids(prev => 
        prev.includes(id) ? prev.filter(haId => haId !== id) : [...prev, id]
    );
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
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 col-span-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 border-b-2 border-slate-200 pb-1 tracking-widest">Issued To:</h4>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="font-black text-2xl text-slate-900 uppercase tracking-tight">{note.targetName || note.patientName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">({note.targetType || 'PATIENT'})</p>
                        {(note.targetType === 'PATIENT' || !note.targetType) && note.patientDetails?.phone && <p className="text-sm font-bold text-slate-600 mt-1">{note.patientDetails.phone}</p>}
                        {note.targetType === 'VENDOR' && note.vendorDetails?.gstin && <p className="text-sm font-bold text-slate-600 mt-1">GSTIN: {note.vendorDetails.gstin}</p>}
                        {note.targetType === 'HOSPITAL' && note.hospitalDetails?.gstin && <p className="text-sm font-bold text-slate-600 mt-1">GSTIN: {note.hospitalDetails.gstin}</p>}
                    </div>
                    {note.referenceInvoiceId && (
                        <div className="flex items-center gap-2 text-[#3159a6] font-black uppercase text-[10px] tracking-widest bg-blue-100/50 px-4 py-2 rounded-xl border border-blue-100">
                            <Link size={12}/> Ref Invoice: {note.referenceInvoiceId}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="mb-10 overflow-hidden rounded-3xl border-2 border-slate-100">
            <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                    <tr>
                        <th className="p-4">Description / Purpose</th>
                        <th className="p-4 text-right">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {note.lineItems && note.lineItems.length > 0 ? (
                        note.lineItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                                <td className="p-4 text-xs italic">-{item.description}</td>
                                <td className="p-4 text-right text-sm">₹{item.amount.toLocaleString('en-IN')}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="p-4 text-xs italic">-{note.reason}</td>
                            <td className="p-4 text-right text-sm">₹{note.amount.toLocaleString('en-IN')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 border-b-2 border-slate-200 pb-1 tracking-widest">Summary Reason:</h4>
                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{note.reason}"</p>
                {note.referenceInvoiceId && (
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 flex items-center gap-2 text-[#3159a6] font-black uppercase text-[10px] tracking-widest">
                        <Link size={12}/> Ref Invoice: {note.referenceInvoiceId}
                    </div>
                )}
            </div>
            <div className="text-right flex flex-col justify-center items-end space-y-4">
                <div className="flex flex-col gap-2 w-full max-w-[240px]">
                    {note.totalBeforeTds !== undefined && note.tdsAmount !== undefined && (
                        <>
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Gross Amount:</span>
                                <span className="text-slate-900 tracking-tighter text-sm">₹{note.totalBeforeTds.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-red-500 uppercase tracking-widest">
                                <span>TDS Deduction:</span>
                                <span className="tracking-tighter text-sm">-₹{note.tdsAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-px bg-slate-200 my-1"></div>
                        </>
                    )}
                    <div className="bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 shadow-xl">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest text-center">Net Note Amount</h4>
                        <p className={`text-4xl font-black text-center tracking-tighter ${note.type === 'CREDIT' ? 'text-red-500' : 'text-blue-500'}`}>₹{note.amount.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>
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
            (n.targetName || n.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                    placeholder="Search by ID, Name or Ref Invoice..." 
                    className="flex-1 outline-none text-sm font-medium" 
                    value={searchTerm} 
                    onChange={e=>setSearchTerm(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 font-black border-b text-[10px] uppercase tracking-widest">
                            <tr><th className="p-5">Note ID</th><th className="p-5">Date</th><th className="p-5">Issued To</th><th className="p-5">Type</th><th className="p-5">Ref. Invoice</th><th className="p-5 text-right">Amount</th><th className="p-5 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y text-sm font-medium text-slate-600">
                            {filteredNotes.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No entries found</td></tr>
                            ) : filteredNotes.map(n => (
                                <tr key={n.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-5 font-black text-slate-900 uppercase">{n.id}</td>
                                    <td className="p-5 font-bold text-slate-400">{new Date(n.date).toLocaleDateString('en-IN')}</td>
                                    <td className="p-5 font-black text-slate-800 uppercase tracking-tight">{n.targetName || n.patientName}</td>
                                    <td className="p-5">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${
                                            (n.targetType || 'PATIENT') === 'PATIENT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                            (n.targetType === 'HOSPITAL') ? 'bg-green-50 text-green-600 border-green-100' :
                                            'bg-purple-50 text-purple-600 border-purple-100'
                                        }`}>
                                            {n.targetType || 'PATIENT'}
                                        </span>
                                    </td>
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
                                                <>
                                                    <button onClick={() => handleEdit(n)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition" title="Edit"><Edit size={20}/></button>
                                                    <button onClick={() => { if(window.confirm(`Delete note ${n.id}?`)) onDelete(n.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition" title="Remove"><Trash2 size={20}/></button>
                                                </>
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
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">{editingNoteId ? 'Edit' : 'Issue'} {type} Note</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Financial Adjustment Node</p>
              </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 space-y-8 animate-fade-in shadow-inner overflow-visible">
                {/* Invoice Linking Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center">Note Issuance Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="date"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#3159a6] focus:bg-white transition-all font-bold text-gray-700 shadow-inner" 
                                value={noteDate}
                                onChange={e => setNoteDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-[#3159a6] uppercase tracking-[0.2em] ml-1 text-center">Link to Patient Invoice</label>
                        <div className="relative">
                            <div className="relative">
                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    className="w-full pl-12 pr-12 py-4 bg-blue-50/50 border-2 border-blue-50 rounded-2xl outline-none focus:border-[#3159a6] focus:bg-white transition-all font-bold text-gray-700 shadow-inner text-sm" 
                                    placeholder="Search Patient Invoice..." 
                                    value={invoiceSearchTerm} 
                                    onChange={e => { setInvoiceSearchTerm(e.target.value); setShowInvoiceResults(true); }}
                                    onFocus={() => setShowInvoiceResults(true)}
                                    disabled={!!selectedServiceInvoice}
                                />
                                {selectedInvoice && (
                                    <button onClick={() => { setSelectedInvoice(null); setInvoiceSearchTerm(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600"><X size={18}/></button>
                                )}
                            </div>
                            {showInvoiceResults && invoiceSearchTerm && !selectedServiceInvoice && (
                                <div className="absolute z-[100] w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar p-2">
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
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-green-600 uppercase tracking-[0.2em] ml-1 text-center">Link to Service Invoice</label>
                        <div className="relative">
                            <div className="relative">
                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    className="w-full pl-12 pr-12 py-4 bg-green-50/50 border-2 border-green-50 rounded-2xl outline-none focus:border-green-600 focus:bg-white transition-all font-bold text-gray-700 shadow-inner text-sm" 
                                    placeholder="Search Service Invoice..." 
                                    value={serviceInvoiceSearchTerm} 
                                    onChange={e => { setServiceInvoiceSearchTerm(e.target.value); setShowServiceInvoiceResults(true); }}
                                    onFocus={() => setShowServiceInvoiceResults(true)}
                                    disabled={!!selectedInvoice}
                                />
                                {selectedServiceInvoice && (
                                    <button onClick={() => { setSelectedServiceInvoice(null); setServiceInvoiceSearchTerm(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600"><X size={18}/></button>
                                )}
                            </div>
                            {showServiceInvoiceResults && serviceInvoiceSearchTerm && !selectedInvoice && (
                                <div className="absolute z-[100] w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar p-2">
                                    {serviceInvoices.filter(i => 
                                        i.id.toLowerCase().includes(serviceInvoiceSearchTerm.toLowerCase()) || 
                                        i.hospitalName.toLowerCase().includes(serviceInvoiceSearchTerm.toLowerCase())
                                    ).map(inv => (
                                        <button 
                                            key={inv.id} 
                                            type="button"
                                            onClick={() => handleSelectServiceInvoice(inv)} 
                                            className="w-full text-left p-4 hover:bg-green-50 rounded-2xl border-b border-gray-50 last:border-0 transition flex justify-between items-center group"
                                        >
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight">{inv.id}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{inv.hospitalName} • {inv.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-green-600">₹{inv.totalAmount.toLocaleString()}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {(selectedInvoice || selectedServiceInvoice) && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-green-600 uppercase bg-green-50 px-4 py-2 rounded-xl border border-green-100 self-start animate-fade-in mx-auto w-fit">
                        <CheckCircle2 size={12}/> {selectedInvoice ? `Linked Patient Invoice: ${selectedInvoice.id}` : `Linked Service Invoice: ${selectedServiceInvoice?.id}`}
                    </div>
                )}

                <hr className="border-dashed border-gray-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Target Selection */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Issue To *</label>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-4">
                            <button 
                                type="button"
                                onClick={() => { setTargetType('PATIENT'); setSelectedVendor(null); setVendorSearchTerm(''); setSelectedHospital(null); setHospitalSearchTerm(''); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition ${targetType === 'PATIENT' ? 'bg-white text-[#3159a6] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                disabled={!!selectedInvoice || !!selectedServiceInvoice}
                            >
                                <User size={14} /> Patient
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setTargetType('VENDOR'); setSelectedPatient(null); setPatientSearchTerm(''); setSelectedHospital(null); setHospitalSearchTerm(''); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition ${targetType === 'VENDOR' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                disabled={!!selectedInvoice || !!selectedServiceInvoice}
                            >
                                <Building2 size={14} /> Vendor
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setTargetType('HOSPITAL'); setSelectedPatient(null); setPatientSearchTerm(''); setSelectedVendor(null); setVendorSearchTerm(''); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition ${targetType === 'HOSPITAL' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                disabled={!!selectedInvoice || !!selectedServiceInvoice}
                            >
                                <Building2 size={14} /> Hospital
                            </button>
                        </div>

                        {targetType === 'PATIENT' ? (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:border-[#3159a6] outline-none transition-all font-bold text-gray-700 bg-gray-50 focus:bg-white shadow-sm" 
                                    placeholder="Search by patient name..." 
                                    value={patientSearchTerm} 
                                    onChange={e => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }}
                                    onFocus={() => setShowPatientResults(true)}
                                    disabled={!!selectedInvoice || !!selectedServiceInvoice}
                                />
                                {showPatientResults && patientSearchTerm && !selectedInvoice && !selectedServiceInvoice && (
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
                        ) : targetType === 'VENDOR' ? (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:border-purple-600 outline-none transition-all font-bold text-gray-700 bg-gray-50 focus:bg-white shadow-sm" 
                                    placeholder="Search by vendor name..." 
                                    value={vendorSearchTerm} 
                                    onChange={e => { setVendorSearchTerm(e.target.value); setShowVendorResults(true); }}
                                    onFocus={() => setShowVendorResults(true)}
                                />
                                {showVendorResults && vendorSearchTerm && (
                                    <div className="absolute z-10 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar p-2">
                                        {vendors.filter(v=>v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())).map(v=>(
                                            <button 
                                                key={v.id} 
                                                type="button"
                                                onClick={()=>{setSelectedVendor(v); setShowVendorResults(false); setVendorSearchTerm(v.name);}} 
                                                className="w-full text-left p-3 hover:bg-purple-50 rounded-xl border-b border-gray-50 last:border-0 font-black uppercase text-xs text-slate-700 tracking-tighter"
                                            >
                                                {v.name} <span className="text-[9px] text-gray-400 ml-2">({v.gstin})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:border-green-600 outline-none transition-all font-bold text-gray-700 bg-gray-50 focus:bg-white shadow-sm" 
                                    placeholder="Search by hospital name..." 
                                    value={hospitalSearchTerm} 
                                    onChange={e => { setHospitalSearchTerm(e.target.value); setShowHospitalResults(true); }}
                                    onFocus={() => setShowHospitalResults(true)}
                                    disabled={!!selectedInvoice || !!selectedServiceInvoice}
                                />
                                {showHospitalResults && hospitalSearchTerm && !selectedInvoice && !selectedServiceInvoice && (
                                    <div className="absolute z-10 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar p-2">
                                        {hospitals.filter(h=>h.name.toLowerCase().includes(hospitalSearchTerm.toLowerCase())).map(h=>(
                                            <button 
                                                key={h.id} 
                                                type="button"
                                                onClick={()=>{setSelectedHospital(h); setShowHospitalResults(false); setHospitalSearchTerm(h.name);}} 
                                                className="w-full text-left p-3 hover:bg-green-50 rounded-xl border-b border-gray-50 last:border-0 font-black uppercase text-xs text-slate-700 tracking-tighter"
                                            >
                                                {h.name} <span className="text-[9px] text-gray-400 ml-2">({h.gstin})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedPatient && targetType === 'PATIENT' && !selectedInvoice && (
                            <div className="text-[10px] font-black text-[#3159a6] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 uppercase tracking-widest inline-block animate-fade-in">
                                Selection: {selectedPatient.name}
                            </div>
                        )}
                        {selectedVendor && targetType === 'VENDOR' && (
                            <div className="text-[10px] font-black text-purple-600 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 uppercase tracking-widest inline-block animate-fade-in">
                                Selection: {selectedVendor.name}
                            </div>
                        )}
                        {selectedHospital && targetType === 'HOSPITAL' && (
                            <div className="text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100 uppercase tracking-widest inline-block animate-fade-in">
                                Selection: {selectedHospital.name}
                            </div>
                        )}
                    </div>

                    {/* Hearing Aid Selection for Debit Note */}
                    {type === 'DEBIT' && targetType === 'VENDOR' && (
                        <div className="space-y-4 md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Hearing Aids to Remove from Inventory (Optional)</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl focus:border-purple-600 outline-none transition-all font-bold text-gray-700 bg-gray-50 focus:bg-white shadow-sm" 
                                    placeholder="Search by Model or Serial Number..." 
                                    value={haSearchTerm} 
                                    onChange={e => { setHaSearchTerm(e.target.value); setShowHaResults(true); }}
                                    onFocus={() => setShowHaResults(true)}
                                />
                                {showHaResults && haSearchTerm && (
                                    <div className="absolute z-10 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar p-2">
                                        {inventory.filter(item => 
                                            item.status === 'Available' && 
                                            (item.model.toLowerCase().includes(haSearchTerm.toLowerCase()) || 
                                             item.serialNumber.toLowerCase().includes(haSearchTerm.toLowerCase()))
                                        ).map(item => (
                                            <button 
                                                key={item.id} 
                                                type="button"
                                                onClick={() => { toggleHearingAid(item.id); setHaSearchTerm(''); setShowHaResults(false); }} 
                                                className={`w-full text-left p-3 rounded-xl border-b border-gray-50 last:border-0 font-black uppercase text-xs tracking-tighter transition ${selectedHearingAids.includes(item.id) ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 text-slate-700'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{item.brand} {item.model} <span className="text-[9px] text-gray-400 ml-2">S/N: {item.serialNumber}</span></span>
                                                    {selectedHearingAids.includes(item.id) && <CheckCircle2 size={14} />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedHearingAids.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedHearingAids.map(id => {
                                        const item = inventory.find(i => i.id === id);
                                        return (
                                            <div key={id} className="flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl border border-purple-100 text-[10px] font-black uppercase animate-fade-in">
                                                <Package size={12} /> {item?.model} ({item?.serialNumber})
                                                <button onClick={() => toggleHearingAid(id)} className="hover:text-red-500 transition"><X size={12}/></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Purpose Breakdown (Multiple Entries)</label>
                        <button type="button" onClick={addLineItem} className="text-[#3159a6] hover:text-slate-800 flex items-center gap-1 font-black uppercase text-[10px] tracking-widest transition">
                            <PlusCircle size={14}/> Add Item
                        </button>
                    </div>
                    <div className="bg-gray-50/50 rounded-3xl border-2 border-gray-50 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#3159a6] text-white text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="p-4">Description</th>
                                    <th className="p-4 text-right w-32">Amount</th>
                                    <th className="p-4 text-center w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-bold">
                                {lineItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="p-2">
                                            <input 
                                                className="w-full bg-transparent border-0 outline-none text-xs text-slate-700 p-2 focus:ring-1 focus:ring-blue-100 rounded-lg placeholder-slate-300" 
                                                placeholder="Enter description..." 
                                                value={item.description}
                                                onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number"
                                                className="w-full bg-transparent border-0 outline-none text-right text-sm font-black text-[#3159a6] p-2 focus:ring-1 focus:ring-blue-100 rounded-lg" 
                                                placeholder="0"
                                                value={item.amount || ''}
                                                onChange={e => updateLineItem(item.id, 'amount', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button type="button" onClick={() => removeLineItem(item.id)} className="text-red-300 hover:text-red-500 transition">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-blue-50/30 font-black">
                                <tr>
                                    <td className="p-4 text-[10px] uppercase tracking-widest text-gray-400">Gross Total</td>
                                    <td className="p-4 text-right text-[#3159a6] font-black tracking-tight">₹{calculateTotalBeforeTds().toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TDS Deduction (Optional)</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl font-black text-lg outline-none focus:border-red-400 bg-red-50/20 focus:bg-white shadow-inner transition-all text-red-600" 
                                value={tdsAmount || ''} 
                                onChange={e=>setTdsAmount(Number(e.target.value))} 
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Net Note Amount</label>
                        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-2xl flex items-center justify-center">
                            <span className={`text-2xl font-black tracking-tighter ${type === 'CREDIT' ? 'text-red-500' : 'text-blue-500'}`}>₹{calculateFinalAmount().toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Summary Remarks (Overall Reason) *</label>
                    <textarea 
                        className="w-full border-2 border-gray-50 rounded-3xl p-5 outline-none focus:border-[#3159a6] bg-gray-50 focus:bg-white transition-all h-24 resize-none font-medium text-slate-700 shadow-inner" 
                        value={reason} 
                        onChange={e=>setReason(e.target.value)} 
                        placeholder="Explain the purpose of this note..."
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-5 pt-4">
                    <button onClick={() => setViewMode('list')} className="flex-1 py-5 border-2 border-gray-100 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] text-gray-400 hover:bg-gray-50 transition active:scale-95">Cancel Entry</button>
                    <button onClick={handleSave} className="flex-[2] py-5 bg-[#3159a6] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition active:scale-95">{editingNoteId ? 'Update' : 'Confirm & Issue'} {type} Note</button>
                </div>
          </div>
      </div>
  );
};
