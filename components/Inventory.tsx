import React, { useState, useMemo } from 'react';
import { HearingAid, LOCATIONS, BRANDS, UserRole } from '../types';
import { Plus, Search, Package, AlertTriangle, Layers, List, MapPin, CheckCircle, XCircle, Truck, IndianRupee, Edit, Lock, Trash2, ArrowUpDown, Calendar, X, Filter, ChevronRight } from 'lucide-react';

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

  // Form State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSerials, setBulkSerials] = useState('');
  const [newItem, setNewItem] = useState<Partial<HearingAid>>({
    brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0
  });

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
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
      alert("Please fill all mandatory fields.");
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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-primary" /> Stock Management
          </h2>
          <p className="text-sm text-gray-500">Track hearing aids by serial number and model groups.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-gray-200 p-1 rounded-lg flex">
            <button 
              onClick={() => setViewType('grouped')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewType === 'grouped' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}`}
            >
              <Layers size={16} /> Summary
            </button>
            <button 
              onClick={() => setViewType('list')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewType === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}`}
            >
              <List size={16} /> Detailed
            </button>
          </div>
          {userRole === 'admin' && (
            <button onClick={() => setShowAddModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:bg-teal-800 transition">
              <Plus size={20} /> Add Stock
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Brand, Model or Serial Number..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <select className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
              <option value="ALL">All Locations</option>
              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="Available">Available Only</option>
              <option value="Sold">Sold Only</option>
              <option value="In-Transit">In-Transit Only</option>
            </select>
          </div>
        </div>

        {viewType === 'grouped' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
            {groupedStock.map(group => (
              <div key={`${group.brand}-${group.model}`} className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-gray-800 uppercase tracking-tight">{group.brand}</h3>
                    <p className="text-sm text-gray-500 font-medium">{group.model}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${group.available > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {group.available} IN STOCK
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                    <span>Base Price</span>
                    <span className="text-gray-700">₹{group.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                    <span>Total Asset Value</span>
                    <span className="text-teal-700">₹{(group.price * group.available).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setSearchTerm(group.model); setViewType('list'); }}
                  className="w-full py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition flex items-center justify-center gap-2"
                >
                  View Details <ChevronRight size={14}/>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-widest border-b">
                <tr>
                  <th className="p-4">Model Name</th>
                  <th className="p-4">Serial Number</th>
                  <th className="p-4">Current Location</th>
                  <th className="p-4">Value (Base)</th>
                  <th className="p-4">Status</th>
                  {userRole === 'admin' && <th className="p-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic font-medium">No units found matching criteria.</td></tr>
                ) : filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-teal-50/30 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{item.brand}</p>
                      <p className="text-xs text-gray-500">{item.model}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-teal-600 tracking-wider uppercase">{item.serialNumber}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <MapPin size={14} className="text-gray-400" />
                        {item.location}
                      </div>
                    </td>
                    <td className="p-4 font-black text-gray-800">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        item.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' : 
                        item.status === 'Sold' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {userRole === 'admin' && (
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => {}} className="p-1.5 text-gray-400 hover:text-teal-600 transition"><Edit size={16}/></button>
                          <button onClick={() => { if(window.confirm(`Permanently delete unit ${item.serialNumber}?`)) onDelete(item.id); }} className="p-1.5 text-gray-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-primary p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Add Hearing Aid Stock</h3>
              <button onClick={() => setShowAddModal(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Brand *</label>
                  <select className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white transition" value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})}>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Model *</label>
                  <input className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500" placeholder="e.g. Lumity L90" value={newItem.model} onChange={e => setNewItem({...newItem, model: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Serial Number Entry *</label>
                  <button onClick={() => setIsBulkMode(!isBulkMode)} className="text-[10px] font-black text-primary uppercase border-b border-primary hover:text-teal-800 transition">
                    {isBulkMode ? 'Single Unit Mode' : 'Bulk Units Mode'}
                  </button>
                </div>
                {isBulkMode ? (
                  <textarea 
                    className="w-full border rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-teal-500 h-24" 
                    placeholder="Enter serial numbers separated by commas or new lines..." 
                    value={bulkSerials} 
                    onChange={e => setBulkSerials(e.target.value)} 
                  />
                ) : (
                  <input className="w-full border rounded-lg p-2.5 text-sm font-mono uppercase tracking-widest" placeholder="Unique Serial Number" value={newItem.serialNumber} onChange={e => setNewItem({...newItem, serialNumber: e.target.value})} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Base Price (INR) *</label>
                  <input type="number" className="w-full border rounded-lg p-2.5 text-sm font-bold" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Warehouse Location</label>
                  <select className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})}>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">HSN Code</label>
                  <input className="w-full border rounded-lg p-2.5 text-sm" value={newItem.hsnCode} onChange={e => setNewItem({...newItem, hsnCode: e.target.value})} placeholder="e.g. 90214090" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">GST Rate (%)</label>
                  <input type="number" className="w-full border rounded-lg p-2.5 text-sm" value={newItem.gstRate} onChange={e => setNewItem({...newItem, gstRate: Number(e.target.value)})} placeholder="0" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 border rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-teal-900/20 hover:bg-teal-800 transition">Confirm Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};