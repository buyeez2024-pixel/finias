import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { UserRole } from '../../types/erp';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';
import { validatePhoneWithCountry } from '../../utils/phoneValidation';
import { validateEmail } from '../../utils/formatters';
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
} from 'lucide-react';

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

  const [isManualUsername, setIsManualUsername] = useState(false);
  const [isManualPassword, setIsManualPassword] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

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
    accessLocations: availableBranches.map((l) => l.id),
    locationId: defaultBranchId,
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
        if (formData.email.trim()) {
          autoUser = formData.email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '');
        } else if (formData.firstName.trim()) {
          autoUser = formData.firstName.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '');
        } else {
          autoUser = 'staff_user';
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

  const handleBackToUsers = () => {
    setUserMenuSubTab('users');
    setActiveTab('user_menu');
  };

  const handleSaveUser = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    const fullName = formData.prefix
      ? `${formData.prefix} ${formData.firstName}`.trim()
      : formData.firstName.trim();
    if (!formData.firstName.trim()) {
      showFlashNotification('Full Name is required.', 'error');
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

    const finalUsername = formData.username.trim() || formData.email.trim().split('@')[0] || formData.firstName.trim().toLowerCase().replace(/\s+/g, '');
    const finalPassword = formData.password || 'Password@123';

    if (formData.allowLogin && formData.password && formData.password !== formData.confirmPassword) {
      showFlashNotification('Password and Confirm Password do not match.', 'error');
      setActiveSectionTab('basic');
      return;
    }

    // Validate phone with selected country code
    if (formData.phone.trim()) {
      const phoneVal = validatePhoneWithCountry(formData.phone, formData.countryCode);
      if (!phoneVal.isValid) {
        if (phoneVal.error?.includes('India (+91)') || phoneVal.error?.includes('91')) {
          setFormData((prev) => ({ ...prev, countryCode: '+91' }));
        }
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
        status: formData.isActive ? 'active' : 'suspended',
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
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToUsers}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Users</span>
            </button>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              POS/users/create
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 pt-1">
            <UserPlus className="w-6 h-6 text-indigo-400" />
            <span>Add User</span>
          </h1>
          <p className="text-xs text-slate-400">
            Create user credentials, assign granular RBAC roles, configure branch permissions, and setup payroll details.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleBackToUsers}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveUser}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Navigation Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
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
              onClick={() => setActiveSectionTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition whitespace-nowrap border ${
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

      {/* Form Form Body */}
      <form onSubmit={handleSaveUser} noValidate className="space-y-6">
        {/* TAB 1: User Details & Login */}
        {activeSectionTab === 'basic' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-sm">
              <User className="w-4 h-4" />
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
                    placeholder="e.g. John Doe"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Employee's legal full name</p>
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
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-extrabold text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Login Account Credentials</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualUsername(false);
                      setIsManualPassword(false);
                      const fn = formData.firstName.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '') || 'staff';
                      const autoU = formData.email.trim()
                        ? formData.email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '')
                        : fn;
                      setFormData((prev) => ({
                        ...prev,
                        username: autoU,
                        password: 'Password@123',
                        confirmPassword: 'Password@123',
                      }));
                    }}
                    className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1 transition w-fit"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-Generate Credentials</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    Username & default password (<strong>Password@123</strong>) are generated automatically. The user can update their password later in their profile settings.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">
                      Username <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) => {
                        setIsManualUsername(true);
                        setFormData({ ...formData, username: e.target.value });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-bold"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Unique login handle used for signing in</p>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1 flex items-center justify-between">
                      <span>Password</span>
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {showPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPasswordText ? 'Hide' : 'Show'}</span>
                      </button>
                    </label>
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
                    <p className="text-[11px] text-slate-500 mt-1">Default temporary password or custom PIN/passcode</p>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Confirm Password</label>
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setIsManualPassword(true);
                        setFormData({ ...formData, confirmPassword: e.target.value });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Re-enter the password to confirm verification</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Roles & Locations */}
        {activeSectionTab === 'roles' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>RBAC Role Assignment & Branch Permissions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">
                  Assigned RBAC Role <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    const defaults = getRoleDefaults(newRole);
                    setFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      department: defaults.department,
                      designation: defaults.designation,
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
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Determines system privileges, menu access, and functional permissions</p>
              </div>

              <div>
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

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">
                Accessible Business Branches / Locations
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Select which store locations this user is authorized to switch between and manage</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                {availableBranches.map((loc) => {
                  const isChecked = formData.accessLocations.includes(loc.id);
                  return (
                    <label
                      key={loc.id}
                      className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
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
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                      />
                      <span className="font-bold text-xs text-slate-200">{loc.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Commission & Discount */}
        {activeSectionTab === 'commission' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-sm">
              <DollarSign className="w-4 h-4" />
              <span>Sales Commission & POS Discount Limits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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

              <div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-sm">
              <Building className="w-4 h-4" />
              <span>Personal, Contact & Emergency Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Official date of birth for records</p>
              </div>

              <div>
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

              <div>
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

              <div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <PhoneInputWithCountry
                  label="Alternate Contact Phone"
                  phoneValue={formData.altPhone}
                  countryCode={formData.altCountryCode}
                  onChangePhone={(altPhone) => setFormData({ ...formData, altPhone })}
                  onChangeCountryCode={(altCountryCode) => setFormData({ ...formData, altCountryCode })}
                />
                <p className="text-[11px] text-slate-500 mt-1">Secondary phone number for backup contact</p>
              </div>

              <div>
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

            <div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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

              <div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-bold text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Banking & Organizational Structure</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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

              <div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
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

              <div>
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

              <div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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

              <div>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {activeSectionTab !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                  const idx = tabs.indexOf(activeSectionTab);
                  if (idx > 0) setActiveSectionTab(tabs[idx - 1] as any);
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                ← Previous Section
              </button>
            )}
            {activeSectionTab !== 'bank' && (
              <button
                type="button"
                onClick={() => {
                  const tabs = ['basic', 'roles', 'commission', 'personal', 'bank'];
                  const idx = tabs.indexOf(activeSectionTab);
                  if (idx < tabs.length - 1) setActiveSectionTab(tabs[idx + 1] as any);
                }}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs"
              >
                Next Section →
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToUsers}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
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
