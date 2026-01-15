
import React, { useState, useMemo } from 'react';
import { Hospital, ServiceInvoice, ServiceInvoiceLine, UserRole } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, getFinancialYear, CLINIC_GSTIN } from '../constants';
import { Plus, Search, Trash2, Printer, Save, ArrowLeft, Landmark, Building2, Calendar, FileText, Download, X, PlusCircle, CheckCircle2, IndianRupee, Percent } from 'lucide-react';

interface ServiceBillingProps {
  hospitals: Hospital[];
  invoices: ServiceInvoice[];
  onAddHospital: (h: Hospital) => void;
  onSaveInvoice: (inv: ServiceInvoice) => void;
  onDeleteInvoice: (id: string) => void;
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

export const ServiceBilling: React.FC<ServiceBillingProps> = ({ hospitals, invoices, onAddHospital, onSaveInvoice, onDeleteInvoice, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'review'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Form State
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [showHospResults, setShowHospResults] = useState(false);
  
  const [invoiceLines, setInvoiceLines] = useState<ServiceInvoiceLine[]>([]);
  const [tempLine, setTempLine] = useState<Partial<ServiceInvoiceLine>>({ description: '', hsn: '9987', qty: 1, rate: 0, discount: 0 });
  
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalAdjustment, setGlobalAdjustment] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedBank, setSelectedBank] = useState(COMPANY_BANK_ACCOUNTS[0].name);

  // Modal for adding new hospital
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [newHospital, setNewHospital] = useState<Partial<Hospital>>({ name: '', address: '', gstin: '', pan: '' });

  const resetForm = () => {
    setSelectedHospital(null);
    setHospitalSearch('');
    setInvoiceLines([]);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setGlobalAdjustment(0);
    setNotes('');
  };

