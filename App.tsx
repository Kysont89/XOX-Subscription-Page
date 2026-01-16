
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PricingCard from './components/PricingCard';
import SuccessView from './components/SuccessView';
import AdminDashboard from './components/AdminDashboard';
import UserDetailsForm from './components/UserDetailsForm';
import WalletModal from './components/WalletModal';
import AdminAuthGate from './components/AdminAuthGate';
import { PACKAGES } from './constants';
import { Package, AppState, SubscriptionRecord, VipLevel } from './types';
import { useSecureWallet } from './hooks/useSecureWallet';
import { useSecureRecords } from './hooks/useSecureRecords';
import { sanitizeInput, validateAddress } from './utils/security';
import {
  ArrowRight,
  Loader2,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  TrendingUp,
  Globe,
  Clock,
  DollarSign,
  BarChart3,
  Zap,
  AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [currentVip, setCurrentVip] = useState<VipLevel>(VipLevel.NONE);
  const [subscribingPackage, setSubscribingPackage] = useState<Package | null>(null);
  const [isCollectingDetails, setIsCollectingDetails] = useState(false);
  const [currentUserDetails, setCurrentUserDetails] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [txStep, setTxStep] = useState<0 | 1 | 2>(0);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Use secure wallet hook
  const wallet = useSecureWallet();

  // Use secure records hook
  const { records, saveRecord, error: recordsError, integrityValid } = useSecureRecords();

  // Set balance when wallet connects
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      setUsdtBalance(125000); // Mock balance for demo
    } else {
      setUsdtBalance(0);
    }
  }, [wallet.isConnected, wallet.address]);

  // Continue subscription flow after wallet connects
  useEffect(() => {
    if (wallet.address && subscribingPackage && !isCollectingDetails && txStep === 0) {
      setIsCollectingDetails(true);
    }
  }, [wallet.address, subscribingPackage, isCollectingDetails, txStep]);

  const openWalletModal = useCallback(() => {
    setShowWalletModal(true);
  }, []);

  const handleWalletSelect = useCallback(async (walletId: string) => {
    setShowWalletModal(false);
    await wallet.connectWallet(walletId);
  }, [wallet]);

  const startSubscription = useCallback(async (pkg: Package) => {
    if (!wallet.address) {
      setSubscribingPackage(pkg);
      openWalletModal();
      return;
    }
    setSubscribingPackage(pkg);
    setIsCollectingDetails(true);
  }, [wallet.address, openWalletModal]);

  const handleDetailsSubmit = useCallback((details: { name: string; email: string; phone: string }) => {
    // Details are already sanitized by the form
    setCurrentUserDetails(details);
    setIsCollectingDetails(false);
    setTxStep(1);
  }, []);

  const handleApproval = useCallback(() => {
    setTimeout(() => {
      setTxStep(2);
    }, 1200);
  }, []);

  const handlePayment = useCallback(async () => {
    if (!subscribingPackage || !wallet.address || !currentUserDetails) return;

    // Validate wallet address
    if (!validateAddress(wallet.address)) {
      console.error('Invalid wallet address');
      return;
    }

    setTimeout(async () => {
      const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const newRecord: SubscriptionRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        userAddress: wallet.address!,
        userName: sanitizeInput(currentUserDetails.name),
        userEmail: sanitizeInput(currentUserDetails.email),
        userPhone: sanitizeInput(currentUserDetails.phone),
        packageName: subscribingPackage.name,
        amount: subscribingPackage.price,
        timestamp: Date.now(),
        txHash: txHash
      };

      const saved = await saveRecord(newRecord);
      if (saved) {
        setUsdtBalance(prev => prev - subscribingPackage.price);
        setCurrentVip(subscribingPackage.level);
        setTxStep(0);
        setAppState('SUCCESS');
      }
    }, 1800);
  }, [subscribingPackage, wallet.address, currentUserDetails, saveRecord]);

  const handleAdminVerify = useCallback(async () => {
    return await wallet.verifyAdminAccess();
  }, [wallet]);

  return (
    <div className="min-h-screen grid-bg relative text-white selection:bg-[#0b71ff] selection:text-black">
      <Header
        address={wallet.address}
        onConnect={openWalletModal}
        onSetState={setAppState}
        currentState={appState}
        isAdmin={wallet.isAdmin}
      />

      <main className="pt-24">
        {/* Data Integrity Warning */}
        {!integrityValid && (
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Data Integrity Warning</p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Stored data failed integrity verification. Some records may have been modified externally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Records Error */}
        {recordsError && (
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="text-xs text-red-400/80 mt-1">{recordsError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Error */}
        {wallet.error && (
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Wallet Error</p>
                  <p className="text-xs text-red-400/80 mt-1">{wallet.error}</p>
                </div>
                <button
                  onClick={wallet.clearError}
                  className="ml-auto text-red-400 hover:text-red-300 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === 'LANDING' && (
          <LandingHero
            onViewPackages={() => setAppState('DASHBOARD')}
            onVisitWebsite={() => window.open('https://xox.exchange/', '_blank')}
          />
        )}

        {appState === 'DASHBOARD' && (
          <div className="max-w-7xl mx-auto px-6 py-16">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b71ff]/10 border border-[#0b71ff]/20 text-[#0b71ff] text-xs font-medium mb-6">
                <Sparkles size={14} />
                VIP Subscription
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Choose Your Plan
              </h2>
              <p className="text-[#929292] text-lg max-w-2xl mx-auto">
                Unlock the full potential of XOX Exchange with reduced fees, point boosts, and direct commission rebates.
              </p>
            </div>

            {/* Wallet Info Card */}
            <div className="max-w-md mx-auto mb-16">
              <div className="bg-[#111111] border border-white/10 p-6 rounded-xl">
                {wallet.address ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#929292] uppercase tracking-wider mb-1">Portfolio Balance</p>
                      <p className="text-2xl font-bold text-white">
                        {usdtBalance.toLocaleString()} <span className="text-[#0b71ff]">USDT</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#929292] uppercase tracking-wider mb-1">Current Tier</p>
                      <p className="text-lg font-semibold text-white">
                        {currentVip === VipLevel.NONE ? 'Standard' : PACKAGES.find(p => p.level === currentVip)?.name.split(' - ')[1]}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <button
                      onClick={openWalletModal}
                      className="text-sm font-medium text-[#0b71ff] hover:text-white transition-colors"
                    >
                      Connect wallet to view balance
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {PACKAGES.map((pkg) => (
                <PricingCard
                  key={pkg.id}
                  pkg={pkg}
                  onSubscribe={startSubscription}
                  disabled={currentVip >= pkg.level}
                />
              ))}
            </div>
          </div>
        )}

        {appState === 'SUCCESS' && subscribingPackage && (
          <SuccessView
            pkg={subscribingPackage}
            onReturn={() => setAppState('DASHBOARD')}
          />
        )}

        {appState === 'ADMIN' && (
          <AdminAuthGate
            isAdmin={wallet.isAdmin}
            isAdminVerified={wallet.isAdminVerified}
            isLoading={wallet.isLoading}
            error={wallet.error}
            onVerify={handleAdminVerify}
            onGoBack={() => setAppState('LANDING')}
          >
            <AdminDashboard records={records} />
          </AdminAuthGate>
        )}
      </main>

      {/* Overlays */}
      {isCollectingDetails && subscribingPackage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <UserDetailsForm
            price={subscribingPackage.price}
            onSubmit={handleDetailsSubmit}
            onCancel={() => {
              setIsCollectingDetails(false);
              setSubscribingPackage(null);
            }}
          />
        </div>
      )}

      {txStep > 0 && subscribingPackage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-xl p-8 shadow-2xl">
             <div className="text-center mb-8">
               <h3 className="text-xl font-bold text-white mb-2">Processing Transaction</h3>
               <p className="text-[#929292] text-sm">Please complete the steps below</p>
             </div>
             <div className="space-y-4">
                <TxStepItem
                  step={1}
                  title="USDT Approval"
                  description="Grant permission to interact with USDT"
                  status={txStep === 1 ? 'ACTIVE' : 'COMPLETED'}
                  onAction={handleApproval}
                />
                <TxStepItem
                  step={2}
                  title="Confirm Purchase"
                  description="Complete the subscription transaction"
                  status={txStep === 1 ? 'PENDING' : txStep === 2 ? 'ACTIVE' : 'COMPLETED'}
                  onAction={handlePayment}
                />
             </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSelectWallet={handleWalletSelect}
      />
    </div>
  );
};

const LandingHero: React.FC<{ onViewPackages: () => void; onVisitWebsite: () => void }> = ({ onViewPackages, onVisitWebsite }) => (
  <div className="relative">
    {/* Hero Section */}
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
      {/* Badge */}
      <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b71ff]/10 border border-[#0b71ff]/20 text-[#0b71ff] text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-[#0b71ff] animate-pulse"></span>
        V1 Protocol Testing
      </div>

      {/* Tagline */}
      <p className="text-[#929292] text-lg mb-6 font-medium">
        One email | One wallet | Trading & Staking
      </p>

      {/* Main Heading */}
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.1]">
        Experience of{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0b71ff] to-[#3b9cff]">
          Exchange
        </span>
      </h1>

      {/* Subheading */}
      <p className="max-w-2xl text-[#929292] text-lg md:text-xl mb-12 leading-relaxed">
        Decentralized Exchange with Ultra-Fast Seamless Trading Experience
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onViewPackages}
          className="group px-8 py-4 bg-[#0b71ff] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-[#0960d9] active:scale-95"
        >
          Subscribe
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onVisitWebsite}
          className="px-8 py-4 bg-transparent border border-white/20 text-white font-semibold text-sm rounded-lg transition-all hover:bg-white/5 hover:border-white/30 flex items-center justify-center gap-2 active:scale-95"
        >
          Visit Website
          <ExternalLink size={18} />
        </button>
      </div>
    </div>

    {/* Features Section */}
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">High-Performance Trading for Everyone</h2>
        <p className="text-[#929292] text-lg max-w-2xl mx-auto">
          Trade Anytime, Anywhere with institutional-grade infrastructure
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          icon={<DollarSign size={24} />}
          title="Ultra-Low Costs"
          description="Minimal trading fees with transparent pricing structure"
        />
        <FeatureCard
          icon={<TrendingUp size={24} />}
          title="Near-Zero Slippage"
          description="Deep liquidity pools ensure minimal price impact"
        />
        <FeatureCard
          icon={<Globe size={24} />}
          title="Broad Asset Coverage"
          description="Trade a wide range of perpetual contracts"
        />
        <FeatureCard
          icon={<Zap size={24} />}
          title="Instant Execution"
          description="Lightning-fast order matching and settlement"
        />
        <FeatureCard
          icon={<Layers size={24} />}
          title="Ultra-Deep Liquidity"
          description="Institution-grade depth through hybrid aggregation"
        />
        <FeatureCard
          icon={<Clock size={24} />}
          title="Lightning-Fast"
          description="200,000+ orders per second throughput"
        />
        <FeatureCard
          icon={<Shield size={24} />}
          title="Proven Security"
          description="StarkEx zero-knowledge rollups on Ethereum L1"
        />
        <FeatureCard
          icon={<BarChart3 size={24} />}
          title="Unified Experience"
          description="Cross-chain deposits and DeFi connectivity"
        />
      </div>
    </div>

    {/* Footer */}
    <footer className="border-t border-white/5 mt-12 bg-[#030303]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Social */}
          <div className="col-span-2 md:col-span-1">
            <img src="/xox-logo.jpeg" alt="XOX" className="h-8 w-auto mb-6" />
            <div className="flex items-center gap-4">
              <a href="https://x.com/xox_DEX" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-[#111111] border border-white/10 flex items-center justify-center text-[#929292] hover:text-white hover:border-white/20 transition-all">
                <i className="fab fa-x-twitter"></i>
              </a>
              <a href="https://discord.gg/x7Hpa9g7As" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-[#111111] border border-white/10 flex items-center justify-center text-[#929292] hover:text-white hover:border-white/20 transition-all">
                <i className="fab fa-discord"></i>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="https://xox.exchange" target="_blank" rel="noopener noreferrer" className="text-[#929292] hover:text-white text-sm transition-colors">Launch App</a></li>
              <li><a href="https://xox.exchange/download" target="_blank" rel="noopener noreferrer" className="text-[#929292] hover:text-white text-sm transition-colors">iOS Download</a></li>
              <li><a href="https://xox.exchange/download" target="_blank" rel="noopener noreferrer" className="text-[#929292] hover:text-white text-sm transition-colors">Android Download</a></li>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Developer</h4>
            <ul className="space-y-3">
              <li><a href="https://docs.xox.exchange/" target="_blank" rel="noopener noreferrer" className="text-[#929292] hover:text-white text-sm transition-colors">Documentation</a></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">About</h4>
            <ul className="space-y-3">
              <li><a href="https://docs.xox.exchange/" target="_blank" rel="noopener noreferrer" className="text-[#929292] hover:text-white text-sm transition-colors">About XOX</a></li>
              <li><a href="https://docs.xox.exchange/about/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#929292] hover:text-white text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="https://docs.xox.exchange/about/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-[#929292] hover:text-white text-sm transition-colors">Terms of Use</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/5">
          <p className="text-[#929292] text-sm">© 2026 XOX. All rights reserved.</p>
        </div>
      </div>
    </footer>

    {/* Decorative blur elements */}
    <div className="absolute -z-10 top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-[#0b71ff]/8 rounded-full blur-[150px]"></div>
      <div className="absolute top-[30%] right-[5%] w-80 h-80 bg-[#0b71ff]/5 rounded-full blur-[120px]"></div>
    </div>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-6 rounded-xl bg-[#111111] border border-white/5 hover:border-[#0b71ff]/30 transition-all group">
    <div className="w-12 h-12 rounded-lg bg-[#0b71ff]/10 flex items-center justify-center text-[#0b71ff] mb-4 group-hover:bg-[#0b71ff]/20 transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-[#929292] leading-relaxed">{description}</p>
  </div>
);

const TxStepItem: React.FC<{
  step: number;
  title: string;
  description: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  onAction?: () => void
}> = ({ step, title, description, status, onAction }) => (
  <div className={`p-5 rounded-xl border transition-all ${
    status === 'ACTIVE' ? 'bg-[#0b71ff]/5 border-[#0b71ff]/30' : 'bg-[#030303] border-white/5'
  }`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
          status === 'COMPLETED' ? 'bg-green-500 text-white' : status === 'ACTIVE' ? 'bg-[#0b71ff] text-white' : 'bg-white/5 text-[#929292]'
        }`}>
          {status === 'COMPLETED' ? '✓' : step}
        </div>
        <span className={`font-semibold text-sm ${status === 'PENDING' ? 'text-[#929292]/50' : 'text-white'}`}>
          {title}
        </span>
      </div>
      {status === 'ACTIVE' && <Loader2 className="animate-spin text-[#0b71ff]" size={18} />}
    </div>
    <p className={`text-xs ml-11 ${status === 'PENDING' ? 'text-[#929292]/30' : 'text-[#929292]'}`}>{description}</p>

    {status === 'ACTIVE' && onAction && (
      <button
        onClick={onAction}
        className="mt-4 w-full py-3 bg-[#0b71ff] text-white text-sm font-semibold rounded-lg hover:bg-[#0960d9] transition-all active:scale-[0.98]"
      >
        Confirm
      </button>
    )}
  </div>
);

export default App;
