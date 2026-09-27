import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { RoyalLogo } from '../common/RoyalLogo';
import { NetworkSyncStatusBadge } from '../common/NetworkSyncStatusBadge';
import { OfflineSyncManagerModal } from '../pos/OfflineSyncManagerModal';
import { PosCalculatorModal } from '../pos/PosCalculatorModal';
import { UserProfileModal } from '../users/UserProfileModal';
import { resetServerInstallation } from '../../services/systemService';
import {
  Menu,
  Building2,
  Database,
  ShoppingCart,
  PlusCircle,
  Sparkles,
  Maximize,
  Minimize,
  RefreshCw,
  User,
  DollarSign,
  Package,
  ArrowUpRight,
  Store,
  Layers,
  CheckCircle2,
  LogOut,
  UserPlus,
  Users,
  Shield,
  Wifi,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Moon,
  Calculator,
  Bell,
  Lock,
  Unlock,
  Mail,
} from 'lucide-react';

interface NavbarProps {
  onOpenRegisterModal?: () => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
  onOpenQuickProduct?: () => void;
  onOpenQuickExpense?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRegisterModal = () => {},
  onOpenQuickSale = () => {},
  onOpenQuickPurchase = () => {},
  onOpenQuickProduct = () => {},
  onOpenQuickExpense = () => {},
}) => {
  const {
    settings = {},
    updateSettings = () => {},
    locations = [],
    selectedLocationId = 'loc_main',
    setSelectedLocationId = () => {},
    activeTab,
    setActiveTab = () => {},
    cashRegister = { status: 'closed' },
    cart = [],
    resetToDefaults = () => {},
    currentUser = null,
    users = [],
    unlockUser = () => {},
    logout = () => {},
    switchUser = () => {},
    hasModuleAccess = () => true,
    openAddProductPage = () => {},
    navigateToInventory = () => {},
    navigateToSettings = () => {},
    toggleMobileSidebar = () => {},
  } = useErp() || {};

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const lockedUsers = (users || []).filter((u) => u.status === 'locked');
  const unlockRequestedUsers = lockedUsers.filter((u) => u.unlockRequested);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shrink-0 z-30 shadow-xs transition-colors duration-300">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5">
        {/* Left Branding & Mobile Drawer Toggle & Location Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Navigation Drawer Toggle */}
          {activeTab !== 'pos' && (
            <button
              id="mobile-nav-toggle-btn"
              type="button"
              onClick={toggleMobileSidebar}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5 text-indigo-400" />
            </button>
          )}

          <div
            id="brand-logo-btn"
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer transition-opacity hover:opacity-90 flex items-center shrink-0 min-w-fit"
            title="Dashboard"
          >
            <RoyalLogo
              size="md"
              showText={false}
            />
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Location / Warehouse Selector */}
          <div className="relative hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/70">
            <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Branch:</span>
            <select
              id="branch-location-select"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2 max-w-[200px] truncate"
            >
              {(locations || []).map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                  {loc.name} {loc.code ? `(${loc.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Calculator Tool - Only enabled when POS screen/terminal is active */}
          {(() => {
            const isPosActive = activeTab === 'pos';
            return (
              <button
                id="nav-quick-calculator-btn"
                type="button"
                disabled={!isPosActive}
                onClick={() => {
                  if (isPosActive) {
                    setShowCalculator(true);
                  }
                }}
                className={`hidden sm:flex p-1.5 rounded-lg border items-center justify-center transition group ${
                  isPosActive
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 border-slate-700 cursor-pointer'
                    : 'bg-slate-800/40 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-40'
                }`}
                title={
                  isPosActive
                    ? 'Open Calculator & Retail Math (F9)'
                    : 'Calculator is enabled only when POS Terminal is in use'
                }
              >
                <Calculator className={`w-4 h-4 ${isPosActive ? 'text-indigo-400 group-hover:scale-110 transition-transform' : 'text-slate-600'}`} />
              </button>
            );
          })()}

          {/* Quick-Access Theme Mode Switcher */}
          <button
            id="quick-theme-mode-toggle"
            type="button"
            onClick={() => {
              const nextMode = settings?.themeMode === 'light' ? 'dark' : 'light';
              updateSettings({ themeMode: nextMode });
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition group cursor-pointer shrink-0"
            title={settings?.themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {settings?.themeMode === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Network & Offline Sync Status Indicator */}
          <div className="hidden xs:block sm:block">
            <NetworkSyncStatusBadge onClick={() => setShowOfflineManager(true)} />
          </div>

          {/* Register Status Indicator */}
          <button
            id="register-shift-status-btn"
            onClick={onOpenRegisterModal}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition shrink-0 ${
              cashRegister.status === 'open'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-700/50 hover:bg-rose-900/60'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                cashRegister.status === 'open' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">
              {cashRegister.status === 'open' ? 'Shift Active' : 'Register Closed'}
            </span>
          </button>

          {/* Quick POS Terminal Button */}
          <button
            id="launch-pos-nav-btn"
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition shrink-0 ${
              activeTab === 'pos'
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">POS Screen</span>
            <span className="sm:hidden text-xs">POS</span>
            {cart.length > 0 && (
              <span 
                id="nav-pos-cart-badge"
                className="h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full ml-0.5 sm:ml-1.5 shadow-md border leading-none bg-white border-slate-200"
              >
                <span className="text-[10px] sm:text-[11px] font-black leading-none text-slate-950">
                  {cart.reduce((a, b) => a + (Number(b.quantity) || 0), 0)}
                </span>
              </span>
            )}
          </button>

          {/* Admin Security & Lockout Notifications Bell */}
          <div className="relative">
            <button
              id="admin-security-bell-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title={
                lockedUsers.length > 0
                  ? `${lockedUsers.length} account(s) locked. ${unlockRequestedUsers.length} unlock request mail(s) received.`
                  : 'Security Notifications'
              }
            >
              <Bell className="w-4 h-4" />
              {lockedUsers.length > 0 && (
                <span
                  id="nav-security-alert-badge"
                  className={`absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white ${
                    unlockRequestedUsers.length > 0
                      ? 'bg-rose-600 animate-pulse ring-2 ring-rose-500/50'
                      : 'bg-amber-600 ring-1 ring-amber-500/50'
                  }`}
                >
                  {lockedUsers.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 py-2 z-50 text-xs animate-fadeIn text-slate-200">
                <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-xs">Security & Lockout Notifications</span>
                  </div>
                  {lockedUsers.length > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      {lockedUsers.length} locked
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                  {lockedUsers.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="font-semibold text-xs text-white">No Security Alerts</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">All staff accounts are in active standing.</p>
                    </div>
                  ) : (
                    lockedUsers.map((u) => (
                      <div key={u.id} className="p-3.5 hover:bg-slate-800/40 transition space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-white text-xs">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                            Brute-Force
                          </span>
                        </div>

                        {u.unlockRequested ? (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                            <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
                            <span>Unlock Request Notification Mail Received! User requested immediate unlock.</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">
                            Account frozen. User waiting for freeze duration (or can send request mail).
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              unlockUser(u.id);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Unlock User Now</span>
                          </button>
                          <span className="text-[10px] text-emerald-400 font-medium">
                            Immediate password login
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigateToSettings('permissions');
                    }}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    Manage in Staff & Permissions →
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="user-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-left hidden lg:block">
                <span className="text-xs font-semibold block leading-none">
                  {currentUser?.name || 'Authorized User'}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {currentUser?.role?.replace('_', ' ') || 'admin'}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 text-xs animate-fadeIn transition-colors">
                <div className="px-4 py-3 border-b border-slate-700">
                  <div className="flex items-center gap-2.5">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        loading="lazy"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/50"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-white truncate">{currentUser?.name}</p>
                      <p className="text-slate-400 text-[11px] truncate">{currentUser?.email}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 truncate">
                      <Building2 className="w-3 h-3 shrink-0 text-indigo-400" />
                      <span className="truncate">{currentUser?.businessName || settings?.businessName || settings?.name || 'Royal POSfini'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span className="capitalize">Role: {currentUser?.role?.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 truncate max-w-[100px]">
                        {locations.find(l => l.id === selectedLocationId)?.code || 'HQ01'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switch Active User Profile */}
                <div className="py-1 px-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                    Switch Active User (RBAC Demo)
                  </p>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition ${
                          currentUser?.id === u.id
                            ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                            : 'hover:hover:bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} loading="lazy" className="w-5 h-5 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white shrink-0">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <span className="truncate">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize shrink-0 ml-1">
                          {u.role?.replace('_', ' ')} {u.businessName ? `• ${u.businessName.split(' ')[0]}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700/80 my-1" />

                <button
                  id="profile-menu-edit-btn"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsEditingProfile(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:hover:bg-slate-700 text-slate-200 flex items-center gap-2 font-semibold"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Manage My Profile</span>
                </button>

                {/* Settings & Permissions */}
                {hasModuleAccess('settings') || hasModuleAccess('security') || hasModuleAccess('system_updates') && (
                  <button
                    id="profile-menu-settings-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-left px-4 py-2 hover:hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Settings & Employee Permissions</span>
                  </button>
                )}

                {/* Links */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setActiveTab('laravel_arch');
                  }}
                  className="w-full text-left px-4 py-2 hover:hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Laravel 11 ERP Architecture</span>
                </button>

                <button
                  id="profile-menu-reset-db-btn"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (window.confirm('Reset all demo ERP data to initial factory state?')) {
                      resetToDefaults();
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-indigo-400 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo Database</span>
                </button>

                <button
                  id="profile-menu-reinstall-btn"
                  onClick={async () => {
                    setShowProfileMenu(false);
                    if (window.confirm('Re-Run Setup Wizard? This will unlock the domain setup so you can configure MySQL for Universal Live Sync.')) {
                      await resetServerInstallation();
                      window.location.href = '/setup?reset=true';
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700/60 text-amber-400 flex items-center gap-2"
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>Re-Run Setup Wizard (Configure MySQL)</span>
                </button>

                <div className="border-t border-slate-700/80 my-1" />

                {/* Logout Button */}
                <button
                  id="user-logout-btn"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-950/40 text-indigo-400 flex items-center gap-2 font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Lock Terminal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offline Sync Manager Modal */}
      <OfflineSyncManagerModal
        isOpen={showOfflineManager}
        onClose={() => setShowOfflineManager(false)}
      />

      {/* Quick Calculator Modal */}
      <PosCalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        currencySymbol={settings?.currencySymbol || '$'}
      />

      {/* User Profile Editor Modal */}
      <UserProfileModal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
      />
    </header>
  );
};
