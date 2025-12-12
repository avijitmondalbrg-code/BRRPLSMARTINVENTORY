import React, { useState } from 'react';
import { HearingAid, LOCATIONS, BRANDS, UserRole } from '../types';
import { Plus, Search, Package, AlertTriangle, Layers, FilePlus, MapPin, CheckCircle, XCircle, Truck, IndianRupee, Edit, Lock, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, X, Filter } from 'lucide-react';

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
    brand: '', model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '902140', gstRate: 0
  });

  const openAddModal = () => {
    setNewItem({ brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '902140', gstRate: 0 });
    setIsEditMode(false); setIsBulkMode(false); setShowAddModal(true);
  };

  const openEditModal = (item: HearingAid) => { setNewItem(item); setIsEditMode(true); setIsBulkMode(false); setShowAddModal(true); };

  const handleSaveItem = () => {
    if (!newItem.brand || !newItem.model || !newItem.price) return alert("Fill required fields.");
    const baseItem = { brand: newItem.brand!, model: newItem.model!, price: Number(newItem.price), location: newItem.location || LOCATIONS[0], status: newItem.status || 'Available', addedDate: newItem.addedDate || new Date().toISOString().split('T')[0], hsnCode: newItem.hsnCode || '', gstRate: newItem.gstRate || 0 };
    if (isEditMode) onUpdate({ ...baseItem, id: newItem.id!, serialNumber: newItem.serialNumber!, status: newItem.status as any } as HearingAid);
    else if (isBulkMode) {
        const serials = bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        onAdd(serials.map((sn, idx) => ({ ...baseItem, id: `${Date.now()}-${idx}`, serialNumber: sn, status: 'Available' } as HearingAid)));
    } else onAdd({ ...baseItem, id: Date.now().toString(), serialNumber: newItem.serialNumber!, status: 'Available' } as HearingAid);
    setShowAddModal(false); setBulkSerials('');
  };

  // Filter Logic
  let filteredInventory = inventory.filter(item => {
    const matchesSearch = item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || item.model.toLowerCase().includes(searchTerm.toLowerCase()) || item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
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
        {userRole === 'admin' && <button onClick={openAddModal} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"><Plus size={20} /> Add Stock</button>}
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="flex border-b px-4 pt-2 bg-gray-50/50 overflow-x-auto">
          <TabButton label="Available" value="Available" icon={CheckCircle} />
          <TabButton label="Sold" value="Sold" icon={XCircle} />
          <TabButton label="In-Transit" value="In-Transit" icon={Truck} />
          <TabButton label="All" value="ALL" icon={Layers} />
        </div>

        <div className="p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
                <div className="flex items-center gap-3 bg-gray-50 p-1.5 px-3 rounded-lg border border-gray-200">
                    <Calendar size={16} className="text-gray-400" /><span className="text-[10px] font-black uppercase text-gray-400">Date Range</span>
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                    <span className="text-gray-300">to</span>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                    {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-red-400"><X size={14}/></button>}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                        <tr><th className="p-4">Device</th><th className="p-4">Serial</th><th className="p-4">Added Date</th><th className="p-4">Price</th><th className="p-4">Status</th>{userRole === 'admin' && <th className="p-4">Actions</th>}</tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredInventory.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 font-medium">{item.brand} {item.model}</td>
                                <td className="p-4 font-mono text-gray-500">{item.serialNumber}</td>
                                <td className="p-4 text-gray-500">{item.addedDate}</td>
                                <td className="p-4 font-bold">₹{item.price.toLocaleString()}</td>
                                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${item.status==='Available' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600'}`}>{item.status}</span></td>
                                {userRole === 'admin' && <td className="p-4 flex gap-2"><button onClick={()=>openEditModal(item)} className="text-teal-600"><Edit size={16}/></button><button onClick={()=>onDelete(item.id)} className="text-red-400"><Trash2 size={16}/></button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};