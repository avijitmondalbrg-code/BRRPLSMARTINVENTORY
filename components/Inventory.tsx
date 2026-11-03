import React, { useState, useMemo } from 'react';
import { HearingAid, LOCATIONS, BRANDS, UserRole } from '../types';
import { 
  Plus, Search, Package, Layers, List, MapPin, CheckCircle, 
  XCircle, Truck, Edit, Trash2, X, ChevronRight, Hash, 
  Download, Calendar, Filter, RotateCcw, IndianRupee, Clock, Check
} from 'lucide-react';

interface InventoryProps {
  inventory: HearingAid[];
  onAdd: (item: HearingAid | HearingAid[]) => void;
  onUpdate: (item: HearingAid) => void;
  onDelete: (itemId: string) => void;
  userRole: UserRole;
}

type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_FY' | 'CUSTOM';

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const Inventory: React.FC<InventoryProps> = ({ inventory, onAdd, onUpdate, onDelete, userRole }) => {
  const [viewType, setViewType] = useState<'grouped' | 'list'>('grouped');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('Available');

  // Date Range Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSerials, setBulkSerials] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<HearingAid>>({
    brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0
  });

  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = formatLocalDate(now);

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatLocalDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'LAST_7_DAYS') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setStartDate(formatLocalDate(past));
      setEndDate(todayStr);
    } else if (preset === 'LAST_30_DAYS') {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      setStartDate(formatLocalDate(past));
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatLocalDate(start));
      setEndDate(todayStr);
    } else if (preset === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
    } else if (preset === 'THIS_FY') {
      const currentYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
      setStartDate(`${fyStartYear}-04-01`);
      setEndDate(todayStr);
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setDatePreset('CUSTOM');
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setDatePreset('CUSTOM');
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setDatePreset('ALL');
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.hsnCode && item.hsnCode.includes(searchTerm)) ||
        (item.entryBy && item.entryBy.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLoc = locationFilter === 'ALL' || item.location === locationFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = item.addedDate ? item.addedDate.split('T')[0].trim() : '';
        if (startDate && itemDate && itemDate < startDate) matchesDate = false;
        if (endDate && itemDate && itemDate > endDate) matchesDate = false;
        if (!itemDate && (startDate || endDate)) matchesDate = false;
      }

      return matchesSearch && matchesLoc && matchesStatus && matchesDate;
    });
  }, [inventory, searchTerm, locationFilter, statusFilter, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalUnits = filteredInventory.length;
    const availableItems = filteredInventory.filter(i => i.status === 'Available');
    const soldItems = filteredInventory.filter(i => i.status === 'Sold');
    const transitItems = filteredInventory.filter(i => i.status === 'In-Transit');
    const availableValue = availableItems.reduce((acc, i) => acc + (i.price || 0), 0);
    const totalValue = filteredInventory.reduce((acc, i) => acc + (i.price || 0), 0);

    return {
      totalUnits,
      availableCount: availableItems.length,
      availableValue,
      soldCount: soldItems.length,
      transitCount: transitItems.length,
      totalValue
    };
  }, [filteredInventory]);

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

  const exportToCSV = () => {
    if (filteredInventory.length === 0) {
      alert('No stock records to export for the selected date range and filters.');
      return;
    }

    const headers = [
      'Sl No',
      'Brand',
      'Model',
      'Serial Number',
      'HSN Code',
      'Base Price (INR)',
      'Location / Hub',
      'Status',
      'Added Date',
      'Entry By'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredInventory.map((item, idx) => [
      idx + 1,
      escapeCSV(item.brand),
      escapeCSV(item.model),
      escapeCSV(item.serialNumber),
      escapeCSV(item.hsnCode || '90214090'),
      item.price || 0,
      escapeCSV(item.location),
      escapeCSV(item.status),
      escapeCSV(item.addedDate || 'N/A'),
      escapeCSV(item.entryBy || 'N/A')
    ]);

    const summaryRow = [
      'TOTAL',
      '',
      '',
      `${filteredInventory.length} Units`,
      '',
      metrics.totalValue,
      '',
      `Available: ${metrics.availableCount} | Sold: ${metrics.soldCount}`,
      startDate || endDate ? `${startDate || 'All'} to ${endDate || 'All'}` : 'All Dates',
      ''
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      summaryRow.join(',')
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateTag = startDate || endDate 
      ? `_${startDate || 'start'}_to_${endDate || 'end'}` 
      : '_all_time';
    link.setAttribute('href', url);
    link.setAttribute('download', `BRG_Stock_Inventory_Report${dateTag}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setIsBulkMode(false);
    setNewItem({
      brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: HearingAid) => {
    setEditingId(item.id);
    setIsBulkMode(false);
    setNewItem({ ...item });
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!newItem.brand || !newItem.model || (!isBulkMode && !newItem.serialNumber)) {
      alert("Required fields missing.");
      return;
    }

    const currentHsn = newItem.hsnCode || '90214090';

    if (editingId) {
      onUpdate({
        ...newItem,
        id: editingId,
        hsnCode: currentHsn,
      } as HearingAid);
    } else if (isBulkMode) {
      const serials = bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
      const newItems: HearingAid[] = serials.map(sn => ({
        ...newItem,
        id: `HA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        serialNumber: sn,
        hsnCode: currentHsn,
        addedDate: new Date().toISOString().split('T')[0],
      } as HearingAid));
      onAdd(newItems);
    } else {
      onAdd({
        ...newItem,
        id: `HA-${Date.now()}`,
        hsnCode: currentHsn,
        addedDate: new Date().toISOString().split('T')[0],
      } as HearingAid);
    }
    
    setShowAddModal(false);
    setEditingId(null);
    setBulkSerials('');
    setNewItem({
      brand: BRANDS[0], model: '', serialNumber: '', price: 0, location: LOCATIONS[0], status: 'Available', hsnCode: '90214090', gstRate: 0
    });
  };

  const isDateFilterActive = !!(startDate || endDate);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-[#3159a6] rounded-2xl shadow-sm">
              <Package size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                Stock Inventory Dashboard
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Real-Time Stock Holdings, Date Range Analytics & Audits
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="bg-gray-100 p-1 rounded-2xl flex border border-gray-200/60">
            <button 
              onClick={() => setViewType('grouped')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition cursor-pointer ${viewType === 'grouped' ? 'bg-[#3159a6] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Layers size={14} /> Model Summary
            </button>
            <button 
              onClick={() => setViewType('list')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition cursor-pointer ${viewType === 'list' ? 'bg-[#3159a6] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <List size={14} /> Serial Details
            </button>
          </div>
          <button 
            onClick={exportToCSV} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition font-black uppercase text-[10px] tracking-widest cursor-pointer active:scale-95"
            title="Download CSV report for current date range and filters"
          >
            <Download size={16} /> Export Stock Report
          </button>
          {userRole === 'admin' && (
            <button 
              onClick={handleOpenAdd} 
              className="bg-[#3159a6] hover:bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-900/20 transition font-black uppercase text-[10px] tracking-widest cursor-pointer active:scale-95"
            >
              <Plus size={16} /> New Stock Entry
            </button>
          )}
        </div>
      </div>

      {/* Stock KPI Summary Cards (Reflects Filtered Date Range & Filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-[#3159a6] rounded-2xl">
            <Package size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isDateFilterActive ? 'Inward In Range' : 'Total Registered'}
            </p>
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {metrics.totalUnits} <span className="text-xs font-bold text-gray-400 uppercase">Units</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Stock</p>
            <p className="text-2xl font-black text-emerald-700 tracking-tight">
              {metrics.availableCount} <span className="text-xs font-bold text-gray-400 uppercase">Units</span>
            </p>
            <p className="text-[11px] font-black text-slate-500 mt-0.5">
              ₹{metrics.availableValue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-slate-50 text-slate-600 rounded-2xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sold / Dispensed</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.soldCount} <span className="text-xs font-bold text-gray-400 uppercase">Units</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl">
            <Truck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">In-Transit</p>
            <p className="text-2xl font-black text-orange-600 tracking-tight">
              {metrics.transitCount} <span className="text-xs font-bold text-gray-400 uppercase">Units</span>
            </p>
          </div>
        </div>
      </div>

      {/* Date Range & Comprehensive Filter Panel */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Date Presets Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
            <Calendar size={16} className="text-[#3159a6]" />
            <span>Inward Date Range Filter:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
              { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_MONTH', label: 'Last Month' },
              { id: 'THIS_FY', label: 'This FY' },
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => applyDatePreset(preset.id as DatePreset)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-[#3159a6] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs & Search / Location / Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Custom Date Pickers */}
          <div className="lg:col-span-4 flex items-center gap-2 bg-gray-50/80 p-2 rounded-2xl border border-gray-100">
            <div className="flex-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-0.5">
                From Date
              </label>
              <input 
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-gray-800 outline-none focus:border-[#3159a6] transition"
              />
            </div>
            <span className="text-gray-400 font-bold text-xs pt-4">to</span>
            <div className="flex-1">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-0.5">
                To Date
              </label>
              <input 
                type="date"
                value={endDate}
                onChange={e => handleEndDateChange(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-gray-800 outline-none focus:border-[#3159a6] transition"
              />
            </div>
            {isDateFilterActive && (
              <button
                onClick={clearDateFilter}
                className="self-end mb-1 p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                title="Reset date filter"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search serial, HSN, model, or staff..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus:bg-white focus:border-[#3159a6] outline-none text-xs font-bold text-gray-800 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Location Hub Filter */}
          <div className="lg:col-span-2">
            <select 
              className="w-full bg-gray-50/80 border border-gray-200/80 rounded-2xl px-3 py-3 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-[#3159a6]" 
              value={locationFilter} 
              onChange={e => setLocationFilter(e.target.value)}
            >
              <option value="ALL">All Store Hubs</option>
              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select 
              className="w-full bg-gray-50/80 border border-gray-200/80 rounded-2xl px-3 py-3 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-[#3159a6]" 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="Available">Available Only</option>
              <option value="Sold">Sold Only</option>
              <option value="In-Transit">In-Transit Only</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Banner & Fast Download Link */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-500 font-bold">
            <span>Showing <span className="text-[#3159a6] font-black">{filteredInventory.length}</span> units</span>
            {isDateFilterActive && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-[#3159a6] rounded-full text-[10px] font-black border border-blue-100">
                Range: {startDate || 'Earliest'} ~ {endDate || 'Latest'}
              </span>
            )}
            {locationFilter !== 'ALL' && (
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black">
                Hub: {locationFilter}
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black">
                Status: {statusFilter}
              </span>
            )}
            {searchTerm && (
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black">
                Search: "{searchTerm}"
              </span>
            )}
          </div>

          <button
            onClick={exportToCSV}
            className="text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Download size={13} /> Download Filtered List ({filteredInventory.length} items)
          </button>
        </div>

        {/* Views: Grouped Model Cards OR Detailed Serial Table */}
        {viewType === 'grouped' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
            {groupedStock.length === 0 ? (
              <div className="col-span-full p-16 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                <Package size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-black uppercase tracking-widest text-xs">No stock items match your date range and filters</p>
                <button 
                  onClick={() => { clearDateFilter(); setLocationFilter('ALL'); setStatusFilter('ALL'); setSearchTerm(''); }}
                  className="mt-3 text-xs font-black text-[#3159a6] underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : groupedStock.map(group => (
              <div key={`${group.brand}-${group.model}`} className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all group border-b-4 border-b-[#3159a6]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-gray-800 uppercase tracking-tighter text-xl leading-none">{group.brand}</h3>
                    <p className="text-xs text-[#3159a6] font-black uppercase mt-2 tracking-widest">{group.model}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${group.available > 0 ? 'bg-white text-green-600 border-green-50' : 'bg-white text-red-600 border-red-50'}`}>
                    {group.available} Available / {group.total} Total
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>M.R.P (Base)</span>
                    <span className="text-gray-700">₹{group.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Available Holdings</span>
                    <span className="text-[#3159a6]">₹{(group.price * group.available).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setSearchTerm(group.model); setViewType('list'); }}
                  className="w-full py-3 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase text-[#3159a6] hover:bg-[#3159a6] hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Inspect Units ({group.items.length}) <ChevronRight size={14}/>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 pt-2">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#3159a6] text-white uppercase font-black text-[10px] tracking-[0.2em] border-b">
                <tr>
                  <th className="p-4">Brand / Model</th>
                  <th className="p-4 text-center">HSN Code</th>
                  <th className="p-4">Serial No</th>
                  <th className="p-4">Inward Date</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Base Value</th>
                  <th className="p-4">Status</th>
                  {userRole === 'admin' && <th className="p-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 8 : 7} className="p-20 text-center text-gray-400 italic font-medium uppercase tracking-widest text-[10px]">
                      Stock database empty for current filters and date range.
                    </td>
                  </tr>
                ) : filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4">
                      <p className="font-black text-gray-800 uppercase tracking-tighter">{item.brand}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{item.model}</p>
                      {item.entryBy && (
                        <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-wide">
                          By: {item.entryBy}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono text-xs font-bold text-slate-500">{item.hsnCode || '90214090'}</td>
                    <td className="p-4 font-mono font-black text-[#3159a6] tracking-widest uppercase">{item.serialNumber}</td>
                    <td className="p-4 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-400" />
                        {item.addedDate || 'Legacy'}
                      </span>
                    </td>
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
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-gray-400 hover:text-[#3159a6] transition cursor-pointer" title="Edit"><Edit size={16}/></button>
                          <button onClick={() => { if(window.confirm(`Delete unit ${item.serialNumber}?`)) onDelete(item.id); }} className="p-1.5 text-gray-400 hover:text-red-600 transition cursor-pointer" title="Delete"><Trash2 size={16}/></button>
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

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border-4 border-white">
            <div className="bg-[#3159a6] p-6 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">
                {editingId ? 'Modify Unit Info' : 'Inventory On-boarding'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="hover:rotate-90 transition-transform cursor-pointer"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Brand</label>
                  <select className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm bg-gray-50 font-bold focus:border-[#3159a6] outline-none transition" value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})}>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Model Name</label>
                  <input className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm font-bold focus:border-[#3159a6] outline-none" placeholder="e.g. Lumity L90" value={newItem.model} onChange={e => setNewItem({...newItem, model: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Serial Capture</label>
                  {!editingId && (
                    <button onClick={() => setIsBulkMode(!isBulkMode)} className="text-[9px] font-black text-[#3159a6] uppercase border-b-2 border-[#3159a6] transition cursor-pointer">
                      {isBulkMode ? 'Single Switch' : 'Bulk Batch Switch'}
                    </button>
                  )}
                </div>
                {isBulkMode ? (
                  <textarea 
                    className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm font-mono focus:border-[#3159a6] outline-none h-32 bg-gray-50" 
                    placeholder="Enter serial numbers (one per line)..." 
                    value={bulkSerials} 
                    onChange={e => setBulkSerials(e.target.value)} 
                  />
                ) : (
                  <input className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm font-mono font-black uppercase tracking-widest focus:border-[#3159a6] outline-none bg-gray-50" placeholder="Unique S/N" value={newItem.serialNumber} onChange={e => setNewItem({...newItem, serialNumber: e.target.value})} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Unit MRP (INR)</label>
                  <input type="number" className="w-full border-2 border-gray-100 rounded-2xl p-3 text-lg font-black text-[#3159a6] outline-none" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">HSN Code</label>
                  <input className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm font-mono font-bold focus:border-[#3159a6] outline-none" value={newItem.hsnCode} onChange={e => setNewItem({...newItem, hsnCode: e.target.value})} placeholder="90214090" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Store Location</label>
                  <select className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm bg-gray-50 font-bold focus:border-[#3159a6] outline-none" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})}>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <button onClick={handleSave} className="w-full py-4 bg-[#3159a6] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 cursor-pointer">
                    {editingId ? 'Update Product' : 'Verify & Add'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
