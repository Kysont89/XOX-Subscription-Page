
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PricingCard from './components/PricingCard';
import SuccessView from './components/SuccessView';
import AdminDashboard from './components/AdminDashboard';
import UserDetailsForm from './components/UserDetailsForm';
import { PACKAGES } from './constants';
import { Package, AppState, SubscriptionRecord, VipLevel } from './types';
import { 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  ExternalLink, 
  Activity, 
  Database, 
  Users, 
  CheckCircle2,
  Clock
} from 'lucide-react';

const MOCK_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [currentVip, setCurrentVip] = useState<VipLevel>(VipLevel.NONE);
  const [subscribingPackage, setSubscribingPackage] = useState<Package | null>(null);
  const [isCollectingDetails, setIsCollectingDetails] = useState(false);
  const [currentUserDetails, setCurrentUserDetails] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [txStep, setTxStep] = useState<0 | 1 | 2>(0); 
  const [records, setRecords] = useState<SubscriptionRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('xox_subscriptions');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const saveRecord = useCallback((record: SubscriptionRecord) => {
    setRecords(prev => {
      const next = [record, ...prev];
      localStorage.setItem('xox_subscriptions', JSON.stringify(next));
      return next;
    });
  }, []);

  const connectWallet = useCallback(() => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUserAddress(MOCK_ADDRESS);
        setUsdtBalance(125000);
        if (appState === 'LANDING') {
          setAppState('DASHBOARD');
        }
        resolve();
      }, 800);
    });
  }, [appState]);

  const startSubscription = async (pkg: Package) => {
    if (!userAddress) {
      await connectWallet();
    }
    setSubscribingPackage(pkg);
    setIsCollectingDetails(true);
  };

  const handleDetailsSubmit = (details: { name: string; email: string; phone: string }) => {
    setCurrentUserDetails(details);
    setIsCollectingDetails(false);
    setTxStep(1);
  };

  const handleApproval = () => {
    setTimeout(() => {
      setTxStep(2);
    }, 1200);
  };

  const handlePayment = () => {
    if (!subscribingPackage || !userAddress || !currentUserDetails) return;
    setTimeout(() => {
      const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const newRecord: SubscriptionRecord = {
        id: Math.random().toString(36).substr(2, 9),
        userAddress: userAddress,
        userName: currentUserDetails.name,
        userEmail: currentUserDetails.email,
        userPhone: currentUserDetails.phone,
        packageName: subscribingPackage.name,
        amount: subscribingPackage.price,
        timestamp: Date.now(),
        txHash: txHash
      };
      saveRecord(newRecord);
      setUsdtBalance(prev => prev - subscribingPackage.price);
      setCurrentVip(subscribingPackage.level);
      setTxStep(0);
      setAppState('SUCCESS');
    }, 1800);
  };

  return (
    <div className="min-h-screen grid-bg relative text-white selection:bg-[#00E8FF] selection:text-black">
      <Header 
        address={userAddress} 
        onConnect={connectWallet} 
        onSetState={setAppState}
        currentState={appState}
      />

      <main className="pt-24">
        {appState === 'LANDING' && (
          <LandingHero 
            onViewPackages={() => setAppState('DASHBOARD')} 
            onVisitWebsite={() => window.open('https://xox.exchange/', '_blank')}
          />
        )}

        {appState === 'DASHBOARD' && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-[#00E8FF] font-black text-xs tracking-[0.3em] uppercase mb-4">
                  <Sparkles size={16} />
                  Tier Privileges
                </div>
                <h2 className="text-5xl font-black tracking-tight leading-none mb-6">
                  PROFESSIONAL <br /> TRADING PERKS.
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Unlock the full potential of XOX Exchange with reduced fees, point boosts, and direct commission rebates.
                </p>
              </div>
              
              <div className="bg-[#0A0A0F] border border-[#ffffff10] p-8 rounded-2xl flex items-center gap-10 shadow-2xl min-w-[360px]">
                {userAddress ? (
                  <>
                    <div>
                      <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2">Portfolio USDT</p>
                      <p className="text-4xl font-mono font-bold tracking-tighter text-[#00E8FF]">
                        {usdtBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-14 w-[1px] bg-white/10" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2">Current Tier</p>
                      <p className="text-xl font-black text-white">
                        {currentVip === VipLevel.NONE ? 'STANDARD' : PACKAGES.find(p => p.level === currentVip)?.name.split(' - ')[1]}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center">
                    <button 
                      onClick={connectWallet}
                      className="text-xs font-black tracking-widest text-[#00E8FF] uppercase hover:text-white transition-all underline underline-offset-4"
                    >
                      Connect to view balance
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
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
          <AdminDashboard records={records} />
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
          <div className="relative w-full max-w-md bg-[#0A0A0F] border border-[#00E8FF]/30 rounded-2xl p-10 shadow-[0_0_50px_rgba(0,232,255,0.1)]">
             <div className="text-center mb-10">
               <h3 className="text-2xl font-black tracking-widest mb-3 uppercase">PROCESSING...</h3>
               <p className="text-slate-500 text-sm">Validating assets on the blockchain.</p>
             </div>
             <div className="space-y-6">
                <TxStepItem 
                  step={1} 
                  title="USDT APPROVAL" 
                  description="Grant permission to interact with USDT." 
                  status={txStep === 1 ? 'ACTIVE' : 'COMPLETED'} 
                  onAction={handleApproval}
                />
                <TxStepItem 
                  step={2} 
                  title="CONFIRM PURCHASE" 
                  description="Complete the subscription transaction." 
                  status={txStep === 1 ? 'PENDING' : txStep === 2 ? 'ACTIVE' : 'COMPLETED'} 
                  onAction={handlePayment}
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LandingHero: React.FC<{ onViewPackages: () => void; onVisitWebsite: () => void }> = ({ onViewPackages, onVisitWebsite }) => (
  <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-48 flex flex-col items-center text-center">
    <div className="mb-10 flex items-center gap-3 px-6 py-2 rounded-full bg-[#00E8FF]/10 border border-[#00E8FF]/30 text-[#00E8FF] text-[11px] font-black tracking-[0.4em] uppercase">
      <Activity size={18} />
      V1 Protocol Testing
    </div>
    
    <h1 className="text-[5rem] md:text-[8.5rem] font-black tracking-tighter mb-10 leading-[0.85] text-white uppercase italic">
      Experience of <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00E8FF] to-[#0066FF] text-glow-cyan">
        Exchange.
      </span>
    </h1>
    
    <p className="max-w-2xl text-xl text-slate-400 mb-16 font-medium tracking-tight">
      One email | One wallet | Trading & Staking
    </p>

    <div className="flex flex-col sm:flex-row gap-6 mb-24">
      <button 
        onClick={onViewPackages}
        className="group relative px-14 py-6 bg-[#00E8FF] text-black font-black text-sm tracking-[0.25em] rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,232,255,0.4)] uppercase"
      >
        <Sparkles size={20} className="text-black" />
        View Packages
        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform text-black" />
      </button>
      
      <button 
        onClick={onVisitWebsite}
        className="px-14 py-6 bg-transparent border-2 border-white text-white font-black text-sm tracking-[0.25em] rounded-xl transition-all hover:bg-white hover:text-black flex items-center justify-center gap-3 active:scale-95 uppercase"
      >
        Visit Website
        <ExternalLink size={20} />
      </button>
    </div>

    {/* Metrics Section */}
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl border-t border-white/5 pt-16">
      <MetricItem label="24H Volume" value="Pending" icon={<Activity size={20} />} />
      <MetricItem label="Cumulative" value="To be" icon={<Database size={20} />} />
      <MetricItem label="Addresses" value="Released" icon={<Users size={20} />} />
    </div>

    {/* Decorative blur elements */}
    <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[#00E8FF]/5 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-[#0066FF]/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
    </div>
  </div>
);

const MetricItem: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex flex-col items-center group">
    <p className="text-[11px] font-black tracking-[0.4em] text-slate-500 uppercase mb-3 transition-colors group-hover:text-white">{label}</p>
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[#00E8FF]/40 group-hover:text-[#00E8FF] transition-colors">{icon}</span>
        <p className="text-4xl font-black text-white uppercase tracking-tighter italic">{value}</p>
      </div>
      <div className="h-1 w-8 bg-[#00E8FF] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  </div>
);

const TxStepItem: React.FC<{ 
  step: number; 
  title: string; 
  description: string; 
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED'; 
  onAction?: () => void 
}> = ({ step, title, description, status, onAction }) => (
  <div className={`p-6 rounded-2xl border transition-all ${
    status === 'ACTIVE' ? 'bg-[#00E8FF]/10 border-[#00E8FF]/50' : 'bg-black border-white/5'
  }`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
          status === 'COMPLETED' ? 'bg-green-500 text-black' : status === 'ACTIVE' ? 'bg-[#00E8FF] text-black' : 'bg-[#1A1A1F] text-slate-600'
        }`}>
          {status === 'COMPLETED' ? '✓' : step}
        </div>
        <span className={`font-black tracking-widest text-sm uppercase ${status === 'PENDING' ? 'text-slate-700' : 'text-white'}`}>
          {title}
        </span>
      </div>
      {status === 'ACTIVE' && <Loader2 className="animate-spin text-[#00E8FF]" size={18} />}
    </div>
    <p className={`text-xs ${status === 'PENDING' ? 'text-slate-800' : 'text-slate-400'}`}>{description}</p>
    
    {status === 'ACTIVE' && onAction && (
      <button 
        onClick={onAction}
        className="mt-6 w-full py-4 bg-[#00E8FF] text-black text-xs font-black tracking-widest rounded-xl hover:brightness-110 transition-all uppercase shadow-[0_0_20px_rgba(0,232,255,0.3)]"
      >
        Confirm Transaction
      </button>
    )}
  </div>
);

export default App;
