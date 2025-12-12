import React, { useState } from 'react';
import { HearingAid, LOCATIONS, BRANDS, UserRole } from '../types';
import { Plus, Search, Package, AlertTriangle, Layers, FilePlus, MapPin, CheckCircle, XCircle, Truck, IndianRupee, Edit, Lock, Trash2, ArrowUp, ArrowDown, Calendar, X } from 'lucide-react';

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
  
  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting State
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Available' | 'Sold' | 'In-Transit'>('Available');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');

  const LOW_STOCK_THRESHOLD = 3;

  // Form State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bulkSerials, setBulkSerials] = useState('');
  const [newItem, setNewItem] = useState<Partial<HearingAid>>({
    brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '902140', gstRate: 0
  });

  const openAddModal = () => {
    setNewItem({ brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '902140', gstRate: 0 });
    setIsEditMode(false); setIsBulkMode(false); setShowAddModal(true);
  };

  const openEditModal = (item: HearingAid) => { 
    setNewItem(item); 
    setIsEditMode(true); 
    setIsBulkMode(false); 
    setShowAddModal(true); 
  };

  const handleSaveItem = () => {
    if (!newItem.brand || !newItem.model || !newItem.price) return alert("Fill all required fields.");
    
    const baseItem = { 
      brand: newItem.brand!, 
      model: newItem.model!, 
      price: Number(newItem.price), 
      location: newItem.location || LOCATIONS[0], 
      status: newItem.status || 'Available', 
      addedDate: newItem.addedDate || new Date().toISOString().split('T')[0], 
      hsnCode: newItem.hsnCode || '', 
      gstRate: newItem.gstRate !== undefined ? Number(newItem.gstRate) : 0 
    };

    if (isEditMode) {
      onUpdate({ ...baseItem, id: newItem.id!, serialNumber: newItem.serialNumber!, status: newItem.status as any } as HearingAid);
    } else if (isBulkMode) {
        const serials = bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        if (serials.length === 0) return alert("Enter at least one serial number.");
        onAdd(serials.map((sn, idx) => ({ ...baseItem, id: `${Date.now()}-${idx}`, serialNumber: sn, status: 'Available' } as HearingAid)));
    } else {
        if (!newItem.serialNumber) return alert("Enter serial number.");
        onAdd({ ...baseItem, id: Date.now().toString(), serialNumber: newItem.serialNumber!, status: 'Available' } as HearingAid);
    }
    setShowAddModal(false); setBulkSerials('');
  };

  const toggleSort = () => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');

  // Filter Logic
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesLocation = locationFilter === 'ALL' || item.location === locationFilter;
    const matchesStart = !startDate || item.addedDate >= startDate;
    const matchesEnd = !endDate || item.addedDate <= endDate;
    return matchesSearch && matchesStatus && matchesLocation && matchesStart && matchesEnd;
  }).sort((a, b) => {
    const d1 = new Date(a.addedDate || 0).getTime(), d2 = new Date(b.addedDate || 0).getTime();
    return sortDirection === 'desc' ? d2 - d1 : d1 - d2;
  });

  const TabButton = ({ label, value, icon: Icon }: { label: string, value: typeof statusFilter, icon: any }) => (
    <button onClick={() => setStatusFilter(value)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${statusFilter === value ? 'border-primary text-primary bg-teal-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="text-primary" /> Inventory</h2>
        {userRole === 'admin' && <button onClick={openAddModal} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-800 transition"><Plus size={20} /> Add Stock</button>}
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="flex border-b px-4 pt-2 bg-gray-50/50 overflow-x-auto">
          <TabButton label="Available" value="Available" icon={CheckCircle} />
          <TabButton label="Sold" value="Sold" icon={XCircle} />
          <TabButton label="In-Transit" value="In-Transit" icon={Truck} />
          <TabButton label="All" value="ALL" icon={Layers} />
        </div>

        <div className="p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Search brand, model, serial..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
                
                <div className="flex items-center gap-3 bg-gray-50 p-1.5 px-3 rounded-lg border border-gray-200">
                    <Calendar size={16} className="text-gray-400" /><span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">Added Date</span>
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-teal-600" />
                    <span className="text-gray-300">to</span>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-xs outline-none focus:text-teal-600" />
                    {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-red-400 hover:text-red-600 transition"><X size={14}/></button>}
                </div>

                <div className="flex items-center gap-2">
                    <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={locationFilter} onChange={e=>setLocationFilter(e.target.value)}>
                        <option value="ALL">All Locations</option>
                        {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4">Device Details</th>
                          <th className="p-4">Serial No</th>
                          <th className="p-4">
                            <button onClick={toggleSort} className="flex items-center gap-1 hover:text-teal-700 transition uppercase font-bold focus:outline-none">
                              Added Date {sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                            </button>
                          </th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Status</th>
                          {userRole === 'admin' && <th className="p-4 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredInventory.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">No inventory items found matching your criteria.</td></tr>
                        ) : filteredInventory.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 transition group">
                                <td className="p-4">
                                  <div className="font-bold text-gray-800">{item.brand}</div>
                                  <div className="text-xs text-gray-500">{item.model}</div>
                                </td>
                                <td className="p-4 font-mono text-gray-600">{item.serialNumber}</td>
                                <td className="p-4 text-gray-500">{item.addedDate}</td>
                                <td className="p-4 font-bold text-gray-800">₹{item.price.toLocaleString('en-IN')}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                    item.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    item.status === 'Sold' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                {userRole === 'admin' && (
                                  <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                      <button onClick={()=>openEditModal(item)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition" title="Edit"><Edit size={16}/></button>
                                      <button onClick={()=>{ if(window.confirm(`Delete item ${item.serialNumber}?`)) onDelete(item.id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition" title="Delete"><Trash2 size={16}/></button>
                                    </div>
                                  </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-primary p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">{isEditMode ? 'Edit Stock Item' : 'Add New Stock'}</h3>
              <button onClick={() => setShowAddModal(false)} className="hover:text-teal-200"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand *</label>
                  <select className="w-full border rounded-lg p-2 text-sm bg-white" value={newItem.brand} onChange={e=>setNewItem({...newItem, brand: e.target.value})}>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model *</label>
                  <input className="w-full border rounded-lg p-2 text-sm" value={newItem.model} onChange={e=>setNewItem({...newItem, model: e.target.value})} placeholder="e.g. Lumity L90" />
                </div>
              </div>

              {!isEditMode && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Serial Number(s) *</label>
                    <button onClick={()=>setIsBulkMode(!isBulkMode)} className="text-[10px] text-teal-600 font-black uppercase hover:underline">{isBulkMode ? 'Single Mode' : 'Bulk Mode'}</button>
                  </div>
                  {isBulkMode ? (
                    <textarea className="w-full border rounded-lg p-2 text-sm font-mono" rows={4} placeholder="Enter serials separated by new lines or commas..." value={bulkSerials} onChange={e=>setBulkSerials(e.target.value)} />
                  ) : (
                    <input className="w-full border rounded-lg p-2 text-sm font-mono" placeholder="Enter unique serial" value={newItem.serialNumber} onChange={e=>setNewItem({...newItem, serialNumber: e.target.value})} />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price *</label>
                  <input type="number" className="w-full border rounded-lg p-2 text-sm" value={newItem.price || ''} onChange={e=>setNewItem({...newItem, price: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                  <select className="w-full border rounded-lg p-2 text-sm bg-white" value={newItem.location} onChange={e=>setNewItem({...newItem, location: e.target.value})}>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Added Date</label>
                  <input type="date" className="w-full border rounded-lg p-2 text-sm" value={newItem.addedDate || new Date().toISOString().split('T')[0]} onChange={e=>setNewItem({...newItem, addedDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">HSN Code</label>
                  <input className="w-full border rounded-lg p-2 text-sm" value={newItem.hsnCode} onChange={e=>setNewItem({...newItem, hsnCode: e.target.value})} placeholder="902140" />
                </div>
              </div>

              {isEditMode && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select className="w-full border rounded-lg p-2 text-sm bg-white" value={newItem.status} onChange={e=>setNewItem({...newItem, status: e.target.value as any})}>
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="In-Transit">In-Transit</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button onClick={()=>setShowAddModal(false)} className="flex-1 py-2 border rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSaveItem} className="flex-1 py-2 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-teal-800 transition">
                  {isEditMode ? 'Update Stock' : isBulkMode ? 'Bulk Save' : 'Save Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};