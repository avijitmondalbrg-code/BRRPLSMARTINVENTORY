import React, { useState, useMemo } from 'react';
import { AdvanceBooking, Patient, UserRole } from '../types';
import { Search, Plus, X, Printer, IndianRupee, Phone, Briefcase, Calendar, Trash2, MapPin, User as UserIcon } from 'lucide-react';

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
  
  const [formData, setFormData] = useState<Partial<AdvanceBooking>>({ 
    patientName: '', 
    phone: '', 
    address: '',
    amount: 0, 
    modelInterest: '', 
    paymentMethod: 'Cash' 
  });

  const handleSelectPatient = (p: Patient) => {
    setFormData({
      ...formData,
      patientId: p.id,
      patientName: p.name,
      phone: p.phone,
      address: p.address
    });
    setPatientSearchTerm('');
    setShowPatientResults(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBooking({ 
      ...formData, 
      id: `ADV-${Date.now()}`, 
      date: new Date().toISOString().split('T', 1)[0], 
      status: 'Active' 
    } as AdvanceBooking);
    setShowAddModal(false);
    setFormData({ patientName: '', phone: '', address: '', amount: 0, modelInterest: '', paymentMethod: 'Cash' });
  };

  const filteredBookings = useMemo(() => {
    return bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="text-primary" /> Advance Bookings</h2>
          <p className="text-sm text-gray-500">Track and manage patient advance payments for future device purchases.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-teal-800 transition">
          <Plus size={20} /> Create Receipt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed">
            No active advance bookings found.
          </div>
        ) : filteredBookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-lg text-gray-800">{booking.patientName}</h3>
                <p className="text-xs text-gray-400 font-mono">#{booking.id}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase border ${
                booking.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {booking.status}
              </span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400"/> {booking.phone}</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14} className="text-gray-400"/> <span className="truncate">{booking.address || 'No address provided'}</span></div>
              <div className="flex items-center gap-2 text-sm font-bold bg-teal-50 px-3 py-1 rounded-lg text-teal-800"><IndianRupee size={14}/> {booking.amount.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedBooking(booking)} className="flex-1 py-2 text-xs font-black uppercase bg-teal-50 text-teal-700 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-100 transition"><Printer size={14}/> View Receipt</button>
              {userRole === 'admin' && <button onClick={() => { if(window.confirm('Delete this advance receipt?')) onDeleteBooking(booking.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-primary p-5 text-white flex justify-between items-center font-black uppercase">
              <h3>New Advance Receipt</h3>
              <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* Patient Lookup */}
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Choose Existing Patient (Optional)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by name or phone..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition"
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      setShowPatientResults(true);
                    }}
                  />
                </div>
                {showPatientResults && patientSearchTerm && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border max-h-48 overflow-y-auto divide-y">
                    {patients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || p.phone.includes(patientSearchTerm)).map(p => (
                      <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left px-4 py-2.5 hover:bg-teal-50 transition flex justify-between items-center">
                        <div><p className="font-bold text-gray-800 text-sm">{p.name}</p><p className="text-xs text-gray-500">{p.phone}</p></div>
                        <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Patient Name *</label>
                  <input required placeholder="Name" className="w-full border-b p-2 outline-none text-sm focus:border-teal-500 transition" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone Number *</label>
                  <input required placeholder="Phone" className="w-full border-b p-2 outline-none text-sm focus:border-teal-500 transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Address</label>
                <input placeholder="Address details..." className="w-full border-b p-2 outline-none text-sm focus:border-teal-500 transition" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Advance Amount *</label>
                  <input required type="number" placeholder="₹ 0.00" className="w-full border-b p-2 outline-none font-black text-teal-700 text-lg focus:border-teal-500 transition" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Payment Method</label>
                  <select className="w-full border-b p-2 outline-none text-sm bg-white focus:border-teal-500 transition" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Account Transfer">Account Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Model Interest</label>
                <input placeholder="e.g. Phonak Lumity L90" className="w-full border-b p-2 outline-none text-sm focus:border-teal-500 transition" value={formData.modelInterest} onChange={e => setFormData({...formData, modelInterest: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-6 shadow-xl shadow-teal-900/20 hover:bg-teal-800 transition active:scale-[0.98]">Confirm & Issue Receipt</button>
            </form>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 print:absolute print:inset-0">
          <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden print:w-full">
            <div className="bg-teal-700 p-4 flex justify-between items-center text-white print:hidden">
              <h3 className="font-bold flex items-center gap-2"><Briefcase size={18}/> Receipt Preview</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-white text-teal-700 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-50 transition"><Printer size={16}/> Print</button>
                <button onClick={() => setSelectedBooking(null)} className="hover:text-teal-200 transition"><X size={24}/></button>
              </div>
            </div>
            <div id="receipt-printable-area" className="p-10 bg-white">
              <div className="flex justify-between border-b-2 border-gray-800 pb-6 mb-8">
                <div className="flex gap-4">
                  <img src={logo} alt="Logo" className="h-20 w-20 object-contain" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase leading-tight">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 italic">Hospital Based Hearing Chain</p>
                    <p className="text-[8px] text-gray-400 uppercase mt-2 font-bold">GSTIN: 19AALCB1534C1ZY</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="border-2 border-gray-800 px-4 py-1 inline-block mb-2">
                    <h2 className="text-lg font-bold uppercase tracking-widest">Advance Receipt</h2>
                  </div>
                  <p className="text-xs text-gray-600 font-bold tracking-tight">No: {selectedBooking.id}</p>
                  <p className="text-xs text-gray-600 font-bold tracking-tight">Date: {new Date(selectedBooking.date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              
              <div className="space-y-10 text-sm text-gray-800 leading-loose">
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>Received with thanks from Mr./Mrs./Ms.</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900 text-lg">{selectedBooking.patientName}</span>
                </div>

                {selectedBooking.address && (
                  <div className="flex flex-wrap gap-2 items-baseline">
                    <span>Residing at</span>
                    <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-700">{selectedBooking.address}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>An amount of Rupees</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900 text-lg">₹ {selectedBooking.amount.toLocaleString('en-IN')} /-</span>
                </div>
                
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>As advance booking for:</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-700 italic">{selectedBooking.modelInterest || 'General Device Booking'}</span>
                </div>

                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>Paid via</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-700">{selectedBooking.paymentMethod}</span>
                </div>
              </div>

              <div className="mt-24 flex justify-between items-end">
                <div className="border-2 border-gray-800 p-5 rounded-2xl bg-gray-50 flex flex-col gap-1">
                  <p className="text-[10px] uppercase text-gray-400 font-black tracking-[0.2em]">Net Received</p>
                  <p className="text-3xl font-black text-gray-900">₹ {selectedBooking.amount.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  {signature ? (
                    <img src={signature} className="h-16 mb-2 mx-auto mix-blend-multiply" alt="Sign" />
                  ) : (
                    <div className="h-16 w-48 border-b-2 border-dashed border-gray-200 mb-2"></div>
                  )}
                  <p className="text-[10px] font-black uppercase text-gray-800 tracking-widest">Authorized Signatory</p>
                </div>
              </div>

              <div className="mt-12 pt-4 border-t border-gray-100 text-[9px] text-gray-400 text-center uppercase tracking-widest font-bold">
                Subject to Kolkata Jurisdiction • Valid for 30 days against final tax invoice.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};