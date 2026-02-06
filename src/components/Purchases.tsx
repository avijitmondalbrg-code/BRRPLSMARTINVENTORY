import React, { useState, useMemo } from 'react';
import { Vendor, PurchaseRecord, LOCATIONS, BRANDS, UserRole } from '../types';
import { ShoppingBag, Users, Plus, Search, Calendar, FileText, IndianRupee, Trash2, X, CheckCircle, Store, Tag, List } from 'lucide-react';

interface PurchasesProps {
  vendors: Vendor[];
  purchases: PurchaseRecord[];
  onAddVendor: (v: Vendor) => void;
  onAddPurchase: (p: PurchaseRecord) => void;
  onDeletePurchase: (id: string) => void;
  onDeleteVendor: (id: string) => void;
  userRole: UserRole;
}

export const Purchases: React.FC<PurchasesProps> = ({ vendors, purchases, onAddVendor, onAddPurchase, onDeletePurchase, onDeleteVendor, userRole }) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'vendors'>('purchases');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  // Search states
  const [vendorSearch, setVendorSearch] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');

  // Vendor Form
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({ name: '', address: '', gstin: '' });
  
  // Purchase Form
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorInput, setVendorInput] = useState('');
  const [showVendorList, setShowVendorList] = useState(false);
  
  // Bulk Mode States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSerials, setBulkSerials] = useState('');

  const [purchaseForm, setPurchaseForm] = useState<Partial<PurchaseRecord>>({
    invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', brand: BRANDS[0], model: '', serialNumber: '', hsnCode: '90214090', mrp: 0, discountAmount: 0, purchaseAmount: 0, location: LOCATIONS[0]
  });

  const handleSaveVendor = () => {
    if (!vendorForm.name || !vendorForm.address) return;
    onAddVendor({
      ...vendorForm,
      id: `VEND-${Date.now()}`,
      addedDate: new Date().toISOString().split('T')[0]
    } as Vendor);
    setShowVendorModal(false);
    setVendorForm({ name: '', address: '', gstin: '' });
  };

  const handleSavePurchase = () => {
    if (!selectedVendor || !purchaseForm.invoiceNo || !purchaseForm.model) {
        alert("Please select vendor and fill mandatory product details.");
        return;
    }

    if (isBulkMode) {
      const serials = bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
      if (serials.length === 0) {
        alert("Enter at least one Serial Number.");
        return;
      }
      
      // Add each serial as a separate record
      serials.forEach((sn, index) => {
        const newPurchase: PurchaseRecord = {
          ...purchaseForm,
          id: `PUR-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          serialNumber: sn,
          vendorId: selectedVendor.id,
          vendorName: selectedVendor.name,
          createdAt: new Date().toISOString(),
        } as PurchaseRecord;
        onAddPurchase(newPurchase);
      });
      alert(`Bulk entry successful: ${serials.length} units pushed to system.`);
    } else {
      if (!purchaseForm.serialNumber) {
        alert("Serial Number is mandatory.");
        return;
      }
      const newPurchase: PurchaseRecord = {
        ...purchaseForm,
        id: `PUR-${Date.now()}`,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        createdAt: new Date().toISOString(),
      } as PurchaseRecord;
      onAddPurchase(newPurchase);
    }

    setShowPurchaseModal(false);
    resetPurchaseForm();
  };

  const resetPurchaseForm = () => {
    setSelectedVendor(null);
    setVendorInput('');
    setIsBulkMode(false);
    setBulkSerials('');
    setPurchaseForm({
      invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', brand: BRANDS[0], model: '', serialNumber: '', hsnCode: '90214090', mrp: 0, discountAmount: 0, purchaseAmount: 0, location: LOCATIONS[0]
    });
  };

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => 
      p.invoiceNo.toLowerCase().includes(purchaseSearch.toLowerCase()) || 
      p.vendorName.toLowerCase().includes(purchaseSearch.toLowerCase()) || 
      p.serialNumber.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
      p.model.toLowerCase().includes(purchaseSearch.toLowerCase())
    ).sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  }, [purchases, purchaseSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-primary" /> Purchase & Procurement
          </h2>
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Vendor Network & Stock Inward</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl border">
          <button onClick={() => setActiveTab('purchases')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'purchases' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}>Purchase Entries</button>
          <button onClick={() => setActiveTab('vendors')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'vendors' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}>Vendor Registry</button>
        </div>
      </div>

      {activeTab === 'vendors' ? (
        <div className="space-y-6 animate-fade-in">
           <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium" placeholder="Search vendors..." value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} />
              </div>
              <button onClick={() => setShowVendorModal(true)} className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-slate-800 transition">
                <Plus size={18} /> Add Vendor
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed text-gray-300 font-black uppercase tracking-[0.3em]">No vendors registered</div>
              ) : filteredVendors.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative">
                    <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight mb-2">{v.name}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-4 h-10 overflow-hidden line-clamp-2 italic">"{v.address}"</p>
                    <div className="flex justify-between items-center pt-4 border-t">
                       <span className="text-[10px] font-black text-primary bg-blue-50 px-3 py-1 rounded-full">{v.gstin || 'NO GSTIN'}</span>
                       {userRole === 'admin' && (
                         <button onClick={() => { if(window.confirm(`Remove vendor ${v.name}?`)) onDeleteVendor(v.id); }} className="text-red-400 hover:text-red-600 transition p-2"><Trash2 size={16}/></button>
                       )}
                    </div>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
           <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium" placeholder="Search invoice, vendor, serial or model..." value={purchaseSearch} onChange={e => setPurchaseSearch(e.target.value)} />
              </div>
              <button onClick={() => { resetPurchaseForm(); setShowPurchaseModal(true); }} className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-slate-800 transition">
                <Plus size={18} /> New Purchase Entry
              </button>
           </div>

           <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b">
                    <tr><th className="p-5">Inward Date</th><th className="p-5">Invoice #</th><th className="p-5">Vendor</th><th className="p-5">Item Detail</th><th className="p-5 text-right">Purchase Amount</th><th className="p-5 text-center">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredPurchases.length === 0 ? (
                      <tr><td colSpan={6} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No procurement records found</td></tr>
                    ) : filteredPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-5 font-bold text-gray-500">{new Date(p.invoiceDate).toLocaleDateString('en-IN')}</td>
                        <td className="p-5 font-black text-primary uppercase whitespace-nowrap">{p.invoiceNo}</td>
                        <td className="p-5 font-black text-gray-800 uppercase tracking-tight">{p.vendorName}</td>
                        <td className="p-5">
                          <p className="font-black text-[10px] text-slate-600 uppercase">{p.brand} {p.model}</p>
                          <p className="text-[9px] text-teal-600 font-mono font-bold tracking-widest mt-1 uppercase">S/N: {p.serialNumber}</p>
                        </td>
                        <td className="p-5 text-right font-black text-lg">₹{p.purchaseAmount.toLocaleString()}</td>
                        <td className="p-5 text-center">
                           <button onClick={() => { if(window.confirm('Delete purchase entry? Item will NOT be auto-removed from stock.')) onDeletePurchase(p.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {/* Vendor Add Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[100] p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border-4 border-white my-auto">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-xs ml-2">Vendor On-boarding</h3>
              <button onClick={() => setShowVendorModal(false)}><X size={24}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Vendor Full Name *</label>
                <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} placeholder="e.g. Sona Medical Pvt Ltd" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">GST Number</label>
                <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold uppercase" value={vendorForm.gstin} onChange={e => setVendorForm({...vendorForm, gstin: e.target.value})} placeholder="19ABCDE..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Head Office Address *</label>
                <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-medium text-sm h-24 resize-none" value={vendorForm.address} onChange={e => setVendorForm({...vendorForm, address: e.target.value})} placeholder="Enter full postal address..." />
              </div>
              <button onClick={handleSaveVendor} className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition active:scale-95 text-xs">Verify & Save Vendor</button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Entry Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[100] p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border-4 border-white my-auto flex flex-col max-h-[95vh]">
            <div className="bg-primary p-6 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="font-black uppercase tracking-widest text-xs ml-2">Stock Procurement Node</h3>
              <button onClick={() => setShowPurchaseModal(false)}><X size={24}/></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Users size={12}/> Search Vendor *</label>
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold bg-blue-50/30" placeholder="Type vendor name..." value={vendorInput} onChange={e => { setVendorInput(e.target.value); setShowVendorList(true); }} onFocus={() => setShowVendorList(true)} />
                    {showVendorList && vendorInput && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-2xl max-h-40 overflow-y-auto p-2">
                        {vendors.filter(v => v.name.toLowerCase().includes(vendorInput.toLowerCase())).map(v => (
                          <button key={v.id} onClick={() => { setSelectedVendor(v); setVendorInput(v.name); setShowVendorList(false); }} className="w-full text-left p-3 hover:bg-blue-50 rounded-lg text-xs font-bold uppercase transition">{v.name}</button>
                        ))}
                      </div>
                    )}
                    {selectedVendor && <div className="text-[9px] font-black text-green-600 uppercase bg-green-50 px-3 py-1 rounded-full inline-block mt-2"><CheckCircle size={10} className="inline mr-1"/> Vendor Linked</div>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><FileText size={12}/> Invoice Number *</label>
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-black uppercase" value={purchaseForm.invoiceNo} onChange={e => setPurchaseForm({...purchaseForm, invoiceNo: e.target.value})} placeholder="INV/2024/..." />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Calendar size={12}/> Invoice Date *</label>
                    <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold" value={purchaseForm.invoiceDate} onChange={e => setPurchaseForm({...purchaseForm, invoiceDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Calendar size={12}/> Payment Due Date</label>
                    <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold text-red-500" value={purchaseForm.dueDate} onChange={e => setPurchaseForm({...purchaseForm, dueDate: e.target.value})} />
                  </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 space-y-5">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Tag size={12}/> Item Information (Autoloads to Stock)</p>
                    <button 
                      onClick={() => { setIsBulkMode(!isBulkMode); setBulkSerials(''); }} 
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-2 transition-all ${isBulkMode ? 'bg-[#3159a6] text-white border-[#3159a6]' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}
                    >
                      {isBulkMode ? 'Bulk Entry: ON' : 'Switch to Bulk'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Brand</label>
                      <select className="w-full border-2 border-white rounded-xl p-2.5 font-bold outline-none focus:border-primary" value={purchaseForm.brand} onChange={e => setPurchaseForm({...purchaseForm, brand: e.target.value})}>
                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Model Name *</label>
                      <input className="w-full border-2 border-white rounded-xl p-2.5 font-bold outline-none focus:border-primary" value={purchaseForm.model} onChange={e => setPurchaseForm({...purchaseForm, model: e.target.value})} placeholder="Hearing Aid Model" />
                    </div>
                    
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">
                        {isBulkMode ? 'Serial Numbers (One per line) *' : 'Serial Number (S/N) *'}
                      </label>
                      {isBulkMode ? (
                        <textarea 
                          className="w-full border-2 border-white rounded-xl p-4 text-sm font-mono font-bold text-teal-600 outline-none focus:border-primary bg-white h-32 custom-scrollbar" 
                          placeholder="Enter multiple serials..." 
                          value={bulkSerials} 
                          onChange={e => setBulkSerials(e.target.value)}
                        />
                      ) : (
                        <input className="w-full border-2 border-white rounded-xl p-2.5 font-black uppercase font-mono text-teal-600 outline-none focus:border-primary" value={purchaseForm.serialNumber} onChange={e => setPurchaseForm({...purchaseForm, serialNumber: e.target.value})} placeholder="Unique Serial" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">HSN / SAC Code</label>
                      <input className="w-full border-2 border-white rounded-xl p-2.5 font-mono font-bold outline-none focus:border-primary" value={purchaseForm.hsnCode} onChange={e => setPurchaseForm({...purchaseForm, hsnCode: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Storage Location</label>
                      <select className="w-full border-2 border-white rounded-xl p-2.5 font-bold outline-none focus:border-primary" value={purchaseForm.location} onChange={e => setPurchaseForm({...purchaseForm, location: e.target.value})}>
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50">
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Item MRP *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                      <input type="number" className="w-full pl-8 border-2 border-white bg-white p-2.5 rounded-xl font-black text-primary outline-none focus:border-primary" value={purchaseForm.mrp || ''} onChange={e => setPurchaseForm({...purchaseForm, mrp: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50">
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Discount Amount</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={14}/>
                      <input type="number" className="w-full pl-8 border-2 border-white bg-white p-2.5 rounded-xl font-black text-red-500 outline-none focus:border-primary" value={purchaseForm.discountAmount || ''} onChange={e => setPurchaseForm({...purchaseForm, discountAmount: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/10">
                    <label className="block text-[10px] font-black text-primary mb-2 uppercase tracking-widest ml-1">Final Purchase Cost *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14}/>
                      <input type="number" className="w-full pl-8 border-2 border-white bg-white p-2.5 rounded-xl font-black text-gray-800 outline-none focus:border-primary shadow-sm" value={purchaseForm.purchaseAmount || ''} onChange={e => setPurchaseForm({...purchaseForm, purchaseAmount: Number(e.target.value)})} />
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-8 pt-0 flex-shrink-0">
               <button onClick={handleSavePurchase} className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition active:scale-95 text-[10px] flex items-center justify-center gap-3">
                  <Store size={18}/> Commit {isBulkMode ? 'Bulk ' : ''}Purchase & Push to Stock
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};