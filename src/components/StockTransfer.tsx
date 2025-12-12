import React, { useState } from 'react';
import { HearingAid, LOCATIONS, StockTransfer as StockTransferType } from '../types';
import { ArrowRightLeft, MapPin, Truck, History, ArrowRight, Search, User, UserCheck, Box, StickyNote, Calendar, X, Filter } from 'lucide-react';

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
    
    // date is YYYY-MM-DD
    const matchesStartDate = !startDate || log.date >= startDate;
    const matchesEndDate = !endDate || log.date <= endDate;
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const selectedItem = inventory.find(i => i.id === selectedItemId);

  const handleTransfer = () => {
    if (!selectedItemId || !targetLocation) return;
    if (selectedItem?.location === targetLocation) {
      alert("Source and destination cannot be same.");
      return;
    }
    if (!sender || !transporter || !receiver) {
        alert("Please fill in Sender, Transporter, and Receiver fields.");
        return;
    }
    
    onTransfer(selectedItemId, targetLocation, sender, transporter, receiver, note);
    
    setSelectedItemId('');
    setSender('');
    setTransporter('');
    setReceiver('');
    setNote('');
    alert("Stock transferred successfully! Item location updated.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Truck className="text-primary" />
        Stock Transfer
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">New Transfer Request</h3>
        </div>
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-500 font-medium uppercase text-xs tracking-wider">
                    <MapPin size={14} /> From / Item
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input 
                            type="text" 
                            placeholder="Search Brand, Model, Serial..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSelectedItemId(''); 
                            }}
                        />
                    </div>

                    <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    >
                    <option value="">{filteredItems.length === 0 ? 'No items found' : 'Select Hearing Aid...'}</option>
                    {filteredItems.map(item => (
                        <option key={item.id} value={item.id}>
                        {item.brand} {item.model} ({item.location}) - {item.serialNumber}
                        </option>
                    ))}
                    </select>

                    {selectedItem && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 animate-fade-in">
                        <p className="font-bold text-gray-700">{selectedItem.brand} {selectedItem.model}</p>
                        <p className="text-gray-500">Current Loc: <span className="text-blue-600 font-medium">{selectedItem.location}</span></p>
                    </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <div className="bg-teal-50 p-3 rounded-full text-teal-600">
                    <ArrowRightLeft size={32} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-500 font-medium uppercase text-xs tracking-wider">
                    <MapPin size={14} /> To Location
                    </div>
                    <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    >
                    {LOCATIONS.map(loc => (
                        <option key={loc} value={loc} disabled={selectedItem?.location === loc}>
                        {loc}
                        </option>
                    ))}
                    </select>
                </div>
            </div>
            
            <div className="pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <User size={14}/> Sender
                    </label>
                    <input 
                        type="text" 
                        placeholder="Name of Sender"
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-500"
                        value={sender}
                        onChange={e => setSender(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Box size={14}/> Transporter / Courier
                    </label>
                    <input 
                        type="text" 
                        placeholder="Person or Agency Name"
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-500"
                        value={transporter}
                        onChange={e => setTransporter(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <UserCheck size={14}/> Receiver
                    </label>
                    <input 
                        type="text" 
                        placeholder="Name of Receiver"
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-500"
                        value={receiver}
                        onChange={e => setReceiver(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <StickyNote size={14}/> Notes (Optional)
                </label>
                <textarea 
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    rows={2}
                    placeholder="Add specific remarks about condition, urgency, or instructions..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
            </div>

        </div>
        
        <div className="bg-gray-50 p-6 flex justify-end border-t">
          <button
            onClick={handleTransfer}
            disabled={!selectedItemId}
            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-teal-800 transition shadow disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            <Truck size={18} />
            Confirm & Move Stock
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <History size={20} /> Recent Transfer History
            </h3>
            
            {/* History Filter Section */}
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-2 rounded-lg border shadow-sm w-full md:w-auto">
                <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Item search..." 
                        className="w-full pl-7 pr-2 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-2 border-l border-gray-200">
                    <Calendar size={14} className="text-gray-400" />
                    <input 
                      type="date" 
                      className="bg-transparent text-xs outline-none focus:text-teal-600"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input 
                      type="date" 
                      className="bg-transparent text-xs outline-none focus:text-teal-600"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    {(startDate || endDate) && (
                        <button 
                          onClick={() => { setStartDate(''); setEndDate(''); }}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                          title="Reset Dates"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Item Details</th>
                        <th className="p-4">Route</th>
                        <th className="p-4">Logistics</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredHistory.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">No transfers recorded for the selected criteria.</td></tr>
                    ) : (
                        filteredHistory.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="p-4 text-sm text-gray-600">
                                    {log.date}
                                    <span className="block text-xs text-gray-400 font-mono mt-1">{log.id}</span>
                                </td>
                                <td className="p-4">
                                    <p className="font-medium text-gray-800">{log.brand} {log.model}</p>
                                    <p className="text-xs text-gray-500 font-mono">SN: {log.serialNumber}</p>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600">{log.fromLocation}</span>
                                        <ArrowRight size={14} className="text-teal-500" />
                                        <span className="font-medium text-teal-700">{log.toLocation}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-xs text-gray-500 space-y-1">
                                    <div><span className="font-bold text-gray-600">From:</span> {log.sender || '-'}</div>
                                    <div><span className="font-bold text-gray-600">Via:</span> {log.transporter || '-'}</div>
                                    <div><span className="font-bold text-gray-600">To:</span> {log.receiver || '-'}</div>
                                    {log.note && (
                                        <div className="mt-1 pt-1 border-t border-gray-200 text-gray-500 italic">
                                            "{log.note}"
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Completed</span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};