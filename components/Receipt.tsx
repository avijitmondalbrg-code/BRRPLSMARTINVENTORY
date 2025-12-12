
import React, { useEffect } from 'react';
import { Invoice, PaymentRecord, Patient } from '../types';
import { Printer, X, Download } from 'lucide-react';

interface ReceiptProps {
  payment: PaymentRecord;
  invoice: Invoice;
  patient?: Patient;
  onClose: () => void;
  logo: string;
  signature: string | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ payment, invoice, patient, onClose, logo, signature }) => {
  const handlePrint = () => {
    window.print();
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:absolute print:inset-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Screen-only Header */}
        <div className="bg-teal-700 p-4 flex justify-between items-center text-white print:hidden">
          <h3 className="font-semibold flex items-center gap-2">Payment Receipt Preview</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="bg-white text-teal-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-teal-50 flex items-center gap-2"
            >
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="text-teal-200 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="receipt-printable-area" className="p-8 bg-white relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                <div className="flex gap-4">
                    <div className="h-20 w-20 flex items-center justify-center">
                        <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 uppercase leading-tight">Bengal Rehabilitation<br />& Research Pvt. Ltd.</h1>
                        <p className="text-xs font-semibold text-gray-500 italic mt-1">Bengal's Largest Hospital Based Hearing and Speech Chain</p>
                        <div className="text-xs text-gray-500 mt-2">
                            <p>Kalipur, Purba Nischintapur, Pujali, Budge Budge, Kolkata - 700138, WB, India</p>
                            <p>Phone: 9874925867, 6291236283</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="border-2 border-gray-800 px-4 py-1 inline-block mb-2">
                        <h2 className="text-lg font-bold uppercase tracking-widest">Money Receipt</h2>
                    </div>
                    <p className="text-sm text-gray-600"><b>Receipt No:</b> {payment.id}</p>
                    <p className="text-sm text-gray-600"><b>Date:</b> {new Date(payment.date).toLocaleDateString('en-IN')}</p>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6 text-sm text-gray-800 leading-loose font-medium">
                <div className="flex flex-wrap gap-2 items-baseline">
                    <span>Received with thanks from Mr./Mrs./Ms.</span>
                    <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-900">{invoice.patientName}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 items-baseline">
                    <span>The sum of Rupees</span>
                    <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-900">
                        ₹ {payment.amount.toLocaleString('en-IN')} /-
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 items-baseline">
                    <span>By Cash / Cheque / Draft / Card / UPI No.</span>
                    <span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-900">
                        {payment.method} {payment.note ? `(${payment.note})` : ''}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 items-baseline">
                    <span>On account of Invoice No.</span>
                    <span className="border-b border-dotted border-gray-400 px-2 font-bold text-gray-900">{invoice.id}</span>
                    <span>dated</span>
                    <span className="border-b border-dotted border-gray-400 px-2 font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString('en-IN')}</span>
                </div>
            </div>

            {/* Financials Box */}
            <div className="mt-12 flex justify-between items-end">
                <div className="border border-gray-800 rounded-lg p-2 px-4 bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Amount Received</p>
                    <p className="text-2xl font-bold text-gray-900">₹ {payment.amount.toLocaleString('en-IN')}/-</p>
                </div>

                <div className="text-center">
                    {signature ? (
                        <div className="h-16 mb-2 flex items-end justify-center">
                            <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                        </div>
                    ) : (
                        <div className="h-16 w-40 border-b border-gray-400 mb-2"></div>
                    )}
                    <p className="text-xs font-bold text-gray-500 uppercase">Authorized Signatory</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Subject to Kolkata Jurisdiction. This is a computer generated receipt.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
