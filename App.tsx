import React, { useState, useEffect, useRef } from 'react';
import { HearingAid, Invoice, ViewState, Patient, Quotation, FinancialNote, StockTransfer as StockTransferType, AssetTransfer as AssetTransferType, Lead, UserRole, AdvanceBooking, CompanyAsset, Hospital, ServiceInvoice, Vendor, PurchaseRecord, PurchaseOrder, AppUser } from './types';
import { INITIAL_INVENTORY, INITIAL_INVOICES, INITIAL_QUOTATIONS, INITIAL_FINANCIAL_NOTES, INITIAL_LEADS, COMPANY_LOGO_BASE64 } from './constants';
import { Inventory } from './components/Inventory';
import { Billing } from './components/Billing';
import { DemoBilling } from './components/DemoBilling';
import { ServiceBilling } from './components/ServiceBilling';
import { ProformaBilling } from './components/ProformaBilling';
import { StockTransfer } from './components/StockTransfer';
import { AssetTransfer } from './components/AssetTransfer';
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
import { Purchases } from './components/Purchases';
import { Login } from './components/Login';
import { UsersAdmin } from './components/UsersAdmin';
import { RazorpayPayments } from './components/RazorpayPayments';
import { LayoutDashboard, Package, FileText, Repeat, Users, FileQuestion, FileMinus, FilePlus, Briefcase, Settings as SettingsIcon, Receipt, Home, LogOut, Wallet, RefreshCw, HardDrive, AlertTriangle, ShieldAlert, CheckCircle2, Clipboard, ArrowRightLeft, Truck, Landmark, ShoppingBag, ShieldCheck, Activity, CalendarDays, ExternalLink, ArrowLeft, CreditCard } from 'lucide-react';

