
import React, { useState } from 'react';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';

interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

interface UserDetailsFormProps {
  onSubmit: (details: UserDetails) => void;
  onCancel: () => void;
  price: number;
}

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ onSubmit, onCancel, price }) => {
  const [details, setDetails] = useState<UserDetails>({
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (details.name && details.email && details.phone) {
      onSubmit(details);
    }
  };

  return (
    <div className="relative w-full max-w-md bg-slate-950/90 border border-[#00E8FF]/20 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl">
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#00E8FF]/20 blur-[40px] rounded-full" />
      
      <div className="text-center mb-10 relative">
        <h3 className="text-xl font-black tracking-[0.1em] mb-2 uppercase text-white">SUBSCRIPTION DATA</h3>
        <p className="text-slate-500 text-xs tracking-tight">Your details will be linked to your Web3 identity.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputGroup 
          label="Display Name" 
          icon={<User size={16} />} 
          placeholder="e.g. Satoshi Nakamoto"
          value={details.name}
          onChange={(v) => setDetails({ ...details, name: v })}
        />
        
        <InputGroup 
          label="Primary Email" 
          icon={<Mail size={16} />} 
          type="email"
          placeholder="name@provider.com"
          value={details.email}
          onChange={(v) => setDetails({ ...details, email: v })}
        />

        <InputGroup 
          label="Phone / Telegram" 
          icon={<Phone size={16} />} 
          type="tel"
          placeholder="+1 --- --- ----"
          value={details.phone}
          onChange={(v) => setDetails({ ...details, phone: v })}
        />

        <div className="pt-6 space-y-4">
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#00E8FF] to-[#0066FF] text-slate-950 font-black text-xs tracking-[0.2em] rounded-lg transition-all shadow-[0_0_20px_rgba(0,232,255,0.3)] hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
          >
            INITIALIZE PAYMENT
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase hover:text-white transition-colors"
          >
            DISCARD REQUEST
          </button>
        </div>
      </form>

      <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#00E8FF] animate-pulse" />
           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Payable Amount</span>
        </div>
        <span className="text-xl font-mono font-bold text-white">{price.toLocaleString()} <span className="text-[#00E8FF]">USDT</span></span>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ 
  label: string; 
  icon: React.ReactNode; 
  placeholder: string; 
  value: string; 
  type?: string;
  onChange: (v: string) => void 
}> = ({ label, icon, placeholder, value, type = "text", onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00E8FF] transition-colors">
        {icon}
      </div>
      <input
        required
        type={type}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-white/5 rounded-lg py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00E8FF]/50 focus:bg-slate-800/50 transition-all placeholder:text-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

export default UserDetailsForm;
