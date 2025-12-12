import React, { useState, useEffect } from 'react';
import { HearingAid, Patient, Invoice, InvoiceItem, PaymentRecord, UserRole } from '../types';
import { generateInvoiceNote } from '../services/geminiService';
import { CLINIC_GSTIN, COUNTRIES, INDIAN_STATES, COMPANY_BANK_ACCOUNTS } from '../constants';
import { User, FileText, Printer, Save, Loader2, Sparkles, Ear, Eye, Download, Plus, ArrowLeft, Edit, Search, ShieldCheck, Users, Check, CreditCard, Banknote, X, Receipt as ReceiptIcon, MapPin, PenBox, History, Globe, Landmark, Trash2, Calendar, Filter, TrendingUp } from 'lucide-react';
import { Receipt } from './Receipt';

interface BillingProps {
  inventory: HearingAid[];
  invoices?: Invoice[];
  patients: Patient[];
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

export const Billing: React.FC<BillingProps> = ({ inventory, invoices = [], patients, onCreateInvoice, onUpdateInvoice, onDelete, logo, signature, userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [step, setStep] = useState<'patient' | 'product' | 'review'>('patient');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Range Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [newPaymentBank, setNewPaymentBank] = useState<string>('');
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalInvoice, setHistoryModalInvoice] = useState<Invoice | null>(null);
  const [receiptData, setReceiptData] = useState<{ payment: PaymentRecord, invoice: Invoice } | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [patient, setPatient] = useState<Patient>({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' });
  const [placeOfSupply, setPlaceOfSupply] = useState<'Intra-State' | 'Inter-State'>('Intra-State');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>({});
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [warranty, setWarranty] = useState<string>('2 Years Standard Warranty');
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Cash');
  const [paymentBank, setPaymentBank] = useState<string>('');
  const [aiNote, setAiNote] = useState<string>('');

  useEffect(() => { if (patient.state) { setPlaceOfSupply(patient.state.toLowerCase() === 'west bengal' ? 'Intra-State' : 'Inter-State'); } }, [patient.state]);

  const resetForm = () => { setStep('patient'); setPatient({ id: '', name: '', address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '', gstin: '' }); setPlaceOfSupply('Intra-State'); setSelectedItemIds([]); setGstOverrides({}); setDiscountValue(0); setWarranty('2 Years Standard Warranty'); setAiNote(''); setEditingInvoiceId(null); setPatientSearchTerm(''); setProductSearchTerm(''); setInitialPayment(0); setPaymentMethod('Cash'); setPaymentBank(''); };

  const generateNextId = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    const yearIds = invoices.map(inv => inv.id).filter(id => id.startsWith(prefix));
    if (yearIds.length === 0) return `${prefix}001`;
    const maxSeq = yearIds.reduce((max, id) => { const parts = id.split('-'); const seq = parseInt(parts[parts.length - 1], 10); return !isNaN(seq) && seq > max ? seq : max; }, 0);
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const handleStartNew = () => { resetForm(); setViewMode('create'); };

  const handleSelectPatient = (p: Patient) => {
    setPatient({ ...p, state: p.state || 'West Bengal', country: p.country || 'India' });
    setPatientSearchTerm('');
    setShowPatientResults(false);
  };

  const handleViewEdit = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setPatient(invoice.patientDetails || { id: invoice.patientId, name: invoice.patientName, address: '', state: 'West Bengal', country: 'India', phone: '', email: '', referDoctor: '', audiologist: '' });
    setPlaceOfSupply(invoice.placeOfSupply || 'Intra-State');
    const currentItemIds = invoice.items.map(i => i.hearingAidId);
    setSelectedItemIds(currentItemIds);
    const overrides: Record<string, number> = {};
    invoice.items.forEach(i => { overrides[i.hearingAidId] = i.gstRate; });
    setGstOverrides(overrides);
    setDiscountType(invoice.discountType);
    setDiscountValue(invoice.discountValue);
    setWarranty(invoice.warranty || '2 Years Standard Warranty');
    setAiNote(invoice.notes || '');
    setViewMode('edit');
    setStep('review');
  };

  const selectedInventoryItems = inventory.filter(i => selectedItemIds.includes(i.id));
  const subtotal = selectedInventoryItems.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = discountType === 'flat' ? discountValue : (subtotal * discountValue) / 100;
  
  let runningTaxableTotal = 0, runningCGST = 0, runningSGST = 0, runningIGST = 0, runningFinalTotal = 0;
  const invoiceItems: InvoiceItem[] = selectedInventoryItems.map(item => {
      const itemRatio = subtotal > 0 ? item.price / subtotal : 0;
      const itemDiscount = discountAmount * itemRatio;
      const itemTaxable = item.price - itemDiscount;
      const gstRate = gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0);
      const taxAmount = itemTaxable * (gstRate / 100);
      const cgst = placeOfSupply === 'Intra-State' ? taxAmount / 2 : 0;
      const sgst = placeOfSupply === 'Intra-State' ? taxAmount / 2 : 0;
      const igst = placeOfSupply === 'Inter-State' ? taxAmount : 0;
      runningTaxableTotal += itemTaxable; runningCGST += cgst; runningSGST += sgst; runningIGST += igst; runningFinalTotal += (itemTaxable + taxAmount);
      return { hearingAidId: item.id, brand: item.brand, model: item.model, serialNumber: item.serialNumber, price: item.price, hsnCode: item.hsnCode, gstRate, taxableValue: itemTaxable, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, totalAmount: itemTaxable + taxAmount };
  });

  const handleSaveInvoice = () => {
    const finalId = editingInvoiceId || generateNextId();
    let payments: PaymentRecord[] = [];
    if (!editingInvoiceId && initialPayment > 0) { payments.push({ id: `PAY-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: initialPayment, method: paymentMethod, note: 'Initial Payment', bankDetails: paymentBank || undefined }); }
    const invData: Invoice = { id: finalId, patientId: patient.id || `P-${Date.now()}`, patientName: patient.name, items: invoiceItems, subtotal, discountType, discountValue, totalDiscount: discountAmount, placeOfSupply, totalTaxableValue: runningTaxableTotal, totalCGST: runningCGST, totalSGST: runningSGST, totalIGST: runningIGST, totalTax: runningCGST + runningSGST + runningIGST, finalTotal: runningFinalTotal, date: new Date().toISOString().split('T')[0], notes: aiNote, warranty, patientDetails: patient, payments: editingInvoiceId ? (invoices.find(i => i.id === editingInvoiceId)?.payments || []) : payments, balanceDue: Math.max(0, runningFinalTotal - (editingInvoiceId ? (invoices.find(i => i.id === editingInvoiceId)?.payments.reduce((s,p) => s+p.amount, 0) || 0) : initialPayment)), paymentStatus: 'Unpaid' };
    invData.paymentStatus = invData.balanceDue <= 1 ? 'Paid' : (invData.payments.length > 0 ? 'Partial' : 'Unpaid');
    if (editingInvoiceId && onUpdateInvoice) onUpdateInvoice(invData); else onCreateInvoice(invData, selectedItemIds);
    resetForm(); setViewMode('list');
  };

  const handleAddPayment = () => {
      if (!paymentModalInvoice || !onUpdateInvoice) return;
      const updatedPayments = [...paymentModalInvoice.payments, { id: `PAY-${Date.now()}`, date: newPaymentDate, amount: newPaymentAmount, method: newPaymentMethod, note: 'Payment', bankDetails: newPaymentBank || undefined }];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = Math.max(0, paymentModalInvoice.finalTotal - totalPaid);
      onUpdateInvoice({ ...paymentModalInvoice, payments: updatedPayments, balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : 'Partial' });
      setShowPaymentModal(false);
  };

  const handlePrint = () => window.print();

  // Filtered Invoices logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    // Robust date filtering: check if invoice date is within the inclusive YYYY-MM-DD range
    const matchesStartDate = !startDate || inv.date >= startDate;
    const matchesEndDate = !endDate || inv.date <= endDate;
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  // Analytics for the filtered range
  const rangeTotalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.finalTotal, 0);
  const rangeTotalPaid = filteredInvoices.reduce((sum, inv) => sum + inv.payments.reduce((s,p) => s + p.amount, 0), 0);
  const rangeTotalBalance = rangeTotalAmount - rangeTotalPaid;

  if (viewMode === 'list') {
      return (
          <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="text-primary" /> 
                      Billing & Invoices
                  </h2>
                  <button onClick={handleStartNew} className="bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-teal-800 transition-all font-bold">
                    <Plus size={20} /> Create New Invoice
                  </button>
              </div>

              {/* Advanced Filter Panel */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4 text-gray-700">
                      <Filter size={18} className="text-teal-600"/>
                      <h3 className="font-bold text-sm uppercase tracking-wider">Search & Report Filters</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Search */}
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Keyword Search</label>
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                              <input 
                                  type="text" 
                                  placeholder="Patient Name or Invoice ID..." 
                                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition bg-gray-50 border-gray-100"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                      </div>

                      {/* Date Filter */}
                      <div className="lg:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Filter by Date Range</label>
                          <div className="flex items-center gap-3">
                              <div className="flex-1 relative">
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                  <input 
                                    type="date" 
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition bg-gray-50 border-gray-100 text-sm font-medium"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                  />
                              </div>
                              <span className="text-gray-400 font-bold">to</span>
                              <div className="flex-1 relative">
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                  <input 
                                    type="date" 
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition bg-gray-50 border-gray-100 text-sm font-medium"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                  />
                              </div>
                              {(startDate || endDate) && (
                                  <button 
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
                                    title="Reset Dates"
                                  >
                                      <X size={20} />
                                  </button>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Summary Strip (Visible when filtered) */}
                  {(startDate || endDate || searchTerm) && (
                      <div className="mt-6 pt-6 border-t border-dashed border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                          <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                              <p className="text-[10px] font-black uppercase text-teal-600 mb-1">Period Sales</p>
                              <p className="text-lg font-bold text-teal-900">₹{rangeTotalAmount.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                              <p className="text-[10px] font-black uppercase text-green-600 mb-1">Period Collected</p>
                              <p className="text-lg font-bold text-green-900">₹{rangeTotalPaid.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                              <p className="text-[10px] font-black uppercase text-red-600 mb-1">Period Balance</p>
                              <p className="text-lg font-bold text-red-900">₹{rangeTotalBalance.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200">
                              <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Invoices Count</p>
                              <p className="text-lg font-bold text-gray-900">{filteredInvoices.length}</p>
                          </div>
                      </div>
                  )}
              </div>

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-black uppercase tracking-widest border-b">
                          <tr>
                            <th className="p-4">Invoice #</th>
                            <th className="p-4">Billing Date</th>
                            <th className="p-4">Patient Name</th>
                            <th className="p-4 text-right">Total Amount</th>
                            <th className="p-4 text-right">Paid</th>
                            <th className="p-4 text-right">Balance Due</th>
                            <th className="p-4 text-center">Payment Status</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {filteredInvoices.length === 0 ? (
                              <tr><td colSpan={8} className="p-20 text-center text-gray-400 italic">No invoices found matching your criteria.</td></tr>
                          ) : filteredInvoices.map(inv => {
                              const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                              return (
                              <tr key={inv.id} className="hover:bg-teal-50/30 transition-colors group">
                                  <td className="p-4 font-mono text-sm text-teal-700 font-bold">{inv.id}</td>
                                  <td className="p-4 text-sm text-gray-600">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                                  <td className="p-4 font-bold text-gray-900">{inv.patientName}</td>
                                  <td className="p-4 text-right font-bold text-gray-900">₹{inv.finalTotal.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-right text-green-700 font-medium">₹{totalPaid.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-right text-red-600 font-black">₹{inv.balanceDue.toLocaleString('en-IN')}</td>
                                  <td className="p-4 text-center">
                                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border ${
                                          inv.paymentStatus === 'Paid' 
                                          ? 'bg-green-100 text-green-700 border-green-200' 
                                          : inv.paymentStatus === 'Partial' 
                                          ? 'bg-orange-100 text-orange-700 border-orange-200' 
                                          : 'bg-red-50 text-red-700 border-red-200'
                                      }`}>
                                        {inv.paymentStatus}
                                      </span>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleViewEdit(inv)} className="p-2 text-teal-600 hover:bg-white hover:shadow-sm rounded-lg" title="View/Edit Invoice"><Eye size={18}/></button>
                                        <button onClick={() => { setPaymentModalInvoice(inv); setNewPaymentAmount(inv.balanceDue); setShowPaymentModal(true); }} disabled={inv.balanceDue <= 0} className="p-2 text-green-600 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-20" title="Record Payment"><CreditCard size={18}/></button>
                                        <button onClick={() => { setHistoryModalInvoice(inv); setShowHistoryModal(true); }} className="p-2 text-blue-600 hover:bg-white hover:shadow-sm rounded-lg" title="Transaction History"><History size={18}/></button>
                                        {userRole === 'admin' && onDelete && (
                                            <button onClick={() => { if(window.confirm(`Permanently delete invoice ${inv.id}? Items will be restocked.`)) onDelete(inv.id); }} className="p-2 text-red-400 hover:text-red-700 hover:bg-white hover:shadow-sm rounded-lg" title="Delete Permanent"><Trash2 size={18}/></button>
                                        )}
                                      </div>
                                  </td>
                              </tr>
                          )})}
                      </tbody>
                  </table>
              </div>
              
              {/* Payment Modals - Unchanged logic */}
              {showPaymentModal && paymentModalInvoice && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                          <div className="bg-primary p-5 text-white flex justify-between items-center"><h3 className="font-bold">Record Payment: {paymentModalInvoice.id}</h3><button onClick={() => setShowPaymentModal(false)}><X/></button></div>
                          <div className="p-8 space-y-5">
                              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Balance Due</label><p className="text-3xl font-black text-red-600">₹{paymentModalInvoice.balanceDue.toLocaleString('en-IN')}</p></div>
                              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount Received (INR)</label><input type="number" value={newPaymentAmount} onChange={e => setNewPaymentAmount(Number(e.target.value))} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold text-xl focus:border-teal-500 outline-none" /></div>
                              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Collection Account</label><select className="w-full border-2 border-gray-100 p-3 rounded-xl bg-white focus:border-teal-500 outline-none text-sm font-medium" value={newPaymentBank} onChange={e => setNewPaymentBank(e.target.value)}><option value="">Select Company Bank...</option>{COMPANY_BANK_ACCOUNTS.map(b => <option key={b.accountNumber} value={b.name}>{b.name}</option>)}</select></div>
                              <button onClick={handleAddPayment} className="w-full bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition-all shadow-xl shadow-green-900/20 uppercase tracking-widest text-sm">Confirm & Issue Receipt</button>
                          </div>
                      </div>
                  </div>
              )}
              
              {showHistoryModal && historyModalInvoice && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                          <div className="bg-gray-100 p-5 border-b flex justify-between items-center"><h3 className="font-bold text-gray-800">Payment Timeline: {historyModalInvoice.id}</h3><button onClick={() => setShowHistoryModal(false)}><X/></button></div>
                          <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
                              {historyModalInvoice.payments.length === 0 ? (
                                <p className="text-center text-gray-400 py-10 italic">No payments recorded for this invoice.</p>
                              ) : historyModalInvoice.payments.map(p => (
                                  <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                                      <div><p className="font-black text-gray-800 text-lg">₹{p.amount.toLocaleString('en-IN')}</p><p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{new Date(p.date).toDateString()} via {p.method}</p></div>
                                      <button onClick={() => setReceiptData({ payment: p, invoice: historyModalInvoice })} className="text-teal-600 hover:bg-teal-100 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 border border-teal-200"><Printer size={14}/> Receipt</button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
              {receiptData && <Receipt payment={receiptData.payment} invoice={receiptData.invoice} onClose={() => setReceiptData(null)} logo={logo} signature={signature} />}
          </div>
      );
  }

  // Invoice creation steps UI... (same as previous optimized version)
  return (
    <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-5">
              <button onClick={() => setViewMode('list')} className="p-2.5 bg-white shadow-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600"><ArrowLeft size={24} /></button>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingInvoiceId ? 'Modify' : 'New'} Sales Invoice</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{editingInvoiceId || 'System Generated ID'}</p>
              </div>
            </div>
            <div className="flex gap-2 bg-gray-200 p-1 rounded-2xl">
                {['patient', 'product', 'review'].map((s, idx) => (
                    <button key={s} onClick={() => setStep(s as any)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${step === s ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}>{idx+1}. {s}</button>
                ))}
            </div>
        </div>

        {step === 'patient' && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in-up print:hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-black">1</div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase">Patient Information</h3>
                </div>
                
                <div className="mb-10 relative">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Lookup Patient Directory</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Start typing name or phone number..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-sm font-medium"
                            value={patientSearchTerm}
                            onChange={(e) => {
                                setPatientSearchTerm(e.target.value);
                                setShowPatientResults(true);
                            }}
                        />
                    </div>
                    {showPatientResults && patientSearchTerm && (
                        <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-64 overflow-y-auto divide-y divide-gray-50">
                            {patients
                                .filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || p.phone.includes(patientSearchTerm))
                                .map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className="w-full text-left px-5 py-4 hover:bg-teal-50 flex justify-between items-center transition-colors group"
                                    >
                                        <div>
                                            <p className="font-black text-gray-800 group-hover:text-teal-900">{p.name}</p>
                                            <p className="text-xs text-gray-500 font-bold">{p.phone}</p>
                                        </div>
                                        <span className="text-teal-600 text-[10px] bg-teal-50 px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-teal-100">Load Details</span>
                                    </button>
                                ))
                            }
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name *</label>
                        <input required className="w-full border border-gray-200 rounded-xl p-3 focus:border-teal-500 outline-none" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number *</label>
                        <input required className="w-full border border-gray-200 rounded-xl p-3 focus:border-teal-500 outline-none" value={patient.phone} onChange={e => setPatient({...patient, phone: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Residential Address</label>
                        <input className="w-full border border-gray-200 rounded-xl p-3 focus:border-teal-500 outline-none" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} />
                    </div>
                </div>
                <div className="mt-12 flex justify-end">
                  <button onClick={() => setStep('product')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-teal-900/20 hover:bg-teal-800 hover:-translate-y-0.5 transition-all">Proceed to Device Selection &rarr;</button>
                </div>
            </div>
        )}

        {step === 'product' && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in-up print:hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-black">2</div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase">Product & Tax Config</h3>
                </div>

                <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-2xl mb-8 shadow-inner bg-gray-50">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white sticky top-0 shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <tr><th className="p-4 w-12"></th><th className="p-4">Brand / Model</th><th className="p-4">Serial Number</th><th className="p-4">Tax %</th><th className="p-4 text-right">Base Price</th></tr>
                      </thead>
                        <tbody className="divide-y divide-gray-100">
                          {inventory.filter(i => i.status === 'Available' || selectedItemIds.includes(i.id)).map(item => (
                            <tr key={item.id} className={selectedItemIds.includes(item.id) ? 'bg-teal-50' : 'hover:bg-white transition-colors'}>
                                <td className="p-4 text-center">
                                  <input 
                                    type="checkbox" 
                                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                    checked={selectedItemIds.includes(item.id)} 
                                    onChange={() => { if(selectedItemIds.includes(item.id)) setSelectedItemIds(selectedItemIds.filter(id => id !== item.id)); else setSelectedItemIds([...selectedItemIds, item.id]); }} 
                                  />
                                </td>
                                <td className="p-4"><p className="font-black text-gray-800">{item.brand}</p><p className="text-xs text-gray-500">{item.model}</p></td>
                                <td className="p-4 font-mono text-[11px] text-gray-400 font-bold">{item.serialNumber}</td>
                                <td className="p-4">
                                    {selectedItemIds.includes(item.id) && (
                                        <select 
                                            className="border-2 border-gray-100 rounded-lg p-1.5 text-[11px] font-black uppercase tracking-tighter bg-white focus:border-teal-500 outline-none"
                                            value={gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : (item.gstRate || 0)}
                                            onChange={(e) => setGstOverrides({...gstOverrides, [item.id]: Number(e.target.value)})}
                                        >
                                            <option value="0">Exempt (0%)</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    )}
                                </td>
                                <td className="p-4 text-right font-black text-gray-900">₹{item.price.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14}/> Special Consideration (Adjustment)</label>
                      <div className="flex gap-3">
                        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm" value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
                          <option value="flat">₹ Flat</option>
                          <option value="percent">% Percent</option>
                        </select>
                        <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="flex-1 border border-gray-200 rounded-xl p-3 font-black text-lg focus:border-teal-500 outline-none bg-white" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Warranty Information</label>
                      <input type="text" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3.5 focus:border-teal-500 outline-none bg-white font-medium" />
                    </div>
                </div>

                <div className="mt-12 flex justify-between items-center bg-teal-900 p-8 rounded-[2rem] text-white">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Final Payable Amount</p>
                      <p className="text-4xl font-black">₹{runningFinalTotal.toLocaleString('en-IN')}</p>
                    </div>
                    <button onClick={() => setStep('review')} className="bg-white text-teal-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-teal-50 transition-all scale-110">Review Document &rarr;</button>
                </div>
            </div>
        )}

        {step === 'review' && (
            <div id="invoice-printable-area" className="bg-white rounded-xl shadow-2xl p-12 border border-gray-200 relative overflow-hidden animate-fade-in">
                {/* Official Invoice Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                    <div className="flex gap-6">
                        <div className="h-24 w-24 flex items-center justify-center bg-white"><img src={logo} alt="Logo" className="h-full object-contain" /></div>
                        <div>
                          <h1 className="text-2xl font-black text-gray-800 uppercase leading-tight tracking-tighter">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1>
                          <p className="text-xs text-gray-500 font-black mt-2 tracking-tight uppercase opacity-70">West Bengal's Premier Hearing & Speech Network</p>
                          <div className="mt-4 flex flex-col gap-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GSTIN: <span className="text-gray-700">19AALCB1534C1ZY</span></p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UDYAM: <span className="text-gray-700">WB-18-0032916</span></p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LOC: <span className="text-gray-700">KOLKATA - 700138</span></p>
                          </div>
                        </div>
                    </div>
                    <div className="text-right">
                      <div className="border-4 border-gray-800 px-6 py-2 inline-block mb-4">
                        <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Tax Invoice</h2>
                      </div>
                      <p className="text-sm font-black text-gray-900 mt-1"># {editingInvoiceId || generateNextId()}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Recipient Details</h4>
                        <p className="font-black text-xl text-gray-900 leading-none mb-2">{patient.name}</p>
                        <p className="text-sm font-bold text-gray-600 mb-4">{patient.phone}</p>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium uppercase">{patient.address}</p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Reference Doctor</h4>
                            <p className="text-sm font-black text-gray-800 uppercase">{patient.referDoctor || 'Self'}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Audiologist</h4>
                            <p className="text-sm font-black text-teal-700 uppercase">{patient.audiologist || 'In-House'}</p>
                          </div>
                        </div>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead className="bg-gray-800 text-white uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="p-4 text-left rounded-tl-xl">Device Description</th>
                        <th className="p-4 text-center">HSN</th>
                        <th className="p-4 text-center">GST%</th>
                        <th className="p-4 text-right rounded-tr-xl">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 border-x border-b border-gray-200">
                      {invoiceItems.map(item => (
                        <tr key={item.hearingAidId}>
                          <td className="p-5">
                            <p className="font-black text-gray-900 uppercase text-sm">{item.brand} {item.model}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">S/N: {item.serialNumber}</p>
                          </td>
                          <td className="p-5 text-center font-mono text-gray-600">{item.hsnCode || '902140'}</td>
                          <td className="p-5 text-center font-black text-gray-800">{item.gstRate}%</td>
                          <td className="p-5 text-right font-black text-gray-900">₹{item.price.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-12">
                    <div className="w-full md:w-1/2 space-y-3 bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                        <div className="flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                          <span>Sub-Total Gross</span>
                          <span className="text-gray-800 font-black">₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500 text-[10px] font-black uppercase tracking-widest">
                          <span>Special Consideration</span>
                          <span className="font-black">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                          <span>Applicable GST Tax</span>
                          <span className="text-gray-800 font-black">₹{(runningCGST + runningSGST + runningIGST).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-px bg-gray-200 my-4"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 font-black text-sm uppercase tracking-[0.2em]">Net Grand Total</span>
                          <span className="text-3xl font-black text-teal-900">₹{runningFinalTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-4 border-gray-100 p-6 rounded-3xl mb-12">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Total Amount in Words</p>
                   <p className="text-sm font-black text-gray-800 uppercase italic">Rupees {numberToWords(runningFinalTotal)}</p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-12 mt-16 pt-12 border-t border-gray-100">
                    <div className="w-full md:w-3/5">
                        <p className="font-black text-[10px] uppercase tracking-widest text-gray-800 mb-4 border-b-2 border-gray-800 inline-block">Terms & Legal Declarations</p>
                        <div className="text-[9px] text-gray-500 font-bold space-y-2 leading-relaxed uppercase">
                            <p>1. Please retain this original invoice for all future service and warranty claims.</p>
                            <p>2. Bengal Rehabilitation Group is a registered Micro Enterprise (Udyam-WB-18-0032916).</p>
                            <p>3. Healthcare services provided by clinics and hospitals are exempt from GST as per Notification No. 12/2017-Central Tax.</p>
                            <p>4. Hearing aids are classified under HSN 9021 40 90 and are specifically exempt from GST per Sl. No 142 of Notification No 2/2017 CT (Rate).</p>
                            <p>5. All sales are final. Disputes are subject to Kolkata Jurisdiction.</p>
                        </div>
                    </div>
                    <div className="text-center group">
                        {signature ? (
                          <div className="h-20 mb-4 flex items-end justify-center">
                              <img src={signature} alt="Sign" className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" />
                          </div>
                        ) : (
                          <div className="h-20 w-48 border-b-2 border-dashed border-gray-300 mb-4"></div>
                        )}
                        <p className="text-[10px] font-black uppercase text-gray-800 tracking-[0.2em]">Authorized Signatory</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">BRRPL Digital Verification</p>
                    </div>
                </div>

                <div className="mt-16 flex gap-4 print:hidden">
                    <button onClick={() => setStep('product')} className="flex-1 py-4 border-2 border-gray-800 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-colors text-sm">Modify Data</button>
                    <button onClick={handleSaveInvoice} className="flex-[2] bg-primary text-white py-4 px-12 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-teal-900/40 hover:bg-teal-800 flex items-center justify-center gap-3 text-sm transition-transform active:scale-95">
                      <Save size={20}/> {editingInvoiceId ? 'Update Record' : 'Finalize & Save Invoice'}
                    </button>
                    <button onClick={handlePrint} className="p-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:bg-black transition-colors"><Printer/></button>
                </div>
            </div>
        )}
    </div>
  );
};