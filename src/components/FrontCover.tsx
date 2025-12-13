import React from 'react';
import { ArrowRight, Package, FileText, Users, Briefcase, LayoutDashboard, Wallet } from 'lucide-react';
import { ViewState } from '../types';
import { COMPANY_TAGLINE } from '../constants';

interface FrontCoverProps {
  logo: string;
  onNavigate: (view: ViewState) => void;
}

export const FrontCover: React.FC<FrontCoverProps> = ({ logo, onNavigate }) => {
  const COVER_LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl w-full z-10 flex flex-col items-center">
        
        {/* Header / Branding */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl inline-block mb-8 shadow-2xl border border-white/10">
            <div className="h-32 w-32 md:h-40 md:w-40 flex items-center justify-center mx-auto">
                <img 
                    src={COVER_LOGO_URL} 
                    alt="Company Logo" 
                    className="h-full w-full object-contain drop-shadow-lg"
                />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
            BRG Inventory Manager
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-teal-400 to-blue-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-teal-100 font-light tracking-wide uppercase">
            {COMPANY_TAGLINE}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Comprehensive Hearing Aid Inventory & Patient Management System
          </p>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 w-full max-w-6xl animate-fade-in-up delay-150">
          
          <button 
            onClick={() => onNavigate('dashboard')}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/30 flex flex-col items-center text-center"
          >
            <div className="bg-teal-500/20 p-4 rounded-full mb-4 group-hover:bg-teal-500 group-hover:text-white transition-colors text-teal-300">
                <LayoutDashboard size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Dashboard</h3>
            <p className="text-xs text-slate-400">Overview</p>
          </button>

          <button 
            onClick={() => onNavigate('advance-booking')}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/30 flex flex-col items-center text-center"
          >
            <div className="bg-green-500/20 p-4 rounded-full mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors text-green-300">
                <Wallet size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Advances</h3>
            <p className="text-xs text-slate-400">Advance Receipts</p>
          </button>

          <button 
            onClick={() => onNavigate('billing')}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/30 flex flex-col items-center text-center"
          >
            <div className="bg-blue-500/20 p-4 rounded-full mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-300">
                <FileText size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Billing</h3>
            <p className="text-xs text-slate-400">Invoices</p>
          </button>

          <button 
            onClick={() => onNavigate('crm')}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/30 flex flex-col items-center text-center"
          >
            <div className="bg-purple-500/20 p-4 rounded-full mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-300">
                <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">CRM</h3>
            <p className="text-xs text-slate-400">Leads</p>
          </button>

          <button 
            onClick={() => onNavigate('inventory')}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/30 flex flex-col items-center text-center"
          >
            <div className="bg-orange-500/20 p-4 rounded-full mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors text-orange-300">
                <Package size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Inventory</h3>
            <p className="text-xs text-slate-400">Stock</p>
          </button>

          <button 
            onClick={() => onNavigate('patients')}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/30 flex flex-col items-center text-center"
          >
            <div className="bg-pink-500/20 p-4 rounded-full mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors text-pink-300">
                <Users size={28} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Patients</h3>
            <p className="text-xs text-slate-400">Directory</p>
          </button>

        </div>

        {/* Enter Button */}
        <div className="mt-16 animate-fade-in-up delay-300">
            <button 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg shadow-teal-900/50 transition-all hover:scale-105"
            >
                Enter System <ArrowRight />
            </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-slate-500 text-xs text-center w-full">
            <p>&copy; {new Date().getFullYear()} Bengal Rehabilitation & Research Pvt. Ltd. All Rights Reserved.</p>
            <p className="mt-1 opacity-50">Version 2.6.0 • Authorized Access Only</p>
        </div>

      </div>
    </div>
  );
};
