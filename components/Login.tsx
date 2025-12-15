import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Building2, HelpCircle, Info } from 'lucide-react';
import { UserRole } from '../types';
import { COMPANY_LOGO_BASE64 } from '../constants';

interface LoginProps {
  logo: string;
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [imgError, setImgError] = useState(false);

  // The specific URL requested
  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate network delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const cleanUserId = userId.trim().toLowerCase();
      const cleanPassword = password.trim();
      
      // Standard System Credentials
      if (cleanUserId === 'admin' && cleanPassword === 'brrpl9874') {
          onLogin('admin');
      } else if (cleanUserId === 'user' && cleanPassword === 'user1234') {
          onLogin('user');
      } else {
         throw new Error("Invalid User ID or Password. Please check and try again.");
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header Section */}
        <div className="bg-white p-8 text-center border-b border-gray-100 pb-6">
           <div className="mx-auto h-24 w-24 flex items-center justify-center mb-4 bg-white rounded-full border border-gray-200 overflow-hidden p-2 shadow-inner">
               {!imgError ? (
                   <img 
                     src={LOGO_URL} 
                     alt="BRG Logo" 
                     className="h-full w-full object-contain"
                     onError={() => setImgError(true)}
                   />
               ) : (
                   <img 
                     src={COMPANY_LOGO_BASE64}
                     alt="BRG Logo (Fallback)"
                     className="h-full w-full object-contain"
                   />
               )}
           </div>
           <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">BRG Manager</h1>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Secure Internal Portal</p>
        </div>

        {/* Form Section */}
        <div className="p-8 bg-gray-50 flex-1 relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access User ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white shadow-sm font-medium"
                  placeholder="e.g. admin"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white shadow-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl flex items-start gap-3 animate-shake border border-red-100">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white font-black py-4 rounded-xl transition duration-200 shadow-xl shadow-teal-900/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group uppercase tracking-[0.2em]"
                >
                  {loading ? 'Initializing...' : 'Unlock System'}
                  {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
            </div>
          </form>

          {/* Credential Hint Toggle */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <button 
                onClick={() => setShowHint(!showHint)}
                className="text-[10px] font-black text-gray-400 hover:text-teal-600 uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors"
              >
                  <HelpCircle size={14}/> {showHint ? 'Hide Support Info' : 'Need Login Help?'}
              </button>
              
              {showHint && (
                  <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100 text-left animate-fade-in">
                      <p className="text-[10px] font-black text-teal-800 uppercase mb-2 border-b border-teal-200 pb-1">Default Demo Credentials</p>
                      <div className="space-y-1 text-[10px] font-bold text-teal-700">
                          <p>ADMIN ID: <span className="text-gray-900">admin</span></p>
                          <p>ADMIN PASS: <span className="text-gray-900">brrpl9874</span></p>
                          <div className="h-px bg-teal-200 my-2"></div>
                          <p>USER ID: <span className="text-gray-900">user</span></p>
                          <p>USER PASS: <span className="text-gray-900">user1234</span></p>
                      </div>
                  </div>
              )}
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-6 text-center text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
          Bengal Rehabilitation & Research Pvt. Ltd.
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};