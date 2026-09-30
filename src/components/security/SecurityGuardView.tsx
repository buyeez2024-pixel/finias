import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { UserSessionsManager } from '../users/UserSessionsManager';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Lock,
  Unlock,
  Clock,
  UserX,
  Mail,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Ban,
  KeyRound,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  Sparkles,
  Terminal,
  Check,
  Save,
  Plus,
  X,
  Globe,
  Cpu,
  HelpCircle,
  Info,
  ChevronRight,
  Download,
  Trash2,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';

export interface FlaggedLogItem {
  id: string;
  timestamp: string;
  email: string;
  name?: string;
  ipAddress: string;
  location?: string;
  reason: 'DISPOSABLE_EMAIL' | 'BOT_HONEYPOT' | 'FAILED_CAPTCHA' | 'IP_RATE_LIMIT' | 'BLOCKED_DOMAIN' | 'BRUTE_FORCE';
  riskScore: number; // 0 - 100
  actionTaken: 'BLOCKED' | 'FLAGGED' | 'AUTO_LOCKED';
}

const DEFAULT_DISPOSABLE_DOMAINS = [
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'getairmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'maildrop.cc',
  'fakeinbox.com',
  'crazymailing.com',
  'nada.ltd',
  'mohmal.com',
  'inboxbear.com',
  'burnermail.io',
  'mytemp.email',
  'emailondeck.com',
];

const DEFAULT_FLAGGED_LOGS: FlaggedLogItem[] = [
  {
    id: 'log_101',
    timestamp: 'Today, 10:42 AM',
    email: 'bot_spammer92@mailinator.com',
    name: 'Auto Bot Account',
    ipAddress: '185.220.101.5',
    location: 'Frankfurt, DE (Proxy/Tor)',
    reason: 'DISPOSABLE_EMAIL',
    riskScore: 98,
    actionTaken: 'BLOCKED',
  },
  {
    id: 'log_102',
    timestamp: 'Today, 09:15 AM',
    email: 'fake_register@tempmail.org',
    name: 'Script Lure Lancer',
    ipAddress: '198.51.100.42',
    location: 'Moscow, RU (Data Center)',
    reason: 'BOT_HONEYPOT',
    riskScore: 100,
    actionTaken: 'BLOCKED',
  },
  {
    id: 'log_103',
    timestamp: 'Yesterday, 11:02 PM',
    email: 'admin_test@yopmail.com',
    name: 'Yopmail Test Reg',
    ipAddress: '103.251.170.8',
    location: 'Hanoi, VN',
    reason: 'FAILED_CAPTCHA',
    riskScore: 85,
    actionTaken: 'BLOCKED',
  },
  {
    id: 'log_104',
    timestamp: 'Yesterday, 06:44 PM',
    email: 'unknown_user@trashmail.com',
    name: 'Unverified Staff',
    ipAddress: '45.142.120.12',
    location: 'Amsterdam, NL',
    reason: 'BRUTE_FORCE',
    riskScore: 92,
    actionTaken: 'AUTO_LOCKED',
  },
  {
    id: 'log_105',
    timestamp: '2 days ago',
    email: 'suspicious_client@fakeinbox.com',
    name: 'Spam Lead',
    ipAddress: '104.28.192.1',
    location: 'Dallas, US (VPN)',
    reason: 'BLOCKED_DOMAIN',
    riskScore: 96,
    actionTaken: 'BLOCKED',
  },
];

