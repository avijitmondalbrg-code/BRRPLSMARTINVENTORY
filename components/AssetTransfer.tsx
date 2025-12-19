
import React, { useState } from 'react';
import { CompanyAsset, LOCATIONS, AssetTransfer as AssetTransferType } from '../types';
// FIX: Added Plus to the lucide-react import list
import { Truck, ArrowRight, Search, MapPin, User, StickyNote, History, Box, Calendar, X, ArrowRightLeft, Plus } from 'lucide-react';

interface AssetTransferProps {
  assets: CompanyAsset[];
  transferHistory: AssetTransferType[];
  onTransfer: (assetId: string, toLocation: string, sender: string, transporter: string, receiver: string, note: string) => void;
}

export const AssetTransfer: React.FC<AssetTransferProps> = ({ assets, transferHistory, onTransfer }) => {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetLocation, setTargetLocation] = useState(LOCATIONS[1]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Logistics Fields
  const [sender, setSender] = useState('');
  const [transporter, setTransporter] = useState('');
  const [receiver, setReceiver] = useState('');
  const [note, setNote] = useState('');

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const handleTransfer = () => {
    if (!selectedAssetId || !targetLocation) return;
    if (selectedAsset?.location === targetLocation) {
      alert("Source and destination locations cannot be the same.");
      return;
    }
    if (!sender || !transporter || !receiver) {
        alert("Please fill in Sender, Transporter, and Receiver fields.");
        return;
    }
    
    onTransfer(selectedAssetId, targetLocation, sender, transporter, receiver, note);
    
    // Reset fields
    setSelectedAssetId('');
    setSender('');
    setTransporter('');
    setReceiver('');
    setNote('');
    alert("Asset transfer recorded successfully! Asset location updated.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Truck className="text-[#3159a6]" /> Asset Logistic Manager
            </h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">Inter-Hospital Asset Movement</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b bg-gray-50/50">
            <h3 className="font-black text-gray-700 uppercase tracking-tight text-xs flex items-center gap-2">
                <Plus size={16} className="text-[#3159a6]"/> Initiate New Transfer
            </h3>
        </div>
        <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center bg-blue-50/30 p-8 rounded-[2rem] border-2 border-blue-50 border-dashed">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#3159a6] font-black uppercase text-[10px] tracking-[0.2em] ml-1">
                        <Box size={14} /> 1. Select Asset
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input 
                            type="text" 
                            placeholder="Find Machine/Laptop..." 
                            className="w-full pl-10 pr-4 py-3 border-2 border-white rounded-2xl text-sm outline-none focus:border-[#3159a6] bg-white shadow-sm font-bold" 
                            value={searchTerm} 
                            onChange={(e) => { setSearchTerm(e.target.value); setSelectedAssetId(''); }} 
                        />
                    </div>

                    <select 
                        className="w-full border-2 border-white rounded-2xl p-3 focus:border-[#3159a6] outline-none bg-white text-sm font-bold shadow-sm" 
                        value={selectedAssetId} 
                        onChange={(e) => setSelectedAssetId(e.target.value)} 
                    >
                        <option value="">Choose Unit...</option>
                        {filteredAssets.map(asset => (
                            <option key={asset.id} value={asset.id}> {asset.name} - {asset.serialNumber} ({asset.location}) </option>
                        ))}
                    </select>

                    {selectedAsset && (
                        <div className="p-4 bg-white rounded-2xl text-sm border-2 border-blue-100 shadow-sm animate-fade-in">
                            <p className="font-black text-gray-800 uppercase tracking-tighter">{selectedAsset.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">FROM: <span className="text-[#3159a6]">{selectedAsset.location}</span></p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <div className="bg-white p-5 rounded-full text-[#3159a6] shadow-xl border-4 border-blue-50">
                        <ArrowRightLeft size={32} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#3159a6] font-black uppercase text-[10px] tracking-[0.2em] ml-1">
                        <MapPin size={14} /> 2. Target Location
                    </div>
                    <select 
                        className="w-full border-2 border-white rounded-2xl p-3 focus:border-[#3159a6] outline-none bg-white font-black text-[#3159a6] shadow-sm h-[46px]" 
                        value={targetLocation} 
                        onChange={(e) => setTargetLocation(e.target.value)} 
                    >
                        {LOCATIONS.map(loc => (
                            <option key={loc} value={loc} disabled={selectedAsset?.location === loc}> {loc} </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sender Name *</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                        <input type="text" placeholder="Who is sending?" className="w-full pl-11 pr-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#3159a6] bg-gray-50 focus:bg-white transition font-bold" value={sender} onChange={e => setSender(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transporter / Agency *</label>
                    <div className="relative">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                        <input type="text" placeholder="Person or Courier name" className="w-full pl-11 pr-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#3159a6] bg-gray-50 focus:bg-white transition font-bold" value={transporter} onChange={e => setTransporter(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Receiver Name *</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                        <input type="text" placeholder="Who will receive?" className="w-full pl-11 pr-4 py-4 border-2 border-gray-50 rounded-2xl outline-none focus:border-[#3159a6] bg-gray-50 focus:bg-white transition font-bold" value={receiver} onChange={e => setReceiver(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="bg-amber-50/30 p-6 rounded-[2rem] border-2 border-amber-100 border-dashed">
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest ml-1 mb-3 flex items-center gap-1">
                    <StickyNote size={14}/> Movement Notes & Verification Remarks
                </label>
                <textarea 
                    className="w-full border-2 border-white rounded-2xl p-5 outline-none focus:border-amber-400 text-sm bg-white min-h-[100px] resize-none shadow-sm font-medium"
                    placeholder="Describe reason for transfer, physical condition of machine (e.g. Scratches on Dell Laptop), or special instructions..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleTransfer} 
                    disabled={!selectedAssetId} 
                    className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] hover:bg-slate-800 transition-all shadow-2xl shadow-blue-900/30 disabled:opacity-50 font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-3 active:scale-95"
                >
                    <Truck size={18} /> Confirm Asset Transfer
                </button>
            </div>
        </div>
      </div>
      
      <div className="space-y-6">
          <h3 className="font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter text-xl"> 
              <History size={24} className="text-[#3159a6]" /> Logistic History Log
          </h3>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#3159a6] text-white text-[10px] uppercase font-black tracking-[0.2em] border-b">
                        <tr><th className="p-6">Date</th><th className="p-6">Asset Unit</th><th className="p-6">Route</th><th className="p-6">Chain of Custody</th></tr>
                    </thead>
                    <tbody className="divide-y text-sm font-medium">
                        {transferHistory.length === 0 ? (
                            <tr><td colSpan={4} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-[0.3em]">No movement logs available</td></tr>
                        ) : (
                            transferHistory.map(log => (
                                <tr key={log.id} className="hover:bg-blue-50/30 transition-all">
                                    <td className="p-6">
                                        <div className="font-black text-gray-800">{new Date(log.date).toLocaleDateString('en-IN')}</div>
                                        <div className="text-[9px] text-gray-400 font-mono mt-1 uppercase">{log.id}</div>
                                    </td>
                                    <td className="p-6">
                                        <p className="font-black text-gray-800 uppercase tracking-tighter">{log.assetName}</p>
                                        <p className="text-[10px] text-[#3159a6] font-black font-mono mt-1">SN: {log.serialNumber}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 font-bold uppercase text-[10px]">{log.fromLocation}</span>
                                            <ArrowRight size={14} className="text-[#3159a6]" />
                                            <span className="font-black text-[#3159a6] uppercase text-[10px]">{log.toLocation}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-blue-400 rounded-full"></div><span className="text-[9px] font-black text-gray-400 uppercase">Sender:</span> <span className="text-xs font-bold text-gray-700">{log.sender}</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-orange-400 rounded-full"></div><span className="text-[9px] font-black text-gray-400 uppercase">Via:</span> <span className="text-xs font-bold text-gray-700">{log.transporter}</span></div>
                                            <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-green-400 rounded-full"></div><span className="text-[9px] font-black text-gray-400 uppercase">Receiver:</span> <span className="text-xs font-bold text-gray-700">{log.receiver}</span></div>
                                            {log.note && (
                                                <div className="mt-2 p-3 bg-gray-50 text-gray-600 rounded-xl italic text-xs border border-gray-100 font-medium">
                                                    "{log.note}"
                                                </div>
                                            )}
                                        </div>
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
