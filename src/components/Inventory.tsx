
import React, { useState, useMemo } from 'react';
import { HearingAid, LOCATIONS, BRANDS, UserRole } from '../types';
import { Plus, Search, Package, Layers, List, MapPin, CheckCircle, XCircle, Truck, Edit, Trash2, X, ChevronRight, Hash } from 'lucide-react';

interface InventoryProps {
  inventory: HearingAid[];
  onAdd: (item: HearingAid | HearingAid[]) => void;
  onUpdate: (item: HearingAid) => void;
  onDelete: (itemId: string) => void;
  userRole: UserRole;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, onAdd, onUpdate, onDelete, userRole }) => {
  const [viewType, setViewType] = useState<'grouped' | 'list'>('grouped');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('Available');

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSerials, setBulkSerials] = useState('');
  const [newItem, setNewItem] = useState<Partial<HearingAid>>({
    brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0
  });

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.hsnCode && item.hsnCode.includes(searchTerm));
      const matchesLoc = locationFilter === 'ALL' || item.location === locationFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesLoc && matchesStatus;
    });
  }, [inventory, searchTerm, locationFilter, statusFilter]);

  const groupedStock = useMemo(() => {
    const groups: Record<string, { brand: string, model: string, total: number, available: number, price: number, items: HearingAid[] }> = {};
    filteredInventory.forEach(item => {
      const key = `${item.brand}-${item.model}`;
      if (!groups[key]) {
        groups[key] = { brand: item.brand, model: item.model, total: 0, available: 0, price: item.price, items: [] };
      }
      groups[key].total++;
      if (item.status === 'Available') groups[key].available++;
      groups[key].items.push(item);
    });
    return Object.values(groups).sort((a, b) => b.available - a.available);
  }, [filteredInventory]);

  const handleSave = () => {
    if (!newItem.brand || !newItem.model || (!isBulkMode && !newItem.serialNumber)) {
      alert("Required fields missing.");
      return;
    }

    if (isBulkMode) {
      const serials = bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
      const newItems: HearingAid[] = serials.map(sn => ({
        ...newItem,
        id: `HA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        serialNumber: sn,
        addedDate: new Date().toISOString().split('T')[0],
      } as HearingAid));
      onAdd(newItems);
    } else {
      onAdd({
        ...newItem,
        id: `HA-${Date.now()}`,
        addedDate: new Date().toISOString().split('T')[0],
      } as HearingAid);
    }
    setShowAddModal(false);
    setBulkSerials('');
    setNewItem({
        brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-[#3159a6]" /> Stock Inventory
          </h2>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Grouped by Model & Serial No</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex border">
            <button 
              onClick={() => setViewType('grouped')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition ${viewType === 'grouped' ? 'bg-[#3159a6] text-white shadow-md' : 'text-gray-500'}`}
            >
              <Layers size={14} /> Summary
            </button>
            <button 
              onClick={() => setViewType('list')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition ${viewType === 'list' ? 'bg-[#3159a6] text-white shadow-md' : 'text-gray-500'}`}
            >
              <List size={14} /> Details
            </button>
          </div>
          {userRole === 'admin' && (
            <button onClick={() => setShowAddModal(true)} className="bg-[#3159a6] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xl hover:bg-slate-800 transition font-black uppercase text-[10px] tracking-widest">
              <Plus size={16} /> New Entry
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search serial, HSN or model..." 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-xl focus:border-[#3159a6] outline-none font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <select className="border-2 border-gray-50 rounded-xl px-4 py-3 text-xs font-bold bg-white outline-none focus:border-[#3159a6]" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
              <option value="ALL">All Hubs</option>
              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <select className="border-2 border-gray-50 rounded-xl px-4 py-3 text-xs font-bold bg-white outline-none focus:border-[#3159a6]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="Available">Available</option>
              <option value="Sold">Sold</option>
              <option value="In-Transit">Transit</option>
            </select>
          </div>
        </div>

        {viewType === 'grouped' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
            {groupedStock.map(group => (
              <div key={`${group.brand}-${group.model}`} className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all group border-b-4 border-b-[#3159a6]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-gray-800 uppercase tracking-tighter text-xl leading-none">{group.brand}</h3>
                    <p className="text-xs text-[#3159a6] font-black uppercase mt-2 tracking-widest">{group.model}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${group.available > 0 ? 'bg-white text-green-600 border-green-50' : 'bg-white text-red-600 border-red-50'}`}>
                    {group.available} Units
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>M.R.P (Base)</span>
                    <span className="text-gray-700">₹{group.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Total Holdings</span>
                    <span className="text-[#3159a6]">₹{(group.price * group.available).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setSearchTerm(group.model); setViewType('list'); }}
                  className="w-full py-3 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase text-[#3159a6] hover:bg-[#3159a6] hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Inspect Units <ChevronRight size={14}/>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#3159a6] text-white uppercase font-black text-[10px] tracking-[0.2em] border-b">
                <tr>
                  <th className="p-4">Brand/Model</th>
                  <th className="p-4 text-center">HSN</th>
                  <th className="p-4">Serial No</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Base Value</th>
                  <th className="p-4">Status</th>
                  {userRole === 'admin' && <th className="p-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic font-medium uppercase tracking-widest text-[10px]">Stock database empty for current filters</td></tr>
                ) : filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4">
                      <p className="font-black text-gray-800 uppercase tracking-tighter">{item.brand}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{item.model}</p>
                    </td>
                    <td className="p-4 text-center font-mono text-xs font-bold text-slate-500">{item.hsnCode || '90214090'}</td>
                    <td className="p-4 font-mono font-black text-[#3159a6] tracking-widest uppercase">{item.serialNumber}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-600 font-bold text-xs uppercase">
                        <MapPin size={12} className="text-[#3159a6]" />
                        {item.location}
                      </div>
                    </td>
                    <td className="p-4 font-black text-gray-900">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                        item.status === 'Available' ? 'bg-green-50 text-green-700 border-green-100' : 
                        item.status === 'Sold' ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {userRole === 'admin' && (
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => {}} className="p-2 text-gray-400 hover:text-[#3159a6] transition"><Edit size={16}/></button>
                          <button onClick={() => { if(window.confirm(`Delete unit ${item.serialNumber}?`)) onDelete(item.id); }} className="p-2 text-gray-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border-4 border-white">
            <div className="bg-[#3159a6] p-6 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">Inventory On-boarding</h3>
              <button onClick={() => setShowAddModal(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Brand</label>
                  <select className="w-full border-2 border-gray-50 rounded-2xl p-3 text-sm bg-gray-50 font-bold focus:border-[#3159a6] outline-none transition" value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})}>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Model Name</label>
                  <input className="w-full border-2 border-gray-50 rounded-2xl p-3 text-sm font-bold focus:border-[#3159a6] outline-none" placeholder="e.g. Lumity L90" value={newItem.model} onChange={e => setNewItem({...newItem, model: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Serial Capture</label>
                  <button onClick={() => setIsBulkMode(!isBulkMode)} className="text-[9px] font-black text-[#3159a6] uppercase border-b-2 border-[#3159a6] transition">
                    {isBulkMode ? 'Single Switch' : 'Bulk Batch Switch'}
                  </button>
                </div>
                {isBulkMode ? (
                  <textarea 
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 text-sm font-mono focus:border-[#3159a6] outline-none h-32 bg-gray-50" 
                    placeholder="Enter serial numbers (one per line)..." 
                    value={bulkSerials} 
                    onChange={e => setBulkSerials(e.target.value)} 
                  />
                ) : (
                  <input className="w-full border-2 border-gray-50 rounded-2xl p-4 text-sm font-mono font-black uppercase tracking-widest focus:border-[#3159a6] outline-none bg-gray-50" placeholder="Unique S/N" value={newItem.serialNumber} onChange={e => setNewItem({...newItem, serialNumber: e.target.value})} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Unit MRP (INR)</label>
                  <input type="number" className="w-full border-2 border-gray-50 rounded-2xl p-3 text-lg font-black text-[#3159a6] outline-none" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">HSN Code</label>
                  <input className="w-full border-2 border-gray-50 rounded-2xl p-3 text-sm font-mono font-bold focus:border-[#3159a6] outline-none" value={newItem.hsnCode} onChange={e => setNewItem({...newItem, hsnCode: e.target.value})} placeholder="90214090" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Store Location</label>
                  <select className="w-full border-2 border-gray-50 rounded-2xl p-3 text-sm bg-gray-50 font-bold focus:border-[#3159a6] outline-none" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})}>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                    <button onClick={handleSave} className="w-full py-4 bg-[#3159a6] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95">Verify & Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