  const generateInvoiceId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL-IM-SR-${fy}-`;
    const fyInvs = invoices.filter(i => i.id.startsWith(prefix));
    const nextSeq = fyInvs.length === 0 ? 1 : Math.max(...fyInvs.map(i => parseInt(i.id.split('-').pop() || '0'))) + 1;
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  };

  const handleAddLine = () => {
    if(!tempLine.description || !tempLine.rate) return;
    const qty = tempLine.qty || 1;
    const rate = tempLine.rate || 0;
    const discount = tempLine.discount || 0;
    
    const newLine: ServiceInvoiceLine = {
      id: Date.now().toString(),
      description: tempLine.description || '',
      hsn: tempLine.hsn || '9987',
      qty,
      rate,
      discount,
      taxableAmount: (qty * rate) - discount,
      amount: (qty * rate) - discount
    };
    setInvoiceLines([...invoiceLines, newLine]);
    setTempLine({ description: '', hsn: '9987', qty: 1, rate: 0, discount: 0 });
  };

  const handleAddHospitalSubmit = () => {
    if(!newHospital.name || !newHospital.address) return;
    const h: Hospital = {
      id: `HOSP-${Date.now()}`,
      name: newHospital.name,
      address: newHospital.address,
      gstin: newHospital.gstin,
      pan: newHospital.pan
    };
    onAddHospital(h);
    setSelectedHospital(h);
    setHospitalSearch(h.name);
    setShowAddHospitalModal(false);
    setNewHospital({ name: '', address: '', gstin: '', pan: '' });
  };

  const lineSubtotal = invoiceLines.reduce((sum, line) => sum + (line.qty * line.rate), 0);
  const totalItemDiscount = invoiceLines.reduce((sum, line) => sum + (line.discount || 0), 0);
  const netBeforeGlobal = lineSubtotal - totalItemDiscount;
  const total = Math.max(0, netBeforeGlobal - globalAdjustment);

  const handleFinalSave = () => {
    if(!selectedHospital || invoiceLines.length === 0) return;
    const inv: ServiceInvoice = {
      id: generateInvoiceId(),
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
      hospitalDetails: selectedHospital,
      date: invoiceDate,
      items: invoiceLines,
      subtotal: lineSubtotal,
      itemDiscount: totalItemDiscount,
      globalAdjustment: globalAdjustment,
      totalDiscount: totalItemDiscount + globalAdjustment,
      taxAmount: 0,
      totalAmount: total,
      notes,
      bankAccountName: selectedBank
    };
    onSaveInvoice(inv);
    setViewMode('list');
    resetForm();
  };

  if (viewMode === 'list') {
    const filtered = invoices.filter(i => 
      i.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Landmark className="text-primary" /> Hospital Service Billing</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">B2B Hospital Invoicing</p>
          </div>
          <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition active:scale-95">
            <Plus size={20} /> Create New Bill
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
          <Search className="text-gray-400" size={20} />
          <input type="text" placeholder="Search invoices by ID or Hospital..." className="flex-1 outline-none text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#3159a6] text-white font-black text-[10px] uppercase tracking-widest border-b">
              <tr><th className="p-5">Bill No</th><th className="p-5">Date</th><th className="p-5">Hospital</th><th className="p-5 text-right">Total Amount</th><th className="p-5 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No service invoices found</td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-5 font-black text-primary uppercase">{inv.id}</td>
                  <td className="p-5 font-bold text-gray-500">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                  <td className="p-5 font-black text-gray-800 uppercase">{inv.hospitalName}</td>
                  <td className="p-5 text-right font-black text-lg">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setSelectedHospital(inv.hospitalDetails); setInvoiceLines(inv.items); setInvoiceDate(inv.date); setNotes(inv.notes || ''); setGlobalAdjustment(inv.globalAdjustment || 0); setSelectedBank(inv.bankAccountName || selectedBank); setViewMode('review'); }} className="p-2 text-primary hover:bg-blue-50 rounded-xl transition"><Printer size={18}/></button>
                      {userRole === 'admin' && (
                        <button onClick={() => onDeleteInvoice(inv.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={18}/></button>
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

  if (viewMode === 'create') {
    return (
      <div className="max-w-5xl mx-auto pb-10 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 rounded-full text-gray-400 hover:bg-gray-100 shadow-sm transition"><ArrowLeft size={24}/></button>
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Compose Service Bill</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Hospital Professional Services</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 space-y-8">
          {/* Hospital Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hospital / Client *</label>
              <div className="relative">
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold" placeholder="Find Hospital..." value={hospitalSearch} onChange={e => { setHospitalSearch(e.target.value); setShowHospResults(true); }} onFocus={() => setShowHospResults(true)} />
                  <button onClick={() => setShowAddHospitalModal(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-secondary"><PlusCircle size={20}/></button>
                </div>
                {showHospResults && hospitalSearch && (
                  <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto p-2">
                    {hospitals.filter(h => h.name.toLowerCase().includes(hospitalSearch.toLowerCase())).map(h => (
                      <button key={h.id} type="button" onClick={() => { setSelectedHospital(h); setHospitalSearch(h.name); setShowHospResults(false); }} className="w-full text-left p-4 hover:bg-blue-50 rounded-xl transition font-bold uppercase text-xs">{h.name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Billing Date *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="date" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl font-bold" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
            </div>
          </div>

          <hr className="border-dashed" />

          {/* Line Items */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Service Particulars</label>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4"><input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Service Description" value={tempLine.description} onChange={e => setTempLine({...tempLine, description: e.target.value})} /></div>
              <div className="md:col-span-2"><input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="HSN (9987)" value={tempLine.hsn} onChange={e => setTempLine({...tempLine, hsn: e.target.value})} /></div>
              <div className="md:col-span-1"><input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Qty" value={tempLine.qty} onChange={e => setTempLine({...tempLine, qty: parseInt(e.target.value)})} /></div>
              <div className="md:col-span-2"><input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Rate" value={tempLine.rate || ''} onChange={e => setTempLine({...tempLine, rate: parseFloat(e.target.value)})} /></div>
              <div className="md:col-span-2"><input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Disc" value={tempLine.discount || ''} onChange={e => setTempLine({...tempLine, discount: parseFloat(e.target.value)})} /></div>
              <div className="md:col-span-1"><button onClick={handleAddLine} className="w-full h-full bg-primary text-white rounded-xl flex items-center justify-center hover:bg-secondary transition shadow-lg"><Plus size={20}/></button></div>
            </div>

            <div className="border-2 border-gray-50 rounded-2xl overflow-hidden mt-4">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[9px] tracking-widest border-b">
                  <tr><th className="p-4">Particulars</th><th className="p-4">HSN</th><th className="p-4 text-center">Qty</th><th className="p-4 text-right">Rate</th><th className="p-4 text-right">Disc</th><th className="p-4 text-right">Amount</th><th className="p-4"></th></tr>
                </thead>
                <tbody className="divide-y uppercase">
                  {invoiceLines.length === 0 ? (
                    <tr><td colSpan={7} className="p-10 text-center text-gray-300 italic">No items added yet</td></tr>
                  ) : invoiceLines.map(line => (
                    <tr key={line.id}>
                      <td className="p-4 text-gray-800">{line.description}</td>
                      <td className="p-4 text-gray-400 font-mono">{line.hsn}</td>
                      <td className="p-4 text-center">{line.qty}</td>
                      <td className="p-4 text-right">₹{line.rate.toLocaleString()}</td>
                      <td className="p-4 text-right text-red-500">-₹{(line.discount || 0).toLocaleString()}</td>
                      <td className="p-4 text-right font-black">₹{line.amount.toLocaleString()}</td>
                      <td className="p-4 text-center"><button onClick={() => setInvoiceLines(invoiceLines.filter(l => l.id !== line.id))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Account Node</label>
                      <select className="w-full border-2 border-gray-100 rounded-2xl p-4 font-black text-primary bg-gray-50" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                         {COMPANY_BANK_ACCOUNTS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Global Adjustment</label>
                      <input type="number" className="w-full border-2 border-gray-100 rounded-2xl p-4 font-black text-red-600 bg-gray-50 shadow-inner outline-none focus:border-red-300" value={globalAdjustment || ''} onChange={e => setGlobalAdjustment(Number(e.target.value))} placeholder="0.00" />
                   </div>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border-2 border-blue-50">
                    <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1 mb-2">Invoice Remarks</label>
                    <textarea className="w-full bg-white border-2 border-gray-50 p-3 rounded-xl text-xs h-20 resize-none font-bold" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter details..." />
                </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Payable Amount</p>
              <p className="text-5xl font-black text-gray-900 tracking-tighter">₹{total.toLocaleString('en-IN')}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{numberToWords(total)}</p>
              </div>
            </div>
          </div>

          <button onClick={() => setViewMode('review')} disabled={!selectedHospital || invoiceLines.length === 0} className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition active:scale-95 text-[10px] disabled:opacity-50">Generate Service Invoice Preview &rarr;</button>
        </div>

        {/* Add Hospital Modal */}
        {showAddHospitalModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border-4 border-white">
              <div className="bg-[#3159a6] p-5 text-white flex justify-between items-center font-black uppercase tracking-widest">
                <h3>Register New Hospital</h3>
                <button onClick={() => setShowAddHospitalModal(false)}><X size={24}/></button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Hospital Name *</label>
                  <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-primary" value={newHospital.name} onChange={e => setNewHospital({...newHospital, name: e.target.value})} placeholder="Hospital Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">GSTIN (Optional)</label>
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold uppercase text-gray-700 outline-none focus:border-primary" value={newHospital.gstin} onChange={e => setNewHospital({...newHospital, gstin: e.target.value})} placeholder="GSTIN" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">PAN NO (Optional)</label>
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold uppercase text-gray-700 outline-none focus:border-primary" value={newHospital.pan} onChange={e => setNewHospital({...newHospital, pan: e.target.value})} placeholder="PAN NO" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Address *</label>
                  <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold h-24 resize-none text-gray-700 outline-none focus:border-primary" value={newHospital.address} onChange={e => setNewHospital({...newHospital, address: e.target.value})} placeholder="Enter hospital full address..." />
                </div>
                <button onClick={handleAddHospitalSubmit} className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-4 shadow-xl active:scale-95 transition-all">Confirm Registration</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'review' && selectedHospital) {
    const bank = COMPANY_BANK_ACCOUNTS.find(b => b.name === selectedBank) || COMPANY_BANK_ACCOUNTS[0];

    return (
      <div className="flex flex-col items-center bg-gray-200/50 p-4 sm:p-10 min-h-screen print:bg-white print:p-0">
        <div className="mb-8 flex gap-4 print:hidden">
          <button onClick={() => setViewMode('create')} className="bg-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow transition hover:bg-gray-50 border-2 border-gray-100">Edit Details</button>
          <button onClick={handleFinalSave} className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-secondary transition flex items-center gap-2"><Save size={16}/> Save to Database</button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-black transition flex items-center gap-2"><Printer size={16}/> Print Bill</button>
        </div>

        <div id="invoice-printable-area" className="bg-white shadow-2xl p-[15mm] w-full max-w-[900px] min-h-[297mm] flex flex-col border-4 border-white print:border-0 print:shadow-none print:p-[5mm]">
          {/* Header */}
          <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-6">
            <div className="flex items-center gap-6">
              <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-[#3159a6] text-white px-6 py-2 mb-3 rounded-lg">
                <h2 className="text-lg font-black uppercase tracking-widest text-center">Service Invoice</h2>
              </div>
              <p className="text-sm font-black text-slate-900 uppercase"># {generateInvoiceId()}</p>
              <p className="text-[11px] font-black text-slate-700 uppercase mt-1 tracking-widest">DATE: {new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest border-b pb-1">Bill To:</h4>
              <p className="font-black text-2xl text-slate-900 uppercase tracking-tight mb-2">{selectedHospital.name}</p>
              <p className="text-xs text-slate-700 font-bold uppercase leading-relaxed min-h-[60px] italic">"{selectedHospital.address}"</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {selectedHospital.gstin && <p className="text-[10px] font-black text-[#3159a6] uppercase">GSTIN: {selectedHospital.gstin}</p>}
                {selectedHospital.pan && <p className="text-[10px] font-black text-slate-600 uppercase">PAN: {selectedHospital.pan}</p>}
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Clinic Identity</h4>
                <p className="font-black text-[12px] text-slate-900 uppercase tracking-tight mb-1">{COMPANY_NAME}</p>
                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight leading-tight">{COMPANY_ADDRESS}</p>
                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight mt-2">PH: {COMPANY_PHONES}</p>
                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">{COMPANY_EMAIL} | GSTIN: {CLINIC_GSTIN}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full border-collapse border-4 border-slate-900 text-xs font-bold">
              <thead className="bg-[#3159a6] text-white uppercase font-black">
                <tr>
                  <th className="p-4 text-center border-r-2 border-white/20 w-16">Sl No.</th>
                  <th className="p-4 text-left border-r-2 border-white/20">Description of Service</th>
                  <th className="p-4 text-center border-r-2 border-white/20">HSN</th>
                  <th className="p-4 text-center border-r-2 border-white/20">Qty</th>
                  <th className="p-4 text-right border-r-2 border-white/20">Rate</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="uppercase text-slate-900">
                {invoiceLines.map((line, idx) => (
                  <tr key={line.id} className="border-b-2 border-slate-300 last:border-b-4 last:border-slate-900">
                    <td className="p-4 text-center border-r-2 border-slate-900">{idx + 1}</td>
                    <td className="p-4 border-r-2 border-slate-900 font-black">
                        {line.description}
                        {line.discount > 0 && <p className="text-[8px] text-red-500 font-black tracking-widest mt-1">LESS: ₹{line.discount.toLocaleString()} ITEM DISCOUNT</p>}
                    </td>
                    <td className="p-4 text-center border-r-2 border-slate-900 font-mono">{line.hsn}</td>
                    <td className="p-4 text-center border-r-2 border-slate-900">{line.qty}</td>
                    <td className="p-4 text-right border-r-2 border-slate-900">₹{line.rate.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right font-black bg-slate-50">₹{line.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
               {notes && (
                  <div className="bg-blue-50/50 p-6 rounded-3xl border-2 border-dashed border-blue-200">
                    <h4 className="text-[10px] font-black uppercase text-[#3159a6] mb-2 border-b border-blue-100 pb-1 tracking-widest">Invoicing Remarks:</h4>
                    <p className="text-xs text-slate-800 italic leading-relaxed font-semibold uppercase">"{notes}"</p>
                  </div>
               )}
               <div className="bg-[#3159a6] text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg">
                  Amount in Words: {numberToWords(total)}
               </div>
            </div>
            
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Landmark size={120}/></div>
               <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span>Gross Subtotal</span>
                    <span>₹{lineSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-red-400">
                    <span>Line Item Discount</span>
                    <span>-₹{totalItemDiscount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-red-400">
                    <span>Special Consideration</span>
                    <span>-₹{globalAdjustment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span>GST Applied (0%)</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="h-0.5 bg-white/10 my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-[#3159a6]">Net Total</span>
                    <span className="text-4xl font-black tracking-tighter">₹{total.toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-auto">
            {/* Bank Details */}
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-8 w-full">
              <h5 className="text-[10px] font-black uppercase text-[#3159a6] tracking-[0.2em] mb-2 border-b border-slate-200 pb-1">Bank Settlement Node:</h5>
              <div className="grid grid-cols-4 text-[10px] uppercase font-black text-slate-800">
                <p><span className="text-slate-400 mr-2">Bank:</span>{bank.name}</p>
                <p><span className="text-slate-400 mr-2">A/C:</span>{bank.accountNumber}</p>
                <p><span className="text-slate-400 mr-2">IFSC:</span>{bank.ifsc}</p>
                <p className="text-right"><span className="text-slate-400 mr-2">Branch:</span>{bank.branch}</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="w-[65%]">
                <p className="font-black text-[11px] uppercase border-b-4 border-slate-900 inline-block mb-3 tracking-widest">Legal Terms & Conditions</p>
                <div className="text-[9px] text-slate-800 font-bold space-y-1.5 uppercase leading-tight tracking-tight pr-8">
                  <p>1. Please keep this Invoice safe for future correspondence.</p>
                  <p>2. Our Udyam Registration Certificate No. UDYAM-WB-18-0032916 (Micro Enterprise).</p>
                  <p>3. Under the current taxation regime, all healthcare services doctors and hospitals provide are exempt from GST. These exemptions were provided vide Notifications No. 12/2017-Central Tax (Rate) and 9/2017 – Integrated Tax (R) dated 28th June 2017.</p>
                  <p>4. Hearing aids are classifiable under HSN 9021 40 90 and are exempt from GST by virtue of Sl.No 142 of Notf No 2/2017 CT(Rate) dated 28-06-2017.</p>
                </div>
              </div>
              <div className="text-center w-60">
                {signature ? <img src={signature} className="h-20 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-full border-b-4 border-dashed border-slate-200 mb-2"></div>}
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-t-4 border-slate-900 pt-2">Authorized Signatory</p>
              </div>
            </div>
            <div className="mt-12 text-center opacity-30 pb-4 print:opacity-10">
              <p className="text-[9px] font-black uppercase tracking-[0.8em] text-slate-600">BENGAL REHABILITATION & RESEARCH PVT. LTD.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
