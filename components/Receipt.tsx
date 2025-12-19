
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
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:absolute print:inset-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in print:shadow-none print:w-full print:rounded-none">
        <div className="bg-[#3159a6] p-4 flex justify-between items-center text-white print:hidden"><h3 className="font-bold">Receipt Preview</h3><div className="flex gap-2"><button onClick={handlePrint} className="bg-white text-[#3159a6] px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"><Printer size={16} /> Print</button><button onClick={onClose}><X size={24} /></button></div></div>
        <div id="receipt-printable-area" className="p-10 bg-white">
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                <div className="flex gap-6">
                    <div className="h-20 w-20 flex items-center justify-center"><img src={logo} alt="Logo" className="h-full w-full object-contain" /></div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 uppercase leading-none">{COMPANY_NAME}</h1>
                        <p className="text-[10px] font-black text-gray-500 italic mt-2 tracking-tight">{COMPANY_TAGLINE}</p>
                        <div className="text-[10px] text-gray-500 mt-3 leading-relaxed max-w-xs"><p>{COMPANY_ADDRESS}</p><p className="font-bold mt-1 text-gray-800">Ph: {COMPANY_PHONES} | Email: {COMPANY_EMAIL}</p><p className="mt-1 uppercase font-bold text-gray-400">GSTIN: {CLINIC_GSTIN}</p></div>
                    </div>
                </div>
                <div className="text-right"><div className="bg-[#3159a6] text-white px-4 py-1 inline-block mb-3 rounded-lg"><h2 className="text-lg font-black uppercase tracking-widest">Money Receipt</h2></div><p className="text-xs font-bold text-gray-600">No: {payment.id}</p><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date: {new Date(payment.date).toLocaleDateString('en-IN')}</p></div>
            </div>
            <div className="space-y-10 text-sm leading-loose text-gray-800 font-medium">
                <div className="flex flex-wrap gap-2 items-baseline"><span>Received with thanks from Mr./Mrs./Ms.</span><span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900 text-lg">{invoice.patientName}</span></div>
                <div className="flex flex-wrap gap-2 items-baseline"><span>The sum of Rupees</span><span className="border-b border-dotted border-gray-400 flex-grow px-2 font-black text-gray-900 text-lg">₹ {payment.amount.toLocaleString('en-IN')} /-</span></div>
                <div className="flex flex-wrap gap-2 items-baseline"><span>By</span><span className="border-b border-dotted border-gray-400 flex-grow px-2 font-bold text-gray-700 uppercase">{payment.method} {payment.bankDetails ? `(${payment.bankDetails})` : ''}</span></div>
                <div className="flex flex-wrap gap-2 items-baseline"><span>Against Invoice No.</span><span className="border-b border-dotted border-gray-400 px-2 font-bold text-gray-900 uppercase">{invoice.id}</span><span>dated</span><span className="border-b border-dotted border-gray-400 px-2 font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString('en-IN')}</span></div>
            </div>
            <div className="mt-20 flex justify-between items-end"><div className="border-4 border-[#3159a6] p-5 rounded-2xl bg-blue-50 text-center flex flex-col gap-1 shadow-sm"><p className="text-[10px] uppercase font-black text-[#3159a6] opacity-60 tracking-widest">Amount Received</p><p className="text-3xl font-black text-[#3159a6]">₹ {payment.amount.toLocaleString()}</p></div><div className="text-center">{signature ? <div className="h-16 mb-2 flex items-end justify-center"><img src={signature} alt="Sign" className="max-h-full object-contain mix-blend-multiply" /></div> : <div className="h-16 w-48 border-b-2 border-dashed border-gray-300 mb-2"></div>}<p className="text-[10px] font-black uppercase text-gray-800 tracking-widest">Authorized Signatory</p></div></div>
            <div className="mt-12 pt-4 border-t border-gray-100 text-[9px] text-gray-400 text-center uppercase tracking-widest font-bold">Subject to Kolkata Jurisdiction • Computer Generated Receipt</div>
        </div>
      </div>
    </div>
  );
};
