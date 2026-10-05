import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { validatePhoneNumber, validatePhoneWithCountry } from '../../utils/phoneValidation';
import { validateEmail } from '../../utils/formatters';
import { validateFullName } from '../../utils/validation';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';
import { Phone as PhoneIcon, Mail as MailIcon, Calendar as CalendarIcon, CreditCard as CreditCardIcon, Briefcase as BriefcaseIcon, Award } from 'lucide-react';
import { GRANULAR_CAPABILITIES } from '../../data/granularCapabilities';
import {
  ErpModuleId,
  RolePermissions,
  User,
  UserRole,
} from '../../types/erp';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
  UserPlus,
  Lock,
  Unlock,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Search,
  Save,
  Building,
  Edit2,
  Trash2,
  Eye,
  Camera,
  LogIn,
  AlertTriangle,
  Layers,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  DollarSign,
  BarChart3,
  Code2,
  Settings as SettingsIcon,
  HelpCircle,
  UserCog,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { UserDetailsModal } from '../users/UserDetailsModal';
import { UserRolePermissionsModal, CustomRoleDefinition } from '../users/UserRolePermissionsModal';

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
    description: 'Gemini 3.7 demand forecasting, profit insights, and anomaly detection.',
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

interface RoleMeta {
  role: UserRole;
  title: string;
  tier: string;
  badgeColor: string;
  description: string;
}

const ROLES_META: RoleMeta[] = [
  {
    role: 'admin',
    title: 'Super Admin',
    tier: 'Tier 1 • Full Authority',
    badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    description: 'Unrestricted master access to all ERP modules, financial ledgers, settings, and staff permissions.',
  },
  {
    role: 'supreme_admin' as any,
    title: 'Supreme Admin',
    tier: 'Tier 1 • Supreme Master Authority',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Supreme unrestricted master authority with absolute access across the entire application ecosystem, system settings, and user hierarchies.',
  },
  {
    role: 'manager',
    title: 'Store Manager',
    tier: 'Tier 2 • Operational Lead',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    description: 'Oversees daily sales, store inventory, purchasing POs, expenses, CRM contacts, and standard reports.',
  },
  {
    role: 'inventory_manager',
    title: 'Inventory Specialist',
    tier: 'Tier 2 • Supply & Stock',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: 'Manages catalog items, stock audits, warehouse transfers, and purchase inward deliveries.',
  },
  {
    role: 'accountant',
    title: 'Finance & Accountant',
    tier: 'Tier 2 • Ledger & Tax',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    description: 'Audits expenses, bank balances, financial P&L, sales journals, and tax liabilities.',
  },
  {
    role: 'cashier',
    title: 'Cashier & POS Operator',
    tier: 'Tier 3 • Terminal Checkout',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    description: 'Handles point-of-sale checkout, customer registers, instant payments, receipt printing, and daily till balance.',
  },
];

interface EmployeePermissionsTabProps {
  initialSection?: 'permissions' | 'users' | 'roles' | 'add_user';
}

