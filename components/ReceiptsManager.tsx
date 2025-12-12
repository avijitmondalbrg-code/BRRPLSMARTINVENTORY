
import React, { useState, useMemo } from 'react';
import { Invoice, PaymentRecord, UserRole } from '../types';
import { COMPANY_BANK_ACCOUNTS } from '../constants';
import { Search, Receipt as ReceiptIcon, Eye, Plus, X, Trash2 } from 'lucide-react';
import { Receipt } from './Receipt';

interface ReceiptsManagerProps {
  invoices: Invoice[];
  logo: string;
  signature: string | null;
  onUpdateInvoice?: (invoice: Invoice) => void;
  // FIX: Added onDeleteReceipt and userRole to fix Error in file App.tsx on line 309
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

  // Create Form State
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

  const handleCreateReceipt = () => {
      if (!selectedInvoiceId || amount <= 0 || !onUpdateInvoice) return;
      const targetInvoice = invoices.find(i => i.id === selectedInvoiceId);
      if (!targetInvoice) return;
      const updatedPayments = [...targetInvoice.payments, { id: `PAY-${Date.now()}`, date, amount, method, note: note || 'Payment Received', bankDetails: bankDetails || undefined }];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = Math.max(0, targetInvoice.finalTotal - totalPaid);
      onUpdateInvoice({ ...targetInvoice, payments: updatedPayments, balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : 'Partial' });
      setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ReceiptIcon className="text-primary" /> Payment Receipts</h2>
        {userRole === 'admin' && onUpdateInvoice && (
            <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-800 transition"><Plus size={20} /> Create Receipt</button>
        )}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4"><Search className="text-gray-400" size={20} /><input type="text" placeholder="Search Receipts..." className="flex-1 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
      <div className="bg-white rounded-lg shadow overflow-hidden border">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr><th className="p-4">Receipt No</th><th className="p-4">Date</th><th className="p-4">Invoice Ref</th><th className="p-4">Patient Name</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
                {filteredReceipts.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No receipts found.</td></tr>
                ) : filteredReceipts.map(receipt => (
                    <tr key={receipt.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-sm text-teal-700">{receipt.id}</td>
                        <td className="p-4 text-gray-600 text-sm">{receipt.date}</td>
                        <td className="p-4 text-sm text-gray-500">{receipt.invoiceId}</td>
                        <td className="p-4 font-medium">{receipt.patientName}</td>
                        <td className="p-4 text-right font-bold text-gray-800">₹{receipt.amount.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                            <div className="flex justify-center items-center gap-2">
                                <button onClick={() => setSelectedReceipt(receipt)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition"><Eye size={18}/></button>
                                {userRole === 'admin' && onDeleteReceipt && (
                                    <button onClick={() => { if(window.confirm("Permanently delete this payment record?")) onDeleteReceipt(receipt.invoiceId, receipt.id); }} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition" title="Delete"><Trash2 size={18}/></button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                  <div className="bg-primary p-4 text-white flex justify-between items-center rounded-t-xl font-bold"><h3>New Payment Receipt</h3><button onClick={() => setShowCreateModal(false)}><X/></button></div>
                  <div className="p-6 space-y-4">
                      <select className="w-full border p-2 rounded" value={selectedInvoiceId} onChange={e => { setSelectedInvoiceId(e.target.value); setAmount(invoices.find(i=>i.id===e.target.value)?.balanceDue || 0); }}><option value="">-- Select Invoice --</option>{invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.id} - {inv.patientName} (Due: ₹{inv.balanceDue})</option>)}</select>
                      <input type="number" placeholder="Amount" className="w-full border p-2 rounded font-bold text-xl" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                      <button onClick={handleCreateReceipt} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">Save Receipt</button>
                  </div>
              </div>
          </div>
      )}
      {selectedReceipt && <Receipt payment={selectedReceipt} invoice={selectedReceipt.invoice} onClose={() => setSelectedReceipt(null)} logo={logo} signature={signature} />}
    </div>
  );
};