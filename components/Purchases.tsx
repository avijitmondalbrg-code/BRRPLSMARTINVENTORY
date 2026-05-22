import React, { useState, useMemo, useEffect } from 'react';
import { Vendor, PurchaseRecord, LOCATIONS, BRANDS, UserRole, PurchaseOrder, PurchaseOrderItem } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, CLINIC_GSTIN } from '../constants';
import { 
  ShoppingBag, Users, Plus, Search, Calendar, FileText, IndianRupee, Trash2, X, 
  CheckCircle, Store, Tag, List, ShieldAlert, Printer, ChevronRight, Check, CheckSquare, 
  PlusCircle, Edit3, ArrowLeft, Ban, AlertCircle, Eye, Download, Info
} from 'lucide-react';

interface PurchasesProps {
  vendors: Vendor[];
  purchases: PurchaseRecord[];
  purchaseOrders: PurchaseOrder[];
  onAddVendor: (v: Vendor) => void;
  onAddPurchase: (p: PurchaseRecord) => void;
  onDeletePurchase: (id: string) => void;
  onDeleteVendor: (id: string) => void;
  onSavePurchaseOrder: (po: PurchaseOrder) => void;
  onDeletePurchaseOrder: (id: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
  backHandlerRef?: React.MutableRefObject<(() => boolean) | null>;
}

// Helper to convert number to words
const inWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const n = ('000000000' + num).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += Number(n[4]) !== 0 ? a[Number(n[4])] + 'Hundred ' : '';
  str += Number(n[5]) !== 0 ? ((str !== '' ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])])) : '';
  return str + 'Rupees Only';
};

