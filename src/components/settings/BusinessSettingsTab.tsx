import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { validatePhoneWithCountry } from '../../utils/phoneValidation';
import { validateEmail } from '../../utils/formatters';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';
import { optimizeImage } from '../../lib/imageOptimization';
import { PrintersConfigTab } from './PrintersConfigTab';
import { RoyalLogo } from '../common/RoyalLogo';
import {
  BusinessSettings,
  StockAccountingMethod,
  SalesItemAdditionMethod,
  AmountRoundingMethod,
  ProductExpiryAction,
  PaymentTermsPreset,
  TaxCalculationMode,
  TaxSystemType,
  SalesCommissionAgentType,
  CommissionCalculationType,
} from '../../types/erp';
import {
  Building2,
  Percent,
  Package,
  Users,
  ShoppingCart,
  CreditCard,
  Truck,
  Wallet,
  Sliders,
  Sun,
  Moon,
  Hash,
  Mail,
  Gift,
  Boxes,
  Tag,
  Check,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  Info,
  ExternalLink,
  Shield,
  AlertCircle,
  HelpCircle,
  Clock,
  Globe,
  Sparkles,
  Terminal,
  FileText,
  DollarSign,
  Layers,
  Smartphone,
  ChevronRight,
  Download,
  Plus,
  RefreshCw,
  ArrowUpRight,
  X,
  Trash2,
  Upload,
  Image,
  Database,
} from 'lucide-react';
import { DatabaseSetupTab } from './DatabaseSetupTab';

type SettingsSectionId =
  | 'business'
  | 'database'
  | 'tax'
  | 'product'
  | 'contact'
  | 'sale'
  | 'pos'
  | 'purchases'
  | 'payment'
  | 'app_updates'
  | 'system' | 'system_security' | 'printers'
  | 'prefixes' | 'printers'
  | 'reward_points'
  | 'modules'
  | 'custom_labels';

