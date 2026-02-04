import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, Activity, UserRole } from '../types';
import { COMPANY_ADDRESS, STAFF_NAMES } from '../constants';
import { Plus, Search, Phone, Calendar, MessageCircle, User, ArrowRight, CheckCircle, XCircle, Clock, Send, MessageSquare, AlertCircle, Trash2, MapPin, Baby, UserCheck, Edit3, List, LayoutGrid, Download, Filter, CheckCircle2, StickyNote, IndianRupee } from 'lucide-react';

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

const SOURCE_OPTIONS = ['Walk-in', 'Ads', 'Referral', 'Facebook', 'Other'];

export const CRM: React.FC<CRMProps> = ({ leads, onAddLead, onUpdateLead, onConvertToPatient, onDelete, userRole }) => {
  const [viewType, setViewType] = useState<'pipeline' | 'schedule'>('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Automation State
  const [showStatusSuccessModal, setShowStatusSuccessModal] = useState(false);
  const [lastStatusChangeLead, setLastStatusChangeLead] = useState<Lead | null>(null);

  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageChannel, setMessageChannel] = useState<'WhatsApp' | 'Email' | 'SMS'>('WhatsApp');
  const [messageBody, setMessageBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', phone: '', address: '', dob: '', comment: '', problem: '', referDoctor: '', haPotential: 'No', entryBy: STAFF_NAMES[0], source: 'Walk-in', status: 'New', value: 0, nextFollowUp: ''
  });

  // Activity Form State
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({ type: 'Call', content: '' });

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

  const scheduleLeads = useMemo(() => {
    return leads.filter(l => l.nextFollowUp === scheduleDate);
  }, [leads, scheduleDate]);

  const exportScheduleToCSV = () => {
    const headers = ['Patient Name', 'Phone', 'Status', 'Inquiry Source', 'Problem', 'Potential Value', 'Scheduled Date'];
    const rows = scheduleLeads.map(l => [
      `"${l.name}"`, l.phone, l.status, l.source, `"${l.problem || 'N/A'}"`, l.value || 0, l.nextFollowUp
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `follow_up_list_${scheduleDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAdd = () => {
    setEditingLeadId(null);
    setFormData({
      name: '', phone: '', address: '', dob: '', comment: '', problem: '', referDoctor: '', haPotential: 'No', entryBy: STAFF_NAMES[0], source: 'Walk-in', status: 'New', value: 0, nextFollowUp: ''
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
        ...existingLead, ...formData as Lead, notes: formData.comment || existingLead.notes
      };
      onUpdateLead(updatedLead);
      if (selectedLead?.id === editingLeadId) setSelectedLead(updatedLead);
    } else {
      const newLead: Lead = {
        id: `L-${Date.now()}`,
        name: formData.name!,
        phone: formData.phone!,
        address: formData.address || '',
        dob: formData.dob || '',
        comment: formData.comment || '',
        problem: formData.problem || '',
        referDoctor: formData.referDoctor || '',
        haPotential: (formData.haPotential as 'Yes' | 'No') || 'No',
        entryBy: formData.entryBy || STAFF_NAMES[0],
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
  };

  const handleAddActivity = () => {
    if (!selectedLead || !newActivity.content) return;
    const activity: Activity = {
        id: `A-${Date.now()}`, type: newActivity.type as any, content: newActivity.content, date: new Date().toISOString().split('T')[0]
    };
    const updatedLead = { ...selectedLead, activities: [activity, ...selectedLead.activities] };
    onUpdateLead(updatedLead);
    setSelectedLead(updatedLead);
    setNewActivity({ type: 'Call', content: '' });
  };

  const handleStatusChange = (status: LeadStatus) => {
      if (!selectedLead) return;
      if (status === 'Won' && selectedLead.status !== 'Won') {
          if (window.confirm("Mark as Won & Convert to Patient?")) onConvertToPatient(selectedLead);
      }
      
      const updatedLead = { ...selectedLead, status };
      onUpdateLead(updatedLead);
      setSelectedLead(updatedLead);

      if (status === 'Appointment') {
        setLastStatusChangeLead(updatedLead);
        setShowStatusSuccessModal(true);
      }
  };

  const handleSendAppointmentWhatsApp = () => {
    if (!lastStatusChangeLead) return;
    const name = lastStatusChangeLead.name;
    const date = lastStatusChangeLead.nextFollowUp ? new Date(lastStatusChangeLead.nextFollowUp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not Scheduled';
    const phone = lastStatusChangeLead.phone.replace(/\D/g, '');
    
    // Use the 'problem' field (Clinical Observation / Notes) as the "remarks" containing the address/instructions
    const remarks = lastStatusChangeLead.problem || lastStatusChangeLead.notes || COMPANY_ADDRESS;
    
    // Bengali/Hinglish Custom Message
    const message = `Namaste ${name} ji,\n\nBengal Rehabilitation & Research Pvt. Ltd. (BRG) theke apnar appointment confirm kora hoyeche.\n\n📅 Date: ${date}\n📍 Details/Address: ${remarks}\n\nDhonyobad! Shighroi clinic-e dekha hobe.`;
    
    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowStatusSuccessModal(false);
  };

  const handleSendMessage = () => {
      if (!selectedLead) return;
      let link = '';
      const cleanPhone = selectedLead.phone.replace(/\D/g, '');
      const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      if (messageChannel === 'WhatsApp') link = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(messageBody)}`;
      else if (messageChannel === 'Email') link = `mailto:${selectedLead.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}`;
      else if (messageChannel === 'SMS') link = `sms:${cleanPhone}?body=${encodeURIComponent(messageBody)}`;

      const activity: Activity = {
          id: `A-${Date.now()}`, type: messageChannel as any, content: `Auto-Log: Sent ${messageChannel} - ${messageBody}`, date: new Date().toISOString().split('T')[0]
      };
      onUpdateLead({ ...selectedLead, activities: [activity, ...selectedLead.activities] });
      window.open(link, '_blank');
      setShowMessageModal(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
            <User className="h-6 w-6 text-primary" /> CRM Hub
          </h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Lead Pipeline & Daily Follow-ups</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-sm border flex items-center">
                <button onClick={() => setViewType('pipeline')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${viewType === 'pipeline' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}>
                    <LayoutGrid size={14} /> Pipeline
                </button>
                <button onClick={() => setViewType('schedule')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${viewType === 'schedule' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}>
                    <List size={14} /> Daily Tasks
                </button>
            </div>

            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
                 <Search className="text-gray-400" size={16} />
                 <input type="text" placeholder="Find lead..." className="outline-none text-xs font-bold w-32" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <button onClick={handleOpenAdd} className="bg-primary hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xl transition-all font-black uppercase text-[10px] tracking-widest">
              <Plus size={18} /> New Entry
            </button>
        </div>
      </div>

      {viewType === 'pipeline' ? (
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 h-full min-w-[1200px]">
            {STATUS_COLUMNS.map(col => (
                <div key={col.id} className="flex-1 flex flex-col min-w-[280px] bg-gray-100/50 rounded-[2rem] border border-gray-200 shadow-inner">
                    <div className={`p-4 rounded-t-[2rem] border-b ${col.color} flex justify-between items-center`}>
                        <span className="font-black uppercase text-[10px] tracking-widest ml-2">{col.label}</span>
                        <span className="bg-white/60 px-3 py-1 rounded-full text-[10px] font-black">{filteredLeads.filter(l => l.status === col.id).length}</span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                        {filteredLeads.filter(l => l.status === col.id).map(lead => (
                             <div key={lead.id} onClick={() => setSelectedLead(lead)} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl cursor-pointer transition-all group relative border-b-4 border-b-transparent hover:border-b-primary">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-black text-gray-800 uppercase tracking-tight leading-none">{lead.name}</h4>
                                    {lead.nextFollowUp === new Date().toISOString().split('T')[0] && (
                                        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" title="Follow-up Today"></span>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-500 space-y-2 uppercase font-bold tracking-wider">
                                    <div className="flex items-center gap-2"><Phone size={12} className="text-primary"/> {lead.phone}</div>
                                    {lead.nextFollowUp && <div className="flex items-center gap-2 text-[#3159a6]"><Calendar size={12}/> F/U: {new Date(lead.nextFollowUp).toLocaleDateString('en-IN')}</div>}
                                    {lead.value ? <div className="flex items-center gap-2 text-teal-600 font-black"><IndianRupee size={12}/> {lead.value.toLocaleString()}</div> : null}
                                </div>
                                <div className="mt-4 pt-3 border-t flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>{lead.source}</span>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl border-2 border-primary/20 shadow-inner flex items-center gap-3">
                        <Filter size={16} className="text-primary ml-2"/>
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="outline-none font-black text-xs uppercase text-primary" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Found <span className="text-primary">{scheduleLeads.length}</span> Scheduled follow-ups
                    </p>
                </div>
                <button onClick={exportScheduleToCSV} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition active:scale-95">
                    <Download size={14}/> Export Today's List
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-primary text-white text-[10px] font-black uppercase tracking-widest z-10">
                        <tr>
                            <th className="p-5">Lead / Contact</th>
                            <th className="p-5">Inquiry Focus</th>
                            <th className="p-5">Current Stage</th>
                            <th className="p-5">Last Activity</th>
                            <th className="p-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {scheduleLeads.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic font-black uppercase text-xs tracking-widest">No follow-ups scheduled for this date</td></tr>
                        ) : scheduleLeads.map(lead => (
                            <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="p-5" onClick={() => setSelectedLead(lead)}>
                                    <p className="font-black text-gray-800 uppercase tracking-tight">{lead.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1"><Phone size={10}/> {lead.phone}</p>
                                </td>
                                <td className="p-5 max-w-xs" onClick={() => setSelectedLead(lead)}>
                                    <p className="text-[10px] font-bold text-gray-600 line-clamp-2 uppercase italic">"{lead.problem || lead.comment || 'No specific notes'}"</p>
                                </td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 ${STATUS_COLUMNS.find(c => c.id === lead.status)?.color}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="p-5">
                                    {lead.activities.length > 0 ? (
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">
                                            <p className="text-gray-600">{lead.activities[0].type}</p>
                                            <p>{lead.activities[0].date}</p>
                                        </div>
                                    ) : <span className="text-[10px] text-gray-300 uppercase italic">No history</span>}
                                </td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => setSelectedLead(lead)} className="p-2 bg-blue-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"><Phone size={16}/></button>
                                        <button onClick={() => handleOpenEdit(lead)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-800 hover:text-white transition-all shadow-sm"><Edit3 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in my-auto border-4 border-white">
                <div className="bg-primary p-6 flex justify-between items-center text-white">
                    <h3 className="text-lg font-black uppercase tracking-widest">{editingLeadId ? 'Update Record' : 'New Inquiry'}</h3>
                    <button onClick={() => setShowAddModal(false)} className="hover:rotate-90 transition-transform"><XCircle size={28}/></button>
                </div>
                <form onSubmit={handleAddSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Name *</label>
                            <input required className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black uppercase bg-gray-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Phone *</label>
                            <input required className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black bg-gray-50" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Baby size={12}/> Date of Birth (Optional)</label>
                            <input type="date" className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black bg-gray-50" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Inquiry Source</label>
                            <select className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black uppercase bg-gray-50" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                                {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Next Follow-up Date</label>
                            <input type="date" className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black bg-gray-50" value={formData.nextFollowUp || ''} onChange={e => setFormData({...formData, nextFollowUp: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Budget Estimate (Optional)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="number" className="w-full pl-11 border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black bg-gray-50" value={formData.value || ''} onChange={e => setFormData({...formData, value: Number(e.target.value)})} placeholder="0.00" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Address / Location</label>
                            <input className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black uppercase bg-gray-50" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Entry By (Staff) *</label>
                            <select required className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none font-black uppercase bg-gray-50" value={formData.entryBy} onChange={e => setFormData({...formData, entryBy: e.target.value})}>
                                {STAFF_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Clinical Observation / Notes</label>
                        <textarea className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-primary outline-none h-32 font-medium bg-gray-50" value={formData.problem} onChange={e => setFormData({...formData, problem: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition active:scale-95 text-xs">Save Inquiry Record</button>
                </form>
            </div>
        </div>
      )}

      {/* Appointment/Status Change Automation Modal */}
      {showStatusSuccessModal && lastStatusChangeLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-white">
                  <div className="p-10 text-center space-y-6">
                      <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-purple-100 shadow-inner">
                          <CheckCircle2 size={48} />
                      </div>
                      <div>
                          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Status Updated!</h3>
                          <p className="text-sm text-gray-500 font-bold mt-2">Lead moved to <b>Appointment</b> stage.</p>
                      </div>
                      
                      <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-50 text-left">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Target Lead</p>
                          <p className="font-black text-gray-800 uppercase">{lastStatusChangeLead.name}</p>
                          <p className="text-xs font-bold text-blue-600 mt-1">
                              📅 {lastStatusChangeLead.nextFollowUp ? new Date(lastStatusChangeLead.nextFollowUp).toLocaleDateString('en-IN') : 'Date not set'}
                          </p>
                      </div>

                      <div className="space-y-3">
                          <button onClick={handleSendAppointmentWhatsApp} className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-teal-700 transition flex items-center justify-center gap-3 text-xs">
                              <MessageCircle size={18}/> Send Appointment Confirmation
                          </button>
                          <button onClick={() => setShowStatusSuccessModal(false)} className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-800 transition">
                              Skip for now
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Detail Panel */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-xl h-full shadow-2xl animate-slide-in-right flex flex-col">
                <div className="p-6 bg-primary text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold uppercase tracking-tight">{selectedLead.name}</h3>
                        <p className="opacity-80 text-sm flex items-center gap-2 mt-1"><Phone size={14}/> {selectedLead.phone}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(selectedLead)} className="p-2 hover:bg-white/10 rounded-full transition"><Edit3 size={20}/></button>
                        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white/10 rounded-full transition"><XCircle size={24}/></button>
                    </div>
                </div>

                <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                     <select className="bg-white border border-gray-300 rounded-lg p-2 font-bold text-xs uppercase" value={selectedLead.status} onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}>
                        {STATUS_COLUMNS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                     <div className="flex gap-2">
                        <button onClick={() => { setMessageBody(`Hi ${selectedLead.name}, calling regarding your hearing check-up.`); setShowMessageModal(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow hover:bg-teal-700 transition">Message</button>
                        {selectedLead.status !== 'Won' && (
                            <button onClick={() => handleStatusChange('Won')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow hover:bg-green-700 transition">Won</button>
                        )}
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase text-gray-500">
                             <div><p className="text-[9px] text-gray-400">Next F/U</p><p className="text-primary font-black">{selectedLead.nextFollowUp || 'None'}</p></div>
                             <div><p className="text-[9px] text-gray-400">Source</p><p>{selectedLead.source}</p></div>
                             {selectedLead.dob && <div><p className="text-[9px] text-gray-400">Date of Birth</p><p>{new Date(selectedLead.dob).toLocaleDateString('en-IN')}</p></div>}
                             {selectedLead.value ? <div><p className="text-[9px] text-gray-400">Budget</p><p className="text-teal-600 font-black">₹{selectedLead.value.toLocaleString()}</p></div> : null}
                             <div className="col-span-2"><p className="text-[9px] text-gray-400">Entry By</p><p className="text-primary">{selectedLead.entryBy || 'N/A'}</p></div>
                        </div>
                        <div className="pt-2 border-t"><p className="text-[9px] text-gray-400 uppercase font-black">Clinical Summary</p><p className="text-gray-700 italic mt-1 font-medium">"{selectedLead.problem || 'No details recorded.'}"</p></div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-black text-gray-800 text-[10px] uppercase tracking-widest flex items-center gap-2"><MessageCircle size={16} className="text-primary"/> Activity Log</h4>
                        <div className="space-y-4">
                            {selectedLead.activities.map(act => (
                                <div key={act.id} className="flex gap-3 items-start">
                                    <div className="mt-1 bg-blue-50 p-2 rounded-xl text-primary"><StickyNote size={14}/></div>
                                    <div className="bg-gray-50 rounded-2xl p-4 flex-1 border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-[9px] text-gray-800 uppercase tracking-widest">{act.type}</span>
                                            <span className="text-[9px] font-bold text-gray-400">{act.date}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">{act.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50/50 p-5 rounded-3xl border-2 border-blue-50 mt-6">
                            <div className="flex gap-2 mb-3">
                                {['Call', 'Visit', 'WhatsApp', 'Note'].map(type => (
                                    <button key={type} onClick={() => setNewActivity({...newActivity, type: type as any})} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition ${newActivity.type === type ? 'bg-primary text-white' : 'bg-white text-gray-400'}`}>{type}</button>
                                ))}
                            </div>
                            <textarea className="w-full border-2 border-white rounded-xl p-3 text-xs h-20 resize-none outline-none font-medium" placeholder="Log outcome..." value={newActivity.content} onChange={e => setNewActivity({...newActivity, content: e.target.value})} />
                            <button onClick={handleAddActivity} className="w-full bg-primary text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest mt-3 hover:bg-slate-800 transition">Record Log</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Quick Message Modal */}
      {showMessageModal && selectedLead && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                  <div className="bg-teal-700 p-5 text-white flex justify-between items-center font-black uppercase tracking-widest">
                      <h3>Send Quick Message</h3>
                      <button onClick={() => setShowMessageModal(false)}><XCircle/></button>
                  </div>
                  <div className="p-8 space-y-4">
                      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                          {['WhatsApp', 'Email', 'SMS'].map((c: any) => (
                              <button key={c} onClick={() => setMessageChannel(c)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition ${messageChannel === c ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400'}`}>{c}</button>
                          ))}
                      </div>
                      <textarea className="w-full border-2 border-gray-100 rounded-xl p-4 text-xs h-32 resize-none font-medium" value={messageBody} onChange={e => setMessageBody(e.target.value)} />
                      <button onClick={handleSendMessage} className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-teal-700 transition">Send & Auto-Log</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};