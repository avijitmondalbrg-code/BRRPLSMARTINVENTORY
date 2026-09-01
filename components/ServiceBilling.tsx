
import React, { useState, useMemo, useEffect } from 'react';
import { Hospital, ServiceInvoice, ServiceInvoiceLine, UserRole } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, getFinancialYear, CLINIC_GSTIN } from '../constants';
import { Plus, Search, Trash2, Printer, Save, ArrowLeft, Landmark, Building2, Calendar, FileText, Download, X, PlusCircle, CheckCircle2, IndianRupee, Percent, Edit, RotateCcw, Filter, FileSpreadsheet, Activity } from 'lucide-react';

interface ServiceBillingProps {
  hospitals: Hospital[];
  invoices: ServiceInvoice[];
  onAddHospital: (h: Hospital) => void;
  onUpdateHospital: (h: Hospital) => void;
  onSaveInvoice: (inv: ServiceInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
  backHandlerRef?: React.MutableRefObject<(() => boolean) | null>;
}

const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n: number): string => {
        if ((n = n.toString() as any).length > 9) return 'overflow';
        const n_array: any[] = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/) || [];
        if (!n_array) return '';
        let str = '';
        str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
        str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
        str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
        str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
        str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
        return str;
    };
    return inWords(Math.floor(num)) + 'Rupees Only';
};

