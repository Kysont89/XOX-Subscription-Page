
import React, { useState, useCallback } from 'react';
import { User, Mail, Phone, ArrowRight, X, AlertCircle } from 'lucide-react';
import { validateName, validateEmail, validatePhone, sanitizeInput } from '../utils/security';

interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
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
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: keyof UserDetails, value: string): string | undefined => {
    switch (field) {
      case 'name': {
        const result = validateName(value);
        return result.valid ? undefined : result.error;
      }
      case 'email': {
        const result = validateEmail(value);
        return result.valid ? undefined : result.error;
      }
      case 'phone': {
        const result = validatePhone(value);
        return result.valid ? undefined : result.error;
      }
      default:
        return undefined;
    }
  }, []);

  const handleChange = useCallback((field: keyof UserDetails, value: string) => {
    // Sanitize input as user types
    const sanitized = sanitizeInput(value);
    setDetails(prev => ({ ...prev, [field]: sanitized }));

    // Validate if field was already touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((field: keyof UserDetails) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, details[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [details, validateField]);

  const validateAll = useCallback((): boolean => {
    const nameResult = validateName(details.name);
    const emailResult = validateEmail(details.email);
    const phoneResult = validatePhone(details.phone);

    const newErrors: ValidationErrors = {
      name: nameResult.valid ? undefined : nameResult.error,
      email: emailResult.valid ? undefined : emailResult.error,
      phone: phoneResult.valid ? undefined : phoneResult.error,
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true });

    return nameResult.valid && emailResult.valid && phoneResult.valid;
  }, [details]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    // Submit sanitized data
    onSubmit({
      name: sanitizeInput(details.name),
      email: sanitizeInput(details.email.toLowerCase()),
      phone: sanitizeInput(details.phone),
    });
  }, [details, validateAll, onSubmit]);

  return (
    <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-xl p-8 shadow-2xl">
      {/* Close Button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#929292] hover:text-white hover:border-white/20 transition-all"
        type="button"
        aria-label="Close form"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-white mb-2">Complete Your Subscription</h3>
        <p className="text-[#929292] text-sm">Enter your details to proceed with payment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <InputGroup
          label="Display Name"
          icon={<User size={16} />}
          placeholder="Enter your name"
          value={details.name}
          onChange={(v) => handleChange('name', v)}
          onBlur={() => handleBlur('name')}
          error={touched.name ? errors.name : undefined}
          maxLength={100}
          autoComplete="name"
        />

        <InputGroup
          label="Email Address"
          icon={<Mail size={16} />}
          type="email"
          placeholder="name@example.com"
          value={details.email}
          onChange={(v) => handleChange('email', v)}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : undefined}
          maxLength={254}
          autoComplete="email"
        />

        <InputGroup
          label="Phone / Telegram"
          icon={<Phone size={16} />}
          type="tel"
          placeholder="+1 234 567 8900 or @username"
          value={details.phone}
          onChange={(v) => handleChange('phone', v)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone ? errors.phone : undefined}
          maxLength={50}
          autoComplete="tel"
        />

        {/* Amount Display */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-[#929292]">Total Amount</span>
            <span className="text-xl font-bold text-white">
              {price.toLocaleString()} <span className="text-[#0b71ff]">USDT</span>
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#0b71ff] text-white font-semibold text-sm rounded-lg transition-all hover:bg-[#0960d9] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={Object.values(errors).some(e => e !== undefined)}
          >
            Continue to Payment
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <p className="text-center text-xs text-[#929292]/60 mt-4">
        Your information is securely encrypted and protected
      </p>
    </div>
  );
};

interface InputGroupProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  maxLength?: number;
  autoComplete?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  icon,
  placeholder,
  value,
  type = 'text',
  onChange,
  onBlur,
  error,
  maxLength,
  autoComplete
}) => (
  <div>
    <label className="block text-xs text-[#929292] uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]">
        {icon}
      </div>
      <input
        required
        type={type}
        placeholder={placeholder}
        className={`w-full bg-[#030303] border rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder:text-[#929292]/50 focus:outline-none transition-colors ${
          error
            ? 'border-red-500/50 focus:border-red-500'
            : 'border-white/10 focus:border-[#0b71ff]/50'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
    </div>
    {error && (
      <div
        id={`${label}-error`}
        className="flex items-center gap-1.5 mt-2 text-xs text-red-400"
        role="alert"
      >
        <AlertCircle size={12} />
        <span>{error}</span>
      </div>
    )}
  </div>
);

export default UserDetailsForm;
