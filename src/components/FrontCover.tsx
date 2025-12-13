import React from 'react';
import { ArrowRight, Package, FileText, Users, Briefcase, LayoutDashboard, Wallet } from 'lucide-react';
import { ViewState } from '../types';
import { COMPANY_TAGLINE, COMPANY_NAME } from '../constants';

interface FrontCoverProps {
  logo: string;
  onNavigate: (view: ViewState) => void;
}

export const FrontCover: React.FC<FrontCoverProps> = ({ logo, onNavigate }) => {
  const COVER_LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      <div className="max-w-6xl w-full z-10 flex flex-col items-center">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl inline-block mb-8 shadow-2xl border border-white/10"><img src={COVER_LOGO_URL} alt="BRG Logo" className="h-32 md:h-40 object-contain drop-shadow-xl" /></div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 uppercase">BRG Manager V2.6</h1>
          <p className="text-lg md:text-2xl text-teal-300 font-bold uppercase tracking-[0.2em]">{COMPANY_TAGLINE}</p>
          <p className="text-sm text-slate-400 mt-2 font-medium">{COMPANY_NAME}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full max-w-6xl animate-fade-in-up delay-300">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
            { id: 'advance-booking', label: 'Advances', icon: Wallet, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
            { id: 'billing', label: 'Billing', icon: FileText, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
            { id: 'crm', label: 'Sales CRM', icon: Briefcase, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
            { id: 'inventory', label: 'Stock', icon: Package, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
            { id: 'patients', label: 'Patients', icon: Users, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' }
          ].map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id as any)} className={`group ${item.color} backdrop-blur-sm border p-6 rounded-2xl transition-all hover:-translate-y-1 flex flex-col items-center text-center`}>
              <div className="p-3 rounded-full mb-3 bg-white/5 group-hover:scale-110 transition-transform"><item.icon size={28} /></div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white">{item.label}</h3>
            </button>
          ))}
        </div>
        <div className="mt-16 animate-fade-in-up delay-500">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white text-lg font-black py-4 px-12 rounded-full shadow-2xl shadow-teal-900/50 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">Enter System <ArrowRight /></button>
        </div>
        <div className="absolute bottom-6 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">&copy; {new Date().getFullYear()} {COMPANY_NAME}</div>
      </div>
    </div>
  );
};
