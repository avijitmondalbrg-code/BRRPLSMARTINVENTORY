
import React from 'react';
import { ArrowRight, Package, FileText, Users, Briefcase, LayoutDashboard, Wallet, Repeat, FileMinus, FilePlus, Receipt, HardDrive, FileQuestion, ArrowRightLeft, Truck } from 'lucide-react';
import { ViewState } from '../types';
import { COMPANY_TAGLINE } from '../constants';

interface FrontCoverProps {
  logo: string;
  onNavigate: (view: ViewState) => void;
}

export const FrontCover: React.FC<FrontCoverProps> = ({ logo, onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#3159a6] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements for depth */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[800px] h-[800px] bg-white/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-blue-900/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none select-none">
           <div className="grid grid-cols-6 gap-20 transform -rotate-12">
              {Array.from({length: 24}).map((_, i) => (
                <Package key={i} size={120} />
              ))}
           </div>
        </div>
      </div>

      <div className="max-w-6xl w-full z-10 flex flex-col items-center text-center pb-20">
        
        {/* Logo Container with Solid White Background */}
        <div className="bg-white p-10 rounded-[3rem] inline-block mb-12 shadow-[0_25px_60px_rgba(0,0,0,0.4)] border-8 border-white/20 ring-1 ring-black/5 animate-fade-in-up">
          <img 
            src={logo} 
            alt="BRG Logo" 
            className="h-36 md:h-48 w-auto object-contain mx-auto" 
          />
        </div>

        <div className="mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 uppercase drop-shadow-lg">
            BRG Smart Inventory System V2.0
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-bold uppercase tracking-[0.25em] max-w-3xl mx-auto leading-relaxed drop-shadow-md opacity-90">
            {COMPANY_TAGLINE}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 w-full max-w-7xl px-4">
          {[
            { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard, color: 'text-blue-200' },
            { id: 'advance-booking', label: 'Advances', icon: Wallet, color: 'text-green-200' },
            { id: 'crm', label: 'Pipeline', icon: Briefcase, color: 'text-teal-200' },
            { id: 'assets', label: 'Equipment', icon: HardDrive, color: 'text-amber-200' },
            { id: 'asset-transfer', label: 'Asset Logistic', icon: Truck, color: 'text-blue-300' },
            { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-orange-200' },
            { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-purple-200' },
            { id: 'quotation', label: 'Quotations', icon: FileQuestion, color: 'text-yellow-100' },
            { id: 'billing', label: 'Billing', icon: FileText, color: 'text-sky-200' },
            { id: 'credit-note', label: 'Credit Note', icon: FileMinus, color: 'text-red-200' },
            { id: 'debit-note', label: 'Debit Note', icon: FilePlus, color: 'text-indigo-200' }
          ].map((item, idx) => (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="group bg-white/10 hover:bg-white/20 border border-white/10 p-5 rounded-3xl transition-all flex flex-col items-center text-center hover:-translate-y-2 shadow-xl backdrop-blur-md animate-fade-in-up"
            >
              <div className={`p-3 rounded-2xl mb-3 bg-white/10 group-hover:bg-white/20 transition-all ${item.color} group-hover:scale-110`}>
                <item.icon size={24} />
              </div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">{item.label}</h3>
            </button>
          ))}
        </div>

        <div className="mt-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="flex items-center gap-4 bg-white text-[#3159a6] text-xl font-black py-6 px-16 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all hover:scale-105 active:scale-95 hover:bg-blue-50 uppercase tracking-[0.2em]"
            >
                Launch Dashboard <ArrowRight strokeWidth={3} />
            </button>
        </div>
      </div>

      <footer className="absolute bottom-8 w-full text-center z-10 px-6">
          <div className="h-px w-24 bg-white/20 mx-auto mb-4"></div>
          <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.5em] select-none">
              © Bengal Rehabilitation & Research Pvt. Ltd. | 2025
          </p>
      </footer>
      
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};
