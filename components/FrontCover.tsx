import React from 'react';
import { ArrowRight, Package, FileText, Users, Briefcase, LayoutDashboard, Wallet, Repeat, FileMinus, FilePlus, Receipt } from 'lucide-react';
import { ViewState } from '../types';

interface FrontCoverProps {
  logo: string;
  onNavigate: (view: ViewState) => void;
}

export const FrontCover: React.FC<FrontCoverProps> = ({ logo, onNavigate }) => {
  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-6xl w-full z-10 flex flex-col items-center">
        <div className="text-center mb-16">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl inline-block mb-8 shadow-2xl border border-white/10">
            <img src={LOGO_URL} alt="BRG Logo" className="h-32 md:h-40 object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">BRG Inventory Manager</h1>
          <p className="text-xl text-teal-100 font-light uppercase">Bengal Rehabilitation & Research Pvt. Ltd.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full max-w-6xl">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-teal-300' },
            { id: 'advance-booking', label: 'Advances', icon: Wallet, color: 'text-green-300' },
            { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-orange-300' },
            { id: 'billing', label: 'Billing', icon: FileText, color: 'text-blue-300' },
            { id: 'patients', label: 'Patients', icon: Users, color: 'text-pink-300' },
            { id: 'receipts', label: 'Receipts', icon: Receipt, color: 'text-emerald-300' },
            { id: 'crm', label: 'Sales CRM', icon: Briefcase, color: 'text-purple-300' },
            { id: 'transfer', label: 'Transfer', icon: Repeat, color: 'text-cyan-300' },
            { id: 'credit-note', label: 'Credit Note', icon: FileMinus, color: 'text-red-300' },
            { id: 'debit-note', label: 'Debit Note', icon: FilePlus, color: 'text-blue-300' },
            { id: 'quotation', label: 'Quotations', icon: FileQuestion, color: 'text-yellow-300' },
            { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-gray-300' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl transition-all flex flex-col items-center text-center hover:-translate-y-1"
            >
              <div className={`p-3 rounded-full mb-3 bg-white/5 group-hover:bg-white/10 ${item.color}`}><item.icon size={24} /></div>
              <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-tighter">{item.label}</h3>
            </button>
          ))}
        </div>

        <div className="mt-16">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg transition-all hover:scale-105">
                Enter System <ArrowRight />
            </button>
        </div>
      </div>
    </div>
  );
};

// Helper for missing icons in map
const FileQuestion = ({ size }: { size: number }) => <FileText size={size} />;
const SettingsIcon = ({ size }: { size: number }) => <SettingsIconOriginal size={size} />;
import { Settings as SettingsIconOriginal } from 'lucide-react';