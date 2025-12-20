
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
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
  const [imgError, setImgError] = useState(false);

  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  const handleLoginProcess = async (uid: string, pass: string) => {
    setError('');
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const cleanUserId = uid.trim().toLowerCase();
      const cleanPassword = pass.trim();
      
      if ((cleanUserId === 'admin' && cleanPassword === 'admin') || 
          (cleanUserId === 'admin' && cleanPassword === 'brrpl9874')) {
          onLogin('admin');
      } else if (cleanUserId === 'user' && cleanPassword === 'user1234') {
          onLogin('user');
      } else {
         throw new Error("Invalid User ID or Password. Please check and try again.");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginProcess(userId, password);
  };

  const handleQuickLogin = () => {
    setUserId('admin');
    setPassword('admin');
    handleLoginProcess('admin', 'admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3159a6] p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden flex flex-col animate-fade-in relative z-10 border-4 border-white/10">
        
        {/* Header Section */}
        <div className="bg-white p-10 text-center border-b border-gray-100 relative">
           <div className="mx-auto h-28 w-28 flex items-center justify-center mb-6 bg-white rounded-3xl border border-gray-100 overflow-hidden p-3 shadow-xl ring-4 ring-gray-50">
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
           <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase leading-none">BRG Inventory Manager</h1>
           <p className="text-[#3159a6] text-[10px] font-black uppercase tracking-[0.3em] mt-3">Advanced Clinical ERP</p>
        </div>

        {/* Form Section */}
        <div className="p-10 bg-gray-50/50 flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Identity</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#3159a6] transition-colors" size={20} />
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-[#3159a6] outline-none transition bg-white shadow-sm font-bold text-gray-700"
                  placeholder="admin"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#3159a6] transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-100 rounded-2xl focus:border-[#3159a6] outline-none transition bg-white shadow-sm font-bold text-gray-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#3159a6]"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-shake border border-red-100">
                <ShieldCheck size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#3159a6] hover:bg-[#254687] text-white font-black py-4 rounded-2xl transition duration-200 shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-sm"
                >
                  {loading ? 'Authorizing...' : 'Unlock System'}
                  {!loading && <ArrowRight size={18} />}
                </button>
                
                
            </div>
          </form>
        </div>
      </div>
     
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
};
