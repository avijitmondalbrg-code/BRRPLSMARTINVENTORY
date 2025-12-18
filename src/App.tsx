import React, { useState, useEffect } from 'react';
import { HearingAid, Invoice, ViewState, Patient, Quotation, FinancialNote, StockTransfer as StockTransferType, Lead, UserRole, AdvanceBooking, CompanyAsset } from './types';
import { INITIAL_INVENTORY, INITIAL_INVOICES, INITIAL_QUOTATIONS, INITIAL_FINANCIAL_NOTES, INITIAL_LEADS, COMPANY_LOGO_BASE64 } from './constants';
import { Inventory } from './components/Inventory';
import { Billing } from './components/Billing';
import { StockTransfer } from './components/StockTransfer';
import { Dashboard } from './components/Dashboard';
import { Patients } from './components/Patients';
import { Quotations } from './components/Quotations';
import { FinancialNotes } from './components/FinancialNotes';
import { CRM } from './components/CRM';
import { Settings } from './components/Settings';
import { ReceiptsManager } from './components/ReceiptsManager';
import { AdvanceBookings } from './components/AdvanceBookings';
import { FrontCover } from './components/FrontCover';
import { CompanyAssets } from './components/CompanyAssets';
import { Login } from './components/Login';
import { LayoutDashboard, Package, FileText, Repeat, Users, FileQuestion, FileMinus, FilePlus, Briefcase, Settings as SettingsIcon, Receipt, Home, LogOut, Wallet, RefreshCw, HardDrive, AlertTriangle, ShieldAlert, CheckCircle2, WifiOff, Globe } from 'lucide-react';

