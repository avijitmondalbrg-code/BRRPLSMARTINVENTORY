
import React, { useState } from 'react';
import { Patient, Invoice, UserRole } from '../types';
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

export const Patients: React.FC<PatientsProps> = ({ patients, invoices, onAddPatient, onUpdatePatient, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState<Patient>({ 
    id: '', name: '', phone: '', email: '', address: '', state: 'West Bengal', country: 'India', referDoctor: '', audiologist: '', addedDate: new Date().toISOString().split('T')[0] 
  });

  const handleOpenAdd = () => { 
    setEditingId(null); 
    setFormData({ 
      id: '', name: '', phone: '', email: '', address: '', state: 'West Bengal', country: 'India', referDoctor: '', audiologist: '', 
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
    return d2 - d1;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-[#3159a6]" /> Patient Registry</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Master Database & Records</p>
        </div>
        {userRole === 'admin' && (
            <button onClick={handleOpenAdd} className="bg-[#3159a6] text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest">
                <Plus size={18} /> New Patient
            </button>
        )}
      </div>
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-xl focus:border-[#3159a6] outline-none transition font-medium" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 p-2 px-4 rounded-xl border border-gray-100">
                <Calendar size={18} className="text-[#3159a6]" />
                <span className="text-[9px] font-black uppercase text-gray-400 whitespace-nowrap tracking-[0.2em]">Registration Window</span>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-[#3159a6] font-black" />
                <span className="text-gray-300 font-black">/</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-[#3159a6] font-black" />
                {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-red-400 hover:text-red-600 ml-1"><X size={16}/></button>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                <User className="mx-auto h-16 w-16 text-gray-100 mb-4" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No records found matching criteria</p>
            </div>
        ) : filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#3159a6]/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex-1">
                      <h3 className="font-black text-xl text-gray-800 leading-tight group-hover:text-[#3159a6] transition-colors uppercase tracking-tight">{patient.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] bg-gray-50 text-gray-400 font-mono px-2 py-0.5 rounded-lg border border-gray-100">ID: {patient.id.slice(-6)}</span>
                        {patient.addedDate && (
                            <span className="text-[9px] bg-blue-50 text-[#3159a6] px-2 py-0.5 rounded-lg font-black uppercase flex items-center gap-1">
                              <Calendar size={10}/> {new Date(patient.addedDate).toLocaleDateString('en-IN')}
                            </span>
                        )}
                      </div>
                  </div>
                  {userRole === 'admin' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={()=>handleOpenEdit(patient)} className="p-2 text-[#3159a6] hover:bg-blue-50 rounded-xl transition"><Edit size={18}/></button>
                      <button onClick={()=>{ if(window.confirm(`Permanently delete ${patient.name}?`)) onDelete(patient.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={18}/></button>
                    </div>
                  )}
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 mb-8 border-t border-gray-50 pt-6 relative z-10">
                  <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest"><Phone size={16} className="text-[#3159a6]" /> {patient.phone}</p>
                  <p className="flex items-start gap-4 text-xs font-medium leading-relaxed"><MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" /> {patient.address || 'Location data not registered'}</p>
              </div>

              <button 
                onClick={() => setViewingHistoryId(patient.id)} 
                className="w-full py-4 text-[10px] text-[#3159a6] bg-blue-50 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-[#3159a6] hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 relative z-10"
              >
                <History size={14}/> Transaction Ledger
              </button>
            </div>
        ))}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border-4 border-white">
                  <div className="bg-[#3159a6] p-6 text-white flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest text-sm">{editingId ? 'Modify' : 'New'} Patient Entry</h3>
                    <button onClick={()=>setShowModal(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Legal Name *</label>
                              <input required className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-[#3159a6] outline-none font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Full name" />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Contact No *</label>
                              <input required className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-[#3159a6] outline-none font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="Mobile number" />
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Residential Address</label>
                          <textarea className="w-full border-2 border-gray-50 rounded-2xl p-4 focus:border-[#3159a6] outline-none font-medium text-gray-700 bg-gray-50 focus:bg-white transition-all h-32 resize-none" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} placeholder="Full correspondence address" />
                      </div>
                      <button onClick={() => { editingId ? onUpdatePatient(formData) : onAddPatient({...formData, id: `P-${Date.now()}`}); setShowModal(false); }} className="w-full bg-[#3159a6] text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all uppercase tracking-[0.3em] text-[10px]">Save Clinical Profile</button>
                  </div>
              </div>
          </div>
      )}

      {viewingHistoryId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-xl">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border-4 border-white">
                <div className="p-8 border-b-2 border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tighter">Financial Ledger</h3>
                    <p className="text-xs text-[#3159a6] font-black tracking-widest uppercase mt-1">{patients.find(p=>p.id===viewingHistoryId)?.name}</p>
                  </div>
                  <button onClick={() => setViewingHistoryId(null)} className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-100 shadow-sm"><X size={28} className="text-gray-400"/></button>
                </div>
                <div className="p-10 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                    {invoices.filter(i=>i.patientId===viewingHistoryId).length === 0 ? (
                      <div className="text-center py-24 text-gray-400 italic bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                        <History size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No transaction history recorded</p>
                      </div>
                    ) : invoices.filter(i=>i.patientId===viewingHistoryId).map(inv => (
                        <div key={inv.id} className="p-6 border-2 border-gray-50 rounded-[2rem] hover:border-blue-100 transition-all bg-white flex justify-between items-center group shadow-sm">
                            <div>
                              <p className="font-black text-gray-800 tracking-tight text-xl">{inv.id}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(inv.date).toLocaleDateString('en-IN')}</span>
                                <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest border-2 ${inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-800 border-orange-100'}`}>{inv.paymentStatus}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Invoice Amount</p>
                              <p className="text-3xl font-black text-[#3159a6] tracking-tighter">₹{inv.finalTotal.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-8 bg-gray-50 text-center border-t border-gray-100">
                   <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.5em] select-none">End of Audit Trail</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
