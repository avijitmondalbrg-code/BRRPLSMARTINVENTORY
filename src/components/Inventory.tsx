
import React, { useState } from 'react';
import { HearingAid, LOCATIONS, BRANDS, UserRole } from '../types';
import { Plus, Search, Package, AlertTriangle, Layers, FilePlus, MapPin, CheckCircle, XCircle, Truck, IndianRupee, Edit, Lock, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, X, Filter, Smartphone } from 'lucide-react';

interface InventoryProps {
  inventory: HearingAid[];
  onAdd: (item: HearingAid | HearingAid[]) => void;
  onUpdate: (item: HearingAid) => void;
  onDelete: (itemId: string) => void;
  userRole: UserRole;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, onAdd, onUpdate, onDelete, userRole }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByModel, setGroupByModel] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Available' | 'Sold' | 'In-Transit'>('Available');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [modelFilter, setModelFilter] = useState<string>('ALL');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bulkSerials, setBulkSerials] = useState('');
  const [newItem, setNewItem] = useState<Partial<HearingAid>>({
    brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0
  });

  const handleSaveItem = () => {
    if (!newItem.brand || !newItem.model || !newItem.price) {
      alert("Required fields missing");
      return;
    }
    const baseItem = {
        brand: newItem.brand!, model: newItem.model!, price: Number(newItem.price),
        location: newItem.location || LOCATIONS[0], status: newItem.status || 'Available',
        addedDate: newItem.addedDate || new Date().toISOString().split('T')[0],
        hsnCode: newItem.hsnCode || '90214090', gstRate: newItem.gstRate || 0
    };
    if (isEditMode) {
        onUpdate({ ...baseItem, id: newItem.id!, serialNumber: newItem.serialNumber! } as HearingAid);
    } else if (isBulkMode) {
        const serials = bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        onAdd(serials.map(sn => ({ ...baseItem, id: Date.now() + Math.random().toString(), serialNumber: sn, status: 'Available' } as HearingAid)));
    } else {
        onAdd({ ...baseItem, id: Date.now().toString(), serialNumber: newItem.serialNumber!, status: 'Available' } as HearingAid);
    }
    setShowAddModal(false);
  };

  let filteredInventory = inventory.filter(item => {
    const matchesSearch = item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || item.model.toLowerCase().includes(searchTerm.toLowerCase()) || item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesLoc = locationFilter === 'ALL' || item.location === locationFilter;
    const matchesModel = modelFilter === 'ALL' || item.model === modelFilter;
    return matchesSearch && matchesStatus && matchesLoc && matchesModel;
  });

  const TabButton = ({ label, value, icon: Icon }: { label: string, value: typeof statusFilter, icon: any }) => (
    <button
      onClick={() => setStatusFilter(value)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition ${
        statusFilter === value 
          ? 'border-[#3159a6] text-[#3159a6] bg-blue-50' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="text-[#3159a6]" /> Stock Management</h2>
        {userRole === 'admin' && <button onClick={() => setShowAddModal(true)} className="bg-[#3159a6] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-[#254687] transition font-bold"><Plus size={20} /> Add Stock</button>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 px-4 pt-2 bg-gray-50/50 overflow-x-auto">
          <TabButton label="Available" value="Available" icon={CheckCircle} />
          <TabButton label="Sold" value="Sold" icon={XCircle} />
          <TabButton label="In-Transit" value="In-Transit" icon={Truck} />
          <TabButton label="All" value="ALL" icon={Layers} />
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search Inventory..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                <option value="ALL">All Locations</option>
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b">
                    <tr><th className="p-4">Device Details</th><th className="p-4">Serial No</th><th className="p-4">Location</th><th className="p-4">Base Price</th><th className="p-4">Status</th><th className="p-4 text-center">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredInventory.map(item => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition">
                            <td className="p-4"><p className="font-bold text-gray-900">{item.brand}</p><p className="text-xs text-gray-500">{item.model}</p></td>
                            <td className="p-4 font-mono font-bold text-[#3159a6]">{item.serialNumber}</td>
                            <td className="p-4 text-gray-600">{item.location}</td>
                            <td className="p-4 font-black">₹{item.price.toLocaleString()}</td>
                            <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${item.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{item.status}</span></td>
                            <td className="p-4 text-center">{userRole === 'admin' && <button onClick={() => { setNewItem(item); setIsEditMode(true); setShowAddModal(true); }} className="text-gray-400 hover:text-blue-600"><Edit size={16}/></button>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                  <div className="bg-[#3159a6] p-5 text-white flex justify-between items-center font-black uppercase">
                      <h3>{isEditMode ? 'Modify' : 'New'} Stock Entry</h3>
                      <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-black uppercase text-gray-400">Brand</label><select className="w-full border-2 p-2 rounded-xl" value={newItem.brand} onChange={e=>setNewItem({...newItem, brand: e.target.value})}>{BRANDS.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                          <div><label className="text-[10px] font-black uppercase text-gray-400">Model</label><input className="w-full border-2 p-2 rounded-xl" value={newItem.model} onChange={e=>setNewItem({...newItem, model: e.target.value})} /></div>
                      </div>
                      <div><label className="text-[10px] font-black uppercase text-gray-400">Serial Number</label><input className="w-full border-2 p-2 rounded-xl font-mono uppercase" value={newItem.serialNumber} onChange={e=>setNewItem({...newItem, serialNumber: e.target.value})} /></div>
                      <div><label className="text-[10px] font-black uppercase text-gray-400">Base Price (INR)</label><input type="number" className="w-full border-2 p-2 rounded-xl font-bold text-lg" value={newItem.price || ''} onChange={e=>setNewItem({...newItem, price: Number(e.target.value)})} /></div>
                      <button onClick={handleSaveItem} className="w-full bg-[#3159a6] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#254687] transition uppercase tracking-widest mt-4">Confirm Entry</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