export const SecurityGuardView: React.FC = () => {
  const { settings, updateSettings, users, unlockUser } = useErp();
  const isLight = settings?.themeMode === 'light';

  // Active Security Control Tab
  const [activeTab, setActiveTab] = useState<'emails' | 'captcha' | 'brute_force' | 'sessions' | 'logs' | 'ip_filter'>('emails');

  // Security Master Switch & Settings State
  const [enableSecurityGuard, setEnableSecurityGuard] = useState<boolean>(settings.enableSecurityGuard ?? true);
  const [blockDisposableEmails, setBlockDisposableEmails] = useState<boolean>(settings.blockDisposableEmails ?? true);
  const [blockThrowawayPatterns, setBlockThrowawayPatterns] = useState<boolean>(settings.blockThrowawayPatterns ?? true);
  const [strictDnsCheck, setStrictDnsCheck] = useState<boolean>(settings.strictDnsCheck ?? false);

  // Custom Domains
  const [blockedDomains, setBlockedDomains] = useState<string[]>(
    settings.blockedDomains && settings.blockedDomains.length > 0
      ? settings.blockedDomains
      : DEFAULT_DISPOSABLE_DOMAINS
  );
  const [allowedDomains, setAllowedDomains] = useState<string[]>(
    settings.allowedDomains || ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com']
  );
  const [newBlockedDomainInput, setNewBlockedDomainInput] = useState('');
  const [newAllowedDomainInput, setNewAllowedDomainInput] = useState('');

  // CAPTCHA & Bot Protection
  const [enableCaptcha, setEnableCaptcha] = useState<boolean>(settings.enableCaptcha ?? true);
  const [captchaProvider, setCaptchaProvider] = useState<'math' | 'turnstile' | 'recaptcha' | 'hcaptcha'>(
    settings.captchaProvider || 'math'
  );
  const [requireCaptchaForRegistration, setRequireCaptchaForRegistration] = useState<boolean>(
    settings.requireCaptchaForRegistration ?? true
  );
  const [requireCaptchaForLogin, setRequireCaptchaForLogin] = useState<boolean>(
    settings.requireCaptchaForLogin ?? true
  );
  const [captchaSiteKey, setCaptchaSiteKey] = useState(settings.captchaSiteKey || 'turnstile_sitekey_demo_98231');
  const [captchaSecretKey, setCaptchaSecretKey] = useState(settings.captchaSecretKey || 'turnstile_secret_demo_77213');
  const [captchaThreshold, setCaptchaThreshold] = useState<number>(settings.captchaThreshold || 0.5);
  const [enableHoneypot, setEnableHoneypot] = useState<boolean>(settings.enableHoneypot ?? true);
  const [autoBlockHoneypotIp, setAutoBlockHoneypotIp] = useState<boolean>(settings.autoBlockHoneypotIp ?? true);

  // Brute Force & Lockout
  const [maxFailedLogins, setMaxFailedLogins] = useState<number>(settings.maxFailedLogins || 5);
  const [lockoutDuration, setLockoutDuration] = useState<number>(settings.lockoutDuration || 15);
  const [maxRegsPerIp, setMaxRegsPerIp] = useState<number>(settings.maxRegsPerIp || 3);
  const [requireEmailVerification, setRequireEmailVerification] = useState<boolean>(
    settings.requireEmailVerification ?? true
  );
  const [enforceMfaAdmins, setEnforceMfaAdmins] = useState<boolean>(settings.enforceMfaAdmins ?? false);
  const [blockVpnProxies, setBlockVpnProxies] = useState<boolean>(settings.blockVpnProxies ?? true);

  // Blacklist & Whitelist IPs
  const [blacklistedIps, setBlacklistedIps] = useState<string[]>(
    settings.blacklistedIps || ['185.220.101.5', '198.51.100.42', '45.142.120.12']
  );
  const [newIpInput, setNewIpInput] = useState('');

  // Flagged Logs
  const [flaggedLogs, setFlaggedLogs] = useState<FlaggedLogItem[]>(
    settings.flaggedRegistrations && settings.flaggedRegistrations.length > 0
      ? settings.flaggedRegistrations
      : DEFAULT_FLAGGED_LOGS
  );
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logReasonFilter, setLogReasonFilter] = useState<string>('ALL');

  // Risk Analyzer Interactive Simulator State
  const [simEmailInput, setSimEmailInput] = useState('test_spammer99@mailinator.com');
  const [simIpInput, setSimIpInput] = useState('185.220.101.5');
  const [simResult, setSimResult] = useState<{
    riskScore: number;
    decision: 'BLOCKED' | 'FLAGGED' | 'CLEAN';
    reasons: string[];
  } | null>(null);

  // Save Banner State
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Save settings handler
  const handleSaveSettings = () => {
    updateSettings({
      enableSecurityGuard,
      blockDisposableEmails,
      blockThrowawayPatterns,
      strictDnsCheck,
      blockedDomains,
      allowedDomains,
      enableCaptcha,
      captchaProvider,
      requireCaptchaForRegistration,
      requireCaptchaForLogin,
      captchaSiteKey,
      captchaSecretKey,
      captchaThreshold,
      enableHoneypot,
      autoBlockHoneypotIp,
      maxFailedLogins,
      lockoutDuration,
      maxRegsPerIp,
      requireEmailVerification,
      enforceMfaAdmins,
      blockVpnProxies,
      blacklistedIps,
      flaggedRegistrations: flaggedLogs,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Add Blocked Domain
  const handleAddBlockedDomain = (domainToAdd?: string) => {
    const domain = (domainToAdd || newBlockedDomainInput).trim().toLowerCase();
    if (domain && !blockedDomains.includes(domain)) {
      const updated = [domain, ...blockedDomains];
      setBlockedDomains(updated);
      setNewBlockedDomainInput('');
    }
  };

  // Remove Blocked Domain
  const handleRemoveBlockedDomain = (domainToRemove: string) => {
    setBlockedDomains(blockedDomains.filter((d) => d !== domainToRemove));
  };

  // Add Allowed Domain
  const handleAddAllowedDomain = () => {
    const domain = newAllowedDomainInput.trim().toLowerCase();
    if (domain && !allowedDomains.includes(domain)) {
      setAllowedDomains([domain, ...allowedDomains]);
      setNewAllowedDomainInput('');
    }
  };

  // Add Blacklisted IP
  const handleAddIp = () => {
    const ip = newIpInput.trim();
    if (ip && !blacklistedIps.includes(ip)) {
      setBlacklistedIps([ip, ...blacklistedIps]);
      setNewIpInput('');
    }
  };

  // Remove Blacklisted IP
  const handleRemoveIp = (ipToRemove: string) => {
    setBlacklistedIps(blacklistedIps.filter((ip) => ip !== ipToRemove));
  };

  // Unblock log entry email / domain
  const handleUnblockLogEmail = (logId: string, email: string) => {
    const domain = email.split('@')[1];
    if (domain) {
      setBlockedDomains(blockedDomains.filter((d) => d !== domain));
    }
    setFlaggedLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  // Analyze Risk Simulator function
  const runRiskSimulation = () => {
    const reasons: string[] = [];
    let risk = 0;

    const email = simEmailInput.trim().toLowerCase();
    const domain = email.split('@')[1] || '';
    const ip = simIpInput.trim();

    // Check disposable email
    if (blockedDomains.some((d) => domain.includes(d))) {
      risk += 80;
      reasons.push(`Domain '@${domain}' matches Blacklisted Disposable Domain rule.`);
    }

    // Check throwaway email pattern
    if (/^(bot|test|spam|fake|temp|\d{5,})/i.test(email.split('@')[0])) {
      risk += 25;
      reasons.push('Email handle contains suspicious random/numeric throwaway string pattern.');
    }

    // Check blacklisted IP
    if (blacklistedIps.includes(ip)) {
      risk += 90;
      reasons.push(`IP Address ${ip} is explicitly listed on the Security Blacklist.`);
    }

    if (ip.startsWith('185.') || ip.startsWith('45.')) {
      risk += 30;
      reasons.push('IP Address originates from known high-risk proxy/VPN ASN range.');
    }

    const finalRisk = Math.min(100, Math.max(0, risk));
    let decision: 'BLOCKED' | 'FLAGGED' | 'CLEAN' = 'CLEAN';

    if (finalRisk >= 75) {
      decision = 'BLOCKED';
    } else if (finalRisk >= 40) {
      decision = 'FLAGGED';
    }

    if (reasons.length === 0) {
      reasons.push('Email domain and IP passed all anti-fake verification checks safely.');
    }

    setSimResult({
      riskScore: finalRisk,
      decision,
      reasons,
    });
  };

  // Filtered Logs
  const filteredLogs = flaggedLogs.filter((log) => {
    const matchesSearch =
      log.email.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.ipAddress.includes(logSearchQuery) ||
      (log.name && log.name.toLowerCase().includes(logSearchQuery.toLowerCase()));

    const matchesReason = logReasonFilter === 'ALL' || log.reason === logReasonFilter;

    return matchesSearch && matchesReason;
  });

  return (
    <div className="p-3 sm:p-6 pb-24 sm:pb-12 space-y-4 sm:space-y-6 animate-fadeIn w-full max-w-full min-w-0 flex-shrink-0 mx-auto">
      {/* Top Main Banner & Master Switch */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden w-full max-w-full min-w-0">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10 w-full min-w-0">
          <div className="space-y-2 max-w-full md:max-w-3xl min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Anti-Fake User & Auth Shield</span>
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 shrink-0">
                Bot & Spam Guard v3.8
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight break-words min-w-0">
              Security & Anti-Fake User Protection
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed break-words">
              Detect, restrict, and automatically block fake user signups, disposable email services, automated registration bots, honeypot spam luring, and brute-force login attempts in real time.
            </p>
          </div>

          {/* Master Enable/Disable Control */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 w-full md:w-auto min-w-0">
            <div className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 sm:py-3 rounded-2xl shadow-inner w-full sm:w-auto min-w-0">
              <div className="text-left sm:text-right">
                <p className="text-xs font-black text-white">Security Guard State</p>
                <p className="text-[10px] text-slate-400">
                  {enableSecurityGuard ? 'Active Protection' : 'Shield Paused'}
                </p>
              </div>

              <div
                onClick={() => setEnableSecurityGuard(!enableSecurityGuard)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  enableSecurityGuard ? 'bg-rose-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    enableSecurityGuard ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-center"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Settings Saved!' : 'Save Security Shield Config'}</span>
            </button>
          </div>
        </div>

        {/* Status Warning if Disabled */}
        {!enableSecurityGuard && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <p>
              <strong>Security Guard Paused:</strong> Registration forms and login API endpoints will not block disposable emails or challenge bots while protection is paused.
            </p>
          </div>
        )}
      </div>

      {/* Security Metrics & Pulse Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full min-w-0">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-md min-w-0 overflow-hidden">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider truncate">Fake Signups Blocked</p>
            <h3 className="text-xl font-black text-white mt-0.5 truncate">142 Accounts</h3>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>100% Filtered</span>
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-md min-w-0 overflow-hidden">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider truncate">Bot CAPTCHA Rate</p>
            <h3 className="text-xl font-black text-white mt-0.5 truncate">98.6% Humans</h3>
            <span className="text-[10px] text-indigo-300 font-bold flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 shrink-0" />
              <span>Math & Turnstile</span>
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-md min-w-0 overflow-hidden">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider truncate">Disposable Domains</p>
            <h3 className="text-xl font-black text-white mt-0.5 truncate">{blockedDomains.length} Blacklisted</h3>
            <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>Mailinator / TempMail</span>
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-md min-w-0 overflow-hidden">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl shrink-0">
            <Ban className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider truncate">IP Blacklist & Locks</p>
            <h3 className="text-xl font-black text-white mt-0.5 truncate">{blacklistedIps.length} Banned IPs</h3>
            <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Brute Force Lock</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar - Horizontal Touch-Swipe */}
      <div
        className={`p-1.5 sm:p-2 rounded-2xl shadow-md overflow-x-auto scrollbar-none flex gap-2 border w-full max-w-full min-w-0 -mx-0.5 px-0.5 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('emails')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            isLight
              ? activeTab === 'emails'
                ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'emails'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 shrink-0" />
          <span>Disposable Email Blocker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('captcha')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            isLight
              ? activeTab === 'captcha'
                ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'captcha'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 shrink-0" />
          <span>Bot & CAPTCHA Trap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brute_force')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            isLight
              ? activeTab === 'brute_force'
                ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'brute_force'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 shrink-0" />
          <span>Brute-Force & Lockouts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            isLight
              ? activeTab === 'sessions'
                ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'sessions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Active User Sessions & Devices</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            isLight
              ? activeTab === 'logs'
                ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Flagged Signups Log ({flaggedLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ip_filter')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            isLight
              ? activeTab === 'ip_filter'
                ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'ip_filter'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0" />
          <span>IP Filter & Risk Simulator</span>
        </button>
      </div>

      {/* TAB 4: ACTIVE USER SESSIONS & CONNECTED DEVICES */}
      {activeTab === 'sessions' && <UserSessionsManager />}

      {/* TAB 1: DISPOSABLE & FAKE EMAIL BLOCKER */}
      {activeTab === 'emails' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Disposable & Temporary Email Domain Rules</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Prevent visitors from using throwaway email addresses (Mailinator, TempMail, Yopmail) during registration.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Save Rules</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-white text-xs block">Block Disposable Email Providers</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instantly rejects registrations from known temporary inbox hosts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={blockDisposableEmails}
                  onChange={(e) => setBlockDisposableEmails(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-white text-xs block">Block Throwaway String Patterns</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Flags random email handles containing long sequences of numbers or bot prefixes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={blockThrowawayPatterns}
                  onChange={(e) => setBlockThrowawayPatterns(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Presets Section */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Quick Add Common Disposable Service Domains:
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_DISPOSABLE_DOMAINS.slice(0, 10).map((d) => {
                  const isAdded = blockedDomains.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddBlockedDomain(d)}
                      className={`text-[11px] font-bold px-3 py-1 rounded-xl border transition flex items-center gap-1.5 ${
                        isAdded
                          ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      <span>@{d}</span>
                      {isAdded ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Blacklisted Domain Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">Custom Blacklisted Email Domains</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newBlockedDomainInput}
                  onChange={(e) => setNewBlockedDomainInput(e.target.value)}
                  placeholder="e.g. spamdomain.com or fakebox.org"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 min-w-0"
                />
                <button
                  onClick={() => handleAddBlockedDomain()}
                  className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Block Domain</span>
                </button>
              </div>

              {/* Tag Cloud of Blocked Domains */}
              <div className="flex flex-wrap gap-2 pt-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-950 border border-slate-800 min-w-0">
                {blockedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  >
                    <span>@{domain}</span>
                    <button
                      onClick={() => handleRemoveBlockedDomain(domain)}
                      className="hover:text-white transition ml-1"
                      title="Remove domain"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOT & CAPTCHA TRAP */}
      {activeTab === 'captcha' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Automated Bot & CAPTCHA Verification Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure smart challenge traps, zero-friction math puzzles, or Cloudflare Turnstile to stop automated script submissions.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Save Bot Config</span>
            </button>
          </div>

          <div className="space-y-5 text-xs">
            {/* Enable CAPTCHA Switch */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-white text-xs block">Enable Bot Verification Engine</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Requires bot challenges during account creation or login attempts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableCaptcha}
                onChange={(e) => setEnableCaptcha(e.target.checked)}
                className="h-5 w-5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Provider Selection Cards */}
            <div className="space-y-2">
              <label className="font-bold text-white block">Select Bot Challenge Provider</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'math',
                    title: 'Smart Math Puzzle',
                    desc: 'Zero external dependencies, light built-in arithmetic check.',
                    badge: 'Built-in',
                  },
                  {
                    id: 'turnstile',
                    title: 'Cloudflare Turnstile',
                    desc: 'Invisible, user-friendly non-interactive bot challenge.',
                    badge: 'Recommended',
                  },
                  {
                    id: 'recaptcha',
                    title: 'Google reCAPTCHA v3',
                    desc: 'Score-based background risk detection.',
                    badge: 'Google AI',
                  },
                  {
                    id: 'hcaptcha',
                    title: 'hCaptcha Security',
                    desc: 'Privacy-first image recognition captcha.',
                    badge: 'Privacy',
                  },
                ].map((prov) => {
                  const isSelected = captchaProvider === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() => setCaptchaProvider(prov.id as any)}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/80 ring-1 ring-indigo-500'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{prov.title}</span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {prov.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{prov.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Honeypot Trap Section */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">Invisible Honeypot Trap</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                      Silent Bot Lure
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Injects an invisible CSS-hidden form field (<code className="text-amber-300">website_hp_trap</code>) into registration forms. Human users never see or fill it, but automated spam scripts fill it out instantly.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableHoneypot}
                  onChange={(e) => setEnableHoneypot(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {enableHoneypot && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-indigo-300 font-semibold">
                    Automatically add honeypot spamming IP addresses to the temporary Blacklist
                  </span>
                  <input
                    type="checkbox"
                    checked={autoBlockHoneypotIp}
                    onChange={(e) => setAutoBlockHoneypotIp(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-indigo-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Application Scope Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <span className="font-bold text-white text-xs">Require for User Registration Form</span>
                <input
                  type="checkbox"
                  checked={requireCaptchaForRegistration}
                  onChange={(e) => setRequireCaptchaForRegistration(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 text-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <span className="font-bold text-white text-xs">Require for User Login Form</span>
                <input
                  type="checkbox"
                  checked={requireCaptchaForLogin}
                  onChange={(e) => setRequireCaptchaForLogin(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 text-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRUTE FORCE & LOCKOUTS */}
      {activeTab === 'brute_force' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Brute-Force Login & Rate Limiting Protection</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Protect passwords from credential stuffing and set maximum signups per IP address.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Save Lockout Rules</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-xs">
            {/* Failed Login Lockout */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <label className="font-bold text-white block">Max Failed Logins Before Account Lock</label>
              <p className="text-[11px] text-slate-400">
                Number of incorrect password attempts permitted before triggering temporary lockout.
              </p>
              <select
                value={maxFailedLogins}
                onChange={(e) => setMaxFailedLogins(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value={3}>3 Failed Attempts (Strict)</option>
                <option value={5}>5 Failed Attempts (Recommended)</option>
                <option value={10}>10 Failed Attempts (Standard)</option>
              </select>
            </div>

            {/* Lockout Duration */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <label className="font-bold text-white block">Account Lockout Duration</label>
              <p className="text-[11px] text-slate-400">
                Minutes the account remains frozen after triggering brute-force threshold.
              </p>
              <select
                value={lockoutDuration}
                onChange={(e) => setLockoutDuration(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
              </select>
            </div>

            {/* IP Rate Limiting */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <label className="font-bold text-white block">Max Registrations per IP per Hour</label>
              <p className="text-[11px] text-slate-400">
                Limits mass account creation scripts coming from the same network IP.
              </p>
              <select
                value={maxRegsPerIp}
                onChange={(e) => setMaxRegsPerIp(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value={1}>1 Account / IP / Hour (Strict)</option>
                <option value={3}>3 Accounts / IP / Hour (Recommended)</option>
                <option value={10}>10 Accounts / IP / Hour</option>
              </select>
            </div>

            {/* Email OTP Verification */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white block">Enforce Email OTP Code Verification</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Requires new users to verify a 6-digit email confirmation code before activating access.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-bold text-indigo-300">OTP Code Required</span>
                <input
                  type="checkbox"
                  checked={requireEmailVerification}
                  onChange={(e) => setRequireEmailVerification(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 text-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Active Frozen Accounts & Immediate Admin Unlock Section */}
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Active Locked Accounts & Immediate Admin Unlock Console</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Admins can unlock users immediately upon receiving an unlock request notification mail, bypassing the brute-force freeze timer.
                </p>
              </div>

              {users.filter((u) => u.status === 'locked' || (u.lockedUntil && u.lockedUntil > Date.now())).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    users.filter((u) => u.status === 'locked' || (u.lockedUntil && u.lockedUntil > Date.now())).forEach((u) => unlockUser(u.id));
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock All Accounts Immediately</span>
                </button>
              )}
            </div>

            {/* Policy Info Card */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-indigo-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-white">Security Enforcement Policy: </strong>
                Once any account is locked due to failed attempts, admin receives a notification. Admin can unlock the user immediately without waiting for the account to remain frozen for the brute-force threshold time only when the user requests with the notification mail to admin; otherwise the user must wait for the {lockoutDuration} minutes freeze threshold. Upon unlocking or timer completion, users are required to complete Enforce Email OTP Code Verification.
              </div>
            </div>

            {/* Locked Users List with Smooth Touch-Swipe Scrolling */}
            {(() => {
              const lockedUsers = users.filter((u) => u.status === 'locked');
              if (lockedUsers.length === 0) {
                return (
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <span className="font-semibold">No user accounts are currently locked.</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">All staff and administrator accounts are in active standing.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2 w-full max-w-full min-w-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 sm:hidden">
                    <span className="flex items-center gap-1 font-medium text-indigo-400">
                      <span>⇄ Swipe table horizontally to view all columns</span>
                    </span>
                    <span className="font-mono text-[10px]">{lockedUsers.length} accounts</span>
                  </div>

                  <div
                    className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800 w-full max-w-full min-w-0"
                    style={{
                      WebkitOverflowScrolling: 'touch',
                      touchAction: 'pan-x pan-y',
                      overscrollBehaviorX: 'contain'
                    }}
                  >
                    <table className="w-full min-w-[700px] text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">User / Email</th>
                          <th className="py-2.5 px-3">Failed Attempts</th>
                          <th className="py-2.5 px-3">Freeze Status</th>
                          <th className="py-2.5 px-3">Unlock Request Mail</th>
                          <th className="py-2.5 px-3 text-right">Admin Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                        {lockedUsers.map((u) => {
                          const remainingSecs = u.lockedUntil ? Math.max(0, Math.ceil((u.lockedUntil - Date.now()) / 1000)) : 0;
                          const remainingMins = Math.ceil(remainingSecs / 60);

                          return (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-3">
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-[11px] text-slate-400">{u.email}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[11px]">
                                  {u.failedLogins || maxFailedLogins} failures
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{remainingMins > 0 ? `${remainingMins} min remaining` : 'Expiring soon'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                {u.unlockRequested ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold animate-pulse">
                                    <Mail className="w-3 h-3" />
                                    <span>Unlock Request Mail Received</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">
                                    No request mail sent (Waiting for freeze time)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => unlockUser(u.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition shadow-xs"
                                  title="Unlock immediately without waiting for freeze duration"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>Unlock Immediately</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: FLAGGED LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                <span>Flagged & Blocked Registrations Log</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time audit record of flagged fake accounts, disposable emails, and honeypot traps.
              </p>
            </div>

            <button
              onClick={() => {
                const updated = [
                  {
                    id: `log_${Date.now()}`,
                    timestamp: 'Just now',
                    email: `fake_bot_${Math.floor(Math.random() * 9000 + 1000)}@tempmail.org`,
                    name: 'Automated Bot Test',
                    ipAddress: '198.51.100.88',
                    location: 'Simulated Bot Network',
                    reason: 'DISPOSABLE_EMAIL' as const,
                    riskScore: 99,
                    actionTaken: 'BLOCKED' as const,
                  },
                  ...flaggedLogs,
                ];
                setFlaggedLogs(updated);
              }}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Simulate Test Bot Incident</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Search email, IP address, or location..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 min-w-0"
              />
            </div>

            <select
              value={logReasonFilter}
              onChange={(e) => setLogReasonFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
            >
              <option value="ALL">All Detection Reasons</option>
              <option value="DISPOSABLE_EMAIL">Disposable Emails</option>
              <option value="BOT_HONEYPOT">Honeypot Traps</option>
              <option value="FAILED_CAPTCHA">Failed CAPTCHA</option>
              <option value="BRUTE_FORCE">Brute Force</option>
            </select>
          </div>

          {/* Log Table with Smooth Touch-Swipe Scrolling */}
          <div className="space-y-2 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 sm:hidden">
              <span className="flex items-center gap-1 font-medium text-indigo-400">
                <span>⇄ Swipe table horizontally to view full audit trail</span>
              </span>
              <span className="font-mono text-[10px]">{filteredLogs.length} logs</span>
            </div>

            <div
              className="overflow-x-auto scrollbar-thin rounded-2xl border border-slate-800 w-full max-w-full min-w-0"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                overscrollBehaviorX: 'contain'
              }}
            >
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Attempted User Email</th>
                    <th className="p-3.5">IP & Origin</th>
                    <th className="p-3.5">Detection Reason</th>
                    <th className="p-3.5 text-center">Risk Score</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-medium text-slate-300">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No security incidents match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">{item.timestamp}</td>
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex flex-col">
                            <span>{item.email}</span>
                            {item.name && <span className="text-[10px] text-slate-400 font-normal">{item.name}</span>}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col font-mono text-[11px]">
                            <span className="text-indigo-300">{item.ipAddress}</span>
                            <span className="text-[10px] text-slate-400 font-sans">{item.location || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-800 text-rose-300 border border-slate-700">
                            {item.reason.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {item.riskScore}% Critical
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleUnblockLogEmail(item.id, item.email)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 transition"
                          >
                            Unblock & Allow
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: IP FILTER & RISK SIMULATOR */}
      {activeTab === 'ip_filter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full min-w-0">
          {/* Blacklisted IPs List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl w-full max-w-full min-w-0 overflow-hidden">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-500 shrink-0" />
              <span>Network IP Address Blacklist</span>
            </h3>
            <p className="text-xs text-slate-400">
              IP addresses manually or automatically banned from registering accounts or attempting logins.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                value={newIpInput}
                onChange={(e) => setNewIpInput(e.target.value)}
                placeholder="e.g. 185.220.101.5"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 min-w-0"
              />
              <button
                onClick={handleAddIp}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Ban IP</span>
              </button>
            </div>

            <div className="space-y-2 pt-2 max-h-60 overflow-y-auto">
              {blacklistedIps.map((ip) => (
                <div
                  key={ip}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-white font-bold">{ip}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveIp(ip)}
                    className="text-slate-400 hover:text-white transition text-[11px] font-bold"
                  >
                    Unban
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Risk Simulator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl w-full max-w-full min-w-0 overflow-hidden">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Real-Time Fake Risk Score Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Test any user email address or IP network against the active anti-fake security rules engine.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Email Address to Test</label>
                <input
                  type="text"
                  value={simEmailInput}
                  onChange={(e) => setSimEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">IP Address to Test</label>
                <input
                  type="text"
                  value={simIpInput}
                  onChange={(e) => setSimIpInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                onClick={runRiskSimulation}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Calculate Fake Risk Score</span>
              </button>
            </div>

            {/* Simulation Result Box */}
            {simResult && (
              <div
                className={`p-4 rounded-2xl border space-y-2 text-xs mt-3 ${
                  simResult.decision === 'BLOCKED'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : simResult.decision === 'FLAGGED'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm uppercase">Decision: {simResult.decision}</span>
                  <span className="px-2.5 py-0.5 rounded-full font-extrabold bg-slate-950 text-white border border-slate-800">
                    Risk Score: {simResult.riskScore}/100
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  {simResult.reasons.map((r, idx) => (
                    <p key={idx} className="text-[11px] leading-relaxed flex items-start gap-1.5">
                      <span>•</span>
                      <span>{r}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
