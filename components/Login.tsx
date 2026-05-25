
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { UserRole, AppUser } from '../types';
import { COMPANY_LOGO_BASE64 } from '../constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface LoginProps {
  logo: string;
  onLogin: (role: UserRole, userDetails: AppUser) => void;
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
      await new Promise(resolve => setTimeout(resolve, 300));
      const cleanUserId = uid.trim().toLowerCase();
      const cleanPassword = pass.trim();

      if (!cleanUserId || !cleanPassword) {
         throw new Error("ইউজার আইডি এবং পাসওয়ার্ড দেওয়া আবশ্যক।");
      }

      // 1. Try to fetch from Firebase users collection
      let fetchedUser: AppUser | null = null;
      try {
        const docRef = doc(db, 'users', cleanUserId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          fetchedUser = { id: docSnap.id, ...docSnap.data() } as AppUser;
        }
      } catch (dbErr) {
        console.warn("Database check fail, using offline fallbacks:", dbErr);
      }

      // 2. If user exists in Firestore, authenticate
      if (fetchedUser) {
        if (fetchedUser.status === 'Blocked') {
          throw new Error("আপনার অ্যাকাউন্টটি ব্লক বা স্থগিত করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।");
        }
        if (fetchedUser.password === cleanPassword) {
          onLogin(fetchedUser.role, fetchedUser);
          return;
        } else {
          throw new Error("ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিন।");
        }
      }
      
      // 3. Fallback matching pre-defined local users
      if ((cleanUserId === 'admin' && cleanPassword === '9830447176') || 
          (cleanUserId === 'admin' && cleanPassword === 'brrpl9830')) {
          onLogin('admin', { id: 'admin', username: 'admin', name: 'System Administrator', role: 'admin', status: 'Active' });
      } else if (cleanUserId === 'user' && cleanPassword === 'xxxxxxxx') {
          onLogin('user', { id: 'user', username: 'user', name: 'Default User', role: 'user', status: 'Active' });
      } else {
          throw new Error("ভুল ইউজার আইডি বা পাসওয়ার্ড। দয়া করে সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।");
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
    setPassword('9830447176');
    handleLoginProcess('admin', '9830447176');
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
           <p className="text-[#3159a6] text-[10px] font-black uppercase tracking-[0.3em] mt-3">Advanced Smart ERP</p>
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
