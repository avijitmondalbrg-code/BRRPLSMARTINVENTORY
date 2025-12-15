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
  
  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting State
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  
  // New Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Available' | 'Sold' | 'In-Transit'>('Available');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [modelFilter, setModelFilter] = useState<string>('ALL');

  const LOW_STOCK_THRESHOLD = 3;

  // Dynamic unique models list for filtering
  const uniqueModels = React.useMemo(() => {
    return Array.from(new Set(inventory.map(item => item.model))).sort();
  }, [inventory]);

  // Form State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bulkSerials, setBulkSerials] = useState('');
  const [newItem, setNewItem] = useState<Partial<HearingAid>>({
    brand: '',
    model: '',
    serialNumber: '',
    price: 0,
    location: LOCATIONS[0],
    status: 'Available',
    hsnCode: '90214090', // Updated default HSN
    gstRate: 0 // Default GST 0%
  });

  const openAddModal = () => {
    setNewItem({
        brand: BRANDS[0],
        model: '',
        serialNumber: '',
        price: 0,
        location: LOCATIONS[0],
        status: 'Available',
        hsnCode: '90214090',
        gstRate: 0
    });
    setIsEditMode(false);
    setIsBulkMode(false);
    setShowAddModal(true);
  };

  const openEditModal = (item: HearingAid) => {
    setNewItem(item);
    setIsEditMode(true);
    setIsBulkMode(false);
    setShowAddModal(true);
  };

  const handleSaveItem = () => {
    if (!newItem.brand || !newItem.model || !newItem.price) {
      alert("Please fill all required fields (Brand, Model, Price)");
      return;
    }

    const baseItem = {
        brand: newItem.brand!,
        model: newItem.model!,
        price: Number(newItem.price),
        location: newItem.location || LOCATIONS[0],
        status: newItem.status || 'Available',
        addedDate: newItem.addedDate || new Date().toISOString().split('T')[0],
        hsnCode: newItem.hsnCode || '90214090',
        gstRate: newItem.gstRate !== undefined ? Number(newItem.gstRate) : 0
    };

    if (isEditMode) {
        if (!newItem.id || !newItem.serialNumber) return;
        const updatedItem: HearingAid = {
            ...baseItem,
            id: newItem.id,
            serialNumber: newItem.serialNumber,
            status: newItem.status as any
        };
        onUpdate(updatedItem);
    } else if (isBulkMode) {
        const serials = bulkSerials
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (serials.length === 0) {
            alert("Please enter at least one serial number for bulk add.");
            return;
        }

        const newItems: HearingAid[] = serials.map((sn, index) => ({
            ...baseItem,
            id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            serialNumber: sn,
            status: 'Available'
        }));

        onAdd(newItems);
    } else {
        if (!newItem.serialNumber) {
            alert("Please enter a serial number");
            return;
        }

        const item: HearingAid = {
            ...baseItem,
            id: Date.now().toString(),
            serialNumber: newItem.serialNumber!,
            status: 'Available'
        };
        onAdd(item);
    }

    setShowAddModal(false);
    setNewItem({ brand: '', model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0 });
    setBulkSerials('');
    setIsBulkMode(false);
    setIsEditMode(false);
  };

  const toggleSort = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // 1. Apply Filters and Sorting
  let filteredInventory = inventory.filter(item => {
    const matchesSearch = 
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesLocation = locationFilter === 'ALL' || item.location === locationFilter;
    const matchesModel = modelFilter === 'ALL' || item.model === modelFilter;
    
    const matchesStartDate = !startDate || item.addedDate >= startDate;
    const matchesEndDate = !endDate || item.addedDate <= endDate;

    return matchesSearch && matchesStatus && matchesLocation && matchesModel && matchesStartDate && matchesEndDate;
  }).sort((a, b) => {
    const dateA = new Date(a.addedDate || 0).getTime();
    const dateB = new Date(b.addedDate || 0).getTime();
    return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalValue = filteredInventory.reduce((sum, item) => sum + item.price, 0);
  const totalCount = filteredInventory.length;

  const groupedInventory = React.useMemo(() => {
    const groups: Record<string, { brand: string, model: string, count: number, stock: number, ids: string[], isLowStock: boolean, avgPrice: number, totalValue: number }> = {};
    
    filteredInventory.forEach(item => {
      const key = `${item.brand}-${item.model}`;
      if (!groups[key]) {
        groups[key] = { 
            brand: item.brand, 
            model: item.model, 
            count: 0, 
            stock: 0, 
            ids: [], 
            isLowStock: false, 
            avgPrice: item.price,
            totalValue: 0
        };
      }
      groups[key].count += 1;
      groups[key].totalValue += item.price;
      
      if (item.status === 'Available') {
        groups[key].stock += 1;
      }
      groups[key].ids.push(item.id);
    });

    Object.values(groups).forEach(group => {
        group.isLowStock = group.stock < LOW_STOCK_THRESHOLD;
    });

    let result = Object.values(groups);

    if (showLowStockOnly) {
        result = result.filter(g => g.isLowStock);
    }

    return result;
  }, [filteredInventory, showLowStockOnly]);

  if (showLowStockOnly && !groupByModel) {
      const lowStockKeys = new Set(groupedInventory.filter(g => g.isLowStock).map(g => `${g.brand}-${g.model}`));
      filteredInventory = filteredInventory.filter(item => lowStockKeys.has(`${item.brand}-${item.model}`));
  }

  const TabButton = ({ label, value, icon: Icon }: { label: string, value: typeof statusFilter, icon: any }) => (
    <button
      onClick={() => setStatusFilter(value)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${
        statusFilter === value 
          ? 'border-primary text-primary bg-teal-50' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Inventory Management
        </h2>
        
        {userRole === 'admin' ? (
            <button
            onClick={openAddModal}
            className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"
            >
            <Plus size={20} />
            Add Stock
            </button>
        ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-100 px-3 py-1.5 rounded-full border">
                <Lock size={14} /> Read-Only Mode
            </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 px-4 pt-2 bg-gray-50/50 overflow-x-auto">
          <TabButton label="Available Stock" value="Available" icon={CheckCircle} />
          <TabButton label="Sold Items" value="Sold" icon={XCircle} />
          <TabButton label="In-Transit" value="In-Transit" icon={Truck} />
          <TabButton label="All Inventory" value="ALL" icon={Layers} />
        </div>

        <div className="p-4 space-y-4 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search Brand, Model, Serial..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 sm:min-w-[160px]">
                        <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <select 
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none appearance-none bg-white cursor-pointer"
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                        >
                            <option value="ALL">All Models</option>
                            {uniqueModels.map(model => <option key={model} value={model}>{model}</option>)}
                        </select>
                    </div>

                    <div className="relative flex-1 sm:min-w-[160px]">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <select 
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none appearance-none bg-white cursor-pointer"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        >
                            <option value="ALL">All Locations</option>
                            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                        onClick={() => setGroupByModel(!groupByModel)}
                        className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition whitespace-nowrap flex-1 lg:flex-none justify-center ${groupByModel ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Layers size={16} />
                        {groupByModel ? 'Ungroup' : 'Group by Model'}
                    </button>
                    
                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition whitespace-nowrap flex-1 lg:flex-none justify-center ${showLowStockOnly ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <AlertTriangle size={16} className={showLowStockOnly ? 'text-red-600' : 'text-gray-400'} />
                        Low Stock
                    </button>
                </div>
            </div>

            {/* Date Range Filter UI */}
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 max-w-2xl">
                <div className="flex items-center gap-2 px-2 text-gray-500 border-r border-gray-200">
                    <Calendar size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Stock Added Date</span>
                </div>
                <div className="flex items-center gap-3 px-2">
                    <input 
                      type="date" 
                      className="bg-transparent text-sm outline-none focus:text-teal-600"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-gray-400 font-bold">to</span>
                    <input 
                      type="date" 
                      className="bg-transparent text-sm outline-none focus:text-teal-600"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    {(startDate || endDate) && (
                        <button 
                          onClick={() => { setStartDate(''); setEndDate(''); }}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                          title="Reset Dates"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-teal-50/50 px-6 py-3 border-b border-teal-100 flex justify-between items-center text-sm">
            <span className="text-gray-500">Showing <span className="font-bold text-gray-800">{totalCount}</span> items</span>
            <span className="flex items-center gap-1 text-teal-800 font-medium">
                <IndianRupee size={14} />
                Total Value: <span className="font-bold">₹{totalValue.toLocaleString('en-IN')}</span>
            </span>
        </div>

        <div className="bg-white">
            {!groupByModel ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider border-b">
                    <tr>
                    <th className="p-4">Device Details</th>
                    <th className="p-4">Serial No</th>
                    <th className="p-4">
                      <button 
                        onClick={toggleSort} 
                        className="flex items-center gap-1 hover:text-teal-700 transition uppercase font-semibold focus:outline-none"
                        title={`Sort by Date ${sortDirection === 'desc' ? 'Ascending' : 'Descending'}`}
                      >
                        Added Date
                        {sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                      </button>
                    </th>
                    <th className="p-4">Tax Info</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Base Price</th>
                    <th className="p-4">Status</th>
                    {userRole === 'admin' && <th className="p-4">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition group">
                        <td className="p-4">
                            <div className="font-medium text-gray-900">{item.brand}</div>
                            <div className="text-sm text-gray-500">{item.model}</div>
                        </td>
                        <td className="p-4 text-gray-600 font-mono text-sm">{item.serialNumber}</td>
                        <td className="p-4 text-gray-600 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-400" />
                            {item.addedDate ? new Date(item.addedDate).toLocaleDateString('en-IN') : '-'}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                             <div>HSN: {item.hsnCode || '-'}</div>
                             <div className="text-xs">GST: {item.gstRate}%</div>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                                <MapPin size={12} className="text-gray-400" />
                                {item.location}
                            </div>
                        </td>
                        <td className="p-4 font-medium text-gray-800">₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                            item.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                            item.status === 'Sold' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                            {item.status}
                        </span>
                        </td>
                        {userRole === 'admin' && (
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => openEditModal(item)}
                                        className="p-1 text-gray-400 hover:text-teal-600 transition"
                                        title="Edit Item"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete item ${item.serialNumber}? This cannot be undone.`)) {
                                                onDelete(item.id);
                                            }
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 transition"
                                        title="Delete Item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        )}
                    </tr>
                    ))}
                    {filteredInventory.length === 0 && (
                    <tr>
                        <td colSpan={userRole === 'admin' ? 8 : 7} className="p-12 text-center text-gray-400">
                             <Package className="mx-auto h-12 w-12 mb-2 opacity-20" />
                             <p>No inventory items found matching current filters.</p>
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50">
                {groupedInventory?.map((group) => (
                <div key={`${group.brand}-${group.model}`} className={`bg-white p-5 rounded-xl shadow-sm border transition hover:shadow-md ${group.isLowStock ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{group.brand}</h3>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold border ${group.isLowStock ? 'bg-red-50 text-red-700 border-red-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                            {group.stock} Available
                        </span>
                    </div>
                    </div>
                    <p className="text-gray-600 mb-4 font-medium text-sm">{group.model}</p>
                    
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Unit Price:</span>
                        <span className="font-medium">₹{group.avgPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-gray-500">Total Value:</span>
                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                            ₹{group.totalValue.toLocaleString('en-IN')}
                        </span>
                    </div>

                    {group.isLowStock && (
                        <div className="mb-4 text-xs text-red-600 flex items-center gap-1 font-medium bg-red-50 p-2 rounded border border-red-100">
                            <AlertTriangle size={14} /> Low Stock (Less than {LOW_STOCK_THRESHOLD})
                        </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-500 border-t pt-3 mt-auto">
                    <span>Count: {group.count}</span>
                    <button 
                        onClick={() => {setSearchTerm(group.model); setGroupByModel(false);}}
                        className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                    >
                        View {group.count} Items <Layers size={12} />
                    </button>
                    </div>
                </div>
                ))}
                {groupedInventory?.length === 0 && (
                    <div className="col-span-full p-12 text-center text-gray-400">
                         <Layers className="mx-auto h-12 w-12 mb-2 opacity-20" />
                        <p>No models found.</p>
                    </div>
                )}
            </div>
            )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-primary p-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-lg">{isEditMode ? 'Edit Stock Item' : 'Add Hearing Aid Stock'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-teal-100 hover:text-white">&times;</button>
            </div>
            <div className="p-6 space-y-4 h-[70vh] overflow-y-auto custom-scrollbar">
              {!isEditMode && (
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsBulkMode(!isBulkMode)}
                        className={`text-xs flex items-center gap-1 px-3 py-1 rounded-full border transition ${isBulkMode ? 'bg-teal-50 border-teal-200 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        {isBulkMode ? <Layers size={14} /> : <FilePlus size={14} />}
                        {isBulkMode ? 'Switch to Single Entry' : 'Switch to Bulk Entry'}
                    </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    value={newItem.brand}
                    onChange={(e) => setNewItem({...newItem, brand: e.target.value})}
                  >
                    <option value="">Select Brand...</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newItem.model}
                    onChange={(e) => setNewItem({...newItem, model: e.target.value})}
                    placeholder="e.g. Lumity L90"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isBulkMode ? 'Serial Numbers (Bulk) *' : 'Serial Number *'}
                </label>
                {isBulkMode ? (
                    <div className="relative">
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm h-24"
                            value={bulkSerials}
                            onChange={(e) => setBulkSerials(e.target.value)}
                            placeholder={`Enter multiple serial numbers.\nSeparate by new lines or commas.`}
                        />
                        <div className="text-xs text-gray-400 text-right mt-1">
                            {bulkSerials.split(/[\n,]+/).filter(s=>s.trim()).length} items detected
                        </div>
                    </div>
                ) : (
                    <input
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                        value={newItem.serialNumber}
                        onChange={(e) => setNewItem({...newItem, serialNumber: e.target.value})}
                        placeholder="Enter unique serial no."
                        disabled={isEditMode}
                    />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (INR) *</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newItem.price || ''}
                    onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                  >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Added</label>
                  <input 
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newItem.addedDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewItem({...newItem, addedDate: e.target.value})}
                  />
              </div>

              {isEditMode && (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                        value={newItem.status}
                        onChange={(e) => setNewItem({...newItem, status: e.target.value as any})}
                      >
                        <option value="Available">Available</option>
                        <option value="Sold">Sold</option>
                        <option value="In-Transit">In-Transit</option>
                      </select>
                  </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newItem.hsnCode}
                    onChange={(e) => setNewItem({...newItem, hsnCode: e.target.value})}
                    placeholder="e.g. 90214090"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newItem.gstRate}
                    onChange={(e) => setNewItem({...newItem, gstRate: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-teal-800 transition shadow-md"
                >
                  {isEditMode ? 'Update Item' : isBulkMode ? 'Save All' : 'Save Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};