// Firebase Services
import { fetchCollection, setDocument, updateDocument, deleteDocument } from './services/firebase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>(COMPANY_LOGO_BASE64);
  const [companySignature, setCompanySignature] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('front-cover');
  
  const [inventory, setInventory] = useState<HearingAid[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [financialNotes, setFinancialNotes] = useState<FinancialNote[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransferType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [advanceBookings, setAdvanceBookings] = useState<AdvanceBooking[]>([]);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string, code?: string } | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection timeout")), 30000)
    );

    try {
      const fetchPromise = Promise.all([
          fetchCollection('inventory'),
          fetchCollection('invoices'),
          fetchCollection('patients'),
          fetchCollection('quotations'),
          fetchCollection('financialNotes'),
          fetchCollection('leads'),
          fetchCollection('stockTransfers'),
          fetchCollection('advanceBookings'),
          fetchCollection('settings'),
          fetchCollection('companyAssets')
      ]);

      const [inv, invs, pats, quotes, notes, lds, trfs, advs, settings, assets] = await Promise.race([
          fetchPromise,
          timeoutPromise
      ]) as any[];

      if (settings && settings.length > 0) {
          // FIX: Explicitly cast clinicAssets to any to avoid Property 'logo' and 'signature' missing error in type { id: string; }
          const clinicAssets: any = settings.find((s: any) => s.id === 'clinic_assets');
          if (clinicAssets) {
              if (clinicAssets.logo) setCompanyLogo(clinicAssets.logo);
              if (clinicAssets.signature) setCompanySignature(clinicAssets.signature);
          }
      }

      setInventory((inv as HearingAid[]) || []);
      setInvoices((invs as Invoice[]) || []);
      setPatients((pats as Patient[]) || []);
      setQuotations((quotes as Quotation[]) || []);
      setFinancialNotes((notes as FinancialNote[]) || []);
      setLeads((lds as Lead[]) || []);
      setStockTransfers((trfs as StockTransferType[]) || []);
      setAdvanceBookings((advs as AdvanceBooking[]) || []);
      setCompanyAssets((assets as CompanyAsset[]) || []);
      
    } catch (err: any) {
      console.error("Critical error fetching data:", err);
      if (err.code === 'permission-denied') {
        setError({ code: 'PERMISSION_DENIED', message: "Firebase Security Rules are blocking access." });
      } else if (err.message === "Connection timeout" || (err.message && err.message.includes('backend'))) {
        setError({ code: 'UNREACHABLE', message: "The database backend is not responding. This is usually due to local network restrictions or a slow ISP." });
      } else {
        setError({ message: "System failed to establish a secure database handshake. Please check your internet connection." });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogin = (role: UserRole) => {
      setUserRole(role);
      setIsAuthenticated(true);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUserRole(null);
      setActiveView('front-cover');
  };

  const handleUpdateSettings = async (logo: string, signature: string | null) => {
    setCompanyLogo(logo);
    setCompanySignature(signature);
    try {
        await setDocument('settings', 'clinic_assets', {
            logo,
            signature,
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to sync settings:", e);
    }
  };

  const handleAddCompanyAsset = async (asset: CompanyAsset) => {
    setCompanyAssets([asset, ...companyAssets]);
    try { await setDocument('companyAssets', asset.id, asset); } catch(e) {}
  };

  const handleUpdateCompanyAsset = async (asset: CompanyAsset) => {
    setCompanyAssets(companyAssets.map(a => a.id === asset.id ? asset : a));
    try { await updateDocument('companyAssets', asset.id, asset); } catch(e) {}
  };

  const handleDeleteCompanyAsset = async (id: string) => {
    setCompanyAssets(companyAssets.filter(a => a.id !== id));
    try { await deleteDocument('companyAssets', id); } catch(e) {}
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    setInventory(prev => prev.filter(i => i.id !== itemId));
    try { await deleteDocument('inventory', itemId); } catch(e) {}
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    if (window.confirm("Delete invoice?")) {
        const itemIds = invoice.items.map(i => i.hearingAidId);
        setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, status: 'Available' } : item));
        setInvoices(prev => prev.filter(i => i.id !== invoiceId));
        try {
            for (const id of itemIds) { await updateDocument('inventory', id, { status: 'Available' }); }
            await deleteDocument('invoices', invoiceId);
        } catch(e) {}
    }
  };

  const handleDeleteReceipt = async (invoiceId: string, paymentId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const updatedPayments = inv.payments.filter(p => p.id !== paymentId);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, inv.finalTotal - totalPaid);
    const updatedInvoice = { ...inv, payments: updatedPayments, balanceDue, paymentStatus: balanceDue <= 1 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid') } as Invoice;
    setInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInvoice : i));
    try { await updateDocument('invoices', invoiceId, updatedInvoice); } catch(e) {}
  };

  const handleDeletePatient = async (id: string) => {
    if (invoices.some(i => i.patientId === id)) return alert("Cannot delete patient with active invoices.");
    setPatients(prev => prev.filter(p => p.id !== id));
    try { await deleteDocument('patients', id); } catch(e) {}
  };

  const handleDeleteLead = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    try { await deleteDocument('leads', id); } catch(e) {}
  };

  const handleAddInventory = async (items: HearingAid | HearingAid[]) => {
    if (Array.isArray(items)) {
      setInventory([...inventory, ...items]);
      items.forEach(item => setDocument('inventory', item.id, item).catch(e => {}));
    } else {
      setInventory(prev => [...prev, items]);
      setDocument('inventory', items.id, items).catch(e => {});
    }
  };

  const handleUpdateInventoryItem = async (updatedItem: HearingAid) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    try { await updateDocument('inventory', updatedItem.id, updatedItem); } catch(e) {}
  };

  const handleUpdateAdvanceBooking = async (b: AdvanceBooking) => {
    setAdvanceBookings(advanceBookings.map(item => item.id === b.id ? b : item));
    try { await updateDocument('advanceBookings', b.id, b); } catch(e) {}
  };

  const handleCreateInvoice = async (invoice: Invoice, soldItemIds: string[]) => {
    const exists = invoices.find(i => i.id === invoice.id);
    if (exists) {
      setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));
      try { await setDocument('invoices', invoice.id, invoice); } catch (e) {}
    } else {
      setInvoices([...invoices, invoice]);
      setInventory(prev => prev.map(item => soldItemIds.includes(item.id) ? { ...item, status: 'Sold' } : item));
      try {
          await setDocument('invoices', invoice.id, invoice);
          for (const id of soldItemIds) { await updateDocument('inventory', id, { status: 'Sold' }); }
      } catch(e) {}
    }
    setActiveView('billing');
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    try { await updateDocument('invoices', updatedInvoice.id, updatedInvoice); } catch(e) {}
  };

  const handleAddPatient = async (p: Patient) => {
    const patientWithDate = { ...p, addedDate: p.addedDate || new Date().toISOString().split('T')[0] };
    setPatients([...patients, patientWithDate]);
    try { await setDocument('patients', p.id, patientWithDate); } catch(e) {}
  };

  const handleUpdatePatient = async (p: Patient) => {
    setPatients(patients.map(item => item.id === p.id ? p : item));
    try { await updateDocument('patients', p.id, p); } catch(e) {}
  };

  const handleAddLead = async (l: Lead) => {
      setLeads([l, ...leads]);
      try { await setDocument('leads', l.id, l); } catch(e) {}
  };

  const handleUpdateLead = async (l: Lead) => {
      setLeads(leads.map(item => item.id === l.id ? l : item));
      try { await updateDocument('leads', l.id, l); } catch(e) {}
  };

  const handleConvertLeadToPatient = async (lead: Lead) => {
    if (patients.some(p => p.phone === lead.phone)) {
        alert("A patient with this phone already exists.");
        setActiveView('patients');
        return;
    }
    const newPatient: Patient = { id: `P-${Date.now()}`, name: lead.name, phone: lead.phone, address: '', referDoctor: '', audiologist: '', addedDate: new Date().toISOString().split('T')[0] };
    await handleAddPatient(newPatient);
    setActiveView('patients');
  };

  const handleAddAdvanceBooking = async (b: AdvanceBooking) => {
    setAdvanceBookings([b, ...advanceBookings]);
    try { await setDocument('advanceBookings', b.id, b); } catch(e) {}
  };

  const handleDeleteAdvanceBooking = async (id: string) => {
    setAdvanceBookings(prev => prev.filter(b => b.id !== id));
    try { await deleteDocument('advanceBookings', id); } catch(e) {}
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="h-16 w-16 border-4 border-[#3159a6] border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[#3159a6] font-black uppercase tracking-widest text-sm animate-pulse">Establishing Secure Connection...</p>
      <p className="text-gray-400 text-[10px] mt-2 font-bold uppercase tracking-wider">Optimizing for high latency network</p>
    </div>
  );

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center overflow-y-auto">
      {error.code === 'PERMISSION_DENIED' ? (
        <div className="max-w-2xl w-full animate-fade-in">
          <div className="bg-red-50 p-8 rounded-[3rem] text-red-600 mb-8 border-4 border-red-100 flex flex-col items-center shadow-xl">
            <ShieldAlert size={64} className="mb-4" />
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-red-800">Database Rules Conflict</h2>
            <p className="font-bold text-red-700/70 mb-6">Your Firebase Security Rules are blocking access to the collections.</p>
            
            <div className="bg-white p-6 rounded-2xl text-left w-full border-2 border-red-200 shadow-inner">
               <h3 className="font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-green-500" /> Required Fix Steps:
               </h3>
               <ol className="space-y-4 text-sm text-gray-700 font-medium">
                 <li className="flex gap-3">
                   <span className="bg-red-600 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                   <span>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 underline font-bold">Firebase Console</a> and select project <b>"brg-smart-inventory"</b>.</span>
                 </li>
                 <li className="flex gap-3">
                   <span className="bg-red-600 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                   <span>Click <b>"Firestore Database"</b> in the left sidebar.</span>
                 </li>
                 <li className="flex gap-3">
                   <span className="bg-red-600 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                   <span>Select the <b>"Rules"</b> tab at the top.</span>
                 </li>
                 <li className="flex gap-3">
                   <span className="bg-red-600 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">4</span>
                   <span>Replace everything there with:<br/>
                     <code className="block bg-gray-100 p-2 mt-2 rounded font-mono text-[10px] text-gray-800 border">
                       allow read, write: if true;
                     </code>
                   </span>
                 </li>
                 <li className="flex gap-3">
                   <span className="bg-red-600 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">5</span>
                   <span>Click <b>"Publish"</b> and retry below.</span>
                 </li>
               </ol>
            </div>
          </div>
          <button onClick={refreshData} className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-[#254687] transition shadow-2xl shadow-blue-900/40 flex items-center gap-3 mx-auto">
            <RefreshCw size={24} /> Sync & Retry Connection
          </button>
        </div>
      ) : error.code === 'UNREACHABLE' ? (
        <div className="animate-fade-in max-w-md w-full">
          <div className="bg-orange-50 p-10 rounded-[3.5rem] text-orange-600 mb-8 border-4 border-orange-100 flex flex-col items-center shadow-xl">
            <div className="bg-white p-6 rounded-full shadow-lg mb-6 relative">
               <WifiOff size={56} className="text-orange-500" />
               <div className="absolute -top-1 -right-1 bg-red-500 rounded-full h-6 w-6 border-4 border-white"></div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-orange-800">Connection Unreachable</h2>
            <p className="font-bold text-orange-700/80 mb-6 text-sm leading-relaxed">{error.message}</p>
            
            <div className="text-left w-full space-y-4 text-xs bg-white/60 p-6 rounded-3xl border border-orange-100">
               <p className="flex gap-3 items-start"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1 shrink-0"></span> <span>Corporate or Guest Wi-Fi may be blocking <b>Google Cloud APIs</b>. Try switching to a mobile hotspot.</span></p>
               <p className="flex gap-3 items-start"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1 shrink-0"></span> <span>Ensure your browser extensions (like AdBlock or Privacy Badger) aren't interfering with database requests.</span></p>
               <p className="flex gap-3 items-start"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1 shrink-0"></span> <span>The system is configured to use <b>Long Polling</b> as a fallback for restricted networks.</span></p>
            </div>
          </div>
          <button onClick={refreshData} className="bg-[#3159a6] text-white px-10 py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-[#254687] transition shadow-2xl shadow-blue-900/30 mx-auto flex items-center gap-3">
            <Globe size={20} /> Attempt Global Re-sync
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="bg-red-50 p-6 rounded-full text-red-500 mb-6 inline-block shadow-md">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">System Error</h2>
          <p className="text-gray-500 max-w-md mb-8 mx-auto font-medium">{error.message}</p>
          <button onClick={refreshData} className="bg-[#3159a6] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#254687] transition shadow-xl mx-auto flex items-center gap-3">
            <RefreshCw size={20} /> Force Reboot
          </button>
        </div>
      )}
      <p className="mt-12 text-[10px] text-gray-300 font-black uppercase tracking-[0.2em]">Bengal Rehabilitation & Research Pvt. Ltd. | v2.7.5</p>
    </div>
  );

  if (!isAuthenticated) return <Login logo={companyLogo} onLogin={handleLogin} />;
  if (activeView === 'front-cover') return <FrontCover logo={companyLogo} onNavigate={setActiveView} />;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10 print:hidden">
        <div className="p-6 border-b border-slate-800 cursor-pointer" onClick={() => setActiveView('front-cover')}>
          <div className="h-16 w-full bg-white rounded flex items-center justify-center p-2 mb-2"><img src={companyLogo} alt="Logo" className="h-full object-contain" /></div>
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">v2.7.5 Enterprise Sync</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'front-cover', label: 'Home', icon: Home },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'assets', label: 'Company Assets', icon: HardDrive },
            { id: 'advance-booking', label: 'Advance Bookings', icon: Wallet },
            { id: 'crm', label: 'Sales CRM', icon: Briefcase },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'billing', label: 'Billing', icon: FileText },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'receipts', label: 'Receipts', icon: Receipt },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition ${activeView === item.id ? 'bg-[#3159a6] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon size={18} /> <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button onClick={refreshData} className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-blue-300 hover:bg-slate-800 hover:text-white transition">
                <RefreshCw size={18} /> <span className="text-sm font-medium">Sync Data</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-red-400 hover:bg-red-900/20 mt-1 transition">
                <LogOut size={18} /> <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800 capitalize">{activeView.replace('-', ' ')}</h2>
              <span className="text-xs font-bold uppercase text-[#3159a6] bg-blue-50 px-2 py-1 rounded border border-blue-200">{userRole}</span>
          </div>
          <div className="text-right text-xs text-gray-400 hidden sm:block">Bengal Rehabilitation & Research Pvt. Ltd.</div>
        </header>
        <div className="p-8 max-w-7xl mx-auto print:p-0">
          {activeView === 'dashboard' && <Dashboard inventory={inventory} invoices={invoices} />}
          {activeView === 'inventory' && <Inventory inventory={inventory} onAdd={handleAddInventory} onUpdate={handleUpdateInventoryItem} onDelete={handleDeleteInventoryItem} userRole={userRole!} />}
          {activeView === 'assets' && <CompanyAssets assets={companyAssets} onAdd={handleAddCompanyAsset} onUpdate={handleUpdateCompanyAsset} onDelete={handleDeleteCompanyAsset} userRole={userRole!} />}
          {activeView === 'advance-booking' && <AdvanceBookings bookings={advanceBookings} patients={patients} onAddBooking={handleAddAdvanceBooking} onUpdateBooking={handleUpdateAdvanceBooking} onDeleteBooking={handleDeleteAdvanceBooking} userRole={userRole!} logo={companyLogo} signature={companySignature} />}
          {activeView === 'billing' && <Billing inventory={inventory} invoices={invoices} patients={patients} advanceBookings={advanceBookings} onCreateInvoice={handleCreateInvoice} onUpdateInvoice={handleUpdateInvoice} onDelete={handleDeleteInvoice} logo={companyLogo} signature={companySignature} userRole={userRole!}/>}
          {activeView === 'crm' && <CRM leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onConvertToPatient={handleConvertLeadToPatient} onDelete={handleDeleteLead} userRole={userRole!} />}
          {activeView === 'patients' && <Patients patients={patients} invoices={invoices} onAddPatient={handleAddPatient} onUpdatePatient={handleUpdatePatient} onDelete={handleDeletePatient} logo={companyLogo} signature={companySignature} userRole={userRole!} />}
          {activeView === 'receipts' && <ReceiptsManager invoices={invoices} logo={companyLogo} signature={companySignature} onUpdateInvoice={handleUpdateInvoice} onDeleteReceipt={handleDeleteReceipt} userRole={userRole!} />}
          {activeView === 'settings' && <Settings currentLogo={companyLogo} currentSignature={companySignature} onSave={handleUpdateSettings} userRole={userRole!} />}
        </div>
      </main>
    </div>
  );
};
export default App;