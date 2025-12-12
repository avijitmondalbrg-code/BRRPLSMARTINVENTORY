

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Activity, Patient, UserRole } from '../types';
// FIX: Import Trash2 icon
import { Plus, Search, Phone, Calendar, MessageCircle, MoreVertical, User, ArrowRight, CheckCircle, XCircle, Clock, IndianRupee, Lock, Mail, Send, MessageSquare, StickyNote, AlertCircle, Trash2 } from 'lucide-react';

interface CRMProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onConvertToPatient: (lead: Lead) => void;
  // FIX: Add onDelete prop
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

// FIX: Add onDelete to component props
export const CRM: React.FC<CRMProps> = ({ leads, onAddLead, onUpdateLead, onConvertToPatient, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageChannel, setMessageChannel] = useState<'WhatsApp' | 'Email' | 'SMS'>('WhatsApp');
  const [messageBody, setMessageBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Notes State
  const [currentNotes, setCurrentNotes] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', phone: '', source: 'Walk-in', status: 'New', value: 0
  });

  // Activity Form State
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({ type: 'Call', content: '' });

  // Sync notes when lead is selected
  useEffect(() => {
    if (selectedLead) {
        setCurrentNotes(selectedLead.notes || '');
    }
  }, [selectedLead]);

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

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
    setFormData({ name: '', phone: '', source: 'Walk-in', status: 'New', value: 0 });
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
      
      // If moving to Won, prompt for conversion
      if (status === 'Won' && selectedLead.status !== 'Won') {
          if (window.confirm("Lead Marked as Won! Do you want to register them as a Patient?")) {
             onConvertToPatient(selectedLead);
          }
      }

      const updatedLead = { ...selectedLead, status };
      onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);
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

      // Clean phone number (remove spaces, dashes)
      const cleanPhone = selectedLead.phone.replace(/\D/g, '');
      const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone; // Assume India if 10 digits

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
          // SMS Links vary by device, generic approach
          const encodedBody = encodeURIComponent(messageBody);
          link = `sms:${cleanPhone}?body=${encodedBody}`;
          logType = 'SMS';
          content = `Sent SMS: "${messageBody}"`;
      }

      // Log the activity
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
      
      // Open the external app
      window.open(link, '_blank');
      setShowMessageModal(false);
  };

  const handleSaveNotes = () => {
      if (!selectedLead) return;
      const updatedLead = { ...selectedLead, notes: currentNotes };
      onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);
      alert("Notes saved successfully.");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Sales CRM Pipeline
        </h2>
        <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2">
                 <Search className="text-gray-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search Leads..." 
                    className="outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
            </div>
            {userRole === 'admin' ? (
                <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"
                >
                <Plus size={20} />
                Add Lead
                </button>
            ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-100 px-3 py-1.5 rounded-full border">
                    <Lock size={14} /> Read-Only Mode
                </div>
            )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
         <div className="flex gap-4 h-full min-w-[1200px]">
            {STATUS_COLUMNS.map(col => (
                <div key={col.id} className="flex-1 flex flex-col min-w-[250px] bg-gray-100/50 rounded-xl border border-gray-200">
                    {/* Column Header */}
                    <div className={`p-3 rounded-t-xl border-b ${col.color} bg-opacity-50 flex justify-between items-center`}>
                        <span className="font-bold text-sm">{col.label}</span>
                        <span className="bg-white bg-opacity-60 px-2 py-0.5 rounded text-xs font-bold">
                            {filteredLeads.filter(l => l.status === col.id).length}
                        </span>
                    </div>
                    
                    {/* Column Body */}
                    <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {filteredLeads
                           .filter(l => l.status === col.id)
                           .map(lead => {
                             const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date(new Date().setHours(0,0,0,0));
                             
                             return (
                             <div 
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition group relative"
                             >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {isOverdue && (
                                            <div className="flex-shrink-0 h-3 w-3 rounded-full bg-red-500 shadow-sm ring-2 ring-white animate-pulse" title="Overdue Follow-up"></div>
                                        )}
                                        <h4 className="font-bold text-gray-800">{lead.name}</h4>
                                    </div>
                                    {lead.value && lead.value > 0 && (
                                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                                            <IndianRupee size={12} />
                                            {(lead.value/1000).toFixed(0)}k
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div className="flex items-center gap-1"><Phone size={12}/> {lead.phone}</div>
                                    {lead.nextFollowUp && (
                                        <div className={`flex items-center gap-1 font-medium ${
                                            isOverdue ? 'text-red-600' : 'text-orange-600'
                                        }`}>
                                            <Clock size={12}/> F/U: {new Date(lead.nextFollowUp).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 pt-2 border-t flex justify-between items-center text-xs text-gray-400">
                                    <span>{lead.source}</span>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
                                </div>
                             </div>
                           )})
                        }
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Add New Lead</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle/></button>
                </div>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input required className="w-full border rounded-lg p-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                            <select className="w-full border rounded-lg p-2 bg-white" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                                <option>Walk-in</option>
                                <option>Facebook Ad</option>
                                <option>Google Ad</option>
                                <option>Referral</option>
                                <option>Camp</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Potential Value</label>
                            <input type="number" className="w-full border rounded-lg p-2" value={formData.value || ''} onChange={e => setFormData({...formData, value: Number(e.target.value)})} placeholder="0.00"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow Up</label>
                        <input type="date" className="w-full border rounded-lg p-2" value={formData.nextFollowUp || ''} onChange={e => setFormData({...formData, nextFollowUp: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-teal-800 font-medium">Add to Pipeline</button>
                </form>
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
                      {/* Channel Selection */}
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

                      {/* Info Bar */}
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

      {/* Lead Details & Activity Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
             <div className="bg-white w-full max-w-lg h-full shadow-2xl animate-slide-in-right flex flex-col">
                <div className="p-6 bg-teal-700 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">{selectedLead.name}</h3>
                        <p className="opacity-80 text-sm flex items-center gap-2 mt-1"><Phone size={14}/> {selectedLead.phone}</p>
                    </div>
                    {/* FIX: Add delete button for admins */}
                    <div className="flex items-center gap-2">
                        {userRole === 'admin' && (
                            <button 
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete lead ${selectedLead.name}?`)) {
                                        onDelete(selectedLead.id);
                                        setSelectedLead(null);
                                    }
                                }}
                                className="text-white/80 hover:text-white hover:bg-red-500/50 p-1 rounded-full" title="Delete Lead">
                                <Trash2 size={20}/>
                            </button>
                        )}
                        <button onClick={() => setSelectedLead(null)} className="text-white/80 hover:text-white"><XCircle size={24}/></button>
                    </div>
                </div>
                
                <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Current Stage</label>
                        {userRole === 'admin' ? (
                            <select 
                                className="bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-2.5 font-medium"
                                value={selectedLead.status}
                                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                            >
                                {STATUS_COLUMNS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        ) : (
                            <div className="text-sm font-medium text-gray-800 px-3 py-2 bg-gray-200 rounded-lg">{selectedLead.status}</div>
                        )}
                     </div>
                     <div className="flex gap-2">
                        <button 
                            onClick={openMessageModal}
                            className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                        >
                            <Send size={16} /> Msg
                        </button>
                        {selectedLead.status !== 'Won' && userRole === 'admin' && (
                            <button 
                                onClick={() => handleStatusChange('Won')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                            >
                                <CheckCircle size={16} /> Won
                            </button>
                        )}
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                         <div><span className="text-gray-500">Source:</span> <span className="font-medium text-gray-800">{selectedLead.source}</span></div>
                         <div><span className="text-gray-500">Potential:</span> <span className="font-medium text-gray-800">₹{(selectedLead.value || 0).toLocaleString()}</span></div>
                         <div><span className="text-gray-500">Created:</span> <span className="font-medium text-gray-800">{selectedLead.createdAt}</span></div>
                         {selectedLead.email && (
                             <div className="col-span-2"><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-800">{selectedLead.email}</span></div>
                         )}
                    </div>
                    
                    {/* Prominent Next Follow Up */}
                    {(() => {
                        const isLeadOverdue = selectedLead.nextFollowUp && new Date(selectedLead.nextFollowUp) < new Date(new Date().setHours(0,0,0,0));
                        return (
                            <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all ${
                                isLeadOverdue
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-indigo-50 border-indigo-200'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full flex-shrink-0 ${isLeadOverdue ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {isLeadOverdue ? <AlertCircle size={24} /> : <Calendar size={24} />}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${isLeadOverdue ? 'text-red-600' : 'text-indigo-600'}`}>
                                            {isLeadOverdue ? 'Action Required' : 'Next Scheduled Action'}
                                        </p>
                                        <p className={`text-xl font-bold ${isLeadOverdue ? 'text-red-900' : 'text-indigo-900'}`}>
                                            {selectedLead.nextFollowUp 
                                                ? new Date(selectedLead.nextFollowUp).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
                                                : 'No Follow-up Set'}
                                        </p>
                                    </div>
                                </div>
                                
                                {isLeadOverdue && (
                                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">
                                        OVERDUE
                                    </span>
                                )}
                            </div>
                        );
                    })()}

                    <hr/>

                    {/* General Notes Section */}
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                        <h5 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2"><StickyNote size={16}/> General Notes</h5>
                        <textarea
                            className="w-full border border-amber-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white/50"
                            rows={4}
                            value={currentNotes}
                            onChange={(e) => setCurrentNotes(e.target.value)}
                            placeholder="Add free-form notes about this lead's requirements, preferences, or background..."
                        />
                        <div className="flex justify-end mt-2">
                            {userRole === 'admin' ? (
                                <button 
                                    onClick={handleSaveNotes} 
                                    className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                                >
                                    Save Notes
                                </button>
                            ) : (
                                <span className="text-xs text-amber-600 italic">Read-only view</span>
                            )}
                        </div>
                    </div>

                    <hr/>

                    {/* Activity Feed */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageCircle size={18} /> Activity Log</h4>
                        
                        <div className="space-y-4 mb-6">
                            {selectedLead.activities.length === 0 ? (
                                <p className="text-gray-400 text-sm italic">No activities recorded yet.</p>
                            ) : selectedLead.activities.map(act => (
                                <div key={act.id} className="flex gap-3 items-start">
                                    <div className="mt-1 bg-gray-100 p-1.5 rounded-full text-gray-600">
                                        {act.type === 'Call' ? <Phone size={12}/> : 
                                         act.type === 'Visit' ? <User size={12}/> : 
                                         act.type === 'WhatsApp' ? <MessageCircle size={12}/> :
                                         act.type === 'Email' ? <Mail size={12}/> : 
                                         act.type === 'SMS' ? <MessageSquare size={12}/> :
                                         <MessageCircle size={12}/>}
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 flex-1 border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-xs text-gray-700 uppercase">{act.type}</span>
                                            <span className="text-xs text-gray-400">{act.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{act.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Activity */}
                        {userRole === 'admin' ? (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h5 className="text-sm font-bold text-blue-800 mb-2">Log Interaction</h5>
                                <div className="flex gap-2 mb-2">
                                    {['Call', 'Visit', 'WhatsApp', 'Note'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setNewActivity({...newActivity, type: type as any})}
                                            className={`text-xs px-3 py-1 rounded-full border transition ${newActivity.type === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="w-full border border-blue-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    rows={2}
                                    placeholder="Enter activity log..."
                                    value={newActivity.content}
                                    onChange={e => setNewActivity({...newActivity, content: e.target.value})}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <button onClick={handleAddActivity} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">Save Log</button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center text-sm text-gray-500 italic">
                                Only Admins can add activity logs.
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
