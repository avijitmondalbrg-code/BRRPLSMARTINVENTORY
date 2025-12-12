import React, { useState } from 'react';
import { HearingAid, LOCATIONS, StockTransfer as StockTransferType } from '../types';
import { ArrowRightLeft, MapPin, Truck, History, ArrowRight, Search, User, UserCheck, Box, StickyNote, Calendar, X } from 'lucide-react';

interface StockTransferProps {
  inventory: HearingAid[];
  transferHistory: StockTransferType[];
  onTransfer: (itemId: string, toLocation: string, sender: string, transporter: string, receiver: string, note: string) => void;
}

export const StockTransfer: React.FC<StockTransferProps> = ({ inventory, transferHistory, onTransfer }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [targetLocation, setTargetLocation] = useState(LOCATIONS[1]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // History Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [sender, setSender] = useState('');
  const [transporter, setTransporter] = useState('');
  const [receiver, setReceiver] = useState('');
  const [note, setNote] = useState('');

  const availableItems = inventory.filter(i => i.status === 'Available');
  const filteredItems = availableItems.filter(item => 
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = transferHistory.filter(log => {
    const matchesStart = !startDate || log.date >= startDate;
    const matchesEnd = !endDate || log.date <= endDate;
    return matchesStart && matchesEnd;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleTransfer = () => {
    if (!selectedItemId || !targetLocation || !sender || !transporter || !receiver) {
      return alert("Please fill all logistics fields before confirming.");
    }
    onTransfer(selectedItemId, targetLocation, sender, transporter, receiver, note);
    setSelectedItemId(''); setSender(''); setTransporter(''); setReceiver(''); setNote('');
    alert("Stock movement confirmed and updated in inventory.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Truck className="text-primary h-6 w-6" /> Stock Transfer Manager</h2>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8 space-y-8 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-black">1</div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase">New Transfer Request</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Source Item & Serial</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="text" placeholder="Filter stock..." className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                    </div>
                    <select className="w-full border-2 border-gray-100 p-3 rounded-xl text-sm bg-white font-medium focus:border-teal-500 outline-none" value={selectedItemId} onChange={e=>setSelectedItemId(e.target.value)}>
                      <option value="">Select Device...</option>
                      {filteredItems.map(item => (
                        <option key={item.id} value={item.id}>{item.brand} {item.model} ({item.location}) - {item.serialNumber}</option>
                      ))}
                    </select>
                </div>
                <div className="flex justify-center text-teal-600">
                   <div className="h-16 w-16 bg-white shadow-lg rounded-full flex items-center justify-center ring-8 ring-teal-50">
                     <ArrowRightLeft size={32} />
                   </div>
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 text-right block">Destination Location</label>
                    <select className="w-full border-2 border-gray-100 p-3 rounded-xl text-sm bg-white font-black text-teal-900 focus:border-teal-500 outline-none" value={targetLocation} onChange={e=>setTargetLocation(e.target.value)}>
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="pt-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block mb-3">Logistics & Personnel Details</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <input placeholder="Sender Name *" className="border-2 border-gray-50 bg-gray-50/30 p-3 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none font-medium" value={sender} onChange={e=>setSender(e.target.value)} />
                    <input placeholder="Transporter / Agency *" className="border-2 border-gray-50 bg-gray-50/30 p-3 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none font-medium" value={transporter} onChange={e=>setTransporter(e.target.value)} />
                    <input placeholder="Receiver Name *" className="border-2 border-gray-50 bg-gray-50/30 p-3 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none font-medium" value={receiver} onChange={e=>setReceiver(e.target.value)} />
                </div>
            </div>
            
            <button onClick={handleTransfer} disabled={!selectedItemId} className="w-full bg-teal-800 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-900/20 hover:bg-teal-900 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed">Confirm Stock Move</button>
      </div>
      
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 uppercase tracking-tight"><History size={24} className="text-teal-600" /> Audit History</h3>
            
            <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl border border-gray-100 shadow-sm">
                <Calendar size={18} className="text-teal-600" />
                <span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">Audit Range</span>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-teal-700 font-bold" />
                <span className="text-gray-300 font-bold">to</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-teal-700 font-bold" />
                {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-gray-400 hover:text-red-500 transition ml-1"><X size={18}/></button>}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-black text-[10px] tracking-[0.1em]">
                        <tr>
                          <th className="p-5">Transfer Date</th>
                          <th className="p-5">Device Identity</th>
                          <th className="p-5">Movement Route</th>
                          <th className="p-5">Logistics Log</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredHistory.length === 0 ? (
                          <tr><td colSpan={4} className="p-20 text-center text-gray-400 italic">No transfer records found for this period.</td></tr>
                        ) : filteredHistory.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-5">
                                  <div className="font-bold text-gray-800">{new Date(log.date).toLocaleDateString('en-IN')}</div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-1">REF: {log.id}</div>
                                </td>
                                <td className="p-5">
                                    <p className="font-black text-gray-900 uppercase">{log.brand} {log.model}</p>
                                    <p className="text-[10px] text-teal-600 font-black uppercase mt-1 tracking-widest">S/N: {log.serialNumber}</p>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{log.fromLocation}</div>
                                        <ArrowRight size={14} className="text-teal-500 animate-pulse" />
                                        <div className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">{log.toLocation}</div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase space-y-1">
                                      <div className="flex items-center gap-1.5"><span className="text-gray-300 w-12">SENDER:</span> <span className="text-gray-800">{log.sender}</span></div>
                                      <div className="flex items-center gap-1.5"><span className="text-gray-300 w-12">VIA:</span> <span className="text-gray-800">{log.transporter}</span></div>
                                      <div className="flex items-center gap-1.5"><span className="text-gray-300 w-12">RECV:</span> <span className="text-gray-800 font-black">{log.receiver}</span></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
          <div className="text-center pb-8">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">End of Stock Movement Log</p>
          </div>
      </div>
    </div>
  );
};