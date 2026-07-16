
import React, { useRef, useState } from 'react';
import { Settings as SettingsIcon, Upload, Trash2, Save, Lock, CreditCard, Download, Database, RefreshCw, FileJson, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

interface SettingsProps {
  currentLogo: string;
  currentSignature: string | null;
  onSave: (logo: string, signature: string | null, rzpKeyId: string, rzpKeySecret: string, rzpEnabled: boolean) => void;
  userRole: UserRole;
  currentRzpKeyId?: string;
  currentRzpKeySecret?: string;
  currentRzpEnabled?: boolean;
  onBackup?: () => Promise<void>;
  onRestore?: (data: any, onProgress?: (text: string) => void) => Promise<boolean>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  currentLogo, 
  currentSignature, 
  onSave, 
  userRole, 
  currentRzpKeyId = '', 
  currentRzpKeySecret = '', 
  currentRzpEnabled = false,
  onBackup,
  onRestore
}) => {
  const [logo, setLogo] = React.useState<string>(currentLogo);
  const [signature, setSignature] = React.useState<string | null>(currentSignature);
  const [rzpKeyId, setRzpKeyId] = useState<string>(currentRzpKeyId);
  const [rzpKeySecret, setRzpKeySecret] = useState<string>(currentRzpKeySecret);
  const [rzpEnabled, setRzpEnabled] = useState<boolean>(currentRzpEnabled);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    if (!onBackup) return;
    setBackupLoading(true);
    try {
      await onBackup();
    } catch (err: any) {
      alert(`ব্যাকআপ করতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (confirm("আপনি কি নিশ্চিত যে আপনি এই ব্যাকআপ ফাইলটি রিস্টোর করতে চান? এটি বর্তমান ডাটাবেসের ডাটার সাথে মার্জ হবে বা ডাটা প্রতিস্থাপন করবে।")) {
            setRestoreLoading(true);
            setProgressMessage("শুরু হচ্ছে...");
            if (onRestore) {
              const success = await onRestore(parsed, (text) => setProgressMessage(text));
              if (success) {
                if (restoreInputRef.current) restoreInputRef.current.value = '';
              }
            }
          }
        } catch (err) {
          alert("ভুল ফাইল ফরম্যাট। অনুগ্রহ করে একটি সঠিক .json ব্যাকআপ ফাইল আপলোড করুন।");
        } finally {
          setRestoreLoading(false);
          setProgressMessage('');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (type === 'logo') setLogo(reader.result);
          else setSignature(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(logo, signature, rzpKeyId, rzpKeySecret, rzpEnabled);
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <SettingsIcon className="text-primary" />
            System Configuration
        </h2>
        {userRole !== 'admin' && (
            <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-100 px-3 py-1.5 rounded-full border">
                <Lock size={14} /> Read-Only Mode
            </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">Clinic Branding & Assets</h3>
            <p className="text-sm text-gray-500">Manage the images that appear on your invoices and receipts.</p>
        </div>
        
        <div className="p-6 space-y-8">
            {/* Logo Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-40 bg-gray-50">
                        {logo ? (
                            <img src={logo} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <span className="text-gray-400 text-sm">No Logo</span>
                        )}
                    </div>
                </div>
                <div className="md:col-span-2 flex flex-col justify-center space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Upload a high-quality PNG or SVG logo for better print results.</p>
                        <input 
                            type="file" 
                            ref={logoInputRef} 
                            onChange={(e) => handleFileChange(e, 'logo')} 
                            accept="image/*" 
                            className="hidden" 
                            disabled={userRole !== 'admin'}
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => logoInputRef.current?.click()}
                                disabled={userRole !== 'admin'}
                                className={`px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                            >
                                <Upload size={16}/> Upload New Logo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <hr />

            {/* Signature Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Authorized Signature</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-32 bg-gray-50 relative">
                        {signature ? (
                            <img src={signature} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <span className="text-gray-400 text-sm italic">No Signature Uploaded</span>
                        )}
                    </div>
                </div>
                <div className="md:col-span-2 flex flex-col justify-center space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Upload a scanned image of the authorized signature (transparent background recommended).</p>
                        <input 
                            type="file" 
                            ref={sigInputRef} 
                            onChange={(e) => handleFileChange(e, 'signature')} 
                            accept="image/*" 
                            className="hidden" 
                            disabled={userRole !== 'admin'}
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => sigInputRef.current?.click()}
                                disabled={userRole !== 'admin'}
                                className={`px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                            >
                                <Upload size={16}/> Upload Signature
                            </button>
                            {signature && (
                                <button 
                                    onClick={() => setSignature(null)}
                                    disabled={userRole !== 'admin'}
                                    className={`px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 flex items-center gap-2 ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}
                                >
                                    <Trash2 size={16}/> Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <hr className="my-8" />

            {/* Razorpay Gateway Integration */}
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <CreditCard size={18} className="text-[#3159a6]" />
                        Razorpay Gateway Secure API Integration
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">Enable online card, UPI, netbanking & QR codes directly with your custom merchant keys.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase text-gray-500 tracking-wider">Gateway Status:</span>
                    <button 
                        onClick={() => setRzpEnabled(!rzpEnabled)} 
                        disabled={userRole !== 'admin'}
                        type="button"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''} ${rzpEnabled ? 'bg-[#3159a6]' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rzpEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border">{rzpEnabled ? 'Active / Live' : 'Inactive / Off'}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-700 mb-2">Razorpay Key ID (Client Key)</label>
                        <input 
                            type="text" 
                            value={rzpKeyId} 
                            onChange={(e) => setRzpKeyId(e.target.value)}
                            placeholder="e.g. rzp_live_xxxxxxxxxxxx or rzp_test_xxxxxxxxxxxx"
                            disabled={userRole !== 'admin'}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-[#3159a6] font-mono transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-700 mb-2">Razorpay Key Secret (Server Secret)</label>
                        <input 
                            type="password" 
                            value={rzpKeySecret} 
                            onChange={(e) => setRzpKeySecret(e.target.value)}
                            placeholder="••••••••••••••••••••"
                            disabled={userRole !== 'admin'}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-slate-700 outline-none focus:border-[#3159a6] font-mono transition"
                        />
                    </div>
                </div>

                <div className="border border-dashed border-blue-200 bg-blue-50/50 p-4 rounded-xl flex items-start gap-2.5">
                    <span className="text-[10px] text-blue-800 font-extrabold uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded shrink-0">NOTICE</span>
                    <span className="text-xs text-slate-500 font-semibold leading-normal">To test transactions without inputting merchant keys, simply leave Key ID empty. The payment drawer automatically initiates a secure Sandbox Simulator, letting your operators inspect receipt formats and sync records seamlessly.</span>
                </div>
            </div>
        </div>
        
        {userRole === 'admin' && (
            <div className="bg-gray-50 p-4 flex justify-end border-t">
                <button 
                    onClick={handleSave}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition shadow flex items-center gap-2"
                >
                    <Save size={18} /> Save Configuration
                </button>
            </div>
        )}
      </div>

      {/* Database Backup & Recovery Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Database className="text-[#3159a6]" size={18} />
              Database Backup & Recovery Manager (ডাটাবেস ব্যাকআপ এবং রিকভারি ম্যানেজার)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Create offline database backups or restore records instantly to prevent data loss.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 animate-pulse">
            Security Node Active
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Download Backup */}
            <div className="space-y-4 border-r border-gray-100 pr-0 md:pr-8 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Download size={16} className="text-blue-600" />
                  ১. নিরাপদ ব্যাকআপ তৈরি করুন (Create Secure Backup)
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  আপনার ইনভেন্টরি, ইনভয়েস, পেশেন্ট ডাটাবেস, পেমেন্ট এবং সেটিংস সহ সবগুলো ডাটাবেস কালেকশন একটি সিঙ্গেল ব্যাকআপ ফাইল (.json) হিসেবে ডাউনলোড করুন। সার্ভার ওভারলোড বা কোনো ডাটা ত্রুটি হলে এই ফাইলটি ব্যবহার করে ডাটা ফিরিয়ে আনা সম্ভব।
                </p>
                
                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700">✓ ব্যাকআপ এর আওতাভুক্ত বিষয়সমূহ:</p>
                  <ul className="list-disc list-inside grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <li>ইনভেন্টরি রেকর্ডস</li>
                    <li>বিলিং ও ইনভয়েস</li>
                    <li>পেশেন্ট প্রোফাইল</li>
                    <li>এডভান্স পেমেন্টস</li>
                    <li>সেলস লিড ও কোটেশন</li>
                    <li>কোম্পানি অ্যাসেটস</li>
                  </ul>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleBackup}
                disabled={backupLoading || restoreLoading}
                className="w-full mt-4 bg-[#3159a6] hover:bg-[#254687] text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backupLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    ডাটা ডাউনলোড হচ্ছে...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    ব্যাকআপ ফাইল ডাউনলোড করুন (Download Backup)
                  </>
                )}
              </button>
            </div>

            {/* Restore Backup */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Upload size={16} className="text-orange-600" />
                  ২. ব্যাকআপ থেকে পুনরুদ্ধার (Restore from Backup)
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  পূর্বে ডাউনলোড করা ব্যাকআপ ফাইল (.json) আপলোড করে সম্পূর্ণ ডাটাবেস রি-স্টোর করতে পারবেন। <b className="text-rose-600 font-bold">সতর্কতা:</b> এই প্রক্রিয়াটি আপনার বর্তমান ডাটাবেসে ডাটা যুক্ত করবে এবং ডুপ্লিকেট আইডি থাকলে তা আপডেট করবে।
                </p>

                <div className="mt-4 border border-dashed border-orange-200 bg-orange-50/40 rounded-lg p-3 text-[11px] text-orange-800">
                  <p className="font-bold mb-1">⚠️ গুরুত্বপূর্ণ নির্দেশনাবলী:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>শুধুমাত্র পূর্বের ডাউনলোড করা .json ফাইল ব্যবহার করুন।</li>
                    <li>রিস্টোর করার সময় ইন্টারনেট সংযোগ বিচ্ছিন্ন করবেন না।</li>
                    <li>ডাটা আপলোড সফল হলে অ্যাপ্লিকেশন রি-সিনক্রোনাইজ হবে।</li>
                  </ul>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={restoreInputRef}
                  onChange={handleFileRestoreChange}
                  accept=".json"
                  className="hidden"
                  disabled={backupLoading || restoreLoading || userRole !== 'admin'}
                />
                
                <button
                  type="button"
                  onClick={() => restoreInputRef.current?.click()}
                  disabled={backupLoading || restoreLoading || userRole !== 'admin'}
                  className={`w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 text-sm ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50 disabled:cursor-not-allowed'}`}
                >
                  {restoreLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      {progressMessage || 'রিস্টোর করা হচ্ছে...'}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      ব্যাকআপ ফাইল আপলোড করুন (Upload & Restore)
                    </>
                  )}
                </button>
                {userRole !== 'admin' && (
                  <p className="text-[10px] text-center text-rose-500 font-semibold mt-2">
                    * রিস্টোর অপশনটি ব্যবহারের জন্য অ্যাডমিন পারমিশন আবশ্যক।
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
