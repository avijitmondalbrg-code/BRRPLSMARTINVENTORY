import React, { useState, useMemo } from 'react';
import { Invoice, PaymentRecord, UserRole } from '../types';
import { COMPANY_BANK_ACCOUNTS } from '../constants';
import { Search, Receipt as ReceiptIcon, Eye, Plus, X, Trash2, Edit } from 'lucide-react';
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
    invoices.forEach(inv => {
      inv.payments.forEach(pay => {
        receipts.push({ ...pay, invoiceId: inv.id, patientName: inv.patientName, invoice: inv });
      });
    });
    return receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  const filteredReceipts = allReceipts.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        // Modification Logic
        updatedPayments = targetInvoice.payments.map(p => 
          p.id === editingReceipt.id 
            ? { ...p, amount, date, method, note: note || 'Payment Updated', bankDetails: bankDetails || undefined } 
            : p
        );
      } else {
        // Creation Logic
        const newPayment: PaymentRecord = { 
          id: `PAY-${Date.now()}`, 
          date, 
          amount, 
          method, 
          note: note || 'Payment Received', 
          bankDetails: bankDetails || undefined 
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
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ReceiptIcon className="text-primary" /> Payment Receipts</h2>
        {userRole === 'admin' && onUpdateInvoice && (
            <button onClick={handleOpenCreate} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow hover:bg-teal-800 transition"><Plus size={20} /> Create Receipt</button>
        )}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4"><Search className="text-gray-400" size={20} /><input type="text" placeholder="Search Receipts..." className="flex-1 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
      <div className="bg-white rounded-lg shadow overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 font-black text-[10px] uppercase tracking-widest border-b">
                  <tr><th className="p-4">Receipt No</th><th className="p-4">Date</th><th className="p-4">Invoice Ref</th><th className="p-4">Patient Name</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y text-sm">
                  {filteredReceipts.length === 0 ? (
                      <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">No receipts found matching your search.</td></tr>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                  <div className={`p-5 text-white flex justify-between items-center font-black uppercase tracking-widest ${editingReceipt ? 'bg-blue-600' : 'bg-primary'}`}>
                    <h3>{editingReceipt ? 'Modify' : 'New'} Payment Receipt</h3>
                    <button onClick={() => setShowCreateModal(false)}><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-5">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Target Invoice</label>
                        <select 
                          className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-teal-500 outline-none transition-all font-bold text-gray-700 bg-gray-50" 
                          value={selectedInvoiceId} 
                          onChange={e => { setSelectedInvoiceId(e.target.value); if(!editingReceipt) setAmount(invoices.find(i=>i.id===e.target.value)?.balanceDue || 0); }}
                          disabled={!!editingReceipt}
                        >
                          <option value="">-- Select Invoice --</option>
                          {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.id} • {inv.patientName} (Due: ₹{inv.balanceDue})</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Date</label>
                          <input type="date" className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-teal-500 outline-none font-bold text-gray-700" value={date} onChange={e=>setDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Method</label>
                          <select className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-teal-500 font-bold text-gray-700 bg-gray-50" value={method} onChange={e => setMethod(e.target.value as any)}>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Account Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="EMI">EMI</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Received Bank</label>
                        <select className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-teal-500 font-bold text-teal-700 bg-gray-50" value={bankDetails} onChange={e => setBankDetails(e.target.value)}>
                          <option value="">-- No Bank (Cash) --</option>
                          {COMPANY_BANK_ACCOUNTS.map(bank => <option key={bank.name} value={bank.name}>{bank.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount (INR)</label>
                        <input type="number" className="w-full border-2 border-gray-100 p-4 rounded-xl font-black text-2xl text-teal-800 focus:border-teal-500 outline-none" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} placeholder="0.00" />
                      </div>

                      <button onClick={handleSaveReceipt} className={`w-full text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] mt-2 ${editingReceipt ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'}`}>
                        {editingReceipt ? 'Update Receipt' : 'Save Receipt'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedReceipt && <Receipt payment={selectedReceipt} invoice={selectedReceipt.invoice} onClose={() => setSelectedReceipt(null)} logo={logo} signature={signature} />}
    </div>
  );
};