export const Purchases: React.FC<PurchasesProps> = ({ 
  vendors, 
  purchases, 
  purchaseOrders = [], 
  onAddVendor, 
  onAddPurchase, 
  onDeletePurchase, 
  onDeleteVendor, 
  onSavePurchaseOrder,
  onDeletePurchaseOrder,
  logo, 
  signature, 
  userRole,
  backHandlerRef
}) => {
  // Access Control: Block non-admin users
  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
        <div className="p-6 bg-red-50 text-red-500 rounded-full mb-6">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-2">Access Denied</h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] max-w-xs text-center leading-relaxed">
          Procurement and Vendor Registry are restricted to Administrative access only. 
          Please contact the system owner if you require these permissions.
        </p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'purchases' | 'po' | 'vendors'>('purchases');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  // Search states
  const [vendorSearch, setVendorSearch] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('All');

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

  // ========== Purchase Order (PO) Form Hook States ==========
  const [viewPoMode, setViewPoMode] = useState<'list' | 'create' | 'view'>('list');

  useEffect(() => {
    if (!backHandlerRef) return;
    const handler = () => {
      if (activeTab === 'po' && viewPoMode !== 'list') {
        setViewPoMode('list');
        return true;
      }
      if (activeTab !== 'purchases') {
        setActiveTab('purchases');
        return true;
      }
      if (showVendorModal) {
        setShowVendorModal(false);
        return true;
      }
      if (showPurchaseModal) {
        setShowPurchaseModal(false);
        return true;
      }
      return false;
    };
    backHandlerRef.current = handler;
    return () => {
      if (backHandlerRef.current === handler) {
        backHandlerRef.current = null;
      }
    };
  }, [activeTab, viewPoMode, showVendorModal, showPurchaseModal, backHandlerRef]);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  
  const [poVendor, setPoVendor] = useState<Vendor | null>(null);
  const [poVendorInput, setPoVendorInput] = useState('');
  const [showPoVendorList, setShowPoVendorList] = useState(false);
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([
    {
      id: 'po-item-1',
      brand: BRANDS[0],
      model: '',
      hsnCode: '90214090',
      qty: 1,
      rate: 0,
      discount: 0,
      taxableValue: 0,
      gstRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0
    }
  ]);

  // ========== PO Inward / Receiver States ==========
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardPo, setInwardPo] = useState<PurchaseOrder | null>(null);
  const [inwardSerials, setInwardSerials] = useState<{ [itemId: string]: string }>({});
  const [inwardLocations, setInwardLocations] = useState<{ [itemId: string]: string }>({});

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

  // ========== Purchase Orders Memo / Filters ==========
  const filteredPOList = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesSearch = po.id.toLowerCase().includes(poSearch.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(poSearch.toLowerCase()) ||
        po.items.some(it => it.model.toLowerCase().includes(poSearch.toLowerCase()));
      
      const matchesStatus = poStatusFilter === 'All' || po.status === poStatusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchaseOrders, poSearch, poStatusFilter]);

  // ========== PO Item Handlers ==========
  const updatePoItem = (index: number, fields: Partial<PurchaseOrderItem>) => {
    const updated = [...poItems];
    const item = { ...updated[index], ...fields };
    
    // Recalculate totals for this item
    const baseValue = item.rate * item.qty;
    const taxableValue = Math.max(0, baseValue - item.discount);
    const totalTax = taxableValue * (item.gstRate / 100);
    
    item.taxableValue = taxableValue;
    item.cgstAmount = totalTax / 2;
    item.sgstAmount = totalTax / 2;
    item.igstAmount = 0;
    item.totalAmount = taxableValue + totalTax;
    
    updated[index] = item;
    setPoItems(updated);
  };

  const addPoItem = () => {
    const nextId = `po-item-${Date.now()}`;
    setPoItems([
      ...poItems,
      {
        id: nextId,
        brand: BRANDS[0],
        model: '',
        hsnCode: '90214090',
        qty: 1,
        rate: 0,
        discount: 0,
        taxableValue: 0,
        gstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 0
      }
    ]);
  };

  const removePoItem = (index: number) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const poCalculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;
    let finalTotal = 0;

    poItems.forEach(item => {
      subtotal += (item.rate * item.qty);
      totalDiscount += item.discount;
      totalTaxableValue += item.taxableValue;
      totalCGST += item.cgstAmount;
      totalSGST += item.sgstAmount;
      totalIGST += item.igstAmount;
      totalTax += (item.cgstAmount + item.sgstAmount + item.igstAmount);
      finalTotal += item.totalAmount;
    });

    finalTotal = Math.max(0, finalTotal - globalDiscount);

    return {
      subtotal,
      totalDiscount,
      totalTaxableValue,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax,
      finalTotal
    };
  }, [poItems, globalDiscount]);

  const resetPoForm = () => {
    setPoVendor(null);
    setPoVendorInput('');
    setPoDate(new Date().toISOString().split('T')[0]);
    setPoExpectedDate('');
    setPoNotes('');
    setGlobalDiscount(0);
    setPoItems([
      {
        id: 'po-item-1',
        brand: BRANDS[0],
        model: '',
        hsnCode: '90214090',
        qty: 1,
        rate: 0,
        discount: 0,
        taxableValue: 0,
        gstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 0
      }
    ]);
  };

  const handleSavePurchaseOrderLocal = () => {
    if (!poVendor) {
      alert("Please select a vendor.");
      return;
    }
    if (poItems.some(item => !item.model)) {
      alert("Please fill model name for all items.");
      return;
    }
    if (poItems.some(item => item.qty <= 0 || item.rate <= 0)) {
      alert("Quantity and Purchase Rate must be greater than 0.");
      return;
    }

    const nextId = `PO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPO: PurchaseOrder = {
      id: nextId,
      vendorId: poVendor.id,
      vendorName: poVendor.name,
      vendorDetails: poVendor,
      date: poDate,
      expectedDeliveryDate: poExpectedDate || undefined,
      items: poItems,
      subtotal: poCalculations.subtotal,
      totalDiscount: poCalculations.totalDiscount,
      globalDiscount: globalDiscount,
      totalTaxableValue: poCalculations.totalTaxableValue,
      totalCGST: poCalculations.totalCGST,
      totalSGST: poCalculations.totalSGST,
      totalIGST: poCalculations.totalIGST,
      totalTax: poCalculations.totalTax,
      finalTotal: poCalculations.finalTotal,
      status: 'Draft',
      notes: poNotes,
      entryBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    onSavePurchaseOrder(newPO);
    setViewPoMode('list');
    resetPoForm();
    alert(`Purchase Order ${nextId} created successfully in Draft status.`);
  };

  // ========== PO Status Transition handler ==========
  const changePoStatus = (po: PurchaseOrder, newStatus: PurchaseOrder['status']) => {
    const updated = { ...po, status: newStatus };
    onSavePurchaseOrder(updated);
    setSelectedPo(updated);
  };

  // ========== Inward Delivery Logic ==========
  const handleOpenInward = (po: PurchaseOrder) => {
    setInwardPo(po);
    const initialSerials: { [itemId: string]: string } = {};
    const initialLocs: { [itemId: string]: string } = {};
    po.items.forEach(item => {
      initialSerials[item.id] = '';
      initialLocs[item.id] = LOCATIONS[0];
    });
    setInwardSerials(initialSerials);
    setInwardLocations(initialLocs);
    setShowInwardModal(true);
  };

  const handleSaveInwardToStock = () => {
    if (!inwardPo) return;

    let totalSavedUnits = 0;
    const errors: string[] = [];

    // Verify all serial counts
    inwardPo.items.forEach(item => {
      const serialString = inwardSerials[item.id] || '';
      const serials = serialString.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
      
      if (serials.length !== item.qty) {
        errors.push(`${item.brand} ${item.model}: Requires exactly ${item.qty} serials (Found: ${serials.length})`);
      }
    });

    if (errors.length > 0) {
      if (!window.confirm(`Warning:\n${errors.join('\n')}\n\nSerial counts do not match ordered quantity. Do you still wish to commit the entered stock objects?`)) {
        return;
      }
    }

    // Process push to stock
    inwardPo.items.forEach(item => {
      const serialString = inwardSerials[item.id] || '';
      const serials = serialString.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
      const loc = inwardLocations[item.id] || LOCATIONS[0];

      serials.forEach((sn, idx) => {
        const recordId = `PUR-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
        const record: PurchaseRecord = {
          id: recordId,
          vendorId: inwardPo.vendorId,
          vendorName: inwardPo.vendorName,
          invoiceNo: `PO-INWARD-${inwardPo.id}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          brand: item.brand,
          model: item.model,
          serialNumber: sn,
          hsnCode: item.hsnCode,
          mrp: item.rate, // purchase cost
          discountAmount: item.discount / item.qty, // amortized item discount
          purchaseAmount: item.taxableValue / item.qty, // taxable base weight
          location: loc,
          createdAt: new Date().toISOString()
        };

        onAddPurchase(record);
        totalSavedUnits++;
      });
    });

    // Mark PO as Delivered
    const updatedPo: PurchaseOrder = {
      ...inwardPo,
      status: 'Delivered'
    };
    onSavePurchaseOrder(updatedPo);
    
    // Reset selectedPo if active
    if (selectedPo && selectedPo.id === inwardPo.id) {
      setSelectedPo(updatedPo);
    }

    setShowInwardModal(false);
    setInwardPo(null);
    alert(`Success! Inwarded ${totalSavedUnits} items directly into available stock. Purchase Order ${updatedPo.id} status is set to Delivered.`);
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Tab Header: Hidden on browser print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-primary" /> Purchase & Procurement
          </h2>
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Vendor Network & Stock Inward</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl border">
          <button onClick={() => { setActiveTab('purchases'); setViewPoMode('list'); }} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'purchases' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}>Purchase Entries</button>
          <button onClick={() => { setActiveTab('po'); setViewPoMode('list'); }} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'po' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}>Purchase Orders (PO)</button>
          <button onClick={() => { setActiveTab('vendors'); setViewPoMode('list'); }} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'vendors' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}>Vendor Registry</button>
        </div>
      </div>

      {/* ========== Active View Router ========== */}
      {activeTab === 'vendors' && (
        <div className="space-y-6 animate-fade-in print:hidden">
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
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-6 animate-fade-in print:hidden">
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
                        <td className="p-5 text-center font-bold">
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

      {/* ========== PURCHASE ORDERS SECTION ========== */}
      {activeTab === 'po' && viewPoMode === 'list' && (
        <div className="space-y-6 animate-fade-in print:hidden">
           <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium" placeholder="Search PO identity, Vendor, Brand or Model..." value={poSearch} onChange={e => setPoSearch(e.target.value)} />
              </div>
              
              <div className="bg-white border rounded-xl flex items-center px-4 gap-2">
                 <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Status:</span>
                 <select className="outline-none text-xs font-bold text-primary py-2 uppercase bg-transparent" value={poStatusFilter} onChange={e => setPoStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                 </select>
              </div>

              <button onClick={() => { resetPoForm(); setViewPoMode('create'); }} className="bg-[#3159a6] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-slate-800 transition">
                <PlusCircle size={18} /> Generate Purchase Order
              </button>
           </div>

           <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#1e293b] text-slate-300 font-black text-[10px] uppercase tracking-widest border-b">
                    <tr>
                      <th className="p-5">PO Number</th>
                      <th className="p-5">Order Date</th>
                      <th className="p-5">Vendor Name</th>
                      <th className="p-5">Items Summary</th>
                      <th className="p-5 text-right font-black">PO Total</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs font-bold uppercase">
                    {filteredPOList.length === 0 ? (
                      <tr><td colSpan={7} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No matching Purchase Orders registered</td></tr>
                    ) : filteredPOList.map(po => (
                      <tr key={po.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-5 font-black text-[#3159a6]">{po.id}</td>
                        <td className="p-5 text-gray-500">{new Date(po.date).toLocaleDateString('en-IN')}</td>
                        <td className="p-5 font-black text-gray-700">{po.vendorName}</td>
                        <td className="p-5">
                          <div className="flex flex-col gap-1 max-w-[200px] text-[10px]">
                            {po.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-slate-600 font-bold border-b border-gray-100/50 pb-0.5">
                                <span>{item.brand} {item.model}</span>
                                <span className="text-slate-400">({item.qty} units)</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-5 text-right font-black text-sm text-slate-800">₹{po.finalTotal.toLocaleString('en-IN')}</td>
                        <td className="p-5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border-2 inline-block ${
                            po.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                            po.status === 'Approved' ? 'bg-teal-50 text-teal-800 border-teal-100' :
                            po.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            po.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                           <div className="flex justify-center items-center gap-1.5">
                             <button onClick={() => { setSelectedPo(po); setViewPoMode('view'); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View & Manage PO"><Eye size={16} /></button>
                             
                             {po.status === 'Approved' && (
                               <button onClick={() => handleOpenInward(po)} className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition px-2.5 py-1 rounded-lg text-[9px] font-black uppercase" title="Receive / Stock Inward PO">
                                 Inward Stock
                               </button>
                             )}

                             {userRole === 'admin' && (
                               <button onClick={() => { if(window.confirm(`Permanently delete Purchase Order ${po.id}? This actions is irreversible.`)) onDeletePurchaseOrder(po.id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete PO"><Trash2 size={16} /></button>
                             )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {/* ========== GENERATE NEW PURCHASE ORDER PANEL ========== */}
      {activeTab === 'po' && viewPoMode === 'create' && (
        <div className="bg-white rounded-[2.5rem] border shadow-xl p-8 space-y-8 animate-fade-in print:hidden">
           <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">Generate Purchase Order</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Specify terms, select vendor & line items with taxation metrics</p>
              </div>
              <button onClick={() => setViewPoMode('list')} className="p-2 border rounded-full hover:bg-gray-50 transition"><X size={20}/></button>
           </div>

           {/* Vendor & Date selection Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Vendor Search Selection */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Users size={12}/> Search Vendor *</label>
                <input className="w-full border-2 border-slate-100 rounded-xl p-3 focus:ring-1 focus:ring-primary outline-none font-bold bg-slate-50/50 text-sm" placeholder="Type registered vendor..." value={poVendorInput} onChange={e => { setPoVendorInput(e.target.value); setShowPoVendorList(true); }} onFocus={() => setShowPoVendorList(true)} />
                {showPoVendorList && poVendorInput && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-2">
                    {vendors.filter(v => v.name.toLowerCase().includes(poVendorInput.toLowerCase())).map(v => (
                      <button key={v.id} onClick={() => { setPoVendor(v); setPoVendorInput(v.name); setShowPoVendorList(false); }} className="w-full text-left p-3 hover:bg-blue-50 rounded-lg text-xs font-bold uppercase transition">{v.name}</button>
                    ))}
                  </div>
                )}
                {poVendor ? (
                  <div className="text-[9px] font-black text-emerald-600 uppercase bg-green-50 px-3 py-1 rounded-full inline-block mt-2"><CheckCircle size={10} className="inline mr-1"/> Vendor Lock: {poVendor.name}</div>
                ) : (
                  <p className="text-[8px] text-orange-500 font-bold italic uppercase mt-1">Vendor linkage required to enable generation</p>
                )}
              </div>

              {/* Issuance Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Calendar size={12}/> Purchase Order Date *</label>
                <input type="date" className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none font-bold text-sm bg-slate-50/50" value={poDate} onChange={e => setPoDate(e.target.value)} />
              </div>

              {/* Target Delivery Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Calendar size={12}/> Expected Shipment Date</label>
                <input type="date" className="w-full border-2 border-slate-100 focus:border-red-400 rounded-xl p-3 outline-none font-bold text-sm bg-slate-50/50 text-red-500" value={poExpectedDate} onChange={e => setPoExpectedDate(e.target.value)} />
              </div>
           </div>

           {/* LINE ITEMS BLOCK */}
           <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5"><Tag size={12}/> Purchase Specifications (Required / Audited)</h4>
                 <button onClick={addPoItem} className="text-[9px] font-black uppercase bg-primary text-white border px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-800 transition shadow">
                   <PlusCircle size={14}/> Append Line Item
                 </button>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto border-2 border-dashed border-slate-100 rounded-3xl p-4">
                 {poItems.map((item, idx) => (
                   <div key={item.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-4 border-b last:border-b-0 last:pb-0 items-end">
                      
                      {/* Brand Select */}
                      <div className="md:col-span-2 space-y-1">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-0.5">Brand</label>
                         <select className="w-full border-2 border-slate-100 bg-slate-50/20 p-2.5 rounded-lg text-xs font-bold outline-none" value={item.brand} onChange={e => updatePoItem(idx, { brand: e.target.value })}>
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                         </select>
                      </div>

                      {/* Model Input */}
                      <div className="md:col-span-3 space-y-1">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-0.5">Model Name *</label>
                         <input className="w-full border-2 border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none" placeholder="Model Specification" value={item.model} onChange={e => updatePoItem(idx, { model: e.target.value })} />
                      </div>

                      {/* HSN Code */}
                      <div className="md:col-span-1.5 space-y-1">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-0.5">HSN Code</label>
                         <input className="w-full border-2 border-slate-100 p-2.5 rounded-lg text-xs font-mono font-bold outline-none" value={item.hsnCode} onChange={e => updatePoItem(idx, { hsnCode: e.target.value })} />
                      </div>

                      {/* Qty Input */}
                      <div className="md:col-span-1 space-y-1">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-0.5">Qty *</label>
                         <input type="number" min="1" className="w-full border-2 border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none text-center bg-blue-50/25" value={item.qty || ''} onChange={e => updatePoItem(idx, { qty: Number(e.target.value) })} />
                      </div>

                      {/* Rate Input */}
                      <div className="md:col-span-1.5 space-y-1">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-0.5">Unit Cost *</label>
                         <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                            <input type="number" min="0" className="w-full pl-5 border-2 border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none" value={item.rate || ''} onChange={e => updatePoItem(idx, { rate: Number(e.target.value) })} />
                         </div>
                      </div>

                      {/* Discount input */}
                      <div className="md:col-span-1 space-y-1">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-0.5">Disc. (₹)</label>
                         <input type="number" min="0" className="w-full border-2 border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none text-center text-red-500" value={item.discount || ''} onChange={e => updatePoItem(idx, { discount: Number(e.target.value) })} />
                      </div>

                      {/* GST Selection */}
                      <div className="md:col-span-1 space-y-1">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-0.5">GST Rate</label>
                         <select className="w-full border-2 border-slate-100 bg-transparent p-2.5 rounded-lg text-xs font-bold outline-none text-center" value={item.gstRate} onChange={e => updatePoItem(idx, { gstRate: Number(e.target.value) })}>
                            <option value="18">18%</option>
                            <option value="12">12%</option>
                            <option value="28">28%</option>
                            <option value="5">5%</option>
                            <option value="0">0%</option>
                         </select>
                      </div>

                      {/* Remove item button */}
                      <div className="md:col-span-1 flex justify-center pb-1">
                         <button onClick={() => removePoItem(idx)} disabled={poItems.length === 1} className="p-2 border text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30">
                           <Trash2 size={16} />
                         </button>
                      </div>

                   </div>
                 ))}
              </div>
           </div>

           {/* TOTALS AND NOTES BLOCK */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Notes & Global Discount */}
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Dispatch Remarks & Terms</label>
                    <textarea className="w-full border rounded-xl p-3 text-xs font-medium h-24 resize-none outline-none focus:ring-1 focus:ring-primary bg-slate-50/10" value={poNotes} onChange={e => setPoNotes(e.target.value)} placeholder="e.g., Deliver to batanagar warehouse. Standard warranty applies. Goods should arrive in bubble-wrap packaging..." />
                 </div>
                 <div className="space-y-1 p-4 bg-blue-50/40 rounded-2xl border border-dashed border-blue-200">
                    <label className="text-[10px] font-black uppercase text-[#3159a6] ml-1 flex items-center gap-1">
                       <Tag size={12}/> Global Discount (Flat Rate)
                    </label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                       <input 
                          type="number" 
                          min="0"
                          className="w-full pl-8 border-2 border-slate-100 rounded-xl p-2.5 focus:border-[#3159a6] outline-none font-bold text-slate-800 text-sm bg-white" 
                          placeholder="Enter flat discount amount..." 
                          value={globalDiscount || ''} 
                          onChange={e => setGlobalDiscount(Math.max(0, Number(e.target.value)))} 
                       />
                    </div>
                    <p className="text-[9px] text-[#3159a6] font-bold uppercase tracking-wider block mt-1">This amount will be deducted from the final order total.</p>
                 </div>
              </div>

              {/* Price Calculations Sheet */}
              <div className="bg-slate-50 rounded-3xl p-6 border space-y-4">
                 <h4 className="text-[10px] font-black text-[#3159a6] uppercase tracking-[0.15em] border-b pb-2">Financial Breakdown</h4>
                 
                 <div className="space-y-2 text-xs font-bold text-gray-500 uppercase">
                    <div className="flex justify-between">
                       <span>Total Item Value</span>
                       <span>₹{poCalculations.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                       <span>Combined Discount</span>
                       <span>- ₹{poCalculations.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {globalDiscount > 0 && (
                       <div className="flex justify-between text-rose-600 font-bold">
                          <span>Global Discount (Flat)</span>
                          <span>- ₹{globalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                       </div>
                    )}
                    <div className="flex justify-between text-slate-700 border-t pt-2 border-slate-200/50">
                       <span>Taxable Value</span>
                       <span>₹{poCalculations.totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>CGST (Central Tax)</span>
                       <span>₹{poCalculations.totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>SGST (State Tax)</span>
                       <span>₹{poCalculations.totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>

                 <div className="flex justify-between items-center border-t-2 border-slate-800 pt-3 text-slate-800">
                    <span className="font-black uppercase tracking-wider text-[11px]">Estimated Purchase Total</span>
                    <span className="font-black text-xl">₹{poCalculations.finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                 </div>
              </div>
           </div>

           {/* ACTIONS */}
           <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setViewPoMode('list')} className="px-6 py-3 border rounded-xl font-bold uppercase text-[10px] tracking-wider text-gray-500 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSavePurchaseOrderLocal} className="px-10 py-3 bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition shadow-xl">Commit Draft PO</button>
           </div>
        </div>
      )}

      {/* ========== PURCHASE ORDER DETAIL & PRESENTATION OVERLAY ========== */}
      {activeTab === 'po' && viewPoMode === 'view' && selectedPo && (
        <div className="space-y-6 animate-fade-in">
           {/* Top Navigation Bar: Hidden during native printing */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border p-4 rounded-3xl print:hidden">
              <button onClick={() => setViewPoMode('list')} className="flex items-center gap-2 text-slate-600 hover:text-primary transition font-bold uppercase text-[10px] tracking-wider px-3 py-1.5 border rounded-lg">
                <ArrowLeft size={16} /> Back to Register
              </button>

              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-gray-400 uppercase mr-1">Advance Status:</span>
                 {selectedPo.status === 'Draft' && (
                    <>
                      <button onClick={() => changePoStatus(selectedPo, 'Sent')} className="bg-blue-50 text-blue-700 hover:bg-[#3159a6] hover:text-white border border-blue-200 transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Mark Sent</button>
                      <button onClick={() => changePoStatus(selectedPo, 'Approved')} className="bg-teal-50 text-teal-800 hover:bg-teal-600 hover:text-white border border-teal-200 transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Approve PO</button>
                      <button onClick={() => changePoStatus(selectedPo, 'Cancelled')} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Cancel PO</button>
                    </>
                 )}
                 {selectedPo.status === 'Sent' && (
                    <>
                      <button onClick={() => changePoStatus(selectedPo, 'Approved')} className="bg-teal-50 text-teal-800 hover:bg-teal-600 hover:text-white border border-teal-200 transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Approve PO</button>
                      <button onClick={() => changePoStatus(selectedPo, 'Cancelled')} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Cancel PO</button>
                    </>
                 )}
                 {selectedPo.status === 'Approved' && (
                    <>
                      <button onClick={() => handleOpenInward(selectedPo)} className="bg-emerald-600 text-white hover:bg-emerald-700 transition px-4 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">Inward Received Stock</button>
                      <button onClick={() => changePoStatus(selectedPo, 'Cancelled')} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Cancel PO</button>
                    </>
                 )}
                 {(selectedPo.status === 'Delivered' || selectedPo.status === 'Cancelled') && (
                    <span className="text-[10px] font-black uppercase italic text-gray-400">Transaction Finalized ({selectedPo.status})</span>
                 )}

                 <div className="h-6 w-px bg-gray-200 mx-2"></div>

                 <button onClick={printDocument} className="bg-slate-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                   <Printer size={14} /> Send to Print
                 </button>
              </div>
           </div>

           {/* Workflow State Graphic Indicator: Hidden on print */}
           <div className="bg-white border rounded-[2rem] p-6 print:hidden">
              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 max-w-3xl mx-auto">
                 {[
                   { name: 'Draft', desc: 'Creation Block' },
                   { name: 'Sent', desc: 'Vendor Dispatched' },
                   { name: 'Approved', desc: 'Authorized' },
                   { name: 'Delivered', desc: 'Inward Pushed' }
                 ].map((st, idx) => {
                   const isPast = ['Draft', 'Sent', 'Approved', 'Delivered'].indexOf(selectedPo.status) >= idx;
                   const isCurrent = selectedPo.status === st.name;
                   
                   return (
                     <React.Fragment key={st.name}>
                       <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-black text-xs ${
                            isCurrent ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-blue-200' :
                            isPast ? 'bg-green-500 border-green-500 text-white' :
                            'bg-gray-50 border-gray-200 text-gray-400'
                          }`}>
                            {isPast && !isCurrent ? <Check size={14}/> : idx + 1}
                          </div>
                          <div className="text-left font-bold uppercase tracking-wider">
                             <p className={`text-[10px] font-black ${isPast ? 'text-slate-800' : 'text-gray-400'}`}>{st.name}</p>
                             <p className="text-[8px] text-gray-400">{st.desc}</p>
                          </div>
                       </div>
                       {idx < 3 && <div className={`hidden sm:block h-0.5 flex-1 ${isPast && selectedPo.status !== st.name ? 'bg-green-500' : 'bg-slate-200'}`}></div>}
                     </React.Fragment>
                   );
                 })}
              </div>
           </div>

           {/* ========== PROFESSIONAL PRINT OUT TEMPLATE LAYOUT ========== */}
           <div className="bg-white rounded-[2.5rem] border shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-12 max-w-4xl mx-auto space-y-8 print:p-0 print:border-0 print:shadow-none print:max-w-full">
              {/* Document Header Logo & Title */}
              <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
                 <div>
                   <img src={logo} alt="Company Logo" className="h-16 object-contain mb-4" />
                   <h1 className="font-black text-2xl tracking-tighter text-[#1e293b] uppercase">{COMPANY_NAME}</h1>
                   <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest max-w-md mt-0.5 leading-relaxed">{COMPANY_TAGLINE}</p>
                   <p className="text-[9px] font-medium text-gray-400 max-w-md uppercase tracking-wider mt-1">{COMPANY_ADDRESS}</p>
                 </div>
                 
                 <div className="text-right uppercase space-y-1">
                   <div className="bg-slate-950 p-2.5 px-6 rounded-2xl block text-white inline-block mb-3">
                      <span className="font-black text-xs tracking-widest">PURCHASE ORDER</span>
                   </div>
                   <p className="text-[10px] font-black text-gray-400">PO DOCUMENT #</p>
                   <p className="text-sm font-black text-[#3159a6]">{selectedPo.id}</p>
                   <p className="text-[9px] font-bold text-gray-500 mt-2">DATED: {new Date(selectedPo.date).toLocaleDateString('en-IN')}</p>
                   <p className="text-[9px] font-bold text-red-600">SHIPMENT TARGET: {selectedPo.expectedDeliveryDate ? new Date(selectedPo.expectedDeliveryDate).toLocaleDateString('en-IN') : 'IMMEDIATE'}</p>
                 </div>
              </div>

              {/* Vendor & Clinic Meta Details */}
              <div className="grid grid-cols-2 gap-8 border-b pb-6 border-slate-100">
                 {/* To / Supplier info */}
                 <div className="space-y-1.5 text-[10px] uppercase font-bold text-gray-500">
                    <span className="text-[9px] font-black text-primary tracking-widest block mb-1">To Supplier (Vendor):</span>
                    <p className="text-slate-900 font-black text-sm">{selectedPo.vendorName}</p>
                    <p className="text-gray-500 font-medium normal-case">"{selectedPo.vendorDetails?.address}"</p>
                    {selectedPo.vendorDetails?.gstin && (
                      <p className="text-slate-800 font-black">GSTIN ID: <span className="text-[#3159a6]">{selectedPo.vendorDetails.gstin}</span></p>
                    )}
                 </div>

                 {/* Deliver to / Purchaser info */}
                 <div className="space-y-1.5 text-[10px] uppercase font-bold text-gray-500 text-right">
                    <span className="text-[9px] font-black text-primary tracking-widest block mb-1">Ship to / Deliver to:</span>
                    <p className="text-slate-900 font-black text-sm">{COMPANY_NAME}</p>
                    <p className="text-gray-500 font-medium normal-case">{COMPANY_ADDRESS}</p>
                    <p className="text-slate-800 font-black">PURCHASER GSTIN: <span className="text-[#3159a6]">{CLINIC_GSTIN}</span></p>
                    <p className="text-slate-700">CONTACT INFO: {COMPANY_PHONES}</p>
                 </div>
              </div>

              {/* Items Grid Table */}
              <div className="space-y-2">
                 <table className="w-full text-left uppercase text-[10px]">
                    <thead className="border-b-2 border-slate-900 font-black text-slate-800 tracking-wider">
                       <tr>
                         <th className="py-2.5">#</th>
                         <th className="py-2.5">Item Specifications</th>
                         <th className="py-2.5">HSN Code</th>
                         <th className="py-2.5 text-center">Qty</th>
                         <th className="py-2.5 text-right">Unit Rate</th>
                         <th className="py-2.5 text-right">Disc. (₹)</th>
                         <th className="py-2.5 text-center">GST</th>
                         <th className="py-2.5 text-right">Final Amount</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y font-bold text-gray-600">
                       {selectedPo.items.map((it, idx) => (
                         <tr key={it.id || idx}>
                           <td className="py-3 text-slate-400">{idx + 1}</td>
                           <td className="py-3">
                              <p className="font-black text-slate-800 text-xs">{it.brand} {it.model}</p>
                           </td>
                           <td className="py-3 font-mono font-bold text-gray-500">{it.hsnCode || '90214090'}</td>
                           <td className="py-3 text-center text-slate-800 font-black text-sm">{it.qty}</td>
                           <td className="py-3 text-right">₹{it.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                           <td className="py-3 text-right text-red-500">-₹{it.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                           <td className="py-3 text-center">{it.gstRate}%</td>
                           <td className="py-3 text-right font-black text-slate-800 text-xs">₹{it.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* Totals sheet and dispatch note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-800 pt-6">
                 {/* Dispatched Terms Comments */}
                 <div className="space-y-4">
                    {selectedPo.notes && (
                      <div className="p-4 bg-slate-50 border rounded-2xl">
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Supplier Dispatch Instructions & Terms:</span>
                         <p className="text-[10px] text-slate-600 font-medium normal-case whitespace-pre-wrap leading-relaxed">"{selectedPo.notes}"</p>
                      </div>
                    )}
                    
                    <div className="text-[9px] uppercase font-bold text-gray-400 leading-relaxed max-w-sm">
                       <span className="text-slate-600 font-black tracking-wider block mb-1">Standard PO Clause:</span>
                       Please reference our Purchase Order ID on corresponding dispatch challan, shipment parcel and invoice records. All deliveries are subject to auditory testing and verification.
                    </div>
                 </div>

                 {/* Calculations sheet layout */}
                 <div className="space-y-2 text-[10px] uppercase font-bold text-gray-500">
                    <div className="flex justify-between">
                       <span>PO Total Items Value</span>
                       <span className="text-slate-800">₹{selectedPo.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                       <span>Combined PO Discount</span>
                       <span>- ₹{selectedPo.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {selectedPo.globalDiscount !== undefined && selectedPo.globalDiscount > 0 && (
                       <div className="flex justify-between text-rose-600 font-bold">
                          <span>Global Discount (Flat)</span>
                          <span>- ₹{selectedPo.globalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                       </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200/50 pt-1.5 text-slate-700">
                       <span>Taxable Value Weight (A)</span>
                       <span>₹{selectedPo.totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                       <span>CGST Central Tax (B/2)</span>
                       <span>₹{selectedPo.totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                       <span>SGST State Tax (B/2)</span>
                       <span>₹{selectedPo.totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 text-slate-950">
                       <span className="font-black tracking-wider">Grand Purchase Total (A + B)</span>
                       <span className="font-black text-base">₹{selectedPo.finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="pt-2">
                       <p className="text-[8px] text-gray-400 text-right font-black italic">Amount in words: {inWords(Math.floor(selectedPo.finalTotal))}</p>
                    </div>
                 </div>
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-2 gap-8 pt-12 text-center uppercase text-[9px] font-black border-t">
                 <div>
                   <p className="text-gray-400 mb-12">Authorized Signatory / Preparer</p>
                   <div className="h-10 w-px bg-transparent"></div> {/* Spacer */}
                   <p className="border-t border-slate-200 pt-2 text-slate-700 max-w-xs mx-auto">Purchase Department</p>
                 </div>
                 
                 <div className="text-center flex flex-col items-center">
                   <p className="text-gray-400 mb-6">Confirmed & Accepted By Supplier</p>
                   {signature ? (
                     <div className="h-12 w-24 object-contain mb-2"><img src={signature} alt="Signature stamp" className="h-full w-full object-contain mix-blend-multiply" /></div>
                   ) : (
                     <div className="h-10 w-px bg-transparent"></div>
                   )}
                   <p className="border-t border-slate-200 pt-2 text-slate-700 w-full max-w-xs text-center">Authorized Seal & Signature</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ========== PURCHASE RECORD ENTRY CREATE MODAL ========== */}
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
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold bg-blue-50/30 text-sm" placeholder="Type vendor name..." value={vendorInput} onChange={e => { setVendorInput(e.target.value); setShowVendorList(true); }} onFocus={() => setShowVendorList(true)} />
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
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-black uppercase text-sm" value={purchaseForm.invoiceNo} onChange={e => setPurchaseForm({...purchaseForm, invoiceNo: e.target.value})} placeholder="INV/2024/..." />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Calendar size={12}/> Invoice Date *</label>
                    <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold text-sm" value={purchaseForm.invoiceDate} onChange={e => setPurchaseForm({...purchaseForm, invoiceDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1"><Calendar size={12}/> Payment Due Date</label>
                    <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold text-red-500 text-sm" value={purchaseForm.dueDate} onChange={e => setPurchaseForm({...purchaseForm, dueDate: e.target.value})} />
                  </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 space-y-5 text-xs">
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

               <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50">
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Item MRP *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                      <input type="number" className="w-full pl-8 border-2 border-white bg-white p-2.5 rounded-xl font-black text-primary outline-none focus:border-primary text-sm" value={purchaseForm.mrp || ''} onChange={e => setPurchaseForm({...purchaseForm, mrp: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50">
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Discount Amount</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={14}/>
                      <input type="number" className="w-full pl-8 border-2 border-white bg-white p-2.5 rounded-xl font-black text-red-500 outline-none focus:border-primary text-sm" value={purchaseForm.discountAmount || ''} onChange={e => setPurchaseForm({...purchaseForm, discountAmount: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/10">
                    <label className="block text-[10px] font-black text-primary mb-2 uppercase tracking-widest ml-1">Final Purchase Cost *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14}/>
                      <input type="number" className="w-full pl-8 border-2 border-white bg-white p-2.5 rounded-xl font-black text-gray-800 outline-none focus:border-primary shadow-sm text-sm" value={purchaseForm.purchaseAmount || ''} onChange={e => setPurchaseForm({...purchaseForm, purchaseAmount: Number(e.target.value)})} />
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

      {/* ========== INDEPENDENT VENDOR ADD modal ========== */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[100] p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border-4 border-white my-auto">
            <div className="bg-primary p-6 text-white flex justify-between items-center text-xs font-black">
              <h3 className="font-black uppercase tracking-widest text-xs ml-2">Vendor On-boarding</h3>
              <button onClick={() => setShowVendorModal(false)}><X size={24}/></button>
            </div>
            <div className="p-8 space-y-5 text-sm font-bold uppercase">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Vendor Full Name *</label>
                <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold text-sm bg-slate-50/10" value={vendorForm.name || ''} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} placeholder="e.g. Sona Medical Pvt Ltd" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">GST Number</label>
                <input className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-bold uppercase text-sm bg-slate-50/10" value={vendorForm.gstin || ''} onChange={e => setVendorForm({...vendorForm, gstin: e.target.value})} placeholder="19ABCDE..." />
              </div>
              <div className="space-y-1.5 font-bold">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Head Office Address *</label>
                <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-primary outline-none font-semibold text-xs h-24 resize-none bg-slate-50/10 normal-case" value={vendorForm.address || ''} onChange={e => setVendorForm({...vendorForm, address: e.target.value})} placeholder="Enter full postal address..." />
              </div>
              <button onClick={handleSaveVendor} className="w-full bg-[#3159a6] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition active:scale-95 text-xs">Verify & Save Vendor</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== AUTOMATED INWARD RECEIVED STOCK MODAL ========== */}
      {showInwardModal && inwardPo && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[110] p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border-4 border-white my-auto flex flex-col max-h-[90vh]">
            <div className="bg-[#1e293b] p-6 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-xs ml-2">Receive PO Stock Delivery</h3>
              <button onClick={() => setShowInwardModal(false)}><X size={24}/></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow text-xs">
               <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-start gap-3">
                 <Info className="text-emerald-600 mt-0.5 flex-shrink-0" size={16} />
                 <p className="text-emerald-800 font-bold uppercase tracking-wider text-[10px] leading-relaxed">
                   Enter the unique Serial Numbers for each item to push directly into active Stock. Once saved, standard Purchase Records will be initialized for Auditing and stock status will be marked as "Available" at the specified locations.
                 </p>
               </div>

               <div className="space-y-5">
                 {inwardPo.items.map((item, idx) => (
                   <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-700">
                         <span>{idx + 1}. {item.brand} {item.model}</span>
                         <span className="text-primary bg-blue-50 px-2 py-0.5 rounded">Qty Ordered: {item.qty} units</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="block text-[8px] font-black text-gray-400 uppercase">Target warehouse Location</label>
                            <select 
                              className="w-full border p-2.5 rounded-lg outline-none bg-white font-bold text-xs"
                              value={inwardLocations[item.id] || LOCATIONS[0]}
                              onChange={e => setInwardLocations({ ...inwardLocations, [item.id]: e.target.value })}
                            >
                              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                         </div>

                         <div className="space-y-1.5">
                            <label className="block text-[8px] font-black text-gray-400 uppercase">
                              Serial Numbers (One per line, total {item.qty})
                            </label>
                            <textarea 
                              className="w-full border p-3 rounded-lg outline-none bg-white font-mono font-bold text-xs h-24 uppercase text-teal-600 custom-scrollbar" 
                              placeholder="e.g. SN123456&#10;SN789012"
                              value={inwardSerials[item.id] || ''}
                              onChange={e => setInwardSerials({ ...inwardSerials, [item.id]: e.target.value })}
                            />
                            <p className="text-[8px] text-slate-400 font-bold uppercase italic text-right">
                              Units Parsed: {(inwardSerials[item.id] || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0).length} / {item.qty}
                            </p>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="p-8 pt-0 flex-shrink-0">
               <button onClick={handleSaveInwardToStock} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4.5 rounded-[2.5rem] font-black uppercase tracking-[0.25em] shadow-2xl transition active:scale-95 text-[10px] flex items-center justify-center gap-2">
                 <CheckSquare size={16} /> Complete Stock Inward & Deliver PO
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
