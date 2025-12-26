
import React, { useState, useMemo } from 'react';
import { Invoice, PaymentRecord, UserRole } from '../types';
import { COMPANY_BANK_ACCOUNTS } from '../constants';
import { Search, Receipt as ReceiptIcon, Eye, Plus, X, Trash2, Edit, Download, Calendar } from 'lucide-react';
import { Receipt } from './Receipt';

interface ReceiptsManagerProps {
  invoices: Invoice[];
  logo: string;
  signature: string | null;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onDeleteReceipt?: (invoiceId: string, paymentId: string) => void;
  userRole: UserRole;
}

interface FlatReceipt extends PaymentRecord {
  invoiceId: string;
  patientName: string;
  invoice: Invoice;
}

export const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({ invoices, logo, signature, onUpdateInvoice, onDeleteReceipt, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<FlatReceipt | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<FlatReceipt | null>(null);

  // Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentRecord['method']>('Cash');
  const [bankDetails, setBankDetails] = useState('');
  const [note, setNote] = useState('');

  const allReceipts: FlatReceipt[] = useMemo(() => {
    const receipts: FlatReceipt[] = [];
    (invoices || []).forEach(inv => {
      (inv.payments || []).forEach(pay => {
        receipts.push({ ...pay, invoiceId: inv.id, patientName: inv.patientName, invoice: inv });
      });
    });
    return receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  const filteredReceipts = useMemo(() => {
    return allReceipts.filter(r => {
      const matchSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStart = !startDate || r.date >= startDate;
      const matchesEnd = !endDate || r.date <= endDate;
      return matchSearch && matchesStart && matchesEnd;
    });
  }, [allReceipts, searchTerm, startDate, endDate]);

  const exportToCSV = () => {
    const headers = ['Receipt No', 'Date', 'Invoice Ref', 'Patient Name', 'Amount', 'Method', 'Bank Node', 'Memo'];
    const rows = filteredReceipts.map(r => [
      r.id,
      r.date,
      r.invoiceId,
      `"${r.patientName}"`,
      r.amount.toFixed(2),
      r.method,
      r.bankDetails || 'Direct',
      `"${r.note || ''}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `receipts_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setSelectedInvoiceId('');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setMethod('Cash');
    setBankDetails('');
    setNote('');
    setEditingReceipt(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (receipt: FlatReceipt) => {
    setEditingReceipt(receipt);
    setSelectedInvoiceId(receipt.invoiceId);
    setAmount(receipt.amount);
    setDate(receipt.date);
    setMethod(receipt.method);
    setBankDetails(receipt.bankDetails || '');
    setNote(receipt.note || '');
    setShowCreateModal(true);
  };

  const handleSaveReceipt = () => {
      if (!selectedInvoiceId || amount < 0 || !onUpdateInvoice) return;
      
      const targetInvoice = invoices.find(i => i.id === selectedInvoiceId);
      if (!targetInvoice) return;

      let updatedPayments: PaymentRecord[];

      if (editingReceipt) {
        updatedPayments = targetInvoice.payments.map(p => 
          p.id === editingReceipt.id 
            ? { ...p, amount, date, method, note: note || "", bankDetails: bankDetails || "" } 
            : p
        );
      } else {
        const newPayment: PaymentRecord = { 
          id: `PAY-${Date.now()}`, 
          date, 
          amount, 
          method, 
          note: note || "", 
          bankDetails: bankDetails || "" 
        };
        updatedPayments = [...targetInvoice.payments, newPayment];
      }

      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = Math.max(0, targetInvoice.finalTotal - totalPaid);
      
      onUpdateInvoice({ 
        ...targetInvoice, 
        payments: updatedPayments, 
        balanceDue, 
        paymentStatus: balanceDue <= 1 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid') 
      });

      setShowCreateModal(false);
      resetForm();
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ReceiptIcon className="text-primary" /> Collection Registry</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Payment & Receipt Ledger</p>
        </div>
        <div className="flex gap-2">
            <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow hover:bg-green-700 transition uppercase text-[10px] tracking-widest"><Download size={18} /> Export CSV</button>
            {userRole === 'admin' && onUpdateInvoice && (
                <button onClick={handleOpenCreate} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow hover:bg-teal-800 transition uppercase text-[10px] tracking-widest"><Plus size={20} /> New Receipt</button>
            )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:grid md:grid-cols-3 items-center gap-4">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search by ID, Patient or Invoice..." className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 col-span-2 w-full">
            <Calendar size={16} className="text-gray-400 ml-2"/>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Received Date:</span>
            <input type="date" className="bg-transparent text-xs font-bold outline-none" value={startDate} onChange={e=>setStartDate(e.target.value)} />
            <span className="text-gray-300">-</span>
            <input type="date" className="bg-transparent text-xs font-bold outline-none" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            {(startDate || endDate) && <button onClick={()=>{setStartDate(''); setEndDate('');}} className="text-red-500 p-1"><X size={14}/></button>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 font-black text-[10px] uppercase tracking-widest border-b">
                  <tr><th className="p-4">Receipt No</th><th className="p-4">Date</th><th className="p-4">Invoice Ref</th><th className="p-4">Patient Name</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y text-sm">
                  {filteredReceipts.length === 0 ? (
                      <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">No collection records found.</td></tr>
                  ) : filteredReceipts.map(receipt => (
                      <tr key={receipt.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-mono text-xs text-teal-700 font-bold">{receipt.id}</td>
                          <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(receipt.date).toLocaleDateString('en-IN')}</td>
                          <td className="p-4 text-gray-500 font-medium">{receipt.invoiceId}</td>
                          <td className="p-4 font-bold text-gray-800">{receipt.patientName}</td>
                          <td className="p-4 text-right font-black text-teal-700">₹{receipt.amount.toLocaleString('en-IN')}</td>
                          <td className="p-4">
                              <div className="flex justify-center items-center gap-1.5">
                                  <button onClick={() => setSelectedReceipt(receipt)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition" title="View/Print Receipt"><Eye size={18}/></button>
                                  {userRole === 'admin' && (
                                    <>
                                      <button onClick={() => handleOpenEdit(receipt)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="Modify Record"><Edit size={18}/></button>
                                      {onDeleteReceipt && (
                                          <button onClick={() => { if(window.confirm("Permanently delete this payment record? This will increase the balance due.")) onDeleteReceipt(receipt.invoiceId, receipt.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete Permanent"><Trash2 size={18}/></button>
                                      )}
                                    </>
                                  )}
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-fade-in my-auto">
                  <div className={`p-5 text-white flex justify-between items-center font-black uppercase tracking-widest flex-shrink-0 ${editingReceipt ? 'bg-blue-600' : 'bg-primary'}`}>
                    <h3 className="ml-2">{editingReceipt ? 'Modify' : 'New'} Payment Receipt</h3>
                    <button onClick={() => setShowCreateModal(false)} className="hover:rotate-90 transition-transform"><X size={24}/></button>
                  </div>
                  
                  <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar bg-gray-50/30">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Invoice Selection *</label>
                        <select 
                          className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-teal-500 outline-none transition-all font-bold text-gray-700 bg-white shadow-sm" 
                          value={selectedInvoiceId} 
                          onChange={e => { setSelectedInvoiceId(e.target.value); if(!editingReceipt) setAmount(invoices.find(i=>i.id===e.target.value)?.balanceDue || 0); }}
                          disabled={!!editingReceipt}
                        >
                          <option value="">-- Choose Patient Invoice --</option>
                          {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.id} • {inv.patientName} (Due: ₹{inv.balanceDue})</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Collection Date</label>
                          <input type="date" className="w-full border-2 border-gray-100 p-3.5 rounded-xl focus:border-teal-500 outline-none font-bold text-gray-700 bg-white shadow-sm" value={date} onChange={e=>setDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                          <select className="w-full border-2 border-gray-100 p-3.5 rounded-xl outline-none focus:border-teal-500 font-bold text-gray-700 bg-white shadow-sm" value={method} onChange={e => setMethod(e.target.value as any)}>
                            <option value="Cash">Cash Ledger</option>
                            <option value="UPI">UPI Digital</option>
                            <option value="Account Transfer">Bank RTGS/IMPS</option>
                            <option value="Cheque">Bank Cheque</option>
                            <option value="Credit Card">Card Swipe</option>
                            <option value="EMI">Consumer Finance</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Bank Node</label>
                        <select className="w-full border-2 border-gray-100 p-3.5 rounded-xl outline-none focus:border-teal-500 font-bold text-teal-700 bg-white shadow-sm" value={bankDetails} onChange={e => setBankDetails(e.target.value)}>
                          <option value="">-- No Bank (Direct Cash) --</option>
                          {COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount to Record (INR) *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-teal-600 text-xl">₹</span>
                          <input 
                            type="number" 
                            className="w-full pl-10 border-2 border-gray-100 p-5 rounded-xl font-black text-3xl text-teal-800 focus:border-teal-500 outline-none bg-white shadow-inner" 
                            value={amount || ''} 
                            onChange={e => setAmount(Number(e.target.value))} 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entry Memo / Reference</label>
                        <input 
                          type="text" 
                          className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-teal-500 outline-none font-medium text-gray-600 bg-white shadow-sm" 
                          value={note} 
                          onChange={e => setNote(e.target.value)} 
                          placeholder="Transaction ID or internal note..." 
                        />
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                    <button onClick={handleSaveReceipt} className={`w-full text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.3em] text-[10px] ${editingReceipt ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                      {editingReceipt ? 'Confirm Change' : 'Finalize Money Receipt'}
                    </button>
                  </div>
              </div>
          </div>
      )}

      {selectedReceipt && <Receipt payment={selectedReceipt} invoice={selectedReceipt.invoice} onClose={() => setSelectedReceipt(null)} logo={logo} signature={signature} />}
    </div>
  );
};
