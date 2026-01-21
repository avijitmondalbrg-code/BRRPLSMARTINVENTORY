import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Activity, UserRole } from '../types';
import { Plus, Search, Phone, Calendar, MessageCircle, MoreVertical, User, ArrowRight, CheckCircle, XCircle, Clock, IndianRupee, Lock, Mail, Send, MessageSquare, StickyNote, AlertCircle, Trash2, MapPin, Baby, UserCheck, Edit3 } from 'lucide-react';

interface CRMProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onConvertToPatient: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
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
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageChannel, setMessageChannel] = useState<'WhatsApp' | 'Email' | 'SMS'>('WhatsApp');
  const [messageBody, setMessageBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', 
    phone: '', 
    address: '',
    dob: '',
    comment: '',
    problem: '',
    referDoctor: '',
    haPotential: 'No',
    entryBy: '',
    source: 'Walk-in', 
    status: 'New', 
    value: 0,
    nextFollowUp: ''
  });

  // Activity Form State
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({ type: 'Call', content: '' });

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setEditingLeadId(null);
    setFormData({
      name: '', phone: '', address: '', dob: '', comment: '', problem: '', referDoctor: '', haPotential: 'No', entryBy: userRole, 
      source: 'Walk-in', status: 'New', value: 0, nextFollowUp: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setFormData({ ...lead });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (editingLeadId) {
      const existingLead = leads.find(l => l.id === editingLeadId);
      if (!existingLead) return;

      const updatedLead: Lead = {
        ...existingLead,
        name: formData.name || existingLead.name,
        phone: formData.phone || existingLead.phone,
        address: formData.address || '',
        dob: formData.dob || '',
        comment: formData.comment || '',
        problem: formData.problem || '',
        referDoctor: formData.referDoctor || '',
        haPotential: (formData.haPotential as 'Yes' | 'No') || 'No',
        entryBy: formData.entryBy || userRole,
        source: formData.source || existingLead.source,
        value: Number(formData.value) || 0,
        nextFollowUp: formData.nextFollowUp || '',
        notes: formData.comment || existingLead.notes
      };
      onUpdateLead(updatedLead);
      if (selectedLead?.id === editingLeadId) setSelectedLead(updatedLead);
    } else {
      const newLead: Lead = {
        id: `L-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        address: formData.address || '',
        dob: formData.dob || '',
        comment: formData.comment || '',
        problem: formData.problem || '',
        referDoctor: formData.referDoctor || '',
        haPotential: (formData.haPotential as 'Yes' | 'No') || 'No',
        entryBy: formData.entryBy || userRole,
        source: formData.source || 'Walk-in',
        status: 'New',
        createdAt: new Date().toISOString().split('T')[0],
        activities: [],
        value: Number(formData.value) || 0,
        nextFollowUp: formData.nextFollowUp || '',
        notes: formData.comment || ''
      };
      onAddLead(newLead);
    }
    
    setShowAddModal(false);
    setEditingLeadId(null);
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

  const handleQuickReschedule = () => {
      if (!selectedLead) return;
      handleOpenEdit(selectedLead);
  };

  const openMessageModal = () => {
      setMessageBody(`Hi ${selectedLead?.name}, `);
      setEmailSubject('Regarding your inquiry at Bengal Rehabilitation');
      setMessageChannel('WhatsApp');
      setShowMessageModal(true);
  }

  const handleSendMessage = () => {
      if (!selectedLead) return;

      let link = '';
      let logType: Activity['type'] = 'WhatsApp';
      let content = '';

      const cleanPhone = selectedLead.phone.replace(/\D/g, '');
      const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      if (messageChannel === 'WhatsApp') {
          const encodedBody = encodeURIComponent(messageBody);
          link = `https://wa.me/${phoneWithCode}?text=${encodedBody}`;
          logType = 'WhatsApp';
          content = `Sent WhatsApp: "${messageBody}"`;
      } else if (messageChannel === 'Email') {
          if (!selectedLead.email) {
              alert("This lead does not have an email address.");
              return;
          }
          const encodedSubject = encodeURIComponent(emailSubject);
          const encodedBody = encodeURIComponent(messageBody);
          link = `mailto:${selectedLead.email}?subject=${encodedSubject}&body=${encodedBody}`;
          logType = 'Email';
          content = `Sent Email: Subject: "${emailSubject}" - Body: "${messageBody}"`;
      } else if (messageChannel === 'SMS') {
          const encodedBody = encodeURIComponent(messageBody);
          link = `sms:${cleanPhone}?body=${encodedBody}`;
          logType = 'SMS';
          content = `Sent SMS: "${messageBody}"`;
      }

      const activity: Activity = {
          id: `A-${Date.now()}`,
          type: logType,
          content: content,
          date: new Date().toISOString().split('T')[0]
      };

      const updatedLead = {
          ...selectedLead,
          activities: [activity, ...selectedLead.activities]
      };

      onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);
      
      window.open(link, '_blank');
      setShowMessageModal(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
            <User className="h-6 w-6 text-primary" />
            Lead Hub
          </h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Pipeline & Prospect Management</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
                 <Search className="text-gray-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Find prospects..." 
                    className="outline-none text-sm font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-primary hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xl transition-all font-black uppercase text-[10px] tracking-widest active:scale-95"
            >
              <Plus size={18} />
              New Lead Entry
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
         <div className="flex gap-4 h-full min-w-[1200px]">
            {STATUS_COLUMNS.map(col => (
                <div key={col.id} className="flex-1 flex flex-col min-w-[280px] bg-gray-100/50 rounded-[2rem] border border-gray-200 shadow-inner">
                    <div className={`p-4 rounded-t-[2rem] border-b ${col.color} flex justify-between items-center`}>
                        <span className="font-black uppercase text-[10px] tracking-widest ml-2">{col.label}</span>
                        <span className="bg-white bg-opacity-60 px-3 py-1 rounded-full text-[10px] font-black">
                            {filteredLeads.filter(l => l.status === col.id).length}
                        </span>
                    </div>
                    
                    <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                        {filteredLeads
                           .filter(l => l.status === col.id)
                           .map(lead => {
                             const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date(new Date().setHours(0,0,0,0));
                             
                             return (
                             <div 
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl cursor-pointer transition-all group relative border-b-4 border-b-transparent hover:border-b-primary"
                             >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        {isOverdue && (
                                            <div className="flex-shrink-0 h-3 w-3 rounded-full bg-red-500 shadow-sm ring-2 ring-white animate-pulse" title="Overdue Follow-up"></div>
                                        )}
                                        <h4 className="font-black text-gray-800 uppercase tracking-tight leading-none">{lead.name}</h4>
                                    </div>
                                    {lead.value && lead.value > 0 && (
                                        <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                            ₹{(lead.value/1000).toFixed(0)}k
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-500 space-y-2 uppercase font-bold tracking-wider">
                                    <div className="flex items-center gap-2"><Phone size={12} className="text-primary"/> {lead.phone}</div>
                                    {lead.nextFollowUp ? (
                                        <div className={`flex items-center gap-2 ${
                                            isOverdue ? 'text-red-600' : 'text-[#3159a6]'
                                        }`}>
                                            <Calendar size={12}/> F/U: {new Date(lead.nextFollowUp).toLocaleDateString('en-IN')}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300 italic"><Calendar size={12}/> Not Scheduled</div>
                                    )}
                                </div>
                                <div className="mt-4 pt-3 border-t flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>{lead.source}</span>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </div>
                             </div>
                           )})
                        }
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in my-auto border-4 border-white">
                <div className="bg-primary p-6 flex justify-between items-center text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {editingLeadId ? <Edit3 size={20}/> : <Plus size={20} />}
                        <h3 className="text-lg font-black uppercase tracking-widest">{editingLeadId ? 'Update Prospect Details' : 'Register New Lead'}</h3>
                    </div>
                    <button onClick={() => { setShowAddModal(false); setEditingLeadId(null); }} className="text-white/80 hover:text-white transition-transform hover:rotate-90"><XCircle size={28}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30">
                    <form id="add-lead-form" onSubmit={handleAddSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Prospect Name *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                    <input required className="w-full pl-12 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none transition font-black bg-white uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Patient Name" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Contact Phone *</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                    <input required className="w-full pl-12 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none transition font-black bg-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Mobile Number" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Follow-up Schedule</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                    <input type="date" className="w-full pl-12 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none transition font-black bg-white" value={formData.nextFollowUp || ''} onChange={e => setFormData({...formData, nextFollowUp: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Ref. Doctor / Consultant</label>
                                <div className="relative">
                                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                    <input className="w-full pl-12 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none transition font-black bg-white uppercase" value={formData.referDoctor || ''} onChange={e => setFormData({...formData, referDoctor: e.target.value})} placeholder="Referring MD" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Inquiry Source</label>
                                <select className="w-full border-2 border-gray-100 rounded-2xl p-4 bg-white font-black uppercase text-[10px]" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                                    <option>Walk-in</option><option>Facebook Ad</option><option>Google Ad</option><option>Referral</option><option>Camp</option><option>Hospital</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">High Intent (HA Potential)</label>
                                <select className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black bg-white uppercase text-[10px]" value={formData.haPotential} onChange={e => setFormData({...formData, haPotential: e.target.value as any})}>
                                    <option value="Yes">Yes (High Interest)</option>
                                    <option value="No">No (General Inquiry)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Patient Location / Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                <input className="w-full pl-12 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none transition font-black bg-white uppercase" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Area or Full Address" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Clinical Observation / Problem</label>
                            <div className="relative">
                                <AlertCircle className="absolute left-4 top-4 text-gray-300" size={18}/>
                                <textarea className="w-full pl-12 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none transition font-medium h-24 resize-none bg-white uppercase text-xs" value={formData.problem || ''} onChange={e => setFormData({...formData, problem: e.target.value})} placeholder="Describe hearing difficulty details..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Executive Notes / Progress Summary</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 text-gray-300" size={18}/>
                                <textarea className="w-full pl-12 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none transition font-medium h-28 resize-none bg-white text-xs" value={formData.comment || ''} onChange={e => setFormData({...formData, comment: e.target.value})} placeholder="Sales notes, trial feedback, etc..." />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-4 flex-shrink-0">
                    <button type="button" onClick={() => { setShowAddModal(false); setEditingLeadId(null); }} className="flex-1 py-4 border-2 border-gray-200 rounded-[2rem] font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-white transition active:scale-95">Cancel</button>
                    <button type="submit" form="add-lead-form" className="flex-[2] bg-primary text-white py-4 rounded-[2rem] hover:bg-slate-800 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all active:scale-95">{editingLeadId ? 'Update Record' : 'Save Inquiry Profile'}</button>
                </div>
            </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-0 overflow-hidden animate-fade-in">
                  <div className="bg-teal-700 p-4 flex justify-between items-center text-white">
                      <h3 className="font-bold flex items-center gap-2"><Send size={18}/> Send Message</h3>
                      <button onClick={() => setShowMessageModal(false)} className="text-teal-200 hover:text-white"><XCircle/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                          {['WhatsApp', 'Email', 'SMS'].map((channel: any) => (
                              <button
                                key={channel}
                                onClick={() => setMessageChannel(channel)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${
                                    messageChannel === channel 
                                        ? 'bg-white text-teal-700 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                  {channel === 'WhatsApp' ? <MessageCircle size={16}/> : channel === 'Email' ? <Mail size={16}/> : <MessageSquare size={16}/>}
                                  {channel}
                              </button>
                          ))}
                      </div>

                      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                          To: <span className="font-bold text-gray-800">{selectedLead.name}</span> 
                          {messageChannel === 'Email' 
                            ? ` <${selectedLead.email || 'No Email'}>` 
                            : ` (${selectedLead.phone})`
                          }
                      </div>

                      {messageChannel === 'Email' && (
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                              <input 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                                value={emailSubject}
                                onChange={e => setEmailSubject(e.target.value)}
                                placeholder="Email Subject"
                              />
                          </div>
                      )}

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                          <textarea 
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                            value={messageBody}
                            onChange={e => setMessageBody(e.target.value)}
                            placeholder="Type your message here..."
                          />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setShowMessageModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                          <button 
                            onClick={handleSendMessage}
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2"
                          >
                              <Send size={16} /> Send & Log
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Lead Details & Activity Panel */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
             <div className="bg-white w-full max-w-xl h-full shadow-2xl animate-slide-in-right flex flex-col">
                <div className="p-6 bg-teal-700 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold uppercase tracking-tight">{selectedLead.name}</h3>
                        <p className="opacity-80 text-sm flex items-center gap-2 mt-1"><Phone size={14}/> {selectedLead.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleOpenEdit(selectedLead)}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition" title="Edit Prospect">
                            <Edit3 size={20}/>
                        </button>
                        {userRole === 'admin' && (
                            <button 
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete lead ${selectedLead.name}?`)) {
                                        onDelete(selectedLead.id);
                                        setSelectedLead(null);
                                    }
                                }}
                                className="text-white/80 hover:text-white hover:bg-red-500/50 p-2 rounded-full transition" title="Delete Lead">
                                <Trash2 size={20}/>
                            </button>
                        )}
                        <button onClick={() => setSelectedLead(null)} className="text-white/80 hover:text-white p-2"><XCircle size={24}/></button>
                    </div>
                </div>
                
                <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status Stage</label>
                        <select 
                            className="bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-2 font-medium"
                            value={selectedLead.status}
                            onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                        >
                            {STATUS_COLUMNS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={openMessageModal} className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Send size={16} /> Msg</button>
                        {selectedLead.status !== 'Won' && (
                            <button onClick={() => handleStatusChange('Won')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><CheckCircle size={16} /> Won</button>
                        )}
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Core Inquiry Details */}
                    <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b pb-2 mb-3">Inquiry Dossier</h4>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Address</p>
                                <p className="font-bold flex items-center gap-2"><MapPin size={12} className="text-teal-600"/> {selectedLead.address || 'Not Registered'}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Date of Birth</p>
                                <p className="font-bold flex items-center gap-2"><Baby size={12} className="text-teal-600"/> {selectedLead.dob || 'Not Provided'}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ref. Doctor</p>
                                <p className="font-bold flex items-center gap-2"><UserCheck size={12} className="text-teal-600"/> {selectedLead.referDoctor || 'Self'}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">HA Potential</p>
                                <p className={`font-black ${selectedLead.haPotential === 'Yes' ? 'text-green-600' : 'text-gray-400'}`}>{selectedLead.haPotential || 'No'}</p>
                             </div>
                             <div className="space-y-1 col-span-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Problem Statement</p>
                                <p className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg border italic">"{selectedLead.problem || 'No specific problem description provided.'}"</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Entry Point</p>
                                <p className="font-bold uppercase text-[11px]">{selectedLead.source} (via {selectedLead.entryBy || 'System'})</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Potential Value</p>
                                <p className="font-bold text-teal-700">₹{(selectedLead.value || 0).toLocaleString()}</p>
                             </div>
                        </div>
                    </div>

                    {/* Follow-up Reminder */}
                    {(() => {
                        const isLeadOverdue = selectedLead.nextFollowUp && new Date(selectedLead.nextFollowUp) < new Date(new Date().setHours(0,0,0,0));
                        return (
                            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${isLeadOverdue ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${isLeadOverdue ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-wider ${isLeadOverdue ? 'text-red-600' : 'text-indigo-600'}`}>Next Follow-up</p>
                                        <p className={`text-lg font-black ${isLeadOverdue ? 'text-red-900' : 'text-indigo-900'}`}>
                                            {selectedLead.nextFollowUp ? new Date(selectedLead.nextFollowUp).toLocaleDateString('en-IN') : 'Unscheduled'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {isLeadOverdue && <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse">OVERDUE</span>}
                                  <button onClick={handleQuickReschedule} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 border-b-2 border-indigo-200 hover:border-indigo-600 transition-all">Reschedule</button>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Interaction Feed */}
                    <div className="space-y-4">
                        <h4 className="font-black text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2"><MessageCircle size={16} className="text-teal-600"/> Engagement History</h4>
                        <div className="space-y-4">
                            {selectedLead.comment && (
                                <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-100 border-dashed text-sm">
                                    <p className="text-[10px] font-black uppercase text-amber-800 mb-1 tracking-widest">Initial Inquiry Comment</p>
                                    <p className="text-amber-900 italic">"{selectedLead.comment}"</p>
                                </div>
                            )}
                            
                            {selectedLead.activities.length === 0 ? (
                                <p className="text-gray-400 text-sm italic py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed">No interaction logs yet.</p>
                            ) : selectedLead.activities.map(act => (
                                <div key={act.id} className="flex gap-3 items-start group">
                                    <div className="mt-1 bg-white border-2 border-gray-100 p-2 rounded-xl text-gray-400 group-hover:text-teal-600 transition-colors">
                                        {act.type === 'Call' ? <Phone size={14}/> : act.type === 'Visit' ? <User size={14}/> : act.type === 'WhatsApp' ? <MessageCircle size={14}/> : <Mail size={14}/>}
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 flex-1 border border-gray-100 hover:border-teal-100 transition-all shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-[10px] text-gray-800 uppercase tracking-widest">{act.type}</span>
                                            <span className="text-[10px] font-bold text-gray-400">{act.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium">{act.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-100 mt-6 shadow-sm">
                            <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3">Log Interaction</h5>
                            <div className="flex gap-2 mb-3">
                                {['Call', 'Visit', 'WhatsApp', 'Note'].map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setNewActivity({...newActivity, type: type as any})}
                                        className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border transition-all ${newActivity.type === type ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                className="w-full border-2 border-blue-100 rounded-xl p-3 text-sm focus:border-blue-600 outline-none transition bg-white/50 h-20 resize-none font-medium"
                                placeholder="Enter details of your interaction..."
                                value={newActivity.content}
                                onChange={e => setNewActivity({...newActivity, content: e.target.value})}
                            />
                            <button onClick={handleAddActivity} className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mt-3 hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Save Activity Log</button>
                        </div>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};