export const EmployeePermissionsTab: React.FC<EmployeePermissionsTabProps> = ({ initialSection }) => {
  const {
    rolePermissions,
    customRoles,
    addCustomRole,
    updateCustomRole,
    deleteCustomRole,
    updateRolePermissions,
    toggleRoleModule,
    resetRolePermissions,
    users,
    currentUser,
    switchUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    lockUser,
    unlockUser,
    updateUserRole,
    locations,
    selectedLocationId,
    setActiveTab,
    isAddUserModalOpen,
    setIsAddUserModalOpen,
    openAddUserModal,
    closeAddUserModal,
    settings,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');

  useEffect(() => {
    if (selectedRole === 'supreme_admin' && currentUser?.role !== 'supreme_admin') {
      setSelectedRole('admin');
    }
  }, [selectedRole, currentUser]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [staffCurrentPage, setStaffCurrentPage] = useState<number>(1);
  const [staffRowsPerPage, setStaffRowsPerPage] = useState<number>(10);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userToManageRole, setUserToManageRole] = useState<User | null>(null);
  const [userToLock, setUserToLock] = useState<User | null>(null);

  // Custom Roles Handlers delegating to central ErpContext
  const handleAddCustomRole = (newRole: CustomRoleDefinition) => {
    addCustomRole(newRole);
    showToast(`Created custom role "${newRole.title}".`);
  };

  const handleUpdateCustomRole = (updatedRole: CustomRoleDefinition) => {
    updateCustomRole(updatedRole);
    showToast(`Updated custom role "${updatedRole.title}".`);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    deleteCustomRole(roleId);
    showToast('Deleted custom role template.');
  };

  React.useEffect(() => {
    setStaffCurrentPage(1);
  }, [searchUserQuery, filterRole]);

  // Modal states: powered by central Add User modal state so it can be re-opened anytime reliably
  const showAddUserModal = isAddUserModalOpen ?? false;
  const setShowAddUserModal = setIsAddUserModalOpen || (() => {});

  const staffTableRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialSection === 'add_user' && openAddUserModal) {
      openAddUserModal();
    } else if (initialSection === 'users' && staffTableRef.current) {
      staffTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialSection]);

  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editUserTab, setEditUserTab] = useState<'basic' | 'roles' | 'commission' | 'personal' | 'bank'>('basic');

  const handleEditAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userToEdit) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUserToEdit({ ...userToEdit, avatar: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isDuplicatePhone = (phoneA: string, phoneB: string) => {
    const digitsA = phoneA.replace(/\D/g, '');
    const digitsB = phoneB.replace(/\D/g, '');
    if (digitsA.length < 7 || digitsB.length < 7) return false;
    const minLen = Math.min(digitsA.length, digitsB.length);
    const endA = digitsA.slice(-minLen);
    const endB = digitsB.slice(-minLen);
    return endA === endB;
  };

  const handleAddAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Business-scoped locations and user context
  const currentBusinessName = (currentUser?.businessName || settings?.businessName || settings?.name || '').trim().toLowerCase();
  const currentBusinessId = currentUser?.businessId;

  const businessLocations = React.useMemo(() => {
    return locations.filter((l) => {
      if (currentBusinessId && l.businessId) {
        return l.businessId === currentBusinessId;
      }
      if (currentBusinessName && l.businessName) {
        return l.businessName.trim().toLowerCase() === currentBusinessName;
      }
      if (currentBusinessName && !l.businessName) {
        return l.id === currentUser?.locationId || l.id === selectedLocationId;
      }
      return true;
    });
  }, [locations, currentBusinessName, currentBusinessId, currentUser?.locationId, selectedLocationId]);

  const defaultBranchId = currentUser?.locationId || selectedLocationId || businessLocations[0]?.id || locations[0]?.id || 'loc_main';
  const availableBranches = businessLocations.length > 0 ? businessLocations : locations;

  // Add User Form State
  const [addUserTab, setAddUserTab] = useState<'basic' | 'roles' | 'commission' | 'personal' | 'bank'>('basic');

  const [formData, setFormData] = useState({
    prefix: 'Mr',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    altPhone: '',
    emergencyPhone: '',
    role: 'cashier' as UserRole,
    locationId: defaultBranchId,
    accessLocations: availableBranches.map((l) => l.id),
    isActive: true,
    allowLogin: true,
    username: '',
    password: '',
    confirmPassword: '',
    salesCommissionAgentType: 'none',
    salesCommissionPercent: '',
    maxSalesDiscount: '',
    dob: '',
    gender: 'Male',
    maritalStatus: 'Single',
    bloodGroup: 'O+',
    fbLink: '',
    twitterLink: '',
    linkedinLink: '',
    customField1: '',
    customField2: '',
    customField3: '',
    customField4: '',
    guardianName: '',
    currentAddress: '',
    permanentAddress: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    bankName: '',
    bankCode: '',
    taxPayerId: '',
    department: 'Sales & POS',
    designation: 'Cashier & POS Operator',
    status: 'active' as 'active' | 'suspended',
    avatar: '',
  });

  const handleCloseAddUserModal = () => {
    if (closeAddUserModal) {
      closeAddUserModal();
    } else {
      setShowAddUserModal(false);
    }
    setAddUserTab('basic');
    setFormData({
      prefix: 'Mr',
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: '',
      altPhone: '',
      emergencyPhone: '',
      role: 'cashier',
      locationId: defaultBranchId,
      accessLocations: availableBranches.map((l) => l.id),
      isActive: true,
      allowLogin: true,
      username: '',
      password: '',
      confirmPassword: '',
      salesCommissionAgentType: 'none',
      salesCommissionPercent: '',
      maxSalesDiscount: '',
      dob: '',
      gender: 'Male',
      maritalStatus: 'Single',
      bloodGroup: 'O+',
      fbLink: '',
      twitterLink: '',
      linkedinLink: '',
      customField1: '',
      customField2: '',
      customField3: '',
      customField4: '',
      guardianName: '',
      currentAddress: '',
      permanentAddress: '',
      bankAccountHolder: '',
      bankAccountNumber: '',
      bankName: '',
      bankCode: '',
      taxPayerId: '',
      department: 'Sales & POS',
      designation: 'Cashier & POS Operator',
      status: 'active',
      avatar: '',
    });
  };

  // Keyboard shortcut: Escape to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddUserModal) {
        handleCloseAddUserModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddUserModal]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleActionPermissionToggle = (
    key: keyof Omit<RolePermissions, 'allowedModules'>
  ) => {
    if (selectedRole === 'supreme_admin') {
      showToast('Supreme Admin role automatically retains full authority for all operations.');
      return;
    }
    if (selectedRole === 'admin' && currentUser?.role !== 'supreme_admin') {
      showToast('Super Admin role permissions & module access control are locked and can only be modified by Supreme Admin.');
      return;
    }

    const currentVal = rolePermissions[selectedRole]?.[key] || false;
    updateRolePermissions(selectedRole, { [key]: !currentVal });
    showToast(`Updated ${String(key)} for role: ${selectedRole.replace('_', ' ')}`);
  };

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = (formData.name || `${formData.prefix} ${formData.firstName} ${formData.lastName}`).trim();
    if (!fullName || !formData.email.trim()) {
      showToast('Full name (or first name) and email address are required.');
      return;
    }

    if (!validateEmail(formData.email)) {
      showToast('Please enter a valid email address with a proper domain suffix (e.g. name@mail.com).');
      return;
    }

    if (formData.allowLogin && formData.password && formData.password !== formData.confirmPassword) {
      showToast('Password and Confirm Password do not match.');
      return;
    }

    // Phone numbers validation
    const mainPhoneVal = validatePhoneNumber(formData.phone);
    if (!mainPhoneVal.isValid) {
      showToast(`Phone Number Error: ${mainPhoneVal.error}`);
      return;
    }

    const altPhoneVal = validatePhoneNumber(formData.altPhone);
    if (!altPhoneVal.isValid) {
      showToast(`Alternate Phone Error: ${altPhoneVal.error}`);
      return;
    }

    const emergencyPhoneVal = validatePhoneNumber(formData.emergencyPhone);
    if (!emergencyPhoneVal.isValid) {
      showToast(`Emergency Contact Phone Error: ${emergencyPhoneVal.error}`);
      return;
    }

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    ];

    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const activeBizName = currentUser?.businessName || settings.businessName || settings.name || 'Royal POSfini';
    const activeBizId = currentUser?.businessId;
    const activeLocId = formData.locationId || defaultBranchId;

    const commVal = parseFloat(formData.salesCommissionPercent) || 0;
    const discVal = parseFloat(formData.maxSalesDiscount) || 0;

    if (commVal < 0) {
      showToast('Sales Commission Percentage cannot be negative.');
      setAddUserTab('commission');
      return;
    }
    if (discVal < 0) {
      showToast('Max Sales Discount Percentage cannot be negative.');
      setAddUserTab('commission');
      return;
    }
    if (commVal > 0 && discVal < commVal) {
      showToast(`Max Sales Discount (%) cannot be less than Sales Commission Percentage (${commVal}%).`);
      setAddUserTab('commission');
      return;
    }

    addUser({
      ...formData,
      name: fullName,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || '+1 (512) 555-0199',
      role: formData.role,
      locationId: activeLocId,
      status: formData.role === 'supreme_admin' ? 'active' : (formData.isActive ? 'active' : 'suspended'),
      avatar: formData.avatar.trim() || randomAvatar,
      businessName: activeBizName,
      businessId: activeBizId,
    });

    handleCloseAddUserModal();
    showToast(`Added staff member "${fullName}" as ${formData.role.replace('_', ' ')}.`);
  };

  const validateEditUserTab = (currentTab: string): boolean => {
    if (currentTab === 'basic' && userToEdit) {
      const nameCheck = validateFullName(userToEdit.name || '');
      if (!nameCheck.isValid) {
        alert(`Full Legal Name Error: ${nameCheck.error}`);
        return false;
      }
      if (!userToEdit.email || !userToEdit.email.trim()) {
        alert('Email Address is required.');
        return false;
      }
      if (!validateEmail(userToEdit.email)) {
        alert('Please enter a valid Email Address with a proper domain (e.g. name@mail.com).');
        return false;
      }
      if (!userToEdit.phone || !userToEdit.phone.trim()) {
        alert('Primary Mobile / Phone Number is required.');
        return false;
      }
      const phoneVal = validatePhoneWithCountry(userToEdit.phone, userToEdit.countryCode || '+1', true);
      if (!phoneVal.isValid) {
        alert(`Primary Mobile / Phone Error: ${phoneVal.error}`);
        return false;
      }
    }

    if (currentTab === 'commission' && userToEdit) {
      const comm = parseFloat(String(userToEdit.salesCommissionPercent)) || 0;
      const disc = parseFloat(String(userToEdit.maxSalesDiscount)) || 0;

      if (comm < 0) {
        alert('Sales Commission Percentage cannot be negative.');
        return false;
      }
      if (disc < 0) {
        alert('Max Sales Discount Percentage cannot be negative.');
        return false;
      }
      if (comm > 0 && disc < comm) {
        alert(`Max Sales Discount (%) cannot be less than Sales Commission Percentage (${comm}%).`);
        return false;
      }
    }
    return true;
  };

  const handleEditUserTabChange = (targetTab: 'basic' | 'roles' | 'commission' | 'personal' | 'bank') => {
    const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
    const currentIdx = tabs.indexOf(editUserTab);
    const targetIdx = tabs.indexOf(targetTab);

    if (targetIdx > currentIdx) {
      if (!validateEditUserTab(editUserTab)) {
        return;
      }
    }
    setEditUserTab(targetTab);
  };

  const handleUpdateExistingUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    const nameCheck = validateFullName(userToEdit.name || '');
    if (!nameCheck.isValid) {
      alert(`Full Legal Name Error: ${nameCheck.error}`);
      setEditUserTab('basic');
      return;
    }

    if (!userToEdit.email || !userToEdit.email.trim()) {
      alert('Email Address is required.');
      return;
    }

    if (!validateEmail(userToEdit.email)) {
      alert('Please enter a valid Email Address with a proper domain (e.g. name@mail.com).');
      return;
    }

    if (!userToEdit.phone || !userToEdit.phone.trim()) {
      alert('Primary Mobile / Phone Number is required.');
      return;
    }

    const emailClean = userToEdit.email.trim().toLowerCase();
    const emailExists = users.some(
      (u) => u.id !== userToEdit.id && u.email?.trim().toLowerCase() === emailClean
    );
    if (emailExists) {
      alert('Primary Email Error: This email address is already registered by another staff member.');
      return;
    }

    if (userToEdit.phone.trim()) {
      const phoneExists = users.some(
        (u) => u.id !== userToEdit.id && u.phone && isDuplicatePhone(u.phone, userToEdit.phone)
      );
      if (phoneExists) {
        alert('Primary Phone Error: This mobile/phone number is already registered by another staff member.');
        return;
      }
    }

    const phoneVal = validatePhoneNumber(userToEdit.phone, true);
    if (!phoneVal.isValid) {
      alert(`Primary Phone Error: ${phoneVal.error}`);
      return;
    }

    const commVal = parseFloat(String(userToEdit.salesCommissionPercent)) || 0;
    const discVal = parseFloat(String(userToEdit.maxSalesDiscount)) || 0;

    if (commVal < 0 || discVal < 0 || (commVal > 0 && discVal < commVal)) {
      if (commVal < 0) alert('Sales Commission Percentage cannot be negative.');
      else if (discVal < 0) alert('Max Sales Discount Percentage cannot be negative.');
      else alert(`Max Sales Discount (%) cannot be less than Sales Commission Percentage (${commVal}%).`);
      setEditUserTab('commission');
      return;
    }

    const finalStatus = userToEdit.role === 'supreme_admin' ? 'active' : (userToEdit.status || 'active');

    updateUser(userToEdit.id, {
      ...userToEdit,
      status: finalStatus,
    });

    setUserToEdit(null);
    showToast(`Updated user credentials for ${userToEdit.name}.`);
  };

  const filteredUsers = users.filter((u) => {
    const isSystemAdminAccount = u.role === 'supreme_admin' || u.role === 'admin' || u.role === 'super_admin' || u.id === 'usr_admin';

    if (!isSystemAdminAccount) {
      // Filter out dummy demo accounts if current user has their own real account
      const isDemoUser = (u.email && u.email.endsWith('@royalpos.com')) || ['usr_cashier', 'usr_inventory', 'usr_finance'].includes(u.id);
      const isCurrentDemo = currentUser?.email && currentUser.email.endsWith('@royalpos.com');
      const hasCustomAccounts = users.some((other) => other.email && !other.email.endsWith('@royalpos.com'));

      if (isDemoUser && !isCurrentDemo && hasCustomAccounts && u.id !== currentUser?.id) {
        return false;
      }

      // Business-scoped isolation
      if (u.id !== currentUser?.id && u.email !== currentUser?.email) {
        if (currentBusinessId && u.businessId && u.businessId !== currentBusinessId) {
          return false;
        }
        if (currentBusinessName && u.businessName) {
          const uBiz = (u.businessName || '').trim().toLowerCase();
          if (uBiz && uBiz !== currentBusinessName && uBiz !== 'royal posfini' && uBiz !== 'default business') {
            return false;
          }
        }
      }
    }

    const q = (searchUserQuery || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q);
    const matchesRole =
      filterRole === 'all' ||
      u.role === filterRole ||
      (filterRole === 'admin' && (u.role === 'admin' || u.role === 'super_admin')) ||
      (filterRole === 'supreme_admin' && u.role === 'supreme_admin');
    return matchesSearch && matchesRole;
  });

  const totalStaffPages = Math.ceil(filteredUsers.length / staffRowsPerPage) || 1;
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (staffCurrentPage - 1) * staffRowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + staffRowsPerPage);
  }, [filteredUsers, staffCurrentPage, staffRowsPerPage]);

  const allRoleMetas = React.useMemo(() => {
    const baseMetas = ROLES_META.filter((r) => r.role !== 'supreme_admin' || currentUser?.role === 'supreme_admin');
    const customMetas: RoleMeta[] = (customRoles || []).map((cr) => ({
      role: cr.roleKey as any,
      title: cr.title,
      tier: cr.tier || 'Custom Role',
      badgeColor: cr.badgeColor || 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      description: cr.description || `Custom role: ${cr.title}`,
    }));
    return [...baseMetas, ...customMetas];
  }, [currentUser?.role, customRoles]);

  const selectedRoleMeta = allRoleMetas.find((r) => r.role === selectedRole) || allRoleMetas[0];
  const activePermissions = rolePermissions[selectedRole];
  const allowedModules = activePermissions?.allowedModules || [];

  const showPermissionsSection = initialSection === 'permissions' || initialSection === 'roles';
  const showUsersSection =
    initialSection === 'users' ||
    initialSection === 'add_user' ||
    initialSection === 'permissions' ||
    initialSection === 'roles' ||
    !initialSection;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 border border-indigo-400 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section 1: Role Permissions & Module Access Matrix (Only in Roles & Access) */}
      {showPermissionsSection && (
        <div
          className={`border rounded-3xl p-6 space-y-6 transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-900'
              : 'bg-slate-900/90 border-slate-800 text-white'
          }`}
        >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <span>Role Permissions & Module Access Control</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Select a role tab below to configure accessible modules and operational authority across the ERP system.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetRolePermissions();
                showToast(`Reset permissions for all roles to default system matrix.`);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {allRoleMetas.map((r) => {
            const isSelected = selectedRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-[1.01]'
                    : isLight
                    ? 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 border-indigo-200 shadow-2xs'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{r.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Role Meta Header */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            isLight
              ? 'bg-slate-50/80 border-slate-200'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm">{selectedRoleMeta.title}</h4>
              <span className={`text-[10px] font-black uppercase ${
                isLight && (selectedRole === 'supreme_admin' || selectedRole === 'admin')
                  ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                  : `px-2 py-0.5 rounded-full border ${selectedRoleMeta.badgeColor}`
              }`}>
                {selectedRoleMeta.tier}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {selectedRoleMeta.description}
            </p>
          </div>

          {(selectedRole === 'supreme_admin') && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span>Supreme Master Access Granted</span>
            </div>
          )}

          {(selectedRole === 'admin' && currentUser?.role !== 'supreme_admin') && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span>Super Admin Permissions Locked (Editable only by Supreme Admin)</span>
            </div>
          )}
        </div>

        {/* Module Access Assignment Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Assigned Modules Matrix ({allowedModules.length} / {ALL_MODULES.length} Granted)
            </h4>
            <span className="text-[11px] font-bold text-indigo-500">
              Toggle switch to grant or revoke module access for {selectedRoleMeta.title}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ALL_MODULES.map((mod) => {
              const ModIcon = mod.icon;
              const isGranted = selectedRole === 'supreme_admin' || allowedModules.includes(mod.id);

              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    if (selectedRole === 'supreme_admin') {
                      showToast('Supreme Admin role automatically retains full authority for all modules.');
                      return;
                    }
                    if (selectedRole === 'admin' && currentUser?.role !== 'supreme_admin') {
                      showToast('Super Admin role permissions & module access control are locked and can only be modified by Supreme Admin.');
                      return;
                    }
                    toggleRoleModule(selectedRole, mod.id);
                    showToast(`Updated ${mod.label} access for ${selectedRoleMeta.title}.`);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isGranted
                      ? isLight
                        ? 'bg-indigo-50/40 border-indigo-200 shadow-2xs hover:border-indigo-300'
                        : 'bg-indigo-950/20 border-indigo-800/60 hover:border-indigo-700'
                      : isLight
                      ? 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 ${
                          isGranted
                            ? isLight
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                              : 'bg-indigo-900/50 text-indigo-300 border-indigo-700'
                            : isLight
                            ? 'bg-slate-200/60 text-slate-500 border-slate-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <ModIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-extrabold text-xs">{mod.label}</h5>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md border ${
                              mod.category === 'Core'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20'
                                : mod.category === 'Operations'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                                : mod.category === 'Finance'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20'
                            }`}
                          >
                            {mod.category}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                          isGranted ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center">
                          {isGranted ? (
                            <Check className="w-2.5 h-2.5 text-indigo-600" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold">
                    <span className={isGranted ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                      {isGranted ? '● Access Enabled' : '○ Access Restricted'}
                    </span>
                    {selectedRole === 'supreme_admin' ? (
                      <span className="text-slate-400 font-mono">Always Active</span>
                    ) : (
                      <span className="text-slate-400 hover:text-indigo-500 font-medium">Click to toggle</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Action Capabilities Matrix */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {(() => {
            const activeCapabilities = GRANULAR_CAPABILITIES.filter(
              (action) => selectedRole === 'supreme_admin' || allowedModules.includes(action.module)
            );

            const handleQuickPreset = (preset: 'view' | 'edit' | 'full') => {
              if (selectedRole === 'supreme_admin') {
                showToast('Supreme Admin automatically retains full operational authority.');
                return;
              }
              if (selectedRole === 'admin' && currentUser?.role !== 'supreme_admin') {
                showToast('Super Admin role permissions are locked to Supreme Admin.');
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

              updateRolePermissions(selectedRole, updates);
              showToast(`Applied "${preset === 'view' ? 'View Only' : preset === 'edit' ? 'Can Edit Only' : 'Full Access'}" operational matrix to ${selectedRoleMeta.title}.`);
            };

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Granular Operational Capabilities Matrix ({selectedRoleMeta.title})
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Operational capabilities for enabled modules (View Only, Edit, Delete / Full Access)
                    </p>
                  </div>

                  {activeCapabilities.length > 0 && selectedRole !== 'supreme_admin' && (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('view')}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition cursor-pointer"
                      >
                        View Only
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('edit')}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
                      >
                        Can Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('full')}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                      >
                        Full Access
                      </button>
                    </div>
                  )}
                </div>

                {activeCapabilities.length === 0 ? (
                  <div className={`p-6 rounded-2xl border text-center space-y-2 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
                    <p className="text-xs font-bold">No Granular Capabilities Available</p>
                    <p className="text-[11px] max-w-md mx-auto">
                      There are no active modules in the Assigned Modules Matrix for <span className="font-bold">{selectedRoleMeta.title}</span>.
                      Enable a module above (such as Contacts CRM, Products & Inventory, POS, or Sales) to configure its granular View, Edit, and Delete authority.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeCapabilities.map((action) => {
                      const activeVal = selectedRole === 'supreme_admin' || Boolean(activePermissions?.[action.key as keyof RolePermissions]);

                      return (
                        <div
                          key={action.key}
                          onClick={() => {
                            if (selectedRole === 'supreme_admin') {
                              showToast('Supreme Admin role automatically retains full operational authority.');
                              return;
                            }
                            if (selectedRole === 'admin' && currentUser?.role !== 'supreme_admin') {
                              showToast('Super Admin role permissions & module access control are locked and can only be modified by Supreme Admin.');
                              return;
                            }
                            updateRolePermissions(selectedRole, { [action.key]: !activeVal });
                            showToast(`Updated "${action.label}" to ${!activeVal ? 'ENABLED' : 'DISABLED'} for ${selectedRoleMeta.title}.`);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            activeVal
                              ? isLight
                                ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                                : 'bg-emerald-950/30 border-emerald-700/60 text-white'
                              : isLight
                              ? 'bg-slate-50/60 border-slate-200 text-slate-700'
                              : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {action.category}
                              </span>
                              {activeVal ? (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ENABLED
                                </span>
                              ) : (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  DISABLED
                                </span>
                              )}
                            </div>
                            <h5 className="font-extrabold text-xs leading-snug">{action.label}</h5>
                            <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {action.desc}
                            </p>
                          </div>

                          <div className="shrink-0 mt-0.5">
                            <div
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                                activeVal ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center">
                                {activeVal ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <X className="w-2.5 h-2.5 text-slate-400" />
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

      {/* Section 2: Employee Staff Directory & Role Assignments */}
      {showUsersSection && (
        <div
          ref={staffTableRef}
          id="staff-directory-section"
          className={`border rounded-3xl p-6 space-y-5 transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-900'
              : 'bg-slate-900/90 border-slate-800 text-white'
          }`}
        >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Employee Directory & Role Assignments</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Manage staff accounts, inspect activity logs, assign roles (Admin, Manager, Cashier, etc.), and control branch locations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Search staff by name or email..."
                className={`rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none transition w-52 sm:w-64 border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600 focus:bg-white'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none border transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-600'
                  : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
              }`}
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="admin">Super Admin</option>
              <option value="manager">Manager</option>
              <option value="inventory_manager">Inventory Specialist</option>
              <option value="accountant">Accountant</option>
              <option value="cashier">Cashier</option>
              {customRoles.map((cr) => (
                <option key={cr.id} value={cr.roleKey}>
                  {cr.title} (Custom)
                </option>
              ))}
            </select>

            {/* Quick Add / Manage Role Button */}
            <button
              type="button"
              onClick={() => {
                const targetUser = users.find((u) => u.id === currentUser?.id) || users[0];
                if (targetUser) {
                  setUserToManageRole(targetUser);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs ${
                isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 active:scale-95'
                  : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border-purple-700/60'
              }`}
              title="Create custom roles and manage user-based permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manage / Add Roles</span>
            </button>
          </div>
        </div>

        {/* Locked Accounts & Immediate Unlock Alert Banner for Admin */}
        {(() => {
          const lockedUsers = users.filter((u) => u.status === 'locked');
          const requestedUnlockUsers = lockedUsers.filter((u) => u.unlockRequested);
          if (lockedUsers.length === 0) return null;

          return (
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-800/70 text-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">
                      {lockedUsers.length} Account{lockedUsers.length > 1 ? 's' : ''} Locked (Brute-Force Protection)
                    </span>
                    {requestedUnlockUsers.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                        <MailIcon className="w-3 h-3" />
                        {requestedUnlockUsers.length} Unlock Request Mail{requestedUnlockUsers.length > 1 ? 's' : ''} Pending
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Accounts are frozen for {settings.lockoutDuration || 15} minutes upon reaching the failed attempts threshold. As an administrator, you can immediately unlock users upon receiving their notification mail without waiting for the freeze timer.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    lockedUsers.forEach((u) => unlockUser(u.id));
                    showToast(`Immediately unlocked ${lockedUsers.length} user account(s). Users can now log in directly using their password.`);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock All Immediately</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Mobile View: Card List (< md) */}
        <div className="md:hidden space-y-3">
          {paginatedUsers.length === 0 ? (
            <div className={`p-8 text-center font-semibold rounded-2xl border ${isLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              No matching staff members found.
            </div>
          ) : (
            paginatedUsers.map((user) => {
              const isCurrent = currentUser?.id === user.id;
              const activeBiz = user.businessName || currentUser?.businessName || settings.businessName || settings.name || 'Royal POSfini';
              const loc =
                locations.find((l) => l.id === user.locationId) ||
                locations.find((l) => (l.businessName || '').toLowerCase() === activeBiz.toLowerCase()) ||
                locations.find((l) => l.id === selectedLocationId) ||
                locations[0];
              const branchDisplayName = (loc?.name && loc.name !== 'Main HQ') ? loc.name : activeBiz;

              return (
                <div
                  key={`mobile_user_${user.id}`}
                  className={`p-4 rounded-2xl border transition shadow-xs space-y-3 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  {/* Top row: Avatar + Name + Email + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-300 dark:ring-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {user.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 block truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {user.role === 'supreme_admin' ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 inline-flex items-center gap-1 cursor-not-allowed select-none ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                        title="Supreme Admin cannot be suspended and always remains active"
                      >
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Active (Permanent)</span>
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          user.status === 'active'
                            ? isLight
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isLight
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    )}
                  </div>

                  {/* Middle row: Role Badge & Branch */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${
                      user.role === 'supreme_admin'
                        ? isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                        : user.role === 'admin' || user.role === 'super_admin'
                        ? isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950/60 text-rose-300 border-rose-700/50'
                        : isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50'
                    }`}>
                      <Shield className="w-3 h-3 shrink-0" />
                      <span className="capitalize">{user.role.replace('_', ' ')}</span>
                    </span>

                    <span className="flex items-center gap-1 text-slate-400 text-xs truncate max-w-[150px]">
                      <Building className="w-3 h-3 shrink-0" />
                      <span className="truncate">{branchDisplayName}</span>
                    </span>
                  </div>

                  {/* Bottom row: Touch-Friendly Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setUserToView(user)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        isLight
                          ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                          : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {(!(currentUser?.role !== 'supreme_admin' && user.role === 'supreme_admin')) ? (
                      <button
                        type="button"
                        onClick={() => setUserToEdit(user)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                          isLight
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Staff</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUserToManageRole(user)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                          isLight
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-800 text-purple-300 border-slate-700'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Manage Role</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Staff Table (>= md) */}
        <div className={`hidden md:block overflow-x-auto scroll-smooth touch-pan-x overscroll-x-contain custom-scrollbar rounded-2xl border ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <table className="w-full text-left text-xs">
            <thead
              className={`font-bold border-b uppercase text-[10px] tracking-wider ${
                isLight
                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Employee Staff</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Branch Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800/60 text-slate-200'}`}>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                    No matching staff members found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  const activeBiz = user.businessName || currentUser?.businessName || settings.businessName || settings.name || 'Royal POSfini';
                  const loc =
                    locations.find((l) => l.id === user.locationId) ||
                    locations.find((l) => (l.businessName || '').toLowerCase() === activeBiz.toLowerCase()) ||
                    locations.find((l) => l.id === selectedLocationId) ||
                    locations[0];
                  const branchDisplayName = (loc?.name && loc.name !== 'Main HQ') ? loc.name : activeBiz;

                  return (
                    <tr
                      key={user.id}
                      className={`transition ${isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/40'}`}
                    >
                    {/* User Info (Clickable to view profile & activities) */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setUserToView(user)}
                        className="flex items-center gap-3 cursor-pointer group"
                        title="Click to view details & activities"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-400 dark:ring-slate-700 shrink-0 group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 group-hover:bg-indigo-500 transition">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold transition ${isLight ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-300'}`}>
                              {user.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                                Active You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Role (Clickable to manage / edit user-based role) */}
                    <td className="py-3 px-4">
                      {currentUser?.role !== 'supreme_admin' && (user.role === 'supreme_admin' || user.role === 'admin' || user.role === 'super_admin') ? (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-extrabold tracking-tight ${
                            isLight
                              ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                              : 'px-2.5 py-1 rounded-lg border bg-rose-950/60 text-rose-300 border-rose-700/50'
                          }`}
                        >
                          <Shield className="w-3 h-3 opacity-80 shrink-0" />
                          <span>{user.role === 'supreme_admin' ? 'Supreme Admin' : 'Super Admin'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUserToManageRole(user)}
                          className={`inline-flex items-center gap-1.5 text-xs font-extrabold tracking-tight transition hover:scale-105 active:scale-95 group cursor-pointer ${
                            (user.role === 'supreme_admin' || user.role === 'admin' || user.role === 'super_admin') && isLight
                              ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                              : user.role === 'supreme_admin'
                              ? 'px-2.5 py-1 rounded-lg border bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-700/50'
                              : user.role === 'admin' || user.role === 'super_admin'
                              ? isLight ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95' : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-700/50'
                              : user.role === 'manager'
                              ? isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs' : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border-indigo-700/50'
                              : user.role === 'inventory_manager'
                              ? isLight ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 shadow-2xs' : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-700/50'
                              : user.role === 'cashier'
                              ? isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-2xs' : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/50'
                              : isLight ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 shadow-2xs' : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border-purple-700/50'
                          }`}
                          title={`Click to edit role & permissions for ${user.name}`}
                        >
                          <Shield className="w-3 h-3 opacity-80 shrink-0" />
                          <span>
                            {user.role === 'supreme_admin'
                              ? 'Supreme Admin'
                              : user.role === 'admin' || user.role === 'super_admin'
                              ? 'Super Admin'
                              : user.role === 'manager'
                              ? 'Store Manager'
                              : user.role === 'inventory_manager'
                              ? 'Inventory Specialist'
                              : user.role === 'accountant'
                              ? 'Accountant'
                              : user.role === 'cashier'
                              ? 'Cashier'
                              : (customRoles.find((c) => c.roleKey === user.role)?.title || user.role.replace('_', ' '))}
                          </span>
                          <Edit2 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 ml-0.5" />
                        </button>
                      )}
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{branchDisplayName}</span>
                      </span>
                    </td>

                    {/* Status Toggle & Lockout Management */}
                    <td className="py-3 px-4">
                      {user.status === 'locked' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Locked (Brute-Force)</span>
                            </span>
                          </div>
                          {user.unlockRequested && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <MailIcon className="w-3 h-3 text-amber-500 animate-bounce" />
                              <span>Unlock Request Mail Received!</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              unlockUser(user.id);
                              showToast(`Immediately unlocked ${user.name}! User can now sign in directly with their password.`);
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 shadow-xs transition"
                            title="Unlock user immediately without waiting for freeze timer"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Unlock Immediately</span>
                          </button>
                        </div>
                      ) : user.role === 'supreme_admin' ? (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 cursor-not-allowed select-none ${
                            isLight
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                          title="Supreme Admin cannot be suspended and always remains active"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Active (Permanent)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            toggleUserStatus(user.id);
                            showToast(`Toggled ${user.name} status to ${user.status === 'active' ? 'suspended' : 'active'}`);
                          }}
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition ${
                            user.status === 'active'
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : isLight
                                ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Suspended</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {(() => {
                        if (!user.lastLogin) return 'Active Today';
                        const trimmed = user.lastLogin.trim();
                        if (trimmed.toLowerCase() === 'never') return 'Never';
                        if (trimmed.toLowerCase() === 'just now') return 'Just now';
                        const d = new Date(trimmed);
                        return isNaN(d.getTime()) ? trimmed : d.toLocaleDateString();
                      })()}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* UNLOCK ACTION (If locked) */}
                        {user.status === 'locked' ? (
                          <button
                            onClick={() => {
                              unlockUser(user.id);
                              showToast(`Immediately unlocked ${user.name}!`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                            title={`Unlock ${user.name} immediately without waiting for freeze timer`}
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unlock</span>
                          </button>
                        ) : user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'supreme_admin' ? (
                          /* MANUAL LOCK ACTION (If active / not admin) */
                          <button
                            onClick={() => {
                              setUserToLock(user);
                            }}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 shadow-2xs'
                                : 'bg-slate-800 hover:bg-amber-600/30 text-amber-400 border-slate-700'
                            }`}
                            title={`Lock / freeze account for ${user.name}`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        {/* MANAGE & EDIT ROLE / PERMISSIONS ACTION (User-based) */}
                        {(!(currentUser?.role !== 'supreme_admin' && (user.role === 'supreme_admin' || user.role === 'admin' || user.role === 'super_admin')) && user.role !== 'supreme_admin') && (
                          <button
                            onClick={() => setUserToManageRole(user)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 shadow-2xs active:scale-95'
                                : 'bg-slate-800 hover:bg-purple-600 text-purple-300 hover:text-white border-slate-700'
                            }`}
                            title={`Add & Edit Role / Permissions for ${user.name}`}
                          >
                            <UserCog className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* VIEW ACTION (Opens User Details & Activity Viewer) */}
                        <button
                          onClick={() => setUserToView(user)}
                          className={`p-1.5 rounded-lg border transition ${
                            isLight
                              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                              : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-700'
                          }`}
                          title={`View details & activities for ${user.name}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* EDIT ACTION */}
                        {(!(currentUser?.role !== 'supreme_admin' && user.role === 'supreme_admin')) && (
                          <button
                            onClick={() => setUserToEdit(user)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Edit employee details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* DELETE ACTION */}
                        {!isCurrent && user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'supreme_admin' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete staff account for ${user.name}?`)) {
                                deleteUser(user.id);
                                showToast(`Deleted staff account ${user.name}.`);
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-2xs active:scale-95'
                                : 'bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white border-slate-700'
                            }`}
                            title="Delete staff account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Pagination Controls */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs border-t ${
        isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={staffRowsPerPage}
            onChange={(e) => {
              setStaffRowsPerPage(Number(e.target.value));
              setStaffCurrentPage(1);
            }}
            className={`border rounded-lg px-2 py-1 text-xs focus:outline-none ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
            }`}
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="ml-2">
            Showing {filteredUsers.length > 0 ? (staffCurrentPage - 1) * staffRowsPerPage + 1 : 0} to{' '}
            {Math.min(staffCurrentPage * staffRowsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStaffCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={staffCurrentPage === 1}
            className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Previous
          </button>
          {Array.from({ length: totalStaffPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setStaffCurrentPage(page)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                staffCurrentPage === page
                  ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setStaffCurrentPage((prev) => Math.min(prev + 1, totalStaffPages))}
            disabled={staffCurrentPage === totalStaffPages}
            className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Modal: Add New Staff Member (finias POS Replicated users/create) */}
      {showAddUserModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center pt-10 sm:pt-4 p-0 sm:p-4 animate-fadeIn overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseAddUserModal();
            }
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-w-3xl w-full shadow-2xl space-y-4 sm:space-y-5 h-[calc(100dvh-2.5rem)] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden min-w-0">
            {/* Mobile Pull Handle & Top Margin */}
            <div className="pt-1 pb-0 flex justify-center sm:hidden shrink-0">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-white truncate">Add New User</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">finias POS User Creation Form</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAddUserModal}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center shrink-0 active:scale-95 transition cursor-pointer shadow-2xs"
                title="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Section Tab Bar - Smooth Touch Momentum Scrollable */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 shrink-0 custom-scrollbar touch-pan-x overscroll-x-contain min-w-0 w-full">
              {[
                { id: 'basic', label: '1. User Details & Login' },
                { id: 'roles', label: '2. Roles & Locations' },
                { id: 'commission', label: '3. Commission & Discounts' },
                { id: 'personal', label: '4. Personal & HRM Info' },
                { id: 'bank', label: '5. Bank & Payroll' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAddUserTab(tab.id as any)}
                  className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap border shrink-0 active:scale-95 ${
                    addUserTab === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveNewUser} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1 custom-scrollbar touch-pan-y overscroll-y-contain min-w-0 w-full">
              {/* TAB 1: User Details & Login */}
              {addUserTab === 'basic' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row items-start gap-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/80">
                    {/* Avatar Upload zone */}
                    <div className="shrink-0 space-y-1.5 w-full md:w-28 flex flex-col items-center">
                      <label className="block text-slate-400 font-bold text-center text-[11px]">User Photo</label>
                      <div className="relative group w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden transition-all duration-200 hover:border-indigo-500 shadow-inner">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="text-center p-1.5 flex flex-col items-center justify-center">
                            <Camera className="w-4 h-4 text-slate-500 mb-1 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[9px] text-slate-500 font-bold leading-tight">Upload</span>
                          </div>
                        )}
                        
                        {/* File input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAddAvatarFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {formData.avatar ? (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: '' })}
                          className="text-[9px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5 transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <span className="text-[8px] text-slate-500 text-center leading-tight">Max 2MB</span>
                      )}
                    </div>

                    {/* Prefix, Full Name */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Prefix</label>
                        <select
                          value={formData.prefix}
                          onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Miss">Miss</option>
                          <option value="Ms">Ms</option>
                          <option value="Dr">Dr</option>
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">Salutation title</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value, name: `${formData.prefix} ${e.target.value}`.trim() })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">Employee's legal full name</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Official email for system notifications and login recovery</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Primary Mobile Number</label>
                      <input
                        type="text"
                        placeholder="+1 (512) 555-0199"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Direct contact number for verification and SMS alerts</p>
                    </div>
                  </div>

                  {/* Account Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-bold text-slate-300">Is Active?</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Allows user account to operate and record actions in the system</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-bold text-slate-300">Allow Login?</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Enable software credentials for POS register and back-office console</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.allowLogin}
                        onChange={(e) => setFormData({ ...formData, allowLogin: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>

                  {/* Login Credentials */}
                  {formData.allowLogin && (
                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="font-bold text-indigo-400 text-[11px] uppercase tracking-wider">Login Credentials</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Username *</label>
                          <input
                            type="text"
                            required={formData.allowLogin}
                            placeholder="johndoe"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">Unique login handle used for signing in</p>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Password</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">Default temporary password or custom PIN/passcode</p>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">Confirm Password</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">Re-enter the password to confirm verification</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Roles & Locations */}
              {addUserTab === 'roles' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Assigned Role *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        {currentUser?.role === 'supreme_admin' && (
                          <option value="supreme_admin">Supreme Admin</option>
                        )}
                        <option value="admin">Super Admin</option>
                        <option value="manager">Store Manager</option>
                        <option value="inventory_manager">Inventory Specialist</option>
                        <option value="accountant">Accountant</option>
                        <option value="cashier">Cashier & POS Operator</option>
                        {customRoles.map((cr) => (
                          <option key={`add_${cr.id}`} value={cr.roleKey}>{cr.title}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">Determines system privileges, menu access, and functional permissions</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Default Primary Location *</label>
                      <select
                        value={formData.locationId}
                        onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        {availableBranches.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">Primary base store or flagship branch assigned to this staff member</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Access Business Locations / Branches *</label>
                    <p className="text-[11px] text-slate-500 mb-2">Select which store locations this user is authorized to switch between and manage</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                      {availableBranches.map((loc) => {
                        const isChecked = formData.accessLocations.includes(loc.id);
                        return (
                          <label key={loc.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-900 transition">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, accessLocations: [...formData.accessLocations, loc.id] });
                                } else {
                                  setFormData({ ...formData, accessLocations: formData.accessLocations.filter((id) => id !== loc.id) });
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                            />
                            <span className="font-semibold text-slate-200">{loc.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Commission & Discounts */}
              {addUserTab === 'commission' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Commission Agent Type</label>
                      <select
                        value={formData.salesCommissionAgentType}
                        onChange={(e) => setFormData({ ...formData, salesCommissionAgentType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="none">Not Commission Agent</option>
                        <option value="percentage">Based on Sales %</option>
                        <option value="fixed">Fixed Rate per Invoice</option>
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">Select if user earns incentives</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Sales Commission Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2.50"
                        value={formData.salesCommissionPercent}
                        onChange={(e) => setFormData({ ...formData, salesCommissionPercent: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Direct commission percentage earned per completed sales invoice</p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Max Sales Discount (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 15.00"
                        value={formData.maxSalesDiscount}
                        onChange={(e) => setFormData({ ...formData, maxSalesDiscount: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Maximum allowed discount ceiling the user can give at checkout</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Personal & HRM Info */}
              {addUserTab === 'personal' && (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Official date of birth for records</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">Gender identity for HRM files</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Marital Status</label>
                      <select
                        value={formData.maritalStatus}
                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">Legal marital status</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">Medical blood group for workplace safety</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Alternate Phone</label>
                      <input
                        type="text"
                        placeholder="+1 (512) 555-0188"
                        value={formData.altPhone}
                        onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Secondary phone number for backup contact</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Family Emergency Phone</label>
                      <input
                        type="text"
                        placeholder="+1 (512) 555-0177"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Next-of-kin contact for urgent workplace situations</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Guardian / Next of Kin</label>
                      <input
                        type="text"
                        placeholder="Guardian Full Name"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Full legal name of parent, spouse, or emergency guardian</p>
                    </div>
                  </div>

                  {/* Custom Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Custom Field 1</label>
                      <input
                        type="text"
                        placeholder="Additional HR reference..."
                        value={formData.customField1}
                        onChange={(e) => setFormData({ ...formData, customField1: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Custom enterprise attribute or internal badge code</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Custom Field 2</label>
                      <input
                        type="text"
                        placeholder="Additional notes..."
                        value={formData.customField2}
                        onChange={(e) => setFormData({ ...formData, customField2: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Secondary enterprise attribute or certification ID</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Current Address</label>
                      <textarea
                        rows={2}
                        placeholder="Street Address, City, State..."
                        value={formData.currentAddress}
                        onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Present residential living address with street and city</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Permanent Address</label>
                      <textarea
                        rows={2}
                        placeholder="Permanent Home Address..."
                        value={formData.permanentAddress}
                        onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Permanent registered domicile or home address</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Bank Details & Department */}
              {addUserTab === 'bank' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.bankAccountHolder}
                        onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Full name as registered on the employee's bank account</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="9876543210"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Bank account or IBAN number for payroll deposits</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="Chase / HSBC / Bank of America"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Name of the commercial banking institution</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Bank Branch Code / IFSC</label>
                      <input
                        type="text"
                        placeholder="CHASUS33"
                        value={formData.bankCode}
                        onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Branch IFSC, SWIFT, or routing code</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Tax Payer ID / SSN</label>
                      <input
                        type="text"
                        placeholder="TAX-889900"
                        value={formData.taxPayerId}
                        onChange={(e) => setFormData({ ...formData, taxPayerId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Official tax identification or social security number</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="Sales & POS Operations"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Corporate department or organizational business unit</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Designation</label>
                      <input
                        type="text"
                        placeholder="Senior Cashier"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Official job title and operational designation</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 min-w-0 w-full">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {addUserTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                        const idx = tabs.indexOf(addUserTab);
                        if (idx > 0) setAddUserTab(tabs[idx - 1] as any);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-center active:scale-95 transition"
                    >
                      Back
                    </button>
                  )}
                  {addUserTab !== 'bank' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                        const idx = tabs.indexOf(addUserTab);
                        if (idx < tabs.length - 1) setAddUserTab(tabs[idx + 1] as any);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-center active:scale-95 transition"
                    >
                      Next Section
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleCloseAddUserModal}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-center active:scale-95 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save User</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff Member */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center pt-10 sm:pt-4 p-0 sm:p-4 animate-fadeIn overflow-hidden">
          <div className={`rounded-t-3xl sm:rounded-3xl w-full max-w-3xl h-[calc(100dvh-2.5rem)] sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'}`}>
            {/* Mobile Pull Handle & Top Margin */}
            <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b flex items-center justify-between shrink-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>Edit Staff Details</h3>
                  <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Modifying profile, access roles, & HRM logs for <span className="font-bold underline text-indigo-600 dark:text-indigo-400">{userToEdit.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToEdit(null)}
                className={`transition flex items-center justify-center cursor-pointer active:scale-95 shrink-0 ${
                  isLight
                    ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                    : 'w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-2xs'
                }`}
                title="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Horizontal Tabs Switcher */}
            <div className={`flex items-center gap-1.5 border-b text-xs overflow-x-auto shrink-0 scrollbar-none ${
              isLight
                ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'p-2 sm:p-2.5 bg-slate-950/40 border-slate-800'
            }`}>
              {[
                { id: 'basic', label: '1. Details & Login', shortLabel: '1. Details' },
                { id: 'roles', label: '2. Roles & Location', shortLabel: '2. Roles' },
                { id: 'commission', label: '3. Commission & Discount', shortLabel: '3. Comm.' },
                { id: 'personal', label: '4. Personal & HRM Info', shortLabel: '4. HR Info' },
                { id: 'bank', label: '5. Bank & Payroll', shortLabel: '5. Bank' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleEditUserTabChange(tab.id as any)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border text-xs ${
                    editUserTab === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Form Body */}
            <form id="edit-user-form" onSubmit={handleUpdateExistingUser} className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {editUserTab === 'basic' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">Account Credentials & Contact</h4>
                  <div className="flex flex-col md:flex-row items-start gap-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/80">
                    {/* Avatar Upload zone */}
                    <div className="shrink-0 space-y-1.5 w-full md:w-28 flex flex-col items-center">
                      <label className="block text-slate-400 font-bold text-center text-[11px]">User Photo</label>
                      <div className="relative group w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden transition-all duration-200 hover:border-indigo-500 shadow-inner">
                        {userToEdit.avatar ? (
                          <img src={userToEdit.avatar} alt="Avatar preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="text-center p-1.5 flex flex-col items-center justify-center">
                            <Camera className="w-4 h-4 text-slate-500 mb-1 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[9px] text-slate-500 font-bold leading-tight">Upload</span>
                          </div>
                        )}
                        
                        {/* File input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditAvatarFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {userToEdit.avatar ? (
                        <button
                          type="button"
                          onClick={() => setUserToEdit({ ...userToEdit, avatar: '' })}
                          className="text-[9px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-0.5 transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <span className="text-[8px] text-slate-500 text-center leading-tight">Max 2MB</span>
                      )}
                    </div>

                    {/* Prefix, Full Legal Name */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Prefix</label>
                        <select
                          value={userToEdit.prefix || 'Mr'}
                          onChange={(e) => setUserToEdit({ ...userToEdit, prefix: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="Mr">Mr.</option>
                          <option value="Mrs">Mrs.</option>
                          <option value="Ms">Ms.</option>
                          <option value="Dr">Dr.</option>
                          <option value="Prof">Prof.</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 font-semibold mb-1">Full Legal Name *</label>
                        <input
                          type="text"
                          required
                          value={userToEdit.name || ''}
                          placeholder="Full Legal Name (Min 4 letters, no numbers/symbols)"
                          onChange={(e) => {
                            const cleanVal = e.target.value.replace(/[^A-Za-z\s]/g, '');
                            setUserToEdit({ ...userToEdit, name: cleanVal });
                          }}
                          className={`w-full bg-slate-950 border ${
                            userToEdit.name && !validateFullName(userToEdit.name).isValid
                              ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                              : userToEdit.name && validateFullName(userToEdit.name).isValid
                              ? 'border-emerald-500/60 focus:border-emerald-500'
                              : 'border-slate-800 focus:border-indigo-500'
                          } rounded-xl px-3 py-2 text-white focus:outline-none font-bold transition`}
                        />
                        {userToEdit.name ? (
                          validateFullName(userToEdit.name).isValid ? (
                            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                              <span>✓ Valid Full Name ({userToEdit.name.trim().length} alphabetic characters)</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                              <span>{validateFullName(userToEdit.name).error}</span>
                            </p>
                          )
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Employee's legal full name (Min 4 characters, alphabets & spaces only. No numbers or symbols).
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Work Email Address *</label>
                      <input
                        type="email"
                        required
                        value={userToEdit.email || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      {userToEdit.email && users.some(u => u.id !== userToEdit.id && u.email?.trim().toLowerCase() === userToEdit.email.trim().toLowerCase()) && (
                        <span className="text-rose-500 text-[10px] font-bold block mt-1 animate-pulse">Warning: Email already registered by another staff member</span>
                      )}
                    </div>
                    <div>
                      <PhoneInputWithCountry
                        label="Primary Mobile / Phone Number"
                        phoneValue={userToEdit.phone || ''}
                        countryCode={userToEdit.countryCode || '+1'}
                        onChangePhone={(val) => setUserToEdit({ ...userToEdit, phone: val })}
                        onChangeCountryCode={(code) => setUserToEdit({ ...userToEdit, countryCode: code })}
                        showHint={true}
                        required={true}
                      />
                      {userToEdit.phone && users.some(u => u.id !== userToEdit.id && u.phone && isDuplicatePhone(u.phone, userToEdit.phone)) && (
                        <span className="text-rose-500 text-[10px] font-bold block mt-1 animate-pulse">Warning: Mobile number already registered by another staff member</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Account Status</label>
                      {userToEdit.role === 'supreme_admin' ? (
                        <div className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-emerald-400 font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Active (Permanent - Supreme Admin)
                          </span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">Locked Active</span>
                        </div>
                      ) : (
                        <select
                          value={userToEdit.status || 'active'}
                          onChange={(e) => setUserToEdit({ ...userToEdit, status: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="active">Active Status</option>
                          <option value="suspended">Suspended Status</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Enable Login?</label>
                      <div className="flex items-center gap-2.5 mt-2 bg-slate-950/40 p-2.5 border border-slate-800 rounded-xl">
                        <input
                          type="checkbox"
                          checked={userToEdit.allowLogin ?? true}
                          onChange={(e) => setUserToEdit({ ...userToEdit, allowLogin: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                        />
                        <span className="text-slate-300 font-medium">Allow system login credentials</span>
                      </div>
                    </div>
                  </div>

                  {(userToEdit.allowLogin ?? true) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Username (Login ID)</label>
                        <input
                          type="text"
                          value={userToEdit.username || ''}
                          onChange={(e) => setUserToEdit({ ...userToEdit, username: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">New Password (Optional)</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={userToEdit.password || ''}
                          onChange={(e) => setUserToEdit({ ...userToEdit, password: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editUserTab === 'roles' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">Roles & Authorized Branches</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Assigned RBAC Role</label>
                      <select
                        value={userToEdit.role}
                        onChange={(e) => setUserToEdit({ ...userToEdit, role: e.target.value as UserRole })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-extrabold"
                      >
                        {currentUser?.role === 'supreme_admin' && (
                          <option value="supreme_admin">Supreme Admin</option>
                        )}
                        <option value="admin">Super Admin</option>
                        <option value="manager">Store Manager</option>
                        <option value="inventory_manager">Inventory Specialist</option>
                        <option value="accountant">Accountant</option>
                        <option value="cashier">Cashier & POS Operator</option>
                        {customRoles.map((cr) => (
                          <option key={`edit_${cr.id}`} value={cr.roleKey}>{cr.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Default Business Location</label>
                      <select
                        value={userToEdit.locationId || defaultBranchId}
                        onChange={(e) => setUserToEdit({ ...userToEdit, locationId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        {availableBranches.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {editUserTab === 'commission' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">Sales Incentives & Discount Limits</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Commission Agent Type</label>
                      <select
                        value={userToEdit.salesCommissionAgentType || 'none'}
                        onChange={(e) => setUserToEdit({ ...userToEdit, salesCommissionAgentType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="none">Not Commission Agent</option>
                        <option value="percentage">Based on Sales %</option>
                        <option value="fixed">Fixed Rate per Invoice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Sales Commission (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2.50"
                        value={userToEdit.salesCommissionPercent ?? ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, salesCommissionPercent: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Max Sales Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 15.0"
                        value={userToEdit.maxSalesDiscount ?? ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, maxSalesDiscount: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editUserTab === 'personal' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">Personal Details & HRM Log</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Gender</label>
                      <select
                        value={userToEdit.gender || 'Male'}
                        onChange={(e) => setUserToEdit({ ...userToEdit, gender: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Marital Status</label>
                      <select
                        value={userToEdit.maritalStatus || 'Single'}
                        onChange={(e) => setUserToEdit({ ...userToEdit, maritalStatus: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Blood Group</label>
                      <input
                        type="text"
                        placeholder="e.g. O+"
                        value={userToEdit.bloodGroup || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, bloodGroup: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={userToEdit.dob || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, dob: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Sales & POS Operations"
                        value={userToEdit.department || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, department: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Designation</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Cashier"
                        value={userToEdit.designation || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, designation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
                    <div>
                      <PhoneInputWithCountry
                        label="Alternate Contact Phone"
                        phoneValue={userToEdit.altPhone || ''}
                        countryCode={userToEdit.altCountryCode || '+1'}
                        onChangePhone={(val) => setUserToEdit({ ...userToEdit, altPhone: val })}
                        onChangeCountryCode={(code) => setUserToEdit({ ...userToEdit, altCountryCode: code })}
                        showHint={false}
                      />
                    </div>
                    <div>
                      <PhoneInputWithCountry
                        label="Emergency Contact Phone"
                        phoneValue={userToEdit.emergencyPhone || ''}
                        countryCode={userToEdit.emergencyCountryCode || '+1'}
                        onChangePhone={(val) => setUserToEdit({ ...userToEdit, emergencyPhone: val })}
                        onChangeCountryCode={(code) => setUserToEdit({ ...userToEdit, emergencyCountryCode: code })}
                        showHint={false}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Guardian Name / Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g. Robert Smith (Father)"
                        value={userToEdit.guardianName || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, guardianName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Current Address</label>
                      <textarea
                        rows={2}
                        placeholder="Line address, City, ZIP, Country"
                        value={userToEdit.currentAddress || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, currentAddress: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Permanent Address</label>
                      <textarea
                        rows={2}
                        placeholder="Same as current, or physical address"
                        value={userToEdit.permanentAddress || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, permanentAddress: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editUserTab === 'bank' && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">Bank Details & Payroll Settings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Bank Account Holder Name</label>
                      <input
                        type="text"
                        value={userToEdit.bankAccountHolder || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, bankAccountHolder: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={userToEdit.bankAccountNumber || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, bankAccountNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={userToEdit.bankName || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, bankName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Bank Identifier Code (IFSC / SWIFT)</label>
                      <input
                        type="text"
                        value={userToEdit.bankCode || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, bankCode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Tax Payer ID (SSN / PAN / TIN)</label>
                      <input
                        type="text"
                        value={userToEdit.taxPayerId || ''}
                        onChange={(e) => setUserToEdit({ ...userToEdit, taxPayerId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

            </form>

            {/* Sticky Action Buttons Footer */}
            <div className={`p-3 sm:p-4 border-t shrink-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'}`}>
              {/* Mobile 2-Row Layout (< sm) */}
              <div className="flex flex-col gap-2 sm:hidden">
                {/* Row 1: Step Navigation */}
                <div className="flex items-center gap-2">
                  {editUserTab !== 'basic' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                        const idx = tabs.indexOf(editUserTab);
                        if (idx > 0) setEditUserTab(tabs[idx - 1] as any);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition border ${
                        isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {editUserTab !== 'bank' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                        const idx = tabs.indexOf(editUserTab);
                        if (idx < tabs.length - 1) setEditUserTab(tabs[idx + 1] as any);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <span>Next Section</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Row 2: Cancel & Save Changes */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className={`flex-1 text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isLight
                        ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                        : 'py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-user-form"
                    className="flex-[1.5] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

              {/* Desktop Row (>= sm) */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editUserTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                        const idx = tabs.indexOf(editUserTab);
                        if (idx > 0) setEditUserTab(tabs[idx - 1] as any);
                      }}
                      className={`px-4 py-2 rounded-xl font-semibold transition border ${
                        isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      Back
                    </button>
                  )}
                  {editUserTab !== 'bank' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                        const idx = tabs.indexOf(editUserTab);
                        if (idx < tabs.length - 1) setEditUserTab(tabs[idx + 1] as any);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold transition"
                    >
                      Next Section
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className={`text-xs font-semibold transition flex items-center justify-center cursor-pointer ${
                      isLight
                        ? 'p-1.5 rounded-lg border transition bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                        : 'px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-user-form"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details & Activities Modal */}
      {userToView && (
        <UserDetailsModal
          user={userToView}
          isOpen={!!userToView}
          onClose={() => setUserToView(null)}
          onEdit={(u) => {
            setUserToView(null);
            setUserToEdit(u);
          }}
        />
      )}

      {/* User-based Role & Permissions Management Modal */}
      {userToManageRole && (
        <UserRolePermissionsModal
          user={userToManageRole}
          isOpen={!!userToManageRole}
          onClose={() => setUserToManageRole(null)}
          onToast={showToast}
          customRoles={customRoles}
          onAddCustomRole={handleAddCustomRole}
          onUpdateCustomRole={handleUpdateCustomRole}
          onDeleteCustomRole={handleDeleteCustomRole}
        />
      )}

      {/* Lock Confirmation Modal */}
      {userToLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scaleIn border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${isLight ? 'bg-amber-100 border-amber-50 text-amber-600' : 'bg-amber-500/20 border-amber-500/10 text-amber-400'}`}>
                <ShieldAlert className="w-7 h-7" />
              </div>
              
              <div className="space-y-2">
                <h3 className={`text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Lock Staff Account?
                </h3>
                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Are you sure you want to freeze and lock the account for <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>{userToLock.name}</strong>? They will be immediately disconnected.
                </p>
              </div>

              <div className="flex w-full gap-3 pt-4">
                <button
                  onClick={() => setUserToLock(null)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    lockUser(userToLock.id);
                    showToast(`Locked account for ${userToLock.name}.`);
                    setUserToLock(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all"
                >
                  Yes, Lock Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
