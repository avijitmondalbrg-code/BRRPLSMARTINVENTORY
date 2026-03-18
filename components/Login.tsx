
import React, { useState } from 'react';
import { LogIn, Sparkles, ShieldCheck, User, Lock } from 'lucide-react';
import { UserRole } from '../types';
import { COMPANY_LOGO_BASE64 } from '../constants';
import { auth } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';

interface LoginProps {
  logo: string;
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Hardcoded credentials as requested by user ("admin/user")
      let role: UserRole | null = null;
      
      if (username === 'admin' && password === 'brrpl9874') {
        role = 'admin';
      } else if (username === 'user' && password === 'user123') {
        role = 'user';
      }

      if (role) {
        try {
          // Sign in anonymously to Firebase to allow Firestore access via rules
          await signInAnonymously(auth);
          onLogin(role);
        } catch (authErr: any) {
          if (authErr.code === 'auth/admin-restricted-operation') {
            console.warn("Anonymous Auth is disabled in Firebase Console. Proceeding without auth as rules are currently public.");
            onLogin(role);
          } else {
            console.error("Firebase Auth error:", authErr);
            setError("Warning: Database connection failed. Error: " + (authErr.message || "Unknown"));
            setTimeout(() => onLogin(role), 2000);
          }
        }
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        setError("Login failed: Anonymous authentication is not enabled in Firebase Console. Please enable it in the Authentication > Sign-in method tab.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Login failed: Network error. Please check your internet connection.");
      } else {
        setError("System error during login: " + (err.message || "Please try again."));
      }
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
        <form onSubmit={handleSubmit} className="p-10 bg-gray-50/50 flex-1">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-700">Login to System</h2>
              <p className="text-gray-500 text-sm">Enter your credentials to access the dashboard.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-shake border border-red-100">
                <ShieldCheck size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#3159a6] focus:ring-0 transition outline-none text-gray-700 font-medium"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#3159a6] focus:ring-0 transition outline-none text-gray-700 font-medium"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#3159a6] hover:bg-[#254480] text-white font-bold py-4 rounded-2xl transition duration-200 shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogIn size={20} />
              )}
              {loading ? 'Authenticating...' : 'Login Now'}
            </button>

            <div className="flex items-center gap-2 justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">
              <ShieldCheck size={14} />
              <span>Secure Enterprise Access</span>
            </div>
          </div>
        </form>
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
