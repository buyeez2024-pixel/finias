import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { GRANULAR_CAPABILITIES } from '../../data/granularCapabilities';
import {
  User,
  UserRole,
  ErpModuleId,
  RolePermissions,
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
} from 'lucide-react';

export interface CustomRoleDefinition {
  id: string;
  roleKey: string;
  title: string;
  tier: string;
  badgeColor: string;
  description: string;
  allowedModules: ErpModuleId[];
  isCustom?: boolean;
}

interface UserRolePermissionsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string) => void;
  customRoles?: CustomRoleDefinition[];
  onAddCustomRole?: (role: CustomRoleDefinition) => void;
  onUpdateCustomRole?: (role: CustomRoleDefinition) => void;
  onDeleteCustomRole?: (roleId: string) => void;
}

interface ModuleMeta {
  id: ErpModuleId;
  label: string;
  category: 'Core' | 'Operations' | 'Finance' | 'System';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_MODULES: ModuleMeta[] = [
  {
    id: 'dashboard',
    label: 'Dashboard / Home',
    category: 'Core',
    description: 'Executive KPI metrics, revenue charts, and operational summary.',
    icon: LayoutDashboard,
  },
  {
    id: 'pos',
    label: 'Point of Sale (POS)',
    category: 'Operations',
    description: 'High-speed checkout terminal, barcode scanner, and cash register.',
    icon: ShoppingCart,
  },
  {
    id: 'inventory',
    label: 'Products & Inventory',
    category: 'Operations',
    description: 'SKU catalogs, stock audits, adjustments, and branch transfers.',
    icon: Boxes,
  },
  {
    id: 'purchases',
    label: 'Purchases & Inward',
    category: 'Operations',
    description: 'Supplier POs, goods receiving, inward stock billing & payments.',
    icon: Truck,
  },
  {
    id: 'sales',
    label: 'Sales & Invoices',
    category: 'Operations',
    description: 'Invoice register, customer receipts, and sales transaction logs.',
    icon: Receipt,
  },
  {
    id: 'contacts',
    label: 'Contacts (CRM)',
    category: 'Core',
    description: 'Customer profiles, supplier directories, and ledger credit limits.',
    icon: Users,
  },
  {
    id: 'expenses',
    label: 'Expenses',
    category: 'Finance',
    description: 'Operational store overheads, petty cash, and payment accounts.',
    icon: DollarSign,
  },
  {
    id: 'reports',
    label: 'Reports & P&L',
    category: 'Finance',
    description: 'Profit & loss statements, stock valuation, tax audits & analytics.',
    icon: BarChart3,
  },
  {
    id: 'ai',
    label: 'AI Business Intelligence',
    category: 'System',
    description: 'Gemini demand forecasting, profit insights, and anomaly detection.',
    icon: Sparkles,
  },
  {
    id: 'user_menu',
    label: 'User Profile & Menu',
    category: 'System',
    description: 'Access to personal profile, preferences, and user-specific settings.',
    icon: UserCog,
  },
  {
    id: 'settings',
    label: 'Settings',
    category: 'System',
    description: 'Tax configuration, company profile, and application preferences.',
    icon: SettingsIcon,
  },
  {
    id: 'security',
    label: 'Security',
    category: 'System',
    description: 'Employee access permissions, roles, and security policies.',
    icon: Shield,
  },
  {
    id: 'system_updates',
    label: 'System Updates',
    category: 'System',
    description: 'Application updates, maintenance logs, and version patches.',
    icon: RefreshCw,
  },
  {
    id: 'laravel_arch',
    label: 'Laravel Architecture',
    category: 'System',
    description: 'Backend architectural specifications, REST API routes, and schema.',
    icon: Code2,
  },
];

const BASE_PRESET_ROLES: CustomRoleDefinition[] = [
  {
    id: 'admin',
    roleKey: 'admin',
    title: 'Super Admin',
    tier: 'Tier 1 • Master Authority',
    badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    description: 'Unrestricted master access to all ERP modules, financial ledgers, settings, and staff permissions.',
    allowedModules: ['dashboard', 'pos', 'inventory', 'purchases', 'sales', 'contacts', 'expenses', 'reports', 'ai', 'settings', 'laravel_arch'],
  },
  {
    id: 'supreme_admin',
    roleKey: 'supreme_admin',
    title: 'Supreme Admin',
    tier: 'Tier 1 • Supreme Master Authority',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Supreme unrestricted master authority with absolute access across the entire application ecosystem, system settings, and user hierarchies.',
    allowedModules: ['dashboard', 'pos', 'inventory', 'purchases', 'sales', 'contacts', 'expenses', 'reports', 'ai', 'settings', 'laravel_arch', 'user_menu'],
  },
  {
    id: 'manager',
    roleKey: 'manager',
    title: 'Store Manager',
    tier: 'Tier 2 • Operational Lead',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    description: 'Oversees daily sales, store inventory, purchasing POs, expenses, CRM contacts, and standard reports.',
    allowedModules: ['dashboard', 'pos', 'inventory', 'purchases', 'sales', 'contacts', 'expenses', 'reports'],
  },
  {
    id: 'inventory_manager',
    roleKey: 'inventory_manager',
    title: 'Inventory Specialist',
    tier: 'Tier 2 • Supply & Stock',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Manages catalog items, stock audits, warehouse transfers, and purchase inward deliveries.',
    allowedModules: ['dashboard', 'inventory', 'purchases', 'reports'],
  },
  {
    id: 'accountant',
    roleKey: 'accountant',
    title: 'Finance & Accountant',
    tier: 'Tier 2 • Ledger & Tax',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    description: 'Audits expenses, bank balances, financial P&L, sales journals, and tax liabilities.',
    allowedModules: ['dashboard', 'sales', 'expenses', 'reports', 'contacts'],
  },
  {
    id: 'cashier',
    roleKey: 'cashier',
    title: 'Cashier & POS Operator',
    tier: 'Tier 3 • Terminal Checkout',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    description: 'Handles point-of-sale checkout, customer registers, instant payments, receipt printing, and daily till balance.',
    allowedModules: ['dashboard', 'pos', 'sales', 'contacts'],
  },
];

export const UserRolePermissionsModal: React.FC<UserRolePermissionsModalProps> = ({
  user,
  isOpen,
  onClose,
  onToast,
  customRoles: propsCustomRoles = [],
  onAddCustomRole,
  onUpdateCustomRole,
  onDeleteCustomRole,
}) => {
  const {
    rolePermissions,
    customRoles: ctxCustomRoles = [],
    addCustomRole,
    updateCustomRole,
    deleteCustomRole,
    updateRolePermissions,
    updateUser,
    updateUserRole,
    locations,
    settings,
    currentUser,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  const [activeSubTab, setActiveSubTab] = useState<'assign' | 'create_role' | 'overrides' | 'locations'>('assign');
  
  // Selected user role state
  const [selectedRole, setSelectedRole] = useState<UserRole>('cashier');
  const [userAllowedModules, setUserAllowedModules] = useState<ErpModuleId[]>([]);
  const [allowSoftwareLogin, setAllowSoftwareLogin] = useState<boolean>(true);
  const [isActiveStatus, setIsActiveStatus] = useState<boolean>(true);
  const [salesCommissionPercent, setSalesCommissionPercent] = useState<string>('0');
  const [maxSalesDiscount, setMaxSalesDiscount] = useState<string>('0');
  const [accessLocations, setAccessLocations] = useState<string[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [userCustomPermissions, setUserCustomPermissions] = useState<Record<string, boolean>>({});
  
  // Create / Edit custom role state
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleTier, setNewRoleTier] = useState('Tier 2 • Operational Lead');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleModules, setNewRoleModules] = useState<ErpModuleId[]>(['pos', 'sales', 'contacts']);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const activeCustomRoles = propsCustomRoles.length > 0 ? propsCustomRoles : ctxCustomRoles;

  // Available roles combine base presets and any custom roles
  const allRolesList: CustomRoleDefinition[] = [
    ...BASE_PRESET_ROLES.filter(r => r.roleKey !== 'supreme_admin' || currentUser?.role === 'supreme_admin'),
    ...activeCustomRoles,
  ];

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'supreme_admin' && currentUser?.role !== 'supreme_admin') {
        onToast?.('Only Supreme Admin can manage or modify a Supreme Admin user.');
        onClose();
        return;
      }

