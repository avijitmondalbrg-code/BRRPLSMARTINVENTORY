import React, { useState } from 'react';
import { Patient, Invoice, PaymentRecord, UserRole } from '../types';
import { COUNTRIES, INDIAN_STATES } from '../constants';
import { Search, Plus, User, Phone, MapPin, UserCheck, Stethoscope, Edit, FileText, Receipt as ReceiptIcon, History, ArrowLeft, Mail, Globe, Lock, Trash2, X, Calendar, Filter } from 'lucide-react';
import { Receipt } from './Receipt';

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
  const [receiptData, setReceiptData] = useState<{ payment: PaymentRecord, invoice: Invoice } | null>(null);
  const [formData, setFormData] = useState<Patient>({ id: '', name: '', phone: '', email: '', address: '', state: 'West Bengal', country: 'India', referDoctor: '', audiologist: '' });
  
  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleOpenAdd = () => { setEditingId(null); setFormData({ id: '', name: '', phone: '', email: '', address: '', state: 'West Bengal', country: 'India', referDoctor: '', audiologist: '' }); setShowModal(true); };
  const handleOpenEdit = (p: Patient) => { setEditingId(p.id); setFormData({ ...p }); setShowModal(true); };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm);
    const addedDate = p.addedDate || '';
    const matchesStartDate = !startDate || addedDate >= startDate;
    const matchesEndDate = !endDate || addedDate <= endDate;
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-primary" /> Patient Directory</h2>
        {userRole === 'admin' && <button onClick={handleOpenAdd} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-800 transition"><Plus size={20} /> Add New Patient</button>}
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
        <div className="flex items-center gap-4">
            <Search className="text-gray-400" size={20} />
            <input type="text" placeholder="Search Patients by Name or Phone..." className="flex-1 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        </div>
        
        {/* Date Filter Strip */}
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 max-w-2xl">
            <div className="flex items-center gap-2 px-2 text-gray-500 border-r border-gray-200">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Registration Date</span>
            </div>
            <div className="flex items-center gap-3 px-2">
                <input 
                  type="date" 
                  className="bg-transparent text-sm outline-none focus:text-teal-600"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-400 font-bold">to</span>
                <input 
                  type="date" 
                  className="bg-transparent text-sm outline-none focus:text-teal-600"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                {(startDate || endDate) && (
                    <button 
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      title="Reset Dates"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <User className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No patients found matching your criteria.</p>
            </div>
        ) : filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group transition hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                  <div>
                      <h3 className="font-bold text-lg text-gray-800 leading-tight">{patient.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{patient.id}</span>
                        {patient.addedDate && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Calendar size={10} /> {new Date(patient.addedDate).toLocaleDateString()}
                            </span>
                        )}
                      </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      {userRole === 'admin' && (
                          <>
                            <button onClick={() => handleOpenEdit(patient)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="Edit"><Edit size={16}/></button>
                            <button onClick={() => { if(window.confirm(`Delete ${patient.name}?`)) onDelete(patient.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16}/></button>
                          </>
                      )}
                  </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2"><Phone size={14} className="text-teal-500" /> {patient.phone}</p>
                  <p className="flex items-start gap-2"><MapPin size={14} className="text-teal-500 mt-1" /> {patient.address || 'No Address'}</p>
              </div>
              <button onClick={() => setViewingHistoryId(patient.id)} className="w-full mt-2 py-2 text-sm text-teal-600 bg-teal-50 rounded font-bold hover:bg-teal-100 transition flex items-center justify-center gap-2"><History size={14}/> View History</button>
            </div>
        ))}
      </div>
      {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                  <div className="bg-primary p-4 text-white flex justify-between items-center rounded-t-xl font-bold"><h3>{editingId ? 'Edit' : 'New'} Patient</h3><button onClick={() => setShowModal(false)}><X/></button></div>
                  <div className="p-6 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
                        <input className="w-full border p-2 rounded mt-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                        <input className="w-full border p-2 rounded mt-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      {!editingId && (
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Registration Date</label>
                            <input type="date" className="w-full border p-2 rounded mt-1" value={formData.addedDate || new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, addedDate: e.target.value})} />
                          </div>
                      )}
                      <button onClick={() => { editingId ? onUpdatePatient(formData) : onAddPatient({...formData, id: `P-${Date.now()}`}); setShowModal(false); }} className="w-full bg-primary text-white font-bold py-3 rounded-lg mt-4">Save Patient</button>
                  </div>
              </div>
          </div>
      )}
      {viewingHistoryId && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center rounded-t-xl"><h3 className="font-bold">History: {patients.find(p=>p.id===viewingHistoryId)?.name}</h3><button onClick={() => setViewingHistoryId(null)}><X/></button></div>
                  <div className="p-6 space-y-4">
                      {invoices.filter(i=>i.patientId===viewingHistoryId).map(inv => (
                          <div key={inv.id} className="p-4 border rounded bg-gray-50 flex justify-between items-center">
                              <div><p className="font-bold">{inv.id}</p><p className="text-xs text-gray-500">{inv.date}</p></div>
                              <div className="text-right font-bold text-teal-700">₹{inv.finalTotal.toLocaleString()}</div>
                          </div>
                      ))}
                      {invoices.filter(i=>i.patientId===viewingHistoryId).length === 0 && <p className="text-center text-gray-400 py-10">No records found.</p>}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};