import React, { useState, useMemo, useEffect } from 'react';
import { Patient, Invoice, PaymentRecord, UserRole } from '../types';
import { setDocument } from '../services/firebase';
import { 
  CreditCard, Search, ArrowLeft, RefreshCw, Calendar, Check, AlertCircle, 
  DollarSign, Landmark, Plus, FileText, ArrowUpRight, Activity, Printer, Info, Settings 
} from 'lucide-react';

interface RazorpayPaymentsProps {
  patients: Patient[];
  invoices: Invoice[];
  razorpayPayments: any[];
  onAddRazorpayPayment: (payment: any) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  rzpKeyId: string;
  rzpKeySecret: string;
  rzpEnabled: boolean;
  userRole: UserRole;
  logo: string;
  signature: string | null;
}

export const RazorpayPayments: React.FC<RazorpayPaymentsProps> = ({
  patients,
  invoices,
  razorpayPayments,
  onAddRazorpayPayment,
  onUpdateInvoice,
  rzpKeyId,
  rzpKeySecret,
  rzpEnabled,
  userRole,
  logo,
  signature
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'receipt'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchPatientTerm, setSearchPatientTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [testMode, setTestMode] = useState(!rzpKeyId);
  const [processing, setProcessing] = useState(false);

  // Load Razorpay Script dynamically on component mount
  useEffect(() => {
    const scriptId = 'razorpay-checkout-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
    // Update testMode if rzpKeyId changes
    setTestMode(!rzpKeyId);
  }, [rzpKeyId]);

  // Selected Patient Details
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Filter Outstanding Invoices for Selected Patient
  const patientInvoices = useMemo(() => {
    if (!selectedPatientId) return [];
    return invoices.filter(inv => inv.patientId === selectedPatientId && inv.paymentStatus !== 'Paid' && inv.status !== 'Cancelled');
  }, [invoices, selectedPatientId]);

  // Handle invoice change - auto fills amount with remaining balance
  const handleInvoiceChange = (invoiceId: string) => {
    setLinkedInvoiceId(invoiceId);
    if (invoiceId) {
      const inv = invoices.find(i => i.id === invoiceId);
      if (inv) {
        setAmount(inv.balanceDue.toString());
        setNotes(`Payment for Invoice ${inv.id}`);
      }
    } else {
      setAmount('');
      setNotes('');
    }
  };

  // Patients Search Filter for Autocomplete
  const filteredPatients = useMemo(() => {
    if (!searchPatientTerm) return patients.slice(0, 5);
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchPatientTerm.toLowerCase()) || 
      p.phone.includes(searchPatientTerm) ||
      (p.id && p.id.toLowerCase().includes(searchPatientTerm.toLowerCase()))
    );
  }, [patients, searchPatientTerm]);

  // Total amount collected via online
  const analytics = useMemo(() => {
    let total = 0;
    let counts = 0;
    razorpayPayments.forEach(p => {
      if (p.status === 'Success') {
        total += Number(p.amount);
        counts++;
      }
    });
    return { total, counts };
  }, [razorpayPayments]);

  const filteredPayments = useMemo(() => {
    return razorpayPayments
      .filter(p => {
        const matchesSearch = 
          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.linkedInvoiceId && p.linkedInvoiceId.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [razorpayPayments, searchTerm]);

  // Action: Launch Razorpay Checkout
  const handlePaymentInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient first.');
      return;
    }
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setProcessing(true);

    if (testMode) {
      // Simulate Razorpay Callback
      setTimeout(async () => {
        const simPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const newPayment = {
          id: simPaymentId,
          date: new Date().toISOString(),
          patientId: selectedPatientId,
          patientName: selectedPatient?.name || 'Unknown',
          patientPhone: selectedPatient?.phone || '',
          amount: paymentAmount,
          notes: notes || 'Direct patient payment collection',
          linkedInvoiceId: linkedInvoiceId || null,
          status: 'Success',
          method: 'Simulated Online',
          sandboxMode: true
        };

        try {
          await writePaymentSuccess(newPayment, paymentAmount);
          setProcessing(false);
          alert('Simulated payment processed successfully!');
        } catch (err: any) {
          setProcessing(false);
          alert(`Failed to save payment record: ${err.message}`);
        }
      }, 1500);
    } else {
      // Real Razorpay integration
      try {
        const options = {
          key: rzpKeyId,
          amount: Math.round(paymentAmount * 100), // in paise
          currency: 'INR',
          name: 'Bengal Rehabilitation Group',
          description: notes || `Direct payment collection`,
          image: logo || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=100',
          handler: async function (response: any) {
            const realPaymentId = response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 11)}`;
            const newPayment = {
              id: realPaymentId,
              date: new Date().toISOString(),
              patientId: selectedPatientId,
              patientName: selectedPatient?.name || '',
              patientPhone: selectedPatient?.phone || '',
              amount: paymentAmount,
              notes: notes || 'Direct online payment collection',
              linkedInvoiceId: linkedInvoiceId || null,
              status: 'Success',
              method: 'Gateway Online',
              sandboxMode: false,
              rzpOrderId: response.razorpay_order_id || null,
              rzpSignature: response.razorpay_signature || null
            };

            try {
              await writePaymentSuccess(newPayment, paymentAmount);
              setProcessing(false);
              alert(`Payment collected successfully! ID: ${realPaymentId}`);
            } catch (err: any) {
              setProcessing(false);
              alert(`Failed to sync payment into ERP: ${err.message}`);
            }
          },
          prefill: {
            name: selectedPatient?.name || '',
            contact: selectedPatient?.phone || '',
            email: selectedPatient?.email || ''
          },
          theme: {
            color: '#3159a6'
          },
          modal: {
            ondismiss: function() {
              setProcessing(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert(`Payment failed! Reason: ${response.error.description}`);
          setProcessing(false);
        });
        rzp.open();
      } catch (err: any) {
        alert(`Failed to initialize Razorpay SDK. Please check setting variables. Error: ${err.message}`);
        setProcessing(false);
      }
    }
  };

  const writePaymentSuccess = async (paymentDetail: any, paymentAmount: number) => {
    // 1. Save payment record in "razorpay_payments" Firestore collection
    await setDocument('razorpay_payments', paymentDetail.id, paymentDetail);

    // 2. Append Receipt reference inside the patient invoice payments history if linked
    if (linkedInvoiceId) {
      const invoice = invoices.find(inv => inv.id === linkedInvoiceId);
      if (invoice) {
        const paymentRecord: PaymentRecord = {
          id: paymentDetail.id,
          date: new Date().toISOString().split('T')[0],
          amount: paymentAmount,
          method: 'UPI',
          note: `Razorpay Online: ${notes || 'Direct payment collect'}`
        };

        const currentPayments = invoice.payments || [];
        const updatedPayments = [...currentPayments, paymentRecord];
        const updatedBalanceDue = Math.max(0, invoice.balanceDue - paymentAmount);
        
        // Compute payment status
        let updatedStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
        if (updatedBalanceDue <= 0) {
          updatedStatus = 'Paid';
        } else if (updatedBalanceDue < invoice.finalTotal) {
          updatedStatus = 'Partial';
        }

        const updatedInvoice: Invoice = {
          ...invoice,
          payments: updatedPayments,
          balanceDue: Number(updatedBalanceDue.toFixed(2)),
          paymentStatus: updatedStatus
        };

        onUpdateInvoice(updatedInvoice);
      }
    }

    // 3. Update the global state list
    onAddRazorpayPayment(paymentDetail);
    
    // 4. Return to list mode
    setViewMode('list');
    
    // Clear form
    setSelectedPatientId('');
    setLinkedInvoiceId('');
    setAmount('');
    setNotes('');
  };

  const openReceiptView = (payment: any) => {
    setSelectedPayment(payment);
    setViewMode('receipt');
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-[#3159a6] bg-clip-text text-transparent flex items-center gap-2">
            <CreditCard className="text-[#3159a6]" />
            Razorpay PayLink Engine
          </h2>
          <p className="text-sm text-slate-500 font-semibold tracking-wide">Collect digital payments, advances & verify real-time settlements instantly.</p>
        </div>
        <div className="flex gap-2">
          {viewMode === 'list' ? (
            <button
              onClick={() => setViewMode('create')}
              className="bg-[#3159a6] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#254687] transition shadow flex items-center gap-2"
            >
              <Plus size={16} /> Collect New Payment
            </button>
          ) : (
            <button
              onClick={() => setViewMode('list')}
              className="bg-white text-slate-700 border-2 border-slate-100 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </button>
          )}
        </div>
      </div>

      {/* ANALYTICS HIGHLIGHTS - Bento Style Grid */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
          {/* Card 1: Total Collections */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-slate-300 transition">
            <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
              <Landmark size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Gateway Collection</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">₹{analytics.total.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          {/* Card 2: Successful Transactions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-slate-300 transition">
            <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Success Transactions</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{analytics.counts} Payments</h3>
            </div>
          </div>

          {/* Card 3: Razorpay mode status */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-slate-300 transition">
            <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
              <Settings size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Status / API Key Mode</p>
              <div className="flex items-center gap-2 mt-1.5Packed">
                {rzpKeyId ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Key Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Demo Sandbox Mode
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MAIN TABLE - LIST OF TRANSACTIONS */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 justify-between bg-gray-55/20">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Gateway Transaction Logs</h4>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by Payment ID, Patient or Invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#3159a6] transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <th className="p-4">Transaction Details</th>
                  <th className="p-4">Patient Info</th>
                  <th className="p-4">Linked Invoice</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-semibold italic">
                      No Razorpay payments found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-4">
                        <p className="font-mono font-black text-slate-700">{p.id}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(p.date).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{p.patientName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.patientPhone}</p>
                      </td>
                      <td className="p-4">
                        {p.linkedInvoiceId ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#3159a6]/10 text-[#3159a6] rounded-lg font-black text-[10px]">
                            <FileText size={12} /> {p.linkedInvoiceId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Direct Advance / Collection</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-slate-800">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-black text-[10px] uppercase">
                          <Check size={10} /> {p.status}
                        </span>
                        {p.sandboxMode && (
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sandbox Demo</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openReceiptView(p)}
                          className="bg-white border hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CREATE INVOICE PAYMENT / INITIATE FLOW */}
      {viewMode === 'create' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden print:hidden">
          <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#3159a6]/10 text-[#3159a6] rounded-xl">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Collect Payment Checkout</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Initialize a safe UPI, card or online banking collection window.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Demo / Sandbox checkout</span>
              <button
                type="button"
                onClick={() => setTestMode(!testMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${testMode ? 'bg-amber-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${testMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <form onSubmit={handlePaymentInitiate} className="p-6 space-y-6">
            {/* STEP 1: SELECT PATIENT WITH AUTOCOMPLETE */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#3159a6] mb-2">1. Select Patient Registration</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Type patient name, phone number, id to select..."
                  value={searchPatientTerm}
                  onChange={(e) => {
                    setSearchPatientTerm(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl focus:border-[#3159a6] outline-none text-xs font-bold transition bg-[#fafbfc]"
                />
              </div>

              {showPatientDropdown && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-xl divide-y max-h-56 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 font-semibold italic text-center">No matching patients registered.</div>
                  ) : (
                    filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setSearchPatientTerm(p.name);
                          setShowPatientDropdown(false);
                          setLinkedInvoiceId(''); // reset linked invoice
                          setAmount('');
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold ml-2">({p.id})</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 font-bold">{p.phone}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* SELECTION PREVIEW AND OUTSTANDING INVOICES */}
            {selectedPatient && (
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-black text-slate-800 text-xs uppercase tracking-wide">Selected Patient details</h5>
                    <p className="text-xs text-slate-500 font-bold mt-1">{selectedPatient.name} &bull; {selectedPatient.phone}</p>
                    {selectedPatient.address && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{selectedPatient.address}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatientId('');
                      setSearchPatientTerm('');
                      setLinkedInvoiceId('');
                      setAmount('');
                    }}
                    className="text-red-500 hover:text-red-700 font-black text-xs uppercase tracking-widest bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                  >
                    Clear Select
                  </button>
                </div>

                <hr className="border-slate-200" />

                {/* STEP 2: LINKED INVOICE */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">2. Link to Outstanding Invoice (Optional)</label>
                  {patientInvoices.length === 0 ? (
                    <div className="p-3 bg-indigo-50 border-2 border-dashed border-indigo-100 rounded-xl text-center">
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <Info size={14} /> No outstanding core invoices. Collecting direct advance.
                      </span>
                    </div>
                  ) : (
                    <select
                      value={linkedInvoiceId}
                      onChange={(e) => handleInvoiceChange(e.target.value)}
                      className="w-full p-3 border-2 border-slate-100 rounded-xl text-xs font-bold bg-[#fafbfc] focus:border-[#3159a6] focus:outline-none"
                    >
                      <option value="">-- Direct Payment (Not Linked to any Invoice) --</option>
                      {patientInvoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.id} &bull; Date: {inv.date} &bull; Total: ₹{inv.finalTotal.toLocaleString()} &bull; Balance Due: ₹{inv.balanceDue.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: AMOUNT & NOTES */}
            {selectedPatientId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#3159a6] mb-2">3. Payment Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-black text-slate-500 text-sm">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3.5 border-2 border-slate-100 rounded-xl focus:border-[#3159a6] outline-none text-xs font-black transition bg-[#fafbfc]"
                    />
                  </div>
                  {linkedInvoiceId && (
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1.5">
                      Max Outstanding is ₹{invoices.find(i => i.id === linkedInvoiceId)?.balanceDue.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">4. Payment Purpose & Comments</label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared Balance / Dynamic Advance"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-xl focus:border-[#3159a6] outline-none text-xs font-bold transition bg-[#fafbfc]"
                  />
                </div>
              </div>
            )}

            {/* ERROR / API MODE NOTICE */}
            {selectedPatientId && (
              <div className="p-4 bg-[#3159a6]/5 rounded-xl flex items-start gap-3 border border-[#3159a6]/10">
                <Info className="text-[#3159a6] shrink-0 mt-0.5" size={16} />
                <div className="text-[10px] text-slate-600 font-medium">
                  {testMode ? (
                    <p className="font-semibold text-amber-700">
                      <span className="font-black uppercase">Demo Sandbox Sandbox active:</span> Clicking checkout will instantly trigger a secure local transaction success simulation, updating patient ledger and balance.
                    </p>
                  ) : (
                    <p>
                      <span className="font-black uppercase text-slate-800">Secure Live Checkout active:</span> The official Razorpay overlay will compile UPI, Cards, Netbanking instantly under Key: <code className="bg-white px-1.5 py-0.5 border rounded text-slate-900 font-mono text-[9px]">{rzpKeyId}</code>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ACTION SUBMIT BUTTON */}
            {selectedPatientId && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-[#3159a6] text-white py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#203c73] disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} /> Connecting Payment Gateway...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} /> Launch Razorpay PayLink Modal &bull; ₹{Number(amount || 0).toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* VIEW: COMPLETED PAYMENT RECEIPT VIEW */}
      {viewMode === 'receipt' && selectedPayment && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-2xl relative overflow-hidden" id="print-area">
            
            {/* Stamp Logo background */}
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
              <CreditCard size={250} />
            </div>

            {/* Header branding */}
            <div className="flex justify-between items-start gap-4 mb-6 border-b-2 border-slate-900 pb-5">
              <div>
                <img src={logo} alt="BRG Logo" className="h-10 object-contain mb-2" />
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Bengal Rehabilitation Group</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Dynamic Settlement Record</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black tracking-widest uppercase rounded-lg mb-1 border border-emerald-300">
                  Transaction Success
                </span>
                <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">Ref: {selectedPayment.id}</p>
                <p className="text-[9px] text-slate-400 font-bold">{new Date(selectedPayment.date).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Receipt Summary Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Patient Name:</span>
                <span className="font-extrabold text-slate-800">{selectedPayment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Mobile / Contact:</span>
                <span className="font-bold text-slate-700">{selectedPayment.patientPhone}</span>
              </div>
              {selectedPayment.linkedInvoiceId && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Settled Against:</span>
                  <span className="font-black text-[#3159a6]">{selectedPayment.linkedInvoiceId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Method / Instrument:</span>
                <span className="font-bold text-slate-700 uppercase">{selectedPayment.method}</span>
              </div>
              {selectedPayment.sandboxMode && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Settlement Node:</span>
                  <span className="font-bold text-amber-700 uppercase text-[9px]">Gateway Test Sandbox</span>
                </div>
              )}
            </div>

            {/* Amount calculation table */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden mb-6 text-xs text-center">
              <div className="grid grid-cols-2 bg-slate-900 text-white p-2 font-black text-[10px] uppercase">
                <span>Description / Particulars</span>
                <span className="text-right">Transaction Total</span>
              </div>
              <div className="grid grid-cols-2 p-3 font-semibold border-b text-slate-700">
                <span className="text-left font-bold text-slate-900">{selectedPayment.notes || 'Direct payment collect'}</span>
                <span className="text-right">₹{Number(selectedPayment.amount).toLocaleString('en-IN')}.00</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-50 font-black text-slate-900">
                <span className="text-left">Settled Net Amount Collected:</span>
                <span className="text-right text-base text-[#3159a6]">₹{Number(selectedPayment.amount).toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            {/* Sign and stamp terms */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-slate-200">
              <div className="text-[10px] text-slate-400 italic font-medium">
                <p className="font-black uppercase text-slate-500 mb-1">Receipt terms:</p>
                <p>This is a computerized system payment clearance record generated via Razorpay API integrations in ERP Node. Signature of recipient is digitally stamped.</p>
              </div>
              <div className="text-center flex flex-col items-center justify-end">
                {signature ? (
                  <img src={signature} alt="Signature" className="max-h-12 w-32 object-contain" />
                ) : (
                  <div className="h-10" />
                )}
                <div className="h-px w-28 bg-slate-900 mb-1"></div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-800">Authorized signatory</p>
                <p className="text-[8px] text-slate-400 uppercase">Bengal Rehabilitation Group</p>
              </div>
            </div>
          </div>

          {/* Action to click to print */}
          <div className="flex gap-3 justify-end print:hidden">
            <button
              onClick={() => {
                const originalTitle = document.title;
                document.title = `Receipt_${selectedPayment.id}`;
                window.print();
                document.title = originalTitle;
              }}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition flex items-center gap-2"
            >
              <Printer size={16} /> Print Receipt copy
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="bg-white text-slate-600 border-2 border-slate-100 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
