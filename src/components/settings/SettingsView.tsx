import React from 'react';
import { useErp } from '../../context/ErpContext';
import { BusinessSettingsTab } from './BusinessSettingsTab';
import { EmployeePermissionsTab } from './EmployeePermissionsTab';
import { InvoiceLayoutsTab } from './InvoiceLayoutsTab';
import { TaxSettingsTab } from './TaxSettingsTab';
import { CurrencySettingsTab } from './CurrencySettingsTab';
import { ReceiptTaxTab } from './ReceiptTaxTab';
import { PosSecurityTab } from './PosSecurityTab';
import { SecurityGuardView } from '../security/SecurityGuardView';
import { LocationsTab } from './LocationsTab';
import { AccessDeniedGuard } from './AccessDeniedGuard';
import { PaymentAccountsTab } from './PaymentAccountsTab';
import { PaymentMethodsTab } from './PaymentMethodsTab';
import { NotificationTemplatesView } from '../notifications/NotificationTemplatesView';
import { SignatureSealTab } from './SignatureSealTab';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Percent,
  Coins,
  Receipt,
  Lock,
  Building,
  Settings as SettingsIcon,
  Sparkles,
  UserCheck,
  ChevronRight,
  FileSpreadsheet,
  CreditCard,
  Sliders,
  Landmark,
  Stamp,
  PenTool,
  Plus,
} from 'lucide-react';

const SUB_TAB_TITLES: Record<
  string,
  { label: string; description: string; icon: React.ComponentType<{ className?: string }>; badge?: string }
> = {
  signature_seal: {
    label: 'Signature & Company Address Seal',
    description: 'Configure authorized administrator signatures and official company address seals/stamps for invoices and bills.',
    icon: Stamp,
    badge: 'Signoff & Seal',
  },
  notification_templates: {
    label: 'Notification Templates',
    description: 'Manage automated email, SMS, and WhatsApp notification templates for Customer & Supplier events.',
    icon: Sparkles,
    badge: 'Email / SMS / WA',
  },
  business_settings: {
    label: 'Business Settings',
    description: 'Core company profile, trading entity details, legal tax identification, start date, profit margins, currency, financial year & HQ timezone.',
    icon: Building2,
  },
  permissions: {
    label: 'Staff & Permissions (RBAC)',
    description: 'Manage staff accounts, user status, brute-force lockout freeze, immediate unlock requests, passwords, and module access privileges.',
    icon: ShieldCheck,
    badge: 'Staff & RBAC',
  },
  staff_permissions: {
    label: 'Staff & Permissions (RBAC)',
    description: 'Manage staff accounts, user status, brute-force lockout freeze, immediate unlock requests, passwords, and module access privileges.',
    icon: ShieldCheck,
    badge: 'Staff & RBAC',
  },
  employee_permissions: {
    label: 'Staff & Permissions (RBAC)',
    description: 'Manage staff accounts, user status, brute-force lockout freeze, immediate unlock requests, passwords, and module access privileges.',
    icon: ShieldCheck,
    badge: 'Staff & RBAC',
  },
  staff: {
    label: 'Staff & Permissions (RBAC)',
    description: 'Manage staff accounts, user status, brute-force lockout freeze, immediate unlock requests, passwords, and module access privileges.',
    icon: ShieldCheck,
    badge: 'Staff & RBAC',
  },
  invoice_layouts: {
    label: 'Invoice Layouts & Numbering Schemes',
    description: 'Configure Classic, Elegant, Detailed, Columnized Taxes, and Slim thermal receipt layouts with custom fields.',
    icon: FileSpreadsheet,
    badge: '6 POS Layouts',
  },
  invoice_layout: {
    label: 'Invoice Layouts & Numbering Schemes',
    description: 'Configure Classic, Elegant, Detailed, Columnized Taxes, and Slim thermal receipt layouts with custom fields.',
    icon: FileSpreadsheet,
    badge: '6 POS Layouts',
  },
  tax: {
    label: 'Tax Rates, Tax Groups & GST Support',
    description: 'Configure multi-tier tax rates, compound GST groups (CGST/SGST/IGST), HSN codes, and global tax presets.',
    icon: Percent,
    badge: 'GST & HSN',
  },
  currency: {
    label: 'Currency Configuration',
    description: 'Define the store master currency code, symbol, decimal precision, and custom international currencies.',
    icon: Coins,
    badge: 'Currency Standard',
  },
  receipt: {
    label: 'Receipt Layout & Invoice Header',
    description: 'Customize header slogans, tax summary breakdown on printed receipts, and footer terms.',
    icon: Receipt,
  },
  security: {
    label: 'Security & Anti-Fake Guard',
    description: 'Detect and block fake user signups, disposable email addresses, honeypot traps, and brute-force logins.',
    icon: ShieldAlert,
    badge: 'Bot & Auth Shield',
  },
  pos_security: {
    label: 'POS Register & Shift Security',
    description: 'Register float policies, supervisor override codes, and cashier shift closure lockouts.',
    icon: Lock,
  },
  locations: {
    label: 'Branch Outlets',
    description: 'Manage warehouse branches, physical retail stores, and inter-branch transfer privileges.',
    icon: Building,
  },
  payment_accounts: {
    label: 'Payment Accounts',
    description: 'Manage financial payment accounts, ledgers, and transaction gateways.',
    icon: Landmark,
    badge: 'Finance',
  },
  payment_methods: {
    label: 'Payment Methods',
    description: 'Manage tender types, cash registers, card readers, UPI, and custom payment method gateways.',
    icon: CreditCard,
    badge: 'Tender Gateways',
  },
};

