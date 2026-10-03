import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { UserSessionsManager } from './UserSessionsManager';
import { validateEmail } from '../../utils/formatters';
import { validateFullName } from '../../utils/validation';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  Eye,
  EyeOff,
  Palette,
  Building2,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, settings, updateSettings, locations, showFlashNotification } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Core profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    username: '',
    language: 'en',
  });

  // Password fields state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'sessions' | 'preferences'>('profile');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; text: string; color: string }>({ score: 0, text: 'Very Weak', color: 'bg-rose-500' });

  // Load current user details on open
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        avatar: currentUser.avatar || '',
        username: currentUser.username || currentUser.email?.split('@')[0] || '',
        language: currentUser.language || 'en',
      });
      // Reset security fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setFormErrors({});
    }
  }, [isOpen, currentUser]);

  // Handle password strength calculation
  useEffect(() => {
    const pwd = passwordData.newPassword;
    if (!pwd) {
      setPasswordStrength({ score: 0, text: 'No Password Entered', color: 'bg-slate-800' });
      return;
    }

    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    let text = 'Very Weak';
    let color = 'bg-rose-500';

    if (score >= 4) {
      text = 'Excellent (Strong)';
      color = 'bg-emerald-500';
    } else if (score >= 3) {
      text = 'Good (Medium)';
      color = 'bg-amber-500';
    } else if (score >= 2) {
      text = 'Weak';
      color = 'bg-rose-400';
    }

    setPasswordStrength({ score, text, color });
  }, [passwordData.newPassword]);

  if (!isOpen || !currentUser) return null;

  // Avatar selector
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showFlashNotification('Avatar image size must be less than 2MB', 'error');
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

  // Submit profile details update
  const handleSaveProfile = () => {
    const errors: Record<string, string> = {};
    const nameCheck = validateFullName(formData.name);
    if (!nameCheck.isValid && nameCheck.error) {
      errors.name = nameCheck.error;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address with a proper domain (e.g. name@mail.com)';
    }

    if (formData.username.trim()) {
      if (formData.username.trim().length < 8) {
        errors.username = 'Username must be at least 8 characters long (contains alphanumeric & special characters)';
      } else if (!/^[A-Za-z0-9@_#\.\-\$!]+$/.test(formData.username.trim())) {
        errors.username = 'Username can only contain alphanumeric characters and allowed special symbols (@, _, ., -, #, !, $)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showFlashNotification('Please resolve the highlighted validation errors', 'error');
      return;
    }

    try {
      updateUser(currentUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        avatar: formData.avatar,
        username: formData.username.trim(),
        language: formData.language,
      });
      showFlashNotification('Your profile details updated successfully!', 'success');
      setFormErrors({});
    } catch (err: any) {
      showFlashNotification(err.message || 'Failed to update profile', 'error');
    }
  };

  // Submit password security change
  const handleSavePassword = () => {
    const errors: Record<string, string> = {};
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must contain at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showFlashNotification('Please resolve password confirmation errors', 'error');
      return;
    }

    try {
      updateUser(currentUser.id, {
        password: passwordData.newPassword,
      });
      showFlashNotification('Your password has been changed successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFormErrors({});
    } catch (err: any) {
      showFlashNotification(err.message || 'Failed to update security password', 'error');
    }
  };

  // Handle active settings layout toggle
  const handleThemeToggle = (mode: 'light' | 'dark') => {
    updateSettings({ themeMode: mode });
    showFlashNotification(`Theme set to ${mode === 'dark' ? 'Dark Luxury' : 'Professional Light'}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className={`w-full max-w-2xl rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-2xl' : 'bg-slate-900 border-slate-800 shadow-2xl'} overflow-hidden flex flex-col transition-all duration-300`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-850 bg-slate-900/60'}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-500 tracking-widest uppercase">
              System Account Settings
            </span>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'} flex items-center gap-2`}>
              <UserIcon className="w-5 h-5 text-indigo-500" />
              <span>My Profile Management</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              isLight
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className={`flex gap-1 px-6 py-2 border-b ${isLight ? 'border-slate-100 bg-slate-50/20' : 'border-slate-800/60 bg-slate-900/30'} overflow-x-auto`}>
          <button
            onClick={() => { setActiveSubTab('profile'); setFormErrors({}); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
              activeSubTab === 'profile'
                ? isLight
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                  : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : isLight
                ? 'bg-indigo-50/40 border-indigo-100/50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-600/15'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            Identity & Contact
          </button>
          <button
            onClick={() => { setActiveSubTab('security'); setFormErrors({}); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
              activeSubTab === 'security'
                ? isLight
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                  : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : isLight
                ? 'bg-indigo-50/40 border-indigo-100/50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-600/15'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            Access & Security
          </button>
          <button
            onClick={() => { setActiveSubTab('sessions'); setFormErrors({}); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
              activeSubTab === 'sessions'
                ? isLight
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                  : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : isLight
                ? 'bg-indigo-50/40 border-indigo-100/50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-600/15'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            Active Devices & Sessions
          </button>
          <button
            onClick={() => { setActiveSubTab('preferences'); setFormErrors({}); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
              activeSubTab === 'preferences'
                ? isLight
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                  : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : isLight
                ? 'bg-indigo-50/40 border-indigo-100/50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-600/15'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            App Preferences
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          
          {/* TAB 1: Profile Details */}
          {activeSubTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Avatar upload */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className={`w-full p-4 rounded-2xl border flex flex-col items-center justify-center ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-950/40 border-slate-800'}`}>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Avatar Portrait
                  </label>
                  <div className={`relative group w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 shadow-inner ${
                    isLight ? 'bg-slate-100 border-slate-300 hover:border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-indigo-500'
                  }`}>
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center p-2 flex flex-col items-center justify-center">
                        <Camera className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-[10px] text-slate-500 font-bold">Upload</span>
                      </div>
                    )}
                    
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
                      className="text-[10px] font-extrabold text-rose-500 hover:text-rose-400 flex items-center gap-1 mt-3 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Avatar</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-500 text-center leading-tight mt-2.5 block">
                      Square JPG or PNG, Max 2MB
                    </span>
                  )}
                </div>

                {/* Role badge card */}
                <div className={`w-full mt-4 p-4 rounded-2xl border text-center ${isLight ? 'bg-indigo-50/30 border-indigo-100/50' : 'bg-indigo-950/10 border-indigo-900/20'}`}>
                  <span className="text-[9px] font-black tracking-widest text-indigo-400 block uppercase mb-1">My Privilege Level</span>
                  <p className={`text-xs font-extrabold capitalize ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {currentUser?.role?.replace('_', ' ') || 'Authorized User'}
                  </p>
                  <span className="text-[9px] text-slate-500 mt-1 block">Configured by Admin Policy</span>
                </div>

                {/* Assigned Business & Branch Card */}
                <div className={`w-full mt-3 p-3.5 rounded-2xl border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'}`}>
                  <span className="text-[9px] font-black tracking-widest text-indigo-400 block uppercase mb-1 flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>Registered Business</span>
                  </span>
                  <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {currentUser?.businessName || settings?.businessName || settings?.name || 'Royal POSfini'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {locations.find(l => l.id === currentUser?.locationId)?.name || currentUser?.businessName || settings?.businessName || 'Royal POSfini'}
                  </p>
                </div>
              </div>

              {/* Identity fields */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/[^A-Za-z\s]/g, '');
                        setFormData({ ...formData, name: cleanVal });
                      }}
                      className={`w-full rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                          : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                      } ${formErrors.name ? 'border-rose-500 ring-1 ring-rose-500/10' : ''}`}
                      placeholder="Jane Doe (Min 4 letters, alphabets only)"
                    />
                    {formErrors.name && (
                      <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all ${
                        formErrors.username ? 'border-rose-500 ring-1 ring-rose-500/20' : ''
                      } ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                          : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                      }`}
                      placeholder="e.g. janedoe_staff#2026"
                    />
                    <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Minimum 8 characters containing alphanumeric characters and special characters (@, _, ., -, #, !, $)
                    </p>
                    {formErrors.username && (
                      <p className="text-[11px] text-rose-400 mt-1 font-semibold flex items-center gap-1">
                        <span>{formErrors.username}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                    </span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold focus:outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                          : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                      } ${formErrors.email ? 'border-rose-500 ring-1 ring-rose-500/10' : ''}`}
                      placeholder="jane@example.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Contact phone
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold focus:outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                          : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                      }`}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Office or Home Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 pointer-events-none">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    </span>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={`w-full rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold focus:outline-none transition-all resize-none ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                          : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                      }`}
                      placeholder="Specify your residential or branch address details..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/15"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Contact Changes</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Access & Password Security */}
          {activeSubTab === 'security' && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isLight ? 'bg-amber-50/50 border-amber-100 text-slate-700' : 'bg-amber-950/10 border-amber-900/20 text-slate-300'
              }`}>
                <Key className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-amber-400">Security Best Practices</p>
                  <p className="text-[11px] leading-relaxed">
                    Always use a strong, unique password comprising combinations of upper/lowercase text, numbers, and symbols. Changing your password here instantly updates your authorized demo session credentials.
                  </p>
                </div>
              </div>

              {/* Password update form */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    New Security Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={`w-full rounded-xl pl-3.5 pr-10 py-2 text-xs font-semibold focus:outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                          : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                      } ${formErrors.newPassword ? 'border-rose-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.newPassword && (
                    <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {formErrors.newPassword}
                    </p>
                  )}

                  {/* Password strength meter bar */}
                  {passwordData.newPassword && (
                    <div className="mt-2.5 space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-semibold">Password Integrity:</span>
                        <span className="font-extrabold text-slate-300">{passwordStrength.text}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-full flex-1 transition-all duration-300 ${
                              i < passwordStrength.score ? passwordStrength.color : 'bg-slate-800/60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`w-full rounded-xl pl-3.5 pr-10 py-2 text-xs font-semibold focus:outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                          : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                      } ${formErrors.confirmPassword ? 'border-rose-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSavePassword}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/15"
                  >
                    <Key className="w-4 h-4" />
                    <span>Change My Password</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Active Devices & Sessions */}
          {activeSubTab === 'sessions' && (
            <div className="py-2">
              <UserSessionsManager filterUserId={currentUser?.id} showSettings={false} />
            </div>
          )}

          {/* TAB 3: Preferences */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-6 max-w-lg mx-auto">
              
              {/* Theme Settings Selector */}
              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>Visual Theme Layout Mode</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Instantly customize the system skin style. The application overrides tailwind color arrays live across all dashboards, point of sale register registers, and inventory records.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  {/* Light Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('light')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isLight
                        ? 'bg-indigo-50/20 border-indigo-500 ring-2 ring-indigo-500/15'
                        : 'bg-slate-950/20 border-slate-800 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-black ${isLight ? 'text-indigo-600' : 'text-slate-400'}`}>
                        Daylight White
                      </span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isLight ? 'border-indigo-500 bg-indigo-600' : 'border-slate-750 bg-transparent'}`}>
                        {isLight && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="h-6 w-full rounded bg-slate-100 border border-slate-200 flex items-center px-1.5 gap-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <div className="w-8 h-1 bg-slate-300 rounded" />
                    </div>
                  </button>

                  {/* Dark Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeToggle('dark')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      !isLight
                        ? 'bg-indigo-950/20 border-indigo-500 ring-2 ring-indigo-500/15'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-black ${!isLight ? 'text-indigo-400' : 'text-slate-600'}`}>
                        Dark Cyber Luxury
                      </span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${!isLight ? 'border-indigo-500 bg-indigo-600' : 'border-slate-350 bg-transparent'}`}>
                        {!isLight && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="h-6 w-full rounded bg-slate-950 border border-slate-800 flex items-center px-1.5 gap-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <div className="w-8 h-1 bg-slate-700 rounded" />
                    </div>
                  </button>
                </div>
              </div>

              <hr className={isLight ? 'border-slate-100' : 'border-slate-800'} />

              {/* Language Preferences */}
              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>Language Localization</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Toggle language standards. The primary display language of this authorized user is synchronized to the profile context.
                </p>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Globe className="h-3.5 w-3.5 text-slate-500" />
                  </span>
                  <select
                    value={formData.language}
                    onChange={(e) => {
                      setFormData({ ...formData, language: e.target.value });
                      updateUser(currentUser.id, { language: e.target.value });
                      showFlashNotification('Localization language updated!', 'success');
                    }}
                    className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                        : 'bg-slate-950 border border-slate-850 text-white focus:border-indigo-500'
                    }`}
                  >
                    <option value="en">English (United States)</option>
                    <option value="es">Español (España)</option>
                    <option value="fr">Français (France)</option>
                    <option value="de">Deutsch (Deutschland)</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-850 bg-slate-900/40'} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isLight
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
