
import React, { useState } from 'react';
import { Lead, LeadStatus, Activity, Patient, UserRole } from '../types';
import { Plus, Search, Phone, Calendar, MessageCircle, MoreVertical, User, ArrowRight, CheckCircle, XCircle, Clock, DollarSign, Lock, Trash2 } from 'lucide-react';

interface CRMProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onConvertToPatient: (lead: Lead) => void;
  // FIX: Added onDelete prop to fix Error in file App.tsx on line 307
  onDelete: (id: string) => void;
  userRole: UserRole;
}

const STATUS_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'New', label: 'New Inquiry', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'Contacted', label: 'Contacted', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'Appointment', label: 'Appointment', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'Trial', label: 'Trial / Demo', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'Won', label: 'Closed Won', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'Lost', label: 'Lost', color: 'bg-gray-50 border-gray-200 text-gray-700' },
];

export const CRM: React.FC<CRMProps> = ({ leads, onAddLead, onUpdateLead, onConvertToPatient, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', phone: '', source: 'Walk-in', status: 'New', value: 0
  });
  const [phoneError, setPhoneError] = useState('');

  // Activity Form State
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({ type: 'Call', content: '' });

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );
  
  const openAddLeadModal = () => {
    setFormData({ name: '', phone: '', source: 'Walk-in', status: 'New', value: 0 });
    setPhoneError('');
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
        setPhoneError("Please enter a valid 10-digit mobile number.");
        return;
    }

    const newLead: Lead = {
      id: `L-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      source: formData.source || 'Walk-in',
      status: 'New',
      createdAt: new Date().toISOString().split('T')[0],
      activities: [],
      value: Number(formData.value) || 0,
      nextFollowUp: formData.nextFollowUp
    };

    onAddLead(newLead);
    setShowAddModal(false);
  };

  const handleAddActivity = () => {
    if (!selectedLead || !newActivity.content) return;
    
    const activity: Activity = {
        id: `A-${Date.now()}`,
        type: newActivity.type as any,
        content: newActivity.content,
        date: new Date().toISOString().split('T')[0]
    };

    const updatedLead = {
        ...selectedLead,
        activities: [activity, ...selectedLead.activities]
    };

    onUpdateLead(updatedLead);
    setSelectedLead(updatedLead);
    setNewActivity({ type: 'Call', content: '' });
  };

  const handleStatusChange = (status: LeadStatus) => {
      if (!selectedLead) return;
      
      if (status === 'Won' && selectedLead.status !== 'Won') {
          if (window.confirm("Lead Marked as Won! Do you want to register them as a Patient?")) {
             onConvertToPatient(selectedLead);
          }
      }

      const updatedLead = { ...selectedLead, status };
      onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-primary" /> Sales CRM Pipeline</h2>
        <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2">
                 <Search className="text-gray-400" size={18} />
                 <input type="text" placeholder="Search Leads..." className="outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
            {userRole === 'admin' ? (
                <button onClick={openAddLeadModal} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"><Plus size={20} /> Add Lead</button>
            ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-100 px-3 py-1.5 rounded-full border"><Lock size={14} /> Read-Only Mode</div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
         <div className="flex gap-4 h-full min-w-[1200px]">
            {STATUS_COLUMNS.map(col => (
                <div key={col.id} className="flex-1 flex flex-col min-w-[250px] bg-gray-100/50 rounded-xl border border-gray-200">
                    <div className={`p-3 rounded-t-xl border-b ${col.color} bg-opacity-50 flex justify-between items-center`}>
                        <span className="font-bold text-sm">{col.label}</span>
                        <span className="bg-white bg-opacity-60 px-2 py-0.5 rounded text-xs font-bold">{filteredLeads.filter(l => l.status === col.id).length}</span>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto space-y-3">
                        {filteredLeads.filter(l => l.status === col.id).map(lead => (
                             <div key={lead.id} onClick={() => setSelectedLead(lead)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition relative group">
                                <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-gray-800">{lead.name}</h4>{lead.value && <span className="text-xs font-medium text-green-700">₹{(lead.value/1000).toFixed(0)}k</span>}</div>
                                <div className="text-xs text-gray-500"><Phone size={12} className="inline mr-1" /> {lead.phone}</div>
                                <div className="mt-3 pt-2 border-t flex justify-between items-center text-xs text-gray-400"><span>{lead.source}</span><ArrowRight size={14} className="text-teal-600 opacity-0 group-hover:opacity-100 transition" /></div>
                             </div>
                        ))}
                    </div>
                </div>
            ))}
         </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Add New Lead</h3><button onClick={() => setShowAddModal(false)}><XCircle/></button></div>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <input required placeholder="Name" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required placeholder="Phone" className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-bold">Add to Pipeline</button>
                </form>
            </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
             <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
                <div className="p-6 bg-teal-700 text-white flex justify-between items-start">
                    <div><h3 className="text-xl font-bold">{selectedLead.name}</h3><p className="opacity-80 text-sm">{selectedLead.phone}</p></div>
                    <div className="flex items-center gap-2">
                        {userRole === 'admin' && (
                            <button onClick={() => { if(window.confirm(`Delete lead ${selectedLead.name}?`)) { onDelete(selectedLead.id); setSelectedLead(null); } }} className="text-white/70 hover:text-white p-1 hover:bg-red-500 rounded transition"><Trash2 size={20}/></button>
                        )}
                        <button onClick={() => setSelectedLead(null)} className="text-white/80 hover:text-white"><XCircle size={24}/></button>
                    </div>
                </div>
                <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                     <select className="border p-2 rounded text-sm font-bold" value={selectedLead.status} onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}>
                        {STATUS_COLUMNS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                     {selectedLead.status !== 'Won' && userRole === 'admin' && <button onClick={() => handleStatusChange('Won')} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">Mark Won</button>}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Source:</span> {selectedLead.source}</div><div><span className="text-gray-500">Potential:</span> ₹{(selectedLead.value || 0).toLocaleString()}</div></div>
                    <hr/>
                    <div className="space-y-4">
                        <h4 className="font-bold flex items-center gap-2"><MessageCircle size={18} /> Interaction Log</h4>
                        {selectedLead.activities.map(act => (
                            <div key={act.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                <div className="flex justify-between mb-1 font-bold text-xs uppercase text-gray-500"><span>{act.type}</span><span>{act.date}</span></div>
                                <p>{act.content}</p>
                            </div>
                        ))}
                        {userRole === 'admin' && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                                <textarea className="w-full border p-2 rounded text-sm" rows={2} placeholder="Add log..." value={newActivity.content} onChange={e => setNewActivity({...newActivity, content: e.target.value})}/>
                                <button onClick={handleAddActivity} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold mt-2">Save interaction</button>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};