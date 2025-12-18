
import React, { useState } from 'react';
import { CompanyAsset, LOCATIONS, UserRole } from '../types';
import { Plus, Search, HardDrive, MapPin, Tag, Hash, Calendar, X, Trash2, Edit, Box } from 'lucide-react';

interface CompanyAssetsProps {
  assets: CompanyAsset[];
  onAdd: (asset: CompanyAsset) => void;
  onUpdate: (asset: CompanyAsset) => void;
  onDelete: (id: string) => void;
  userRole: UserRole;
}

export const CompanyAssets: React.FC<CompanyAssetsProps> = ({ assets, onAdd, onUpdate, onDelete, userRole }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null);

  const [formData, setFormData] = useState<Partial<CompanyAsset>>({
    name: '',
    serialNumber: '',
    location: LOCATIONS[0],
    type: '',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormData({ name: '', serialNumber: '', location: LOCATIONS[0], type: '', notes: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (asset: CompanyAsset) => {
    setEditingAsset(asset);
    setFormData({ ...asset });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serialNumber) return;

    if (editingAsset) {
      onUpdate({ ...editingAsset, ...formData } as CompanyAsset);
    } else {
      onAdd({
        ...formData,
        id: `ASSET-${Date.now()}`,
        addedDate: new Date().toISOString().split('T')[0]
      } as CompanyAsset);
    }
    setShowModal(false);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLoc = locationFilter === 'ALL' || asset.location === locationFilter;
    return matchesSearch && matchesLoc;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <HardDrive className="text-primary" /> Company Assets
          </h2>
          <p className="text-sm text-gray-500 font-medium">Track machines, laptops, and clinic equipment.</p>
        </div>
        
        {userRole === 'admin' && (
          <button onClick={handleOpenAdd} className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-teal-800 transition">
            <Plus size={20} /> Add New Asset
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Machine Name, SN or Type..." 
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border rounded-xl px-4 py-2.5 bg-white text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
        >
          <option value="ALL">All Hospital Locations</option>
          {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Box className="mx-auto h-12 w-12 text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">No assets found matching your criteria.</p>
          </div>
        ) : filteredAssets.map(asset => (
          <div key={asset.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <HardDrive size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {userRole === 'admin' && (
                  <>
                    <button onClick={() => handleOpenEdit(asset)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Edit"><Edit size={18}/></button>
                    <button onClick={() => { if(window.confirm(`Delete asset ${asset.name}?`)) onDelete(asset.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 size={18}/></button>
                  </>
                )}
              </div>
            </div>
            
            <h3 className="font-black text-xl text-gray-800 leading-tight mb-2 uppercase">{asset.name}</h3>
            
            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-gray-400" />
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{asset.serialNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-teal-500" />
                <span className="font-bold text-teal-700">{asset.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-orange-400" />
                <span className="font-medium">{asset.type}</span>
              </div>
              <div className="pt-2 border-t mt-4 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Calendar size={10}/> Added: {new Date(asset.addedDate).toLocaleDateString()}</span>
                <span className="text-slate-300">ID: {asset.id.split('-').pop()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-primary p-5 text-white flex justify-between items-center font-black uppercase tracking-widest">
              <h3>{editingAsset ? 'Modify' : 'New Asset'} Entry</h3>
              <button onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Machine's Name *</label>
                <input 
                  required 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-bold text-gray-700" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Dell Latitude 5420 / Audiometer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Machine's SN (Serial No) *</label>
                <input 
                  required 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-mono font-bold text-teal-700" 
                  value={formData.serialNumber} 
                  onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                  placeholder="Enter unique Serial Number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Machine Type</label>
                  <input 
                    className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-bold text-gray-700" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    placeholder="e.g. Laptop, Medical Device"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Machine's Location</label>
                  <select 
                    className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none bg-gray-50 font-bold text-gray-700"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Notes / Remakrs</label>
                <textarea 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-teal-500 outline-none transition-all font-medium text-gray-600 h-24 resize-none" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional details..."
                />
              </div>

              <button type="submit" className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-900/20 hover:bg-teal-800 transition-all uppercase tracking-[0.2em] mt-4">
                {editingAsset ? 'Update Asset Info' : 'Confirm Asset Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