interface SectionMeta {
  id: SettingsSectionId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const SECTIONS: SectionMeta[] = [
  {
    id: 'business',
    label: 'Business Settings',
    shortLabel: 'Business',
    icon: Building2,
    description: 'Core company profile, HQ contact details, trading entity, start date, default profit margin, currency, financial year & timezone.',
  },
  {
    id: 'product',
    label: 'Product Settings',
    shortLabel: 'Product',
    icon: Package,
    description: 'SKU prefixes, expiry stop days, brand/category toggles, default units, racks, and warranties.',
  },
  {
    id: 'contact',
    label: 'Contact Settings',
    shortLabel: 'Contact',
    icon: Users,
    description: 'Default credit limit, customer/supplier ID prefixes, and auto-generation rules.',
  },
  {
    id: 'sale',
    label: 'Sales Settings',
    shortLabel: 'Sales',
    icon: ShoppingCart,
    description: 'Default discount, cart item addition methods, rounding rules, minimum selling price, and overselling.',
  },
  {
    id: 'pos',
    label: 'POS Settings',
    shortLabel: 'POS',
    icon: CreditCard,
    description: 'Keyboard shortcuts, cash tender denominations, checkout button toggles, and customer display screen.',
  },
  {
    id: 'purchases',
    label: 'Purchase Settings',
    shortLabel: 'Purchases',
    icon: Truck,
    description: 'Purchase status tracking, lot numbers, purchase orders, requisitions, and price editing.',
  },
  {
    id: 'payment',
    label: 'Payment & Accounts',
    shortLabel: 'Payment',
    icon: Wallet,
    description: 'Cash register controls, strict shift lockouts, and default double-entry chart accounts.',
  },
  {
    id: 'system',
    label: 'Themes',
    shortLabel: 'Themes',
    icon: Sliders,
    description: 'Theme accent palette, system localization, auto-sync intervals, and backup reminders.',
  },
  {
    id: 'system_security',
    label: 'System Security Shield',
    shortLabel: 'System Security Shield',
    icon: Shield,
    description: 'Ransomware & Anti-Hacking Protection (Helmet, Rate Limiting, HPP, CORS anti-injection shield).',
  },
  {
    id: 'prefixes',
    label: 'Document Prefix',
    shortLabel: 'Document Prefix',
    icon: Hash,
    description: 'Custom numbering prefixes for Invoices, POs, Transfers, Adjustments, and Contacts.',
  },
  {
    id: 'reward_points',
    label: 'Reward Settings',
    shortLabel: 'Reward Settings',
    icon: Gift,
    description: 'Customer loyalty point earning rates, point values, redemption limits, and expiration rules.',
  },
  {
    id: 'modules',
    label: 'Modules Manager',
    shortLabel: 'Modules',
    icon: Boxes,
    description: 'Enable or disable optional business subsystems like Manufacturing, Barcode Studio, or Subscriptions.',
  },
  {
    id: 'custom_labels',
    label: 'Custom Field Labels',
    shortLabel: 'Custom Labels',
    icon: Tag,
    description: 'Define up to 20 custom metadata fields for Products, Contacts, Purchases, Sales, and Locations.',
  },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const BusinessSettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    currencies,
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    businessSettingsSection,
    setBusinessSettingsSection,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Local draft state initialized with current business settings
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [businessPhoneCountryCode, setBusinessPhoneCountryCode] = useState('+1');

  // Keep formData in sync if settings update externally
  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...settings }));
  }, [settings]);

  const activeSection = (businessSettingsSection as SettingsSectionId) || 'business';
  const setActiveSection = (section: SettingsSectionId) => {
    if (setBusinessSettingsSection) {
      setBusinessSettingsSection(section);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Custom Accounts States
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [targetAccountId, setTargetAccountId] = useState('');
  const [accountForm, setAccountForm] = useState({
    name: '',
    accountNumber: '',
    type: 'Cash' as 'Cash' | 'Bank' | 'Card' | 'Wallet',
    balance: 0,
    bankName: '',
  });

  const openAddAccount = () => {
    setAccountForm({
      name: '',
      accountNumber: `ACC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Cash',
      balance: 0,
      bankName: '',
    });
    setIsEditingAccount(false);
    setShowAddAccountModal(true);
  };

  const openEditAccount = (acc: any) => {
    setAccountForm({
      name: acc.name,
      accountNumber: acc.accountNumber,
      type: acc.type,
      balance: acc.balance,
      bankName: acc.bankName || '',
    });
    setTargetAccountId(acc.id);
    setIsEditingAccount(true);
    setShowAddAccountModal(true);
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;

    if (isEditingAccount) {
      updateAccount(targetAccountId, accountForm);
    } else {
      addAccount(accountForm);
    }
    setShowAddAccountModal(false);
  };

  // Helper to update specific root fields
  const handleFieldChange = <K extends keyof BusinessSettings>(field: K, value: BusinessSettings[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name') {
        next.businessName = value;
        updateSettings({ [field]: value, businessName: value });
      } else if (field === 'businessName') {
        next.name = value;
        updateSettings({ [field]: value, name: value });
      } else if (field === 'companyName' || field === 'taxLabel1' || (field as any) === 'tax1Name') {
        next.companyName = value;
        next.legalName = value;
        (next as any).tax1Name = value;
        updateSettings({ companyName: value, legalName: value, tax1Name: value });
      } else if (field === 'taxNumber' || field === 'gstin' || (field as any) === 'tax1No') {
        next.taxNumber = value;
        next.gstin = value;
        (next as any).tax1No = value;
        updateSettings({ taxNumber: value, gstin: value, tax1No: value });
      } else {
        updateSettings({ [field]: value });
      }
      return next;
    });
  };

  // Helper for nested objects like prefixes
  const handlePrefixChange = (key: string, value: string) => {
    setFormData((prev) => {
      const nextPrefixes = {
        ...prev.prefixes,
        [key]: value,
      };
      updateSettings({ prefixes: nextPrefixes });
      return {
        ...prev,
        prefixes: nextPrefixes,
      };
    });
  };

  // Helper for email settings
  const handleEmailChange = (key: string, value: any) => {
    setFormData((prev) => {
      const nextEmailSettings = {
        ...prev.emailSettings,
        [key]: value,
      };
      updateSettings({ emailSettings: nextEmailSettings });
      return {
        ...prev,
        emailSettings: nextEmailSettings,
      };
    });
  };

  // Helper for SMS settings
  const handleSmsChange = (key: string, value: any) => {
    setFormData((prev) => {
      const nextSmsSettings = {
        ...prev.smsSettings,
        [key]: value,
      };
      updateSettings({ smsSettings: nextSmsSettings });
      return {
        ...prev,
        smsSettings: nextSmsSettings,
      };
    });
  };

  // Helper for Reward points settings
  const handleRewardChange = (key: string, value: any) => {
    setFormData((prev) => {
      const nextReward = {
        ...prev.rewardPointsSettings,
        [key]: value,
      };
      updateSettings({ rewardPointsSettings: nextReward });
      return {
        ...prev,
        rewardPointsSettings: nextReward,
      };
    });
  };

  // Helper for Module toggles
  const handleModuleToggle = (key: string, value: boolean) => {
    setFormData((prev) => {
      const nextModules = {
        ...prev.enabledModules,
        [key]: value,
      };
      updateSettings({ enabledModules: nextModules });
      return {
        ...prev,
        enabledModules: nextModules,
      };
    });
  };

  // Helper for Custom Labels
  const handleCustomLabelChange = (
    entity: 'product' | 'contact' | 'purchase' | 'sell' | 'location',
    fieldKey: string,
    label: string,
    type: 'text' | 'number' | 'date' | 'dropdown' = 'text'
  ) => {
    setFormData((prev) => {
      const currentEntityLabels = prev.customLabels?.[entity] || {};
      const nextCustomLabels = {
        ...prev.customLabels,
        [entity]: {
          ...currentEntityLabels,
          [fieldKey]: {
            ...currentEntityLabels[fieldKey],
            label,
            type,
          },
        },
      };
      updateSettings({ customLabels: nextCustomLabels });
      return {
        ...prev,
        customLabels: nextCustomLabels,
      };
    });
  };

  // Helper for POS shortcuts
  const handleShortcutChange = (key: string, value: string) => {
    setFormData((prev) => {
      const nextShortcuts = {
        ...prev.posKeyboardShortcuts,
        [key]: value,
      };
      updateSettings({ posKeyboardShortcuts: nextShortcuts });
      return {
        ...prev,
        posKeyboardShortcuts: nextShortcuts,
      };
    });
  };

  // Manual version upgrade handler
  const handleTriggerVersionUpdate = (type: 'patch' | 'minor' | 'major') => {
    const currentVer = formData.appVersion || 'v2.5.0';
    const cleanVer = currentVer.replace(/^v/, '');
    const parts = cleanVer.split('.').map((p) => parseInt(p, 10) || 0);
    let [major, minor, patch] = parts.length === 3 ? parts : [2, 5, 0];

    if (type === 'major') {
      major += 1;
      minor = 0;
      patch = 0;
    } else if (type === 'minor') {
      minor += 1;
      patch = 0;
    } else {
      patch += 1;
    }

    const nextVer = `v${major}.${minor}.${patch}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nextBuild = `${nowStr.slice(0, 10)}-BUILD`;

    const typeDesc =
      type === 'major'
        ? 'Major Architectural System Upgrade'
        : type === 'minor'
        ? 'Feature Pack Release & Subsystem Update'
        : 'System Configuration & Security Patch';

    const newLog = {
      version: nextVer,
      releaseDate: nowStr,
      updatedBy: 'Admin (Settings HQ)',
      type,
      description: `Applied ${typeDesc}. System parameters, modules, and footer settings synchronized.`,
    };

    const existingNotes = formData.appReleaseNotes || [];
    const updatedNotes = [newLog, ...existingNotes];

    const updatedForm = {
      ...formData,
      appVersion: nextVer,
      buildNumber: nextBuild,
      lastUpdatedDate: nowStr,
      appReleaseNotes: updatedNotes,
    };

    setFormData(updatedForm);
    updateSettings(updatedForm);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  // Save handler
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.phone || !formData.phone.trim()) {
      alert('Business Phone Number is required.');
      return;
    }

    if (formData.phone) {
      const phoneVal = validatePhoneWithCountry(formData.phone, businessPhoneCountryCode);
      if (!phoneVal.isValid) {
        alert(`Business Phone Number Error: ${phoneVal.error}`);
        return;
      }
    }

    if (formData.email && formData.email.trim() && formData.email.trim().toUpperCase() !== 'N/A') {
      if (!validateEmail(formData.email)) {
        alert('Please enter a valid Official Email address with a proper domain suffix (e.g. name@mail.com).');
        return;
      }
    }

    let finalForm = { ...formData };
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // If auto-increment is enabled and settings saved
    if (formData.autoIncrementVersionOnUpdate !== false) {
      const currentVer = formData.appVersion || 'v2.5.4';
      const cleanVer = currentVer.replace(/^v/, '');
      const parts = cleanVer.split('.').map((p) => parseInt(p, 10) || 0);
      let [major, minor, patch] = parts.length === 3 ? parts : [2, 5, 4];
      patch += 1;

      const nextVer = `v${major}.${minor}.${patch}`;
      const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
      const nextBuild = `${dateTag}-BUILD`;

      const newLog = {
        version: nextVer,
        releaseDate: nowStr,
        updatedBy: 'Admin (Settings Change)',
        type: 'config',
        description: 'System configuration parameters saved and updated.',
      };

      const existingNotes = formData.appReleaseNotes || [];

      finalForm = {
        ...formData,
        appVersion: nextVer,
        buildNumber: nextBuild,
        lastUpdatedDate: nowStr,
        appReleaseNotes: [newLog, ...existingNotes],
      };
    } else {
      const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
      finalForm = {
        ...formData,
        buildNumber: formData.buildNumber && formData.buildNumber !== '2026-09-14-RELEASE' ? formData.buildNumber : `${dateTag}-BUILD`,
        lastUpdatedDate: nowStr,
      };
    }

    finalForm.businessName = finalForm.name?.trim() || finalForm.businessName?.trim() || '';
    finalForm.name = finalForm.name?.trim() || finalForm.businessName?.trim() || '';

    setFormData(finalForm);
    updateSettings(finalForm);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
    }, 3500);
  };

  // Reset handler
  const handleReset = () => {
    setFormData({ ...settings });
    setResetConfirm(false);
  };

  // Export JSON configuration
  const handleExportConfig = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finias_pos_business_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter sections by search query
  const filteredSections = SECTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shortLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="space-y-6">
      {/* Save Success Alert Banner */}
      {saveToast && (
        <div className={`${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100/30' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-emerald-950/40'} border px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-fadeIn`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className={`text-sm font-bold ${isLight ? 'text-emerald-900' : 'text-white'}`}>Business Settings Updated Successfully!</p>
              <p className={`text-xs ${isLight ? 'text-emerald-700' : 'text-emerald-300/80'}`}>
                All changes have been synchronized across the POS, Inventory, Sales, and Accounting engines.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSaveToast(false)}
            className={`text-xs ${isLight ? 'text-emerald-800 hover:text-emerald-900 bg-emerald-100/60' : 'text-emerald-400 hover:text-white bg-emerald-950/60'} px-2 py-1 rounded-lg`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Controls: Search Bar & Global Action Toolbar */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900/90 border-slate-800'} border p-4 sm:p-5 rounded-3xl shadow-xl`}>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 15 business settings sections..."
            className={`w-full pl-10 pr-4 py-2.5 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'} border rounded-2xl text-xs focus:outline-none focus:border-indigo-500 transition`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExportConfig}
            className={`px-3.5 py-2.5 ${isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-indigo-100/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'} border rounded-xl text-xs font-bold flex items-center gap-1.5 transition`}
            title="Download JSON configuration backup"
          >
            <Download className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-500' : 'text-slate-400'}`} />
            <span>Export Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className={`px-3.5 py-2.5 ${isLight ? 'bg-indigo-50 hover:bg-rose-50 text-rose-700 hover:text-rose-800 border-rose-200 shadow-rose-100/10' : 'bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-slate-700'} border rounded-xl text-xs font-bold flex items-center gap-1.5 transition`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLight ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>Discard Changes</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Discard Unsaved Changes?</span>
            </h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to revert all draft inputs back to the last saved configuration?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Section Form Panel - Full Width */}
      <div className={`w-full max-w-full min-w-0 ${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-100/30 theme-light-hq' : 'bg-slate-900/90 border-slate-800 text-white'} border rounded-3xl p-3.5 sm:p-6 shadow-xl space-y-6 overflow-x-hidden`}>
          {/* Section Header */}
          <div className={`flex items-start justify-between gap-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'} pb-5`}>
            <div className="flex items-center gap-3.5">
              <div className={`p-3 ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'} border rounded-2xl`}>
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'} tracking-tight flex items-center gap-2`}>
                  <span>{currentMeta.label}</span>
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>{currentMeta.description}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6 pb-20">
            {/* ========================================================================= */}
            {/* 1. BUSINESS DETAILS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'business' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Business Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      required
                      placeholder="e.g. Royal POS & Enterprise ERP"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Displayed on your main Dashboard title, invoices, receipts, and system reports.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate || '2025-01-01'}
                      onChange={(e) => handleFieldChange('startDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Default Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.defaultProfitPercent ?? 25}
                      onChange={(e) => handleFieldChange('defaultProfitPercent', parseFloat(e.target.value) || 0)}
                      placeholder="25.0"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Auto-calculates selling price based on purchase cost if not manually specified.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Currency
                    </label>
                    <select
                      value={formData.currencyCode || formData.currency || 'USD'}
                      onChange={(e) => {
                        const code = e.target.value;
                        const match = currencies.find((c) => c.code === code);
                        setFormData((prev) => ({
                          ...prev,
                          currency: code,
                          currencyCode: code,
                          currencySymbol: match ? match.symbol : '$',
                          currencyId: match?.id,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.name} ({c.symbol} - {c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Currency Symbol Placement
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                        <input
                          type="radio"
                          name="currencyPlacement"
                          checked={formData.currencyPlacement !== 'suffix'}
                          onChange={() => handleFieldChange('currencyPlacement', 'prefix')}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-slate-300">Before Amount ($100)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                        <input
                          type="radio"
                          name="currencyPlacement"
                          checked={formData.currencyPlacement === 'suffix'}
                          onChange={() => handleFieldChange('currencyPlacement', 'suffix')}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-slate-300">After Amount (100 $)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone || 'America/Chicago'}
                      onChange={(e) => handleFieldChange('timezone', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Financial Year Start Month
                    </label>
                    <select
                      value={formData.financialYearStartMonth || 4}
                      onChange={(e) => handleFieldChange('financialYearStartMonth', parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label} {m.value === 4 ? '(Default: April to March)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Defines the accounting period start. Defaults to April to March.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Stock Accounting Method
                    </label>
                    <select
                      value={formData.accountingMethod || 'fifo'}
                      onChange={(e) => handleFieldChange('accountingMethod', e.target.value as StockAccountingMethod)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="fifo">FIFO (First In, First Out) - Oldest Layer First</option>
                      <option value="lifo">LIFO (Last In, First Out) - Newest Layer First</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Determines which cost layer/lot is deducted first during stock depletion.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Transaction Edit Days Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.transactionEditDays ?? 30}
                      onChange={(e) => handleFieldChange('transactionEditDays', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Number of days up to which transactions can be edited after creation. (0 = no limit)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Date Format
                    </label>
                    <select
                      value={formData.dateFormat || 'DD-MM-YYYY'}
                      onChange={(e) => handleFieldChange('dateFormat', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 25-08-2026)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/08/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/25/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-25)</option>
                      <option value="DD MMM YYYY">DD MMM YYYY (e.g. 25 Aug 2026)</option>
                      <option value="MMM DD, YYYY">MMM DD, YYYY (e.g. Aug 25, 2026)</option>
                    </select>
                  </div>
                </div>

                {/* HQ System Settings Live Preview */}
                <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Live System Formatting Preview
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Currency Sample:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formData.currencyPlacement === 'suffix'
                          ? `1,250.00 ${formData.currencySymbol || '$'}`
                          : `${formData.currencySymbol || '$'}1,250.00`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Date & Time:</span>
                      <span className="font-mono font-medium text-slate-200">
                        {formData.dateFormat === 'MM/DD/YYYY'
                          ? '08/25/2026'
                          : formData.dateFormat === 'YYYY-MM-DD'
                          ? '2026-08-25'
                          : formData.dateFormat === 'DD/MM/YYYY'
                          ? '25/08/2026'
                          : formData.dateFormat === 'DD MMM YYYY'
                          ? '25 Aug 2026'
                          : formData.dateFormat === 'MMM DD, YYYY'
                          ? 'Aug 25, 2026'
                          : '25-08-2026'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Profit Margin:</span>
                      <span className="font-mono font-bold text-indigo-300">
                        {formData.defaultProfitPercent ?? 25}% (Cost $100 &rarr; Sell ${((100 * (1 + (formData.defaultProfitPercent ?? 25) / 100))).toFixed(2)})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Stock Accounting:</span>
                      <span className="font-mono font-bold text-amber-400 uppercase">
                        {formData.accountingMethod || 'fifo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Address Section */}
                <div className="border-t border-slate-800 pt-5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    Contact & Registered Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PhoneInputWithCountry
                      label="Phone Number"
                      id="business-settings-phone"
                      phoneValue={formData.phone || ''}
                      countryCode={businessPhoneCountryCode}
                      onChangePhone={(val) => handleFieldChange('phone', val)}
                      onChangeCountryCode={setBusinessPhoneCountryCode}
                      showHint={true}
                      required={true}
                    />
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Official Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="admin@royalpos.com"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Website</label>
                      <input
                        type="text"
                        value={formData.website || ''}
                        onChange={(e) => handleFieldChange('website', e.target.value)}
                        placeholder="https://royalpos.com"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Address</label>
                    <textarea
                      rows={2}
                      value={formData.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="742 Evergreen Terrace, Suite 400, Austin, TX 78701"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* DATABASE SETUP & HEALTH TAB */}
            {/* ========================================================================= */}
            {activeSection === 'database' && (
              <DatabaseSetupTab />
            )}

            {/* ========================================================================= */}
            {/* 2. TAX SETTINGS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'tax' && (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Enable Master Tax Engine</p>
                    <p className="text-[11px] text-slate-400">
                      When enabled, taxes are automatically computed on POS carts, sale invoices, and purchase entries.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableTax}
                    onChange={(e) => handleFieldChange('enableTax', e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName || formData.tax1Name || formData.businessName || formData.name || ''}
                      onChange={(e) => {
                        handleFieldChange('companyName', e.target.value);
                        handleFieldChange('tax1Name', e.target.value);
                      }}
                      placeholder="e.g. Acme Enterprise Pvt Ltd"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-950/40 border border-amber-800/60 text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>Company Name should be as per provided in GST or Tax</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      GSTIN or Tax Number
                    </label>
                    <input
                      type="text"
                      value={formData.taxNumber || formData.gstin || (formData as any).tax1No || ''}
                      onChange={(e) => {
                        handleFieldChange('taxNumber', e.target.value.toUpperCase());
                        handleFieldChange('gstin', e.target.value.toUpperCase());
                        handleFieldChange('tax1No', e.target.value.toUpperCase());
                      }}
                      placeholder="e.g. 27AABCR1234F1Z5 or US-TX-9948201"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Automatically taken into consideration in tax configuration, invoicing, and POS.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Tax Calculation Mode
                    </label>
                    <select
                      value={formData.taxCalculationType || 'exclusive'}
                      onChange={(e) => handleFieldChange('taxCalculationType', e.target.value as TaxCalculationMode)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="exclusive">Exclusive (Tax added on top of selling price)</option>
                      <option value="inclusive">Inclusive (Tax already included inside selling price)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Tax Jurisdiction Standard
                    </label>
                    <select
                      value={formData.taxSystem || 'gst_india'}
                      onChange={(e) => handleFieldChange('taxSystem', e.target.value as TaxSystemType)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="gst_india">India GST (CGST + SGST / IGST Dual-Tier)</option>
                      <option value="vat">Value Added Tax (VAT - UK / EU / UAE)</option>
                      <option value="sales_tax">USA Single Sales Tax Rate</option>
                      <option value="custom">Custom Multi-Rate Tax</option>
                      <option value="disabled">Tax Exempt / Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <label className={`flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl transition ${
                    !formData.enableTax || formData.taxSystem === 'disabled' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!formData.enableTax || formData.taxSystem === 'disabled'}
                      checked={formData.enableTax && formData.taxSystem !== 'disabled' ? (formData.enableInlineTax ?? true) : false}
                      onChange={(e) => handleFieldChange('enableInlineTax', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">Enable Inline Tax in Purchase and Sell</span>
                      <p className="text-[11px] text-slate-400">
                        Shows per-item tax rate breakdown on order line items instead of only a single lump-sum tax. Automatically disabled when Master Tax Engine is turned off.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.enableHsnCode ?? true}
                      onChange={(e) => handleFieldChange('enableHsnCode', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">Enable HSN / SAC Code Tracking</span>
                      <p className="text-[11px] text-slate-400">
                        Enables Harmonized System of Nomenclature (HSN) and Service Accounting Code (SAC) fields for tax audits.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. PRODUCT SETTINGS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'product' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Product SKU Prefix
                    </label>
                    <input
                      type="text"
                      value={formData.productSkuPrefix || 'PROD-'}
                      onChange={(e) => handleFieldChange('productSkuPrefix', e.target.value)}
                      placeholder="e.g. PROD-"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Auto-prepended to auto-generated SKU identifiers when adding products.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Default Unit
                    </label>
                    <select
                      value={formData.defaultUnit || 'Pcs'}
                      onChange={(e) => handleFieldChange('defaultUnit', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Pcs">Pieces (Pcs)</option>
                      <option value="Kg">Kilograms (Kg)</option>
                      <option value="Ltr">Liters (Ltr)</option>
                      <option value="Box">Box / Pack</option>
                      <option value="Mtr">Meters (Mtr)</option>
                      <option value="Gram">Grams (g)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      On Product Expiry Action
                    </label>
                    <select
                      value={formData.onProductExpiry || 'keep_selling'}
                      onChange={(e) => handleFieldChange('onProductExpiry', e.target.value as ProductExpiryAction)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="keep_selling">Keep Selling (Show warning badge only)</option>
                      <option value="stop_selling_x_days_before">Stop Selling X days before expiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Expiry Stop / Alert Days
                    </label>
                    <input
                      type="number"
                      value={formData.expiryStopDays ?? 7}
                      onChange={(e) => handleFieldChange('expiryStopDays', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Days before expiry date to trigger stock alerts or prevent POS checkout.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    Product Form Fields & Attributes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'enableBrand', label: 'Enable Brand Field', desc: 'Allows organizing products under brands' },
                      { key: 'enableCategory', label: 'Enable Category Field', desc: 'Classify inventory by main category' },
                      { key: 'enableSubCategory', label: 'Enable Sub-Category Field', desc: 'Granular secondary categorization' },
                      { key: 'enablePriceAndTaxInfo', label: 'Enable Price & Tax Info', desc: 'Show tax rate and margin selectors on product creation' },
                      { key: 'enableRacks', label: 'Enable Warehouse Rack No', desc: 'Track physical warehouse rack location' },
                      { key: 'enableRows', label: 'Enable Warehouse Row No', desc: 'Track physical warehouse row aisle' },
                      { key: 'enablePositions', label: 'Enable Warehouse Position', desc: 'Track bin/shelf position' },
                      { key: 'enableWarranty', label: 'Enable Warranty Tracking', desc: 'Track manufacturer and store warranty periods' },
                    ].map((item) => {
                      const isChecked = Boolean((formData as any)[item.key]);
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleFieldChange(item.key as keyof BusinessSettings, !isChecked as any)}
                          className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                        >
                          <div className="space-y-0.5 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                isChecked
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {isChecked ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{item.desc}</p>
                          </div>
                          <div className="shrink-0">
                            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative p-0.5 ${
                              isChecked ? 'bg-indigo-600' : 'bg-slate-800'
                            }`}>
                              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 transform flex items-center justify-center ${
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              }`}>
                                {isChecked ? (
                                  <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. CONTACT SETTINGS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Default Customer Credit Limit ($)
                    </label>
                    <input
                      type="number"
                      value={formData.defaultCreditLimit ?? 5000}
                      onChange={(e) => handleFieldChange('defaultCreditLimit', parseFloat(e.target.value) || 0)}
                      placeholder="5000"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Default maximum outstanding credit balance allowed for newly registered B2B clients.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Customer ID Prefix
                    </label>
                    <input
                      type="text"
                      value={formData.customerPrefix || 'CUST-'}
                      onChange={(e) => handleFieldChange('customerPrefix', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Supplier ID Prefix
                    </label>
                    <input
                      type="text"
                      value={formData.supplierPrefix || 'SUP-'}
                      onChange={(e) => handleFieldChange('supplierPrefix', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl w-full cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.autoGenerateContactId ?? true}
                        onChange={(e) => handleFieldChange('autoGenerateContactId', e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <div>
                        <span className="text-xs font-bold text-white">Auto-generate Contact ID</span>
                        <p className="text-[11px] text-slate-400">
                          Automatically assign incremental IDs (e.g. CUST-001) if left blank.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. SALE SETTINGS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'sale' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Default Sale Discount (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.defaultSaleDiscount ?? 0}
                      onChange={(e) => handleFieldChange('defaultSaleDiscount', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Sales Item Addition Method
                    </label>
                    <select
                      value={formData.salesItemAdditionMethod || 'add_to_existing_qty'}
                      onChange={(e) => handleFieldChange('salesItemAdditionMethod', e.target.value as SalesItemAdditionMethod)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="add_to_existing_qty">Increase quantity if item already exists in cart</option>
                      <option value="add_new_row">Always add item in a new row</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Amount Rounding Method
                    </label>
                    <select
                      value={formData.amountRoundingMethod || 'round_to_nearest_integer'}
                      onChange={(e) => handleFieldChange('amountRoundingMethod', e.target.value as AmountRoundingMethod)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="round_to_nearest_integer">Round to nearest integer (e.g. $10.40 → $10, $10.60 → $11)</option>
                      <option value="round_0_05">Round to nearest 0.05 (e.g. 5 cents nickel rounding)</option>
                      <option value="round_0_10">Round to nearest 0.10 (e.g. 10 cents dime rounding)</option>
                      <option value="round_0_50">Round to nearest 0.50 (half-dollar rounding)</option>
                      <option value="none">No Rounding (Exact 2 decimals)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Default Payment Terms
                    </label>
                    <select
                      value={formData.defaultPaymentTerms || 'due_on_receipt'}
                      onChange={(e) => handleFieldChange('defaultPaymentTerms', e.target.value as PaymentTermsPreset)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="due_on_receipt">Due on Receipt (Immediate)</option>
                      <option value="net_15">Net 15 Days</option>
                      <option value="net_30">Net 30 Days</option>
                      <option value="net_60">Net 60 Days</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sales Commission Agent & Calculations</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        (formData.salesCommissionAgent || 'disable') === 'disable'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                      }`}>
                        {(formData.salesCommissionAgent || 'disable') === 'disable' ? 'Disabled' : 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Sales Commission Agent
                        </label>
                        <select
                          value={formData.salesCommissionAgent || 'disable'}
                          onChange={(e) => handleFieldChange('salesCommissionAgent', e.target.value as SalesCommissionAgentType)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="disable">Disable</option>
                          <option value="logged_in_user">Logged in User</option>
                          <option value="user">Select from User’s List</option>
                          <option value="commission_agent">Select from Commission Agent List</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                          {(formData.salesCommissionAgent || 'disable') === 'disable' && (
                            'Commission agent feature is disabled. No sales representative selection is required in Add Sale or POS.'
                          )}
                          {formData.salesCommissionAgent === 'logged_in_user' && (
                            'The logged in user will be automatically considered as the commission agent for sales added by him. Meaning the user adding the sales will get the commission.'
                          )}
                          {formData.salesCommissionAgent === 'user' && (
                            'In POS & Sales screens, you will see the list of business users. The user adding the sales will select the commission agent from the users list.'
                          )}
                          {formData.salesCommissionAgent === 'commission_agent' && (
                            'In POS & Sales screens, you will see the list of dedicated Sales Commission Agents. The user adding the sales will select the commission agent from this list.'
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Commission Calculation Type
                        </label>
                        <select
                          value={formData.commissionCalculationType || (formData.commissionAgentMethod === 'payment' ? 'payment_received' : 'invoice_value')}
                          onChange={(e) => {
                            const val = e.target.value as CommissionCalculationType;
                            handleFieldChange('commissionCalculationType', val);
                            handleFieldChange('commissionAgentMethod', val === 'payment_received' ? 'payment' : 'invoice');
                          }}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="invoice_value">Invoice value</option>
                          <option value="payment_received">Payment Received</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                          {(formData.commissionCalculationType || (formData.commissionAgentMethod === 'payment' ? 'payment_received' : 'invoice_value')) === 'invoice_value' && (
                            'Commissions are calculated based on the total invoice amount generated by the user (e.g. $5,000 invoice with 10% commission = $500 commission).'
                          )}
                          {(formData.commissionCalculationType || (formData.commissionAgentMethod === 'payment' ? 'payment_received' : 'invoice_value')) === 'payment_received' && (
                            'Commissions are calculated on actual payments received from customers (e.g. $5,000 invoice with 10% commission and $2,000 paid = $200 commission now, remainder paid when collected).'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Method Information Box */}
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] space-y-2">
                      <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Commission Rules & Examples:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                          <span className="font-bold text-slate-200 block mb-1">1. Invoice value:</span>
                          Calculated directly on total invoice gross amount. For example, if a user's total invoice value is $5,000 and their commission rate is 10%, they will receive $500 as commission.
                        </div>
                        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                          <span className="font-bold text-slate-200 block mb-1">2. Payment Received:</span>
                          Calculated based on actual payments received. If an invoice is $5,000 with 10% commission but only $2,000 is received initially, user receives $200. When the remaining $3,000 is received later, the user receives $300.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  {[
                    {
                      key: 'salesPriceIsMinPrice',
                      label: 'Sales Price is Minimum Selling Price',
                      desc: 'Prevents cashiers and sales agents from applying discounts that lower item price below minimum floor price.',
                      defaultValue: true,
                    },
                    {
                      key: 'allowOverselling',
                      label: 'Allow Overselling of Products',
                      desc: 'Allow products to be sold even when stock count reaches 0 or negative.',
                      defaultValue: false,
                    },
                    {
                      key: 'enableSalesOrder',
                      label: 'Enable Sales Order Workflow',
                      desc: 'Allows creating advance sales orders / quotations before converting to final tax invoice.',
                      defaultValue: true,
                    },
                  ].map((item) => {
                    const isChecked = Boolean((formData as any)[item.key] ?? item.defaultValue);
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleFieldChange(item.key as keyof BusinessSettings, !isChecked as any)}
                        className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                      >
                        <div className="space-y-0.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{item.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              isChecked
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {isChecked ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{item.desc}</p>
                        </div>
                        <div className="shrink-0">
                          <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative p-0.5 ${
                            isChecked ? 'bg-indigo-600' : 'bg-slate-800'
                          }`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 transform flex items-center justify-center ${
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            }`}>
                              {isChecked ? (
                                <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. POS SETTINGS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'pos' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Cash Tender Quick Denominations (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.cashDenominations || '100, 50, 20, 10, 5, 2, 1, 0.50, 0.25'}
                    onChange={(e) => handleFieldChange('cashDenominations', e.target.value)}
                    placeholder="100, 50, 20, 10, 5, 2, 1, 0.50, 0.25"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Defines quick cash tender buttons on the checkout modal for fast change calculation.
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    POS Keyboard Shortcuts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'expressPay', label: 'Express Cash Pay', defaultVal: 'F4' },
                      { key: 'multiplePay', label: 'Multiple Pay Modal', defaultVal: 'F5' },
                      { key: 'draft', label: 'Save as Draft / Hold', defaultVal: 'F7' },
                      { key: 'cancel', label: 'Cancel Current Cart', defaultVal: 'F8' },
                      { key: 'editDiscount', label: 'Edit Cart Discount', defaultVal: 'F9' },
                      { key: 'focusBarcode', label: 'Focus Barcode Scanner', defaultVal: 'F2' },
                    ].map((item) => (
                      <div key={item.key} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">{item.label}</label>
                        <input
                          type="text"
                          value={formData.posKeyboardShortcuts?.[item.key as keyof typeof formData.posKeyboardShortcuts] || item.defaultVal}
                          onChange={(e) => handleShortcutChange(item.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-indigo-300 font-mono text-center font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    POS Action Button Toggles & Display Rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'printInvoiceOnCheckout', label: 'Auto-Open Print Dialog on Checkout', desc: 'Triggers receipt print immediately on payment' },
                      { key: 'showCustomerDisplayScreen', label: 'Enable Customer Facing Display Screen', desc: 'Shows welcome screen and itemized cart on secondary monitor' },
                      { key: 'subtotalEditable', label: 'Allow Editable Subtotal in Cart', desc: 'Allows direct override of line item price' },
                      { key: 'disableDraft', label: 'Disable Draft / Hold Order Button', desc: 'Hides hold sale button from POS screen' },
                      { key: 'disableExpressCheckout', label: 'Disable Express Cash Button', desc: 'Forces using payment modal for every checkout' },
                      { key: 'disableMultiplePay', label: 'Disable Multiple Payment Option', desc: 'Disallows split payments between cash and card' },
                      { key: 'disableDiscount', label: 'Disable Discount Button in POS', desc: 'Prevents cashier from applying arbitrary cart discounts' },
                      { key: 'disableOrderTax', label: 'Disable Order Tax Override', desc: 'Enforces strictly default tax rates' },
                      { key: 'showBrandInPos', label: 'Show Brand on POS Item Cards', desc: 'Displays product brand badge on catalog tiles' },
                      { key: 'showCategoryInPos', label: 'Show Category Filters on POS Screen', desc: 'Displays category filter chips above product grid' },
                      { key: 'showSkuInPos', label: 'Show SKU Code on POS Item Cards', desc: 'Displays SKU code below item title' },
                    ].map((item) => {
                      const isChecked = Boolean((formData as any)[item.key]);
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleFieldChange(item.key as keyof BusinessSettings, !isChecked as any)}
                          className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                        >
                          <div className="space-y-0.5 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                isChecked
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {isChecked ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{item.desc}</p>
                          </div>
                          <div className="shrink-0">
                            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative p-0.5 ${
                              isChecked ? 'bg-indigo-600' : 'bg-slate-800'
                            }`}>
                              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 transform flex items-center justify-center ${
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              }`}>
                                {isChecked ? (
                                  <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {formData.showCustomerDisplayScreen && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Customer Display Header Welcome Message
                    </label>
                    <input
                      type="text"
                      value={formData.customerDisplayHeader || 'Welcome to Royal POS & Enterprise Store'}
                      onChange={(e) => handleFieldChange('customerDisplayHeader', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 7. PURCHASE SETTINGS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'purchases' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Default Purchase Discount (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.defaultPurchaseDiscount ?? 0}
                      onChange={(e) => handleFieldChange('defaultPurchaseDiscount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    Purchase Inward Workflows
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'enablePurchaseStatus', label: 'Enable Purchase Status Tracking', desc: 'Allows marking purchases as Received, Pending, or Ordered' },
                      { key: 'enableLotNumber', label: 'Enable Lot / Batch Number Tracking', desc: 'Track manufacturing batch numbers on incoming purchase shipments' },
                      { key: 'enablePurchaseOrder', label: 'Enable Purchase Order Workflow', desc: 'Generate official POs before receiving goods into stock' },
                      { key: 'enablePurchaseRequisition', label: 'Enable Purchase Requisition', desc: 'Staff request approval before issuing purchase orders' },
                      { key: 'enableEditPurchasePrice', label: 'Enable Edit Purchase Cost on Inward', desc: 'Allow adjusting unit purchase cost during receipt entry' },
                    ].map((item) => {
                      const isChecked = Boolean((formData as any)[item.key]);
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleFieldChange(item.key as keyof BusinessSettings, !isChecked as any)}
                          className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                        >
                          <div className="space-y-0.5 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                isChecked
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {isChecked ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{item.desc}</p>
                          </div>
                          <div className="shrink-0">
                            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative p-0.5 ${
                              isChecked ? 'bg-indigo-600' : 'bg-slate-800'
                            }`}>
                              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 transform flex items-center justify-center ${
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              }`}>
                                {isChecked ? (
                                  <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 8. PAYMENT & ACCOUNTS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'payment' && (
              <div className="space-y-6">
                {/* Feature Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <label className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.enableAccounts ?? true}
                      onChange={(e) => handleFieldChange('enableAccounts', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">Enable Accounts Module & Financial Accounting</span>
                      <p className="text-[11px] text-slate-400">
                        Enables double-entry bookkeeping ledgers, accounts mapping, and financial statements.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.enableCashRegister ?? true}
                      onChange={(e) => handleFieldChange('enableCashRegister', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">Enable Cash Register Shifts</span>
                      <p className="text-[11px] text-slate-400">
                        Tracks opening cash float, shift transactions, cash discrepancies, and closing totals.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 bg-slate-950 border rounded-2xl transition ${
                    (formData.enableCashRegister ?? true) ? 'border-slate-800 cursor-pointer hover:border-slate-700' : 'border-slate-900 opacity-40 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!(formData.enableCashRegister ?? true)}
                      checked={(formData.enableCashRegister ?? true) && (formData.strictRegisterLock ?? false)}
                      onChange={(e) => handleFieldChange('strictRegisterLock', e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-white">Strict Shift Lockout</span>
                      <p className="text-[11px] text-slate-400">
                        Cashiers cannot navigate away from POS without manager supervisor override PIN.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Default Double-Entry Accounts Mapping */}
                {(formData.enableAccounts ?? true) && (
                  <div className="border-t border-slate-800 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                          Default Double-Entry Payment Accounts Mapping
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Route transactions paid with different methods to correct bookkeeping ledger accounts.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Cash Tender Account</label>
                        <select
                          value={formData.defaultCashAccount || 'acc_cash_drawer'}
                          onChange={(e) => handleFieldChange('defaultCashAccount', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Credit/Debit Card Account</label>
                        <select
                          value={formData.defaultCardAccount || 'acc_stripe_merchant'}
                          onChange={(e) => handleFieldChange('defaultCardAccount', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Bank Wire / ACH Account</label>
                        <select
                          value={formData.defaultBankTransferAccount || 'acc_bank_main'}
                          onChange={(e) => handleFieldChange('defaultBankTransferAccount', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">UPI / Digital QR Account</label>
                        <select
                          value={formData.defaultUpiAccount || 'acc_bank_main'}
                          onChange={(e) => handleFieldChange('defaultUpiAccount', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Cheque / Demand Draft Account</label>
                        <select
                          value={formData.defaultChequeAccount || 'acc_bank_main'}
                          onChange={(e) => handleFieldChange('defaultChequeAccount', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHART OF FINANCIAL ACCOUNTS (DOUBLE-ENTRY LEDGERS) */}
                {(formData.enableAccounts ?? true) && (
                  <div className="border-t border-slate-800 pt-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                          Chart of Accounts / double-entry ledgers
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium font-semibold">
                          Create, view, edit and manage physical or digital accounting vaults and capital balances.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openAddAccount}
                        className="px-3.5 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/35 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Account Ledger</span>
                      </button>
                    </div>

                    {/* Ledger Accounts Table */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800">
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Account Name</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Account No.</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Account Type</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Partner</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Current Balance</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {accounts.map((acc) => {
                              const isDefault =
                                acc.id === formData.defaultCashAccount ||
                                acc.id === formData.defaultCardAccount ||
                                acc.id === formData.defaultBankTransferAccount ||
                                acc.id === formData.defaultUpiAccount ||
                                acc.id === formData.defaultChequeAccount;

                              return (
                                <tr key={acc.id} className="hover:bg-slate-900/40 transition">
                                  <td className="p-4 text-xs font-bold text-white flex items-center gap-2">
                                    <span>{acc.name}</span>
                                    {isDefault && (
                                      <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800/40 px-2 py-0.2 rounded-full font-bold">
                                        Default Mapping
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-xs text-slate-300 font-mono font-medium">{acc.accountNumber}</td>
                                  <td className="p-4 text-xs">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      acc.type === 'Cash' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                                      acc.type === 'Bank' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                                      acc.type === 'Card' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                                      'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                                    }`}>
                                      {acc.type}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs text-slate-400">{acc.bankName || '—'}</td>
                                  <td className="p-4 text-xs font-black text-right text-white">
                                    {settings.currencySymbol || '$'}{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-4 text-xs text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openEditAccount(acc)}
                                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const res = deleteAccount(acc.id);
                                          if (!res.success) {
                                            alert(res.message);
                                          }
                                        }}
                                        disabled={isDefault}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                          isDefault 
                                            ? 'bg-slate-900/50 text-slate-600 cursor-not-allowed' 
                                            : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-900/30'
                                        }`}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Creation & Editing Modal */}
                {showAddAccountModal && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
                      <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-black uppercase tracking-wider text-white">
                            {isEditingAccount ? 'Edit Ledger Account' : 'Create New Account Ledger'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Configure standard financial properties, bank names, and initial capital vaults.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddAccountModal(false)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 font-bold transition"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleAccountSubmit} className="p-5 space-y-4 text-left">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-300">Account Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. PayPal Merchant Clearing, Petty Cash Box"
                            value={accountForm.name}
                            onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-300">Account Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. PP-MID-9201"
                              value={accountForm.accountNumber}
                              onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-300">Account Type</label>
                            <select
                              value={accountForm.type}
                              onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value as any })}
                              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Cash">Cash Drawer / Safe</option>
                              <option value="Bank">Bank Account</option>
                              <option value="Card">Merchant Card POS</option>
                              <option value="Wallet">Digital QR Wallet</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-300">Current Balance *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">{settings.currencySymbol || '$'}</span>
                              <input
                                type="number"
                                required
                                step="0.01"
                                placeholder="0.00"
                                value={accountForm.balance || ''}
                                onChange={(e) => setAccountForm({ ...accountForm, balance: Number(e.target.value) })}
                                className="w-full pl-7 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-300">Bank Name (If Bank)</label>
                            <input
                              type="text"
                              disabled={accountForm.type !== 'Bank'}
                              placeholder="e.g. Wells Fargo, N.A."
                              value={accountForm.type === 'Bank' ? accountForm.bankName : ''}
                              onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                              className={`w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 ${
                                accountForm.type !== 'Bank' ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setShowAddAccountModal(false)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
                          >
                            {isEditingAccount ? 'Save Changes' : 'Create Ledger'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            
            {/* ========================================================================= */}
            {/* SYSTEM SECURITY SHIELD SECTION */}
            {/* ========================================================================= */}
            {activeSection === 'system_security' && (
              <div className="space-y-6">
                <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-rose-500" />
                        <span>Ultimate System Security Shield</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Ransomware & Anti-Hacking Protection (Helmet, Rate Limiting, HPP, CORS)
                      </p>
                    </div>
                    <div 
                      onClick={() => setFormData({ ...formData, enableSecurityShield: !(formData.enableSecurityShield ?? true) })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${(formData.enableSecurityShield ?? true) ? 'bg-rose-500' : 'bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(formData.enableSecurityShield ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                      This module actively protects the application from automated ransomware attacks, DDoS, brute-force hacking, and cross-site scripting (XSS) injections.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Helmet Configured</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">DDoS Rate Limiter</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">HPP Anti-Pollution</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Strict CORS</span>
                    </div>
                    {(formData.enableSecurityShield ?? true) ? (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3">
                        <Shield className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-rose-300 font-bold">
                            Shield Active & Anti-Hacking Operational
                          </p>
                          <p className="text-xs text-rose-300/80">
                            Your application server, API routes, and source code are strictly protected against threat vectors, parameter pollution, and virus injections.
                          </p>
                        </div>
                      </div>
                    ) : (
                       <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-amber-300 font-bold">
                            Shield Disabled (Vulnerable Mode)
                          </p>
                          <p className="text-xs text-amber-300/80">
                            The security shield is currently inactive. The system is exposed to parameter pollution and automated DDoS requests.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 10. SYSTEM SETTINGS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'system' && (
              <div className="space-y-6">
                {/* Theme Mode Selector (Dark / Light) */}
                <div className="space-y-3 bg-slate-950 border border-slate-850 p-5 rounded-3xl">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Interface Display Mode</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Switch between classical ocular-safe Dark Mode and high-contrast professional Light Mode.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-1">
                    {[
                      {
                        id: 'dark',
                        label: 'Ocular Dark Mode',
                        desc: 'Classic deep slate tones for low-light strain reduction.',
                        icon: Moon,
                        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
                      },
                      {
                        id: 'light',
                        label: 'Crisp Light Mode',
                        desc: 'High-contrast pure paper layout for sunlight readability.',
                        icon: Sun,
                        color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
                      },
                    ].map((modeOpt) => {
                      const isSelected = (formData.themeMode || 'dark') === modeOpt.id;
                      const Icon = modeOpt.icon;
                      return (
                        <button
                          key={modeOpt.id}
                          type="button"
                          onClick={() => handleFieldChange('themeMode', modeOpt.id as any)}
                          className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                            isSelected
                              ? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-600/5'
                              : 'bg-slate-950 border-slate-850 hover:border-slate-700 hover:bg-slate-900/50'
                          }`}
                        >
                          <span className={`p-2 rounded-xl border ${modeOpt.color} shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-white block">
                              {modeOpt.label}
                            </span>
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                              {modeOpt.desc}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="absolute top-3 right-3 w-4 h-4 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-850 my-6" />

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        <span>Company Branding</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        Upload dedicated logos for light and dark themes. The active theme automatically updates logos across your navigation bar and login/registration screens.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                        (formData.themeMode || 'dark') === 'dark'
                          ? 'bg-slate-900 border-indigo-500/40 text-indigo-300'
                          : 'bg-amber-50 border-amber-300 text-amber-700'
                      }`}>
                        {(formData.themeMode || 'dark') === 'dark' ? (
                          <>
                            <Moon className="w-3 h-3 text-indigo-400" />
                            <span>Current: Dark Theme</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-3 h-3 text-amber-500" />
                            <span>Current: Light Theme</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary / Light Theme Logo */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-200">
                          Company Logo (Default / Light Theme)
                        </label>
                        {(formData.themeMode || 'dark') === 'light' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Sun className="w-2.5 h-2.5" />
                            Active Now
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Default logo displayed during light theme mode, printable receipts, and invoice documents.
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          id="btn-upload-company-logo"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                        </button>

                        {formData.logoUrl && (
                          <>
                            <div className="h-10 px-3 bg-white/95 rounded-xl border border-slate-700 flex items-center justify-center shadow-xs">
                              <img
                                src={formData.logoUrl}
                                alt="Company Logo Preview"
                                className="h-7 max-w-[120px] object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleFieldChange('logoUrl', '')}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 rounded-xl transition cursor-pointer"
                              title="Remove Logo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const optimizedLogo = await optimizeImage(file, {
                                  maxWidth: 400,
                                  maxHeight: 400,
                                  quality: 0.9,
                                  type: 'image/png',
                                });
                                handleFieldChange('logoUrl', optimizedLogo);
                              } catch (error) {
                                console.error('Logo optimization failed:', error);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleFieldChange('logoUrl', reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* For Dark Theme Logo */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-200">
                          For Dark Theme
                        </label>
                        {(formData.themeMode || 'dark') === 'dark' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <Moon className="w-2.5 h-2.5" />
                            Active Now
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        High-contrast logo automatically displayed in Navigation and Login/Registration screen when Dark Theme is enabled.
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          id="btn-upload-dark-logo"
                          onClick={() => document.getElementById('dark-logo-upload')?.click()}
                          className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.darkLogoUrl ? 'Change Dark Logo' : 'Upload Logo (For Dark Theme)'}</span>
                        </button>

                        {formData.darkLogoUrl && (
                          <>
                            <div className="h-10 px-3 bg-slate-900 rounded-xl border border-indigo-500/40 flex items-center justify-center shadow-xs">
                              <img
                                src={formData.darkLogoUrl}
                                alt="Dark Theme Logo Preview"
                                className="h-7 max-w-[120px] object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleFieldChange('darkLogoUrl', '')}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 rounded-xl transition cursor-pointer"
                              title="Remove Dark Theme Logo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <input
                          id="dark-logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const optimizedLogo = await optimizeImage(file, {
                                  maxWidth: 400,
                                  maxHeight: 400,
                                  quality: 0.9,
                                  type: 'image/png',
                                });
                                handleFieldChange('darkLogoUrl', optimizedLogo);
                              } catch (error) {
                                console.error('Dark theme logo optimization failed:', error);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleFieldChange('darkLogoUrl', reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Branding Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">Font Preset</label>
                      <select
                        value={formData.fontPreset || 'sans'}
                        onChange={(e) => handleFieldChange('fontPreset', e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="sans">Sans Serif (Modern)</option>
                        <option value="serif">Serif (Traditional)</option>
                        <option value="mono">Monospace (Technical)</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 self-end">
                      <input
                        type="checkbox"
                        checked={!!formData.invoiceLogoEnabled}
                        onChange={(e) => handleFieldChange('invoiceLogoEnabled', e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded"
                      />
                      <span className="text-xs font-bold text-white">Show Logo in Invoice</span>
                    </label>
                  </div>

                  {/* Real-Time Live Branding Display Preview */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Live Brand Preview (Navigation & Login)</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {(formData.themeMode || 'dark') === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {(formData.themeMode || 'dark') === 'dark'
                          ? formData.darkLogoUrl
                            ? 'Displaying your dedicated Dark Theme Logo.'
                            : formData.logoUrl
                            ? 'Displaying fallback Company Logo (upload "For Dark Theme" to customize).'
                            : 'Displaying standard Enterprise Emblem.'
                          : formData.logoUrl
                          ? 'Displaying your primary Light Theme Logo.'
                          : formData.darkLogoUrl
                          ? 'Displaying fallback Dark Theme Logo.'
                          : 'Displaying standard Enterprise Emblem.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                        (formData.themeMode || 'dark') === 'dark'
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}>
                        <RoyalLogo size="sm" showText={false} />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextMode = (formData.themeMode || 'dark') === 'dark' ? 'light' : 'dark';
                          handleFieldChange('themeMode', nextMode as any);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Toggle theme to test auto-switching logo"
                      >
                        {(formData.themeMode || 'dark') === 'dark' ? (
                          <>
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                            <span>Test Light Mode</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Test Dark Mode</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-850 my-6" />

                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    Theme UI Accent Palette
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Select an elegant, pre-configured color palette to customize the user interface of your ERP and POS terminals in real time.
                  </p>
                </div>

                {/* Theme Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'indigo',
                      name: 'Royal Indigo',
                      desc: 'Premium deep sapphire tones with classical structure.',
                      color: 'text-indigo-400 border-indigo-500/20',
                      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
                      swatches: ['bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700'],
                    },
                    {
                      id: 'emerald',
                      name: 'Emerald Coast',
                      desc: 'Calming, crisp forest and organic ocean greens.',
                      color: 'text-emerald-400 border-emerald-500/20',
                      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
                      swatches: ['bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600', 'bg-emerald-700'],
                    },
                    {
                      id: 'violet',
                      name: 'Imperial Violet',
                      desc: 'Mystical, vibrant royal purple and orchid combinations.',
                      color: 'text-violet-400 border-violet-500/20',
                      badge: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
                      swatches: ['bg-violet-400', 'bg-violet-500', 'bg-violet-600', 'bg-violet-700'],
                    },
                    {
                      id: 'amber',
                      name: 'Warm Amber',
                      desc: 'Radiant honey, copper, and energetic solar golds.',
                      color: 'text-amber-400 border-amber-500/20',
                      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
                      swatches: ['bg-amber-400', 'bg-amber-500', 'bg-amber-600', 'bg-amber-700'],
                    },
                    {
                      id: 'rose',
                      name: 'Crimson Rose',
                      desc: 'Rich burgundy and crimson ruby tones for high contrast.',
                      color: 'text-rose-400 border-rose-500/20',
                      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
                      swatches: ['bg-rose-400', 'bg-rose-500', 'bg-rose-600', 'bg-rose-700'],
                    },
                    {
                      id: 'cyan',
                      name: 'Electric Cyan',
                      desc: 'Futuristic, ultra-clean digital neo-turquoise shades.',
                      color: 'text-cyan-400 border-cyan-500/20',
                      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
                      swatches: ['bg-cyan-400', 'bg-cyan-500', 'bg-cyan-600', 'bg-cyan-700'],
                    },
                    {
                      id: 'orange',
                      name: 'Sunset Orange',
                      desc: 'Warm, intense volcanic and radiant summer twilight glow.',
                      color: 'text-orange-400 border-orange-500/20',
                      badge: 'bg-orange-500/10 text-orange-300 border-orange-500/25',
                      swatches: ['bg-orange-400', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700'],
                    },
                    {
                      id: 'teal',
                      name: 'Deep Oceanic Teal',
                      desc: 'Sophisticated dark maritime and tropical lagoon blues.',
                      color: 'text-teal-400 border-teal-500/20',
                      badge: 'bg-teal-500/10 text-teal-300 border-teal-500/25',
                      swatches: ['bg-teal-400', 'bg-teal-500', 'bg-teal-600', 'bg-teal-700'],
                    },
                    {
                      id: 'fuchsia',
                      name: 'Neon Fuchsia',
                      desc: 'Vibrant, high-energy magenta and cybernetic violet tones.',
                      color: 'text-fuchsia-400 border-fuchsia-500/20',
                      badge: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/25',
                      swatches: ['bg-fuchsia-400', 'bg-fuchsia-500', 'bg-fuchsia-600', 'bg-fuchsia-700'],
                    },
                    {
                      id: 'sky',
                      name: 'Ocean Sky',
                      desc: 'Bright, crisp high-altitude summer day sky tones.',
                      color: 'text-sky-400 border-sky-500/20',
                      badge: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
                      swatches: ['bg-sky-400', 'bg-sky-500', 'bg-sky-600', 'bg-sky-700'],
                    },
                    {
                      id: 'lime',
                      name: 'Citrus Lime',
                      desc: 'Punchy, ultra-modern energetic neon and electric greens.',
                      color: 'text-lime-400 border-lime-500/20',
                      badge: 'bg-lime-500/10 text-lime-300 border-lime-500/25',
                      swatches: ['bg-lime-400', 'bg-lime-500', 'bg-lime-600', 'bg-lime-700'],
                    },
                  ].map((theme) => {
                    const isSelected = (formData.themeAccent || 'indigo') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleFieldChange('themeAccent', theme.id as any)}
                        className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                          isSelected
                            ? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-600/10'
                            : 'bg-slate-950 border-slate-850 hover:border-slate-700 hover:bg-slate-900/50'
                        }`}
                      >
                        {/* Upper row */}
                        <div className="flex items-start justify-between w-full mb-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${theme.color}`}>
                            {theme.name}
                          </span>
                          {isSelected ? (
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-slate-500 transition animate-pulse-once" />
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-400 font-semibold mb-4 flex-grow">
                          {theme.desc}
                        </p>

                        {/* Swatches Grid */}
                        <div className="flex items-center gap-1.5 mt-auto w-full">
                          <div className="flex items-center gap-1">
                            {theme.swatches.map((sw, idx) => (
                              <span key={idx} className={`w-3 h-3 rounded-full border border-black/10 shadow-xs ${sw}`} />
                            ))}
                          </div>
                          <span className={`text-[9px] font-bold border rounded px-1.5 py-0.2 ml-auto ${theme.badge}`}>
                            {theme.id.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Additional System Parameters */}
                <div className="border-t border-slate-850 pt-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    System Synchronization Defaults
                  </h4>
                  <div className="max-w-md bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Offline Sync Interval (Seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.autoSyncIntervalSecs ?? 30}
                        onChange={(e) => handleFieldChange('autoSyncIntervalSecs', parseInt(e.target.value, 10) || 30)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                        Controls frequency of synchronizing background transaction queues with physical cloud storage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 11. PREFIXES TAB */}
            {/* ========================================================================= */}
            {activeSection === 'prefixes' && (
              <div className="space-y-6">
                <p className="text-xs text-slate-400">
                  Configure custom prefix strings prepended to all auto-generated transaction IDs and document numbers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'sellInvoice', label: 'Sales Tax Invoice', defaultVal: 'INV-' },
                    { key: 'sellReturn', label: 'Sales Return / Credit Note', defaultVal: 'SR-' },
                    { key: 'quotation', label: 'Quotation / Estimate', defaultVal: 'QTN-' },
                    { key: 'purchaseOrder', label: 'Purchase Order (PO)', defaultVal: 'PO-' },
                    { key: 'purchaseRequisition', label: 'Purchase Requisition', defaultVal: 'PRQ-' },
                    { key: 'purchaseReturn', label: 'Purchase Return (Debit Note)', defaultVal: 'PR-' },
                    { key: 'stockTransfer', label: 'Inter-Branch Stock Transfer', defaultVal: 'TRF-' },
                    { key: 'stockAdjustment', label: 'Stock Adjustment (Audit/Loss)', defaultVal: 'ADJ-' },
                    { key: 'expense', label: 'Expense Voucher', defaultVal: 'EXP-' },
                    { key: 'customer', label: 'Customer Code', defaultVal: 'CUST-' },
                    { key: 'supplier', label: 'Supplier Code', defaultVal: 'SUP-' },
                    { key: 'businessLocation', label: 'Branch Location Code', defaultVal: 'LOC-' },
                    { key: 'cashRegister', label: 'Cash Register Shift Code', defaultVal: 'REG-' },
                  ].map((p) => (
                    <div key={p.key} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">{p.label}</label>
                      <input
                        type="text"
                        value={formData.prefixes?.[p.key as keyof typeof formData.prefixes] || p.defaultVal}
                        onChange={(e) => handlePrefixChange(p.key, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-indigo-300 font-mono font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 13. REWARD POINTS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'reward_points' && (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Enable Customer Loyalty & Reward Point System</p>
                    <p className="text-[11px] text-slate-400">
                      Customers accumulate points with every purchase and can redeem points as currency discounts on POS cart checkouts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.rewardPointsSettings?.enableRewardPoints ?? true}
                    onChange={(e) => handleRewardChange('enableRewardPoints', e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Reward Program Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.rewardPointsSettings?.displayName || 'Royal Rewards Club'}
                      onChange={(e) => handleRewardChange('displayName', e.target.value)}
                      placeholder="e.g. Royal Rewards Club"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Amount Spent for 1 Point ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.rewardPointsSettings?.amountSpendForOnePoint ?? 10}
                      onChange={(e) => handleRewardChange('amountSpendForOnePoint', parseFloat(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">e.g. Spending $10 earns 1 point</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Redeem Value per Point ($)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={formData.rewardPointsSettings?.redeemAmountPerPoint ?? 0.25}
                      onChange={(e) => handleRewardChange('redeemAmountPerPoint', parseFloat(e.target.value) || 0.1)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">e.g. 1 point = $0.25 credit</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Min Order Total to Earn Points ($)
                    </label>
                    <input
                      type="number"
                      value={formData.rewardPointsSettings?.minOrderTotalToEarn ?? 20}
                      onChange={(e) => handleRewardChange('minOrderTotalToEarn', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Min Order Total to Redeem ($)
                    </label>
                    <input
                      type="number"
                      value={formData.rewardPointsSettings?.minOrderTotalToRedeem ?? 50}
                      onChange={(e) => handleRewardChange('minOrderTotalToRedeem', parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Points Expiry Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.rewardPointsSettings?.pointExpiryDays ?? 365}
                      onChange={(e) => handleRewardChange('pointExpiryDays', parseInt(e.target.value, 10) || 365)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">e.g. 365 days = 1 year validity</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 14. MODULES MANAGER TAB */}
            {/* ========================================================================= */}
            {activeSection === 'modules' && (
              <div className="space-y-6 w-full max-w-full min-w-0">
                <div className="bg-slate-950/60 border border-indigo-500/20 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full min-w-0">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider break-words">Advanced Enterprise Module Controller</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">
                      Toggle high-level business modules to instantly activate or conceal system features across navigation and workspace panels.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-bold shrink-0 self-start sm:self-auto">
                    {Object.values(formData.enabledModules || {}).filter(v => v !== false).length} / 8 Modules Active
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full min-w-0">
                  {[
                    { key: 'purchases', name: 'Purchases & Supplier Inward', desc: 'Manage vendor procurement, purchase orders, and stock receipts', icon: ShoppingCart },
                    { key: 'stockAdjustments', name: 'Stock Adjustments & Damage Audit', desc: 'Audit shrinkage, expiry, product damage, and stock write-offs', icon: Boxes },
                    { key: 'stockTransfers', name: 'Inter-Branch Stock Transfers', desc: 'Transfer inventory between warehouses and physical store outlets', icon: Truck },
                    { key: 'expenses', name: 'Expenses & Double-Entry Accounts', desc: 'Record operating expenses, chart of accounts, and ledger balance sheets', icon: CreditCard },
                    { key: 'crmContacts', name: 'CRM & B2B Customer Portfolios', desc: 'Manage corporate customer credit limits, suppliers, and transaction history', icon: Users },
                    { key: 'aiIntelligence', name: 'AI Business Intelligence Assistant', desc: 'Gemini-powered revenue forecasts, demand prediction, and restock planning', icon: Sparkles },
                    { key: 'barcodeStudio', name: 'Barcode & Thermal Label Studio', desc: 'Generate and print thermal barcode labels across A4 sheets and continuous rolls', icon: Tag },
                    { key: 'multiLocations', name: 'Multi-Location Outlets & Branches', desc: 'Manage multiple warehouse depots and retail physical storefronts', icon: Building2 },
                  ].map((m) => {
                    const isEnabled = formData.enabledModules?.[m.key as keyof typeof formData.enabledModules] ?? true;
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.key}
                        onClick={() => handleModuleToggle(m.key, !isEnabled)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-4 group w-full max-w-full min-w-0 ${
                          isEnabled
                            ? 'bg-slate-950 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isEnabled
                              ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-500'
                          }`}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                              <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition break-words">{m.name}</h4>
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                                isEnabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {isEnabled ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed break-words">{m.desc}</p>
                          </div>
                        </div>

                        {/* Advanced Slide Toggle Switch */}
                        <div className="shrink-0 pl-1">
                          <div className={`w-11 sm:w-12 h-6 rounded-full transition-colors duration-200 relative p-0.5 ${
                            isEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                          }`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 transform flex items-center justify-center ${
                              isEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                            }`}>
                              {isEnabled ? (
                                <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 14. PRINTERS CONFIGURATION TAB */}
            {activeSection === 'printers' && (
              <PrintersConfigTab />
            )}

            {/* 15. CUSTOM FIELD LABELS TAB */}
            {/* ========================================================================= */}
            {activeSection === 'custom_labels' && (
              <div className="space-y-6">
                <p className="text-xs text-slate-400">
                  finias POS allows defining up to 4 custom fields for each core business entity (Products, Contacts, Purchases, Sales, and Locations).
                </p>

                {(['product', 'contact', 'purchase', 'sell', 'location'] as const).map((entity) => {
                  const titles: Record<string, string> = {
                    product: 'Product Custom Fields',
                    contact: 'Contact / Customer Custom Fields',
                    purchase: 'Purchase Order Custom Fields',
                    sell: 'Sales Invoice Custom Fields',
                    location: 'Branch Location Custom Fields',
                  };

                  return (
                    <div key={entity} className="border-t border-slate-800 pt-4 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                        {titles[entity]}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((num) => {
                          const fieldKey = `custom${num}`;
                          const currentField = formData.customLabels?.[entity]?.[fieldKey];
                          const defaultLabel = `${entity.charAt(0).toUpperCase() + entity.slice(1)} Custom Field ${num}`;

                          return (
                            <div key={fieldKey} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                Field {num} Label
                              </label>
                              <input
                                type="text"
                                value={currentField?.label || defaultLabel}
                                onChange={(e) => handleCustomLabelChange(entity, fieldKey, e.target.value, currentField?.type || 'text')}
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Save Bar (Sticky Docked Panel) */}
            <div className={`sticky bottom-0 ${isLight ? 'bg-white/95 border-slate-200/80 shadow-[0_-8px_30px_rgba(241,245,249,0.9)]' : 'bg-slate-900/95 border-slate-800/80 shadow-[0_-8px_30px_rgba(15,23,42,0.8)]'} backdrop-blur-md py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 -mx-6 px-6 rounded-b-3xl z-20 mt-8`}>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1.5`}>
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>All parameters auto-sync with the active offline database.</span>
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetConfirm(true)}
                  className={`px-4 py-2 ${isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-indigo-100/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} border rounded-xl text-xs font-bold transition`}
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Settings</span>
                </button>
              </div>
            </div>
          </form>
        </div>
    </div>
  );
};
