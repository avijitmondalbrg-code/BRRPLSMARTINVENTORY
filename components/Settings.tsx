
import React, { useRef } from 'react';
import { Settings as SettingsIcon, Upload, Trash2, Save, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface SettingsProps {
  currentLogo: string;
  currentSignature: string | null;
  onSave: (logo: string, signature: string | null) => void;
  userRole: UserRole;
}

export const Settings: React.FC<SettingsProps> = ({ currentLogo, currentSignature, onSave, userRole }) => {
  const [logo, setLogo] = React.useState<string>(currentLogo);
  const [signature, setSignature] = React.useState<string | null>(currentSignature);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

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
    onSave(logo, signature);
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
    </div>
  );
};
