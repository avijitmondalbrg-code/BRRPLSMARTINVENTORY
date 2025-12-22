
import React, { useEffect } from 'react';
import { Invoice, PaymentRecord, Patient } from '../types';
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_ADDRESS, COMPANY_PHONES, COMPANY_EMAIL, CLINIC_GSTIN } from '../constants';
import { Printer, X } from 'lucide-react';

interface ReceiptProps {
  payment: PaymentRecord;
  invoice: Invoice;
  patient?: Patient;
  onClose: () => void;
  logo: string;
  signature: string | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ payment, invoice, onClose, logo, signature }) => {
  const handlePrint = () => { window.print(); };
  useEffect(() => { const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc); }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 bg-opacity-75 z-[70] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:absolute print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] overflow-hidden animate-fade-in print:shadow-none print:w-full print:rounded-none print:max-h-none">
        {/* Sticky Header for UI */}
        <div className="bg-[#3159a6] p-4 flex justify-between items-center text-white flex-shrink-0 print:hidden">
          <h3 className="font-bold uppercase tracking-widest text-xs ml-2">Digital Receipt Preview</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-white text-[#3159a6] px-4 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm">
              <Printer size={16} /> Print Receipt
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div id="receipt-printable-area" className="p-8 sm:p-12 bg-white overflow-y-auto custom-scrollbar flex-grow print:overflow-visible print:p-0">
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                <div className="flex gap-6">
                    <div className="h-20 w-20 flex items-center justify-center border border-gray-100 rounded-2xl p-2 bg-white">
                      <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 uppercase leading-none tracking-tighter">{COMPANY_NAME}</h1>
                        <p className="text-[10px] font-black text-gray-700 italic mt-2 tracking-tight">{COMPANY_TAGLINE}</p>
                        <div className="text-[9px] text-gray-800 mt-3 leading-relaxed max-w-xs">
                          <p>{COMPANY_ADDRESS}</p>
                          <p className="font-bold mt-1 text-gray-900">Ph: {COMPANY_PHONES} | Email: {COMPANY_EMAIL}</p>
                          <p className="mt-1 uppercase font-bold text-gray-600">GSTIN: {CLINIC_GSTIN}</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                  <div className="bg-[#3159a6] text-white px-4 py-1 inline-block mb-3 rounded-lg shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">Money Receipt</h2>
                  </div>
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">No: {payment.id}</p>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Date: {new Date(payment.date).toLocaleDateString('en-IN')}</p>
                </div>
            </div>
            
            <div className="space-y-10 text-sm sm:text-base leading-loose text-gray-900 font-medium py-4">
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>Received with thanks from Mr./Mrs./Ms.</span>
                  <span className="border-b border-dotted border-gray-600 flex-grow px-2 font-black text-gray-900 text-lg uppercase tracking-tight">{invoice.patientName}</span>
                </div>
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>The sum of Rupees</span>
                  <span className="border-b border-dotted border-gray-600 flex-grow px-2 font-black text-[#3159a6] text-xl">₹ {payment.amount.toLocaleString('en-IN')} /-</span>
                </div>
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>By</span>
                  <span className="border-b border-dotted border-gray-600 flex-grow px-2 font-bold text-gray-800 uppercase italic">
                    {payment.method} {payment.bankDetails ? `(Settled at ${payment.bankDetails})` : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 items-baseline">
                  <span>Against Invoice No.</span>
                  <span className="border-b border-dotted border-gray-600 px-2 font-black text-gray-900 uppercase">{invoice.id}</span>
                  <span>dated</span>
                  <span className="border-b border-dotted border-gray-600 px-2 font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString('en-IN')}</span>
                </div>
            </div>

            <div className="mt-20 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-10">
                <div className="border-4 border-[#3159a6] p-6 rounded-2xl bg-blue-50/50 text-center flex flex-col gap-1 shadow-inner min-w-[200px]">
                    <p className="text-[10px] uppercase font-black text-[#3159a6] opacity-60 tracking-[0.3em]">Total Received</p>
                    <p className="text-4xl font-black text-[#3159a6] tracking-tighter">₹ {payment.amount.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    {signature ? (
                      <div className="h-16 mb-2 flex items-end justify-center">
                        <img src={signature} alt="Sign" className="max-h-full object-contain mix-blend-multiply transition-transform hover:scale-110" />
                      </div>
                    ) : (
                      <div className="h-16 w-56 border-b-2 border-dashed border-gray-300 mb-2"></div>
                    )}
                    <p className="text-[10px] font-black uppercase text-gray-900 tracking-[0.4em] border-t-2 border-gray-900 pt-2">Authorized Signatory</p>
                </div>
            </div>

            <div className="mt-16 pt-6 border-t border-gray-100 text-[9px] text-gray-400 text-center uppercase tracking-[0.4em] font-black">
              Bengal Rehabilitation & Research Pvt. Ltd.
            </div>
        </div>
      </div>
    </div>
  );
};
