import React from 'react';
import { HearingAid, Invoice } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, AlertCircle, IndianRupee, Package, Sparkles, AlertTriangle, ArrowRight, Clock, Building2 } from 'lucide-react';
import { analyzeStockTrends } from '../services/geminiService';

interface DashboardProps {
  inventory: HearingAid[];
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, invoices }) => {
  const [insights, setInsights] = React.useState<string>('');
  const [loadingInsights, setLoadingInsights] = React.useState(false);

  // Configuration
  const LOW_STOCK_THRESHOLD = 3;
  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";

  // Stats Calculation
  const availableItems = inventory.filter(i => i.status === 'Available');
  const totalStockValue = availableItems.reduce((acc, item) => acc + item.price, 0);
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.finalTotal, 0);
  const availableCount = availableItems.length;

  // Granular Stock Analysis (Group by Brand + Model)
  const stockByModel = React.useMemo(() => {
    const map: Record<string, { count: number, price: number }> = {};
    availableItems.forEach(item => {
      const key = `${item.brand} ${item.model}`;
      if (!map[key]) map[key] = { count: 0, price: item.price };
      map[key].count++;
    });
    return map;
  }, [availableItems]);

  // Identify Low Stock Items
  const lowStockItems = Object.entries(stockByModel)
    .filter(([_, data]: [string, { count: number, price: number }]) => data.count < LOW_STOCK_THRESHOLD)
    .map(([name, data]: [string, { count: number, price: number }]) => ({ name, count: data.count, price: data.price }))
    .sort((a, b) => a.count - b.count); // Sort by lowest count first

  // Chart Data: Stock by Brand
  const stockByBrand = React.useMemo(() => {
    const data: Record<string, number> = {};
    availableItems.forEach(item => {
      data[item.brand] = (data[item.brand] || 0) + 1;
    });
    return Object.keys(data).map(brand => ({ name: brand, count: data[brand] }));
  }, [availableItems]);

  // Recent Sales Logic
  const recentSales = React.useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [invoices]);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const summary = inventory
        .filter(i => i.status === 'Available')
        .map(i => `- ${i.brand} ${i.model} @ ${i.location} (Price: ₹${i.price})`)
        .join('\n');
    
    const context = `Total Items: ${availableCount}, Total Value: ₹${totalStockValue}\n\nList:\n${summary}`;
    
    const result = await analyzeStockTrends(context);
    setInsights(result);
    setLoadingInsights(false);
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Branding Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 transition hover:shadow-md">
          <div className="h-20 w-48 flex items-center justify-center bg-white rounded-xl">
              <img 
                src={LOGO_URL} 
                alt="Bengal Rehabilitation Group" 
                className="h-full object-contain"
              />
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-100"></div>
          <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Performance Analytics</h2>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Dashboard Overview</p>
          </div>
          <div className="md:ml-auto flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full border border-teal-100 text-xs font-black uppercase tracking-widest">
              <Clock size={14} /> Live Status: {new Date().toLocaleDateString('en-IN')}
          </div>
      </div>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="p-4 bg-green-100 rounded-full text-green-600"><IndianRupee size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600"><Package size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Stock Value (Asset)</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalStockValue.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
           <div className={`p-4 rounded-full ${lowStockItems.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}`}>
             {lowStockItems.length > 0 ? <AlertTriangle size={24} /> : <TrendingUp size={24} />}
           </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Units</p>
            <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
            {lowStockItems.length > 0 && (
                <p className="text-xs text-orange-600 font-medium mt-1">{lowStockItems.length} Models Low on Stock</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Charts & Recent Sales */}
        <div className="xl:col-span-2 space-y-6">
            {/* Main Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Stock Distribution by Brand</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockByBrand}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                        cursor={{fill: '#f3f4f6'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock className="text-primary" size={20} />
                    Recent Sales
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase border-b">
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Patient</th>
                                <th className="pb-3 font-medium text-center">Items</th>
                                <th className="pb-3 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentSales.length === 0 ? (
                                <tr><td colSpan={4} className="py-4 text-center text-gray-500 text-sm">No recent sales found.</td></tr>
                            ) : recentSales.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition group">
                                    <td className="py-3 text-sm text-gray-500">
                                        {new Date(inv.date).toLocaleDateString('en-IN')}
                                        <span className="block text-xs text-gray-400 font-mono mt-0.5">{inv.id}</span>
                                    </td>
                                    <td className="py-3 text-sm font-medium text-gray-800">{inv.patientName}</td>
                                    <td className="py-3 text-sm text-gray-600 text-center">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{inv.items.length}</span>
                                    </td>
                                    <td className="py-3 text-sm font-bold text-teal-700 text-right">
                                        ₹{inv.finalTotal.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Right Column: Alerts & AI */}
        <div className="space-y-6">
            
            {/* Low Stock Alerts Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-red-50 flex justify-between items-center">
                    <h3 className="font-semibold text-red-800 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Critical Stock Alerts
                    </h3>
                    <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
                        {lowStockItems.length}
                    </span>
                </div>
                <div className="p-0 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {lowStockItems.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            All stock levels are healthy.
                        </div>
                    ) : (
                        lowStockItems.map((item, idx) => (
                            <div key={idx} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">Unit Price: ₹{item.price.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.count === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {item.count === 0 ? 'Out of Stock' : `${item.count} Left`}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {lowStockItems.length > 0 && (
                    <div className="p-3 bg-gray-50 text-center border-t">
                         <button className="text-xs text-blue-600 font-medium hover:underline flex items-center justify-center gap-1 w-full">
                            Go to Inventory to Reorder <ArrowRight size={12} />
                         </button>
                    </div>
                )}
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-sm text-white flex flex-col flex-1">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="text-yellow-400" size={20}/> 
                        AI Insights
                    </h3>
                    <button 
                        onClick={handleGetInsights} 
                        disabled={loadingInsights}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition disabled:opacity-50"
                    >
                        {loadingInsights ? 'Analyzing...' : 'Generate Analysis'}
                    </button>
                </div>
                <div className="bg-white/5 rounded-lg p-4 flex-1 overflow-y-auto text-sm leading-relaxed text-gray-200 min-h-[200px]">
                    {insights ? (
                        <div className="whitespace-pre-line prose prose-invert prose-sm max-w-none">
                            {insights}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                            <Sparkles className="h-8 w-8 mb-2 opacity-20" />
                            <p>Click "Generate Analysis" to get strategic stock insights using AI.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};