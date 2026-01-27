import React, { useState, useEffect } from 'react';
import { AdvanceBooking, Patient, UserRole } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, CLINIC_GSTIN, getFinancialYear, COMPANY_BANK_ACCOUNTS } from '../constants';
import { Search, Plus, X, Printer, IndianRupee, Phone, Briefcase, Trash2, MapPin, Download, Settings2 } from 'lucide-react';

interface AdvanceBookingsProps {
  bookings: AdvanceBooking[];
  patients: Patient[];
  onAddBooking: (booking: AdvanceBooking) => void;
  onUpdateBooking: (booking: AdvanceBooking) => void;
  onDeleteBooking: (id: string) => void;
  userRole: UserRole;
  logo: string;
  signature: string | null;
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

export const AdvanceBookings: React.FC<AdvanceBookingsProps> = ({ bookings, patients, onAddBooking, onDeleteBooking, userRole, logo, signature }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdvanceBooking | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  // Print Settings
  const [printScale, setPrintScale] = useState(100);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');

  const [formData, setFormData] = useState<Partial<AdvanceBooking>>({ 
    patientName: '', 
    phone: '', 
    address: '', 
    amount: 0, 
    modelInterest: '', 
    paymentMethod: 'Cash',
    bankDetails: ''
  });

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL-AD-${fy}-`;
    const sameFyBookings = bookings.filter(b => b.id.startsWith(prefix));
    if (sameFyBookings.length === 0) return `${prefix}001`;
    const numbers = sameFyBookings.map(b => {
        const parts = b.id.split('-');
        return parseInt(parts[parts.length - 1], 10);
    }).filter(n => !isNaN(n));
    const nextNo = Math.max(...numbers, 0) + 1;
    return `${prefix}${nextNo.toString().padStart(3, '0')}`;
  };

  const handleSelectPatient = (p: Patient) => { 
    setFormData({ ...formData, patientId: p.id, patientName: p.name, phone: p.phone, address: p.address }); 
    setShowPatientResults(false); 
    setPatientSearchTerm(p.name);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone || !formData.amount) {
        alert("Verification failed: Mandatory fields empty.");
        return;
    }
    onAddBooking({ 
      ...formData, 
      id: generateNextId(), 
      date: new Date().toISOString().split('T')[0], 
      status: 'Active' 
    } as AdvanceBooking);
    setShowAddModal(false);
    setFormData({ 
      patientName: '', 
      phone: '', 
      address: '', 
      amount: 0, 
      modelInterest: '', 
      paymentMethod: 'Cash',
      bankDetails: ''
    });
    setPatientSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Briefcase className="text-primary" /> Advance Collections
          </h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Pre-order Management</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/30 hover:bg-slate-800 transition-all active:scale-95">
          <Plus size={18} /> Issue Token Receipt
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {bookings.length === 0 ? (
            <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-50 flex flex-col items-center">
              <div className="p-6 bg-blue-50 rounded-full text-primary mb-6"><Briefcase size={40} /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">No active advance records found</p>
            </div>
        ) : bookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-2xl transition-all group border-b-4 border-b-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><IndianRupee size={80}/></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="font-black text-xl text-gray-800 uppercase tracking-tighter leading-none">{booking.patientName}</h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 uppercase">TOKEN: {booking.id}</p>
              </div>
              <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest border-2 ${booking.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                {booking.status}
              </span>
            </div>
            <div className="space-y-4 mb-8 relative z-10">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500"><Phone size={14} className="text-primary"/> {booking.phone}</div>
              <div className="flex items-center gap-3 text-2xl font-black bg-blue-50/50 px-5 py-4 rounded-2xl text-primary tracking-tighter border-2 border-blue-50 shadow-inner">
                <IndianRupee size={20} strokeWidth={3}/> {booking.amount.toLocaleString()}
              </div>
              <div className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                {booking.paymentMethod} • {booking.bankDetails || 'Direct Node'}
              </div>
            </div>
            <div className="flex gap-3 relative z-10">
              <button onClick={() => setSelectedBooking(booking)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-primary text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 shadow-xl shadow-blue-900/20 transition-all">
                <Printer size={14}/> View Document
              </button>
              {userRole === 'admin' && (
                <button onClick={() => { if(window.confirm('Erase this record from database?')) onDeleteBooking(booking.id); }} className="p-4 text-red-400 hover:bg-red-50 rounded-2xl border-2 border-gray-50 transition-all">
                  <Trash2 size={18}/>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in my-8 border-4 border-white">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">Advance Token Issuance</h3>
              <button onClick={() => setShowAddModal(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-10 space-y-6">
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Client Lookup</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search registry..." 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm outline-none focus:border-primary focus:bg-white font-bold transition" 
                    value={patientSearchTerm} 
                    onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} 
                  />
                </div>
                {showPatientResults && patientSearchTerm && (
                  <div className="absolute z-10 w-full bg-white border-2 border-gray-50 rounded-2xl shadow-2xl mt-2 max-h-48 overflow-y-auto custom-scrollbar p-2">
                    {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p => (
                      <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left px-5 py-3 hover:bg-blue-50 rounded-xl border-b border-gray-50 last:border-0 font-black uppercase tracking-tighter text-xs text-gray-700">{p.name}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest ml-1">Consignee *</label>
                  <input required className="w-full border-2 border-gray-50 bg-gray-50 p-3 rounded-2xl outline-none font-bold focus:border-primary focus:bg-white transition" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest ml-1">Mobile *</label>
                  <input required className="w-full border-2 border-gray-50 bg-gray-50 p-3 rounded-2xl outline-none font-bold focus:border-primary focus:bg-white transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 mb-2 block tracking-widest ml-1 uppercase">Method</label>
                  <select 
                    className="w-full border-2 border-gray-50 bg-gray-50 p-3 rounded-2xl outline-none font-black text-primary focus:border-primary transition uppercase text-[10px]" 
                    value={formData.paymentMethod} 
                    onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                  >
                    <option value="Cash">Cash Ledger</option>
                    <option value="UPI">UPI Digital</option>
                    <option value="Account Transfer">Bank RTGS/IMPS</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Credit Card">Card Swipe</option>
                    <option value="EMI">Finance EMI</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 mb-2 block tracking-widest ml-1 uppercase">Settlement Bank</label>
                  <select 
                    className="w-full border-2 border-gray-50 bg-gray-50 p-3 rounded-2xl outline-none font-black text-indigo-700 focus:border-primary transition uppercase text-[10px]" 
                    value={formData.bankDetails} 
                    onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                  >
                    <option value="">None (Vault)</option>
                    {COMPANY_BANK_ACCOUNTS.map(bank => (
                      <option key={bank.name} value={bank.name}>{bank.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest ml-1">Net Advance (INR) *</label>
                <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20}/>
                    <input required type="number" className="w-full pl-12 border-2 border-gray-50 bg-gray-50 p-4 rounded-2xl outline-none font-black text-primary text-2xl focus:border-primary focus:bg-white shadow-inner transition" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest ml-1">Pre-order Specification</label>
                <input className="w-full border-2 border-gray-50 bg-gray-50 p-3 rounded-2xl outline-none font-medium text-sm focus:border-primary focus:bg-white transition" placeholder="e.g. Booking for Phonak Audéo L90-R" value={formData.modelInterest} onChange={e => setFormData({...formData, modelInterest: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all active:scale-95 text-[10px] mt-4">Confirm Payment Receipt</button>
            </form>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 z-[130] flex flex-col items-center justify-start p-4 overflow-y-auto animate-fade-in backdrop-blur-xl print:bg-white print:p-0 print:block">
          
          {/* Print Controls */}
          <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 flex flex-wrap items-center gap-8 border border-gray-100 print:hidden w-full max-w-[900px] mt-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-primary"><Settings2 size={18}/></div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Receipt Print Settings</h4>
              </div>
              
              <div className="flex items-center gap-4 border-l pl-8">
                  <label className="text-[10px] font-black uppercase text-gray-400">Scale</label>
                  <input type="range" min="60" max="100" value={printScale} onChange={(e) => setPrintScale(Number(e.target.value))} className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                  <span className="text-xs font-black text-primary w-8">{printScale}%</span>
              </div>

              <div className="flex items-center gap-4 border-l pl-8">
                  <label className="text-[10px] font-black uppercase text-gray-400">Layout</label>
                  <select className="text-[10px] font-black uppercase tracking-widest border rounded-lg px-3 py-2 outline-none" value={printOrientation} onChange={(e) => setPrintOrientation(e.target.value as any)}>
                      <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                  </select>
              </div>

              <div className="flex-1 flex justify-end gap-3">
                  <button onClick={() => window.print()} className="bg-primary text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"><Printer size={16}/> Print Now</button>
                  <button onClick={() => setSelectedBooking(null)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-gray-800 rounded-2xl transition-all"><X size={20}/></button>
              </div>
          </div>

          <div 
            id="invoice-printable-area" 
            style={{ 
                '--print-scale': `${printScale / 100}`,
                '--print-orientation': printOrientation,
                '--print-size': printPaperSize === 'A4' ? '210mm 297mm' : printPaperSize === 'Letter' ? '216mm 279mm' : '216mm 356mm'
            } as React.CSSProperties}
            className="bg-white rounded-none w-full max-w-[900px] overflow-hidden shadow-2xl relative p-[15mm] flex flex-col print:shadow-none print:p-[10mm]"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] select-none pointer-events-none -rotate-12"><IndianRupee size={400}/></div>
            
            <div className="flex justify-between border-b-4 border-gray-900 pb-12 mb-12 relative z-10">
              <div className="flex gap-8">
                <div className="h-24 w-24 flex items-center justify-center border-2 border-gray-50 rounded-3xl p-2"><img src={logo} alt="Logo" className="h-full w-full object-contain" /></div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 uppercase leading-none tracking-tighter">{COMPANY_NAME}</h1>
                  <p className="text-[10px] text-gray-700 font-black uppercase mt-3 tracking-[0.2em] italic">{COMPANY_TAGLINE}</p>
                  <p className="text-[9px] text-gray-800 font-bold uppercase mt-4 leading-relaxed max-w-sm">{COMPANY_ADDRESS}</p>
                  <p className="text-[10px] text-gray-900 uppercase mt-4 font-black tracking-widest">GSTIN: {CLINIC_GSTIN}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-primary text-white px-6 py-2 inline-block mb-4 rounded-xl shadow-lg">
                  <h2 className="text-sm font-black uppercase tracking-[0.4em]">Advance Token</h2>
                </div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest">REC NO: {selectedBooking.id}</p>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest mt-1">DATE: {new Date(selectedBooking.date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-12 text-lg leading-loose text-gray-900 font-bold py-8 relative z-10">
              <div className="flex flex-wrap gap-4 items-baseline"><span>Received with thanks from Mr./Mrs./Ms.</span><span className="border-b-2 border-gray-200 flex-grow px-4 font-black text-primary text-3xl uppercase tracking-tighter">{selectedBooking.patientName}</span></div>
              <div className="flex flex-wrap gap-4 items-baseline"><span>Residing at</span><span className="border-b-2 border-gray-200 flex-grow px-4 font-black text-gray-800 uppercase tracking-tight text-sm">{selectedBooking.address || '____________________________________________________________________'}</span></div>
              <div className="flex flex-wrap gap-4 items-baseline"><span>A sum of Indian Rupees</span><span className="border-b-2 border-gray-200 flex-grow px-4 font-black text-primary text-3xl tracking-tighter">₹ {selectedBooking.amount.toLocaleString('en-IN')} /-</span></div>
              <div className="flex flex-wrap gap-4 items-baseline"><span>By <b> {selectedBooking.paymentMethod} </b> {selectedBooking.bankDetails ? `deposited in <b> ${selectedBooking.bankDetails} </b>` : ''} towards booking of</span><span className="border-b-2 border-gray-200 flex-grow px-4 font-black text-gray-900 italic tracking-tighter leading-tight">{selectedBooking.modelInterest || 'General Medical Order'}</span></div>
            </div>

            <div className="bg-primary/5 p-4 rounded-xl text-center mb-12 border-2 border-dashed border-primary/20">
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Rupees in Words</p>
                <p className="text-sm font-black text-gray-800 mt-1">{numberToWords(selectedBooking.amount)}</p>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row justify-between items-center sm:items-end gap-16 relative z-10 pt-12">
              <div className="bg-primary p-10 rounded-[2.5rem] text-center flex flex-col gap-2 w-full sm:w-auto shadow-2xl relative">
                <div className="absolute -top-4 -left-4 bg-white p-2 rounded-full text-primary shadow-lg border border-blue-50"><IndianRupee size={16}/></div>
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black text-blue-100 tracking-[0.4em] mb-1 opacity-80">Net Advance Total</p>
                  <p className="text-5xl font-black text-white tracking-tighter">₹{selectedBooking.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-center w-full sm:w-auto pb-4">
                {signature ? <img src={signature} className="h-24 mb-4 mx-auto mix-blend-multiply opacity-90 transition-transform hover:scale-105" /> : <div className="h-24 w-64 border-b-4 border-dashed border-gray-100 mb-4"></div>}
                <p className="text-[10px] font-black uppercase text-gray-900 tracking-[0.4em] border-t-2 border-gray-900 pt-3">Authorized Signatory</p>
              </div>
            </div>

            <div className="mt-20 pt-10 border-t-2 border-gray-100 text-[10px] text-gray-300 text-center uppercase tracking-[0.5em] font-black select-none">
              Bengal Rehabilitation & Research Pvt. Ltd.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};