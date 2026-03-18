
import React, { useState } from 'react';
import { LogIn, Sparkles, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { COMPANY_LOGO_BASE64 } from '../constants';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface LoginProps {
  logo: string;
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Role will be handled by App.tsx onAuthStateChanged
        // But we can trigger a success state here if needed
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
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
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-700">Welcome Back</h2>
              <p className="text-gray-500 text-sm">Please sign in with your Google account to access the system.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-shake border border-red-100">
                <ShieldCheck size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl transition duration-200 shadow-lg flex items-center justify-center gap-3 border-2 border-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#3159a6] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  )}
                  {loading ? 'Authorizing...' : 'Sign in with Google'}
                </button>
            </div>

            <div className="flex items-center gap-2 justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">
              <ShieldCheck size={14} />
              <span>Secure Enterprise Access</span>
            </div>
          </div>
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
