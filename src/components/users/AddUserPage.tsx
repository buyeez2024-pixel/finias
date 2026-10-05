import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { GRANULAR_CAPABILITIES } from '../../data/granularCapabilities';
import { UserRole, ErpModuleId, RolePermissions } from '../../types/erp';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';
import { validatePhoneWithCountry } from '../../utils/phoneValidation';
import { validateEmail } from '../../utils/formatters';
import { validateUserData, validateFullName } from '../../utils/validation';
import { FormFieldError } from '../common/FormFieldError';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building,
  DollarSign,
  User,
  CreditCard,
  Sparkles,
  Save,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
  Camera,
  Trash2,
  Copy,
  Check,
  Lock,
  ShieldAlert,
  Wand2,
} from 'lucide-react';

export interface PasswordStrengthResult {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  badgeClass: string;
  percentage: number;
  checks: {
    minLength: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
  };
}

export function evaluatePasswordStrength(pass: string): PasswordStrengthResult {
  if (!pass) {
    return {
      score: 0,
      label: 'Not set',
      color: 'text-slate-500',
      bgColor: 'bg-slate-700',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      percentage: 0,
      checks: { minLength: false, upper: false, lower: false, number: false, special: false },
    };
  }

  const checks = {
    minLength: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass),
  };

  let score = 0;
  if (pass.length >= 6) score += 1;
  if (checks.minLength) score += 1;
  if (checks.upper && checks.lower) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: 'Weak Password',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      percentage: 25,
      checks,
    };
  } else if (score === 2 || score === 3) {
    return {
      score: 2,
      label: 'Medium Password',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      percentage: 50,
      checks,
    };
  } else if (score === 4) {
    return {
      score: 3,
      label: 'Strong Password',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      percentage: 75,
      checks,
    };
  } else {
    return {
      score: 4,
      label: 'Very Strong & Secure',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      percentage: 100,
      checks,
    };
  }
}

export function generateRandomStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%^&*_-+=';
  const all = upper + lower + digits + specials;

  let pass = '';
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += specials[Math.floor(Math.random() * specials.length)];

  for (let i = 4; i < 14; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass.split('').sort(() => 0.5 - Math.random()).join('');
}