// Firebase Services
import { fetchCollection, setDocument, updateDocument, deleteDocument } from './services/firebase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>(COMPANY_LOGO_BASE64);
  const [companySignature, setCompanySignature] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('front-cover');
  const backHandlerRef = useRef<(() => boolean) | null>(null);
  
  const [inventory, setInventory] = useState<HearingAid[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [demoInvoices, setDemoInvoices] = useState<Invoice[]>([]);
  const [proformaInvoices, setProformaInvoices] = useState<Invoice[]>([]);
  const [prefilledProforma, setPrefilledProforma] = useState<Invoice | null>(null);
  const [serviceInvoices, setServiceInvoices] = useState<ServiceInvoice[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [financialNotes, setFinancialNotes] = useState<FinancialNote[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransferType[]>([]);
  const [assetTransfers, setAssetTransfers] = useState<AssetTransferType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [advanceBookings, setAdvanceBookings] = useState<AdvanceBooking[]>([]);
  const [razorpayPayments, setRazorpayPayments] = useState<any[]>([]);
  const [rzpKeyId, setRzpKeyId] = useState<string>('');
  const [rzpKeySecret, setRzpKeySecret] = useState<string>('');
  const [rzpEnabled, setRzpEnabled] = useState<boolean>(false);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string, code?: string } | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchPromise = Promise.all([
          fetchCollection('inventory'),
          fetchCollection('invoices'),
          fetchCollection('demoInvoices'),
          fetchCollection('serviceInvoices'),
          fetchCollection('proformaInvoices'),
          fetchCollection('hospitals'),
          fetchCollection('patients'),
          fetchCollection('quotations'),
          fetchCollection('financialNotes'),
          fetchCollection('leads'),
          fetchCollection('stockTransfers'),
          fetchCollection('assetTransfers'),
          fetchCollection('advanceBookings'),
          fetchCollection('settings'),
          fetchCollection('companyAssets'),
          fetchCollection('vendors'),
          fetchCollection('purchases'),
          fetchCollection('purchaseOrders'),
          fetchCollection('razorpay_payments').catch(() => [])
      ]);

      const [inv, invs, dinvs, sinvs, profInvs, hosps, pats, quotes, notes, lds, trfs, atrfs, advs, settings, assets, vends, pur, poList, rzpPays] = await fetchPromise;

      if (settings && settings.length > 0) {
          const clinicAssets: any = settings.find((s: any) => s.id === 'clinic_assets');
          if (clinicAssets) {
              if (clinicAssets.logo) setCompanyLogo(clinicAssets.logo);
              if (clinicAssets.signature) setCompanySignature(clinicAssets.signature);
              if (clinicAssets.razorpayKeyId) setRzpKeyId(clinicAssets.razorpayKeyId);
              if (clinicAssets.razorpayKeySecret) setRzpKeySecret(clinicAssets.razorpayKeySecret);
              if (clinicAssets.razorpayEnabled !== undefined) setRzpEnabled(clinicAssets.razorpayEnabled);
          }
      }

      setInventory((inv as HearingAid[]) || []);
      setVendors((vends as Vendor[]) || []);
      setPurchases((pur as PurchaseRecord[]) || []);
      setPurchaseOrders((poList as PurchaseOrder[]) || []);
      setInvoices((invs as Invoice[]) || []);
      setDemoInvoices((dinvs as Invoice[]) || []);
      setProformaInvoices((profInvs as Invoice[]) || []);
      setServiceInvoices((sinvs as ServiceInvoice[]) || []);
      setHospitals((hosps as Hospital[]) || []);
      setPatients((pats as Patient[]) || []);
      setQuotations((quotes as Quotation[]) || []);
      setFinancialNotes((notes as FinancialNote[]) || []);
      setLeads((lds as Lead[]) || []);
      setStockTransfers((trfs as StockTransferType[]) || []);
      setAssetTransfers((atrfs as AssetTransferType[]) || []);
      setAdvanceBookings((advs as AdvanceBooking[]) || []);
      setCompanyAssets((assets as CompanyAsset[]) || []);
      setRazorpayPayments((rzpPays as any[]) || []);
      
    } catch (err: any) {
      console.error("Data refresh failed:", err);
      if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission'))) {
          setError({ 
              code: 'PERMISSION_DENIED', 
              message: "Access Denied: Cloud Firestore Security Rules are blocking the app." 
          });
      } else {
          setError({ 
              message: err.message || "Failed to sync with database. Please check your internet connection." 
          });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogin = (role: UserRole, userDetails: AppUser) => {
      setUserRole(role);
      setCurrentUser(userDetails);
      setIsAuthenticated(true);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUser(null);
      setActiveView('front-cover');
  };

  const handleAddVendor = async (v: Vendor) => {
    setVendors([v, ...vendors]);
    try { await setDocument('vendors', v.id, v); } catch(e) {}
  };

  const handleDeleteVendor = async (id: string) => {
    setVendors(vendors.filter(v => v.id !== id));
    try { await deleteDocument('vendors', id); } catch(e) {}
  };

  const handleAddPurchase = async (p: PurchaseRecord) => {
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const stampedP = { ...p, entryBy: p.entryBy || userStamp };
    setPurchases(prev => [stampedP, ...prev]);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const newStockItem: HearingAid = {
      id: `HA-PUR-${timestamp}-${randomSuffix}`,
      brand: p.brand,
      model: p.model,
      serialNumber: p.serialNumber,
      price: p.mrp,
      hsnCode: p.hsnCode,
      location: p.location,
      status: 'Available',
      addedDate: p.invoiceDate,
      entryBy: userStamp
    };
    setInventory(prev => [...prev, newStockItem]);
    try { 
      await setDocument('purchases', p.id, stampedP); 
      await setDocument('inventory', newStockItem.id, newStockItem);
    } catch(e) {
      console.error("Firebase Sync Error in Purchase:", e);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    setPurchases(purchases.filter(p => p.id !== id));
    try { await deleteDocument('purchases', id); } catch(e) {}
  };
 
  const handleSavePurchaseOrder = async (po: PurchaseOrder) => {
    setPurchaseOrders(prev => {
      const exists = prev.find(p => p.id === po.id);
      if (exists) return prev.map(p => p.id === po.id ? po : p);
      return [po, ...prev];
    });
    try { await setDocument('purchaseOrders', po.id, po); } catch(e) {}
  };
 
  const handleDeletePurchaseOrder = async (id: string) => {
    setPurchaseOrders(prev => prev.filter(p => p.id !== id));
    try { await deleteDocument('purchaseOrders', id); } catch(e) {}
  };

  const handleUpdateSettings = async (logo: string, signature: string | null, keyId?: string, keySecret?: string, enabled?: boolean) => {
    setCompanyLogo(logo);
    setCompanySignature(signature);
    if (keyId !== undefined) setRzpKeyId(keyId);
    if (keySecret !== undefined) setRzpKeySecret(keySecret);
    if (enabled !== undefined) setRzpEnabled(enabled);
    try {
        await setDocument('settings', 'clinic_assets', {
            logo,
            signature,
            razorpayKeyId: keyId || '',
            razorpayKeySecret: keySecret || '',
            razorpayEnabled: enabled !== undefined ? enabled : false,
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to sync settings:", e);
    }
  };

  const handleAddHospital = async (h: Hospital) => {
    setHospitals([...hospitals, h]);
    try { await setDocument('hospitals', h.id, h); } catch(e) {}
  };

  const handleUpdateHospital = async (h: Hospital) => {
    setHospitals(hospitals.map(item => item.id === h.id ? h : item));
    try { await updateDocument('hospitals', h.id, h); } catch(e) {}
  };

  const handleSaveServiceInvoice = async (inv: ServiceInvoice) => {
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const stampedInv = { ...inv, entryBy: inv.entryBy || userStamp };
    setServiceInvoices(prev => {
      const exists = prev.find(i => i.id === inv.id);
      if (exists) return prev.map(i => i.id === inv.id ? stampedInv : i);
      return [stampedInv, ...prev];
    });
    try { await setDocument('serviceInvoices', inv.id, stampedInv); } catch(e) {
      console.error("Failed to save service invoice:", e);
    }
  };

  const handleDeleteServiceInvoice = async (id: string) => {
    const invoice = serviceInvoices.find(i => i.id === id);
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    if (invoice) {
      try {
        await setDocument('deleted_records_backup', `invoice_service_${id}_${Date.now()}`, {
          id: id,
          type: 'Service Invoice',
          deletedAt: new Date().toISOString(),
          deletedBy: userStamp,
          originalData: invoice
        });
      } catch (e) {
        console.error("Service invoice backup failed:", e);
      }
    }
    setServiceInvoices(serviceInvoices.filter(i => i.id !== id));
    try { await deleteDocument('serviceInvoices', id); } catch(e) {}
  };

  const handleStockTransfer = async (itemId: string, toLocation: string, sender: string, transporter: string, receiver: string, note: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const transferLog: StockTransferType = {
      id: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      hearingAidId: item.id,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      fromLocation: item.location,
      toLocation,
      date: new Date().toISOString().split('T')[0],
      sender: sender || userStamp,
      transporter,
      receiver,
      note,
      entryBy: userStamp
    };

    const updatedItem = { ...item, location: toLocation };
    
    // Use functional updates to prevent stale state issues in bulk mode
    setInventory(prev => prev.map(i => i.id === itemId ? updatedItem : i));
    setStockTransfers(prev => [transferLog, ...prev]);

    try {
      await updateDocument('inventory', itemId, { location: toLocation });
      await setDocument('stockTransfers', transferLog.id, transferLog);
    } catch (e) {
      console.error("Sync failed:", e);
    }
  };

  const handleAssetTransfer = async (assetId: string, toLocation: string, sender: string, transporter: string, receiver: string, note: string) => {
    const asset = companyAssets.find(a => a.id === assetId);
    if (!asset) return;

    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const transferLog: AssetTransferType = {
      id: `ATRF-${Date.now()}`,
      assetId: asset.id,
      assetName: asset.name,
      serialNumber: asset.serialNumber,
      fromLocation: asset.location,
      toLocation,
      date: new Date().toISOString().split('T')[0],
      sender: sender || userStamp,
      transporter,
      receiver,
      note,
      entryBy: userStamp
    };

    const updatedAsset = { ...asset, location: toLocation };
    setCompanyAssets(companyAssets.map(a => a.id === assetId ? updatedAsset : a));
    setAssetTransfers([transferLog, ...assetTransfers]);

    try {
      await updateDocument('companyAssets', assetId, { location: toLocation });
      await setDocument('assetTransfers', transferLog.id, transferLog);
    } catch (e) {
      console.error("Asset sync failed:", e);
    }
  };

  const handleAddQuotation = async (quotation: Quotation) => {
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const stampedQuotation = { ...quotation, entryBy: quotation.entryBy || userStamp };
    setQuotations([stampedQuotation, ...quotations]);
    try { await setDocument('quotations', quotation.id.replace(/\//g, '-'), stampedQuotation); } catch(e) {}
  };

  const handleUpdateQuotation = async (quotation: Quotation) => {
    setQuotations(quotations.map(q => q.id === quotation.id ? quotation : q));
    try { await updateDocument('quotations', quotation.id.replace(/\//g, '-'), quotation); } catch(e) {}
  };

  const handleDeleteQuotation = async (id: string) => {
    setQuotations(quotations.filter(q => q.id !== id));
    try { await deleteDocument('quotations', id.replace(/\//g, '-')); } catch(e) {}
  };

  const handleAddFinancialNote = async (note: FinancialNote) => {
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const stampedNote = { ...note, entryBy: note.entryBy || userStamp };
    setFinancialNotes(prev => {
        const exists = prev.find(n => n.id === note.id);
        if (exists) return prev.map(n => n.id === note.id ? stampedNote : n);
        return [stampedNote, ...prev];
    });
    
    // If Debit Note has linked hearing aids, remove them from inventory (only if it's a new note or newly added items)
    // For simplicity, we only trigger this when items are actually in the note.
    if (note.type === 'DEBIT' && note.hearingAidIds && note.hearingAidIds.length > 0) {
        setInventory(prev => prev.filter(item => !note.hearingAidIds?.includes(item.id)));
        try {
            for (const id of note.hearingAidIds) {
                await deleteDocument('inventory', id);
            }
        } catch (e) {
            console.error("Failed to remove items from inventory during Debit Note save:", e);
        }
    }

    // If Credit Note has linked items (from a returned invoice), add them back to inventory
    if (note.type === 'CREDIT' && note.linkedItems && note.linkedItems.length > 0) {
        // Prevent duplicates in state if adding multiple times (though handleAdd is called once)
        setInventory(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const itemsToAdd = (note.linkedItems || []).filter(i => !existingIds.has(i.id));
            return [...prev, ...itemsToAdd];
        });
        try {
            for (const item of note.linkedItems) {
                await setDocument('inventory', item.id, item);
            }
        } catch (e) {
            console.error("Failed to restock items during Credit Note save:", e);
        }
    }

    try { await setDocument('financialNotes', note.id, stampedNote); } catch(e) {}
  };

  const handleDeleteFinancialNote = async (id: string) => {
    const noteToDelete = financialNotes.find(n => n.id === id);
    setFinancialNotes(financialNotes.filter(n => n.id !== id));
    
    // If Debit Note was deleted, it means the items should NOT have been removed from inventory.
    // So we add them back to inventory.
    if (noteToDelete && noteToDelete.type === 'DEBIT' && noteToDelete.linkedItems && noteToDelete.linkedItems.length > 0) {
        setInventory(prev => [...prev, ...(noteToDelete.linkedItems || [])]);
        try {
            for (const item of noteToDelete.linkedItems) {
                await setDocument('inventory', item.id, item);
            }
            alert(`Debit Note ${id} deleted and ${noteToDelete.linkedItems.length} items restocked in inventory.`);
        } catch (e) {
            console.error("Failed to restock items during Debit Note deletion:", e);
        }
    }

    // If Credit Note was deleted, it means the items should NOT have been restocked. (Mistake return)
    // So we remove them from inventory.
    if (noteToDelete && noteToDelete.type === 'CREDIT' && noteToDelete.linkedItems && noteToDelete.linkedItems.length > 0) {
        setInventory(prev => prev.filter(item => !noteToDelete.linkedItems?.map(li => li.id).includes(item.id)));
        try {
            for (const item of noteToDelete.linkedItems) {
                await deleteDocument('inventory', item.id);
            }
            alert(`Credit Note ${id} deleted and ${noteToDelete.linkedItems.length} items removed from inventory.`);
        } catch (e) {
            console.error("Failed to remove items during Credit Note deletion:", e);
        }
    }

    try { await deleteDocument('financialNotes', id); } catch(e) {}
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
    
    try {
        const userStamp = currentUser?.name || currentUser?.id || 'admin';
        // Secure Cloud Archival / Recovery Backup of Deleted Invoice
        try {
            await setDocument('deleted_records_backup', `invoice_tax_${invoiceId}_${Date.now()}`, {
                id: invoiceId,
                type: 'Patient Tax Invoice',
                deletedAt: new Date().toISOString(),
                deletedBy: userStamp,
                originalData: invoice
            });
        } catch (backupErr) {
            console.error("Backup operation failed:", backupErr);
        }

        const inventoryItemIds = invoice.items
            .map(i => i.hearingAidId)
            .filter(id => id && !id.startsWith('MAN-'));

        await Promise.all([
            ...inventoryItemIds.map(id => updateDocument('inventory', id, { status: 'Available' })),
            deleteDocument('invoices', invoiceId)
        ]);

        setInventory(prev => prev.map(item => 
            inventoryItemIds.includes(item.id) ? { ...item, status: 'Available' } : item
        ));
        setInvoices(prev => prev.filter(i => i.id !== invoiceId));
        
        alert(`Invoice ${invoiceId} backed up and deleted safely.`);
    } catch (err: any) {
        console.error("Delete operation failed:", err);
        alert(`Failed to delete invoice from server: ${err.message}. Please check your connection or permissions.`);
    }
  };

  const handleCreateDemoInvoice = async (invoice: Invoice) => {
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const stampedInvoice = { ...invoice, entryBy: invoice.entryBy || userStamp };
    setDemoInvoices([stampedInvoice, ...demoInvoices]);
    try { await setDocument('demoInvoices', invoice.id.replace(/\//g, '-'), stampedInvoice); } catch(e) {
      console.error("Demo invoice sync failed:", e);
    }
  };

  const handleDeleteDemoInvoice = async (id: string) => {
    const backupId = id.replace(/\//g, '-');
    const invoice = demoInvoices.find(i => i.id === id);
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    if (invoice) {
      try {
        await setDocument('deleted_records_backup', `invoice_demo_${backupId}_${Date.now()}`, {
          id: id,
          type: 'Demo Invoice',
          deletedAt: new Date().toISOString(),
          deletedBy: userStamp,
          originalData: invoice
        });
      } catch (e) {
        console.error("Demo invoice backup failed:", e);
      }
    }
    setDemoInvoices(prev => prev.filter(i => i.id !== id));
    try { await deleteDocument('demoInvoices', backupId); } catch(e) {
      console.error("Demo invoice delete failed:", e);
    }
  };

  const handleCreateProformaInvoice = async (invoice: Invoice) => {
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const stampedInvoice = { ...invoice, entryBy: invoice.entryBy || userStamp };
    setProformaInvoices(prev => {
      const exists = prev.find(i => i.id === invoice.id);
      if (exists) return prev.map(i => i.id === invoice.id ? stampedInvoice : i);
      return [stampedInvoice, ...prev];
    });
    try { await setDocument('proformaInvoices', invoice.id.replace(/\//g, '-'), stampedInvoice); } catch(e) {
      console.error("Proforma invoice sync failed:", e);
    }
  };

  const handleDeleteProformaInvoice = async (id: string) => {
    const backupId = id.replace(/\//g, '-');
    const invoice = proformaInvoices.find(i => i.id === id);
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    if (invoice) {
      try {
        await setDocument('deleted_records_backup', `invoice_proforma_${backupId}_${Date.now()}`, {
          id: id,
          type: 'Proforma Invoice',
          deletedAt: new Date().toISOString(),
          deletedBy: userStamp,
          originalData: invoice
        });
      } catch (e) {
        console.error("Proforma invoice backup failed:", e);
      }
    }
    setProformaInvoices(prev => prev.filter(i => i.id !== id));
    try { await deleteDocument('proformaInvoices', backupId); } catch(e) {
      console.error("Proforma invoice delete failed:", e);
    }
  };

  const handleConvertProformaToTax = (invoice: Invoice) => {
    setPrefilledProforma(invoice);
    setActiveView('billing');
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
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    if (Array.isArray(items)) {
      const stampedItems = items.map(item => ({ ...item, entryBy: item.entryBy || userStamp }));
      setInventory([...inventory, ...stampedItems]);
      stampedItems.forEach(item => setDocument('inventory', item.id, item).catch(e => {}));
    } else {
      const stampedItem = { ...items, entryBy: items.entryBy || userStamp };
      setInventory(prev => [...prev, stampedItem]);
      setDocument('inventory', stampedItem.id, stampedItem).catch(e => {});
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
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const updatedInvoiceToSave = { 
      ...invoice, 
      status: invoice.status || 'Active',
      entryBy: invoice.entryBy || userStamp 
    } as Invoice;
    
    // Automation: Identify applied Advance Bookings
    const appliedAdvanceIds = updatedInvoiceToSave.payments
        .filter(p => p.method === 'Advance' && p.note?.includes('Ref: '))
        .map(p => p.note?.replace('Ref: ', '').trim())
        .filter(id => id);

    if (exists) {
      // Find removed items to restock and new items to mark as sold
      const oldItemIds = exists.items.map(i => i.hearingAidId).filter(id => id && !id.startsWith('MAN-'));
      const newItemIds = soldItemIds;

      const itemsToRestock = oldItemIds.filter(id => !newItemIds.includes(id));
      const itemsToMarkSold = newItemIds.filter(id => !oldItemIds.includes(id));

      setInvoices(prev => prev.map(i => i.id === invoice.id ? updatedInvoiceToSave : i));
      setInventory(prev => prev.map(item => {
          if (itemsToMarkSold.includes(item.id)) return { ...item, status: 'Sold' };
          if (itemsToRestock.includes(item.id)) return { ...item, status: 'Available' };
          return item;
      }));

      try {
          await setDocument('invoices', invoice.id, updatedInvoiceToSave);
          for (const id of itemsToMarkSold) { await updateDocument('inventory', id, { status: 'Sold' }); }
          for (const id of itemsToRestock) { await updateDocument('inventory', id, { status: 'Available' }); }
      } catch ( e) {}
    } else {
      setInvoices([...invoices, updatedInvoiceToSave]);
      setInventory(prev => prev.map(item => soldItemIds.includes(item.id) ? { ...item, status: 'Sold' } : item));
      
      // Update local AdvanceBookings state
      setAdvanceBookings(prev => prev.map(b => appliedAdvanceIds.includes(b.id) ? { ...b, status: 'Consumed' } : b));

      try {
          await setDocument('invoices', invoice.id, updatedInvoiceToSave);
          for (const id of soldItemIds) { await updateDocument('inventory', id, { status: 'Sold' }); }
          
          // Update applied advances in Firebase
          for (const advId of appliedAdvanceIds as string[]) {
            await updateDocument('advanceBookings', advId, { status: 'Consumed' });
          }
      } catch(e) {}
    }
    setActiveView('billing');
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    if (!window.confirm(`Are you sure you want to CANCEL invoice ${invoiceId}? Hearing aids will be restocked and record will be marked as Cancelled.`)) return;

    try {
        const inventoryItemIds = invoice.items
            .map(i => i.hearingAidId)
            .filter(id => id && !id.startsWith('MAN-'));

        const updatedInvoice: Invoice = { ...invoice, status: 'Cancelled', paymentStatus: 'Unpaid', balanceDue: 0 };

        await Promise.all([
            ...inventoryItemIds.map(id => updateDocument('inventory', id, { status: 'Available' })),
            updateDocument('invoices', invoiceId, updatedInvoice)
        ]);

        setInventory(prev => prev.map(item => 
            inventoryItemIds.includes(item.id) ? { ...item, status: 'Available' } : item
        ));
        setInvoices(prev => prev.map(i => i.id === invoiceId ? (i.id === invoiceId ? updatedInvoice : i) : i));
        
        alert(`Invoice ${invoiceId} cancelled and stock updated.`);
    } catch (err: any) {
        console.error("Cancel operation failed:", err);
        alert(`Failed to cancel invoice: ${err.message}`);
    }
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    try { await updateDocument('invoices', updatedInvoice.id, updatedInvoice); } catch(e) {}
  };

  const handleAddPatient = async (p: Patient) => {
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const patientWithDate = { 
      ...p, 
      addedDate: p.addedDate || new Date().toISOString().split('T')[0],
      entryBy: p.entryBy || userStamp
    };
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
    const userStamp = currentUser?.name || currentUser?.id || 'admin';
    const stampedB = { ...b, entryBy: b.entryBy || userStamp };
    setAdvanceBookings([stampedB, ...advanceBookings]);
    try { await setDocument('advanceBookings', b.id, stampedB); } catch(e) {}
  };

  const handleDeleteAdvanceBooking = async (id: string) => {
    setAdvanceBookings(prev => prev.filter(b => b.id !== id));
    try { await deleteDocument('advanceBookings', id); } catch(e) {}
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="h-16 w-16 border-4 border-[#3159a6] border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[#3159a6] font-black uppercase tracking-widest text-sm animate-pulse">Establishing Secure Connection...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center overflow-y-auto">
      {error.code === 'PERMISSION_DENIED' ? (
        <div className="max-w-2xl w-full animate-fade-in py-10">
          <div className="bg-red-50 p-8 rounded-[3rem] text-red-600 mb-8 border-4 border-red-100 flex flex-col items-center shadow-xl">
            <ShieldAlert size={64} className="mb-4" />
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-red-800 text-center">Firebase Rules Conflict</h2>
            <p className="font-bold text-red-700/70 mb-6 text-center">Your database is currently rejecting all requests due to restricted permissions.</p>
            
            <div className="bg-white p-8 rounded-3xl text-left w-full border-2 border-red-200 shadow-inner">
               <h3 className="font-black uppercase text-xs tracking-[0.2em] mb-6 flex items-center gap-2 text-gray-400">
                 <CheckCircle2 size={16} className="text-green-500" /> Mandatory Fix Steps:
               </h3>
               <ol className="space-y-6 text-sm text-gray-700 font-medium">
                 <li className="flex gap-4">
                   <span className="bg-red-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">1</span>
                   <span>Open your <a href="https://console.firebase.google.com" target="_blank" rel="noopener" className="text-blue-600 underline font-bold hover:text-blue-800">Firebase Console</a> and select project: <b>"brg-smart-inventory"</b>.</span>
                 </li>
                 <li className="flex gap-4">
                   <span className="bg-red-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">2</span>
                   <span>Navigate to <b>"Firestore Database"</b> &rarr; <b>"Rules"</b> tab at the top.</span>
                 </li>
                 <li className="flex gap-4">
                   <span className="bg-red-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">3</span>
                   <div className="flex-1">
                      <span>Replace the existing rules with this configuration and click <b>Publish</b>:</span>
                      <div className="relative group mt-3">
                        <pre className="block bg-slate-900 p-5 rounded-xl font-mono text-[11px] text-teal-400 border-2 border-slate-700 shadow-xl overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                        </pre>
                        <button 
                          onClick={() => navigator.clipboard.writeText("rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}")}
                          className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                        >
                          <Clipboard size={14} />
                        </button>
                      </div>
                   </div>
                 </li>
                 <li className="flex gap-4">
                   <span className="bg-red-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">4</span>
                   <span>Wait 30 seconds for the rules to propagate, then click <b>Retry</b> below.</span>
                 </li>
               </ol>
            </div>
          </div>
          <button onClick={refreshData} className="bg-[#3159a6] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-[#254687] transition shadow-2xl shadow-blue-900/40 flex items-center gap-3 mx-auto">
            <RefreshCw size={24} /> Sync & Retry Connection
          </button>
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col items-center">
          <div className="bg-orange-50 p-8 rounded-full text-orange-500 mb-6 shadow-sm">
            <AlertTriangle size={64} />
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-2 uppercase tracking-tighter">Connection Interrupted</h2>
          <p className="text-gray-500 max-w-md mb-8 font-medium">{error.message}</p>
          <button onClick={refreshData} className="bg-[#3159a6] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#254687] transition shadow-xl flex items-center gap-3">
            <RefreshCw size={20} /> Force Re-Sync
          </button>
        </div>
      )}
      <div className="mt-12 text-[10px] text-gray-300 font-black uppercase tracking-[0.4em] select-none">
          Bengal Rehabilitation & Research Pvt. Ltd. | v2.8.2
      </div>
    </div>
  );

  if (!isAuthenticated) return <Login logo={companyLogo} onLogin={handleLogin} />;
  if (activeView === 'front-cover') return <FrontCover logo={companyLogo} onNavigate={setActiveView} userRole={userRole!} />;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10 print:hidden">
        <div className="p-6 border-b border-slate-800 cursor-pointer" onClick={() => setActiveView('front-cover')}>
          <div className="h-16 w-full bg-white rounded flex items-center justify-center p-2 mb-2"><img src={companyLogo} alt="Logo" className="h-full object-contain" /></div>
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">v2.8.2 Cloud Node</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'front-cover', label: 'Home', icon: Home, roles: ['admin', 'user'] },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user'] },
            { id: 'assets', label: 'Company Assets', icon: HardDrive, roles: ['admin', 'user'] },
            { id: 'asset-transfer', label: 'Asset Logistic', icon: Truck, roles: ['admin', 'user'] },
            { id: 'advance-booking', label: 'Advance Bookings', icon: Wallet, roles: ['admin', 'user'] },
            { id: 'crm', label: 'Sales CRM', icon: Briefcase, roles: ['admin', 'user'] },
            { id: 'purchases', label: 'Purchase', icon: ShoppingBag, roles: ['admin'] }, // Admin restricted
            { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'user'] },
            { id: 'transfer', label: 'Stock Transfer', icon: ArrowRightLeft, roles: ['admin', 'user'] },
            { id: 'quotation', label: 'Quotations', icon: FileQuestion, roles: ['admin', 'user'] },
            { id: 'billing', label: 'Patient Billing', icon: FileText, roles: ['admin', 'user'] },
            { id: 'demo-billing', label: 'Demo Invoice', icon: ShieldCheck, roles: ['admin', 'user'] },
            { id: 'proforma-billing', label: 'Proforma Invoice', icon: Clipboard, roles: ['admin', 'user'] },
            { id: 'service-billing', label: 'Service Billing', icon: Landmark, roles: ['admin', 'user'] },
            { id: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'user'] },
            { id: 'credit-note', label: 'Credit Note', icon: FileMinus, roles: ['admin', 'user'] },
            { id: 'debit-note', label: 'Debit Note', icon: FilePlus, roles: ['admin', 'user'] },
            { id: 'receipts', label: 'Receipts', icon: Receipt, roles: ['admin', 'user'] },
            { id: 'razorpay-payments', label: 'Razorpay Online', icon: CreditCard, roles: ['admin', 'user'] },
            { id: 'users-admin', label: 'User Management', icon: ShieldCheck, roles: ['admin'] },
            { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['admin', 'user'] }
          ].filter(item => item.roles.includes(userRole!)).map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition ${activeView === item.id ? 'bg-[#3159a6] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon size={18} /> <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Enterprise Apps</h3>
            <a href="https://brg-hpms.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 rounded text-emerald-400 hover:bg-emerald-950/30 hover:text-emerald-300 transition group mb-1">
                <Activity size={16} /> <span className="text-xs font-bold truncate">Hospital Management</span>
                <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a href="https://brg-rota.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 rounded text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition group">
                <CalendarDays size={16} /> <span className="text-xs font-bold truncate">Rota Management</span>
                <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

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
              <button
                onClick={() => {
                  if (backHandlerRef.current && backHandlerRef.current()) {
                     return;
                  }
                  setActiveView('front-cover');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-black text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm cursor-pointer uppercase tracking-wider scale-95 origin-left hover:scale-100 duration-150"
                title="Return to Home Dashboard"
              >
                <ArrowLeft size={14} className="text-[#3159a6]" />
                <span>Back</span>
              </button>
              <h2 className="text-xl font-bold text-gray-800 capitalize">{activeView.replace('-', ' ')}</h2>
              <span className="text-xs font-bold uppercase text-[#3159a6] bg-blue-50 px-2 py-1 rounded border border-blue-200">{userRole}</span>
          </div>
          <div className="text-right text-xs text-gray-400 hidden sm:block">Bengal Rehabilitation & Research Pvt. Ltd.</div>
        </header>
        <div className="p-8 max-w-7xl mx-auto print:p-0">
          {activeView === 'dashboard' && <Dashboard inventory={inventory} invoices={invoices} stockTransfers={stockTransfers} quotations={quotations} leads={leads} />}
          {activeView === 'inventory' && <Inventory inventory={inventory} onAdd={handleAddInventory} onUpdate={handleUpdateInventoryItem} onDelete={handleDeleteInventoryItem} userRole={userRole!} />}
          {activeView === 'assets' && <CompanyAssets assets={companyAssets} onAdd={handleAddCompanyAsset} onUpdate={handleUpdateCompanyAsset} onDelete={handleDeleteCompanyAsset} userRole={userRole!} />}
          {activeView === 'asset-transfer' && <AssetTransfer assets={companyAssets} transferHistory={assetTransfers} onTransfer={handleAssetTransfer} />}
          {activeView === 'advance-booking' && <AdvanceBookings bookings={advanceBookings} patients={patients} onAddBooking={handleAddAdvanceBooking} onUpdateBooking={handleUpdateAdvanceBooking} onDeleteBooking={handleDeleteAdvanceBooking} userRole={userRole!} logo={companyLogo} signature={companySignature} />}
          {activeView === 'transfer' && <StockTransfer inventory={inventory} transferHistory={stockTransfers} onTransfer={handleStockTransfer} />}
          {activeView === 'quotation' && <Quotations inventory={inventory} quotations={quotations} patients={patients} onCreateQuotation={handleAddQuotation} onUpdateQuotation={handleUpdateQuotation} onConvertToInvoice={handleCreateInvoice as any} onDelete={handleDeleteQuotation} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'billing' && <Billing inventory={inventory} invoices={invoices} patients={patients} hospitals={hospitals} advanceBookings={advanceBookings} onCreateInvoice={handleCreateInvoice} onUpdateInvoice={handleUpdateInvoice} onDelete={handleDeleteInvoice} onCancelInvoice={handleCancelInvoice} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} prefilledInvoiceData={prefilledProforma} setPrefilledInvoiceData={setPrefilledProforma} />}
          {activeView === 'demo-billing' && <DemoBilling invoices={demoInvoices} patients={patients} onCreateInvoice={handleCreateDemoInvoice} onDelete={handleDeleteDemoInvoice} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'proforma-billing' && <ProformaBilling invoices={proformaInvoices} patients={patients} onCreateInvoice={handleCreateProformaInvoice} onDelete={handleDeleteProformaInvoice} onConvertToTaxInvoice={handleConvertProformaToTax} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'service-billing' && <ServiceBilling hospitals={hospitals} invoices={serviceInvoices} onAddHospital={handleAddHospital} onUpdateHospital={handleUpdateHospital} onSaveInvoice={handleSaveServiceInvoice} onDeleteInvoice={handleDeleteServiceInvoice} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'purchases' && <Purchases vendors={vendors} purchases={purchases} purchaseOrders={purchaseOrders} onAddVendor={handleAddVendor} onAddPurchase={handleAddPurchase} onDeletePurchase={handleDeletePurchase} onDeleteVendor={handleDeleteVendor} onSavePurchaseOrder={handleSavePurchaseOrder} onDeletePurchaseOrder={handleDeletePurchaseOrder} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'crm' && <CRM leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onConvertToPatient={handleConvertLeadToPatient} onDelete={handleDeleteLead} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'patients' && <Patients patients={patients} invoices={invoices} onAddPatient={handleAddPatient} onUpdatePatient={handleUpdatePatient} onDelete={handleDeletePatient} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'credit-note' && <FinancialNotes type="CREDIT" notes={financialNotes} patients={patients} vendors={vendors} invoices={invoices} serviceInvoices={serviceInvoices} hospitals={hospitals} inventory={inventory} onSave={handleAddFinancialNote} onDelete={handleDeleteFinancialNote} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'debit-note' && <FinancialNotes type="DEBIT" notes={financialNotes} patients={patients} vendors={vendors} invoices={invoices} serviceInvoices={serviceInvoices} hospitals={hospitals} inventory={inventory} onSave={handleAddFinancialNote} onDelete={handleDeleteFinancialNote} logo={companyLogo} signature={companySignature} userRole={userRole!} backHandlerRef={backHandlerRef} />}
          {activeView === 'receipts' && <ReceiptsManager invoices={invoices} logo={companyLogo} signature={companySignature} onUpdateInvoice={handleUpdateInvoice} onDeleteReceipt={handleDeleteReceipt} userRole={userRole!} />}
          {activeView === 'razorpay-payments' && <RazorpayPayments patients={patients} invoices={invoices} razorpayPayments={razorpayPayments} onAddRazorpayPayment={(pay) => setRazorpayPayments(prev => [pay, ...prev])} onUpdateInvoice={handleUpdateInvoice} rzpKeyId={rzpKeyId} rzpKeySecret={rzpKeySecret} rzpEnabled={rzpEnabled} userRole={userRole!} logo={companyLogo} signature={companySignature} />}
          {activeView === 'settings' && <Settings currentLogo={companyLogo} currentSignature={companySignature} onSave={handleUpdateSettings} userRole={userRole!} currentRzpKeyId={rzpKeyId} currentRzpKeySecret={rzpKeySecret} currentRzpEnabled={rzpEnabled} />}
          {activeView === 'users-admin' && <UsersAdmin userRole={userRole!} currentUserId={currentUser?.id || 'admin'} onNavigateBack={() => setActiveView('front-cover')} backHandlerRef={backHandlerRef} />}
        </div>
      </main>
    </div>
  );
};
export default App;