const BUSINESS_SECTION_TITLES: Record<string, { label: string; description: string; badge?: string }> = {
  business: {
    label: 'Business Settings',
    description: 'Core company profile, trading entity details, legal tax identification, start date, profit margins, currency, financial year & HQ timezone.',
  },
  product: {
    label: 'Product Settings',
    description: 'SKU prefixes, expiry stop days, brand/category toggles, default units, racks, and warranties.',
  },
  contact: {
    label: 'Contact Settings',
    description: 'Default credit limit, customer/supplier ID prefixes, and auto-generation rules.',
  },
  sale: {
    label: 'Sales Settings',
    description: 'Default discount, cart item addition methods, rounding rules, minimum selling price, and overselling.',
  },
  pos: {
    label: 'POS Settings',
    description: 'Keyboard shortcuts, cash tender denominations, checkout button toggles, and customer display screen.',
  },
  purchases: {
    label: 'Purchase Settings',
    description: 'Purchase order approval workflow, supplier pricing tiers, editing purchase prices, and receiving rules.',
  },
  payment: {
    label: 'Payment Settings',
    description: 'Payment methods, auto-allocation, cash rounding, and customer ledger defaults.',
  },
  app_updates: {
    label: 'System Updates',
    description: 'Configure footer copyright notice, app version numbering, automatic patch updates, and system release history.',
  },
  system: {
    label: 'Themes',
    description: 'System theme, date formats, time format, language, and table row pagination counts.',
  },
  system_security: {
    label: 'System Security Shield',
    description: 'Session timeout, auto-lock policies, and password complexity rules.',
  },
  prefixes: {
    label: 'Document Prefix',
    description: 'Document numbering reference prefixes for invoices, purchases, stock transfers, and vouchers.',
  },
  reward_points: {
    label: 'Reward Settings',
    description: 'Earning points per currency spent, redemption value, and minimum thresholds.',
  },
  modules: {
    label: 'Modules Manager',
    description: 'Enable or disable optional modules across the ERP installation.',
  },
  printers: {
    label: 'Thermal & Network Printers',
    description: 'Configure network thermal receipt printers, print servers, and auto-print on checkout.',
  },
  custom_labels: {
    label: 'Custom Field Labels',
    description: 'Customize custom field labels across contacts, products, sales, and purchases.',
  },
};

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    hasModuleAccess,
    settingsSubTab,
    setSettingsSubTab,
    users = [],
    businessSettingsSection,
  } = useErp();

  // Check if current user has permission to access Settings module
  const canAccessSettings = hasModuleAccess('settings') || hasModuleAccess('security') || hasModuleAccess('system_updates');

  if (!canAccessSettings) {
    return <AccessDeniedGuard moduleName="Settings & Security" moduleId="settings" />;
  }

  const lockedUsers = (users || []).filter((u) => u.status === 'locked');
  const unlockRequestedUsers = lockedUsers.filter((u) => u.unlockRequested);

  const baseTabMeta = SUB_TAB_TITLES[settingsSubTab] || SUB_TAB_TITLES.business_settings;
  const isBusinessSub = settingsSubTab === 'business_settings' || !settingsSubTab;
  const currentSectionMeta =
    isBusinessSub && businessSettingsSection
      ? BUSINESS_SECTION_TITLES[businessSettingsSection]
      : null;

  const currentTabMeta = {
    label: currentSectionMeta?.label || baseTabMeta.label,
    description: currentSectionMeta?.description || baseTabMeta.description,
    badge: currentSectionMeta?.badge || baseTabMeta.badge,
    icon: baseTabMeta.icon,
  };
  const TabIcon = currentTabMeta.icon;

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-12 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl transition-colors duration-300">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <SettingsIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings & Permissions</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
              <TabIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentTabMeta.label}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 pt-1">
            <span>{currentTabMeta.label}</span>
          </h1>

          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            {currentTabMeta.description}
          </p>
        </div>

        {settingsSubTab === 'currency' && (
          <div className="shrink-0">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/settings/currencies/add');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              id="btn-add-new-currency"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Currency</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content Panel */}
      <div className="transition-all duration-200 max-w-full overflow-hidden">
        {(settingsSubTab === 'business_settings' || settingsSubTab === 'profile' || !settingsSubTab) && (
          <BusinessSettingsTab />
        )}
        {(settingsSubTab === 'permissions' ||
          settingsSubTab === 'staff_permissions' ||
          settingsSubTab === 'employee_permissions' ||
          settingsSubTab === 'staff' ||
          settingsSubTab === 'roles') && <EmployeePermissionsTab initialSection="users" />}
        {(settingsSubTab === 'invoice_layouts' || settingsSubTab === 'invoice_layout') && <InvoiceLayoutsTab />}
        {settingsSubTab === 'tax' && <TaxSettingsTab />}
        {settingsSubTab === 'currency' && <CurrencySettingsTab />}
        {settingsSubTab === 'receipt' && <ReceiptTaxTab />}
        {(settingsSubTab === 'security' || settingsSubTab === 'security_guard') && <SecurityGuardView />}
        {settingsSubTab === 'pos_security' && <PosSecurityTab />}
        {settingsSubTab === 'locations' && <LocationsTab />}
        {settingsSubTab === 'payment_accounts' && <PaymentAccountsTab />}
        {settingsSubTab === 'payment_methods' && <PaymentMethodsTab />}
        {settingsSubTab === 'notification_templates' && <NotificationTemplatesView />}
        {settingsSubTab === 'signature_seal' && <SignatureSealTab />}
      </div>
    </div>
  );
};
