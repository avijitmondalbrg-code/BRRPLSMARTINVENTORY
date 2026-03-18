import React, { useState, useMemo } from 'react';
import { HearingAid, Invoice, StockTransfer, Quotation, Lead } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, IndianRupee, Package, Sparkles, Clock, Search, History, MapPin, User, FileText, AlertTriangle, CheckCircle, ArrowRight, UserCheck, Briefcase } from 'lucide-react';
import { analyzeStockTrends } from '../services/geminiService';
import { STAFF_NAMES } from '../constants';

interface DashboardProps {
  inventory: HearingAid[];
  invoices: Invoice[];
  stockTransfers: StockTransfer[];
  quotations: Quotation[];
  leads: Lead[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, invoices, stockTransfers, quotations, leads }) => {
  const [insights, setInsights] = React.useState<string>('');
  const [loadingInsights, setLoadingInsights] = React.useState(false);
  
  // Traceability Search State
  const [serialSearch, setSerialSearch] = useState('');
  const [traceResult, setTraceResult] = useState<any>(null);

  // Staff Filter State
  const [staffFilter, setStaffFilter] = useState<string>('');

  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  const availableItems = inventory.filter(i => i.status === 'Available');
  const totalStockValue = availableItems.reduce((acc, item) => acc + item.price, 0);
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.finalTotal, 0);
  const availableCount = availableItems.length;

  const stockByBrand = React.useMemo(() => {
    const data: Record<string, number> = {};
    availableItems.forEach(item => { data[item.brand] = (data[item.brand] || 0) + 1; });
    return Object.keys(data).map(brand => ({ name: brand, count: data[brand] }));
  }, [availableItems]);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const summary = inventory.filter(i => i.status === 'Available').map(i => `- ${i.brand} ${i.model} @ ${i.location}`).join('\n');
    const result = await analyzeStockTrends(summary);
    setInsights(result);
    setLoadingInsights(false);
  };

  const handleTraceDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialSearch.trim()) return;

    const sn = serialSearch.trim().toUpperCase();
    
    // 1. Find current inventory record
    const invRecord = inventory.find(i => i.serialNumber.toUpperCase() === sn);
    
    // 2. Find move records
    const moves = stockTransfers.filter(t => t.serialNumber.toUpperCase() === sn)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
    // 3. Find sale record
    const sale = invoices.find(inv => inv.items.some(item => item.serialNumber.toUpperCase() === sn));
    
    // 4. Find quotation records
    const quotes = quotations.filter(q => q.items.some(item => item.serialNumber.toUpperCase() === sn));

    // 5. Detect if potentially deleted
    const isDeleted = (moves.length > 0 || sale || quotes.length > 0) && !invRecord;

    setTraceResult({
        sn,
        current: invRecord,
        moves,
        sale,
        quotes,
        isDeleted
    });
  };

  const staffStats = useMemo(() => {
    if (!staffFilter) return null;
    const staffLeads = leads.filter(l => l.entryBy === staffFilter);
    const staffSales = invoices.filter(inv => inv.entryBy === staffFilter);
    const staffTotalRevenue = staffSales.reduce((sum, inv) => sum + inv.finalTotal, 0);

    return {
        leads: staffLeads,
        sales: staffSales,
        totalRevenue: staffTotalRevenue
    };
  }, [staffFilter, leads, invoices]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 transition hover:shadow-md">
          <div className="h-20 w-48 flex items-center justify-center bg-white rounded-xl">
              <img src={LOGO_URL} alt="BRG" className="h-full object-contain" />
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-100"></div>
          <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Clinical Insights</h2>
              <p className="text-sm text-gray-400 font-bold uppercase">Enterprise Dashboard</p>
          </div>
          <div className="md:ml-auto flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#3159a6] rounded-full border border-blue-100 text-xs font-black uppercase">
              <Clock size={14} /> LIVE: {new Date().toLocaleDateString('en-IN')}
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="p-4 bg-blue-50 rounded-full text-[#3159a6]"><IndianRupee size={24} /></div>
          <div><p className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Sales</p><p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="p-4 bg-indigo-50 rounded-full text-indigo-600"><Package size={24} /></div>
          <div><p className="text-gray-400 text-xs font-black uppercase tracking-widest">Asset Value</p><p className="text-2xl font-bold text-gray-900">₹{totalStockValue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
           <div className="p-4 rounded-full bg-blue-100 text-[#3159a6]"><TrendingUp size={24} /></div>
          <div><p className="text-gray-400 text-xs font-black uppercase tracking-widest">Available</p><p className="text-2xl font-bold text-gray-900">{availableCount} Units</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            {/* Staff Performance Audit */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                           <UserCheck className="text-primary" size={20} /> Staff Contribution Audit
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Search staff to see entries and sales performance</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select 
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:bg-white focus:border-primary outline-none transition font-black uppercase"
                            value={staffFilter}
                            onChange={e => setStaffFilter(e.target.value)}
                        >
                            <option value="">-- Choose Staff Member --</option>
                            {STAFF_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                </div>

                {staffStats ? (
                    <div className="animate-fade-in space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Leads Created</p>
                                <p className="text-2xl font-black text-[#3159a6]">{staffStats.leads.length}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Sales Closed</p>
                                <p className="text-2xl font-black text-green-700">{staffStats.sales.length}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                                <p className="text-xl font-black text-slate-800 tracking-tighter">₹{staffStats.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="border-t pt-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Recent Lead Entries</h4>
                                <div className="space-y-2">
                                    {staffStats.leads.length === 0 ? (
                                        <p className="text-xs text-gray-300 italic py-4 text-center border-2 border-dashed rounded-2xl">No leads logged by this user</p>
                                    ) : staffStats.leads.slice(0, 5).map(lead => (
                                        <div key={lead.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{lead.name}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{lead.status} • {lead.createdAt}</p>
                                            </div>
                                            <ArrowRight size={14} className="text-gray-200" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Recent Invoices Issued</h4>
                                <div className="space-y-2">
                                    {staffStats.sales.length === 0 ? (
                                        <p className="text-xs text-gray-300 italic py-4 text-center border-2 border-dashed rounded-2xl">No sales recorded by this user</p>
                                    ) : staffStats.sales.slice(0, 5).map(inv => (
                                        <div key={inv.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{inv.id}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{inv.patientName} • {inv.date}</p>
                                            </div>
                                            <p className="text-xs font-black text-green-600">₹{inv.finalTotal.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <div className="p-6 bg-gray-50 rounded-full mb-4"><Briefcase size={40}/></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Select staff member to audit performance logs</p>
                    </div>
                )}
            </div>

            {/* Device Traceability Search */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                           <History className="text-primary" size={20} /> Trace Device Lifecycle
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit any Serial Number across logs</p>
                    </div>
                </div>

                <form onSubmit={handleTraceDevice} className="flex gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:bg-white focus:border-primary outline-none transition font-black uppercase placeholder:font-bold placeholder:text-gray-300"
                            placeholder="Enter Serial Number (e.g. SN12345)"
                            value={serialSearch}
                            onChange={e => setSerialSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-primary text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition shadow-xl shadow-blue-900/20 active:scale-95">Trace Journey</button>
                </form>

                {traceResult ? (
                    <div className="flex-1 animate-fade-in">
                        <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 mb-6 flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Target Device</p>
                                <h4 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">{traceResult.current?.brand || 'ARCHIVED'} {traceResult.current?.model || 'DEVICE'}</h4>
                                <p className="text-xs font-bold text-gray-400 font-mono tracking-widest mt-1">S/N: {traceResult.sn}</p>
                            </div>
                            <div className="text-right">
                                {traceResult.isDeleted && (
                                    <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <AlertTriangle size={12}/> Potentially Deleted
                                    </span>
                                )}
                                {!traceResult.isDeleted && traceResult.current && (
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 ${traceResult.current.status === 'Available' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-primary'}`}>
                                        Current Status: {traceResult.current.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6 pl-4 border-l-2 border-dashed border-gray-200 ml-4">
                            {/* Entry Point */}
                            <div className="relative">
                                <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-sm"></div>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm ml-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1"><Package size={12}/> Inventory Entry</span>
                                        <span className="text-[10px] font-bold text-gray-400">{traceResult.current?.addedDate || 'Legacy Record'}</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-600">Added to system at <span className="text-gray-800 font-black">{traceResult.current?.location || 'Unknown Hub'}</span></p>
                                </div>
                            </div>

                            {/* Transfers */}
                            {traceResult.moves.map((move: StockTransfer) => (
                                <div key={move.id} className="relative">
                                    <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-orange-400 border-4 border-white shadow-sm"></div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm ml-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> Stock Movement</span>
                                            <span className="text-[10px] font-bold text-gray-400">{move.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold">
                                            <span className="text-gray-400">{move.fromLocation}</span>
                                            <ArrowRight size={12} className="text-orange-400"/>
                                            <span className="text-gray-800 font-black">{move.toLocation}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 uppercase mt-2 font-black">Logged By: {move.sender} | Via: {move.transporter}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Quotations */}
                            {traceResult.quotes.map((q: Quotation) => (
                                <div key={q.id} className="relative">
                                    <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-yellow-400 border-4 border-white shadow-sm"></div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm ml-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1"><FileText size={12}/> Quotation Issued</span>
                                            <span className="text-[10px] font-bold text-gray-400">{q.date}</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-600">Estimate provided to <span className="text-gray-800 font-black">{q.patientName}</span></p>
                                        <p className="text-[9px] text-gray-400 uppercase mt-1 font-black">Ref: {q.id}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Sale */}
                            {traceResult.sale && (
                                <div className="relative">
                                    <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm ml-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center gap-1"><CheckCircle size={12}/> Final Settlement (Sale)</span>
                                            <span className="text-[10px] font-bold text-green-600">{traceResult.sale.date}</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 uppercase">Purchased by <span className="text-gray-900 font-black">{traceResult.sale.patientName}</span></p>
                                        <p className="text-xs font-black text-green-700 mt-1">Invoice: {traceResult.sale.id}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <div className="p-6 bg-gray-50 rounded-full mb-4"><Search size={40}/></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Search a valid serial number to see life cycle logs</p>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Stock Level by Brand</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockByBrand}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="count" fill="#3159a6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-[#3159a6] p-8 rounded-3xl shadow-xl text-white flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={120} />
            </div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={20}/> AI Intelligence
                    </h3>
                    <button 
                      onClick={handleGetInsights} 
                      disabled={loadingInsights} 
                      className="text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all backdrop-blur-sm"
                    >
                        {loadingInsights ? 'Processing...' : 'Run Analysis'}
                    </button>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 flex-1 overflow-y-auto text-sm leading-relaxed text-blue-50 font-medium custom-scrollbar backdrop-blur-md">
                    {insights || "Click Run Analysis to let AI evaluate your inventory distribution across locations."}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};