

import React, { useState } from 'react';
// FIX: Moved UserRole from lucide-react import to here, as it's a type.
import { HearingAid, Patient, Quotation, InvoiceItem, UserRole } from '../types';
import { generateInvoiceNote } from '../services/geminiService';
// FIX: Import Trash2 icon and removed UserRole which is not an icon.
import { FileText, Printer, Save, Loader2, Sparkles, Download, Plus, ArrowLeft, Edit, Search, ShieldCheck, CheckCircle, FileQuestion, Trash2 } from 'lucide-react';

interface QuotationsProps {
  inventory: HearingAid[];
  quotations: Quotation[];
  patients: Patient[];
  onCreateQuotation: (quotation: Quotation) => void;
  onUpdateQuotation: (quotation: Quotation) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
  // FIX: Add onDelete prop
  onDelete: (quotationId: string) => void;
  logo: string;
  signature: string | null;
  // FIX: Add userRole prop
  userRole: UserRole;
}

// FIX: Add onDelete and userRole to component props
export const Quotations: React.FC<QuotationsProps> = ({ inventory, quotations, patients, onCreateQuotation, onUpdateQuotation, onConvertToInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'review'>('patient');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Patient Search State
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);

  // Patient State
  const [patient, setPatient] = useState<Patient>({
    id: '',
    name: '',
    address: '',
    phone: '',
    referDoctor: '',
    audiologist: ''
  });

  // Product Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  
  // AI State
  const [aiNote, setAiNote] = useState<string>('');
  const [generatingNote, setGeneratingNote] = useState(false);

  // Helper to reset form
  const resetForm = () => {
    setStep('patient');
    setPatient({ id: '', name: '', address: '', phone: '', referDoctor: '', audiologist: '' });
    setSelectedItemIds([]);
    setDiscountValue(0);
    setWarranty('2 Years Standard Warranty');
    setAiNote('');
    setEditingId(null);
    setPatientSearchTerm('');
  };

  // Helper to generate next Quotation ID
  const generateNextId = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `QTN-${currentYear}-`;
    const yearIds = quotations.filter(q => q.id.startsWith(prefix)).map(q => q.id);
    
    if (yearIds.length === 0) return `${prefix}001`;

    const maxSeq = yearIds.reduce((max, id) => {
        const parts = id.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        return !isNaN(seq) && seq > max ? seq : max;
    }, 0);

    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const handleStartNew = () => {
    resetForm();
    setViewMode('create');
  };

  const handleViewEdit = (quotation: Quotation) => {
    setEditingId(quotation.id);
    
    if (quotation.patientDetails) {
        setPatient(quotation.patientDetails);
    } else {
        setPatient({
            id: quotation.patientId,
            name: quotation.patientName,
            address: '', 
            phone: '',
            referDoctor: '',
            audiologist: ''
        });
    }
    
    setSelectedItemIds(quotation.items.map(i => i.hearingAidId));
    setDiscountType(quotation.discountType);
    setDiscountValue(quotation.discountValue);
    setWarranty(quotation.warranty || '2 Years Standard Warranty');
    setAiNote(quotation.notes || '');
    
    setViewMode('edit');
    setStep('review');
  };

  const handleSelectPatient = (p: Patient) => {
    setPatient(p);
    setPatientSearchTerm('');
    setShowPatientResults(false);
  };

  // Note: In Quotations, we allow selecting "Available" items. 
  // We do NOT show Sold items, even if they were sold later, for new quotes.
  // But for editing an old quote, the item might be sold now.
  const availableInventory = inventory.filter(i => i.status === 'Available' || (editingId && selectedItemIds.includes(i.id)));
  
  const selectedItems = inventory.filter(i => selectedItemIds.includes(i.id));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  
  const discountAmount = discountType === 'flat' 
    ? discountValue 
    : (subtotal * discountValue) / 100;
    
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.phone.includes(patientSearchTerm)
  );

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!patient.name || !patient.phone) {
        alert("Patient name and phone are required");
        return;
    }
    setStep('product');
  };

  const toggleItemSelection = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(sid => sid !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleSaveQuotation = async () => {
    const finalId = editingId || generateNextId();

    // Calculate taxes and item details
    let runningTaxableTotal = 0;
    let runningTax = 0;
    
    // Calculate Discount (Applied on Base Price)
    const currentDiscountAmount = discountType === 'flat' 
        ? discountValue 
        : (subtotal * discountValue) / 100;

    const detailedItems: InvoiceItem[] = selectedItems.map(item => {
        const itemRatio = subtotal > 0 ? item.price / subtotal : 0;
        const itemDiscount = currentDiscountAmount * itemRatio;
        const itemTaxable = item.price - itemDiscount;
        const gstRate = item.gstRate || 0;
        const taxAmount = itemTaxable * (gstRate / 100);
        
        // Assume Intra-State for Quotation estimates unless specified (Quotations usually simpler)
        // or we could add a state for Place of Supply in Quotations too.
        // For now, we treat as Intra-State for calculation display.
        const cgst = taxAmount / 2;
        const sgst = taxAmount / 2;
        const igst = 0;

        runningTaxableTotal += itemTaxable;
        runningTax += taxAmount;

        return {
            hearingAidId: item.id,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
            price: item.price,
            hsnCode: item.hsnCode,
            gstRate: gstRate,
            taxableValue: itemTaxable,
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalAmount: itemTaxable + taxAmount
        };
    });
    
    // Recalculate final total from items to be precise with tax addition
    const calculatedFinalTotal = detailedItems.reduce((sum, item) => sum + item.totalAmount, 0);

    const quotationData: Quotation = {
      id: finalId,
      patientId: patient.id || `P-${Date.now()}`,
      patientName: patient.name,
      items: detailedItems,
      subtotal,
      discountType,
      discountValue,
      totalTaxableValue: runningTaxableTotal,
      totalTax: runningTax,
      finalTotal: calculatedFinalTotal,
      date: new Date().toISOString().split('T')[0],
      notes: aiNote,
      warranty,
      patientDetails: patient,
      status: 'Draft'
    };

    if (editingId && onUpdateQuotation) {
        onUpdateQuotation(quotationData);
    } else {
        onCreateQuotation(quotationData);
    }
    
    resetForm();
    setViewMode('list');
  };

  const handleConvertClick = (quotation: Quotation) => {
    if (window.confirm(`Convert Quotation ${quotation.id} to a Sales Invoice? This will deduct items from inventory.`)) {
        onConvertToInvoice(quotation);
        setViewMode('list');
    }
  };

  const generateAiNote = async () => {
    setGeneratingNote(true);
    // Reuse existing service with a dummy invoice object
    const mockData: any = {
        patientName: patient.name,
        items: selectedItems.map(item => ({...item, hearingAidId: item.id})),
        finalTotal,
        warranty
    };
    
    const note = await generateInvoiceNote(mockData, patient.referDoctor, patient.audiologist);
    setAiNote(note);
    setGeneratingNote(false);
  }

  const handlePrint = () => {
    window.print();
  };

  const filteredQuotations = quotations.filter(q => 
    q.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // RENDER LIST
  if (viewMode === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileQuestion className="h-6 w-6 text-primary" />
                Quotations & Estimates
                </h2>
                <button
                    onClick={handleStartNew}
                    className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"
                >
                    <Plus size={20} />
                    Create Quotation
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                 <Search className="text-gray-400" size={20} />
                 <input 
                    type="text" 
                    placeholder="Search quotations by ID or Patient Name..." 
                    className="flex-1 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="p-4">Quotation ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Patient</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredQuotations.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No quotations found.</td></tr>
                        ) : filteredQuotations.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 font-mono text-sm text-teal-700 font-medium">{q.id}</td>
                                <td className="p-4 text-gray-600 text-sm">{q.date}</td>
                                <td className="p-4 font-medium">{q.patientName}</td>
                                <td className="p-4 font-bold text-gray-800">₹{q.finalTotal.toLocaleString('en-IN')}</td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        q.status === 'Converted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {q.status}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button 
                                        onClick={() => handleViewEdit(q)}
                                        className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 px-2 py-1 rounded transition text-sm flex items-center gap-1"
                                    >
                                        <Edit size={16} /> Open
                                    </button>
                                    {q.status !== 'Converted' && (
                                        <button 
                                            onClick={() => handleConvertClick(q)}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition text-sm flex items-center gap-1"
                                            title="Convert to Final Invoice"
                                        >
                                            <CheckCircle size={16} /> Bill
                                        </button>
                                    )}
                                    {/* FIX: Add delete button for admins */}
                                    {userRole === 'admin' && (
                                        <button
                                            onClick={() => {
                                                if(window.confirm(`Are you sure you want to delete quotation ${q.id}?`)) {
                                                    onDelete(q.id);
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition text-sm flex items-center gap-1"
                                            title="Delete Quotation"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      );
  }

  // RENDER WIZARD
  return (
    <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileQuestion className="text-primary" />
                    {viewMode === 'edit' ? 'Edit Quotation' : 'New Quotation'}
                </h2>
            </div>
            <div className="flex space-x-2">
                <button 
                    onClick={() => setStep('patient')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${step === 'patient' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    1. Patient
                </button>
                <button 
                    onClick={() => setStep('product')}
                    disabled={!patient.name}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${step === 'product' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} ${!patient.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    2. Device
                </button>
                <button 
                    onClick={() => setStep('review')}
                    disabled={selectedItems.length === 0}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${step === 'review' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} ${selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    3. Preview
                </button>
            </div>
        </div>

        {step === 'patient' && (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 animate-fade-in print:hidden">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Patient Information</h3>
                
                <div className="mb-6 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Existing Patient</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Start typing name or phone..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={patientSearchTerm}
                            onChange={(e) => {
                                setPatientSearchTerm(e.target.value);
                                setShowPatientResults(true);
                            }}
                        />
                    </div>
                    {showPatientResults && patientSearchTerm && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                            {filteredPatients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectPatient(p)}
                                    className="w-full text-left px-4 py-3 hover:bg-teal-50 border-b border-gray-50 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.phone}</p>
                                    </div>
                                    <span className="text-teal-600 text-xs bg-teal-100 px-2 py-1 rounded-full">Select</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <form onSubmit={handlePatientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                        <input required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral Doctor</label>
                        <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={patient.referDoctor} onChange={e => setPatient({...patient, referDoctor: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Audiologist</label>
                        <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={patient.audiologist} onChange={e => setPatient({...patient, audiologist: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-4">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition">Next &rarr;</button>
                    </div>
                </form>
            </div>
        )}

        {step === 'product' && (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 print:hidden">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Select Hearing Aid(s) for Quote</h3>
                
                <div className="mb-6 max-h-80 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3">Select</th>
                                <th className="p-3">Brand & Model</th>
                                <th className="p-3">Serial No</th>
                                <th className="p-3">Price (INR)</th>
                                <th className="p-3">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {availableInventory.map(item => (
                                <tr key={item.id} className={selectedItemIds.includes(item.id) ? "bg-teal-50" : "hover:bg-gray-50"}>
                                    <td className="p-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItemIds.includes(item.id)} 
                                            onChange={() => toggleItemSelection(item.id)}
                                            className="h-4 w-4 text-teal-600"
                                        />
                                    </td>
                                    <td className="p-3 font-medium">{item.brand} {item.model}</td>
                                    <td className="p-3 font-mono text-sm">{item.serialNumber}</td>
                                    <td className="p-3">₹{item.price.toLocaleString('en-IN')}</td>
                                    <td className="p-3 text-sm text-gray-500">{item.location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-medium mb-3 flex items-center gap-2"><Sparkles size={16}/> Proposed Discount</h4>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input type="radio" id="flat" name="dtype" checked={discountType === 'flat'} onChange={() => setDiscountType('flat')} />
                                <label htmlFor="flat">Flat (₹)</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" id="percent" name="dtype" checked={discountType === 'percent'} onChange={() => setDiscountType('percent')} />
                                <label htmlFor="percent">Percentage (%)</label>
                            </div>
                            <input 
                                type="number" 
                                value={discountValue} 
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                className="border rounded p-2 w-32"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-medium mb-3 flex items-center gap-2"><ShieldCheck size={16}/> Proposed Warranty</h4>
                        <input 
                            type="text" 
                            value={warranty} 
                            onChange={(e) => setWarranty(e.target.value)}
                            className="border rounded p-2 w-full"
                            placeholder="e.g., 2 Years Standard Warranty"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                     <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">Total Quote: ₹{finalTotal.toLocaleString('en-IN')}</p>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={() => setStep('patient')} className="text-gray-600 hover:underline">Back</button>
                        <button onClick={() => setStep('review')} disabled={selectedItems.length === 0} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition">Next: Review &rarr;</button>
                     </div>
                </div>
            </div>
        )}

        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                 <div className="p-6 bg-gray-50 border-b flex justify-between items-center print:hidden">
                    <h3 className="text-xl font-bold text-gray-800">Quotation Preview</h3>
                    <button onClick={handlePrint} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white border px-3 py-1 rounded shadow-sm hover:shadow">
                        <Printer size={18}/> Print
                    </button>
                 </div>

                 <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                         <div className="flex gap-4">
                            <div className="flex-shrink-0 h-24 w-24 flex items-center justify-center overflow-hidden">
                                   <img 
                                     src={logo} 
                                     alt="Bengal Speech Logo" 
                                     className="h-full w-full object-contain"
                                   />
                            </div>
                            <div className="pt-1">
                                <h1 className="text-2xl font-bold text-gray-700 uppercase leading-tight">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1>
                                <div className="w-full h-px bg-blue-400 my-1.5"></div>
                                <p className="text-gray-500 text-xs font-semibold italic">Bengal's Largest Hospital Based Hearing and Speech Chain</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-700 text-lg">PROFORMA INVOICE / QUOTATION</p>
                            <p className="text-gray-500 text-sm mb-2">#{editingId || generateNextId()}</p>
                            <p className="font-bold text-gray-700">DATE</p>
                            <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-t pt-6 mt-6">
                        <div>
                            <h4 className="font-bold text-gray-700 text-sm uppercase mb-2">Quotation For:</h4>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-gray-600">{patient.address}</p>
                            <p className="text-gray-600">{patient.phone}</p>
                        </div>
                        <div>
                             <h4 className="font-bold text-gray-700 text-sm uppercase mb-2">Medical Details:</h4>
                             <p><span className="text-gray-500">Referred By:</span> {patient.referDoctor}</p>
                             <p><span className="text-gray-500">Audiologist:</span> {patient.audiologist}</p>
                        </div>
                    </div>

                    <table className="w-full mt-4">
                        <thead>
                            <tr className="bg-gray-100 text-left text-sm uppercase text-gray-600">
                                <th className="p-3">Description</th>
                                <th className="p-3">Serial No</th>
                                <th className="p-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {selectedItems.map(item => (
                                <tr key={item.id}>
                                    <td className="p-3 font-medium">{item.brand} {item.model}</td>
                                    <td className="p-3 text-gray-500 font-mono">{item.serialNumber}</td>
                                    <td className="p-3 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end border-t pt-4">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between text-red-500"><span>Discount</span><span>-₹{discountAmount.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between font-bold text-xl text-gray-900 border-t pt-2"><span>Total Quote</span><span>₹{finalTotal.toLocaleString('en-IN')}</span></div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4 print:bg-transparent print:border-none print:p-0">
                        <div className="flex justify-between items-center mb-2 print:hidden">
                            <h4 className="text-blue-800 font-medium flex items-center gap-2"><Sparkles size={16} /> Notes (AI Powered)</h4>
                            <button onClick={generateAiNote} disabled={generatingNote} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">{generatingNote ? 'Thinking...' : 'Generate Note'}</button>
                        </div>
                        <textarea className="w-full bg-white border border-blue-200 rounded p-2 text-sm text-gray-700 print:hidden" rows={3} value={aiNote} onChange={(e) => setAiNote(e.target.value)} placeholder="Add remarks..." />
                        <div className="hidden print:block text-sm text-gray-700 mt-4 border-t pt-4">
                            <h4 className="font-bold uppercase text-xs text-gray-500 mb-1">Remarks:</h4>
                            <p>{aiNote}</p>
                        </div>
                    </div>

                    {/* Signature Section for Quotation */}
                    <div className="mt-12 pt-4 border-t border-gray-200 flex justify-end text-xs text-gray-500">
                        <div className="text-center">
                            {signature ? (
                                <div className="h-16 mb-2 flex items-end justify-center">
                                    <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                                </div>
                            ) : (
                                <div className="h-16 w-40 border-b border-gray-300 mb-2"></div>
                            )}
                            <p className="font-bold uppercase">Authorized Signatory</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 print:hidden">
                        <button onClick={() => setStep('product')} className="flex-1 py-3 border rounded-lg text-gray-600 font-medium">Edit</button>
                        <button onClick={handleSaveQuotation} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg font-medium flex justify-center items-center gap-2">
                            <Save size={20} /> Save Quotation
                        </button>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};
