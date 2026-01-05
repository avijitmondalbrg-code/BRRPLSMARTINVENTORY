
import React, { useState } from 'react';
import { HearingAid, LOCATIONS, StockTransfer as StockTransferType } from '../types';
import { ArrowRightLeft, MapPin, Truck, History, ArrowRight, Search, User, UserCheck, Box, StickyNote, Calendar, X, Filter, CheckSquare, Square } from 'lucide-react';

interface StockTransferProps {
  inventory: HearingAid[];
  transferHistory: StockTransferType[];
  onTransfer: (itemId: string, toLocation: string, sender: string, transporter: string, receiver: string, note: string) => void;
}

export const StockTransfer: React.FC<StockTransferProps> = ({ inventory, transferHistory, onTransfer }) => {
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [targetLocation, setTargetLocation] = useState(LOCATIONS[1]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // History Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  
  // Logistics Fields
  const [sender, setSender] = useState('');
  const [transporter, setTransporter] = useState('');
  const [receiver, setReceiver] = useState('');
  const [note, setNote] = useState('');

  const availableItems = inventory.filter(i => i.status === 'Available');
  
  const filteredItems = availableItems.filter(item => 
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = transferHistory.filter(log => {
    const matchesSearch = 
        log.brand.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.model.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.serialNumber.toLowerCase().includes(historySearch.toLowerCase());
    const matchesStartDate = !startDate || log.date >= startDate;
    const matchesEndDate = !endDate || log.date <= endDate;
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleTransfer = () => {
    if (selectedItemIds.length === 0 || !targetLocation) return;
    
    // Validate if any item is already at destination (though logic prevents this usually)
    const hasSameLocation = selectedItemIds.some(id => inventory.find(i => i.id === id)?.location === targetLocation);
    if (hasSameLocation) {
      alert("One or more items are already at the target location.");
      return;
    }

    if (!sender || !transporter || !receiver) {
        alert("Please fill in Sender, Transporter, and Receiver fields.");
        return;
    }
    
    // Execute transfer for each selected item
    selectedItemIds.forEach(id => {
      onTransfer(id, targetLocation, sender, transporter, receiver, note);
    });
    
    setSelectedItemIds([]);
    setSender('');
    setTransporter('');
    setReceiver('');
    setNote('');
    alert(`${selectedItemIds.length} unit(s) transferred successfully! Locations updated.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Truck className="text-primary" />
        Stock Transfer Manager
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">New Transfer Request</h3>
            <button 
              onClick={() => { setIsBulkMode(!isBulkMode); setSelectedItemIds([]); }}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 transition-all ${isBulkMode ? 'bg-[#3159a6] text-white border-[#3159a6]' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}
            >
              {isBulkMode ? 'Bulk Mode: ON' : 'Switch to Bulk'}
            </button>
        </div>
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-gray-50/50 p-6 rounded-2xl border">
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                        <MapPin size={14} /> Item Selection
                      </div>
                      {isBulkMode && <span className="text-[10px] font-bold text-[#3159a6]">{selectedItemIds.length} selected</span>}
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input type="text" placeholder="Search S/N..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    {!isBulkMode ? (
                      <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-sm" 
                        value={selectedItemIds[0] || ''} 
                        onChange={(e) => setSelectedItemIds(e.target.value ? [e.target.value] : [])} 
                      >
                        <option value="">Select Single Item...</option>
                        {filteredItems.map(item => (
                            <option key={item.id} value={item.id}> {item.brand} {item.model} ({item.location}) - {item.serialNumber} </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
                        {filteredItems.length === 0 ? (
                          <p className="p-4 text-center text-xs text-gray-400">No items found</p>
                        ) : (
                          filteredItems.map(item => (
                            <label key={item.id} className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors group">
                              <div 
                                onClick={(e) => { e.preventDefault(); toggleItemSelection(item.id); }}
                                className={`transition-colors ${selectedItemIds.includes(item.id) ? 'text-[#3159a6]' : 'text-gray-300'}`}
                              >
                                {selectedItemIds.includes(item.id) ? <CheckSquare size={18}/> : <Square size={18}/>}
                              </div>
                              <div className="flex-1 overflow-hidden" onClick={() => toggleItemSelection(item.id)}>
                                <p className="font-bold text-xs text-gray-700 truncate uppercase">{item.brand} {item.model}</p>
                                <p className="text-[9px] text-teal-600 font-mono tracking-widest">{item.serialNumber} • {item.location}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    )}

                    {!isBulkMode && selectedItemIds.length > 0 && (
                      <div className="p-3 bg-white rounded-lg text-sm border shadow-sm animate-fade-in border-blue-100">
                        <p className="font-black text-gray-700">{inventory.find(i=>i.id===selectedItemIds[0])?.brand} {inventory.find(i=>i.id===selectedItemIds[0])?.model}</p>
                        <p className="text-xs text-gray-400">Loc: <span className="text-teal-600 font-bold">{inventory.find(i=>i.id===selectedItemIds[0])?.location}</span></p>
                      </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <div className="bg-teal-50 p-3 rounded-full text-teal-600 ring-4 ring-teal-50/50">
                        <ArrowRightLeft size={32} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-500 font-black uppercase text-[10px] tracking-wider ml-1">
                    <MapPin size={14} /> Target Location
                    </div>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none bg-white font-bold text-teal-800" value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} >
                    {LOCATIONS.map(loc => (
                        <option key={loc} value={loc}> {loc} </option>
                    ))}
                    </select>
                </div>
            </div>
            
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sender Name *</label>
                    <input type="text" placeholder="Person sending" className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 bg-gray-50/30" value={sender} onChange={e => setSender(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transporter / Courier *</label>
                    <input type="text" placeholder="Person/Agency name" className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 bg-gray-50/30" value={transporter} onChange={e => setTransporter(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Receiver Name *</label>
                    <input type="text" placeholder="Authorized receiver" className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 bg-gray-50/30" value={receiver} onChange={e => setReceiver(e.target.value)} />
                </div>
            </div>

            <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100">
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest ml-1 mb-2 flex items-center gap-1">
                    <StickyNote size={14}/> Movement Notes & Remarks
                </label>
                <textarea 
                    className="w-full border-2 border-amber-100 rounded-xl p-3 outline-none focus:border-amber-400 text-sm bg-white min-h-[80px] resize-none shadow-inner"
                    rows={2}
                    placeholder="Describe reason for transfer, physical condition of device, or special handling instructions..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
            </div>
        </div>
        
        <div className="bg-gray-50 p-6 flex justify-end border-t">
          <button 
            onClick={handleTransfer} 
            disabled={selectedItemIds.length === 0} 
            className="bg-primary text-white px-10 py-4 rounded-2xl hover:bg-teal-800 transition shadow-xl shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2" 
          >
            <Truck size={18} /> {isBulkMode ? `Confirm ${selectedItemIds.length} Items Move` : 'Confirm Stock Move'}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase tracking-tight"> <History size={20} className="text-teal-600" /> Recent Audit Trail </h3>
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-2 rounded-xl border shadow-sm w-full md:w-auto">
                <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Audit search..." className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-xs outline-none" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 px-2 border-l">
                    <Calendar size={14} className="text-teal-600" />
                    <input type="date" className="bg-transparent text-xs outline-none font-bold" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <span className="text-gray-400 text-xs">to</span>
                    <input type="date" className="bg-transparent text-xs outline-none font-bold" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1 text-red-400"><X size={14} /></button>}
                </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                        <tr><th className="p-5">Date</th><th className="p-5">Device</th><th className="p-5">Movement</th><th className="p-5">Audit Log</th></tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {filteredHistory.length === 0 ? (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">No audit records found.</td></tr>
                        ) : (
                            filteredHistory.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition">
                                    <td className="p-5"><div className="font-bold">{new Date(log.date).toLocaleDateString('en-IN')}</div><div className="text-[10px] text-gray-400 font-mono mt-0.5">{log.id}</div></td>
                                    <td className="p-5"><p className="font-black text-gray-800 uppercase">{log.brand} {log.model}</p><p className="text-[10px] text-teal-600 font-bold font-mono">S/N: {log.serialNumber}</p></td>
                                    <td className="p-5"><div className="flex items-center gap-2"><span className="text-gray-500">{log.fromLocation}</span><ArrowRight size={14} className="text-teal-500" /><span className="font-black text-teal-800">{log.toLocation}</span></div></td>
                                    <td className="p-5 text-[10px] text-gray-500 uppercase font-bold space-y-1">
                                        <div>SNDR: {log.sender || '-'} | VIA: {log.transporter || '-'}</div>
                                        <div>RECV: {log.receiver || '-'}</div>
                                        {log.note && <div className="mt-1 p-1 bg-amber-50 text-amber-800 lowercase border border-amber-100 rounded italic">"{log.note}"</div>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
          </div>
      </div>
    </div>
  );
};
