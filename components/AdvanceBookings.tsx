import React, { useState } from 'react';
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
    resetFormData();
  };

  const resetFormData = () => {
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
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Briefcase className="text-primary" /> Advance Collections
          </h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Pre-order Management</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95">
          <Plus size={18} /> Issue Token Receipt
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
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
            </div>
            <div className="flex gap-3 relative z-10">
              <button onClick={() => setSelectedBooking(booking)} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest bg-primary text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-md overflow-y-auto print:hidden">
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
                <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest ml-1">Consignee *</label><input required className="w-full border-2 border-gray-50 bg-gray-50 p-3 rounded-2xl outline-none font-bold focus:border-primary focus:bg-white transition" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} /></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest ml-1">Mobile *</label><input required className="w-full border-2 border-gray-50 bg-gray-50 p-3 rounded-2xl outline-none font-bold focus:border-primary focus:bg-white transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 mb-2 block tracking-widest ml-1 uppercase">Method</label>
                  <select className="w-full border-2 border-gray-100 bg-gray-50 p-3 rounded-2xl outline-none font-black text-primary focus:border-primary transition uppercase text-[10px]" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}>
                    <option value="Cash">Cash Ledger</option><option value="UPI">UPI Digital</option><option value="Account Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 mb-2 block tracking-widest ml-1 uppercase">Net Advance *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16}/>
                    <input required type="number" className="w-full pl-8 border-2 border-gray-100 bg-gray-50 p-3 rounded-2xl outline-none font-black text-primary focus:border-primary transition shadow-inner" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest ml-1">Pre-order Specification</label>
                <input className="w-full border-2 border-gray-100 bg-gray-50 p-3 rounded-2xl outline-none font-medium text-sm focus:border-primary focus:bg-white transition" placeholder="e.g. Booking for Phonak BTE" value={formData.modelInterest} onChange={e => setFormData({...formData, modelInterest: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-[10px]">Confirm Payment Receipt</button>
            </form>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 z-[130] flex flex-col items-center justify-start p-4 sm:p-10 overflow-y-auto animate-fade-in backdrop-blur-xl print:bg-white print:p-0 print:block">
          
          <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 flex flex-wrap items-center gap-8 border border-gray-100 print:hidden w-full max-w-[900px] flex-shrink-0 animate-fade-in-up">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-primary"><Settings2 size={18}/></div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Document Settings</h4>
              </div>
              
              <div className="flex items-center gap-4 border-l pl-8">
                  <label className="text-[10px] font-black uppercase text-gray-400">Zoom</label>
                  <input type="range" min="60" max="100" value={printScale} onChange={(e) => setPrintScale(Number(e.target.value))} className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                  <span className="text-xs font-black text-primary w-8">{printScale}%</span>
              </div>

              <div className="flex items-center gap-4 border-l pl-8">
                  <label className="text-[10px] font-black uppercase text-gray-400">Layout</label>
                  <select className="text-[10px] font-black uppercase tracking-widest border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary" value={printOrientation} onChange={(e) => setPrintOrientation(e.target.value as any)}>
                      <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                  </select>
              </div>

              <div className="flex-1 flex justify-end gap-3">
                  <button onClick={() => window.print()} className="bg-primary text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"><Printer size={16}/> Print Now</button>
                  <button onClick={() => setSelectedBooking(null)} className="p-3 bg-gray-100 text-gray-400 hover:text-gray-800 rounded-2xl transition-all"><X size={20}/></button>
              </div>
          </div>

          <div 
            id="invoice-printable-area" 
            style={{ 
                '--print-scale': `${printScale / 100}`,
                '--print-orientation': printOrientation,
                '--print-size': 'A4'
            } as React.CSSProperties}
            className="bg-white rounded-none w-full max-w-[900px] relative p-[15mm] flex flex-col print:p-0 print:shadow-none min-h-[297mm] shadow-[0_40px_80px_rgba(0,0,0,0.5)] mb-10 mx-auto overflow-hidden animate-fade-in bg-white"
          >
            {/* Watermark Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-12">
               <IndianRupee size={500}/>
            </div>

            {/* Header Section Matches Image */}
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex gap-6 items-start">
                <div className="h-28 w-28 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl p-1 border-2 border-slate-50">
                  <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                </div>
                <div className="max-w-md">
                  <h1 className="text-2xl font-black text-slate-900 uppercase leading-none tracking-tighter mb-2">{COMPANY_NAME}</h1>
                  <p className="text-[10px] text-slate-700 font-black uppercase italic leading-tight mb-4 tracking-tight">{COMPANY_TAGLINE}</p>
                  <div className="text-[9px] text-slate-500 font-bold uppercase space-y-1 leading-tight mb-2">
                    <p>{COMPANY_ADDRESS}</p>
                  </div>
                  <p className="text-[11px] text-slate-900 uppercase font-black tracking-widest">GSTIN: {CLINIC_GSTIN}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="bg-[#3159a6] text-white px-8 py-3 mb-4 rounded-xl shadow-lg">
                  <h2 className="text-xl font-black uppercase tracking-[0.3em] text-center leading-none">Advance<br/><span className="text-sm tracking-[0.5em]">Token</span></h2>
                </div>
                <div className="space-y-1.5 font-black text-slate-900 uppercase tracking-widest text-[11px]">
                  <p>REC NO: <span className="text-slate-800">{selectedBooking.id}</span></p>
                  <p>DATE: <span className="text-slate-800">{new Date(selectedBooking.date).toLocaleDateString('en-IN')}</span></p>
                </div>
              </div>
            </div>

            {/* Thick Horizontal Line */}
            <div className="h-1.5 bg-slate-900 w-full mb-12 relative z-10"></div>

            {/* Main Body with Fill-in Lines */}
            <div className="space-y-16 text-[18px] leading-loose text-slate-900 font-bold py-4 relative z-10 px-4">
              <div className="flex flex-wrap gap-4 items-baseline">
                <span className="whitespace-nowrap">Received with thanks from Mr./Mrs./Ms.</span>
                <span className="border-b-2 border-slate-300 flex-grow px-4 font-black text-[#3159a6] text-4xl uppercase tracking-tighter -mt-2">
                  {selectedBooking.patientName}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 items-baseline">
                <span className="whitespace-nowrap">Residing at</span>
                <span className="border-b-2 border-slate-300 flex-grow px-4 font-black text-slate-800 uppercase tracking-tight text-sm leading-tight italic">
                  {selectedBooking.address || '____________________________________________________________________________________'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 items-baseline">
                <span className="whitespace-nowrap">A sum of Indian Rupees</span>
                <span className="border-b-2 border-slate-300 flex-grow px-4 font-black text-[#3159a6] text-4xl tracking-tighter -mt-2">
                  ₹ {selectedBooking.amount.toLocaleString('en-IN')} /-
                </span>
              </div>
              
              <div className="flex flex-col gap-8">
                <div className="flex flex-wrap gap-4 items-baseline">
                   <span className="whitespace-nowrap">By <b className="text-[#3159a6] text-2xl ml-1">{selectedBooking.paymentMethod}</b> towards booking of</span>
                </div>
                <div className="border-b-2 border-slate-300 px-4 pb-2">
                  <span className="font-black text-slate-900 italic tracking-tighter text-lg uppercase block text-center">
                    {selectedBooking.modelInterest || 'GENERAL MEDICAL ORDER'}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount in Words Area */}
            <div className="mt-14 px-4 relative z-10">
              <div className="border-2 border-dashed border-[#3159a6]/30 p-8 rounded-2xl text-center bg-blue-50/20">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-3">Rupees in Words</p>
                  <p className="text-xl font-black text-slate-800 tracking-tight">{numberToWords(selectedBooking.amount)}</p>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto flex flex-col sm:flex-row justify-between items-center sm:items-end gap-16 relative z-10 pt-20 pb-12 px-4">
              <div className="bg-[#3159a6] p-10 px-12 rounded-[2.5rem] text-center flex flex-col gap-1 w-full sm:w-auto shadow-2xl relative">
                <div className="absolute -top-4 -left-4 bg-white p-2 rounded-full text-[#3159a6] shadow-lg border border-blue-50"><IndianRupee size={20}/></div>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase font-black text-blue-100 tracking-[0.4em] mb-1 opacity-80">Net Advance Total</p>
                  <p className="text-6xl font-black text-white tracking-tighter">₹{selectedBooking.amount.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="text-center w-full sm:w-80 pb-2">
                {signature ? (
                  <div className="h-32 mb-2 flex items-end justify-center">
                    <img src={signature} className="max-h-full object-contain mix-blend-multiply opacity-100 transition-transform scale-125" />
                  </div>
                ) : (
                  <div className="h-32 w-full border-b-2 border-dashed border-slate-200 mb-2"></div>
                )}
                <div className="h-[2px] bg-slate-900 w-full mb-3 shadow-sm"></div>
                <p className="text-[13px] font-black uppercase text-slate-900 tracking-[0.4em]">Authorized Signatory</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-[10px] text-slate-300 text-center uppercase tracking-[0.6em] font-black select-none opacity-40">
              Bengal Rehabilitation & Research Pvt. Ltd.
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};