
import React from 'react';
import { HearingAid, Invoice } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, IndianRupee, Package, Sparkles, Clock } from 'lucide-react';
import { analyzeStockTrends } from '../services/geminiService';

interface DashboardProps {
  inventory: HearingAid[];
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, invoices }) => {
  const [insights, setInsights] = React.useState<string>('');
  const [loadingInsights, setLoadingInsights] = React.useState(false);

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
  }

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
        <div className="xl:col-span-2">
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
