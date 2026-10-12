import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  ErpModuleId,
  CustomRoleDefinition,
  ModulePermissionRule,
} from '../../types/erp';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  X,
  Check,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Building,
  DollarSign,
  Percent,
  Sliders,
  Sparkles,
  Layers,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  Users,
  BarChart3,
  Code2,
  Settings as SettingsIcon,
  HelpCircle,
  RotateCcw,
  Save,
  Key,
  Award,
  AlertTriangle,
  RefreshCw,
  UserCog,
  Eye,
  EyeOff,
  BellRing,
  Info,
  CheckCircle2,
} from 'lucide-react';

export interface RoleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: CustomRoleDefinition | null;
  onSaveRole: (role: CustomRoleDefinition) => void;
  onToast?: (msg: string) => void;
}

interface ModuleMeta {
  id: ErpModuleId;
  label: string;
  category: 'Core' | 'Operations' | 'Finance' | 'System';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BUILDER_MODULES: ModuleMeta[] = [
  {
    id: 'pos',
    label: 'Point of Sale (POS)',
    category: 'Operations',
    description: 'High-speed checkout register, barcode scanner, receipt printing, and cashier till.',
    icon: ShoppingCart,
  },
  {
    id: 'sales',
    label: 'Sales & Invoices',
    category: 'Operations',
    description: 'Sales invoices, order registers, customer delivery notes, and return credit notes.',
    icon: Receipt,
  },
  {
    id: 'contacts',
    label: 'Customers & Contacts CRM',
    category: 'Core',
    description: 'Customer directory, supplier profiles, ledger credit limits, and addresses.',
    icon: Users,
  },
  {
    id: 'inventory',
    label: 'Products & Inventory',
    category: 'Operations',
    description: 'Product catalog, barcode labels, stock transfers, audits, and category masters.',
    icon: Boxes,
  },
  {
    id: 'purchases',
    label: 'Purchases & Inward',
    category: 'Operations',
    description: 'Supplier POs, inward stock bills, goods receiving, and vendor requisitions.',
    icon: Truck,
  },
  {
    id: 'expenses',
    label: 'Expenses & Overheads',
    category: 'Finance',
    description: 'Petty cash claims, store bills, operational expense accounts, and vouchers.',
    icon: DollarSign,
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    category: 'Finance',
    description: 'Stock availability, sales performance, P&L reports, and tax audits.',
    icon: BarChart3,
  },
  {
    id: 'settings',
    label: 'System & Branch Settings',
    category: 'System',
    description: 'Store configurations, tax rules, invoice layouts, and branch setup.',
    icon: SettingsIcon,
  },
  {
    id: 'ai',
    label: 'AI Business Intelligence',
    category: 'System',
    description: 'Gemini demand forecasting, stock reorder recommendations, and trend alerts.',
    icon: Sparkles,
  },
];

interface AvailableReport {
  id: string;
  label: string;
  category: string;
  adminSensitive?: boolean;
}

const AVAILABLE_REPORTS: AvailableReport[] = [
  { id: 'stock_report', label: 'Stock & Inventory Report', category: 'Inventory' },
  { id: 'reports', label: 'Profit & Loss Statement', category: 'Finance', adminSensitive: true },
  { id: 'product_sell_report', label: 'Product Sell Performance', category: 'Sales' },
  { id: 'sell_payment_report', label: 'Sell Payment Register', category: 'Sales' },
  { id: 'tax_report', label: 'GST & Tax Summary Report', category: 'Finance', adminSensitive: true },
  { id: 'customer_supplier_report', label: 'Customer & Supplier Balances', category: 'Contacts' },
  { id: 'product_purchase_report', label: 'Product Purchase Inward Report', category: 'Purchases' },
  { id: 'purchase_payment_report', label: 'Purchase Payment Report', category: 'Purchases' },
  { id: 'stock_adjustment_report', label: 'Stock Adjustment Audit Log', category: 'Inventory' },
  { id: 'sales_representative_report', label: 'Sales Commission Representative', category: 'Sales' },
];

interface StarterTemplate {
  name: string;
  badge: string;
  description: string;
  modules: Record<string, ModulePermissionRule>;
  allowedReports: string[];
  notifyOnDelete: boolean;
  hideCostPrice: boolean;
  maxDiscountPercent: number;
}

const STARTER_TEMPLATES: Record<string, StarterTemplate> = {
  cashier_custom: {
    name: 'Cashier & Counter Sales',
    badge: 'Front-Line Checkout',
    description: 'Full POS & Sales access, customer lookup & add only (no edit/delete), Stock Report access only, and real-time Admin delete alerts.',
    modules: {
      pos: { view: true, create: true, edit: true, delete: true },
      sales: { view: true, create: true, edit: true, delete: true },
      contacts: { view: true, create: true, edit: false, delete: false },
      inventory: { view: false, create: false, edit: false, delete: false },
      purchases: { view: false, create: false, edit: false, delete: false },
      expenses: { view: false, create: false, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      ai: { view: false, create: false, edit: false, delete: false },
    },
    allowedReports: ['stock_report'],
    notifyOnDelete: true,
    hideCostPrice: true,
    maxDiscountPercent: 10,
  },
  inventory_specialist: {
    name: 'Inventory & Stock Supervisor',
    badge: 'Supply & Stock',
    description: 'Full control of Products, Stock Audits, Stock Adjustments, Purchases, and Stock Reports.',
    modules: {
      pos: { view: false, create: false, edit: false, delete: false },
      sales: { view: false, create: false, edit: false, delete: false },
      contacts: { view: true, create: true, edit: false, delete: false },
      inventory: { view: true, create: true, edit: true, delete: true },
      purchases: { view: true, create: true, edit: true, delete: false },
      expenses: { view: false, create: false, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      ai: { view: false, create: false, edit: false, delete: false },
    },
    allowedReports: ['stock_report', 'stock_adjustment_report', 'product_purchase_report'],
    notifyOnDelete: true,
    hideCostPrice: false,
    maxDiscountPercent: 0,
  },
  sales_executive: {
    name: 'Sales & Front-Desk Executive',
    badge: 'Sales & Quotations',
    description: 'Full Sales and Customer management, POS register operations, and Stock checking.',
    modules: {
      pos: { view: true, create: true, edit: true, delete: false },
      sales: { view: true, create: true, edit: true, delete: false },
      contacts: { view: true, create: true, edit: true, delete: false },
      inventory: { view: true, create: false, edit: false, delete: false },
      purchases: { view: false, create: false, edit: false, delete: false },
      expenses: { view: false, create: false, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      ai: { view: false, create: false, edit: false, delete: false },
    },
    allowedReports: ['stock_report', 'product_sell_report', 'sell_payment_report'],
    notifyOnDelete: true,
    hideCostPrice: true,
    maxDiscountPercent: 15,
  },
  finance_accountant: {
    name: 'Finance & Accounts Clerk',
    badge: 'Ledger & Audit',
    description: 'Full Expense, Tax, and Financial reporting access with read-only sales and inward purchase logs.',
    modules: {
      pos: { view: false, create: false, edit: false, delete: false },
      sales: { view: true, create: false, edit: false, delete: false },
      contacts: { view: true, create: false, edit: false, delete: false },
      inventory: { view: false, create: false, edit: false, delete: false },
      purchases: { view: true, create: false, edit: false, delete: false },
      expenses: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      ai: { view: false, create: false, edit: false, delete: false },
    },
    allowedReports: ['reports', 'tax_report', 'customer_supplier_report', 'sell_payment_report', 'purchase_payment_report'],
    notifyOnDelete: false,
    hideCostPrice: false,
    maxDiscountPercent: 0,
  },
};

export const RoleBuilderModal: React.FC<RoleBuilderModalProps> = ({
  isOpen,
  onClose,
  roleToEdit,
  onSaveRole,
  onToast,
}) => {
  const { settings, currentUser } = useErp();
  const isLight = settings?.themeMode === 'light';

  // Role details
  const [roleTitle, setRoleTitle] = useState('');
  const [roleTier, setRoleTier] = useState('Tier 2 • Operational Lead');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

  // Security guardrails
  const [notifyOnDelete, setNotifyOnDelete] = useState(true);
  const [hideCostPrice, setHideCostPrice] = useState(false);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(10);

  // Per-module CRUD permissions
  const [modulePerms, setModulePerms] = useState<Record<string, ModulePermissionRule>>(() => {
    const init: Record<string, ModulePermissionRule> = {};
    BUILDER_MODULES.forEach((m) => {
      init[m.id] = { view: false, create: false, edit: false, delete: false };
    });
    return init;
  });

  // Reports selection
  const [reportSelectionMode, setReportSelectionMode] = useState<'none' | 'all' | 'specific'>('specific');
  const [allowedReports, setAllowedReports] = useState<string[]>(['stock_report']);

  // Initialize or reset when opened or roleToEdit changes
  useEffect(() => {
    if (roleToEdit) {
      setRoleTitle(roleToEdit.title);
      setRoleTier(roleToEdit.tier || 'Tier 2 • Operational Lead');
      setRoleDesc(roleToEdit.description || '');
      setNotifyOnDelete(roleToEdit.notifyOnDelete !== false);
      setHideCostPrice(Boolean(roleToEdit.hideCostPrice));
      setMaxDiscountPercent(roleToEdit.maxDiscountPercent ?? 10);
      setAllowedReports(roleToEdit.allowedReports || ['stock_report']);

      // Initialize modulePerms from roleToEdit
      const perms: Record<string, ModulePermissionRule> = {};
      BUILDER_MODULES.forEach((m) => {
        if (roleToEdit.modulePermissions && roleToEdit.modulePermissions[m.id]) {
          perms[m.id] = { ...roleToEdit.modulePermissions[m.id] };
        } else {
          const isAllowed = roleToEdit.allowedModules?.includes(m.id);
          perms[m.id] = {
            view: Boolean(isAllowed),
            create: Boolean(isAllowed),
            edit: Boolean(isAllowed),
            delete: Boolean(isAllowed && roleToEdit.roleKey !== 'cashier'),
          };
        }
      });
      setModulePerms(perms);
      setSelectedTemplate('custom');
    } else {
      // Default to Cashier template for easy demonstration of the user's specific scenario!
      applyTemplate('cashier_custom');
    }
  }, [roleToEdit, isOpen]);

  const applyTemplate = (tmplKey: string) => {
    setSelectedTemplate(tmplKey);
    const tmpl = STARTER_TEMPLATES[tmplKey];
    if (tmpl) {
      if (!roleToEdit) {
        setRoleTitle(tmpl.name);
        setRoleTier('Tier 3 • Counter Operations');
        setRoleDesc(tmpl.description);
      }
      setNotifyOnDelete(tmpl.notifyOnDelete);
      setHideCostPrice(tmpl.hideCostPrice);
      setMaxDiscountPercent(tmpl.maxDiscountPercent);
      setAllowedReports(tmpl.allowedReports);

      const perms: Record<string, ModulePermissionRule> = {};
      BUILDER_MODULES.forEach((m) => {
        perms[m.id] = tmpl.modules[m.id]
          ? { ...tmpl.modules[m.id] }
          : { view: false, create: false, edit: false, delete: false };
      });
      setModulePerms(perms);
    } else {
      // Custom blank
      const blank: Record<string, ModulePermissionRule> = {};
      BUILDER_MODULES.forEach((m) => {
        blank[m.id] = { view: false, create: false, edit: false, delete: false };
      });
      setModulePerms(blank);
    }
  };

  const getModuleState = (modId: string): 'none' | 'view' | 'full' | 'custom' => {
    const p = modulePerms[modId];
    if (!p || (!p.view && !p.create && !p.edit && !p.delete)) return 'none';
    if (p.view && p.create && p.edit && p.delete) return 'full';
    if (p.view && !p.create && !p.edit && !p.delete) return 'view';
    return 'custom';
  };

  const setModulePreset = (modId: string, state: 'none' | 'view' | 'full' | 'custom') => {
    setModulePerms((prev) => {
      const copy = { ...prev };
      if (state === 'none') {
        copy[modId] = { view: false, create: false, edit: false, delete: false };
      } else if (state === 'view') {
        copy[modId] = { view: true, create: false, edit: false, delete: false };
      } else if (state === 'full') {
        copy[modId] = { view: true, create: true, edit: true, delete: true };
      } else {
        // Custom: default to view + create
        copy[modId] = { view: true, create: true, edit: false, delete: false };
      }
      return copy;
    });
  };

  const toggleModuleAction = (modId: string, action: keyof ModulePermissionRule) => {
    setModulePerms((prev) => {
      const current = prev[modId] || { view: false, create: false, edit: false, delete: false };
      const updated = { ...current, [action]: !current[action] };
      // If create, edit, or delete is enabled, automatically ensure view is enabled
      if ((updated.create || updated.edit || updated.delete) && !updated.view) {
        updated.view = true;
      }
      return { ...prev, [modId]: updated };
    });
  };

  const toggleReport = (repId: string) => {
    setAllowedReports((prev) =>
      prev.includes(repId) ? prev.filter((id) => id !== repId) : [...prev, repId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) {
      alert('Please enter a role name.');
      return;
    }

    const key = roleToEdit
      ? roleToEdit.roleKey
      : roleTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Generate allowed modules list (any module where view is true)
    const allowedMods: ErpModuleId[] = [];
    BUILDER_MODULES.forEach((m) => {
      if (modulePerms[m.id]?.view) {
        allowedMods.push(m.id);
      }
    });

    // Always include dashboard
    if (!allowedMods.includes('dashboard')) {
      allowedMods.unshift('dashboard');
    }

    const savedRole: CustomRoleDefinition = {
      id: roleToEdit?.id || `role_${Date.now()}`,
      roleKey: key,
      title: roleTitle.trim(),
      tier: roleTier,
      badgeColor: roleToEdit?.badgeColor || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      description: roleDesc.trim() || `Configured access profile for ${roleTitle.trim()}.`,
      allowedModules: allowedMods,
      isCustom: true,
      notifyOnDelete: notifyOnDelete,
      hideCostPrice: hideCostPrice,
      maxDiscountPercent: Number(maxDiscountPercent) || 0,
      allowedReports: modulePerms['reports']?.view ? allowedReports : [],
      modulePermissions: modulePerms,
    };

    onSaveRole(savedRole);
    onToast?.(`Role "${roleTitle.trim()}" saved with configured permissions.`);
    onClose();
  };

  if (!isOpen) return null;

  // Compute what modules are active for the live simulator preview
  const activeModulesForPreview = BUILDER_MODULES.filter((m) => modulePerms[m.id]?.view);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div
        className={`w-full max-w-5xl my-auto rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
            : 'bg-slate-900 border-slate-800 text-white shadow-black/60'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  {roleToEdit ? `Edit Role: ${roleToEdit.title}` : 'Role Builder & Granular Access Engine'}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  Easy Setup
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Configure menus, module actions (View, Create, Edit, Delete), sub-reports, and security guardrails in seconds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isLight
                ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 custom-scrollbar">
          {/* SECTION 1: Role Identity & Starter Templates */}
          <div
            className={`p-6 rounded-3xl border space-y-5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-indigo-500" />
                  <span>1. Role Identity & Quick-Start Template</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pick a starter preset below or type a custom role title to populate typical permissions automatically.
                </p>
              </div>

              {/* Starter Presets Picker */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Quick Template:</span>
                <select
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className={`text-xs font-bold rounded-xl px-3 py-1.5 border transition cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="custom">Blank Canvas (Custom)</option>
                  <option value="cashier_custom">🛒 Cashier & Counter Sales (Recommended)</option>
                  <option value="inventory_specialist">📦 Inventory & Stock Supervisor</option>
                  <option value="sales_executive">💼 Sales & Front-Desk Executive</option>
                  <option value="finance_accountant">📊 Finance & Accounts Clerk</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Role Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cashier & Front Desk"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Authorization Level / Tier
                </label>
                <select
                  value={roleTier}
                  onChange={(e) => setRoleTier(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="Tier 2 • Operational Lead">Tier 2 • Operational Lead</option>
                  <option value="Tier 3 • Counter Operations">Tier 3 • Front-Line Operations</option>
                  <option value="Tier 4 • Basic Clerk">Tier 4 • Entry / Basic Assistant</option>
                  <option value="Specialized Consultant">Specialized Custom Role</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Role Notes / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handles POS register, creates customers, checks stock"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Module Permissions Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>2. Module Navigation & Operational Access</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select <strong className="text-indigo-500">No Access</strong>, <strong className="text-blue-500">View Only</strong>, <strong className="text-emerald-500">Full Access</strong>, or click <strong className="text-purple-500">Custom</strong> to pick exact actions (e.g. View + Create only).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allNone: Record<string, ModulePermissionRule> = {};
                    BUILDER_MODULES.forEach((m) => (allNone[m.id] = { view: false, create: false, edit: false, delete: false }));
                    setModulePerms(allNone);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allFull: Record<string, ModulePermissionRule> = {};
                    BUILDER_MODULES.forEach((m) => (allFull[m.id] = { view: true, create: true, edit: true, delete: true }));
                    setModulePerms(allFull);
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition"
                >
                  Grant All Modules
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BUILDER_MODULES.map((mod) => {
                const ModIcon = mod.icon;
                const state = getModuleState(mod.id);
                const current = modulePerms[mod.id] || { view: false, create: false, edit: false, delete: false };

                return (
                  <div
                    key={mod.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      state === 'none'
                        ? isLight
                          ? 'bg-slate-50/70 border-slate-200/80 opacity-75 hover:opacity-100'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-75 hover:opacity-100'
                        : state === 'full'
                        ? isLight
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                          : 'bg-emerald-950/20 border-emerald-800/80'
                        : isLight
                        ? 'bg-indigo-50/40 border-indigo-300 shadow-2xs'
                        : 'bg-indigo-950/20 border-indigo-800/80'
                    }`}
                  >
                    <div>
                      {/* Module Title & Icon */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl border shrink-0 ${
                            state === 'none'
                              ? isLight
                                ? 'bg-slate-200/60 text-slate-500 border-slate-300'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                              : state === 'full'
                              ? isLight
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
                              : isLight
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                              : 'bg-indigo-900/40 text-indigo-300 border-indigo-700'
                          }`}
                        >
                          <ModIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-xs truncate">{mod.label}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* 4-State Preset Selector Buttons */}
                      <div className="grid grid-cols-4 gap-1 mt-3.5 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/70">
                        <button
                          type="button"
                          onClick={() => setModulePreset(mod.id, 'none')}
                          className={`py-1 text-[10px] font-black rounded-lg transition ${
                            state === 'none'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          onClick={() => setModulePreset(mod.id, 'view')}
                          className={`py-1 text-[10px] font-black rounded-lg transition ${
                            state === 'view'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setModulePreset(mod.id, 'full')}
                          className={`py-1 text-[10px] font-black rounded-lg transition ${
                            state === 'full'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          Full
                        </button>
                        <button
                          type="button"
                          onClick={() => setModulePreset(mod.id, 'custom')}
                          className={`py-1 text-[10px] font-black rounded-lg transition ${
                            state === 'custom'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          Custom ⚙️
                        </button>
                      </div>
                    </div>

                    {/* Fine-Tuning Action Badges (Always active when custom, or expandable) */}
                    {state !== 'none' && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="font-bold text-slate-400">Allowed Actions:</span>
                          <span className="text-[9px] font-semibold text-indigo-500">Click to toggle</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {(['view', 'create', 'edit', 'delete'] as const).map((act) => {
                            const isAllowed = Boolean(current[act]);
                            return (
                              <button
                                key={act}
                                type="button"
                                onClick={() => toggleModuleAction(mod.id, act)}
                                className={`py-1 px-1 rounded-lg text-[9px] font-extrabold uppercase transition border flex items-center justify-center gap-0.5 ${
                                  isAllowed
                                    ? act === 'delete'
                                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-2xs'
                                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-2xs'
                                    : 'bg-slate-100/60 dark:bg-slate-850 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                                }`}
                              >
                                {isAllowed ? <Check className="w-2.5 h-2.5" /> : null}
                                <span>{act}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Sub-Reports Selection (Only if Reports Module is Enabled) */}
          {modulePerms['reports']?.view && (
            <div
              className={`p-6 rounded-3xl border space-y-4 animate-fadeIn ${
                isLight ? 'bg-indigo-50/40 border-indigo-200' : 'bg-indigo-950/20 border-indigo-900/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold flex items-center gap-2">
                      <span>3. Granular Reports Access Control</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        Confidential Protection
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose specifically which reports this role can see. Keep sensitive Profit & Loss or Tax audits restricted to administrators.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAllowedReports(['stock_report'])}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
                  >
                    📦 Stock Report Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowedReports(AVAILABLE_REPORTS.map((r) => r.id))}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition cursor-pointer"
                  >
                    All Reports
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {AVAILABLE_REPORTS.map((rep) => {
                  const isChecked = allowedReports.includes(rep.id);
                  return (
                    <div
                      key={rep.id}
                      onClick={() => toggleReport(rep.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isChecked
                          ? isLight
                            ? 'bg-white border-indigo-400 text-indigo-950 shadow-2xs'
                            : 'bg-indigo-900/30 border-indigo-600 text-white'
                          : isLight
                          ? 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{rep.label}</p>
                          <span className="text-[9px] uppercase font-bold text-slate-400">
                            {rep.category}
                          </span>
                        </div>
                      </div>

                      {rep.adminSensitive && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                          Sensitive
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: Universal Security Guardrails & Admin Alerts */}
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              isLight ? 'bg-amber-50/30 border-amber-200' : 'bg-amber-950/10 border-amber-900/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <span>4. Peace-of-Mind Security & High-Risk Safeguards</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Real-Time Safety
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Protect business profits and track critical operational actions automatically.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Guardrail 1: Real-time Delete Alerts */}
              <div
                onClick={() => setNotifyOnDelete(!notifyOnDelete)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                  notifyOnDelete
                    ? isLight
                      ? 'bg-rose-50/70 border-rose-300 text-slate-900 shadow-2xs'
                      : 'bg-rose-950/20 border-rose-800 text-white'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Admin Delete Alerts</span>
                    </span>
                    <div
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                        notifyOnDelete ? 'bg-rose-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Instantly notifies Supreme Admin & Super Admin with an in-app security alert whenever anyone with this role deletes a sale, invoice, or record.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-rose-500">
                  {notifyOnDelete ? '✓ Enabled (Admins get instant alerts)' : '○ Disabled'}
                </span>
              </div>

              {/* Guardrail 2: Cost Price Privacy Shield */}
              <div
                onClick={() => setHideCostPrice(!hideCostPrice)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                  hideCostPrice
                    ? isLight
                      ? 'bg-indigo-50/70 border-indigo-300 text-slate-900 shadow-2xs'
                      : 'bg-indigo-950/20 border-indigo-800 text-white'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <EyeOff className="w-4 h-4" />
                      <span>Hide Cost & Margins</span>
                    </span>
                    <div
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                        hideCostPrice ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Masks purchase wholesale cost prices and store profit margins. The employee will only see the selling price and physical stock quantities.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-indigo-500">
                  {hideCostPrice ? '✓ Wholesale Costs Hidden' : '○ Cost Visible'}
                </span>
              </div>

              {/* Guardrail 3: Max Sales Discount Limit */}
              <div
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Percent className="w-4 h-4" />
                      <span>Max Discount Limit</span>
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {maxDiscountPercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Caps maximum cart or line-item discount the employee can grant at the checkout register without supervisor approval.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={maxDiscountPercent}
                    onChange={(e) => setMaxDiscountPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Live Navigation Simulator / Confidence Preview */}
          <div
            className={`p-5 rounded-3xl border space-y-3 ${
              isLight ? 'bg-slate-900 text-white border-slate-800 shadow-xl' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Live Preview: What this Employee Will See in Navigation
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {activeModulesForPreview.length} accessible areas
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {activeModulesForPreview.map((m) => {
                const MIcon = m.icon;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 animate-fadeIn"
                  >
                    <MIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{m.label}</span>
                  </div>
                );
              })}

              {/* Show allowed sub-reports pill if reports active */}
              {modulePerms['reports']?.view && allowedReports.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Reports: {allowedReports.length === 1 ? 'Stock Report Only' : `${allowedReports.length} Reports`}
                  </span>
                </div>
              )}

              {activeModulesForPreview.length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  No modules enabled yet. Pick modules above to grant access.
                </span>
              )}
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{roleToEdit ? 'Save Role Changes' : 'Create & Activate Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
