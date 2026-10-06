import React, { useState } from 'react';
import {
  User,
  X,
  Building,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  FileText,
  DollarSign,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Customer } from '../../types/erp';
import { useErp } from '../../context/ErpContext';
import { formatCurrency, validateEmail } from '../../utils/formatters';
import { validatePhoneWithCountry } from '../../utils/phoneValidation';
import { validateContactData } from '../../utils/validation';
import { FormFieldError } from '../common/FormFieldError';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
  initialName?: string;
}

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
  initialName = '',
}) => {
  const { addCustomer, customers = [], suppliers = [], customerGroups = [], settings, showFlashNotification } = useErp();

  const [name, setName] = useState(initialName);
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [email, setEmail] = useState('');
  const [customerGroupId, setCustomerGroupId] = useState('');
  const [creditLimit, setCreditLimit] = useState('5000');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const schemaRes = validateContactData({
      name,
      contactType: 'customer',
      mobile: phone,
      countryCode,
      email: email.trim().toUpperCase() === 'N/A' ? undefined : email,
      taxNumber,
      openingBalance,
      creditLimit,
      city,
      addressLine1: address,
    });

    if (!schemaRes.isValid) {
      setFieldErrors(schemaRes.errors);
      showFlashNotification(schemaRes.firstError || 'Please correct errors before creating customer', 'error');
      return;
    }

    if (!phone.trim()) {
      setFieldErrors(prev => ({ ...prev, mobile: 'Phone number is required' }));
      showFlashNotification('Phone number is required', 'error');
      return;
    }

    if (phone.trim()) {
      const phoneVal = validatePhoneWithCountry(phone, countryCode);
      if (!phoneVal.isValid) {
        setFieldErrors(prev => ({ ...prev, mobile: phoneVal.error || 'Invalid phone number' }));
        showFlashNotification(`Phone Error: ${phoneVal.error}`, 'error');
        return;
      }
    }

    if (email.trim() && email.trim().toUpperCase() !== 'N/A') {
      if (!validateEmail(email)) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address with a proper domain (e.g. name@mail.com).' }));
        showFlashNotification('Please enter a valid email address with a proper domain (e.g. name@mail.com).', 'error');
        return;
      }
    }

    if (openingBalance !== undefined && openingBalance !== '') {
      const parsedOpening = parseFloat(openingBalance);
      if (isNaN(parsedOpening) || parsedOpening < 0) {
        setFieldErrors(prev => ({ ...prev, openingBalance: 'Opening balance cannot be negative. Must be 0 or greater.' }));
        showFlashNotification('Opening balance cannot be negative. Must be 0 or greater.', 'error');
        return;
      }
    }

    if (taxNumber.trim()) {
      const cleanTax = taxNumber.trim().toLowerCase();
      const dupCustomer = customers.find(c => c.taxNumber && c.taxNumber.trim().toLowerCase() === cleanTax);
      const dupSupplier = suppliers.find(s => s.taxNumber && s.taxNumber.trim().toLowerCase() === cleanTax);
      if (dupCustomer || dupSupplier) {
        const conflict = dupCustomer ? (dupCustomer.businessName || dupCustomer.name) : (dupSupplier!.businessName || dupSupplier!.name);
        const errMsg = `GST / TAX Number "${taxNumber.trim()}" is already registered to "${conflict}". Numbers must be unique.`;
        setFieldErrors(prev => ({ ...prev, taxNumber: errMsg }));
        showFlashNotification(errMsg, 'error');
        return;
      }
    }

    try {
      const selectedGroup = customerGroups.find((g) => g.id === customerGroupId);
      const newCustomer = addCustomer({
        name: name.trim(),
        businessName: businessName.trim() || undefined,
        phone: phone.trim() ? `${countryCode} ${phone.trim()}` : 'N/A',
        countryCode: countryCode || '+1',
        email: email.trim() && email.trim().toUpperCase() !== 'N/A' ? email.trim() : undefined,
        customerGroupId: customerGroupId || undefined,
        customerGroup: selectedGroup ? selectedGroup.name : 'Standard Retail',
        creditLimit: parseFloat(creditLimit) || 5000,
        openingBalance: parseFloat(openingBalance) || 0,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
      });

      showFlashNotification(`Customer "${newCustomer.name}" created and selected!`, 'success');
      onCustomerCreated(newCustomer);
      onClose();
    } catch (err: any) {
      showFlashNotification(err.message || 'Failed to create customer', 'error');
    }
  };

  return (
    <div
      id="quick-add-customer-modal-backdrop"
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="quick-add-customer-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Quick Add Customer</h3>
              <p className="text-xs text-slate-400">
                Register customer to proceed with immediate return and refund.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="quick-add-customer-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Full Name *
              </label>
              <input
                type="text"
                required
                id="quick-customer-name-input"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Eleanor Vance, Tech Corp"
                className={`w-full bg-slate-950 text-white px-4 py-3 rounded-xl border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-bold placeholder:text-slate-600 ${
                  fieldErrors.name ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-800'
                }`}
              />
              <FormFieldError error={fieldErrors.name} />
            </div>

            {/* Business / Company Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                Company / Business
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Industries Ltd."
                className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs placeholder:text-slate-600"
              />
            </div>

            {/* Mobile / Phone */}
            <PhoneInputWithCountry
              label="Mobile / Phone"
              id="quick-customer-phone-input"
              phoneValue={phone}
              countryCode={countryCode}
              onChangePhone={setPhone}
              onChangeCountryCode={setCountryCode}
              showHint={true}
              required={true}
            />

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. client@company.com"
                className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs placeholder:text-slate-600"
              />
            </div>

            {/* Customer Group */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Customer Tier
              </label>
              <select
                value={customerGroupId}
                onChange={(e) => setCustomerGroupId(e.target.value)}
                className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-medium"
              >
                <option value="">Standard Retail</option>
                {customerGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Credit Limit */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Credit Limit ({settings?.currencySymbol || '$'})
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full bg-slate-950 text-emerald-400 font-mono font-bold px-4 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>

            {/* Opening Balance */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Opening Due ({settings?.currencySymbol || '$'})
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={openingBalance}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full bg-slate-950 text-amber-400 font-mono font-bold px-4 py-3 rounded-xl border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs"
              />
            </div>

            {/* Address & City */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Billing / Street Address
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address..."
                  className="col-span-2 bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs placeholder:text-slate-600"
                />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City / Region"
                  className="bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="quick-add-customer-submit-btn"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save & Select Customer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
