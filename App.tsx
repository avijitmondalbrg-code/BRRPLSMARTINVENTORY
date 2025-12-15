import React, { useState, useEffect } from 'react';
import { HearingAid, Invoice, ViewState, Patient, Quotation, FinancialNote, StockTransfer as StockTransferType, Lead, UserRole, AdvanceBooking } from './types';
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
import { Login } from './components/Login';
import { LayoutDashboard, Package, FileText, Repeat, Users, FileQuestion, FileMinus, FilePlus, Briefcase, Settings as SettingsIcon, Receipt, Home, LogOut, Wallet } from 'lucide-react';
import { fetchCollection, setDocument, updateDocument, deleteDocument } from './services/firebase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>(() => localStorage.getItem('brg_app_logo') || COMPANY_LOGO_BASE64);
  const [companySignature, setCompanySignature] = useState<string | null>(() => localStorage.getItem('brg_app_signature'));
  const [activeView, setActiveView] = useState<ViewState>('front-cover');
  
  const [inventory, setInventory] = useState<HearingAid[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [financialNotes, setFinancialNotes] = useState<FinancialNote[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransferType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [advanceBookings, setAdvanceBookings] = useState<AdvanceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [inv, invs, pats, quotes, notes, lds, trfs, advs] = await Promise.all([
            fetchCollection('inventory'),
            fetchCollection('invoices'),
            fetchCollection('patients'),
            fetchCollection('quotations'),
            fetchCollection('financialNotes'),
            fetchCollection('leads'),
            fetchCollection('stockTransfers'),
            fetchCollection('advanceBookings')
        ]);

        if (inv.length === 0 && invs.length === 0) {
           setInventory(INITIAL_INVENTORY);
           setInvoices(INITIAL_INVOICES);
           setPatients([]);
           setAdvanceBookings([]);
        } else {
           setInventory(inv as HearingAid[]);
           setInvoices(invs as Invoice[]);
           setPatients(pats as Patient[]);
           setQuotations(quotes as Quotation[]);
           setFinancialNotes(notes as FinancialNote[]);
           setLeads(lds as Lead[]);
           setStockTransfers(trfs as StockTransferType[]);
           setAdvanceBookings(advs as AdvanceBooking[]);
        }
      } catch (error) {
        console.warn("Loading local fallback data.");
        setInventory(INITIAL_INVENTORY);
        setInvoices(INITIAL_INVOICES);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogin = (role: UserRole) => {
      setUserRole(role);
      setIsAuthenticated(true);
      setActiveView('dashboard');
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUserRole(null);
      setActiveView('front-cover');
  };

  const handleUpdateSettings = (logo: string, signature: string | null) => {
    setCompanyLogo(logo);
    setCompanySignature(signature);
    localStorage.setItem('brg_app_logo', logo);
    if (signature) localStorage.setItem('brg_app_signature', signature);
    else localStorage.removeItem('brg_app_signature');
  };

  const handleTransferStock = async (itemId: string, to: string, sender: string, transporter: string, receiver: string, note: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    const trf: StockTransferType = { id: `TRF-${Date.now()}`, hearingAidId: itemId, brand: item.brand, model: item.model, serialNumber: item.serialNumber, fromLocation: item.location, toLocation: to, date: new Date().toISOString().split('T')[0], sender, transporter, receiver, note };
    setStockTransfers([trf, ...stockTransfers]);
    setInventory(inventory.map(i => i.id === itemId ? { ...item, location: to } : i));
    try {
        await setDocument('stockTransfers', trf.id, trf);
        await updateDocument('inventory', itemId, { location: to });
    } catch(e) {}
  };

  const handleSaveFinancialNote = async (note: FinancialNote) => {
      setFinancialNotes([...financialNotes, note]);
      try { await setDocument('financialNotes', note.id, note); } catch(e) {}
  };

  const handleDeleteFinancialNote = async (id: string) => {
      setFinancialNotes(prev => prev.filter(n => n.id !== id));
      try { await deleteDocument('financialNotes', id); } catch(e) {}
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Login logo={companyLogo} onLogin={handleLogin} />;
  if (activeView === 'front-cover') return <FrontCover logo={companyLogo} onNavigate={setActiveView} />;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 print:hidden">
        <div className="p-6 border-b border-slate-800 text-center cursor-pointer" onClick={() => setActiveView('front-cover')}>
          <div className="h-16 w-full bg-white rounded-xl flex items-center justify-center p-2 mb-2">
            <img src={companyLogo} alt="Logo" className="h-full object-contain" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">BRG Inventory Manager V1.0</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'advance-booking', label: 'Advances', icon: Wallet },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'billing', label: 'Billing', icon: FileText },
            { id: 'crm', label: 'CRM Leads', icon: Briefcase },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'quotation', label: 'Quotations', icon: FileQuestion },
            { id: 'receipts', label: 'Receipts', icon: Receipt },
            { id: 'credit-note', label: 'Credit Note', icon: FileMinus },
            { id: 'debit-note', label: 'Debit Note', icon: FilePlus },
            { id: 'transfer', label: 'Transfer', icon: Repeat },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveView(item.id as any)} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${activeView === item.id ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <item.icon size={18} /> <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors">
              <LogOut size={18} /> <span className="text-sm font-bold uppercase">Sign Out</span>
           </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto relative">
        <header className="bg-white border-b sticky top-0 z-10 px-8 py-4 flex justify-between items-center print:hidden shadow-sm">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-gray-800 capitalize tracking-tight">{activeView.replace('-', ' ')}</h2>
              <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-200">{userRole} ACCESS</span>
          </div>
          <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Bengal Rehabilitation & Research Pvt. Ltd.</span>
          </div>
        </header>
        
        <div className="p-8 max-w-7xl mx-auto print:p-0">
          {activeView === 'dashboard' && <Dashboard inventory={inventory} invoices={invoices} />}
          {activeView === 'inventory' && <Inventory inventory={inventory} onAdd={(item) => {
              const items = Array.isArray(item) ? item : [item];
              setInventory([...inventory, ...items]);
              items.forEach(i => setDocument('inventory', i.id, i));
          }} onUpdate={(item) => {
              setInventory(inventory.map(i => i.id === item.id ? item : i));
              updateDocument('inventory', item.id, item);
          }} onDelete={(id) => {
              setInventory(inventory.filter(i => i.id !== id));
              deleteDocument('inventory', id);
          }} userRole={userRole!} />}
          {activeView === 'advance-booking' && <AdvanceBookings bookings={advanceBookings} patients={patients} onAddBooking={b => {
              setAdvanceBookings([b, ...advanceBookings]);
              setDocument('advanceBookings', b.id, b);
          }} onUpdateBooking={()=>{}} onDeleteBooking={(id) => {
              setAdvanceBookings(advanceBookings.filter(b => b.id !== id));
              deleteDocument('advanceBookings', id);
          }} userRole={userRole!} logo={companyLogo} signature={companySignature} />}
          {activeView === 'billing' && <Billing inventory={inventory} invoices={invoices} patients={patients} onCreateInvoice={(inv, items) => {
              setInvoices([...invoices, inv]);
              setInventory(inventory.map(i => items.includes(i.id) ? { ...i, status: 'Sold' } : i));
              setDocument('invoices', inv.id, inv);
              items.forEach(id => updateDocument('inventory', id, { status: 'Sold' }));
          }} logo={companyLogo} signature={companySignature} userRole={userRole!} onUpdateInvoice={(inv) => {
              setInvoices(invoices.map(i => i.id === inv.id ? inv : i));
              updateDocument('invoices', inv.id, inv);
          }} onDelete={(id) => {
              const inv = invoices.find(i => i.id === id);
              if (inv) {
                const itemIds = inv.items.map(it => it.hearingAidId);
                setInventory(inventory.map(i => itemIds.includes(i.id) ? { ...i, status: 'Available' } : i));
                setInvoices(invoices.filter(i => i.id !== id));
                deleteDocument('invoices', id);
                itemIds.forEach(itemId => updateDocument('inventory', itemId, { status: 'Available' }));
              }
          }} />}
          {activeView === 'patients' && <Patients patients={patients} invoices={invoices} onAddPatient={(p) => {
              setPatients([p, ...patients]);
              setDocument('patients', p.id, p);
          }} onUpdatePatient={(p) => {
              setPatients(patients.map(i => i.id === p.id ? p : i));
              updateDocument('patients', p.id, p);
          }} onDelete={(id) => {
              setPatients(patients.filter(p => p.id !== id));
              deleteDocument('patients', id);
          }} logo={companyLogo} signature={companySignature} userRole={userRole!} />}
          {activeView === 'crm' && <CRM leads={leads} onAddLead={(l) => {
              setLeads([l, ...leads]);
              setDocument('leads', l.id, l);
          }} onUpdateLead={(l) => {
              setLeads(leads.map(i => i.id === l.id ? l : i));
              updateDocument('leads', l.id, l);
          }} onConvertToPatient={() => {}} onDelete={(id) => {
              setLeads(leads.filter(l => l.id !== id));
              deleteDocument('leads', id);
          }} userRole={userRole!} />}
          {activeView === 'quotation' && <Quotations inventory={inventory} quotations={quotations} patients={patients} onCreateQuotation={(q) => {
              setQuotations([q, ...quotations]);
              setDocument('quotations', q.id, q);
          }} onUpdateQuotation={(q) => {
              setQuotations(quotations.map(i => i.id === q.id ? q : i));
              updateDocument('quotations', q.id, q);
          }} onConvertToInvoice={()=>{}} onDelete={(id) => {
              setQuotations(quotations.filter(q => q.id !== id));
              deleteDocument('quotations', id);
          }} logo={companyLogo} signature={companySignature} userRole={userRole!} />}
          {activeView === 'receipts' && <ReceiptsManager invoices={invoices} logo={companyLogo} signature={companySignature} userRole={userRole!} onUpdateInvoice={(inv) => {
              setInvoices(invoices.map(i => i.id === inv.id ? inv : i));
              updateDocument('invoices', inv.id, inv);
          }} onDeleteReceipt={(invId, payId) => {
              const inv = invoices.find(i => i.id === invId);
              if (inv) {
                const updatedPayments = inv.payments.filter(p => p.id !== payId);
                const updatedInv = { ...inv, payments: updatedPayments };
                setInvoices(invoices.map(i => i.id === invId ? updatedInv : i));
                updateDocument('invoices', invId, updatedInv);
              }
          }} />}
          {activeView === 'credit-note' && <FinancialNotes type="CREDIT" notes={financialNotes} patients={patients} invoices={invoices} onSave={handleSaveFinancialNote} onDelete={handleDeleteFinancialNote} logo={companyLogo} signature={companySignature} userRole={userRole!} />}
          {activeView === 'debit-note' && <FinancialNotes type="DEBIT" notes={financialNotes} patients={patients} invoices={invoices} onSave={handleSaveFinancialNote} onDelete={handleDeleteFinancialNote} logo={companyLogo} signature={companySignature} userRole={userRole!} />}
          {activeView === 'transfer' && <StockTransfer inventory={inventory} transferHistory={stockTransfers} onTransfer={handleTransferStock} />}
          {activeView === 'settings' && <Settings currentLogo={companyLogo} currentSignature={companySignature} onSave={handleUpdateSettings} userRole={userRole!} />}
        </div>
      </main>
    </div>
  );
};

export default App;