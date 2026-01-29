import React, { useState, useMemo } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole, AdvanceBooking } from '../types';
import { CLINIC_GSTIN, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, COMPANY_BANK_ACCOUNTS, getFinancialYear } from '../constants';
import { FileText, Printer, Save, Eye, Plus, ArrowLeft, Search, Trash2, X, Wallet, IndianRupee, Edit, MessageSquare, Wrench, PackagePlus, CheckCircle2, Settings2, Download, Calendar, TrendingUp, CreditCard, AlertCircle, MessageCircle } from 'lucide-react';

interface BillingProps {
  inventory: HearingAid[];
  invoices?: Invoice[];
  patients: Patient[];
  advanceBookings?: AdvanceBooking[];
  onCreateInvoice: (invoice: Invoice, soldItemIds: string[]) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  logo: string;
  signature: string | null;
  userRole: UserRole;
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

export const Billing: React.FC<BillingProps> = ({ inventory, invoices = [], patients, advanceBookings = [], onCreateInvoice, onUpdateInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'payment' | 'review'>('patient');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Post-Save Automation
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedInvoice, setLastSavedInvoice] = useState<Invoice | null>(null);

  // Sales Dashboard Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Print Customization State
  const [printScale, setPrintScale] = useState(100);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');

  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectingInvoice, setCollectingInvoice] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentRecord['method']>('Cash');
  const [payBank, setPayBank] = useState<string>('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState(''); 
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', state: 'West Bengal', district: 'Kolkata', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' });
  
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [manualItems, setManualItems] = useState<InvoiceItem[]>([]);
  const [tempManual, setTempManual] = useState({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>({});
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  const [totalAdjustment, setTotalAdjustment] = useState<number>(0); 
  const [invoiceNotes, setInvoiceNotes] = useState<string>(''); 
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [existingPayments, setExistingPayments] = useState<PaymentRecord[]>([]);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [paymentBank, setPaymentBank] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const generateNextId = () => {
    const fy = getFinancialYear();
    const prefix = `BRRPL-IM-HA-${fy}-`;
    const fyInvoices = (invoices || []).filter(inv => inv.id.startsWith(prefix));
    const maxSeq = fyInvoices.length === 0 ? 0 : Math.max(...fyInvoices.map(inv => parseInt(inv.id.split('-').pop() || '0', 10)));
    return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
  };

  const resetForm = () => { 
    setStep('patient'); 
    setPatient({ id: '', name: '', address: '', state: 'West Bengal', district: 'Kolkata', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' }); 
    setSelectedItemIds([]); 
    setManualItems([]);
    setGstOverrides({}); 
    setItemDiscounts({}); 
    setTotalAdjustment(0);
    setInvoiceNotes('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setWarranty('2 Years Standard Warranty'); 
    setEditingInvoiceId(null); 
    setPatientSearchTerm(''); 
    setProductSearchTerm(''); 
    setInitialPayment(0); 
    setPaymentMethod('Cash'); 
    setPaymentBank(''); 
    setExistingPayments([]);
    setTempManual({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };
  
  const handleEditInvoice = (inv: Invoice, startStep: 'patient' | 'review' = 'review') => {
    setEditingInvoiceId(inv.id);
    setPatient(inv.patientDetails || { id: inv.patientId, name: inv.patientName, address: '', phone: '', referDoctor: '', audiologist: '' });
    setInvoiceDate(inv.date);
    const inventoryIds = inv.items.filter(i => i.hearingAidId && !i.hearingAidId.startsWith('MAN-')).map(i => i.hearingAidId);
    const manItems = inv.items.filter(i => !i.hearingAidId || i.hearingAidId.startsWith('MAN-'));
    setSelectedItemIds(inventoryIds);
    setManualItems(manItems);
    const discounts: Record<string, number> = {};
    inv.items.forEach(i => { if(i.hearingAidId) discounts[i.hearingAidId] = i.discount || 0; });
    setItemDiscounts(discounts);
    setTotalAdjustment(inv.discountValue || 0);
    setInvoiceNotes(inv.notes || '');
    setWarranty(inv.warranty || '2 Years Standard Warranty');
    setExistingPayments(inv.payments || []);
    setInitialPayment(0);
    setProductSearchTerm('');
    setStep(startStep);
    setViewMode('edit');
  };

  const handleSelectPatient = (p: Patient) => { 
    setPatient({ ...p, state: p.state || 'West Bengal', district: p.district || 'Kolkata', referDoctor: p.referDoctor || '' }); 
    setPatientSearchTerm(p.name); 
    setShowPatientResults(false); 
  };

  const handleAddManualItem = () => {
      if (!tempManual.model || tempManual.price <= 0) return;
      const newItem: InvoiceItem = {
          hearingAidId: `MAN-${Date.now()}`,
          brand: tempManual.brand,
          model: tempManual.model,
          serialNumber: 'N/A',
          price: tempManual.price,
          hsnCode: tempManual.hsn,
          gstRate: tempManual.gst,
          discount: 0,
          taxableValue: tempManual.price,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalAmount: 0
      };
      setManualItems([...manualItems, newItem]);
      setTempManual({ brand: 'Service', model: '', hsn: '902190', price: 0, gst: 0 });
  };

  const handleRemoveManualItem = (id: string) => {
      setManualItems(manualItems.filter(i => i.hearingAidId !== id));
  };

  const isInterState = patient.state && patient.state !== 'West Bengal';
  const selectedInventoryItems = inventory.filter(i => selectedItemIds.includes(i.id));
  
  let runningTaxableTotal: number = 0;
  let runningCGST: number = 0;
  let runningSGST: number = 0;
  let runningIGST: number = 0;
  let totalSubtotal: number = 0;

  const invInvoiceItems: InvoiceItem[] = selectedInventoryItems.map(item => {
      const itemDisc: number = (itemDiscounts[item.id] as number) || 0;
      const itemTaxable: number = Math.max(0, item.price - itemDisc);
      const gstRate: number = gstOverrides[item.id] !== undefined ? (gstOverrides[item.id] as number) : (item.gstRate || 0);
      const totalTax = itemTaxable * (gstRate / 100);
      let cgst = 0, sgst = 0, igst = 0;
      if (isInterState) { igst = totalTax; runningIGST += igst; } else { cgst = totalTax / 2; sgst = totalTax / 2; runningCGST += cgst; runningSGST += sgst; }
      runningTaxableTotal += itemTaxable; 
      totalSubtotal += item.price;
      return { 
          hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, 
          price: item.price, discount: itemDisc, gstRate, taxableValue: itemTaxable, 
          cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: itemTaxable + totalTax, 
          hsnCode: item.hsnCode || '90214090' 
      };
  });

  const processedManualItems: InvoiceItem[] = manualItems.map(item => {
      const totalTax = item.taxableValue * (item.gstRate / 100);
      let cgst = 0, sgst = 0, igst = 0;
      if (isInterState) { igst = totalTax; runningIGST += igst; } else { cgst = totalTax / 2; sgst = totalTax / 2; runningCGST += cgst; runningSGST += sgst; }
      runningTaxableTotal += item.taxableValue;
      totalSubtotal += item.price;
      return { ...item, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: item.taxableValue + totalTax };
  });

  const allInvoiceItems = [...invInvoiceItems, ...processedManualItems];
  const finalTotal: number = Math.max(0, (runningTaxableTotal + runningCGST + runningSGST + runningIGST) - totalAdjustment);
  const totalItemDiscounts: number = (Object.values(itemDiscounts) as number[]).reduce((a: number, b: number) => a + b, 0);

  const gstSummary = React.useMemo(() => {
    const summary: Record<number, { taxable: number, cgst: number, sgst: number, igst: number }> = {};
    allInvoiceItems.forEach(item => {
      const rate = item.gstRate;
      if (!summary[rate]) summary[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      summary[rate].taxable += item.taxableValue;
      summary[rate].cgst += item.cgstAmount;
      summary[rate].sgst += item.sgstAmount;
      summary[rate].igst += item.igstAmount;
    });
    return summary;
  }, [allInvoiceItems]);

  const handleSaveInvoice = () => {
    const finalId = editingInvoiceId || generateNextId();
    const currentPayments = [...existingPayments];
    if (initialPayment > 0) {
      currentPayments.push({
        id: `PAY-${Date.now()}`, date: new Date().toISOString().split('T')[0],
        amount: initialPayment, method: paymentMethod, bankDetails: paymentBank || ""
      });
    }
    const totalPaid = currentPayments.reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0);
    const balanceDue = Math.max(0, finalTotal - totalPaid);
    const invData: Invoice = { 
      id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: allInvoiceItems, 
      subtotal: totalSubtotal, discountType: 'flat', discountValue: totalAdjustment, totalDiscount: totalItemDiscounts + totalAdjustment, 
      placeOfSupply: isInterState ? 'Inter-State' : 'Intra-State', totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: runningIGST, totalTax: runningCGST + runningSGST + runningIGST, 
      finalTotal: finalTotal, date: invoiceDate, warranty, patientDetails: patient, notes: invoiceNotes,
      payments: currentPayments, balanceDue: balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid') 
    };
    onCreateInvoice(invData, selectedItemIds); 
    
    // Automation Trigger
    setLastSavedInvoice(invData);
    setShowSuccessModal(true);
    setViewMode('list');
  };

  const handleSendWhatsAppThankYou = () => {
    if (!lastSavedInvoice) return;
    const patientName = lastSavedInvoice.patientName;
    const invId = lastSavedInvoice.id;
    const amount = Math.round(lastSavedInvoice.finalTotal).toLocaleString();
    const phone = lastSavedInvoice.patientDetails?.phone.replace(/\D/g, '') || '';
    
    // Bengali Custom Message
    const message = `Namaste ${patientName} ji,\n\nBengal Rehabilitation & Research Pvt. Ltd. (BRG) theke apnake dhonyobad.\n\nApnar invoice generate hoyeche:\n# Invoice: ${invId}\n# Total: ₹${amount}\n\nApnar shustho jiboner kamona kori. Shighroi clinic-e dekha hobe!\n\nWebsite: www.bengalrehabilitationgroup.com`;
    
    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowSuccessModal(false);
  };

  const handleApplyAdvance = (adv: AdvanceBooking) => {
      const newPayment: PaymentRecord = {
          id: `PAY-ADV-${Date.now()}`, date: new Date().toISOString().split('T')[0],
          amount: adv.amount, method: 'Advance', note: `Ref: ${adv.id}`, bankDetails: 'N/A'
      };
      setExistingPayments([...existingPayments, newPayment]);
  };

  const handleConfirmCollection = () => {
      if (!collectingInvoice || !onUpdateInvoice || newPaymentAmount <= 0) return;
      const newPayment: PaymentRecord = { id: `PAY-${Date.now()}`, date: payDate, amount: newPaymentAmount, method: payMethod, bankDetails: payBank || "" };
      const updatedPayments = [...(collectingInvoice.payments || []), newPayment];
      const totalPaid = updatedPayments.reduce((sum, p: PaymentRecord) => sum + p.amount, 0);
      const balanceDue = Math.max(0, Math.round(collectingInvoice.finalTotal) - totalPaid);
      const updatedInvoice: Invoice = { ...collectingInvoice, payments: updatedPayments, balanceDue: balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : 'Partial' };
      onUpdateInvoice(updatedInvoice);
      setShowCollectModal(false);
      setCollectingInvoice(null);
      setNewPaymentAmount(0);
  };

  const openCollectModal = (inv: Invoice) => {
      setCollectingInvoice(inv);
      setNewPaymentAmount(inv.balanceDue);
      setShowCollectModal(true);
  };

  // Filter logic and statistics calculation
  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter(inv => {
      const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           inv.items.some(it => it.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           inv.items.some(it => it.model.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStart = !filterStartDate || inv.date >= filterStartDate;
      const matchesEnd = !filterEndDate || inv.date <= filterEndDate;
      
      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, searchTerm, filterStartDate, filterEndDate]);

  const billingStats = useMemo(() => {
    let totalSales = 0;
    let totalOutstanding = 0;
    let totalReceived = 0;

    filteredInvoices.forEach(inv => {
      totalSales += inv.finalTotal;
      totalOutstanding += (inv.balanceDue || 0);
      const collectedForInv = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      totalReceived += collectedForInv;
    });

    return { totalSales, totalOutstanding, totalReceived };
  }, [filteredInvoices]);

  const exportToCSV = () => {
    const headers = ['Invoice No', 'Date', 'Patient Name', 'Phone', 'Items', 'Serials', 'Total Amount', 'Taxable Value', 'Total Tax', 'Amount Paid', 'Balance Due', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.id,
      inv.date,
      `"${inv.patientName}"`,
      inv.patientDetails?.phone || 'N/A',
      `"${inv.items.map(it => `${it.brand} ${it.model}`).join('; ')}"`,
      `"${inv.items.map(it => it.serialNumber).join('; ')}"`,
      inv.finalTotal.toFixed(2),
      inv.totalTaxableValue.toFixed(2),
      inv.totalTax.toFixed(2),
      (inv.finalTotal - inv.balanceDue).toFixed(2),
      inv.balanceDue.toFixed(2),
      inv.paymentStatus
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewMode === 'list') {
      return (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-[#3159a6]" /> Billing & Sales</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={exportToCSV} className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-green-700 transition whitespace-nowrap"><Download size={16} /> Sales Report</button>
                    <button onClick={handleStartNew} className="bg-[#3159a6] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition whitespace-nowrap"><Plus size={16} /> New Invoice</button>
                  </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-50 flex items-center gap-5 transition hover:shadow-xl group">
                  <div className="p-4 bg-blue-50 rounded-2xl text-[#3159a6] group-hover:scale-110 transition-transform"><TrendingUp size={28}/></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales (Period)</p>
                    <p className="text-2xl font-black text-gray-800 tracking-tighter">₹{billingStats.totalSales.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-50 flex items-center gap-5 transition hover:shadow-xl group">
                  <div className="p-4 bg-green-50 rounded-2xl text-green-600 group-hover:scale-110 transition-transform"><CreditCard size={28}/></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Collected</p>
                    <p className="text-2xl font-black text-gray-800 tracking-tighter">₹{billingStats.totalReceived.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-red-50 flex items-center gap-5 transition hover:shadow-xl group">
                  <div className="p-4 bg-red-50 rounded-2xl text-red-500 group-hover:scale-110 transition-transform"><AlertCircle size={28}/></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Outstanding</p>
                    <p className="text-2xl font-black text-red-600 tracking-tighter">₹{billingStats.totalOutstanding.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Filters Area */}
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center gap-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    <input className="pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm w-full outline-none focus:bg-white focus:border-[#3159a6] transition font-bold" placeholder="Find by ID, Patient or Serial..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-2 px-4 rounded-2xl border-2 border-gray-50 w-full lg:w-auto">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-[#3159a6]" />
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Date Filter</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-transparent text-xs font-black outline-none focus:text-[#3159a6] uppercase" />
                        <span className="text-gray-300 font-black">/</span>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-transparent text-xs font-black outline-none focus:text-[#3159a6] uppercase" />
                        {(filterStartDate || filterEndDate) && (
                            <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} className="text-red-400 hover:text-red-600 ml-2"><X size={16}/></button>
                        )}
                    </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#3159a6] text-white font-black border-b text-[10px] uppercase tracking-[0.2em]">
                            <tr><th className="p-5">Invoice No</th><th className="p-5">Date</th><th className="p-5">Patient</th><th className="p-5">Device Units</th><th className="p-5 text-right">Grand Total</th><th className="p-5 text-right">Outstanding</th><th className="p-5 text-center">Status</th><th className="p-5 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-blue-50/30 transition">
                                    <td className="p-5 font-black text-[#3159a6]">{inv.id}</td>
                                    <td className="p-5 text-gray-500 font-bold whitespace-nowrap">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                                    <td className="p-5 font-black text-gray-800 uppercase tracking-tighter">{inv.patientName}</td>
                                    <td className="p-5">
                                        {inv.items.map((it, idx) => (
                                            <div key={idx} className="mb-1 last:mb-0">
                                                <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{it.brand} {it.model}</p>
                                                <p className="text-[9px] font-bold text-teal-600 font-mono tracking-widest mt-0.5">S/N: {it.serialNumber}</p>
                                            </div>
                                        ))}
                                    </td>
                                    <td className="p-5 text-right font-black">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                                    <td className="p-5 text-right font-black text-red-600">₹{(inv.balanceDue || 0).toLocaleString('en-IN')}</td>
                                    <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${inv.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : inv.paymentStatus === 'Partial' ? 'bg-orange-50 text-orange-800 border-orange-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{inv.paymentStatus}</span></td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center items-center gap-1">
                                            <button onClick={() => handleEditInvoice(inv, 'review')} className="p-1.5 text-[#3159a6] hover:bg-blue-50 rounded-lg transition" title="View Details"><Eye size={18}/></button>
                                            <button onClick={() => handleEditInvoice(inv, 'patient')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit Invoice"><Edit size={18}/></button>
                                            <button onClick={() => openCollectModal(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Add Payment" disabled={inv.balanceDue <= 0.5}><Wallet size={18} className={inv.balanceDue <= 0.5 ? 'opacity-20' : ''}/></button>
                                            {userRole === 'admin' && onDelete && (<button onClick={() => { if(window.confirm(`Delete invoice ${inv.id}? Items will be restocked.`)) onDelete(inv.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 size={18}/></button>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>

              {/* Automation Success Modal */}
              {showSuccessModal && lastSavedInvoice && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fade-in">
                      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-white">
                          <div className="p-10 text-center space-y-6">
                              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-green-100 shadow-inner">
                                  <CheckCircle2 size={48} />
                              </div>
                              <div>
                                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Invoice Shared!</h3>
                                  <p className="text-sm text-gray-500 font-bold mt-2">Data successfully archived in cloud vault.</p>
                              </div>
                              
                              <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-50 text-left">
                                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Target Patient</p>
                                  <p className="font-black text-gray-800 uppercase">{lastSavedInvoice.patientName}</p>
                                  <p className="text-xs font-bold text-blue-600 font-mono mt-1">ID: {lastSavedInvoice.id}</p>
                              </div>

                              <div className="space-y-3">
                                  <button onClick={handleSendWhatsAppThankYou} className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-teal-700 transition flex items-center justify-center gap-3 text-xs">
                                      <MessageCircle size={18}/> Send WhatsApp Thank You
                                  </button>
                                  <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-800 transition">
                                      Skip for now
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {showCollectModal && collectingInvoice && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fade-in">
                      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-white">
                          <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                              <h3 className="font-black uppercase tracking-widest text-xs ml-2">Record Outstanding Payment</h3>
                              <button onClick={() => setShowCollectModal(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
                          </div>
                          <div className="p-10 space-y-6 bg-gray-50/50">
                              <div className="bg-white p-4 rounded-2xl border-2 border-blue-50 shadow-sm">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Account Reference</p>
                                  <p className="font-black text-gray-800 text-lg">{collectingInvoice.id}</p>
                                  <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">{collectingInvoice.patientName}</p>
                              </div>

                              <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Payment Mode</label>
                                          <select className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-blue-500" value={payMethod} onChange={e=>setPayMethod(e.target.value as any)}>
                                              <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Account Transfer">Bank Transfer</option>
                                              <option value="Cheque">Cheque</option>
                                              <option value="EMI">Finance</option>
                                              <option value="Credit Card">Credit Card</option>
                                              <option value="Debit Card">Debit Card</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1.5">
                                          <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Date</label>
                                          <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-2.5 font-bold text-gray-700" value={payDate} onChange={e=>setPayDate(e.target.value)} />
                                      </div>
                                  </div>

                                  <div className="space-y-1.5">
                                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Receiving Account</label>
                                      <select className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-blue-800 outline-none" value={payBank} onChange={e=>setPayBank(e.target.value)}>
                                          <option value="">-- No Bank (Cash Node) --</option>
                                          {COMPANY_BANK_ACCOUNTS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                      </select>
                                  </div>

                                  <div className="space-y-1.5">
                                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Collection Amount (INR)</label>
                                      <div className="relative">
                                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={24} />
                                          <input type="number" className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl text-3xl font-black text-gray-800 outline-none focus:border-blue-500" value={newPaymentAmount || ''} onChange={e=>setNewPaymentAmount(Number(e.target.value))} />
                                      </div>
                                      <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest text-right mt-1">Due: ₹{collectingInvoice.balanceDue.toLocaleString()}</p>
                                  </div>
                              </div>

                              <button onClick={handleConfirmCollection} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition active:scale-95 text-[10px] flex items-center justify-center gap-2">
                                  <CheckCircle2 size={16}/> Finalize Receipt Entry
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  const patientAdvances = advanceBookings.filter(b => 
    b.patientId === patient.id && 
    b.status === 'Active' && 
    !existingPayments.some(p => p.note?.includes(b.id))
  );

  const totalPaidSoFar = existingPayments.reduce((s: number, p: PaymentRecord) => s + p.amount, 0) + initialPayment;

  return (
    <div className="max-w-5xl mx-auto pb-10">
        <div className="mb-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode('list')} className="p-3 bg-white border-2 border-gray-50 hover:bg-gray-100 rounded-full text-gray-400 shadow-sm transition"><ArrowLeft size={24} /></button><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Invoice Architect</h2></div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl border">{['patient', 'product', 'payment', 'review'].map((s, idx) => (<button key={s} onClick={() => setStep(s as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === s ? 'bg-[#3159a6] text-white shadow-lg' : 'bg-transparent text-gray-400'}`}>{idx+1}. {s}</button>))}</div>
        </div>
        
        {step === 'patient' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 1: Client Selection</h3>
                <div className="mb-10 relative"><label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Recall Registered Patient</label><div className="relative"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Start typing name or mobile..." className="w-full pl-12 pr-4 py-5 border-2 border-gray-50 bg-gray-50/50 rounded-2xl outline-none focus:border-[#3159a6] focus:bg-white transition-all shadow-sm font-bold text-lg" value={patientSearchTerm} onFocus={() => setShowPatientResults(true)} onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientResults(true); }} /></div>{showPatientResults && (<div className="absolute z-50 left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto custom-scrollbar p-2"><div className="space-y-1">{patients.filter(p=>p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())).map(p=>(<button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-6 py-4 hover:bg-blue-50 rounded-2xl border-b border-gray-50 last:border-0 flex justify-between items-center transition-all group"><div><p className="font-black text-gray-800 uppercase tracking-tight">{p.name}</p><p className="text-[10px] text-gray-400 font-bold">{p.phone} • {p.state}</p></div><span className="text-[#3159a6] text-[9px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full group-hover:bg-[#3159a6] group-hover:text-white transition-all">Select</span></button>))}</div></div>)}</div>
                <div className="bg-blue-50/30 p-8 rounded-[2rem] border-2 border-dashed border-blue-100 space-y-8">
                    <p className="text-[10px] font-black text-[#3159a6] uppercase tracking-[0.2em]">Verification & Contact Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Patient Full Name *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Active Phone *</label><input required className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Ref. Dr. (Referrer)</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.referDoctor} onChange={e => setPatient({...patient, referDoctor: e.target.value})} placeholder="e.g. Dr. Name" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">State (Supply Destination)</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.state} onChange={e => setPatient({...patient, state: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Audiologist</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.audiologist} onChange={e => setPatient({...patient, audiologist: e.target.value})} placeholder="Name" /></div>
                      <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Full Postal Address</label><input className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-[#3159a6] font-bold shadow-sm" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} /></div>
                    </div>
                </div>
                <div className="mt-12 flex justify-end"><button onClick={() => setStep('product')} disabled={!patient.name} className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs disabled:opacity-50">Proceed to Product Selection &rarr;</button></div>
            </div>
        )}

        {step === 'product' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <div className="flex justify-between items-center mb-6 border-b-2 border-blue-50 pb-4">
                    <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em]">Phase 2: Inventory Assignment</h3>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${isInterState ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {isInterState ? `INTER-STATE (IGST MODE) - ${patient.state}` : `INTRA-STATE (CGST/SGST MODE)`}
                    </div>
                </div>
                <div className="relative mb-6 flex gap-4"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Find serial number or model..." className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 bg-gray-50/50 rounded-2xl focus:bg-white focus:border-[#3159a6] outline-none transition font-bold" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)}/></div></div>
                <div className="max-h-80 overflow-y-auto border-2 border-gray-50 rounded-[2rem] mb-8 shadow-inner custom-scrollbar overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#3159a6] text-white sticky top-0 uppercase font-black text-[10px] tracking-widest">
                            <tr><th className="p-5 w-14"></th><th className="p-5">Device Unit</th><th className="p-5 text-center">HSN Code</th><th className="p-5">Serial No</th><th className="p-5 text-center">Tax %</th><th className="p-5 text-center">Discount (₹)</th><th className="p-5 text-right">Unit MRP</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {inventory.filter(i => {
                                const match = i.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) || i.model.toLowerCase().includes(productSearchTerm.toLowerCase()) || i.serialNumber.toLowerCase().includes(productSearchTerm.toLowerCase());
                                return (i.status === 'Available' || selectedItemIds.includes(i.id)) && match;
                            }).map(item => (
                                <tr key={item.id} className={`${selectedItemIds.includes(item.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition`}>
                                    <td className="p-5 text-center"><input type="checkbox" className="h-5 w-5 rounded-lg border-2 border-gray-200 text-[#3159a6] focus:ring-[#3159a6] transition" checked={selectedItemIds.includes(item.id)} onChange={() => { if(selectedItemIds.includes(item.id)) { setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); const newDiscounts = {...itemDiscounts}; delete newDiscounts[item.id]; setItemDiscounts(newDiscounts); } else setSelectedItemIds([...selectedItemIds, item.id]); }} /></td>
                                    <td className="p-5 font-black text-gray-800 uppercase tracking-tighter">{item.brand} {item.model}</td>
                                    <td className="p-5 text-center font-mono font-bold text-gray-400">{item.hsnCode || '90214090'}</td>
                                    <td className="p-5 font-mono font-black text-[#3159a6] tracking-widest">{item.serialNumber}</td>
                                    <td className="p-5 text-center">
                                        {selectedItemIds.includes(item.id) && (
                                            <select className="border-2 border-blue-100 rounded-xl p-1.5 font-bold text-[#3159a6] bg-white outline-none" value={gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0)} onChange={(e) => setGstOverrides({...gstOverrides, [item.id]: Number(e.target.value)})}> 
                                                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="p-5 text-center">{selectedItemIds.includes(item.id) && (<input type="number" className="border-2 border-blue-100 rounded-xl p-1.5 w-24 text-right outline-none focus:border-[#3159a6] font-bold" placeholder="0" value={itemDiscounts[item.id] || ''} onChange={(e) => setItemDiscounts({...itemDiscounts, [item.id]: Number(e.target.value)})}/>)}</td>
                                    <td className="p-5 text-right font-black text-gray-900 text-lg">₹{item.price.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">
                        <Wrench size={14}/> Manual Service / Non-Inventory Entry
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                        <div className="md:col-span-2">
                            <input className="w-full border-2 border-white rounded-xl p-3 text-sm font-bold outline-none focus:border-[#3159a6]" placeholder="Description (e.g. Shell Repair: / Service:)" value={tempManual.model} onChange={e=>setTempManual({...tempManual, model: e.target.value})} />
                        </div>
                        <div>
                            <input className="w-full border-2 border-white rounded-xl p-3 text-sm font-mono outline-none focus:border-[#3159a6]" placeholder="HSN (9987)" value={tempManual.hsn} onChange={e=>setTempManual({...tempManual, hsn: e.target.value})} />
                        </div>
                        <div>
                            <input type="number" className="w-full border-2 border-white rounded-xl p-3 text-sm font-bold outline-none focus:border-[#3159a6]" placeholder="Rate" value={tempManual.price || ''} onChange={e=>setTempManual({...tempManual, price: Number(e.target.value)})} />
                        </div>
                        <div className="flex gap-2">
                            <select className="border-2 border-white rounded-xl p-3 text-xs font-bold outline-none flex-1" value={tempManual.gst} onChange={e=>setTempManual({...tempManual, gst: Number(e.target.value)})}>
                                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                            </select>
                            <button onClick={handleAddManualItem} className="bg-[#3159a6] text-white p-3 rounded-xl hover:bg-slate-800 transition shadow-lg"><PackagePlus size={20}/></button>
                        </div>
                    </div>

                    {manualItems.length > 0 && (
                        <div className="space-y-2 mt-4">
                            {manualItems.map(item => (
                                <div key={item.hearingAidId} className="flex justify-between items-center bg-white p-3 px-5 rounded-xl border border-slate-100 shadow-sm animate-fade-in">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800 uppercase">{item.model}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">HSN: {item.hsnCode} • GST: {item.gstRate}%</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-black text-[#3159a6]">₹{item.price.toLocaleString()}</span>
                                        <button onClick={() => handleRemoveManualItem(item.hearingAidId)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Invoice Date</label><input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl font-bold outline-none shadow-sm" /></div>
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Global Adjustment</label><input type="number" value={totalAdjustment || ''} onChange={e => setTotalAdjustment(Number(e.target.value))} className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xl text-[#3159a6] outline-none shadow-sm" placeholder="0.00" /></div>
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Warranty Period</label><input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl font-bold outline-none shadow-sm" /></div>
                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-50"><label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1"><MessageSquare size={12}/> Remarks</label><textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} className="w-full border-2 border-white bg-white p-3 rounded-xl text-xs h-16 resize-none outline-none shadow-sm" placeholder="Internal clinical notes..." /></div>
                </div>
                <div className="mt-8 flex justify-between items-center bg-gray-50 p-8 rounded-3xl border-2 border-blue-50 shadow-inner">
                    <div><p className="text-[10px] font-black text-[#3159a6] uppercase tracking-[0.2em] mb-1">Estimated Net Payable</p><p className="text-4xl font-black text-gray-900 tracking-tighter">₹{finalTotal.toLocaleString('en-IN')}</p></div>
                    <button onClick={() => setStep('payment')} className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs">Proceed to Settlement &rarr;</button>
                </div>
            </div>
        )}

        {step === 'payment' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 p-10 animate-fade-in print:hidden">
                <h3 className="text-xs font-black text-[#3159a6] uppercase tracking-[0.3em] mb-10 border-b-2 border-blue-50 pb-4">Phase 3: Financial Settlement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="md:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-blue-50/50 rounded-3xl border-2 border-blue-50 shadow-inner"><label className="block text-[10px] font-black text-[#3159a6] uppercase tracking-widest mb-4 ml-1">Immediate Collection (INR)</label><div className="relative"><IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3159a6]" size={24} /><input type="number" className="w-full pl-12 pr-4 py-5 border-2 border-white bg-white rounded-2xl outline-none focus:border-[#3159a6] text-3xl font-black text-gray-800 shadow-sm" value={initialPayment || ''} onChange={e => setInitialPayment(Number(e.target.value))} placeholder="0.00" /></div></div>
                            <div className="p-8 bg-white rounded-3xl border-2 border-gray-50 space-y-5">
                                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Mode</label><select className="w-full border-2 border-gray-50 rounded-2xl p-4 outline-none focus:border-[#3159a6] font-black text-gray-700 bg-gray-50 transition" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Account Transfer">Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="EMI">EMI</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Debit Card">Debit Card</option>
                                </select>
                                </div>
                                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Account</label><select className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-[#3159a6] font-black text-[#3159a6] bg-gray-50 transition" value={paymentBank} onChange={e => setPaymentBank(e.target.value)}><option value="">-- No Bank (Cash) --</option>{COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}</select></div>
                            </div>
                        </div>
                        {patientAdvances.length > 0 && (
                            <div className="bg-amber-50/50 rounded-3xl border-2 border-amber-100 p-8">
                                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.3em] mb-5 ml-1">Unclaimed Advance Tokens</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{patientAdvances.map(adv => (<div key={adv.id} className="flex items-center justify-between bg-white p-5 rounded-2xl border-2 border-amber-100 shadow-sm transition-all hover:border-amber-400"><div><p className="font-black text-amber-900 text-lg">₹{adv.amount.toLocaleString()}</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{adv.date}</p></div><button onClick={() => handleApplyAdvance(adv)} className="px-6 py-2 bg-amber-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-amber-700 transition active:scale-95 shadow-lg shadow-amber-900/10">Apply</button></div>))}</div>
                            </div>
                        )}
                        {existingPayments.length > 0 && (
                            <div className="bg-green-50/50 rounded-3xl border-2 border-green-100 p-8">
                                <h4 className="text-[10px] font-black text-green-800 uppercase tracking-[0.3em] mb-5 ml-1">Payment Accumulation</h4>
                                <div className="space-y-3">{existingPayments.map(p => (<div key={p.id} className="flex justify-between items-center text-sm bg-white px-5 py-3 rounded-xl border-2 border-green-50 shadow-sm"><span className="text-green-900 font-black uppercase tracking-widest text-[10px]">{p.method} {p.note ? `[${p.note}]` : ''}</span><span className="font-black text-green-900 text-lg">₹{p.amount.toLocaleString()}</span></div>))}</div>
                            </div>
                        )}
                    </div>
                    <div className="p-8 bg-[#3159a6] rounded-[2.5rem] shadow-2xl shadow-blue-900/40 flex flex-col justify-center items-center text-center h-full relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none -rotate-12 translate-y-12 scale-150"></div><p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.4em] mb-4 relative z-10">Outstanding Balance</p><p className="text-5xl font-black text-white tracking-tighter relative z-10">₹{(finalTotal - totalPaidSoFar).toLocaleString()}</p></div>
                </div>
                <div className="mt-12 flex justify-end"><button onClick={() => setStep('review')} className="bg-[#3159a6] text-white px-16 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/30 hover:bg-slate-800 transition-all text-xs">Review Digital Draft &rarr;</button></div>
            </div>
        )}

        {step === 'review' && (
            <div className="flex flex-col items-center bg-gray-200/50 p-4 sm:p-10 min-h-screen print:bg-white print:p-0 print:block">
                {/* Print Control Panel - Hidden on Print */}
                <div className="bg-white p-6 rounded-3xl shadow-xl mb-8 flex flex-wrap items-center gap-8 border border-gray-100 print:hidden w-full max-w-[900px]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-primary"><Settings2 size={18}/></div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">PDF Print Configuration</h4>
                    </div>
                    
                    <div className="flex items-center gap-4 border-l pl-8">
                        <label className="text-[10px] font-black uppercase text-gray-400">Scale</label>
                        <input 
                            type="range" min="60" max="100" value={printScale} 
                            onChange={(e) => setPrintScale(Number(e.target.value))}
                            className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                        />
                        <span className="text-xs font-black text-primary w-8">{printScale}%</span>
                    </div>

                    <div className="flex items-center gap-4 border-l pl-8">
                        <label className="text-[10px] font-black uppercase text-gray-400">Layout</label>
                        <select 
                            className="text-[10px] font-black uppercase tracking-widest border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                            value={printOrientation} onChange={(e) => setPrintOrientation(e.target.value as any)}
                        >
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 border-l pl-8">
                        <label className="text-[10px] font-black uppercase text-gray-400">Size</label>
                        <select 
                            className="text-[10px] font-black uppercase tracking-widest border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                            value={printPaperSize} onChange={(e) => setPrintPaperSize(e.target.value as any)}
                        >
                            <option value="A4">A4 Paper</option>
                            <option value="Letter">Letter</option>
                            <option value="Legal">Legal</option>
                        </select>
                    </div>
                </div>

                <div 
                    id="invoice-printable-area" 
                    style={{ 
                        '--print-scale': `${printScale / 100}`,
                        '--print-orientation': printOrientation,
                        '--print-size': printPaperSize === 'A4' ? '210mm 297mm' : printPaperSize === 'Letter' ? '216mm 279mm' : '216mm 356mm'
                    } as React.CSSProperties}
                    className="bg-white shadow-2xl relative overflow-hidden animate-fade-in mx-auto w-full max-w-[900px] p-[10mm] flex flex-col print:max-w-none print:shadow-none print:p-0 print:m-0"
                >
                    
                    <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-6">
                        <div className="flex items-center gap-6">
                            <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="bg-[#3159a6] text-white px-6 py-2 mb-3 rounded-lg">
                                <h2 className="text-lg font-black uppercase tracking-widest text-center">Tax Invoice</h2>
                            </div>
                            <p className="text-sm font-black text-slate-900 uppercase"># {editingInvoiceId || generateNextId()}</p>
                            <p className="text-[11px] font-black text-slate-700 uppercase mt-1 tracking-widest">DATE: {new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Client Details</h4>
                            <p className="font-black text-xl text-slate-900 uppercase tracking-tight leading-none mb-1">{patient.name}</p>
                            <p className="font-bold text-slate-900 text-sm mb-2">{patient.phone} • {patient.district}, {patient.state}</p>
                            <p className="text-xs text-slate-800 uppercase font-semibold leading-relaxed min-h-[40px]">{patient.address || 'No Address Provided'}</p>
                            
                            <div className="mt-4 pt-3 border-t-2 border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
                                <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Referred By</p><p className="text-xs font-black text-slate-900 uppercase">{patient.referDoctor || 'Self'}</p></div>
                                <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Audiologist</p><p className="text-xs font-black text-[#3159a6] uppercase">{patient.audiologist || 'Internal'}</p></div>
                                <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Sale Type</p><p className={`text-xs font-black uppercase ${isInterState ? 'text-orange-600' : 'text-slate-900'}`}>{isInterState ? 'Inter-State (IGST)' : 'Intra-State'}</p></div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex flex-col justify-between">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 border-b-2 border-slate-200 pb-1 tracking-widest">Billing Info</h4>
                                <p className="font-black text-[12px] text-slate-900 uppercase tracking-tight mb-1">{COMPANY_NAME}</p>
                                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">{COMPANY_ADDRESS}</p>
                                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">PAN: AALCB1534C | PH: {COMPANY_PHONES}</p>
                                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-tight">{COMPANY_EMAIL} | GSTIN: {CLINIC_GSTIN}</p>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t-2 border-slate-200">
                                <h5 className="text-[10px] font-black uppercase text-[#3159a6] tracking-[0.2em] mb-1">Bank Settlement Details:</h5>
                                <div className="grid grid-cols-2 text-[10px] uppercase font-black text-slate-800">
                                    <p>SBI ACC: <span className="text-slate-900">42367906742</span></p>
                                    <p className="text-right">IFSC: SBIN0001357</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <table className="w-full border-collapse border-4 border-slate-900 text-[12px]">
                            <thead className="bg-[#3159a6] text-white uppercase font-black tracking-tight">
                                <tr>
                                    <th className="p-3 text-left border-r-2 border-white/20 w-[30%]">Description of Goods</th>
                                    <th className="p-3 text-center border-r-2 border-white/20 w-[15%]">HSN Code</th>
                                    <th className="p-3 text-right border-r-2 border-white/20 w-[15%]">Price (INR)</th>
                                    <th className="p-3 text-center border-r-2 border-white/20 w-[10%]">GST %</th>
                                    {isInterState ? (
                                        <th className="p-3 text-right border-r-2 border-white/20 w-[15%]">IGST</th>
                                    ) : (
                                        <th className="p-3 text-right border-r-2 border-white/20 w-[15%]">C+S GST</th>
                                    )}
                                    <th className="p-3 text-right w-[15%]">Total Value</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-slate-900">
                                {allInvoiceItems.map(item => (
                                    <tr key={item.hearingAidId} className="border-b-2 border-slate-400 last:border-b-4 last:border-slate-900">
                                        <td className="p-2 border-r-2 border-slate-900">
                                            <p className="font-black text-slate-900 uppercase text-[12px] tracking-tight">{item.brand} {item.model}</p>
                                            <p className="text-[10px] text-[#3159a6] font-black uppercase tracking-[0.3em] mt-1">
                                                {item.serialNumber === 'N/A' ? 'PROCEDURE' : `S/N: ${item.serialNumber}`}
                                            </p>
                                        </td>
                                        <td className="p-2 text-center border-r-2 border-slate-900 font-mono text-[10px]">{item.hsnCode || '90214090'}</td>
                                        <td className="p-2 text-right border-r-2 border-slate-900 font-mono">₹{item.taxableValue.toLocaleString()}</td>
                                        <td className="p-2 text-center border-r-2 border-slate-900">{item.gstRate}%</td>
                                        <td className="p-2 text-right border-r-2 border-slate-900 text-slate-500">
                                            {isInterState ? `₹${item.igstAmount.toFixed(2)}` : `₹${(item.cgstAmount + item.sgstAmount).toFixed(2)}`}
                                        </td>
                                        <td className="p-2 text-right font-black bg-slate-50/50">₹{item.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6 items-start">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-[#3159a6] mb-1 tracking-[0.2em]">GST Analysis ({isInterState ? 'Inter-State' : 'Intra-State'})</h4>
                                <table className="w-full border-collapse border-2 border-slate-900 text-[10px] text-center">
                                    <thead className="bg-slate-100 font-black text-slate-800">
                                        <tr className="border-b-2 border-slate-900">
                                            <th className="p-1.5 text-left border-r-2 border-slate-900">Rate</th>
                                            <th className="p-1.5 text-right border-r-2 border-slate-900">Taxable</th>
                                            {isInterState ? (
                                                <th className="p-1.5 text-right">IGST</th>
                                            ) : (
                                                <>
                                                    <th className="p-1.5 text-right border-r-2 border-slate-900">CGST</th>
                                                    <th className="p-1.5 text-right">SGST</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold text-slate-900 uppercase">
                                        {Object.entries(gstSummary).map(([rate, vals]: any) => (
                                            <tr key={rate} className="border-b-2 border-slate-200 last:border-b-0">
                                                <td className="p-1.5 text-left font-black bg-slate-50 border-r-2 border-slate-900">{rate}% GST</td>
                                                <td className="p-1.5 text-right border-r-2 border-slate-900">₹{vals.taxable.toFixed(2)}</td>
                                                {isInterState ? (
                                                    <td className="p-1.5 text-right font-black text-[#3159a6]">₹{vals.igst.toFixed(2)}</td>
                                                ) : (
                                                    <>
                                                        <td className="p-1.5 text-right border-r-2 border-slate-900">₹{vals.cgst.toFixed(2)}</td>
                                                        <td className="p-1.5 text-right">₹{vals.sgst.toFixed(2)}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="bg-red-50 p-4 rounded-2xl border-4 border-white shadow-lg text-center">
                                <p className="text-[10px] font-black text-red-700 uppercase tracking-[0.3em] mb-1">Current Outstanding Balance</p>
                                <p className="text-3xl font-black text-red-600 tracking-tighter leading-none">₹{(finalTotal - totalPaidSoFar).toLocaleString()} /-</p>
                                
                                <div className="mt-3 pt-3 border-t-2 border-red-200">
                                    <div className="space-y-1 text-[10px] text-left">
                                        {existingPayments.map(p => (
                                            <div key={p.id} className="flex justify-between font-bold text-slate-700 uppercase">
                                                <span>{p.method} ({new Date(p.date).toLocaleDateString('en-IN')})</span>
                                                <span>₹{p.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {initialPayment > 0 && (
                                            <div className="flex justify-between font-black text-[#3159a6] uppercase border-t border-[#3159a6]/20 pt-1">
                                                <span>{paymentMethod} (Collection)</span>
                                                <span>₹{initialPayment.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border-4 border-white shadow-xl font-bold text-slate-900">
                                <div className="flex justify-between text-[11px] uppercase text-slate-600 mb-1"><span>Gross Subtotal</span><span>₹{totalSubtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-[11px] uppercase text-red-600 mb-1"><span>Special Consideration</span><span>-₹{(totalItemDiscounts + totalAdjustment).toLocaleString()}</span></div>
                                <div className="flex justify-between text-[11px] uppercase text-slate-600 mb-3">
                                    <span>Net GST</span>
                                    <span>₹{(runningCGST + runningSGST + runningIGST).toFixed(2)}</span>
                                </div>
                                <div className="h-0.5 bg-slate-900 mb-3"></div>
                                <div className="flex justify-between items-center text-slate-900">
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Net Payable</span>
                                    <span className="text-4xl font-black tracking-tighter text-[#3159a6]">₹{Math.round(finalTotal).toLocaleString()}</span>
                                </div>
                            </div>

                            {invoiceNotes && (
                                <div className="bg-blue-50/50 p-4 border-2 border-dashed border-blue-200 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase text-[#3159a6] mb-2 border-b border-blue-100 pb-1 tracking-widest">Remarks:</h4>
                                    <p className="text-xs text-slate-800 italic leading-relaxed font-semibold uppercase">"{invoiceNotes}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#3159a6] text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 text-center shadow-lg">
                        Grand Total in Words: {numberToWords(finalTotal)}
                    </div>

                    {/* Footer Section: Managed for better printing visibility */}
                    <div className="mt-auto pt-10">
                        <div className="flex justify-between items-end">
                            <div className="w-[60%]">
                                <p className="font-black text-[11px] uppercase border-b-4 border-slate-900 inline-block mb-3 tracking-widest text-slate-900">Legal Terms & Conditions</p>
                                <div className="text-[10px] text-slate-800 font-bold space-y-1 leading-tight uppercase tracking-tight">
                                    <p>1. Please keep this Invoice safe for future correspondence.</p>
                                    <p>2. Our Udyam Registration Certificate No. UDYAM-WB-18-0032916 (Micro Enterprise)</p>
                                    <p>3. Under the current taxation regime, all healthcare services doctors and hospitals provide are exempt from GST. These exemptions were provided vide Notifications No. 12/2017-Central Tax (Rate) and 9/2017 – Integrated Tax (R) dated 28th June 2017.</p>
                                    <p>4. Hearing aids are classifiable under HSN 9021 40 90 and are exempt from GST by virtue of Sl.No 142 of Notf No 2/2017 CT(Rate) dated 28-06-2017.</p>    
                                    <p>5. Subject to jurisdiction of Courts in Kolkata, WB.</p>
                                </div>
                            </div>
                            <div className="text-center w-64">
                                {signature ? (
                                    <img src={signature} className="h-20 mb-2 mx-auto mix-blend-multiply transition-all hover:scale-110" />
                                ) : (
                                    <div className="h-16 w-full border-b-4 border-dashed border-slate-200 mb-2"></div>
                                )}
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 border-t-4 border-slate-900 pt-2">Authorized Signatory</p>
                            </div>
                        </div>

                        <div className="mt-12 text-center opacity-30 pointer-events-none pb-4 print:opacity-10">
                            <p className="text-[9px] font-black uppercase tracking-[0.7em] text-slate-600">BENGAL REHABILITATION & RESEARCH PVT. LTD.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex gap-6 w-full max-w-[900px] print:hidden">
                    <button onClick={() => setStep('payment')} className="flex-1 py-5 border-4 border-slate-800 rounded-3xl font-black uppercase tracking-widest hover:bg-white text-xs transition-all active:scale-95">Go Back</button>
                    <button onClick={handleSaveInvoice} className="flex-[2] bg-[#3159a6] text-white py-5 px-12 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 flex items-center justify-center gap-4 text-xs transition-all active:scale-95"> <Save size={22}/> Save Database Record</button>
                    <button onClick={() => window.print()} className="p-5 bg-slate-900 text-white rounded-3xl shadow-2xl hover:bg-black transition-all flex items-center justify-center active:scale-90" title="Save as PDF"><Download size={28}/></button>
                </div>
            </div>
        )}
    </div>
  );
};
