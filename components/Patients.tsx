
import React, { useState } from 'react';
import { Patient, Invoice, PaymentRecord, UserRole } from '../types';
import { COUNTRIES, INDIAN_STATES } from '../constants';
import { Search, Plus, User, Phone, MapPin, UserCheck, Stethoscope, Edit, FileText, Receipt as ReceiptIcon, History, ArrowLeft, Mail, Globe, Lock, Trash2, X } from 'lucide-react';
import { Receipt } from './Receipt';

interface PatientsProps {
  patients: Patient[];
  invoices: Invoice[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  // FIX: Added onDelete prop to fix Error in file App.tsx on line 308
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

  const handleOpenAdd = () => { setEditingId(null); setFormData({ id: '', name: '', phone: '', email: '', address: '', state: 'West Bengal', country: 'India', referDoctor: '', audiologist: '' }); setShowModal(true); };
  const handleOpenEdit = (p: Patient) => { setEditingId(p.id); setFormData({ ...p }); setShowModal(true); };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-primary" /> Patient Directory</h2>
        {userRole === 'admin' && <button onClick={handleOpenAdd} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"><Plus size={20} /> Add New Patient</button>}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4"><Search className="text-gray-400" size={20} /><input type="text" placeholder="Search Patients..." className="flex-1 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
            <div key={patient.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group transition hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                  <div><h3 className="font-bold text-lg text-gray-800">{patient.name}</h3><span className="text-xs text-gray-400 font-mono uppercase tracking-widest">{patient.id}</span></div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      {userRole === 'admin' && (
                          <>
                            <button onClick={() => handleOpenEdit(patient)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="Edit"><Edit size={16}/></button>
                            <button onClick={() => { if(window.confirm(`Permanently delete patient ${patient.name}?`)) onDelete(patient.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16}/></button>
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
                      <input placeholder="Patient Name" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <input placeholder="Phone Number" className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      <button onClick={() => { editingId ? onUpdatePatient(formData) : onAddPatient({...formData, id: `P-${Date.now()}`}); setShowModal(false); }} className="w-full bg-primary text-white font-bold py-3 rounded-lg">Save Patient</button>
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