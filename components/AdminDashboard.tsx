
import React from 'react';
import { SubscriptionRecord } from '../types';
import { Download, Search, LayoutDashboard } from 'lucide-react';

interface AdminDashboardProps {
  records: SubscriptionRecord[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ records }) => {
  const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);

  const downloadCSV = () => {
    const headers = ['ID', 'Wallet Address', 'Name', 'Email', 'Phone', 'Package', 'Amount', 'Date', 'TxHash'];
    const rows = records.map(r => [
      r.id,
      r.userAddress,
      r.userName,
      r.userEmail,
      r.userPhone,
      r.packageName,
      r.amount,
      new Date(r.timestamp).toLocaleString(),
      r.txHash
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => `"${e.join('","')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `xox_subscriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#0066FF] mb-2 uppercase tracking-widest text-xs font-bold">
            <LayoutDashboard size={14} />
            Admin Control Center
          </div>
          <h1 className="text-4xl font-bold">Subscription Metrics</h1>
        </div>

        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 transition-colors text-sm font-semibold"
        >
          <Download size={18} />
          Export CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard label="Total Subscriptions" value={records.length.toString()} />
        <StatCard label="Total Revenue" value={`${totalRevenue.toLocaleString()} USDT`} />
        <StatCard label="Active Packages" value="3" />
      </div>

      <div className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold">Recent Transactions</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Filter by address..." 
              className="pl-10 pr-4 py-2 bg-black border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#0066FF]/50 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/50 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Package Rank</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.length > 0 ? records.map((record) => (
                <tr key={record.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-[#0066FF]">{record.userAddress.slice(0, 8)}...{record.userAddress.slice(-6)}</p>
                    <p className="text-sm font-bold mt-0.5">{record.userName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-400">{record.userEmail}</p>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase">{record.userPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{record.packageName}</td>
                  <td className="px-6 py-4 font-mono text-sm">{record.amount.toLocaleString()} USDT</td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">{new Date(record.timestamp).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No subscriptions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl">
    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">{label}</p>
    <p className="text-3xl font-mono font-bold">{value}</p>
  </div>
);

export default AdminDashboard;