export const ServiceBilling: React.FC<ServiceBillingProps> = ({ hospitals, invoices, onAddHospital, onUpdateHospital, onSaveInvoice, onDeleteInvoice, logo, signature, userRole, backHandlerRef }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'review'>('list');

  useEffect(() => {
    if (!backHandlerRef) return;
    const handler = () => {
      if (viewMode !== 'list') {
        setViewMode('list');
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
  }, [viewMode, backHandlerRef]);

  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_month' | 'last_month' | 'this_fy' | 'custom'>('all');
  
  // Create Form State
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [showHospResults, setShowHospResults] = useState(false);
  
  const [invoiceLines, setInvoiceLines] = useState<ServiceInvoiceLine[]>([]);
  const [tempLine, setTempLine] = useState<Partial<ServiceInvoiceLine>>({ description: '', hsn: '9987', qty: 1, rate: 0, discount: 0, gstRate: 18 });
  const [isInterState, setIsInterState] = useState<boolean>(false);
  
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [globalAdjustment, setGlobalAdjustment] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedBank, setSelectedBank] = useState(COMPANY_BANK_ACCOUNTS[0].name);

  // Modal for adding new hospital
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [editingHospitalId, setEditingHospitalId] = useState<string | null>(null);
  const [newHospital, setNewHospital] = useState<Partial<Hospital>>({ name: '', address: '', gstin: '', pan: '' });

  const resetForm = () => {
    setSelectedHospital(null);
    setHospitalSearch('');
    setInvoiceLines([]);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setGlobalAdjustment(0);
    setNotes('');
    setIsInterState(false);
    setTempLine({ description: '', hsn: '9987', qty: 1, rate: 0, discount: 0, gstRate: 18 });
    setEditingInvoiceId(null);
  };

  const generateInvoiceId = () => {
    const fy = getFinancialYear();
    const prefix = `BR-SR-${fy}-`;
    const fyInvs = invoices.filter(i => i.id.startsWith(prefix));
    const nextSeq = fyInvs.length === 0 ? 1 : Math.max(...fyInvs.map(i => parseInt(i.id.split('-').pop() || '0'))) + 1;
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  };

  const handleAddLine = () => {
    if(!tempLine.description || !tempLine.rate) return;
    const qty = tempLine.qty || 1;
    const rate = tempLine.rate || 0;
    const discount = tempLine.discount || 0;
    const taxableAmount = Math.max(0, (qty * rate) - discount);
    const gstRate = tempLine.gstRate !== undefined ? Number(tempLine.gstRate) : 18;
    const taxAmount = (taxableAmount * gstRate) / 100;
    const cgstAmount = isInterState ? 0 : taxAmount / 2;
    const sgstAmount = isInterState ? 0 : taxAmount / 2;
    const igstAmount = isInterState ? taxAmount : 0;
    const amount = taxableAmount + taxAmount;
    
    const newLine: ServiceInvoiceLine = {
      id: Date.now().toString(),
      description: tempLine.description || '',
      hsn: tempLine.hsn || '9987',
      qty,
      rate,
      discount,
      taxableAmount,
      gstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount,
      amount
    };
    setInvoiceLines([...invoiceLines, newLine]);
    setTempLine({ description: '', hsn: '9987', qty: 1, rate: 0, discount: 0, gstRate });
  };

  const applyGstRateToAllLines = (rate: number) => {
    setInvoiceLines(prev => prev.map(line => {
      const taxable = line.taxableAmount !== undefined ? line.taxableAmount : Math.max(0, (line.qty * line.rate) - (line.discount || 0));
      const taxAmount = (taxable * rate) / 100;
      return {
        ...line,
        gstRate: rate,
        taxableAmount: taxable,
        taxAmount,
        cgstAmount: isInterState ? 0 : taxAmount / 2,
        sgstAmount: isInterState ? 0 : taxAmount / 2,
        igstAmount: isInterState ? taxAmount : 0,
        amount: taxable + taxAmount
      };
    }));
  };

  const handleAddHospitalSubmit = () => {
    if(!newHospital.name || !newHospital.address) return;
    
    if (editingHospitalId) {
      const h: Hospital = {
        id: editingHospitalId,
        name: newHospital.name,
        address: newHospital.address,
        gstin: newHospital.gstin || '',
        pan: newHospital.pan || ''
      };
      onUpdateHospital(h);
      if (selectedHospital?.id === editingHospitalId) {
        setSelectedHospital(h);
        setHospitalSearch(h.name);
      }
    } else {
      const h: Hospital = {
        id: `HOSP-${Date.now()}`,
        name: newHospital.name,
        address: newHospital.address,
        gstin: newHospital.gstin || '',
        pan: newHospital.pan || ''
      };
      onAddHospital(h);
      setSelectedHospital(h);
      setHospitalSearch(h.name);
    }
    setShowAddHospitalModal(false);
    setEditingHospitalId(null);
    setNewHospital({ name: '', address: '', gstin: '', pan: '' });
  };

  const lineSubtotal = invoiceLines.reduce((sum, line) => sum + (line.qty * line.rate), 0);
  const totalItemDiscount = invoiceLines.reduce((sum, line) => sum + (line.discount || 0), 0);
  const totalTaxable = invoiceLines.reduce((sum, line) => {
    const base = line.taxableAmount !== undefined ? line.taxableAmount : Math.max(0, (line.qty * line.rate) - (line.discount || 0));
    return sum + base;
  }, 0);
  const totalTaxAmount = invoiceLines.reduce((sum, line) => {
    if (line.taxAmount !== undefined) return sum + line.taxAmount;
    const base = line.taxableAmount !== undefined ? line.taxableAmount : Math.max(0, (line.qty * line.rate) - (line.discount || 0));
    const rate = line.gstRate !== undefined ? line.gstRate : 0;
    return sum + (base * rate) / 100;
  }, 0);
  const totalCGST = isInterState ? 0 : totalTaxAmount / 2;
  const totalSGST = isInterState ? 0 : totalTaxAmount / 2;
  const totalIGST = isInterState ? totalTaxAmount : 0;
  
  const rawFinalTotal = Math.max(0, totalTaxable + totalTaxAmount - globalAdjustment);
  const total = Math.round(rawFinalTotal);
  const roundOff = Number((total - rawFinalTotal).toFixed(2));

  const handleFinalSave = () => {
    if(!selectedHospital || invoiceLines.length === 0) return;
    const inv: ServiceInvoice = {
      id: editingInvoiceId || generateInvoiceId(),
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
      hospitalDetails: selectedHospital,
      date: invoiceDate,
      items: invoiceLines.map(line => {
        const taxable = line.taxableAmount !== undefined ? line.taxableAmount : Math.max(0, (line.qty * line.rate) - (line.discount || 0));
        const rate = line.gstRate !== undefined ? line.gstRate : 0;
        const tax = line.taxAmount !== undefined ? line.taxAmount : (taxable * rate) / 100;
        return {
          ...line,
          taxableAmount: taxable,
          gstRate: rate,
          taxAmount: tax,
          cgstAmount: isInterState ? 0 : tax / 2,
          sgstAmount: isInterState ? 0 : tax / 2,
          igstAmount: isInterState ? tax : 0,
          amount: taxable + tax
        };
      }),
      subtotal: lineSubtotal,
      itemDiscount: totalItemDiscount,
      globalAdjustment: globalAdjustment,
      totalDiscount: totalItemDiscount + globalAdjustment,
      taxableAmount: totalTaxable,
      isInterState: isInterState,
      cgstAmount: totalCGST,
      sgstAmount: totalSGST,
      igstAmount: totalIGST,
      taxAmount: totalTaxAmount,
      roundOff: roundOff,
      totalAmount: total,
      notes,
      bankAccountName: selectedBank
    };
    onSaveInvoice(inv);
    setViewMode('list');
    resetForm();
  };

  const applyDatePreset = (preset: 'all' | 'today' | 'this_month' | 'last_month' | 'this_fy') => {
    setDatePreset(preset);
    const now = new Date();
    
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(endOfMonth.toISOString().split('T')[0]);
    } else if (preset === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(startOfLastMonth.toISOString().split('T')[0]);
      setEndDate(endOfLastMonth.toISOString().split('T')[0]);
    } else if (preset === 'this_fy') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed (April is 3)
      let fyStartYear = currentYear;
      if (currentMonth < 3) {
        fyStartYear = currentYear - 1;
      }
      const fyStart = new Date(fyStartYear, 3, 1); // April 1st
      const fyEnd = new Date(fyStartYear + 1, 2, 31); // March 31st
      setStartDate(fyStart.toISOString().split('T')[0]);
      setEndDate(fyEnd.toISOString().split('T')[0]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
  };

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('কোনো সার্ভিস ইনভয়েস রেকর্ড পাওয়া যায়নি ডাউনলোড করার জন্য!');
      return;
    }

    const headers = [
      'Bill No',
      'Billing Date',
      'Hospital Name',
      'Hospital GSTIN',
      'Hospital PAN',
      'Hospital Address',
      'Place of Supply',
      'Services / Particulars Summary',
      'Total Items Qty',
      'Gross Subtotal (INR)',
      'Line Items Discount (INR)',
      'Special / Global Adjustment (INR)',
      'Total Discount (INR)',
      'Taxable Amount (INR)',
      'CGST Amount (INR)',
      'SGST Amount (INR)',
      'IGST Amount (INR)',
      'Total GST / Tax (INR)',
      'Round Off (INR)',
      'Net Payable Amount (INR)',
      'Bank Account Name',
      'Entered By',
      'Invoice Remarks'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filtered.map(inv => {
      const particulars = (inv.items || [])
        .map(it => `${it.description || ''} [HSN: ${it.hsn || '9987'}, Qty: ${it.qty || 1}, Rate: ₹${it.rate || 0}, Disc: ₹${it.discount || 0}, Taxable: ₹${it.taxableAmount || ((it.qty || 1) * (it.rate || 0) - (it.discount || 0))}, GST: ${it.gstRate || 0}%, Tax: ₹${it.taxAmount || 0}, Total: ₹${it.amount || 0}]`)
        .join('; ');
      const totalQty = (inv.items || []).reduce((sum, it) => sum + (it.qty || 1), 0);
      const isInter = inv.isInterState || false;
      const calculatedTaxable = inv.taxableAmount !== undefined ? inv.taxableAmount : (inv.items || []).reduce((s, it) => s + (it.taxableAmount || ((it.qty || 1) * (it.rate || 0) - (it.discount || 0))), 0);
      const calculatedTax = inv.taxAmount || (inv.items || []).reduce((s, it) => s + (it.taxAmount || 0), 0);
      const cgst = inv.cgstAmount !== undefined ? inv.cgstAmount : (isInter ? 0 : calculatedTax / 2);
      const sgst = inv.sgstAmount !== undefined ? inv.sgstAmount : (isInter ? 0 : calculatedTax / 2);
      const igst = inv.igstAmount !== undefined ? inv.igstAmount : (isInter ? calculatedTax : 0);

      return [
        escapeCsv(inv.id),
        escapeCsv(inv.date),
        escapeCsv(inv.hospitalName),
        escapeCsv(inv.hospitalDetails?.gstin || ''),
        escapeCsv(inv.hospitalDetails?.pan || ''),
        escapeCsv(inv.hospitalDetails?.address || ''),
        escapeCsv(isInter ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST - WB)'),
        escapeCsv(particulars),
        totalQty,
        inv.subtotal || 0,
        inv.itemDiscount || 0,
        inv.globalAdjustment || 0,
        inv.totalDiscount || 0,
        calculatedTaxable,
        cgst,
        sgst,
        igst,
        calculatedTax,
        inv.roundOff || 0,
        inv.totalAmount || 0,
        escapeCsv(inv.bankAccountName || ''),
        escapeCsv(inv.entryBy || ''),
        escapeCsv(inv.notes || '')
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const dateSuffix = startDate && endDate 
      ? `${startDate}_to_${endDate}` 
      : startDate 
      ? `from_${startDate}` 
      : endDate 
      ? `until_${endDate}` 
      : new Date().toISOString().split('T')[0];

    link.setAttribute("download", `service_billing_report_${dateSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return [...invoices]
      .filter(i => {
        const matchesSearch = 
          i.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
          i.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.items && i.items.some(item => item.description.toLowerCase().includes(searchTerm.toLowerCase())));
        
        const matchesStart = !startDate || i.date >= startDate;
        const matchesEnd = !endDate || i.date <= endDate;

        return matchesSearch && matchesStart && matchesEnd;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [invoices, searchTerm, startDate, endDate]);

  const summaryStats = useMemo(() => {
    const totalCount = filtered.length;
    const totalAmount = filtered.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalTaxable = filtered.reduce((sum, inv) => {
      if (inv.taxableAmount !== undefined) return sum + inv.taxableAmount;
      const itemsTaxable = (inv.items || []).reduce((s, it) => s + (it.taxableAmount || ((it.qty || 1) * (it.rate || 0) - (it.discount || 0))), 0);
      return sum + itemsTaxable;
    }, 0);
    const totalTax = filtered.reduce((sum, inv) => {
      if (inv.taxAmount !== undefined) return sum + inv.taxAmount;
      return sum + (inv.items || []).reduce((s, it) => s + (it.taxAmount || 0), 0);
    }, 0);
    const totalDiscount = filtered.reduce((sum, inv) => sum + (inv.totalDiscount || 0), 0);
    const totalServices = filtered.reduce((sum, inv) => sum + (inv.items ? inv.items.reduce((s, it) => s + (it.qty || 1), 0) : 0), 0);
    return { totalCount, totalAmount, totalTaxable, totalTax, totalDiscount, totalServices };
  }, [filtered]);

  const isFilterActive = searchTerm || startDate || endDate || datePreset !== 'all';

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Landmark className="text-primary" /> Hospital Service Billing Dashboard
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              B2B Hospital Invoicing, Date Range Analytics & Export
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={exportToCSV} 
              disabled={filtered.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download filtered service billing data as CSV file"
            >
              <FileSpreadsheet size={16} /> 
              <span>CSV ডাউনলোড ({filtered.length})</span>
            </button>

            <button 
              onClick={() => { resetForm(); setViewMode('create'); }} 
              className="bg-primary hover:bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus size={16} /> 
              <span>নতুন বিল তৈরি করুন</span>
            </button>
          </div>
        </div>

        {/* Date Range & Search Filter Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Filter size={18} className="text-[#3159a6]" />
              <span>ফিল্টার এবং তারিখ নির্বাচন (Date Range & Search Filters)</span>
            </div>
            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-lg hover:bg-rose-100 transition"
              >
                <RotateCcw size={13} />
                <span>সব ফিল্টার ক্লিয়ার করুন</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                খুঁজুন (Search)
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Bill No, Hospital Name বা সার্ভিস দিয়ে খুঁজুন..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs font-medium transition" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* From Date */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                শুরুর তারিখ (From Date)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => { setStartDate(e.target.value); setDatePreset('custom'); }} 
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs font-semibold text-gray-700 transition" 
                />
              </div>
            </div>

            {/* To Date */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                শেষ তারিখ (To Date)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => { setEndDate(e.target.value); setDatePreset('custom'); }} 
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs font-semibold text-gray-700 transition" 
                />
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              কুইক সিলেক্ট:
            </span>
            <button
              onClick={() => applyDatePreset('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                datePreset === 'all' && !startDate && !endDate
                  ? 'bg-[#3159a6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => applyDatePreset('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                datePreset === 'today'
                  ? 'bg-[#3159a6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => applyDatePreset('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                datePreset === 'this_month'
                  ? 'bg-[#3159a6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => applyDatePreset('last_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                datePreset === 'last_month'
                  ? 'bg-[#3159a6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => applyDatePreset('this_fy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                datePreset === 'this_fy'
                  ? 'bg-[#3159a6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Financial Year
            </button>

            {(startDate || endDate) && (
              <span className="ml-auto text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                রেঞ্জ: {startDate || 'শুরু থেকে'} &rarr; {endDate || 'বর্তমান'}
              </span>
            )}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">মোট ইনভয়েস (Invoices)</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{summaryStats.totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ট্যাক্সেবল মান (Taxable)</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">₹{summaryStats.totalTaxable.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Activity size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">মোট জিএসটি (GST Tax)</p>
              <p className="text-2xl font-black text-rose-600 mt-1">₹{summaryStats.totalTax.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Percent size={18} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">মোট নেট রেভিনিউ (Net Revenue)</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">₹{summaryStats.totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between col-span-2 md:col-span-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">মোট ডিসকাউন্ট (Discounts)</p>
              <p className="text-2xl font-black text-amber-600 mt-1">₹{summaryStats.totalDiscount.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Percent size={18} />
            </div>
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-600">
            <span className="flex items-center gap-2">
              <span>ইনভয়েস তালিকা (Showing {filtered.length} of {invoices.length})</span>
            </span>
            {filtered.length > 0 && (
              <button 
                onClick={exportToCSV} 
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-xs"
              >
                <Download size={14} /> CSV ডাউনলোড করুন
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#3159a6] text-white font-black text-[10px] uppercase tracking-widest border-b">
                <tr>
                  <th className="p-4">Bill No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Hospital / Client</th>
                  <th className="p-4">Services / Items</th>
                  <th className="p-4 text-right">Taxable & GST</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-gray-400 space-y-2">
                      <FileText className="mx-auto text-gray-300" size={40} />
                      <p className="font-bold text-gray-500">কোনো সার্ভিস ইনভয়েস পাওয়া যায়নি</p>
                      {isFilterActive && (
                        <p className="text-xs text-gray-400">
                          আপনার নির্বাচিত তারিখ বা সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা{' '}
                          <button onClick={clearFilters} className="text-primary underline font-bold">
                            সব ফিল্টার মুছুন
                          </button>
                        </p>
                      )}
                    </td>
                  </tr>
                ) : filtered.map(inv => {
                  const invTaxable = inv.taxableAmount !== undefined ? inv.taxableAmount : (inv.items || []).reduce((s, it) => s + (it.taxableAmount || ((it.qty || 1) * (it.rate || 0) - (it.discount || 0))), 0);
                  const invTax = inv.taxAmount !== undefined ? inv.taxAmount : (inv.items || []).reduce((s, it) => s + (it.taxAmount || 0), 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-black text-primary uppercase">
                        <div>{inv.id}</div>
                        {inv.entryBy && (
                          <div className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-wider normal-case">
                            By: {inv.entryBy}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-600 whitespace-nowrap">
                        {new Date(inv.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="font-black text-gray-800 uppercase">{inv.hospitalName}</div>
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          {inv.hospitalDetails?.gstin && (
                            <span className="text-[10px] text-gray-500 font-mono">GST: {inv.hospitalDetails.gstin}</span>
                          )}
                          {inv.isInterState && (
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">IGST</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-600 max-w-xs">
                        <div className="truncate font-medium">
                          {(inv.items || []).map(it => it.description).filter(Boolean).join(', ') || 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {inv.items?.length || 0} টি সার্ভিস আইটেম
                        </div>
                      </td>
                      <td className="p-4 text-right text-xs whitespace-nowrap">
                        <div className="font-bold text-gray-700">₹{invTaxable.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-rose-600 font-bold">
                          {invTax > 0 ? `GST: +₹${invTax.toLocaleString('en-IN')}` : 'GST: 0% (Exempt)'}
                        </div>
                      </td>
                      <td className="p-4 text-right font-black text-base text-gray-900 whitespace-nowrap">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={() => { 
                              setSelectedHospital(inv.hospitalDetails); 
                              setInvoiceLines(inv.items); 
                              setInvoiceDate(inv.date); 
                              setIsInterState(inv.isInterState || false);
                              setNotes(inv.notes || ''); 
                              setGlobalAdjustment(inv.globalAdjustment || 0); 
                              setSelectedBank(inv.bankAccountName || selectedBank); 
                              setEditingInvoiceId(inv.id);
                              setViewMode('create'); 
                            }} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                            title="Edit Invoice"
                          >
                            <Edit size={16}/>
                          </button>
                          
                          <button 
                            onClick={() => { 
                              setSelectedHospital(inv.hospitalDetails); 
                              setInvoiceLines(inv.items); 
                              setInvoiceDate(inv.date); 
                              setIsInterState(inv.isInterState || false);
                              setNotes(inv.notes || ''); 
                              setGlobalAdjustment(inv.globalAdjustment || 0); 
                              setSelectedBank(inv.bankAccountName || selectedBank); 
                              setEditingInvoiceId(inv.id);
                              setViewMode('review'); 
                            }} 
                            className="p-2 text-primary hover:bg-blue-50 rounded-lg transition" 
                            title="Print/Review"
                          >
                            <Printer size={16}/>
                          </button>
                          
                          {userRole === 'admin' && (
                            <button 
                              onClick={() => { 
                                if (window.confirm(`Are you sure you want to delete Service Invoice "${inv.id}"? This action has been backed up in the database.`)) {
                                  onDeleteInvoice(inv.id);
                                }
                              }} 
                              className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition" 
                              title="Permanently Delete Service Invoice"
                            >
                              <Trash2 size={16}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'create') {
    return (
      <div className="max-w-5xl mx-auto pb-10 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 rounded-full text-gray-400 hover:bg-gray-100 shadow-sm transition"><ArrowLeft size={24}/></button>
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Compose Service Bill</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Hospital Professional Services</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 space-y-8">
          {/* Hospital Selection & GST Supply Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hospital / Client *</label>
              <div className="relative">
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-50 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-sm" placeholder="Find Hospital..." value={hospitalSearch} onChange={e => { setHospitalSearch(e.target.value); setShowHospResults(true); }} onFocus={() => setShowHospResults(true)} />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {selectedHospital && (
                      <button onClick={() => { setEditingHospitalId(selectedHospital.id); setNewHospital(selectedHospital); setShowAddHospitalModal(true); }} className="text-gray-400 hover:text-primary transition" title="Edit current hospital"><Edit size={18}/></button>
                    )}
                    <button onClick={() => setShowAddHospitalModal(true)} className="text-primary hover:text-secondary"><PlusCircle size={20}/></button>
                  </div>
                </div>
                {showHospResults && hospitalSearch && (
                  <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto p-2">
                    {hospitals.filter(h => h.name && typeof h.name === 'string' && h.name.toLowerCase().includes(hospitalSearch.toLowerCase())).map(h => (
                      <div key={h.id} className="flex items-center gap-2 group">
                        <button type="button" onClick={() => { setSelectedHospital(h); setHospitalSearch(h.name); setShowHospResults(false); }} className="flex-1 text-left p-4 hover:bg-blue-50 rounded-xl transition font-bold uppercase text-xs">{h.name}</button>
                        <button type="button" onClick={() => { setEditingHospitalId(h.id); setNewHospital(h); setShowAddHospitalModal(true); setShowHospResults(false); }} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100 mr-2"><Edit size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Billing Date *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="date" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-50 rounded-2xl font-bold text-sm" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Supply Type (Tax Mechanism)</label>
              <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsInterState(false)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition ${
                    !isInterState
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Intra-State (CGST + SGST)
                </button>
                <button
                  type="button"
                  onClick={() => setIsInterState(true)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition ${
                    isInterState
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inter-State (IGST)
                </button>
              </div>
            </div>
          </div>

          {/* Quick GST Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Percent size={16} className="text-primary" />
              <span className="text-xs font-bold text-gray-700">Quick Apply GST Rate to All Lines:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 5, 12, 18, 28].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => applyGstRateToAllLines(rate)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tempLine.gstRate === rate
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {rate === 0 ? '0% (Exempt)' : `${rate}% GST`}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-dashed" />

          {/* Line Items */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Service Particulars & GST Calculation</label>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Description</label>
                <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Service Description (e.g. Audiology Consultation)" value={tempLine.description} onChange={e => setTempLine({...tempLine, description: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">HSN / SAC</label>
                <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="HSN (9987)" value={tempLine.hsn} onChange={e => setTempLine({...tempLine, hsn: e.target.value})} />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Qty</label>
                <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Qty" value={tempLine.qty} onChange={e => setTempLine({...tempLine, qty: parseInt(e.target.value) || 1})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Rate (₹)</label>
                <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Rate" value={tempLine.rate || ''} onChange={e => setTempLine({...tempLine, rate: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Disc (₹)</label>
                <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm" placeholder="Disc" value={tempLine.discount || ''} onChange={e => setTempLine({...tempLine, discount: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">GST %</label>
                <select 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm bg-white" 
                  value={tempLine.gstRate ?? 0} 
                  onChange={e => setTempLine({...tempLine, gstRate: parseFloat(e.target.value) || 0})}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div className="md:col-span-1 pt-4">
                <button onClick={handleAddLine} className="w-full h-11 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-secondary transition shadow-lg" title="Add Service Line"><Plus size={20}/></button>
              </div>
            </div>

            <div className="border-2 border-gray-50 rounded-2xl overflow-hidden mt-4">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[9px] tracking-widest border-b">
                  <tr>
                    <th className="p-4">Particulars</th>
                    <th className="p-4">HSN</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Rate</th>
                    <th className="p-4 text-right">Disc</th>
                    <th className="p-4 text-right">Taxable</th>
                    <th className="p-4 text-right">GST Rate & Tax</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y uppercase">
                  {invoiceLines.length === 0 ? (
                    <tr><td colSpan={9} className="p-10 text-center text-gray-300 italic">No service items added yet</td></tr>
                  ) : invoiceLines.map(line => {
                    const lineTaxable = line.taxableAmount !== undefined ? line.taxableAmount : (line.qty * line.rate - (line.discount || 0));
                    const lineTax = line.taxAmount !== undefined ? line.taxAmount : (lineTaxable * (line.gstRate || 0) / 100);

                    return (
                      <tr key={line.id}>
                        <td className="p-4 text-gray-800 font-bold">{line.description}</td>
                        <td className="p-4 text-gray-400 font-mono">{line.hsn || '9987'}</td>
                        <td className="p-4 text-center">{line.qty}</td>
                        <td className="p-4 text-right">₹{line.rate.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right text-red-500">{line.discount > 0 ? `-₹${line.discount.toLocaleString('en-IN')}` : '₹0'}</td>
                        <td className="p-4 text-right text-gray-700">₹{lineTaxable.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right text-rose-600">
                          {line.gstRate ? `${line.gstRate}% (+₹${lineTax.toLocaleString('en-IN')})` : '0% (Exempt)'}
                        </td>
                        <td className="p-4 text-right font-black text-gray-900">₹{line.amount.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => setInvoiceLines(invoiceLines.filter(l => l.id !== line.id))} className="text-red-400 hover:text-red-600 p-1 rounded transition"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Account Node</label>
                  <select className="w-full border-2 border-gray-100 rounded-2xl p-4 font-black text-primary bg-gray-50" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                    {COMPANY_BANK_ACCOUNTS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Global / Special Adjustment</label>
                  <input type="number" className="w-full border-2 border-gray-100 rounded-2xl p-4 font-black text-red-600 bg-gray-50 shadow-inner outline-none focus:border-red-300" value={globalAdjustment || ''} onChange={e => setGlobalAdjustment(Number(e.target.value))} placeholder="0.00" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-blue-50">
                <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1 mb-2">Invoice Remarks / Notes</label>
                <textarea className="w-full bg-white border-2 border-gray-50 p-3 rounded-xl text-xs h-20 resize-none font-bold" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter service description notes or billing instructions..." />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Gross Subtotal</span>
                <span>₹{lineSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-red-500">
                <span>Line Items Discount</span>
                <span>-₹{totalItemDiscount.toLocaleString('en-IN')}</span>
              </div>
              {globalAdjustment > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-red-500">
                  <span>Special Adjustment</span>
                  <span>-₹{globalAdjustment.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-bold text-indigo-700 border-t border-gray-100 pt-2">
                <span>Taxable Amount</span>
                <span>₹{totalTaxable.toLocaleString('en-IN')}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between items-center text-xs font-bold text-rose-600">
                    <span>CGST (Central Tax)</span>
                    <span>+₹{totalCGST.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-rose-600">
                    <span>SGST (State Tax - WB)</span>
                    <span>+₹{totalSGST.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-xs font-bold text-rose-600">
                  <span>IGST (Integrated Tax)</span>
                  <span>+₹{totalIGST.toLocaleString('en-IN')}</span>
                </div>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                  <span>Round Off</span>
                  <span>{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-baseline">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payable Amount</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1">{numberToWords(total)}</p>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{total.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <button onClick={() => setViewMode('review')} disabled={!selectedHospital || invoiceLines.length === 0} className="w-full bg-primary text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition active:scale-95 text-[10px] disabled:opacity-50">Generate Service Invoice Preview &rarr;</button>
        </div>

        {/* Add/Edit Hospital Modal */}
        {showAddHospitalModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border-4 border-white">
              <div className="bg-[#3159a6] p-5 text-white flex justify-between items-center font-black uppercase tracking-widest">
                <h3>{editingHospitalId ? 'Edit Hospital Details' : 'Register New Hospital'}</h3>
                <button onClick={() => { setShowAddHospitalModal(false); setEditingHospitalId(null); setNewHospital({ name: '', address: '', gstin: '', pan: '' }); }}><X size={24}/></button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Hospital Name *</label>
                  <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-primary" value={newHospital.name} onChange={e => setNewHospital({...newHospital, name: e.target.value})} placeholder="Hospital Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">GSTIN (Optional)</label>
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold uppercase text-gray-700 outline-none focus:border-primary" value={newHospital.gstin} onChange={e => setNewHospital({...newHospital, gstin: e.target.value})} placeholder="GSTIN" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">PAN NO (Optional)</label>
                    <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold uppercase text-gray-700 outline-none focus:border-primary" value={newHospital.pan} onChange={e => setNewHospital({...newHospital, pan: e.target.value})} placeholder="PAN NO" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Address *</label>
                  <textarea className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold h-24 resize-none text-gray-700 outline-none focus:border-primary" value={newHospital.address} onChange={e => setNewHospital({...newHospital, address: e.target.value})} placeholder="Enter hospital full address..." />
                </div>
                <button onClick={handleAddHospitalSubmit} className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-4 shadow-xl active:scale-95 transition-all">
                  {editingHospitalId ? 'Update Hospital Records' : 'Confirm Registration'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'review' && selectedHospital) {
    const bank = COMPANY_BANK_ACCOUNTS.find(b => b.name === selectedBank) || COMPANY_BANK_ACCOUNTS[0];

    return (
      <div className="flex flex-col items-center bg-white p-4 sm:p-10 min-h-screen print:bg-white print:p-0">
        <div className="mb-8 flex gap-4 print:hidden">
          <button onClick={() => setViewMode('create')} className="bg-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow transition hover:bg-gray-50 border-2 border-gray-100">Edit Details</button>
          <button onClick={handleFinalSave} className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-secondary transition flex items-center gap-2"><Save size={16}/> Save to Database</button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-black transition flex items-center gap-2"><Printer size={16}/> Print Bill</button>
        </div>

        <div id="invoice-printable-area" className="bg-white shadow-2xl p-[15mm] w-full max-w-[900px] min-h-[297mm] flex flex-col border-4 border-white print:border-0 print:shadow-none print:p-[5mm]">
          {/* Header */}
          <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-6">
            <div className="flex items-center gap-6">
              <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-[#3159a6] text-white px-6 py-2 mb-3 rounded-lg">
                <h2 className="text-lg font-black uppercase tracking-widest text-center">Tax Invoice / Service Bill</h2>
              </div>
              <p className="text-sm font-black text-slate-900 uppercase"># {editingInvoiceId || generateInvoiceId()}</p>
              <p className="text-[11px] font-black text-slate-700 uppercase mt-1 tracking-widest">DATE: {new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                Place of Supply: {isInterState ? 'Inter-State (IGST)' : 'West Bengal (19 - Intra-State)'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest border-b pb-1">Bill To (Recipient / Hospital):</h4>
              <p className="font-black text-2xl text-slate-900 uppercase tracking-tight mb-2">{selectedHospital.name}</p>
              <p className="text-xs text-slate-700 font-bold uppercase leading-relaxed min-h-[60px] italic">"{selectedHospital.address}"</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {selectedHospital.gstin && <p className="text-[10px] font-black text-[#3159a6] uppercase">GSTIN: {selectedHospital.gstin}</p>}
                {selectedHospital.pan && <p className="text-[10px] font-black text-slate-600 uppercase">PAN: {selectedHospital.pan}</p>}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Billed By (Supplier)</h4>
                <p className="font-black text-[20x] text-slate-900 uppercase tracking-tight mb-1">{COMPANY_NAME}</p>
                <p className="text-[12px] text-slate-800 font-bold uppercase tracking-tight leading-tight">{COMPANY_ADDRESS}</p>
                <p className="text-[12px] text-slate-800 font-bold uppercase tracking-tight mt-2">PH: {COMPANY_PHONES}</p>
                <p className="text-[12px] text-slate-800 font-bold uppercase tracking-tight">{COMPANY_EMAIL}</p>
                <p className="text-[12px] text-[#3159a6] font-black uppercase tracking-tight mt-1">GSTIN: {CLINIC_GSTIN}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full border-collapse border-4 border-slate-900 text-xs font-bold">
              <thead className="bg-[#3159a6] text-white uppercase font-black">
                <tr>
                  <th className="p-3 text-center border-r-2 border-white/20 w-12">Sl No.</th>
                  <th className="p-3 text-left border-r-2 border-white/20">Description of Service</th>
                  <th className="p-3 text-center border-r-2 border-white/20">HSN</th>
                  <th className="p-3 text-center border-r-2 border-white/20">Qty</th>
                  <th className="p-3 text-right border-r-2 border-white/20">Rate</th>
                  <th className="p-3 text-right border-r-2 border-white/20">Taxable</th>
                  <th className="p-3 text-right border-r-2 border-white/20">GST</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="uppercase text-slate-900">
                {invoiceLines.map((line, idx) => {
                  const lineTaxable = line.taxableAmount !== undefined ? line.taxableAmount : (line.qty * line.rate - (line.discount || 0));
                  const lineTax = line.taxAmount !== undefined ? line.taxAmount : (lineTaxable * (line.gstRate || 0) / 100);

                  return (
                    <tr key={line.id} className="border-b-2 border-slate-300 last:border-b-4 last:border-slate-900">
                      <td className="p-3 text-center border-r-2 border-slate-900">{idx + 1}</td>
                      <td className="p-3 border-r-2 border-slate-900 font-black">
                        {line.description}
                        {line.discount > 0 && <p className="text-[8px] text-red-500 font-black tracking-widest mt-1">LESS: ₹{line.discount.toLocaleString()} ITEM DISCOUNT</p>}
                      </td>
                      <td className="p-3 text-center border-r-2 border-slate-900 font-mono">{line.hsn || '9987'}</td>
                      <td className="p-3 text-center border-r-2 border-slate-900">{line.qty}</td>
                      <td className="p-3 text-right border-r-2 border-slate-900">₹{line.rate.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right border-r-2 border-slate-900">₹{lineTaxable.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right border-r-2 border-slate-900 text-rose-600">
                        {line.gstRate ? `${line.gstRate}% (₹${lineTax.toLocaleString('en-IN')})` : '0%'}
                      </td>
                      <td className="p-3 text-right font-black bg-white">₹{line.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              {notes && (
                <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-blue-200">
                  <h4 className="text-[10px] font-black uppercase text-[#3159a6] mb-2 border-b border-blue-100 pb-1 tracking-widest">Invoicing Remarks:</h4>
                  <p className="text-xs text-slate-800 italic leading-relaxed font-semibold uppercase">"{notes}"</p>
                </div>
              )}
              <div className="bg-[#3159a6] text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg">
                Amount in Words: {numberToWords(total)}
              </div>
            </div>
            
            <div className="bg-white text-slate-900 p-6 rounded-3xl shadow-xl border-2 border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900"><Landmark size={120}/></div>
              <div className="space-y-2.5 relative z-10 text-xs">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Gross Subtotal</span>
                  <span>₹{lineSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {totalItemDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-red-500">
                    <span>Line Item Discount</span>
                    <span>-₹{totalItemDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {globalAdjustment > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-red-500">
                    <span>Special Consideration</span>
                    <span>-₹{globalAdjustment.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-700 border-t border-slate-100 pt-1.5">
                  <span>Net Taxable Value</span>
                  <span>₹{totalTaxable.toLocaleString('en-IN')}</span>
                </div>

                {!isInterState ? (
                  <>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-rose-600">
                      <span>CGST (Central Tax)</span>
                      <span>+₹{totalCGST.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-rose-600">
                      <span>SGST (State Tax - West Bengal)</span>
                      <span>+₹{totalSGST.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-rose-600">
                    <span>IGST (Integrated Tax)</span>
                    <span>+₹{totalIGST.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {roundOff !== 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Round Off</span>
                    <span>{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
                  </div>
                )}

                <div className="h-0.5 bg-slate-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-[#3159a6]">Net Payable Amount</span>
                  <span className="text-2xl font-black tracking-tighter text-slate-900">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            {/* Bank Details */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 mb-8 w-full">
              <h5 className="text-[10px] font-black uppercase text-[#3159a6] tracking-[0.2em] mb-2 border-b border-slate-200 pb-1">Bank Settlement Node:</h5>
              <div className="grid grid-cols-4 text-[10px] uppercase font-black text-slate-800">
                <p><span className="text-slate-400 mr-2">Bank:</span>{bank.name}</p>
                <p><span className="text-slate-400 mr-2">A/C:</span>{bank.accountNumber}</p>
                <p><span className="text-slate-400 mr-2">IFSC:</span>{bank.ifsc}</p>
                <p className="text-right"><span className="text-slate-400 mr-2">Branch:</span>{bank.branch}</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="w-[65%]">
                <p className="font-black text-[11px] uppercase border-b-4 border-slate-900 inline-block mb-3 tracking-widest">Legal Terms & Conditions</p>
                <div className="text-[9px] text-slate-800 font-bold space-y-1.5 uppercase leading-tight tracking-tight pr-8">
                  <p>1. Please keep this Invoice safe for future correspondence.</p>
                  <p>2. Our Udyam Registration Certificate No. UDYAM-WB-18-0032916 (Micro Enterprise).</p>
                  <p>3. Healthcare clinical consultation & diagnostic services are exempt under Notification No. 12/2017-Central Tax (Rate) and 9/2017-Integrated Tax (Rate) where applicable.</p>
                  <p>4. Hearing instruments and parts are classifiable under HSN 9021 40 90 / Service SAC 9987.</p>
                </div>
              </div>
              <div className="text-center w-60">
                {signature ? <img src={signature} className="h-20 mb-2 mx-auto mix-blend-multiply" /> : <div className="h-16 w-full border-b-4 border-dashed border-slate-200 mb-2"></div>}
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-t-4 border-slate-900 pt-2">Authorized Signatory</p>
              </div>
            </div>
            <div className="mt-12 text-center opacity-30 pb-4 print:opacity-10">
              <p className="text-[9px] font-black uppercase tracking-[0.8em] text-slate-600">BENGAL REHABILITATION & RESEARCH PVT. LTD.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