      if ((user.id === currentUser?.id || user.role === 'admin' || user.role === 'super_admin') && currentUser?.role !== 'supreme_admin') {
        onToast?.('Super Admin cannot edit their own or Super Admin Role Permissions & Module Access Control.');
        onClose();
        return;
      }

      setSelectedRole(user.role || 'cashier');
      
      const currentRolePerms = rolePermissions[user.role]?.allowedModules || 
        BASE_PRESET_ROLES.find(r => r.roleKey === user.role)?.allowedModules || 
        ['pos', 'sales'];
        
      setUserAllowedModules(user.customAllowedModules || currentRolePerms);
      setAllowSoftwareLogin(user.allowLogin !== false);
      setIsActiveStatus(user.status !== 'suspended');
      setSalesCommissionPercent(String(user.salesCommissionPercent || '0'));
      setMaxSalesDiscount(String(user.maxSalesDiscount || '0'));
      setAccessLocations(user.accessLocations || (user.locationId ? [user.locationId] : locations.map(l => l.id)));
      setLocationId(user.locationId || locations[0]?.id || '');
      setUserCustomPermissions(user.customPermissions || {});
    }
  }, [user, rolePermissions, locations]);

  // When role changes, if not using custom user overrides, update the preview of allowed modules
  const handleRoleSelect = (roleKey: string) => {
    setSelectedRole(roleKey as UserRole);
    const matched = allRolesList.find(r => r.roleKey === roleKey);
    if (matched) {
      const defaultMods = rolePermissions[roleKey]?.allowedModules || matched.allowedModules;
      setUserAllowedModules(defaultMods);
    }
  };

  const handleToggleUserModule = (modId: ErpModuleId) => {
    if (selectedRole === 'supreme_admin') {
      onToast?.('Supreme Admin role automatically retains full access to all system modules.');
      return;
    }
    if ((user?.id === currentUser?.id || user?.role === 'admin' || selectedRole === 'admin') && currentUser?.role !== 'supreme_admin') {
      onToast?.('Super Admin cannot edit Super Admin Role Permissions & Module Access Control.');
      return;
    }
    setUserAllowedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleToggleNewRoleModule = (modId: ErpModuleId) => {
    setNewRoleModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleToggleBranch = (branchId: string) => {
    setAccessLocations(prev =>
      prev.includes(branchId)
        ? prev.length > 1 ? prev.filter(id => id !== branchId) : prev
        : [...prev, branchId]
    );
  };

  const handleCreateOrUpdateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) {
      alert('Please enter a valid role title');
      return;
    }

    const generatedKey = newRoleTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    if ((generatedKey.includes('supreme') || newRoleTitle.toLowerCase().includes('supreme')) && currentUser?.role !== 'supreme_admin') {
      onToast?.('Only Supreme Admin can create or configure Supreme Admin roles.');
      return;
    }
    
    if (editingRoleId) {
      // Updating custom role
      const updated: CustomRoleDefinition = {
        id: editingRoleId,
        roleKey: generatedKey,
        title: newRoleTitle.trim(),
        tier: newRoleTier,
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        description: newRoleDesc.trim() || `Custom business role tailored for ${newRoleTitle.trim()}.`,
        allowedModules: newRoleModules,
        isCustom: true,
      };

      if (onUpdateCustomRole) {
        onUpdateCustomRole(updated);
      } else {
        updateCustomRole(updated);
      }
      updateRolePermissions(generatedKey as any, { allowedModules: newRoleModules });
      onToast?.(`Updated custom role: ${newRoleTitle}`);
      setEditingRoleId(null);
    } else {
      // Creating new role
      const newRoleDef: CustomRoleDefinition = {
        id: `role_${Date.now()}`,
        roleKey: generatedKey,
        title: newRoleTitle.trim(),
        tier: newRoleTier,
        badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        description: newRoleDesc.trim() || `Custom enterprise role configured for ${newRoleTitle.trim()}.`,
        allowedModules: newRoleModules,
        isCustom: true,
      };

      if (onAddCustomRole) {
        onAddCustomRole(newRoleDef);
      } else {
        addCustomRole(newRoleDef);
      }
      updateRolePermissions(generatedKey as any, { allowedModules: newRoleModules });
      
      // Auto assign newly created role to the currently selected user!
      setSelectedRole(generatedKey as UserRole);
      setUserAllowedModules(newRoleModules);
      onToast?.(`Created custom role "${newRoleTitle}" & assigned to ${user?.name || 'user'}!`);
    }

    // Reset form and return to assign tab
    setNewRoleTitle('');
    setNewRoleDesc('');
    setNewRoleModules(['pos', 'sales', 'contacts']);
    setActiveSubTab('assign');
  };

  const startEditCustomRole = (role: CustomRoleDefinition) => {
    setEditingRoleId(role.id ? role.id : null);
    setNewRoleTitle(role.title);
    setNewRoleTier(role.tier);
    setNewRoleDesc(role.description);
    setNewRoleModules(role.allowedModules || []);
    setActiveSubTab('create_role');
  };

  const handleSaveAll = () => {
    if (!user) return;

    // Apply role update & custom user overrides
    const updatedUserPayload: Partial<User> = {
      role: selectedRole,
      allowLogin: allowSoftwareLogin,
      status: isActiveStatus ? 'active' : 'suspended',
      salesCommissionPercent: Number(salesCommissionPercent) || 0,
      maxSalesDiscount: Number(maxSalesDiscount) || 0,
      accessLocations: accessLocations,
      locationId: locationId || accessLocations[0] || locations[0]?.id,
      customAllowedModules: userAllowedModules,
      customPermissions: userCustomPermissions,
    };

    updateUser(user.id, updatedUserPayload);
    updateUserRole(user.id, selectedRole);

    const matchedRole = allRolesList.find(r => r.roleKey === selectedRole);
    const roleTitle = matchedRole?.title || selectedRole;

    onToast?.(`Successfully updated role & access permissions for ${user.name} to "${roleTitle}"!`);
    onClose();
  };

  if (!isOpen || !user) return null;

  const currentRoleMeta = allRolesList.find(r => r.roleKey === selectedRole) || {
    id: selectedRole,
    roleKey: selectedRole,
    title: selectedRole.replace('_', ' ').toUpperCase(),
    tier: 'Custom Role',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    description: 'Custom designated role privileges.',
    allowedModules: userAllowedModules,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
            : 'bg-slate-900 border-slate-800 text-white shadow-black/60'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/40 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg ring-2 ring-indigo-500/30 shrink-0">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black">{user.name}</h3>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    isLight && (currentRoleMeta.roleKey === 'supreme_admin' || currentRoleMeta.roleKey === 'admin')
                      ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                      : `px-2 py-0.5 rounded-full border ${currentRoleMeta.badgeColor}`
                  }`}
                >
                  {currentRoleMeta.title}
                </span>
                {user.username && (
                  <span className={`text-[11px] font-mono ${
                    isLight
                      ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                      : 'text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-md'
                  }`}>
                    @{user.username}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {user.email || 'No email registered'} • Manage role assignments, create custom roles, and fine-tune user privileges.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`transition shrink-0 self-end sm:self-center cursor-pointer ${
              isLight
                ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex items-center gap-2 overflow-x-auto shrink-0 ${
            isLight
              ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
              : 'px-5 sm:px-6 pt-3 pb-2 border-b bg-slate-950/40 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveSubTab('assign')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeSubTab === 'assign'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                : isLight
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. Assign Role ({allRolesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRoleId(null);
              setNewRoleTitle('');
              setNewRoleDesc('');
              setActiveSubTab('create_role');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeSubTab === 'create_role'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                : isLight
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>2. + Add New Role</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('overrides')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeSubTab === 'overrides'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                : isLight
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. User Privileges & Modules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('locations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeSubTab === 'locations'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                : isLight
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>4. Store Locations ({accessLocations.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ASSIGN ROLE */}
          {activeSubTab === 'assign' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <span>Select Role Assignment for {user.name}</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Click any role card below to apply it to this employee. You can also edit custom roles or create new roles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingRoleId(null);
                    setNewRoleTitle('');
                    setActiveSubTab('create_role');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Role</span>
                </button>
              </div>

              {/* Roles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {allRolesList.map((r) => {
                  const isSelected = selectedRole === r.roleKey;
                  const isCustom = r.isCustom || !['admin', 'supreme_admin', 'manager', 'inventory_manager', 'accountant', 'cashier'].includes(r.roleKey);

                  return (
                    <div
                      key={r.id || r.roleKey}
                      onClick={() => handleRoleSelect(r.roleKey)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                        isSelected
                          ? isLight
                            ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                            : 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                          : isLight
                          ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{r.title}</span>
                            {isCustom && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Custom
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                            {r.tier}
                          </span>
                        </div>

                        <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {r.description}
                        </p>
                      </div>

                      {/* Bottom Role Info & Actions */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{r.allowedModules?.length || 0} Modules Granted</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isCustom && r.roleKey !== 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditCustomRole({
                                  ...r,
                                  id: '',
                                  title: `${r.title} (Custom)`,
                                  description: r.description,
                                  isCustom: true,
                                });
                              }}
                              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px] font-bold"
                              title="Customize this role template"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Customize</span>
                            </button>
                          )}
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditCustomRole(r);
                              }}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Edit role template"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {isCustom && onDeleteCustomRole && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete custom role "${r.title}"?`)) {
                                  onDeleteCustomRole(r.id);
                                  if (selectedRole === r.roleKey) {
                                    setSelectedRole('cashier');
                                  }
                                }
                              }}
                              className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white transition"
                              title="Delete custom role"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}

                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                                : 'bg-slate-300 dark:bg-slate-800 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE / EDIT CUSTOM ROLE */}
          {activeSubTab === 'create_role' && (
            <form onSubmit={handleCreateOrUpdateCustomRole} className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-black flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>{editingRoleId ? 'Edit Custom Role' : 'Create & Register New Custom Role'}</span>
                  </h4>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Define custom job roles (e.g., Floor Lead, Branch Auditor, Senior Cashier) with dedicated module access.
                  </p>
                </div>

                {editingRoleId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoleId(null);
                      setNewRoleTitle('');
                      setNewRoleDesc('');
                      setActiveSubTab('assign');
                    }}
                    className="text-xs text-rose-400 hover:underline font-bold"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Role Title / Job Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Shift Supervisor, Branch Auditor..."
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none border transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                    }`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Official job designation name for this role</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Hierarchy Tier & Level
                  </label>
                  <select
                    value={newRoleTier}
                    onChange={(e) => setNewRoleTier(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none border transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                    }`}
                  >
                    <option value="Tier 1 • Master Authority">Tier 1 • Master Authority</option>
                    <option value="Tier 2 • Operational Lead">Tier 2 • Operational Lead</option>
                    <option value="Tier 3 • Staff Operator">Tier 3 • Staff Operator</option>
                    <option value="Tier 4 • Restricted Guest">Tier 4 • Restricted Guest</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">Classification level for access matrix</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Role Description & Operational Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g., Responsible for handling daily shift closures and store audit checks."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">Brief summary of operational responsibilities</p>
              </div>

              {/* Module Access Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-400">
                    Accessible System Modules for This Role ({newRoleModules.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRoleModules(ALL_MODULES.map(m => m.id))}
                      className="text-[11px] text-indigo-400 hover:underline font-bold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setNewRoleModules(['pos', 'sales'])}
                      className="text-[11px] text-slate-400 hover:underline"
                    >
                      Reset Basic
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  {ALL_MODULES.map((mod) => {
                    const isChecked = newRoleModules.includes(mod.id);
                    const ModIcon = mod.icon;

                    return (
                      <label
                        key={mod.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleNewRoleModule(mod.id)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <ModIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-xs font-bold truncate">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('assign')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingRoleId ? 'Update Role Definition' : 'Save Role & Assign to User'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: USER-SPECIFIC OVERRIDES */}
          {activeSubTab === 'overrides' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h4 className="text-sm font-extrabold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Individual User Privileges for {user.name}</span>
                </h4>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Customize explicit privileges and module access rules that apply specifically to this user.
                </p>
              </div>

              {/* Status & Login Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-white">Active Account Status</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Allows employee to operate within the system</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActiveStatus}
                    onChange={(e) => setIsActiveStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-white">Allow Software Login</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Permits signing in via username and password</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowSoftwareLogin}
                    onChange={(e) => setAllowSoftwareLogin(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>

              {/* Commission & Discounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Sales Commission Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={salesCommissionPercent}
                      onChange={(e) => setSalesCommissionPercent(e.target.value)}
                      className={`w-full rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none border transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Direct commission earned per closed invoice</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Max Allowed Sales Discount Ceiling (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={maxSalesDiscount}
                      onChange={(e) => setMaxSalesDiscount(e.target.value)}
                      className={`w-full rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none border transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Highest discount this user is allowed to apply at checkout</p>
                </div>
              </div>

              {/* Explicit Module Access Override Matrix */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold text-slate-400">
                    Individual Module Access Permissions ({userAllowedModules.length} / {ALL_MODULES.length} Granted)
                  </label>
                  {(selectedRole === 'supreme_admin') && (
                    <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Supreme Admin has full authority
                    </span>
                  )}
                </div>

                {/* Quick Action Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!userAllowedModules.includes('reports')) {
                        setUserAllowedModules(prev => [...prev, 'reports']);
                        onToast?.(`Granted Reports & P&L access to ${user.name}!`);
                      }
                    }}
                    className="text-[10px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-500/30 transition cursor-pointer active:scale-95"
                  >
                    + Grant Reports Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!userAllowedModules.includes('inventory')) {
                        setUserAllowedModules(prev => [...prev, 'inventory']);
                        onToast?.(`Granted Inventory access to ${user.name}!`);
                      }
                    }}
                    className="text-[10px] font-bold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 px-2.5 py-1 rounded-lg border border-sky-500/30 transition cursor-pointer active:scale-95"
                  >
                    + Grant Inventory Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!userAllowedModules.includes('contacts')) {
                        setUserAllowedModules(prev => [...prev, 'contacts']);
                        onToast?.(`Granted Contacts CRM access to ${user.name}!`);
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer active:scale-95"
                  >
                    + Grant Contacts Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!userAllowedModules.includes('expenses')) {
                        setUserAllowedModules(prev => [...prev, 'expenses']);
                        onToast?.(`Granted Expenses access to ${user.name}!`);
                      }
                    }}
                    className="text-[10px] font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 px-2.5 py-1 rounded-lg border border-purple-500/30 transition cursor-pointer active:scale-95"
                  >
                    + Grant Expenses Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaultMods = rolePermissions[selectedRole]?.allowedModules || BASE_PRESET_ROLES.find(r => r.roleKey === selectedRole)?.allowedModules || ['pos', 'sales'];
                      setUserAllowedModules(defaultMods);
                      onToast?.('Reset permissions to base role defaults.');
                    }}
                    className="text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer active:scale-95"
                  >
                    Reset Role Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  {ALL_MODULES.map((mod) => {
                    const isGranted = selectedRole === 'supreme_admin' || userAllowedModules.includes(mod.id);
                    const ModIcon = mod.icon;
                    const baseMods = rolePermissions[selectedRole]?.allowedModules || BASE_PRESET_ROLES.find(r => r.roleKey === selectedRole)?.allowedModules || [];
                    const isExtraGranted = isGranted && !baseMods.includes(mod.id) && selectedRole !== 'supreme_admin';

                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleToggleUserModule(mod.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                          isGranted
                            ? isExtraGranted
                              ? 'bg-amber-950/30 border-amber-500/50 text-white'
                              : 'bg-indigo-600/20 border-indigo-500/80 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ModIcon className={`w-4 h-4 shrink-0 ${isGranted ? (isExtraGranted ? 'text-amber-400' : 'text-indigo-400') : 'text-slate-500'}`} />
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{mod.label}</span>
                            {isExtraGranted && (
                              <span className="text-[9px] font-extrabold text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
                                Extra Granted
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            isGranted ? (isExtraGranted ? 'bg-amber-500 text-slate-950 font-black' : 'bg-indigo-600 text-white') : 'bg-slate-800 text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granular Operational Capabilities Matrix for Individual User */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                {(() => {
                  const activeCapabilities = GRANULAR_CAPABILITIES.filter(
                    (cap) => selectedRole === 'supreme_admin' || userAllowedModules.includes(cap.module)
                  );

                  const handleUserQuickPreset = (preset: 'view' | 'edit' | 'full') => {
                    if (selectedRole === 'supreme_admin') {
                      onToast?.('Supreme Admin retains full authority.');
                      return;
                    }

                    const updates: Record<string, boolean> = {};
                    activeCapabilities.forEach((cap) => {
                      if (preset === 'view') {
                        updates[cap.key] = cap.accessType === 'view';
                      } else if (preset === 'edit') {
                        updates[cap.key] = cap.accessType === 'view' || cap.accessType === 'edit';
                      } else {
                        updates[cap.key] = true;
                      }
                    });

                    setUserCustomPermissions((prev) => ({ ...prev, ...updates }));
                    onToast?.(`Applied "${preset === 'view' ? 'View Only' : preset === 'edit' ? 'Can Edit Only' : 'Full Access'}" matrix to ${user.name}.`);
                  };

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Individual Operational Capabilities Matrix ({user.name})
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Operational capabilities for enabled modules (View Only, Edit, Delete / Full Access)
                          </p>
                        </div>

                        {activeCapabilities.length > 0 && selectedRole !== 'supreme_admin' && (
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
                            <button
                              type="button"
                              onClick={() => handleUserQuickPreset('view')}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition cursor-pointer"
                            >
                              View Only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUserQuickPreset('edit')}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
                            >
                              Can Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUserQuickPreset('full')}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                            >
                              Full Access
                            </button>
                          </div>
                        )}
                      </div>

                      {activeCapabilities.length === 0 ? (
                        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 text-center space-y-1.5 text-slate-400">
                          <p className="text-xs font-bold text-slate-300">No Granular Capabilities Active</p>
                          <p className="text-[11px]">
                            No modules are currently assigned to <span className="text-white font-semibold">{user.name}</span> in the Individual Module Access Permissions above.
                            Enable any module (e.g., Contacts CRM, Products & Inventory, POS, Expenses) to configure its granular View, Edit, and Delete operational authority.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeCapabilities.map((cap) => {
                            const roleDefaultVal = selectedRole === 'supreme_admin' || Boolean(rolePermissions[selectedRole]?.[cap.key as keyof RolePermissions]);
                            const isExplicitUserOverride = userCustomPermissions[cap.key] !== undefined;
                            const activeVal = isExplicitUserOverride ? Boolean(userCustomPermissions[cap.key]) : roleDefaultVal;

                            return (
                              <div
                                key={cap.key}
                                onClick={() => {
                                  if (selectedRole === 'supreme_admin') {
                                    onToast?.('Supreme Admin retains full authority.');
                                    return;
                                  }
                                  const newVal = !activeVal;
                                  setUserCustomPermissions(prev => ({ ...prev, [cap.key]: newVal }));
                                  onToast?.(`Set "${cap.label}" to ${newVal ? 'ENABLED' : 'DISABLED'} for ${user.name}.`);
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                  activeVal
                                    ? 'bg-emerald-950/20 border-emerald-700/60 text-white'
                                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      {cap.category}
                                    </span>
                                    {activeVal ? (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        ENABLED
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                        DISABLED
                                      </span>
                                    )}
                                    {isExplicitUserOverride && (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        User Override
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-extrabold text-xs leading-snug">{cap.label}</h5>
                                  <p className="text-[10px] leading-relaxed text-slate-400 truncate">
                                    {cap.desc}
                                  </p>
                                </div>

                                <div className="shrink-0 mt-0.5">
                                  <div
                                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                                      activeVal ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                                    }`}
                                  >
                                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs flex items-center justify-center">
                                      {activeVal ? (
                                        <Check className="w-2 h-2 text-emerald-600" />
                                      ) : (
                                        <X className="w-2 h-2 text-slate-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: STORE LOCATIONS */}
          {activeSubTab === 'locations' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-sm font-extrabold flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  <span>Accessible Retail Branches & Outlets</span>
                </h4>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Select which store branches {user.name} is authorized to access and switch between.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Primary / Base Assigned Branch
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none border transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                  }`}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name || loc.businessName || 'Store Location'} ({loc.city || 'Primary'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Default branch loaded upon user sign in</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  Authorized Multi-Store Access
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  {locations.map((loc) => {
                    const isChecked = accessLocations.includes(loc.id);

                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Building className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <span className="font-bold text-xs block truncate">
                              {loc.name || loc.businessName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {loc.city || 'Flagship Outlet'}
                            </span>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleBranch(loc.id)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Selected Role:</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              {currentRoleMeta.title}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`text-xs font-bold transition cursor-pointer ${
                isLight
                  ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                  : 'px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply & Save Role</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
