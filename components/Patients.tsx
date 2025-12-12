import React, { useState } from 'react';
import { Patient, Invoice, PaymentRecord, UserRole } from '../types';
import { Search, Plus, User, Phone, MapPin, Edit, History, Calendar, X, Trash2, Filter } from 'lucide-react';
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
  
  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState<Patient>({ id: '', name: '', phone: '', email: '', address: '', referDoctor: '', audiologist: '' });

  const handleOpenAdd = () => { setEditingId(null); setFormData({ id: '', name: '', phone: '', email: '', address: '', referDoctor: '', audiologist: '', addedDate: new Date().toISOString().split('T')[0] }); setShowModal(true); };
  const handleOpenEdit = (p: Patient) => { setEditingId(p.id); setFormData({ ...p }); setShowModal(true); };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm);
    const pDate = p.addedDate || '';
    const matchesStart = !startDate || pDate >= startDate;
    const matchesEnd = !endDate || pDate <= endDate;
    return matchesSearch && matchesStart && matchesEnd;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-primary" /> Patient Directory</h2>
        {userRole === 'admin' && <button onClick={handleOpenAdd} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"><Plus size={20} /> Add Patient</button>}
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search name or phone..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 px-3 rounded-lg border border-gray-200">
                <Calendar size={16} className="text-gray-400" /><span className="text-[10px] font-black uppercase text-gray-400">Reg. Date</span>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                <span className="text-gray-300">to</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-red-400"><X size={14}/></button>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-xl shadow border border-gray-200 p-5 group hover:shadow-md transition">
              <div className="flex justify-between mb-4">
                  <div>
                      <h3 className="font-bold text-lg text-gray-800">{patient.name}</h3>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {patient.id} • Registered: {patient.addedDate || 'N/A'}</p>
                  </div>
                  {userRole === 'admin' && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition"><button onClick={()=>handleOpenEdit(patient)} className="p-1 text-teal-600"><Edit size={16}/></button><button onClick={()=>onDelete(patient.id)} className="p-1 text-red-400"><Trash2 size={16}/></button></div>}
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2"><Phone size={14} className="text-teal-500" /> {patient.phone}</p>
                  <p className="flex items-start gap-2"><MapPin size={14} className="text-teal-500 mt-1" /> {patient.address || 'No Address'}</p>
              </div>
              <button onClick={() => setViewingHistoryId(patient.id)} className="w-full py-2 text-sm text-teal-600 bg-teal-50 rounded font-bold hover:bg-teal-100 transition flex items-center justify-center gap-2"><History size={14}/> View History</button>
            </div>
        ))}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                  <div className="bg-primary p-4 text-white flex justify-between items-center rounded-t-xl font-bold"><h3>{editingId ? 'Edit' : 'New'} Patient</h3><button onClick={()=>setShowModal(false)}><X/></button></div>
                  <div className="p-6 space-y-4">
                      <input placeholder="Name" className="w-full border p-2 rounded" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                      <input placeholder="Phone" className="w-full border p-2 rounded" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} />
                      <input type="date" className="w-full border p-2 rounded" value={formData.addedDate || ''} onChange={e=>setFormData({...formData, addedDate: e.target.value})} />
                      <button onClick={() => { editingId ? onUpdatePatient(formData) : onAddPatient({...formData, id: `P-${Date.now()}`}); setShowModal(false); }} className="w-full bg-primary text-white font-bold py-3 rounded-lg">Save Patient</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};