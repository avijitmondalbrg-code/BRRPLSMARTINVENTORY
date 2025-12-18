
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
import { LayoutDashboard, Package, FileText, Repeat, Users, FileQuestion, FileMinus, FilePlus, Briefcase, Settings as SettingsIcon, Receipt, Home, LogOut, Wallet, RefreshCw } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [inv, invs, pats, quotes, notes, lds, trfs, advs, settings] = await Promise.all([
          fetchCollection('inventory'),
          fetchCollection('invoices'),
          fetchCollection('patients'),
          fetchCollection('quotations'),
          fetchCollection('financialNotes'),
          fetchCollection('leads'),
          fetchCollection('stockTransfers'),
          fetchCollection('advanceBookings'),
          fetchCollection('settings')
      ]);

      // Load Cloud Settings (Logo & Signature)
      if (settings && settings.length > 0) {
          const clinicAssets = settings.find(s => s.id === 'clinic_assets');
          if (clinicAssets) {
              if (clinicAssets.logo) setCompanyLogo(clinicAssets.logo);
              if (clinicAssets.signature) setCompanySignature(clinicAssets.signature);
          }
      }

      if (inv.length === 0 && invs.length === 0) {
         setInventory(INITIAL_INVENTORY);
         setInvoices(INITIAL_INVOICES);
         setQuotations(INITIAL_QUOTATIONS);
         setFinancialNotes(INITIAL_FINANCIAL_NOTES);
         setLeads(INITIAL_LEADS);
         const initialPatients: Patient[] = [];
         INITIAL_INVOICES.forEach(inv => { if(inv.patientDetails) initialPatients.push({ ...inv.patientDetails, addedDate: inv.date }); });
         setPatients(initialPatients);
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
      console.warn("Firebase unreachable. Loading local fallback data.", error);
      if (inventory.length === 0) {
          setInventory(INITIAL_INVENTORY);
          setInvoices(INITIAL_INVOICES);
          const initialPatients: Patient[] = [];
          setPatients(initialPatients);
          setAdvanceBookings([]);
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
    
    // Cloud Sync Settings
    try {
        await setDocument('settings', 'clinic_assets', {
            logo,
            signature,
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to sync settings to cloud:", e);
        // Fallback to localStorage if cloud fails
        localStorage.setItem('brg_app_logo', logo);
        if (signature) localStorage.setItem('brg_app_signature', signature);
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    setInventory(prev => prev.filter(i => i.id !== itemId));
    try { await deleteDocument('inventory', itemId); } catch(e) { console.error("Firebase Sync Error", e); }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    if (window.confirm("Delete invoice? This will restock the items.")) {
        const itemIds = invoice.items.map(i => i.hearingAidId);
        setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, status: 'Available' } : item));
        setInvoices(prev => prev.filter(i => i.id !== invoiceId));
        try {
            for (const id of itemIds) { await updateDocument('inventory', id, { status: 'Available' }); }
            await deleteDocument('invoices', invoiceId);
        } catch(e) { console.error("Firebase Sync Error", e); }
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
    try { await updateDocument('invoices', invoiceId, updatedInvoice); } catch(e) { console.error("Firebase Sync Error", e); }
  };

  const handleDeleteQuotation = async (id: string) => {
      setQuotations(prev => prev.filter(q => q.id !== id));
      try { await deleteDocument('quotations', id); } catch(e) { console.error("Firebase Sync Error", e); }
  };

  const handleDeleteFinancialNote = async (id: string) => {
      setFinancialNotes(prev => prev.filter(n => n.id !== id));
      try { await deleteDocument('financialNotes', id); } catch(e) { console.error("Firebase Sync Error", e); }
  };

  const handleDeletePatient = async (id: string) => {
      if (invoices.some(i => i.patientId === id)) return alert("Cannot delete patient with invoices.");
      setPatients(prev => prev.filter(p => p.id !== id));
      try { await deleteDocument('patients', id); } catch(e) { console.error("Firebase Sync Error", e); }
  };

  const handleDeleteLead = async (id: string) => {
      setLeads(prev => prev.filter(l => l.id !== id));
      try { await deleteDocument('leads', id); } catch(e) { console.error("Firebase Sync Error", e); }
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
    const patientPhone = invoice.patientDetails?.phone;
    if (patientPhone) {
        const lead = leads.find(l => l.phone === patientPhone);
        if (lead && lead.status !== 'Won') {
            const updatedLead = { ...lead, status: 'Won' as const };
            setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
            updateDocument('leads', lead.id, { status: 'Won' }).catch(e => {});
        }
    }

    invoice.payments.forEach(p => {
        if (p.method === 'Advance' && p.note?.includes('Ref:')) {
             const parts = p.note.split('Ref:');
             if (parts.length > 1) {
                 const bookingId = parts[1].trim();
                 const booking = advanceBookings.find(b => b.id === bookingId);
                 if (booking && booking.status === 'Active') {
                     const updatedBooking = { ...booking, status: 'Consumed' as const };
                     setAdvanceBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
                     updateDocument('advanceBookings', booking.id, { status: 'Consumed' }).catch(e => {});
                 }
             }
        }
    });

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
    try { await setDocument('invoices', updatedInvoice.id, updatedInvoice); } catch(e) {}
  };

  const handleCreateQuotation = async (quotation: Quotation) => {
    setQuotations([...quotations, quotation]);
    try { await setDocument('quotations', quotation.id, quotation); } catch(e) {}
  };

  const handleUpdateQuotation = async (updatedQuotation: Quotation) => {
    setQuotations(prev => prev.map(q => q.id === updatedQuotation.id ? updatedQuotation : q));
    try { await updateDocument('quotations', updatedQuotation.id, updatedQuotation); } catch(e) {}
  };

  const handleConvertQuotation = async (quotation: Quotation) => {
      const newInvoiceId = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;
      const { status, ...data } = quotation;
      const newInvoice: Invoice = { ...data, id: newInvoiceId, payments: [], paymentStatus: 'Unpaid', balanceDue: quotation.finalTotal, date: new Date().toISOString().split('T')[0] } as any;
      await handleCreateInvoice(newInvoice, quotation.items.map(i => i.hearingAidId));
      const updatedQuote = { ...quotation, status: 'Converted' as const };
      setQuotations(prev => prev.map(q => q.id === quotation.id ? updatedQuote : q));
      try { await updateDocument('quotations', quotation.id, updatedQuote); } catch(e) {}
  };

  const handleSaveFinancialNote = async (note: FinancialNote) => {
      setFinancialNotes([...financialNotes, note]);
      try { await setDocument('financialNotes', note.id, note); } catch(e) {}
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

  const handleAddPatient = async (p: Patient) => {
    const patientWithDate = { ...p, addedDate: p.addedDate || new Date().toISOString().split('T')[0] };
    const leadExists = leads.some(l => l.phone === p.phone);
    if (!leadExists) {
        const newLead: Lead = {
            id: `L-${Date.now()}`,
            name: p.name,
            phone: p.phone,
            source: 'Manual Patient Entry',
            status: 'New',
            createdAt: patientWithDate.addedDate,
            activities: [{
                id: `ACT-${Date.now()}`,
                type: 'Note',
                date: patientWithDate.addedDate,
                content: 'Automatically created from Patient Registry'
            }],
            notes: 'Patient added via Registry'
        };
        setLeads(prev => [newLead, ...prev]);
        setDocument('leads', newLead.id, newLead).catch(e => {});
    }
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
        alert("A patient with this phone number already exists.");
        setActiveView('patients');
        return;
    }
    const newPatient: Patient = { id: `P-${Date.now()}`, name: lead.name, phone: lead.phone, address: '', referDoctor: '', audiologist: '', state: 'West Bengal', country: 'India', addedDate: new Date().toISOString().split('T')[0] };
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

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-white"><div className="h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-gray-500 font-medium">Syncing Data...</p></div>;
  if (!isAuthenticated) return <Login logo={companyLogo} onLogin={handleLogin} />;
  if (activeView === 'front-cover') return <FrontCover logo={companyLogo} onNavigate={setActiveView} />;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10 print:hidden">
        <div className="p-6 border-b border-slate-800 cursor-pointer" onClick={() => setActiveView('front-cover')}>
          <div className="h-16 w-full bg-white rounded flex items-center justify-center p-2 mb-2"><img src={companyLogo} alt="Logo" className="h-full object-contain" /></div>
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">v2.6.5 Cloud Assets</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'front-cover', label: 'Home', icon: Home },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'advance-booking', label: 'Advance Bookings', icon: Wallet },
            { id: 'crm', label: 'Sales CRM', icon: Briefcase },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'billing', label: 'Billing', icon: FileText },
            { id: 'quotation', label: 'Quotations', icon: FileQuestion },
            { id: 'patients', label: 'Patients', icon: Users },
            { id: 'receipts', label: 'Receipts', icon: Receipt },
            { id: 'credit-note', label: 'Credit Notes', icon: FileMinus },
            { id: 'debit-note', label: 'Debit Notes', icon: FilePlus },
            { id: 'transfer', label: 'Transfer', icon: Repeat },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition ${activeView === item.id ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon size={18} /> <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button onClick={refreshData} className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-teal-300 hover:bg-slate-800 hover:text-white transition">
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
              <span className="text-xs font-bold uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-200">{userRole}</span>
          </div>
          <div className="text-right text-xs text-gray-400 hidden sm:block">Bengal Rehabilitation & Research Pvt. Ltd.</div>
        </header>
        <div className="p-8 max-w-7xl mx-auto print:p-0">
          {activeView === 'dashboard' && <Dashboard inventory={inventory} invoices={invoices} />}
          {activeView === 'inventory' && <Inventory inventory={inventory} onAdd={handleAddInventory} onUpdate={handleUpdateInventoryItem} onDelete={handleDeleteInventoryItem} userRole={userRole!} />}
          {activeView === 'advance-booking' && <AdvanceBookings bookings={advanceBookings} patients={patients} onAddBooking={handleAddAdvanceBooking} onUpdateBooking={handleUpdateAdvanceBooking} onDeleteBooking={handleDeleteAdvanceBooking} userRole={userRole!} logo={companyLogo} signature={companySignature} />}
          {activeView === 'billing' && <Billing inventory={inventory} invoices={invoices} patients={patients} advanceBookings={advanceBookings} onCreateInvoice={handleCreateInvoice} onUpdateInvoice={handleUpdateInvoice} onDelete={handleDeleteInvoice} logo={companyLogo} signature={companySignature} userRole={userRole!}/>}
          {activeView === 'quotation' && <Quotations inventory={inventory} quotations={quotations} patients={patients} onCreateQuotation={handleCreateQuotation} onUpdateQuotation={handleUpdateQuotation} onConvertToInvoice={handleConvertQuotation} onDelete={handleDeleteQuotation} logo={companyLogo} signature={companySignature} userRole={userRole!}/>}
          {activeView === 'crm' && <CRM leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onConvertToPatient={handleConvertLeadToPatient} onDelete={handleDeleteLead} userRole={userRole!} />}
          {activeView === 'patients' && <Patients patients={patients} invoices={invoices} onAddPatient={handleAddPatient} onUpdatePatient={handleUpdatePatient} onDelete={handleDeletePatient} logo={companyLogo} signature={companySignature} userRole={userRole!} />}
          {activeView === 'receipts' && <ReceiptsManager invoices={invoices} logo={companyLogo} signature={companySignature} onUpdateInvoice={handleUpdateInvoice} onDeleteReceipt={handleDeleteReceipt} userRole={userRole!} />}
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
