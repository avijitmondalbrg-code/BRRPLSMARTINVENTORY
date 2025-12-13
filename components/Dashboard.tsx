import React from 'react';
import { HearingAid, Invoice } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface DashboardProps {
  inventory: HearingAid[];
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, invoices }) => {
  const LOGO_URL = "https://bengalrehabilitationgroup.com/images/brg_logo.png";
  const availableItems = inventory.filter(i => i.status === 'Available');
  const totalStockValue = availableItems.reduce((acc, item) => acc + item.price, 0);
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.finalTotal, 0);

  const stockByBrand = React.useMemo(() => {
    const data: Record<string, number> = {};
    availableItems.forEach(item => { data[item.brand] = (data[item.brand] || 0) + 1; });
    return Object.keys(data).map(brand => ({ name: brand, count: data[brand] }));
  }, [availableItems]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
          <img src={LOGO_URL} alt="BRG Logo" className="h-20 object-contain" />
          <div className="hidden md:block w-px h-12 bg-gray-100"></div>
          <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Performance Analytics</h2>
              <p className="text-sm text-gray-500 font-medium uppercase">Dashboard Overview</p>
          </div>
          <div className="md:ml-auto flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-black uppercase">
              <Clock size={14} /> {new Date().toLocaleDateString('en-IN')}
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-full text-green-600"><IndianRupee size={24} /></div>
          <div><p className="text-gray-500 text-sm">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600"><Package size={24} /></div>
          <div><p className="text-gray-500 text-sm">Stock Value</p><p className="text-2xl font-bold">₹{totalStockValue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-4 bg-teal-100 rounded-full text-teal-600"><TrendingUp size={24} /></div>
          <div><p className="text-gray-500 text-sm">Available Units</p><p className="text-2xl font-bold">{availableItems.length}</p></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border h-80">
        <h3 className="text-lg font-semibold mb-4">Stock Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockByBrand}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};