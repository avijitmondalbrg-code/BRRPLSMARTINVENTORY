
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

  const LOW_STOCK_THRESHOLD = 3;
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

  const recentSales = React.useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [invoices]);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const summary = inventory.filter(i => i.status === 'Available').map(i => `- ${i.brand} ${i.model} @ ${i.location}`).join('\n');
    const result = await analyzeStockTrends(summary);
    setInsights(result);
    setLoadingInsights(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 transition hover:shadow-md">
          <div className="h-20 w-48 flex items-center justify-center bg-white rounded-xl">
              <img src={LOGO_URL} alt="BRG" className="h-full object-contain" />
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-100"></div>
          <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Performance Analytics</h2>
              <p className="text-sm text-gray-500 font-medium uppercase">Dashboard Overview</p>
          </div>
          <div className="md:ml-auto flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#3159a6] rounded-full border border-blue-100 text-xs font-black uppercase">
              <Clock size={14} /> Live: {new Date().toLocaleDateString('en-IN')}
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="p-4 bg-blue-50 rounded-full text-[#3159a6]"><IndianRupee size={24} /></div>
          <div><p className="text-gray-500 text-sm font-medium">Total Revenue</p><p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="p-4 bg-indigo-50 rounded-full text-indigo-600"><Package size={24} /></div>
          <div><p className="text-gray-500 text-sm font-medium">Stock Value</p><p className="text-2xl font-bold text-gray-900">₹{totalStockValue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
           <div className="p-4 rounded-full bg-blue-100 text-[#3159a6]"><TrendingUp size={24} /></div>
          <div><p className="text-gray-500 text-sm font-medium">Total Units</p><p className="text-2xl font-bold text-gray-900">{availableCount}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Stock Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockByBrand}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3159a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-sm text-white flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="text-blue-400" size={20}/> AI Insights</h3>
                    <button onClick={handleGetInsights} disabled={loadingInsights} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition">{loadingInsights ? '...' : 'Analyze'}</button>
                </div>
                <div className="bg-white/5 rounded-lg p-4 flex-1 overflow-y-auto text-sm leading-relaxed text-gray-200">
                    {insights || "Click Analyze to see stock trends."}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
