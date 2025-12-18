import React from 'react';
import { ArrowRight, Package, FileText, Users, Briefcase, LayoutDashboard, Wallet, Repeat, FileMinus, FilePlus, Receipt } from 'lucide-react';
import { ViewState } from '../types';
import { COMPANY_TAGLINE } from '../constants';

interface FrontCoverProps {
  logo: string;
  onNavigate: (view: ViewState) => void;
}

export const FrontCover: React.FC<FrontCoverProps> = ({ logo, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-6xl w-full z-10 flex flex-col items-center text-center">
        
        {/* Logo Container with Solid White Background */}
        <div className="bg-white p-6 rounded-3xl inline-block mb-10 shadow-2xl border border-white/20">
          <img 
            src={logo} 
            alt="BRG Logo" 
            className="h-32 md:h-40 w-auto object-contain mx-auto" 
          />
        </div>

        <div className="mb-16">
          <h1 className="text-4xl md:text-4xl font-black text-white tracking-tighter mb-4 uppercase">
            BRG Inventory Management System V2.0
          </h1>
          <p className="text-xl text-teal-300 font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto leading-relaxed">
            {COMPANY_TAGLINE}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full max-w-6xl">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-teal-300' },
            { id: 'advance-booking', label: 'Advances', icon: Wallet, color: 'text-green-300' },
            { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-orange-300' },
            { id: 'billing', label: 'Billing', icon: FileText, color: 'text-blue-300' },
            { id: 'patients', label: 'Patients', icon: Users, color: 'text-pink-300' },
            { id: 'receipts', label: 'Receipts', icon: Receipt, color: 'text-emerald-300' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl transition-all flex flex-col items-center text-center hover:-translate-y-1 shadow-lg backdrop-blur-sm"
            >
              <div className={`p-3 rounded-full mb-3 bg-white/5 group-hover:bg-white/10 transition-colors ${item.color}`}>
                <item.icon size={24} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-tighter">{item.label}</h3>
            </button>
          ))}
        </div>

        <div className="mt-16">
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white text-lg font-black py-4 px-12 rounded-full shadow-2xl shadow-teal-900/50 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
            >
                Enter System <ArrowRight />
            </button>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
};

// Icon placeholders
const FileQuestion = ({ size }: { size: number }) => <FileText size={size} />;
const SettingsIcon = ({ size }: { size: number }) => <SettingsIconOriginal size={size} />;
import { Settings as SettingsIconOriginal } from 'lucide-react';
