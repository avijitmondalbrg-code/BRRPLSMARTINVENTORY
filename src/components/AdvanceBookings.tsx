import React, { useState, useMemo } from 'react';
import { AdvanceBooking, Patient, UserRole } from '../types';
import { COMPANY_BANK_ACCOUNTS } from '../constants';
import { Search, Plus, X, Printer, IndianRupee, User, Phone, Briefcase, Calendar, CheckCircle, ShieldAlert, Trash2 } from 'lucide-react';

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

export const AdvanceBookings: React.FC<AdvanceBookingsProps> = ({ 
  bookings, patients, onAddBooking, onUpdateBooking, onDeleteBooking, userRole, logo, signature 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<AdvanceBooking | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<AdvanceBooking>>({
    patientName: '',
    phone: '',
    amount: 0,
    modelInterest: '',
    paymentMethod: 'Cash',
    bankDetails: '',
    notes: ''
  });

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.phone.includes(searchTerm) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings, searchTerm]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone || !formData.amount) {
      alert("Please fill name, phone, and amount.");
      return;
    }

    const newBooking: AdvanceBooking = {
      id: `ADV-${Date.now()}`,
      patientId: `P-TEMP-${Date.now()}`,
      patientName: formData.patientName!,
      phone: formData.phone!,
      amount: Number(formData.amount),
      date: new Date().toISOString().split('T')[0],
      modelInterest: formData.modelInterest || 'Not Specified',
      paymentMethod: formData.paymentMethod || 'Cash',
      bankDetails: formData.bankDetails,
      status: 'Active',
      notes: formData.notes
    };

    onAddBooking(newBooking);
    setShowAddModal(false);
    setFormData({ patientName: '', phone: '', amount: 0, modelInterest: '', paymentMethod: 'Cash', bankDetails: '', notes: '' });
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="text-primary" />
            Advance Bookings
          </h2>
          <p className="text-sm text-gray-500">Manage advance payments for new device bookings.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-teal-800 transition-all font-bold"
        >
          <Plus size={20} /> Create Advance Receipt
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, phone or booking ID..." 
          className="flex-1 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
            No active advance bookings found.
          </div>
        ) : filteredBookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-lg text-gray-800">{booking.patientName}</h3>
                <p className="text-xs text-gray-400 font-mono">#{booking.id}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                booking.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                booking.status === 'Consumed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {booking.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400"/> {booking.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} className="text-gray-400"/> {new Date(booking.date).toLocaleDateString('en-IN')}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-800 font-bold bg-teal-50 px-3 py-1 rounded-lg">
                <IndianRupee size={14}/> {booking.amount.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedBookingForReceipt(booking)}
                className="flex-1 py-2 text-xs font-black uppercase tracking-widest text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={14}/> View Receipt
              </button>
              {userRole === 'admin' && (
                <button 
                  onClick={() => { if(window.confirm("Delete this advance booking?")) onDeleteBooking(booking.id); }}
                  className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18}/>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-primary p-5 text-white flex justify-between items-center font-black uppercase tracking-widest">
              <h3>New Advance Receipt</h3>
              <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Patient Name *</label>
                  <input required className="w-full border-b border-gray-200 p-2 focus:border-teal-500 outline-none text-sm" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Phone Number *</label>
                  <input required className="w-full border-b border-gray-200 p-2 focus:border-teal-500 outline-none text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Booking For (Model/Type)</label>
                <input className="w-full border-b border-gray-200 p-2 focus:border-teal-500 outline-none text-sm" placeholder="e.g. Phonak Lumity L90" value={formData.modelInterest} onChange={e => setFormData({...formData, modelInterest: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Advance Amount (INR) *</label>
                  <input required type="number" className="w-full border-b border-gray-200 p-2 focus:border-teal-500 outline-none text-lg font-black text-teal-700" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400">Payment Mode</label>
                  <select className="w-full border-b border-gray-200 p-2 focus:border-teal-500 outline-none text-sm bg-white" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Account Transfer</option>
                    <option>Credit Card</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Bank Account (if digital)</label>
                <select className="w-full border-b border-gray-200 p-2 focus:border-teal-500 outline-none text-sm bg-white" value={formData.bankDetails} onChange={e => setFormData({...formData, bankDetails: e.target.value})}>
                  <option value="">None / Handled</option>
                  {COMPANY_BANK_ACCOUNTS.map(b => <option key={b.accountNumber} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-900/20 hover:bg-teal-800 transition-all mt-6">Confirm & Issue Receipt</button>
            </form>
          </div>
        </div>
      )}

      {selectedBookingForReceipt && (
        <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 overflow-y-auto print:bg-white print:absolute print:inset-0">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in print:shadow-none print:w-full print:max-w-none">
            {/* Screen Header */}
            <div className="bg-teal-700 p-4 flex justify-between items-center text-white print:hidden">
              <h3 className="font-bold">Advance Payment Receipt</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="bg-white text-teal-700 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"><Printer size={16}/> Print</button>
                <button onClick={() => setSelectedBookingForReceipt(null)}><X size={24}/></button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="receipt-printable-area" className="p-10 bg-white relative">
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                <div className="flex gap-4">
                  <img src={logo} alt="Logo" className="h-20 w-20 object-contain" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase leading-tight">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Hospital Based Hearing Chain</p>
                    <p className="text-[8px] text-gray-400 uppercase mt-2">GSTIN: 19AALCB1534C1ZY</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="border-2 border-gray-800 px-4 py-1 inline-block mb-2">
                    <h2 className="text-lg font-bold uppercase tracking-widest">Advance Receipt</h2>
                  </div>
                  <p className="text-xs text-gray-600"><b>No:</b> {selectedBookingForReceipt.id}</p>
                  <p className="text-xs text-gray-600"><b>Date:</b> {new Date(selectedBookingForReceipt.date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="space-y-8 text-sm text-gray-800 leading-loose">
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>Received with thanks from Mr./Mrs./Ms.</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900">{selectedBookingForReceipt.patientName}</span>
                </div>
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>An amount of Rupees</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900">₹ {selectedBookingForReceipt.amount.toLocaleString('en-IN')} /-</span>
                </div>
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>As non-refundable advance booking for hearing aid model:</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900">{selectedBookingForReceipt.modelInterest}</span>
                </div>
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>Paid via</span>
                  <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900">{selectedBookingForReceipt.paymentMethod} {selectedBookingForReceipt.bankDetails ? `to ${selectedBookingForReceipt.bankDetails}` : ''}</span>
                </div>
              </div>

              <div className="mt-20 flex justify-between items-end">
                <div className="border-2 border-gray-800 p-4 rounded-xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Receipt Total</p>
                  <p className="text-3xl font-black text-gray-900">₹ {selectedBookingForReceipt.amount.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-center group">
                  {signature ? (
                    <img src={signature} className="h-16 mb-2 mx-auto mix-blend-multiply" />
                  ) : (
                    <div className="h-16 w-40 border-b border-gray-300 mb-2"></div>
                  )}
                  <p className="text-[10px] font-black uppercase text-gray-800 tracking-widest">Authorized Signatory</p>
                </div>
              </div>

              <div className="mt-12 pt-4 border-t text-[10px] text-gray-400 text-center uppercase tracking-widest">
                Subject to Kolkata Jurisdiction • Valid for 30 days against final invoice.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};