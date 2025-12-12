import React, { useState } from 'react';
import { Patient, Invoice, PaymentRecord, UserRole } from '../types';
import { Search, Plus, User, Phone, MapPin, Edit, History, Calendar, X, Trash2 } from 'lucide-react';

interface PatientsProps {
  patients: Patient[];
  invoices: Invoice[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
}

export const Patients: React.FC<PatientsProps> = ({ patients, invoices, onAddPatient, onUpdatePatient, onDelete, logo, signature, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  
  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState<Patient>({ 
    id: '', name: '', phone: '', email: '', address: '', referDoctor: '', audiologist: '', addedDate: new Date().toISOString().split('T')[0] 
  });

  const handleOpenAdd = () => { 
    setEditingId(null); 
    setFormData({ 
      id: '', name: '', phone: '', email: '', address: '', referDoctor: '', audiologist: '', 
      addedDate: new Date().toISOString().split('T')[0] 
    }); 
    setShowModal(true); 
  };

  const handleOpenEdit = (p: Patient) => { 
    setEditingId(p.id); 
    setFormData({ ...p }); 
    setShowModal(true); 
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm);
    const pDate = p.addedDate || '';
    const matchesStart = !startDate || pDate >= startDate;
    const matchesEnd = !endDate || pDate <= endDate;
    return matchesSearch && matchesStart && matchesEnd;
  }).sort((a, b) => {
    const d1 = new Date(a.addedDate || 0).getTime(), d2 = new Date(b.addedDate || 0).getTime();
    return d2 - d1; // Newest first
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-primary" /> Patient Directory</h2>
        {userRole === 'admin' && <button onClick={handleOpenAdd} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-800 transition-all font-bold"><Plus size={20} /> Add New Patient</button>}
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search by name or phone number..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
            
            <div className="flex items-center gap-3 bg-gray-50 p-2 px-3 rounded-xl border border-gray-200">
                <Calendar size={18} className="text-teal-600" /><span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap tracking-wider">Registration Date</span>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-teal-700 font-bold" />
                <span className="text-gray-300 font-black">to</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-teal-700 font-bold" />
                {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-gray-400 hover:text-red-500 transition ml-1" title="Reset Filters"><X size={16}/></button>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <User className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">No patients match your search or date filters.</p>
            </div>
        ) : filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                      <h3 className="font-black text-xl text-gray-800 leading-tight">{patient.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded uppercase tracking-tighter">ID: {patient.id}</span>
                        {patient.addedDate && (
                            <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded font-bold uppercase tracking-tighter flex items-center gap-1">
                              <Calendar size={10}/> {new Date(patient.addedDate).toLocaleDateString('en-IN')}
                            </span>
                        )}
                      </div>
                  </div>
                  {userRole === 'admin' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={()=>handleOpenEdit(patient)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Edit Profile"><Edit size={18}/></button>
                      <button onClick={()=>{ if(window.confirm(`Permanently delete ${patient.name}?`)) onDelete(patient.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete Permanent"><Trash2 size={18}/></button>
                    </div>
                  )}
              </div>
              
              <div className="space-y-2.5 text-sm text-gray-600 mb-6 border-t border-gray-50 pt-4">
                  <p className="flex items-center gap-3"><Phone size={16} className="text-teal-500" /> <span className="font-bold">{patient.phone}</span></p>
                  <p className="flex items-start gap-3"><MapPin size={16} className="text-teal-500 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2 leading-relaxed">{patient.address || 'No address provided'}</span></p>
              </div>

              <button onClick={() => setViewingHistoryId(patient.id)} className="w-full py-3 text-sm text-teal-700 bg-teal-50 rounded-xl font-black uppercase tracking-widest hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 border border-teal-100/50 shadow-sm"><History size={16}/> Billing History</button>
            </div>
        ))}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                  <div className="bg-primary p-5 text-white flex justify-between items-center font-black uppercase tracking-widest">
                    <h3>{editingId ? 'Modify' : 'Register New'} Patient</h3>
                    <button onClick={()=>setShowModal(false)} className="hover:text-teal-200 transition-colors"><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Name *</label>
                              <input required className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-medium" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Contact Phone *</label>
                              <input required className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-medium" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="10-digit number" />
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Registration Date</label>
                          <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-medium" value={formData.addedDate || ''} onChange={e=>setFormData({...formData, addedDate: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Residential Address</label>
                          <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-medium h-24" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} placeholder="Full address details..." />
                      </div>
                      <button onClick={() => { editingId ? onUpdatePatient(formData) : onAddPatient({...formData, id: `P-${Date.now()}`}); setShowModal(false); }} className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-900/20 hover:bg-teal-800 transition-all uppercase tracking-[0.2em] mt-4">Confirm & Save Patient</button>
                  </div>
              </div>
          </div>
      )}

      {viewingHistoryId && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight">Financial History</h3>
                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">{patients.find(p=>p.id===viewingHistoryId)?.name}</p>
                  </div>
                  <button onClick={() => setViewingHistoryId(null)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><X size={24} className="text-gray-400"/></button>
                </div>
                <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {invoices.filter(i=>i.patientId===viewingHistoryId).length === 0 ? (
                      <div className="text-center py-20 text-gray-400 italic bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">No records found for this patient.</div>
                    ) : invoices.filter(i=>i.patientId===viewingHistoryId).map(inv => (
                        <div key={inv.id} className="p-5 border-2 border-gray-100 rounded-2xl hover:border-teal-100 transition-all bg-white group shadow-sm flex justify-between items-center">
                            <div>
                              <p className="font-black text-gray-800 tracking-tight text-lg">{inv.id}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(inv.date).toLocaleDateString('en-IN')}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-800 border-orange-200'}`}>{inv.paymentStatus}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-0.5">Grand Total</p>
                              <p className="text-2xl font-black text-teal-800 tracking-tighter">₹{inv.finalTotal.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-gray-50 border-t text-center">
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">End of Audit Trail</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};