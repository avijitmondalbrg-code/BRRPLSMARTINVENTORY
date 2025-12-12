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
  const filteredItems = availableItems.filter(item => item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || item.model.toLowerCase().includes(searchTerm.toLowerCase()) || item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredHistory = transferHistory.filter(log => {
    const matchesStart = !startDate || log.date >= startDate;
    const matchesEnd = !endDate || log.date <= endDate;
    return matchesStart && matchesEnd;
  });

  const handleTransfer = () => {
    if (!selectedItemId || !targetLocation || !sender || !transporter || !receiver) return alert("Fill all logistics fields.");
    onTransfer(selectedItemId, targetLocation, sender, transporter, receiver, note);
    setSelectedItemId(''); setSender(''); setTransporter(''); setReceiver(''); setNote('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Truck className="text-primary" /> Stock Transfer</h2>

      <div className="bg-white rounded-xl shadow border overflow-hidden p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="space-y-4">
                    <div className="text-xs font-bold uppercase text-gray-400">Source Item</div>
                    <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="text" placeholder="Filter stock..." className="w-full pl-8 pr-2 py-1.5 border rounded text-sm" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
                    <select className="w-full border p-2 rounded text-sm" value={selectedItemId} onChange={e=>setSelectedItemId(e.target.value)}><option value="">Select Stock...</option>{filteredItems.map(item => <option key={item.id} value={item.id}>{item.brand} {item.model} ({item.location}) - {item.serialNumber}</option>)}</select>
                </div>
                <div className="flex justify-center text-teal-600"><ArrowRightLeft size={32} /></div>
                <div className="space-y-4">
                    <div className="text-xs font-bold uppercase text-gray-400">Target Location</div>
                    <select className="w-full border p-2 rounded text-sm" value={targetLocation} onChange={e=>setTargetLocation(e.target.value)}>{LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
                </div>
            </div>
            
            <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="Sender Name" className="border p-2 rounded text-sm" value={sender} onChange={e=>setSender(e.target.value)} />
                <input placeholder="Transporter" className="border p-2 rounded text-sm" value={transporter} onChange={e=>setTransporter(e.target.value)} />
                <input placeholder="Receiver Name" className="border p-2 rounded text-sm" value={receiver} onChange={e=>setReceiver(e.target.value)} />
            </div>
            <button onClick={handleTransfer} disabled={!selectedItemId} className="w-full bg-primary text-white py-3 rounded-lg font-bold shadow hover:bg-teal-800 disabled:opacity-50">Confirm Stock Move</button>
      </div>
      
      <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><History size={20} /> Transfer History</h3>
            <div className="flex items-center gap-2 bg-white p-1.5 px-3 rounded-lg border border-gray-200">
                <Calendar size={16} className="text-gray-400" /><span className="text-[10px] font-black uppercase text-gray-400">Range</span>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                <span className="text-gray-300">to</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-red-400"><X size={14}/></button>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                    <tr><th className="p-4">Date</th><th className="p-4">Item</th><th className="p-4">Route</th><th className="p-4">Logistics</th></tr>
                </thead>
                <tbody className="divide-y">
                    {filteredHistory.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                            <td className="p-4 text-gray-500">{log.date}</td>
                            <td className="p-4 font-medium">{log.brand} {log.model}<p className="text-[10px] text-gray-400 font-mono">SN: {log.serialNumber}</p></td>
                            <td className="p-4"><div className="flex items-center gap-2"><span>{log.fromLocation}</span><ArrowRight size={12} className="text-teal-500" /><span className="font-bold">{log.toLocation}</span></div></td>
                            <td className="p-4 text-[10px] text-gray-400 uppercase font-bold">F: {log.sender} | V: {log.transporter} | T: {log.receiver}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};