
import React, { useState, useMemo } from 'react';
import { SubscriptionRecord } from '../types';
import { Download, Search, LayoutDashboard, ExternalLink, Copy, Check, Shield } from 'lucide-react';
import { decodeInput, sanitizeInput } from '../utils/security';

interface AdminDashboardProps {
  records: SubscriptionRecord[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalRevenue = useMemo(() =>
    records.reduce((sum, r) => sum + r.amount, 0),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return records.filter(record =>
      record.userAddress.toLowerCase().includes(term) ||
      decodeInput(record.userName).toLowerCase().includes(term) ||
      decodeInput(record.userEmail).toLowerCase().includes(term) ||
      record.txHash.toLowerCase().includes(term)
    );
  }, [records, searchTerm]);

  const sanitizeCSVValue = (value: string | number): string => {
    const strValue = String(value);
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];
    let sanitized = strValue;
    if (dangerousChars.some(char => strValue.startsWith(char))) {
      sanitized = `'${strValue}`;
    }
    sanitized = sanitized.replace(/"/g, '""');
    return sanitized;
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Wallet Address', 'Name', 'Email', 'Phone', 'Package', 'Amount (USDT)', 'Date', 'Time', 'TxHash'];
    const rows = records.map(r => {
      const date = new Date(r.timestamp);
      return [
        sanitizeCSVValue(r.id),
        sanitizeCSVValue(r.userAddress),
        sanitizeCSVValue(decodeInput(r.userName)),
        sanitizeCSVValue(decodeInput(r.userEmail)),
        sanitizeCSVValue(decodeInput(r.userPhone)),
        sanitizeCSVValue(decodeInput(r.packageName)),
        sanitizeCSVValue(r.amount),
        sanitizeCSVValue(date.toLocaleDateString()),
        sanitizeCSVValue(date.toLocaleTimeString()),
        sanitizeCSVValue(r.txHash)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(row => `"${row.join('","')}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `xox_subscriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize search input
    const sanitized = sanitizeInput(e.target.value);
    setSearchTerm(sanitized);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#0b71ff] mb-2 uppercase tracking-wider text-xs font-medium">
            <LayoutDashboard size={14} />
            Admin Dashboard
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px]">
              <Shield size={10} className="inline mr-1" />
              Verified
            </span>
          </div>
          <h1 className="text-3xl font-bold">Subscription Records</h1>
        </div>

        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0b71ff] text-white rounded-lg hover:bg-[#0960d9] transition-colors text-sm font-semibold"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard label="Total Subscriptions" value={records.length.toString()} />
        <StatCard label="Total Revenue" value={`${totalRevenue.toLocaleString()} USDT`} />
        <StatCard label="Active Packages" value="3" />
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-semibold text-white">All Transactions</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" size={16} />
            <input
              type="text"
              placeholder="Search by address, name, email or tx..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2.5 w-full sm:w-80 bg-[#030303] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#0b71ff]/50 transition-colors"
              maxLength={100}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#030303] text-xs font-medium text-[#929292] uppercase tracking-wider border-b border-white/5">
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Package</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Date & Time</th>
                <th className="px-5 py-4">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => {
                const { date, time } = formatDate(record.timestamp);
                // Decode sanitized values for display
                const displayName = decodeInput(record.userName);
                const displayEmail = decodeInput(record.userEmail);
                const displayPhone = decodeInput(record.userPhone);
                const displayPackage = decodeInput(record.packageName);

                return (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white mb-1">{displayName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-[#0b71ff]">
                          {record.userAddress.slice(0, 6)}...{record.userAddress.slice(-4)}
                        </p>
                        <button
                          onClick={() => copyToClipboard(record.userAddress, `addr-${record.id}`)}
                          className="text-[#929292] hover:text-white transition-colors"
                          title="Copy wallet address"
                        >
                          {copiedId === `addr-${record.id}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white mb-1">{displayEmail}</p>
                      <p className="text-xs text-[#929292]">{displayPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-white">{displayPackage}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-white">{record.amount.toLocaleString()} USDT</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white">{date}</p>
                      <p className="text-xs text-[#929292]">{time}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-[#929292]">
                          {record.txHash.slice(0, 10)}...{record.txHash.slice(-8)}
                        </p>
                        <button
                          onClick={() => copyToClipboard(record.txHash, `tx-${record.id}`)}
                          className="text-[#929292] hover:text-white transition-colors"
                          title="Copy transaction hash"
                        >
                          {copiedId === `tx-${record.id}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <a
                          href={`https://etherscan.io/tx/${record.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#929292] hover:text-[#0b71ff] transition-colors"
                          title="View on Etherscan"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#929292]">
                    {searchTerm ? 'No matching records found' : 'No subscriptions yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Footer */}
      <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 text-xs text-[#929292]">
          <Shield size={14} className="text-green-400" />
          <span>Admin session verified via cryptographic signature. Data integrity protected.</span>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-[#111111] border border-white/10 p-6 rounded-xl">
    <p className="text-xs text-[#929292] uppercase tracking-wider font-medium mb-2">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default AdminDashboard;