export function generateMemorablePassword(): string {
  const words = ['Royal', 'Summit', 'Apex', 'Crown', 'Falcon', 'Silver', 'Nova', 'Titan', 'Vanguard', 'Swift', 'Phoenix', 'Quantum'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const symbols = ['@', '#', '$', '!'];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  return `${word}Staff${sym}${num}`;
}

export function getRoleDefaults(role: string): { department: string; designation: string } {
  switch (role) {
    case 'supreme_admin':
      return {
        department: 'Supreme Executive Board',
        designation: 'Supreme Master Administrator',
      };
    case 'admin':
    case 'superadmin':
      return {
        department: 'Executive Board & Administration',
        designation: 'Super Administrator / Executive Director',
      };
    case 'manager':
      return {
        department: 'Store Operations & Management',
        designation: 'General Store Manager',
      };
    case 'inventory_manager':
      return {
        department: 'Warehouse & Supply Chain',
        designation: 'Inventory & Stock Specialist',
      };
    case 'accountant':
      return {
        department: 'Finance & Accounts',
        designation: 'Senior Accountant & Auditor',
      };
    case 'cashier':
      return {
        department: 'Front Desk & POS Sales',
        designation: 'Cashier & POS Operator',
      };
    default:
      return {
        department: '',
        designation: '',
      };
  }
}

export const AddUserPage: React.FC = () => {
  const {
    addUser,
    locations,
    selectedLocationId,
    currentUser,
    settings,
    showFlashNotification,
    setActiveTab,
    setUserMenuSubTab,
    users,
    rolePermissions,
    customRoles = [],
  } = useErp();

  // Business-scoped locations
  const currentBusinessName = (currentUser?.businessName || settings?.businessName || settings?.name || '').trim().toLowerCase();
  const currentBusinessId = currentUser?.businessId;

  const businessLocations = useMemo(() => {
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

  const isDuplicatePhone = (phoneA: string, phoneB: string) => {
    const digitsA = phoneA.replace(/\D/g, '');
    const digitsB = phoneB.replace(/\D/g, '');
    if (digitsA.length < 7 || digitsB.length < 7) return false;
    const minLen = Math.min(digitsA.length, digitsB.length);
    const endA = digitsA.slice(-minLen);
    const endB = digitsB.slice(-minLen);
    return endA === endB;
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showFlashNotification('Image size must be less than 2MB', 'error');
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

  const [activeSectionTab, setActiveSectionTab] = useState<
    'basic' | 'roles' | 'commission' | 'personal' | 'bank'
  >('basic');

  const validateCurrentTab = (currentTab: string): boolean => {
    if (currentTab === 'basic') {
      const fullNameValidation = validateFullName(formData.firstName);
      if (!fullNameValidation.isValid) {
        showFlashNotification(fullNameValidation.error || 'Full Name is required and must be at least 4 alphabetic characters long.', 'error');
        return false;
      }

      if (!formData.email.trim()) {
        showFlashNotification('Email Address is required.', 'error');
        return false;
      }

      if (!validateEmail(formData.email)) {
        showFlashNotification('Please enter a valid email address with a proper domain (e.g. name@mail.com).', 'error');
        return false;
      }

      if (!formData.phone.trim()) {
        showFlashNotification('Primary Mobile / Phone Number is required.', 'error');
        return false;
      }

      const phoneVal = validatePhoneWithCountry(formData.phone, formData.countryCode, true);
      if (!phoneVal.isValid) {
        showFlashNotification(`Primary Mobile Phone Error: ${phoneVal.error}`, 'error');
        return false;
      }

      const fullNameClean = formData.firstName.trim().toLowerCase();
      if (users.some((u) => u.name?.trim().toLowerCase() === fullNameClean || u.firstName?.trim().toLowerCase() === fullNameClean)) {
        showFlashNotification('This name is already taken. Please enter a unique name.', 'error');
        return false;
      }

      const emailClean = formData.email.trim().toLowerCase();
      if (users.some((u) => u.email?.trim().toLowerCase() === emailClean)) {
        showFlashNotification('Email is already registered, please sign in.', 'error');
        return false;
      }

      if (users.some((u) => u.phone && isDuplicatePhone(u.phone, formData.phone))) {
        showFlashNotification('Mobile number is already registered by another staff member.', 'error');
        return false;
      }
    }

    if (currentTab === 'commission') {
      const comm = parseFloat(formData.salesCommissionPercent) || 0;
      const disc = parseFloat(formData.maxSalesDiscount) || 0;

      if (comm < 0) {
        showFlashNotification('Sales Commission Percentage cannot be negative.', 'error');
        return false;
      }
      if (disc < 0) {
        showFlashNotification('Max Sales Discount Percentage cannot be negative.', 'error');
        return false;
      }
      if (comm > 0 && disc < comm) {
        showFlashNotification(`Max Sales Discount (%) cannot be less than Sales Commission Percentage (${comm}%).`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSectionTabChange = (targetTab: 'basic' | 'roles' | 'commission' | 'personal' | 'bank') => {
    const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
    const currentIdx = tabs.indexOf(activeSectionTab);
    const targetIdx = tabs.indexOf(targetTab);

    if (targetIdx > currentIdx) {
      if (!validateCurrentTab(activeSectionTab)) {
        return;
      }
    }
    setActiveSectionTab(targetTab);
  };

  const [isManualUsername, setIsManualUsername] = useState(false);
  const [isManualPassword, setIsManualPassword] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isSaveAttempted, setIsSaveAttempted] = useState(false);

  const MODULE_OPTIONS: Array<{ id: ErpModuleId; label: string; desc: string }> = [
    { id: 'dashboard', label: 'Dashboard / Home', desc: 'KPI metrics, charts & executive summary' },
    { id: 'pos', label: 'Point of Sale (POS)', desc: 'Checkout terminal, register & scanning' },
    { id: 'inventory', label: 'Products & Inventory', desc: 'Stock audit, catalog & warehouse transfers' },
    { id: 'purchases', label: 'Purchases & Inward', desc: 'Supplier POs, inward stock & bills' },
    { id: 'sales', label: 'Sales & Invoices', desc: 'Invoices & sales transaction logs' },
    { id: 'contacts', label: 'Contacts (CRM)', desc: 'Customers & suppliers directory' },
    { id: 'expenses', label: 'Expenses', desc: 'Petty cash & store operational overheads' },
    { id: 'reports', label: 'Reports & P&L', desc: 'P&L, stock reports & financial analytics' },
    { id: 'ai', label: 'AI Intelligence', desc: 'Gemini demand forecasting & insights' },
    { id: 'user_menu', label: 'User Profile & Menu', desc: 'Personal profile & user menu' },
    { id: 'settings', label: 'Settings', desc: 'Tax & company configuration' },
    { id: 'security', label: 'Security & RBAC', desc: 'Employee access permissions & roles' },
  ];

  const getRoleDefaultModules = (roleKey: string): ErpModuleId[] => {
    if (rolePermissions && rolePermissions[roleKey]?.allowedModules) {
      return rolePermissions[roleKey].allowedModules;
    }
    const customRoleDef = customRoles.find((cr) => cr.roleKey === roleKey || cr.id === roleKey);
    if (customRoleDef?.allowedModules) {
      return customRoleDef.allowedModules;
    }
    switch (roleKey) {
      case 'supreme_admin':
      case 'admin':
        return ['dashboard', 'pos', 'inventory', 'purchases', 'sales', 'contacts', 'expenses', 'reports', 'ai', 'settings', 'user_menu'];
      case 'manager':
        return ['dashboard', 'pos', 'inventory', 'purchases', 'sales', 'contacts', 'expenses', 'reports', 'user_menu'];
      case 'inventory_manager':
        return ['dashboard', 'inventory', 'purchases', 'user_menu'];
      case 'accountant':
        return ['dashboard', 'expenses', 'reports', 'sales', 'purchases', 'user_menu'];
      case 'cashier':
      default:
        return ['pos', 'sales', 'user_menu'];
    }
  };

  const [formData, setFormData] = useState({
    prefix: 'Mr',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    isActive: true,
    allowLogin: true,
    username: '',
    password: '',
    confirmPassword: '',
    role: '' as any,
    customAllowedModules: ['pos', 'sales', 'user_menu'] as ErpModuleId[],
    customPermissions: {} as Record<string, boolean>,
    accessLocations: availableBranches.map((l) => l.id),
    locationId: defaultBranchId,
    salesCommissionAgentType: 'none',
    salesCommissionPercent: '',
    maxSalesDiscount: '',
    dob: '',
    gender: 'Male',
    maritalStatus: 'Single',
    bloodGroup: 'O+',
    altPhone: '',
    altCountryCode: '+1',
    emergencyPhone: '',
    emergencyCountryCode: '+1',
    guardianName: '',
    customField1: '',
    customField2: '',
    customField3: '',
    customField4: '',
    currentAddress: '',
    permanentAddress: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    bankName: '',
    bankCode: '',
    taxPayerId: '',
    department: '',
    designation: '',
    avatar: '',
  });

  // Auto-generate Username and Default Password when allowLogin is enabled
  React.useEffect(() => {
    if (formData.allowLogin) {
      let autoUser = formData.username;
      let autoPass = formData.password;
      let autoConfirm = formData.confirmPassword;

      if (!isManualUsername) {
        let rawBase = '';
        if (formData.email.trim()) {
          rawBase = formData.email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '');
        } else if (formData.firstName.trim()) {
          rawBase = formData.firstName.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '');
        } else {
          rawBase = 'staff_user';
        }

        if (rawBase.length < 8) {
          autoUser = `${rawBase}_staff2026#`;
        } else if (!/[@_#\.\-\$!]/.test(rawBase)) {
          autoUser = `${rawBase}_staff#`;
        } else {
          autoUser = rawBase;
        }
      }

      if (!isManualPassword) {
        autoPass = 'Password@123';
        autoConfirm = 'Password@123';
      }

      if (
        autoUser !== formData.username ||
        autoPass !== formData.password ||
        autoConfirm !== formData.confirmPassword
      ) {
        setFormData((prev) => ({
          ...prev,
          username: autoUser,
          password: autoPass,
          confirmPassword: autoConfirm,
        }));
      }
    }
  }, [formData.allowLogin, formData.email, formData.firstName, isManualUsername, isManualPassword]);

  const usernameValidationError = useMemo(() => {
    if (!formData.allowLogin) return null;
    const u = (formData.username || '').trim();
    if (!u) {
      return 'Please enter a Username.';
    }
    if (u.length < 8) {
      return 'Username must be at least 8 characters long (contains alphanumeric & special characters).';
    }
    if (!/^[A-Za-z0-9@_#\.\-\$!]+$/.test(u)) {
      return 'Username can only contain alphanumeric characters and allowed special symbols (@, _, ., -, #, !, $).';
    }
    return null;
  }, [formData.allowLogin, formData.username]);

  const passwordStrength = useMemo(() => {
    return evaluatePasswordStrength(formData.password);
  }, [formData.password]);

  const handleApplyGeneratedPassword = (type: 'strong' | 'memorable' | 'default') => {
    let newPass = 'Password@123';
    if (type === 'strong') {
      newPass = generateRandomStrongPassword();
    } else if (type === 'memorable') {
      newPass = generateMemorablePassword();
    }
    setIsManualPassword(true);
    setFormData((prev) => ({
      ...prev,
      password: newPass,
      confirmPassword: newPass,
    }));
    showFlashNotification(
      type === 'strong'
        ? 'Generated strong 14-character secure password!'
        : type === 'memorable'
        ? 'Generated memorable easy-to-read password!'
        : 'Applied standard default password.',
      'success'
    );
  };

  const handleCopyPassword = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
    showFlashNotification('Password copied to clipboard!', 'success');
  };

  const handleBackToUsers = () => {
    setUserMenuSubTab('users');
    setActiveTab('user_menu');
  };

  const handleSaveUser = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsSaveAttempted(true);

    const fullName = formData.prefix
      ? `${formData.prefix} ${formData.firstName}`.trim()
      : formData.firstName.trim();

    const finalUsername = formData.username.trim() || formData.email.trim().split('@')[0] || formData.firstName.trim().toLowerCase().replace(/\s+/g, '');
    const finalPassword = formData.password || 'Password@123';

    if (formData.allowLogin && usernameValidationError) {
      showFlashNotification(usernameValidationError, 'error');
      setActiveSectionTab('basic');
      return;
    }

    const fullNameClean = formData.firstName.trim().toLowerCase();
    if (users.some((u) => u.name?.trim().toLowerCase() === fullNameClean || u.firstName?.trim().toLowerCase() === fullNameClean)) {
      showFlashNotification('This name is already taken. Please enter a unique name.', 'error');
      setActiveSectionTab('basic');
      return;
    }

    // Run strict schema validation
    const schemaRes = validateUserData({
      username: finalUsername,
      email: formData.email,
      fullName: formData.firstName,
      password: formData.allowLogin ? finalPassword : undefined,
      role: formData.role,
      isNewUser: true,
    });

    if (!schemaRes.isValid) {
      showFlashNotification(schemaRes.firstError || 'Please fix user profile errors before saving.', 'error');
      if (schemaRes.errors.username || schemaRes.errors.email || schemaRes.errors.password || schemaRes.errors.fullName) {
        setActiveSectionTab('basic');
      } else if (schemaRes.errors.role) {
        setActiveSectionTab('roles');
      }
      return;
    }

    const fullNameValidation = validateFullName(formData.firstName);
    if (!fullNameValidation.isValid) {
      showFlashNotification(fullNameValidation.error || 'Full Name must contain only alphabetic letters (A-Z, a-z) and be at least 4 characters long.', 'error');
      setActiveSectionTab('basic');
      return;
    }

    if (!formData.email.trim()) {
      showFlashNotification('Email Address is required.', 'error');
      setActiveSectionTab('basic');
      return;
    }

    if (!validateEmail(formData.email)) {
      showFlashNotification('Please enter a valid email address with a proper domain (e.g. name@mail.com).', 'error');
      setActiveSectionTab('basic');
      return;
    }

    if (!formData.phone.trim()) {
      showFlashNotification('Primary Mobile / Phone Number is required.', 'error');
      setActiveSectionTab('basic');
      return;
    }

    const emailClean = formData.email.trim().toLowerCase();
    if (users.some(u => u.email?.trim().toLowerCase() === emailClean)) {
      showFlashNotification('Email is already registered, please sign in', 'error');
      setActiveSectionTab('basic');
      return;
    }

    if (formData.phone.trim()) {
      const phoneExists = users.some(u => u.phone && isDuplicatePhone(u.phone, formData.phone));
      if (phoneExists) {
        showFlashNotification('Mobile number is already registered', 'error');
        setActiveSectionTab('basic');
        return;
      }
    }

    if (!formData.role) {
      showFlashNotification('Assigned RBAC Role is required. Please select a role under the Roles & Locations tab.', 'error');
      setActiveSectionTab('roles');
      return;
    }

    if (formData.allowLogin && formData.password && formData.password !== formData.confirmPassword) {
      showFlashNotification('Password and Confirm Password do not match.', 'error');
      setActiveSectionTab('basic');
      return;
    }

    // Validate phone with selected country code
    if (formData.phone.trim()) {
      const phoneVal = validatePhoneWithCountry(formData.phone, formData.countryCode);
      if (!phoneVal.isValid) {
        showFlashNotification(`Mobile Phone Error: ${phoneVal.error}`, 'error');
        setActiveSectionTab('basic');
        return;
      }
    }

    if (formData.altPhone.trim()) {
      const altVal = validatePhoneWithCountry(formData.altPhone, formData.altCountryCode);
      if (!altVal.isValid) {
        showFlashNotification(`Alternate Phone Error: ${altVal.error}`, 'error');
        setActiveSectionTab('personal');
        return;
      }
    }

    if (formData.emergencyPhone.trim()) {
      const emVal = validatePhoneWithCountry(formData.emergencyPhone, formData.emergencyCountryCode);
      if (!emVal.isValid) {
        showFlashNotification(`Emergency Contact Phone Error: ${emVal.error}`, 'error');
        setActiveSectionTab('personal');
        return;
      }
    }

    const commVal = parseFloat(formData.salesCommissionPercent) || 0;
    const discVal = parseFloat(formData.maxSalesDiscount) || 0;

    if (commVal < 0) {
      showFlashNotification('Sales Commission Percentage cannot be negative.', 'error');
      setActiveSectionTab('commission');
      return;
    }
    if (discVal < 0) {
      showFlashNotification('Max Sales Discount Percentage cannot be negative.', 'error');
      setActiveSectionTab('commission');
      return;
    }
    if (commVal > 0 && discVal < commVal) {
      showFlashNotification(`Max Sales Discount (%) cannot be less than Sales Commission Percentage (${commVal}%).`, 'error');
      setActiveSectionTab('commission');
      return;
    }

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    ];

    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    const fullPhone = formData.phone.trim() ? `${formData.countryCode} ${formData.phone.trim()}` : '+1 (512) 555-0199';

    try {
      const activeBizName = currentUser?.businessName || settings?.businessName || settings?.name || 'Royal POSfini';
      const activeBizId = currentUser?.businessId;
      const activeLocId = formData.locationId || defaultBranchId;

      addUser({
        ...formData,
        name: fullName,
        username: finalUsername,
        password: finalPassword,
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        role: formData.role,
        locationId: activeLocId,
        status: formData.role === 'supreme_admin' ? 'active' : (formData.isActive ? 'active' : 'suspended'),
        avatar: formData.avatar.trim() || randomAvatar,
        businessName: activeBizName,
        businessId: activeBizId,
      } as any);

      showFlashNotification(`User account "${fullName}" created successfully!`, 'success');
      handleBackToUsers();
    } catch (err: any) {
      showFlashNotification(err.message || 'Failed to create user account.', 'error');
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 animate-fadeIn min-w-0 w-full overflow-x-hidden">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl min-w-0 w-full overflow-hidden">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBackToUsers}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-xl transition active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Users</span>
            </button>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              POS/users/create
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 pt-1 truncate">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
            <span className="truncate">Add User</span>
          </h1>
          <p className="text-xs text-slate-400 line-clamp-2">
            Create user credentials, assign granular RBAC roles, configure branch permissions, and setup payroll details.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleBackToUsers}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl sm:rounded-2xl text-xs font-bold transition text-center active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveUser}
            className="flex-1 md:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl sm:rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save User</span>
          </button>
        </div>
      </div>

      {/* Navigation Section Tabs - Smooth Touch Momentum Scrollable */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-slate-800 custom-scrollbar touch-pan-x overscroll-x-contain shrink-0 min-w-0 w-full">
        {[
          { id: 'basic', label: '1. User Details & Login', icon: User },
          { id: 'roles', label: '2. Roles & Locations', icon: ShieldCheck },
          { id: 'commission', label: '3. Commission & Discount', icon: DollarSign },
          { id: 'personal', label: '4. Personal & HRM Info', icon: Building },
          { id: 'bank', label: '5. Bank Details & Payroll', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSectionTabChange(tab.id as any)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap shrink-0 border active:scale-95 ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSaveUser} noValidate className="space-y-4 sm:space-y-6 min-w-0 w-full">
        {/* TAB 1: User Details & Login */}
        {activeSectionTab === 'basic' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-fadeIn min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-xs sm:text-sm">
              <User className="w-4 h-4 shrink-0" />
              <span>Basic User Details & Credentials</span>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6 bg-slate-950/30 p-5 rounded-2xl border border-slate-800/80">
              {/* Avatar Upload zone */}
              <div className="shrink-0 space-y-2 w-full md:w-32 flex flex-col items-center">
                <label className="block text-xs text-slate-400 font-bold text-center">User Photo</label>
                <div className="relative group w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden transition-all duration-200 hover:border-indigo-500 shadow-inner">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center p-2 flex flex-col items-center justify-center">
                      <Camera className="w-5 h-5 text-slate-500 mb-1 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[10px] text-slate-500 font-bold leading-tight">Upload</span>
                    </div>
                  )}
                  
                  {/* File input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {formData.avatar ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: '' })}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                ) : (
                  <span className="text-[9px] text-slate-500 text-center leading-tight">PNG, JPG up to 2MB</span>
                )}
              </div>

              {/* Prefix, Full Name */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Prefix</label>
                  <select
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">Salutation title</p>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs text-slate-400 font-semibold mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe (Min 4 letters, no numbers/symbols)"
                    value={formData.firstName}
                    onChange={(e) => {
                      // Filter out numeric digits, symbols, and special characters immediately
                      const cleanVal = e.target.value.replace(/[^A-Za-z\s]/g, '');
                      setFormData({ ...formData, firstName: cleanVal });
                    }}
                    className={`w-full bg-slate-950 border ${
                      formData.firstName && !validateFullName(formData.firstName).isValid
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20'
                        : formData.firstName && validateFullName(formData.firstName).isValid
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    } rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold transition`}
                  />
                  {formData.firstName ? (
                    validateFullName(formData.firstName).isValid ? (
                      <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                        <span>✓ Valid Full Name ({formData.firstName.trim().length} alphabetic characters)</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <span>{validateFullName(formData.firstName).error}</span>
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
                <label className="block text-xs text-slate-400 font-semibold mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="john.doe@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Official email for system notifications and login recovery</p>
                {formData.email.trim() && users.some(u => u.email?.trim().toLowerCase() === formData.email.trim().toLowerCase()) && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    Email is already registered, please sign in
                  </p>
                )}
              </div>

              {/* Country Code & Phone input */}
              <div>
                <PhoneInputWithCountry
                  label="Primary Mobile / Phone Number"
                  phoneValue={formData.phone}
                  countryCode={formData.countryCode}
                  onChangePhone={(phone) => setFormData({ ...formData, phone })}
                  onChangeCountryCode={(countryCode) => setFormData({ ...formData, countryCode })}
                  showHint={true}
                  required={true}
                />
                <p className="text-[11px] text-slate-500 mt-1">Direct contact number for verification and SMS alerts</p>
                {formData.phone.trim() && users.some(u => u.phone && isDuplicatePhone(u.phone, formData.phone)) && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    Mobile number is already registered
                  </p>
                )}
              </div>
            </div>

            {/* Account Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <label className="flex items-center justify-between cursor-pointer p-1">
                <div>
                  <span className="font-bold text-xs text-slate-200">Is Active Status?</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Allows user account to operate and record actions in the system</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1">
                <div>
                  <span className="font-bold text-xs text-slate-200">Allow Software Login?</span>
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

            {/* Login Credentials Section */}
            {formData.allowLogin && (
              <div className="p-4 sm:p-5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
                  <div>
                    <h4 className="font-extrabold text-indigo-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Login Account Credentials</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Generate high-security passwords, evaluate strength, or use custom passcodes
                    </p>
                  </div>

                  {/* Auto-Generation Action Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleApplyGeneratedPassword('strong')}
                      className="text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                      title="Generate high-entropy 14-character cryptographic password"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Generate Strong</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyGeneratedPassword('memorable')}
                      className="text-[10px] font-bold text-sky-300 hover:text-white bg-sky-500/15 hover:bg-sky-500/25 px-2.5 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                      title="Generate memorable staff password (e.g. RoyalStaff@789)"
                    >
                      <Key className="w-3.5 h-3.5 text-sky-400" />
                      <span>Generate Memorable</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsManualUsername(false);
                        setIsManualPassword(false);
                        const fn = formData.firstName.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '') || 'staff';
                        let autoU = formData.email.trim()
                          ? formData.email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '')
                          : fn;
                        if (autoU.length < 8) {
                          autoU = `${autoU}_staff2026#`;
                        } else if (!/[@_#\.\-\$!]/.test(autoU)) {
                          autoU = `${autoU}_staff#`;
                        }
                        setFormData((prev) => ({
                          ...prev,
                          username: autoU,
                          password: 'Password@123',
                          confirmPassword: 'Password@123',
                        }));
                      }}
                      className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 px-2.5 py-1.5 rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition active:scale-95"
                      title="Reset to default username and standard password"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Default</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Username */}
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Username <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. johndoe_staff#2026"
                      value={formData.username}
                      onChange={(e) => {
                        setIsManualUsername(true);
                        setFormData({ ...formData, username: e.target.value });
                      }}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-bold font-mono ${
                        (isSaveAttempted || isManualUsername) && usernameValidationError
                          ? 'border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-800'
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Minimum 8 characters containing alphanumeric characters and special characters (@, _, ., -, #, !, $)
                    </p>
                    {(isSaveAttempted || isManualUsername) && usernameValidationError && (
                      <span className="text-[10px] text-rose-400 font-semibold block mt-1">
                        {usernameValidationError}
                      </span>
                    )}
                  </div>

                  {/* Password Input with Visibility and Copy */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>Password</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {formData.password && (
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                            title="Copy Password"
                          >
                            {copiedPassword ? (
                              <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                                <Check className="w-3 h-3" /> Copied!
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Copy
                              </span>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPasswordText(!showPasswordText)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          {showPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPasswordText ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => {
                        setIsManualPassword(true);
                        setFormData({ ...formData, password: e.target.value });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters (8+ recommended)</p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400 font-semibold">Confirm Password</label>
                      {formData.password && formData.confirmPassword && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                          formData.password === formData.confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {formData.password === formData.confirmPassword ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Passwords match
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" /> Passwords do not match
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setIsManualPassword(true);
                        setFormData({ ...formData, confirmPassword: e.target.value });
                      }}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-800'
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Re-enter the password to confirm verification</p>
                  </div>
                </div>

                {/* Password Strength Meter & Security Evaluator */}
                {formData.password && (
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5 mt-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">Password Strength:</span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${passwordStrength.badgeClass}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${passwordStrength.color}`}>
                        {passwordStrength.percentage}% Score
                      </span>
                    </div>

                    {/* Visual Strength Progress Segments */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-950 p-0.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 1 ? passwordStrength.bgColor : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 2 ? passwordStrength.bgColor : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 3 ? passwordStrength.bgColor : 'bg-slate-800'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 4 ? passwordStrength.bgColor : 'bg-slate-800'
                      }`} />
                    </div>

                    {/* Criteria Checklist Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-[10px]">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                        passwordStrength.checks.minLength
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}>
                        {passwordStrength.checks.minLength ? <Check className="w-2.5 h-2.5" /> : '○'} 8+ Chars
                      </span>

                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                        passwordStrength.checks.upper
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}>
                        {passwordStrength.checks.upper ? <Check className="w-2.5 h-2.5" /> : '○'} Uppercase (A-Z)
                      </span>

                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                        passwordStrength.checks.lower
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}>
                        {passwordStrength.checks.lower ? <Check className="w-2.5 h-2.5" /> : '○'} Lowercase (a-z)
                      </span>

                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                        passwordStrength.checks.number
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}>
                        {passwordStrength.checks.number ? <Check className="w-2.5 h-2.5" /> : '○'} Number (0-9)
                      </span>

                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                        passwordStrength.checks.special
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}>
                        {passwordStrength.checks.special ? <Check className="w-2.5 h-2.5" /> : '○'} Special Symbol (!@#$)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Roles & Locations */}
        {activeSectionTab === 'roles' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-fadeIn min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>RBAC Role Assignment & Branch Permissions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">
                  Assigned RBAC Role <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    const defaults = getRoleDefaults(newRole);
                    const defaultMods = getRoleDefaultModules(newRole);
                    setFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      department: defaults.department,
                      designation: defaults.designation,
                      customAllowedModules: defaultMods,
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-extrabold focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select Role</option>
                  {currentUser?.role === 'supreme_admin' && (
                    <option value="supreme_admin">Supreme Admin</option>
                  )}
                  <option value="cashier">Cashier & POS Operator</option>
                  <option value="manager">Store Manager</option>
                  <option value="admin">Super Admin</option>
                  <option value="inventory_manager">Inventory Specialist</option>
                  <option value="accountant">Accountant</option>
                  {customRoles.map((cr) => (
                    <option key={cr.id} value={cr.roleKey}>
                      {cr.title} (Custom)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Determines system privileges, menu access, and functional permissions</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Default Primary Location</label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
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

            <div className="min-w-0">
              <label className="block text-xs text-slate-400 font-semibold mb-1">
                Accessible Business Branches / Locations
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Select which store locations this user is authorized to switch between and manage</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-4 bg-slate-950/80 rounded-2xl border border-slate-800 min-w-0">
                {availableBranches.map((loc) => {
                  const isChecked = formData.accessLocations.includes(loc.id);
                  return (
                    <label
                      key={loc.id}
                      className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition min-w-0"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              accessLocations: [...formData.accessLocations, loc.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              accessLocations: formData.accessLocations.filter((id) => id !== loc.id),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 shrink-0"
                      />
                      <span className="font-bold text-xs text-slate-200 truncate">{loc.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Extra Module Access & Granular Privileges */}
            <div className="min-w-0 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-extrabold text-indigo-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Custom Module Access & Menu Privileges</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Grant specific extra module access (e.g. Reports) directly to this user beyond base role defaults
                  </p>
                </div>

                {/* Quick Action Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.customAllowedModules.includes('reports')) {
                        setFormData((prev) => ({
                          ...prev,
                          customAllowedModules: [...prev.customAllowedModules, 'reports'],
                        }));
                        showFlashNotification('Granted Reports & P&L access to this user!', 'success');
                      }
                    }}
                    className="text-[10px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-500/30 transition cursor-pointer active:scale-95"
                  >
                    + Grant Reports Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.customAllowedModules.includes('inventory')) {
                        setFormData((prev) => ({
                          ...prev,
                          customAllowedModules: [...prev.customAllowedModules, 'inventory'],
                        }));
                        showFlashNotification('Granted Inventory access to this user!', 'success');
                      }
                    }}
                    className="text-[10px] font-bold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 px-2.5 py-1 rounded-lg border border-sky-500/30 transition cursor-pointer active:scale-95"
                  >
                    + Grant Inventory Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.customAllowedModules.includes('contacts')) {
                        setFormData((prev) => ({
                          ...prev,
                          customAllowedModules: [...prev.customAllowedModules, 'contacts'],
                        }));
                        showFlashNotification('Granted Contacts CRM access to this user!', 'success');
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer active:scale-95"
                  >
                    + Grant Contacts Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaultMods = getRoleDefaultModules(formData.role || 'cashier');
                      setFormData((prev) => ({ ...prev, customAllowedModules: defaultMods }));
                      showFlashNotification('Reset modules to base role defaults.', 'info');
                    }}
                    className="text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer active:scale-95"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {MODULE_OPTIONS.map((mod) => {
                  const isChecked = formData.customAllowedModules.includes(mod.id as any);
                  const isBaseDefault = getRoleDefaultModules(formData.role || 'cashier').includes(mod.id as any);
                  const isExtraCustom = isChecked && !isBaseDefault;

                  return (
                    <label
                      key={mod.id}
                      className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border transition ${
                        isChecked
                          ? isExtraCustom
                            ? 'bg-amber-950/30 border-amber-500/50 text-white'
                            : 'bg-indigo-950/30 border-indigo-500/50 text-white'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              customAllowedModules: [...prev.customAllowedModules, mod.id as any],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              customAllowedModules: prev.customAllowedModules.filter((m) => m !== mod.id),
                            }));
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs">{mod.label}</span>
                          {isExtraCustom && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Extra Granted
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{mod.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Granular Operational Capabilities Matrix for New User */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                {(() => {
                  const selectedRole = formData.role || 'cashier';
                  const activeUserModules = selectedRole === 'supreme_admin'
                    ? MODULE_OPTIONS.map((m) => m.id)
                    : (formData.customAllowedModules || getRoleDefaultModules(selectedRole));

                  const activeCapabilities = GRANULAR_CAPABILITIES.filter(
                    (cap) => selectedRole === 'supreme_admin' || activeUserModules.includes(cap.module)
                  );

                  const handleNewUserQuickPreset = (preset: 'view' | 'edit' | 'full') => {
                    if (selectedRole === 'supreme_admin') {
                      showFlashNotification('Supreme Admin retains full authority.', 'info');
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

                    setFormData((prev) => ({
                      ...prev,
                      customPermissions: {
                        ...prev.customPermissions,
                        ...updates,
                      },
                    }));
                    showFlashNotification(`Applied "${preset === 'view' ? 'View Only' : preset === 'edit' ? 'Can Edit Only' : 'Full Access'}" matrix to user.`, 'info');
                  };

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Granular Operational Capabilities Matrix
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
                              onClick={() => handleNewUserQuickPreset('view')}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition cursor-pointer"
                            >
                              View Only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNewUserQuickPreset('edit')}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
                            >
                              Can Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNewUserQuickPreset('full')}
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
                            No modules are currently assigned to this account in the Module Access Permissions section above.
                            Check any module (e.g., Contacts CRM, Products & Inventory, POS, Sales) to configure its granular View, Edit, and Delete operational capabilities.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {activeCapabilities.map((cap) => {
                            const roleDefaultVal = selectedRole === 'supreme_admin' || Boolean(rolePermissions[selectedRole]?.[cap.key as keyof RolePermissions]);
                            const isExplicitUserOverride = formData.customPermissions[cap.key] !== undefined;
                            const activeVal = isExplicitUserOverride ? Boolean(formData.customPermissions[cap.key]) : roleDefaultVal;

                            return (
                              <div
                                key={cap.key}
                                onClick={() => {
                                  if (selectedRole === 'supreme_admin') {
                                    showFlashNotification('Supreme Admin retains full authority.', 'info');
                                    return;
                                  }
                                  const newVal = !activeVal;
                                  setFormData((prev) => ({
                                    ...prev,
                                    customPermissions: {
                                      ...prev.customPermissions,
                                      [cap.key]: newVal,
                                    },
                                  }));
                                  showFlashNotification(`Set "${cap.label}" to ${newVal ? 'ENABLED' : 'DISABLED'} for this account.`, 'info');
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
                                  </div>
                                  <h5 className="font-extrabold text-xs leading-snug">{cap.label}</h5>
                                  <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-2">
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
                                        <span className="text-[10px] font-bold text-emerald-600">✓</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-400">✕</span>
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
          </div>
        )}

        {/* TAB 3: Commission & Discount */}
        {activeSectionTab === 'commission' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-fadeIn min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-xs sm:text-sm">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>Sales Commission & POS Discount Limits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Commission Agent Type</label>
                <select
                  value={formData.salesCommissionAgentType}
                  onChange={(e) => setFormData({ ...formData, salesCommissionAgentType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                >
                  <option value="none">Not Commission Agent</option>
                  <option value="percentage">Based on Sales %</option>
                  <option value="fixed">Fixed Rate per Invoice</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Select if user earns sales incentives</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Sales Commission Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2.50"
                  value={formData.salesCommissionPercent}
                  onChange={(e) => setFormData({ ...formData, salesCommissionPercent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Direct commission percentage earned per completed sales invoice</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Max Sales Discount (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 15.00"
                  value={formData.maxSalesDiscount}
                  onChange={(e) => setFormData({ ...formData, maxSalesDiscount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Maximum allowed discount ceiling the user can give at checkout</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Personal & HRM Info */}
        {activeSectionTab === 'personal' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-fadeIn min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-xs sm:text-sm">
              <Building className="w-4 h-4 shrink-0" />
              <span>Personal, Contact & Emergency Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Official date of birth for records</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Gender identity for HRM files</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Marital Status</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Legal marital status</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
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

            {/* Alternate & Emergency Phones with Country Validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <PhoneInputWithCountry
                  label="Alternate Contact Phone"
                  phoneValue={formData.altPhone}
                  countryCode={formData.altCountryCode}
                  onChangePhone={(altPhone) => setFormData({ ...formData, altPhone })}
                  onChangeCountryCode={(altCountryCode) => setFormData({ ...formData, altCountryCode })}
                />
                <p className="text-[11px] text-slate-500 mt-1">Secondary phone number for backup contact</p>
              </div>

              <div className="min-w-0">
                <PhoneInputWithCountry
                  label="Family Emergency Phone"
                  phoneValue={formData.emergencyPhone}
                  countryCode={formData.emergencyCountryCode}
                  onChangePhone={(emergencyPhone) => setFormData({ ...formData, emergencyPhone })}
                  onChangeCountryCode={(emergencyCountryCode) => setFormData({ ...formData, emergencyCountryCode })}
                />
                <p className="text-[11px] text-slate-500 mt-1">Next-of-kin contact for urgent workplace situations</p>
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs text-slate-400 font-semibold mb-1">Guardian / Next of Kin Name</label>
              <input
                type="text"
                placeholder="Full Legal Name of Guardian"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Full legal name of parent, spouse, or emergency guardian</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Current Residence Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, State, Zip code..."
                  value={formData.currentAddress}
                  onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Present residential living address with street and city</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Permanent Address</label>
                <textarea
                  rows={2}
                  placeholder="Permanent Home Address..."
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Permanent registered domicile or home address</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Bank Details & Payroll */}
        {activeSectionTab === 'bank' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-fadeIn min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Banking & Organizational Structure</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.bankAccountHolder}
                  onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Full name as registered on the employee's bank account</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Bank account or IBAN number for payroll deposits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="Chase / HSBC / Citi"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Name of the commercial banking institution</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">IFSC / Branch Routing Code</label>
                <input
                  type="text"
                  placeholder="CHASUS33"
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Branch IFSC, SWIFT, or routing code</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Tax Payer ID / SSN</label>
                <input
                  type="text"
                  placeholder="TAX-889900"
                  value={formData.taxPayerId}
                  onChange={(e) => setFormData({ ...formData, taxPayerId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Official tax identification or social security number</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Sales & POS Operations"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Corporate department or organizational business unit</p>
              </div>

              <div className="min-w-0">
                <label className="block text-xs text-slate-400 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="Senior Cashier & POS Operator"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Official job title and operational designation</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-slate-800 min-w-0 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeSectionTab !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<'basic' | 'roles' | 'commission' | 'personal' | 'bank'> = ['basic', 'roles', 'commission', 'personal', 'bank'];
                  const idx = tabs.indexOf(activeSectionTab);
                  if (idx > 0) handleSectionTabChange(tabs[idx - 1]);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs text-center active:scale-95"
              >
                ← Previous Section
              </button>
            )}
            {activeSectionTab !== 'bank' && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<'basic' | 'roles' | 'commission' | 'personal' | 'bank'> = ['basic', 'roles', 'commission', 'personal', 'bank'];
                  const idx = tabs.indexOf(activeSectionTab);
                  if (idx < tabs.length - 1) handleSectionTabChange(tabs[idx + 1]);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl sm:rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs text-center active:scale-95"
              >
                Next Section →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleBackToUsers}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition text-center active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
