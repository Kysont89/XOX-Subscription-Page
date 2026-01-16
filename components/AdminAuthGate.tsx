
import React from 'react';
import { Shield, Loader2, AlertTriangle, Lock } from 'lucide-react';

interface AdminAuthGateProps {
  isAdmin: boolean;
  isAdminVerified: boolean;
  isLoading: boolean;
  error: string | null;
  onVerify: () => Promise<boolean>;
  onGoBack: () => void;
  children: React.ReactNode;
}

const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  isAdmin,
  isAdminVerified,
  isLoading,
  error,
  onVerify,
  onGoBack,
  children
}) => {
  // Not an admin wallet
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <Shield size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
        <p className="text-[#929292] mb-6">
          You don't have permission to access this page. Please connect with an authorized admin wallet.
        </p>
        <button
          onClick={onGoBack}
          className="px-6 py-3 bg-[#0b71ff] text-white font-semibold text-sm rounded-lg hover:bg-[#0960d9] transition-all"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  // Admin but not verified - show verification prompt
  if (!isAdminVerified) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[#0b71ff]/10 flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-[#0b71ff]" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Admin Authentication Required</h2>
        <p className="text-[#929292] mb-6">
          To access the admin dashboard, please verify your identity by signing a message with your wallet.
          This is a security measure to prevent unauthorized access.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Authentication Failed</p>
                <p className="text-xs text-red-400/80 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={onVerify}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-[#0b71ff] text-white font-semibold text-sm rounded-lg hover:bg-[#0960d9] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Awaiting Signature...
              </>
            ) : (
              <>
                <Shield size={18} />
                Verify Admin Access
              </>
            )}
          </button>

          <button
            onClick={onGoBack}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-transparent border border-white/10 text-white font-semibold text-sm rounded-lg hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Security Info */}
        <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10 text-left">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Shield size={14} className="text-[#0b71ff]" />
            Security Notice
          </h4>
          <ul className="text-xs text-[#929292] space-y-1.5">
            <li>- Signing this message will NOT trigger any blockchain transaction</li>
            <li>- No gas fees will be charged</li>
            <li>- This signature proves you own this wallet</li>
            <li>- Admin sessions expire after 1 hour for security</li>
          </ul>
        </div>
      </div>
    );
  }

  // Verified admin - render children (the actual dashboard)
  return <>{children}</>;
};

export default AdminAuthGate;
