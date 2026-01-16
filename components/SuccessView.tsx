
import React from 'react';
import { Package } from '../types';
import { NetworkConfig, getTxExplorerUrl } from '../config/networks';
import { ExternalLink, CheckCircle2, ArrowRight, Copy, Check } from 'lucide-react';

interface SuccessViewProps {
  pkg: Package;
  txHash?: string | null;
  network?: NetworkConfig | null;
  onReturn: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ pkg, txHash, network, onReturn }) => {
  const [copied, setCopied] = React.useState(false);

  const copyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (txHash && network) {
      window.open(getTxExplorerUrl(network.id, txHash), '_blank');
    }
  };

  const formatTxHash = (hash: string) => {
    if (hash.length > 20) {
      return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    }
    return hash;
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      {/* Success Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl md:text-4xl font-bold mb-3">Subscription Successful!</h2>
      <p className="text-[#929292] text-lg mb-6">Welcome to the elite trading experience</p>

      {/* Transaction Info */}
      {txHash && network && (
        <div className="w-full bg-[#030303] border border-white/5 p-4 rounded-lg mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#929292]">Transaction Hash</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{
              backgroundColor: `${network.color}20`,
              color: network.color
            }}>
              {network.shortName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm text-white font-mono">{formatTxHash(txHash)}</code>
            <div className="flex items-center gap-1">
              <button
                onClick={copyTxHash}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#929292] hover:text-white transition-all"
                title="Copy transaction hash"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
              <button
                onClick={openExplorer}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#929292] hover:text-white transition-all"
                title="View on explorer"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Details Card */}
      <div className="w-full bg-[#111111] border border-white/10 p-8 rounded-xl mb-10">
        <p className="text-xs text-[#0b71ff] uppercase tracking-wider font-medium mb-3">Your New Status</p>
        <h3 className="text-2xl font-bold text-white mb-6">{pkg.name}</h3>

        <div className="grid grid-cols-3 gap-6">
          <Stat label="Trading Fee" value={pkg.tradingFee} />
          <Stat label="Multiplier" value={pkg.pointMultiplier} />
          <Stat label="Rebate" value={pkg.rebate} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => window.open('https://xox.exchange', '_blank')}
          className="flex-1 px-6 py-3.5 bg-[#0b71ff] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-[#0960d9] active:scale-95"
        >
          Start Trading
          <ExternalLink size={16} />
        </button>
        <button
          onClick={onReturn}
          className="flex-1 px-6 py-3.5 bg-white/5 border border-white/10 text-white font-semibold text-sm rounded-lg transition-all hover:bg-white/10 active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-center">
    <p className="text-xs text-[#929292] uppercase tracking-wider mb-1">{label}</p>
    <p className="text-lg font-semibold text-white">{value}</p>
  </div>
);

export default SuccessView;
