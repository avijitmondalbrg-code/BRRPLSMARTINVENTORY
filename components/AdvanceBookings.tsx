import React, { useState, useMemo } from 'react';
import { AdvanceBooking, Patient, UserRole } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, CLINIC_GSTIN, getFinancialYear } from '../constants';
import { Search, Plus, X, Printer, IndianRupee, Phone, Briefcase, Trash2, MapPin } from 'lucide-react';

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

export const AdvanceBookings: React.FC<AdvanceBookingsProps> = ({ bookings, patients, onAddBooking, onDeleteBooking, userRole, logo, signature }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdvanceBooking | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [formData, setFormData] = useState<Partial<AdvanceBooking>>({ patientName: '', phone: '', address: '', amount: 0, modelInterest: '', paymentMethod: 'Cash' });

  // FIX: Use dashes instead of slashes to keep Firestore happy
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
        alert("Please fill name, phone, and amount.");
        return;
    }
    onAddBooking({ ...formData, id: generateNextId(), date: new Date().toISOString().split('T', 1)[0], status: 'Active' } as AdvanceBooking);
    setShowAddModal(false);
    setFormData({ patientName: '', phone: '', address: '', amount: 0, modelInterest: '', paymentMethod: 'Cash' });
    setPatientSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="text-primary" /> Advance Bookings</h2><p className="text-sm text-gray-500">Track patient advance payments.</p></div><button onClick={() => setShowAddModal(true)} className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-teal-800 transition"><Plus size={20} /> Create Receipt</button></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.length === 0 ? (
            <div className="col-span-full p-20 text-center bg-white rounded-3xl border border-dashed text-gray-400">No advance bookings found. Click "Create Receipt" to add.</div>
        ) : bookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4"><div><h3 className="font-black text-lg text-gray-800">{booking.patientName}</h3><p className="text-xs text-gray-400 font-mono">#{booking.id}</p></div><span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase border bg-green-50 text-green-700 border-green-200">{booking.status}</span></div>
            <div className="space-y-2 mb-6"><div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14}/> {booking.phone}</div><div className="flex items-center gap-2 text-sm font-bold bg-teal-50 px-3 py-1 rounded-lg text-teal-800"><IndianRupee size={14}/> {booking.amount.toLocaleString()}</div></div>
            <div className="flex gap-2"><button onClick={() => setSelectedBooking(booking)} className="flex-1 py-2 text-xs font-black uppercase bg-teal-50 text-teal-700 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-100"><Printer size={14}/> View Receipt</button>{userRole === 'admin' && <button onClick={() => { if(window.confirm('Delete this record?')) onDeleteBooking(booking.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>}</div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in my-8">
            <div className="bg-primary p-5 text-white flex justify-between items-center font-black uppercase"><h3>New Advance Receipt</h3><button onClick={() => setShowAddModal(false)}><X size={24}/></button></div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-5">
              <div className="relative"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest">Existing Patient Search</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Name or Phone..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm outline-none" value={patientSearchTerm} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} /></div>{showPatientResults && patientSearchTerm && (<div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-32 overflow-y-auto">{patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p => (<button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left p-2 hover:bg-teal-50 border-b text-sm font-medium">{p.name}</button>))}</div>)}</div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block tracking-widest">Name *</label><input required className="w-full border-b p-2 outline-none text-sm" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} /></div><div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block tracking-widest">Phone *</label><input required className="w-full border-b p-2 outline-none text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block tracking-widest">Advance Amount (INR) *</label><input required type="number" className="w-full border-b p-2 outline-none font-black text-teal-700 text-lg" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block tracking-widest">Model Choice</label><input className="w-full border-b p-2 outline-none text-sm" value={formData.modelInterest} onChange={e => setFormData({...formData, modelInterest: e.target.value})} /></div>
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-teal-800 transition-all active:scale-95">Issue Receipt</button>
            </form>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 overflow-y-auto animate-fade-in print:absolute print:inset-0 print:overflow-visible">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-4 sm:my-8 max-h-[95vh] flex flex-col print:max-h-none print:my-0 print:shadow-none print:rounded-none">
            {/* STICKY HEADER FOR SCREEN */}
            <div className="bg-teal-700 p-4 flex justify-between items-center text-white sticky top-0 z-20 print:hidden flex-shrink-0">
              <h3 className="font-bold flex items-center gap-2">Advance Receipt Preview</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-white text-teal-700 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow hover:bg-teal-50 transition-colors">
                  <Printer size={16}/> Print Receipt
                </button>
                <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-teal-600 rounded-lg transition-colors">
                  <X size={24}/>
                </button>
              </div>
            </div>

            {/* SCROLLABLE RECEIPT CONTENT */}
            <div id="receipt-printable-area" className="p-8 sm:p-12 bg-white overflow-y-auto flex-grow custom-scrollbar print:overflow-visible">
              <div className="flex justify-between border-b-2 border-gray-800 pb-8 mb-8">
                <div className="flex gap-6">
                  <img src={logo} alt="Logo" className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-gray-800 uppercase leading-none">{COMPANY_NAME}</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-2 italic">{COMPANY_TAGLINE}</p>
                    <p className="text-[10px] text-gray-500 mt-3 leading-relaxed max-w-sm hidden sm:block">{COMPANY_ADDRESS}</p>
                    <p className="text-[10px] text-gray-400 uppercase mt-2 font-bold">GSTIN: {CLINIC_GSTIN}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="border-2 border-gray-800 px-3 py-1 inline-block mb-2 sm:mb-3">
                    <h2 className="text-sm sm:text-lg font-black uppercase tracking-widest">Advance Receipt</h2>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase">Receipt No: {selectedBooking.id}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Date: {new Date(selectedBooking.date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="space-y-10 text-sm sm:text-base leading-loose text-gray-800 font-medium py-4">
                <div className="flex flex-wrap gap-2 items-baseline"><span>Received with thanks from Mr./Mrs./Ms.</span><span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900 text-lg sm:text-xl">{selectedBooking.patientName}</span></div>
                <div className="flex flex-wrap gap-2 items-baseline"><span>Residing at</span><span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-700">{selectedBooking.address || '____________________________________________________'}</span></div>
                <div className="flex flex-wrap gap-2 items-baseline"><span>An amount of Rupees</span><span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900 text-lg sm:text-xl">₹ {selectedBooking.amount.toLocaleString('en-IN')} /-</span></div>
                <div className="flex flex-wrap gap-2 items-baseline"><span>As advance booking for hearing device model</span><span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-700 italic">{selectedBooking.modelInterest || 'General Device Order'}</span></div>
              </div>

              <div className="mt-20 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-10 sm:gap-0">
                <div className="border-4 border-gray-800 p-5 sm:p-6 rounded-3xl bg-gray-50 text-center flex flex-col gap-1 w-full sm:w-auto shadow-sm">
                  <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Net Cash Received</p>
                  <p className="text-3xl sm:text-4xl font-black text-gray-900">₹ {selectedBooking.amount.toLocaleString()}</p>
                </div>
                <div className="text-center w-full sm:w-auto">
                  {signature ? <img src={signature} className="h-16 sm:h-20 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-20 w-48 sm:w-56 border-b-2 border-dashed border-gray-300 mb-2"></div>}
                  <p className="text-[10px] font-black uppercase text-gray-800 tracking-[0.2em]">Authorized Signatory</p>
                </div>
              </div>

              <div className="mt-16 pt-6 border-t border-gray-100 text-[9px] text-gray-400 text-center uppercase tracking-widest font-bold">
                Bengal Rehabilitation & Research Pvt. Ltd. • Subject to Kolkata Jurisdiction
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};