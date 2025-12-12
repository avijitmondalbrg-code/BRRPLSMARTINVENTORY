
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, Building2 } from 'lucide-react';
import { UserRole } from '../types';

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

  // The specific URL requested
  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const cleanUserId = userId.trim().toLowerCase();
      const cleanPassword = password.trim();
      
      // Credential Check
      if (cleanUserId === 'admin' && cleanPassword === 'brrpl9874') {
          onLogin('admin');
      } else if (cleanUserId === 'user' && cleanPassword === 'user1234') {
          onLogin('user');
      } else {
         throw new Error("Invalid User ID or Password");
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-teal-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header Section */}
        <div className="bg-white p-8 text-center border-b border-gray-100 pb-6">
           <div className="mx-auto h-24 w-24 flex items-center justify-center mb-4 bg-white rounded-full border border-gray-200 overflow-hidden p-2">
               {!imgError ? (
                   <img 
                     src={LOGO_URL} 
                     alt="BRG Logo" 
                     className="h-full w-full object-contain"
                     onError={() => setImgError(true)}
                   />
               ) : (
                   <div className="flex flex-col items-center justify-center text-teal-700">
                       <Building2 size={32} />
                       <span className="text-[10px] font-bold mt-1">BRG</span>
                   </div>
               )}
           </div>
           <h1 className="text-2xl font-bold text-gray-800 tracking-tight">BRG Inventory Manager</h1>
           <p className="text-gray-500 text-sm mt-2">Secure Access Portal</p>
        </div>

        {/* Form Section */}
        <div className="p-8 bg-gray-50 flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">User ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white shadow-sm"
                  placeholder="Enter User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white shadow-sm"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-fade-in border border-red-100">
                <span className="block w-2 h-2 bg-red-600 rounded-full"></span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3.5 rounded-xl transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? 'Verifying...' : 'Login System'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
