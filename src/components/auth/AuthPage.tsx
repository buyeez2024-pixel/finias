import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { validateEmail } from '../../utils/formatters';
import { UserRole } from '../../types/erp';
import { RoyalLogo } from '../common/RoyalLogo';
import { InstallationWizard } from '../installer/InstallationWizard';
import { UninstalledGatewayScreen } from '../installer/UninstalledGatewayScreen';
import {
  Store,
  Lock,
  Unlock,
  Mail,
  User as UserIcon,
  Building,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Boxes,
  BarChart3,
  KeyRound,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  X,
  RefreshCw,
  Layers,
  MapPin,
  Coins,
  Percent,
  Sun,
  Moon,
  Clock,
  Send,
  Check,
  Key,
  ShieldAlert,
  Database,
  Wand2,
  Globe,
  Calendar,
  FileText,
  Sliders,
  UserCheck,
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const {
    login,
    register,
    locations,
    users,
    selectedLocationId,
    settings,
    updateSettings,
    requestAdminUnlock,
    unlockUser,
    verifyLoginOtp,
    resendLoginOtp,
  } = useErp();

  const isLight = (settings?.themeMode || 'light') === 'light';

  const isDuplicatePhone = (phoneA: string, phoneB: string) => {
    const digitsA = phoneA.replace(/\D/g, '');
    const digitsB = phoneB.replace(/\D/g, '');
    if (digitsA.length < 7 || digitsB.length < 7) return false;
    const minLen = Math.min(digitsA.length, digitsB.length);
    const endA = digitsA.slice(-minLen);
    const endB = digitsB.slice(-minLen);
    return endA === endB;
  };

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showInstaller, setShowInstaller] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      return p.includes('install') || p.includes('setup');
    }
    return false;
  });

  const checkIsInstalled = () => {
    if (settings?.isInstalled === true || settings?.installationCompleted === true) return true;
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('pos_installed') === 'true' ||
      localStorage.getItem('app_installed') === 'true' ||
      localStorage.getItem('app_installation_completed') === 'true' ||
      localStorage.getItem('app_fresh_installed') === 'true'
    );
  };

  const checkIsFreshInstallation = () => {
    if (settings?.isFreshInstallation === true || settings?.installationType === 'fresh') return true;
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('app_fresh_installed') === 'true' ||
      localStorage.getItem('installation_type') === 'fresh'
    );
  };

  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => checkIsInstalled());
  const [isFreshInstall, setIsFreshInstall] = useState<boolean>(() => checkIsFreshInstallation());

  useEffect(() => {
    setIsAppInstalled(checkIsInstalled());
    setIsFreshInstall(checkIsFreshInstallation());

    const handleStorageChange = () => {
      setIsAppInstalled(checkIsInstalled());
      setIsFreshInstall(checkIsFreshInstallation());
    };
    window.addEventListener('storage', handleStorageChange);

    const handleLocation = () => {
      if (typeof window !== 'undefined') {
        const p = (window.location.pathname + window.location.hash).toLowerCase();
        setShowInstaller(p.includes('install') || p.includes('setup'));
      }
    };
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, [settings]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Smart Math Puzzle CAPTCHA state
  const [mathNum1, setMathNum1] = useState<number>(() => Math.floor(Math.random() * 10) + 2);
  const [mathNum2, setMathNum2] = useState<number>(() => Math.floor(Math.random() * 8) + 1);
  const [mathAnswer, setMathAnswer] = useState<string>('');
  const [thirdPartyCaptchaVerified, setThirdPartyCaptchaVerified] = useState<boolean>(false);

  const captchaProvider = settings?.captchaProvider || 'math';

  const generateMathPuzzle = () => {
    setMathNum1(Math.floor(Math.random() * 12) + 2);
    setMathNum2(Math.floor(Math.random() * 9) + 1);
    setMathAnswer('');
  };

  const validateCaptchaSubmission = () => {
    const isCaptchaEnabled = settings?.enableCaptcha ?? true;
    if (!isCaptchaEnabled) return true;

    if (captchaProvider === 'math') {
      const expected = mathNum1 + mathNum2;
      if (parseInt(mathAnswer.trim(), 10) !== expected) {
        setErrorMessage('Incorrect Smart Math Puzzle answer. Please solve the math challenge to verify human identity.');
        generateMathPuzzle();
        return false;
      }
    } else {
      if (!thirdPartyCaptchaVerified) {
        setErrorMessage('Please complete the bot challenge verification checkbox.');
        return false;
      }
    }
    return true;
  };

  const renderCaptchaWidget = (isLogin: boolean) => {
    const isCaptchaEnabled = settings?.enableCaptcha ?? true;
    const isRequired = isLogin ? (settings?.requireCaptchaForLogin ?? true) : (settings?.requireCaptchaForRegistration ?? true);

    if (!isCaptchaEnabled || !isRequired) return null;

    if (captchaProvider === 'math') {
      return (
        <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-950 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600/10 rounded-lg text-indigo-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Smart Math Puzzle (Bot Verification)
              </span>
            </div>
            <button
              type="button"
              onClick={generateMathPuzzle}
              className={`text-[11px] flex items-center gap-1 font-medium ${isLight ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-400 hover:text-indigo-300'}`}
              title="Refresh Puzzle"
            >
              <RefreshCw className="w-3 h-3" />
              <span>New Puzzle</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-2 rounded-xl font-mono font-bold text-sm tracking-wider ${isLight ? 'bg-white text-indigo-700 border border-indigo-200 shadow-2xs' : 'bg-slate-900 text-indigo-400 border border-slate-700'}`}>
              {mathNum1} + {mathNum2} = ?
            </div>
            <input
              type="number"
              required
              value={mathAnswer}
              onChange={(e) => setMathAnswer(e.target.value)}
              placeholder="Answer"
              className={`w-28 text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 font-mono ${
                isLight
                  ? 'bg-white text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                  : 'bg-slate-900 text-white border-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>
        </div>
      );
    }

    const providerMeta = {
      turnstile: { name: 'Cloudflare Turnstile', badge: 'Recommended', color: 'text-amber-500' },
      recaptcha: { name: 'Google reCAPTCHA v3', badge: 'Google AI', color: 'text-blue-500' },
      hcaptcha: { name: 'hCaptcha Security', badge: 'Privacy', color: 'text-purple-500' },
    };
    const meta = providerMeta[captchaProvider as keyof typeof providerMeta] || providerMeta.turnstile;

    return (
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`captcha-${captchaProvider}-${isLogin ? 'login' : 'reg'}`}
            required
            checked={thirdPartyCaptchaVerified}
            onChange={(e) => setThirdPartyCaptchaVerified(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <label htmlFor={`captcha-${captchaProvider}-${isLogin ? 'login' : 'reg'}`} className="cursor-pointer">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Verify you are human ({meta.name})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                {meta.badge}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Automated bot protection challenge verification</p>
          </label>
        </div>
        <ShieldCheck className={`w-6 h-6 ${meta.color} shrink-0`} />
      </div>
    );
  };

  // Login form state (empty by default so fields are not pre-filled)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLocation, setLoginLocation] = useState(selectedLocationId || 'loc_main');
  const [rememberMe, setRememberMe] = useState(false);

  // Account Lockout & Admin Immediate Unlock State
  const [lockedAccountInfo, setLockedAccountInfo] = useState<{
    email: string;
    name: string;
    userId: string;
    lockedUntil: number;
    unlockRequested: boolean;
  } | null>(null);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  // Enforce Email OTP Code Verification State
  const [otpState, setOtpState] = useState<{
    email: string;
    name: string;
    userId: string;
    otpCode: string;
  } | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Countdown timer for lockout freeze duration
  useEffect(() => {
    if (!lockedAccountInfo) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockedAccountInfo.lockedUntil - Date.now()) / 1000));
      setLockoutRemainingSeconds(remaining);

      if (remaining <= 0) {
        setLockedAccountInfo(null);
        setSuccessMessage('Brute-force freeze period expired! You can now log in using your password and Email OTP Code Verification.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedAccountInfo]);

  // Real-time listener: Detect if Admin unlocked this account immediately (checks state + localStorage + events)
  useEffect(() => {
    if (!lockedAccountInfo) return;

    const checkUnlocked = () => {
      // 1. Check in context users
      let targetUser = users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === lockedAccountInfo.email.toLowerCase()) ||
          u.id === lockedAccountInfo.userId
      );

      // 2. Also check directly from localStorage in case updated from another tab or window
      try {
        const stored = localStorage.getItem('royal_pos_v1_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const foundInStorage = parsed.find(
              (u: any) =>
                (u.email && u.email.toLowerCase() === lockedAccountInfo.email.toLowerCase()) ||
                u.id === lockedAccountInfo.userId
            );
            if (foundInStorage) {
              targetUser = foundInStorage;
            }
          }
        }
      } catch (err) {
        // ignore
      }

      if (
        targetUser &&
        (targetUser.status === 'active' || targetUser.isUnlockedByAdmin) &&
        (!targetUser.lockedUntil || targetUser.lockedUntil <= Date.now())
      ) {
        setLockedAccountInfo(null);
        setLockoutRemainingSeconds(0);
        setErrorMessage(null);
        setSuccessMessage(
          `🎉 Account for ${targetUser.name} was unlocked by Administrator! You can now log in directly with your password.`
        );
      } else if (targetUser?.unlockRequested && !lockedAccountInfo.unlockRequested) {
        setLockedAccountInfo((prev) => (prev ? { ...prev, unlockRequested: true } : null));
      }
    };

    // Check immediately
    checkUnlocked();

    // Poll every 1.5 seconds while account freeze card is visible
    const pollInterval = setInterval(checkUnlocked, 1500);

    const handleUnlockEvent = () => {
      checkUnlocked();
    };

    window.addEventListener('erp_user_unlocked', handleUnlockEvent);
    window.addEventListener('storage', handleUnlockEvent);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('erp_user_unlocked', handleUnlockEvent);
      window.removeEventListener('storage', handleUnlockEvent);
    };
  }, [users, lockedAccountInfo]);

  // OTP resend cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Ultimate POS Business Registration Form State
  const [regStep, setRegStep] = useState<number>(1);
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regStartDate, setRegStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [regCurrency, setRegCurrency] = useState('USD');
  const [regCurrencySymbol, setRegCurrencySymbol] = useState('$');
  const [regCurrencySymbolPlacement, setRegCurrencySymbolPlacement] = useState('before');
  const [regLogoUrl, setRegLogoUrl] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAltPhone, setRegAltPhone] = useState('');
  const [regCountry, setRegCountry] = useState('United States');
  const [regState, setRegState] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regZip, setRegZip] = useState('');
  const [regLandmark, setRegLandmark] = useState('');
  const [regTimezone, setRegTimezone] = useState('America/New_York');

  // Business Settings & Tax Details
  const [regProvince, setRegProvince] = useState('');
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [regTax1Name, setRegTax1Name] = useState('');
  const [regTax1No, setRegTax1No] = useState('');
  const [regTax2Name, setRegTax2Name] = useState('');
  const [regTax2No, setRegTax2No] = useState('');
  const [regFinancialYearStartMonth, setRegFinancialYearStartMonth] = useState('January');
  const [regStockAccountingMethod, setRegStockAccountingMethod] = useState('FIFO');

  // Owner / User Details
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhoneUser, setRegPhoneUser] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('admin');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAcceptTerms, setRegAcceptTerms] = useState(true);
  const [honeypotTrap, setHoneypotTrap] = useState('');

  // Postal code / Zip code / PIN code auto-detection
  const handleZipChange = async (val: string) => {
    setRegZip(val);
    const cleanZip = val.trim().toUpperCase();
    if (cleanZip.length < 2) return;

    setIsLookingUpZip(true);

    // 1. Check Indian 6-digit PIN code
    if (/^\d{6}$/.test(cleanZip)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanZip}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const place = data[0].PostOffice[0];
            const detectedCity = (place.Block && place.Block !== 'NA' ? place.Block : place.Name) || '';
            const detectedDistrict = place.District || '';
            const detectedState = place.State || '';
            if (detectedCity) setRegCity(detectedCity);
            if (detectedDistrict) setRegProvince(detectedDistrict);
            if (detectedState) setRegState(detectedState);
            setRegCountry('India');
            setIsLookingUpZip(false);
            return;
          }
        }
      } catch (e) {
        // Fallback to static mapping
      }
    }

    // 2. Check US 5-digit Zipcode
    if (/^\d{5}$/.test(cleanZip)) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.places && data.places.length > 0) {
            const place = data.places[0];
            const detectedCity = place['place name'] || '';
            const detectedDistrict = place['state'] || '';
            const detectedState = place['state abbreviation'] || place['state'] || '';
            if (detectedCity) setRegCity(detectedCity);
            if (detectedDistrict) setRegProvince(detectedDistrict);
            if (detectedState) setRegState(detectedState);
            setRegCountry('United States');
            setIsLookingUpZip(false);
            return;
          }
        }
      } catch (e) {
        // Fallback to static mapping
      }
    }

    // 3. Static fallback database for various postal codes & pincodes across regions
    const staticMap: Record<string, { city: string; province: string; state: string; country: string }> = {
      // US Major
      '10001': { city: 'New York', province: 'Manhattan District', state: 'NY', country: 'United States' },
      '10002': { city: 'New York', province: 'Manhattan District', state: 'NY', country: 'United States' },
      '90210': { city: 'Beverly Hills', province: 'Los Angeles District', state: 'CA', country: 'United States' },
      '90001': { city: 'Los Angeles', province: 'Los Angeles County', state: 'CA', country: 'United States' },
      '30301': { city: 'Atlanta', province: 'Fulton District', state: 'GA', country: 'United States' },
      '60601': { city: 'Chicago', province: 'Cook District', state: 'IL', country: 'United States' },
      '75201': { city: 'Dallas', province: 'Dallas District', state: 'TX', country: 'United States' },
      '94101': { city: 'San Francisco', province: 'San Francisco County', state: 'CA', country: 'United States' },
      '33101': { city: 'Miami', province: 'Miami-Dade', state: 'FL', country: 'United States' },
      '98101': { city: 'Seattle', province: 'King County', state: 'WA', country: 'United States' },
      '02101': { city: 'Boston', province: 'Suffolk County', state: 'MA', country: 'United States' },
      // UK
      'SW1A': { city: 'London', province: 'Greater London', state: 'England', country: 'United Kingdom' },
      'W1A': { city: 'London', province: 'Greater London', state: 'England', country: 'United Kingdom' },
      'EC1A': { city: 'London', province: 'Greater London', state: 'England', country: 'United Kingdom' },
      // Canada
      'M5V': { city: 'Toronto', province: 'Toronto Division', state: 'Ontario', country: 'Canada' },
      'V6B': { city: 'Vancouver', province: 'Metro Vancouver', state: 'British Columbia', country: 'Canada' },
      // Australia
      '2000': { city: 'Sydney', province: 'Sydney District', state: 'New South Wales', country: 'Australia' },
      '3000': { city: 'Melbourne', province: 'Melbourne District', state: 'Victoria', country: 'Australia' },
      // India Common Pincodes
      '110001': { city: 'New Delhi', province: 'Central Delhi', state: 'Delhi', country: 'India' },
      '1100': { city: 'New Delhi', province: 'Central Delhi', state: 'Delhi', country: 'India' },
      '400001': { city: 'Mumbai', province: 'Mumbai City', state: 'Maharashtra', country: 'India' },
      '4000': { city: 'Mumbai', province: 'Mumbai City', state: 'Maharashtra', country: 'India' },
      '560001': { city: 'Bangalore', province: 'Bangalore Urban', state: 'Karnataka', country: 'India' },
      '5600': { city: 'Bangalore', province: 'Bangalore Urban', state: 'Karnataka', country: 'India' },
      '500001': { city: 'Hyderabad', province: 'Hyderabad District', state: 'Telangana', country: 'India' },
      '5000': { city: 'Hyderabad', province: 'Hyderabad District', state: 'Telangana', country: 'India' },
      '520001': { city: 'Vijayawada', province: 'NTR District', state: 'Andhra Pradesh', country: 'India' },
      '5200': { city: 'Vijayawada', province: 'NTR District', state: 'Andhra Pradesh', country: 'India' },
      '530001': { city: 'Visakhapatnam', province: 'Visakhapatnam District', state: 'Andhra Pradesh', country: 'India' },
      '5300': { city: 'Visakhapatnam', province: 'Visakhapatnam District', state: 'Andhra Pradesh', country: 'India' },
      '515001': { city: 'Anantapur', province: 'Anantapur District', state: 'Andhra Pradesh', country: 'India' },
      '5150': { city: 'Anantapur', province: 'Anantapur District', state: 'Andhra Pradesh', country: 'India' },
      '600001': { city: 'Chennai', province: 'Chennai District', state: 'Tamil Nadu', country: 'India' },
      '6000': { city: 'Chennai', province: 'Chennai District', state: 'Tamil Nadu', country: 'India' },
      '700001': { city: 'Kolkata', province: 'Kolkata District', state: 'West Bengal', country: 'India' },
      '7000': { city: 'Kolkata', province: 'Kolkata District', state: 'West Bengal', country: 'India' },
      // UAE
      '00000': { city: 'Dubai', province: 'Dubai Emirate', state: 'Dubai', country: 'United Arab Emirates' },
    };

    const foundKey = Object.keys(staticMap).find((k) => cleanZip.startsWith(k) || k.startsWith(cleanZip));
    if (foundKey) {
      const match = staticMap[foundKey];
      setRegCity(match.city);
      setRegProvince(match.province);
      setRegState(match.state);
      setRegCountry(match.country);
    }

    setIsLookingUpZip(false);
  };

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Demo accounts for 1-click test
  const demoAccounts = [
    {
      name: 'Sarah Jenkins',
      role: 'Super Admin / Owner',
      email: 'admin@royalpos.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      badge: 'Admin',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      location: 'loc_main',
    },
    {
      name: 'Alex Rivera',
      role: 'Cashier & POS Operator',
      email: 'cashier@royalpos.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      badge: 'Cashier',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      location: 'loc_main',
    },
    {
      name: 'Marcus Vance',
      role: 'Inventory & Logistics Lead',
      email: 'inventory@royalpos.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      badge: 'Warehouse',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      location: 'loc_west',
    },
    {
      name: 'Elena Rostova',
      role: 'Financial Auditor / CFO',
      email: 'finance@royalpos.com',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      badge: 'Finance',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      location: 'loc_main',
    },
  ];

  const handleSelectDemoAccount = (account: (typeof demoAccounts)[0]) => {
    setLoginEmail(account.email);
    setLoginPassword('password123');
    setLoginLocation(account.location);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLockedAccountInfo(null);
    setLockoutRemainingSeconds(0);
    setOtpState(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const requireLoginCaptcha = settings?.requireCaptchaForLogin ?? true;
    if ((settings?.enableCaptcha ?? true) && requireLoginCaptcha) {
      if (!validateCaptchaSubmission()) return;
    }

    setLoading(true);

    try {
      const res = await login(loginEmail, loginPassword, loginLocation);
      if (!res.success) {
        if (res.isLocked) {
          setLockedAccountInfo({
            email: res.userEmail || loginEmail,
            name: res.userName || 'Account User',
            userId: res.userId || '',
            lockedUntil: res.lockedUntil || Date.now() + (res.remainingMinutes || 15) * 60 * 1000,
            unlockRequested: !!res.unlockRequested,
          });
          setLockoutRemainingSeconds(res.remainingSeconds || (res.remainingMinutes || 15) * 60);
          setErrorMessage(null);
        } else if (res.requireOtp) {
          setLockedAccountInfo(null);
          setLockoutRemainingSeconds(0);
          setOtpState({
            email: res.userEmail || loginEmail,
            name: res.userName || 'Account User',
            userId: res.userId || '',
            otpCode: res.otpCode || '',
          });
          setOtpValue('');
          setOtpError(null);
          setErrorMessage(null);
        } else {
          setLockedAccountInfo(null);
          setLockoutRemainingSeconds(0);
          setErrorMessage(
            res.message ||
              (isFreshInstall
                ? 'Authentication failed. Please verify your email and password.'
                : 'Authentication failed. Check your email or try a demo account.')
          );
          generateMathPuzzle();
        }
      } else {
        setLockedAccountInfo(null);
        setLockoutRemainingSeconds(0);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
      generateMathPuzzle();
    } finally {
      setLoading(false);
    }
  };

  const handleSendUnlockRequest = () => {
    if (!lockedAccountInfo) return;
    const res = requestAdminUnlock(lockedAccountInfo.email);
    if (res.success) {
      setLockedAccountInfo((prev) => (prev ? { ...prev, unlockRequested: true } : null));
      setSuccessMessage(
        'Unlock request notification mail sent to Administrator! Waiting for Admin to unlock your account immediately...'
      );
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpState) return;
    if (!otpValue.trim() || otpValue.trim().length < 6) {
      setOtpError('Please enter the 6-digit OTP verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await verifyLoginOtp(otpState.email, otpValue.trim(), loginLocation);
      if (!res.success) {
        setOtpError(res.message || 'Invalid OTP code. Please check your email or click Resend Code.');
      } else {
        setOtpState(null);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpState || otpCooldown > 0) return;
    setOtpLoading(true);
    try {
      const res = await resendLoginOtp(otpState.email);
      if (res.success) {
        setOtpState((prev) => (prev ? { ...prev, otpCode: res.otpCode || prev.otpCode } : null));
        setOtpCooldown(60);
        setSuccessMessage(res.message || 'New OTP code dispatched to your email.');
      } else {
        setOtpError(res.message || 'Failed to resend OTP code.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const requireRegCaptcha = settings?.requireCaptchaForRegistration ?? true;
    if ((settings?.enableCaptcha ?? true) && requireRegCaptcha) {
      if (!validateCaptchaSubmission()) return;
    }

    if (!regBusinessName.trim()) {
      setRegStep(1);
      setErrorMessage('Business / Store Name is required.');
      return;
    }

    if (!regPhone.trim()) {
      setRegStep(1);
      setErrorMessage('Business Contact Number is required.');
      return;
    }

    if (!regFullName.trim() || !regEmail.trim()) {
      setRegStep(3);
      setErrorMessage('Please provide Admin Full Name and Work Email.');
      return;
    }

    if (!validateEmail(regEmail)) {
      setRegStep(3);
      setErrorMessage('Please enter a valid work email address (e.g. name@domain.com).');
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setRegStep(3);
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    const isDuplicatePhone = (phoneA: string, phoneB: string) => {
      const digitsA = phoneA.replace(/\D/g, '');
      const digitsB = phoneB.replace(/\D/g, '');
      if (digitsA.length < 7 || digitsB.length < 7) return false;
      const minLen = Math.min(digitsA.length, digitsB.length);
      const endA = digitsA.slice(-minLen);
      const endB = digitsB.slice(-minLen);
      return endA === endB;
    };

    const emailClean = regEmail.trim().toLowerCase();
    if (users.some(u => u.email?.trim().toLowerCase() === emailClean)) {
      setRegStep(3);
      setErrorMessage('Email is already registered, please sign in');
      return;
    }

    if (regPhone.trim()) {
      const phoneExists = users.some(u => u.phone && isDuplicatePhone(u.phone, regPhone));
      if (phoneExists) {
        setRegStep(1);
        setErrorMessage('Business Mobile number is already registered');
        return;
      }
    }

    if (!regAcceptTerms) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    if (honeypotTrap.trim().length > 0) {
      setErrorMessage('Automated registration blocked by Security Guard (Honeypot Trap triggered).');
      return;
    }

    const emailDomain = regEmail.trim().toLowerCase().split('@')[1];
    const defaultDisposableDomains = [
      'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
      'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'dispostable.com',
      'getairmail.com', 'throwawaymail.com', 'sharklasers.com', 'maildrop.cc', 'fakeinbox.com'
    ];
    const blockedDomainsList = settings.blockedDomains || defaultDisposableDomains;
    if (settings.enableSecurityGuard !== false && settings.blockDisposableEmails !== false) {
      if (emailDomain && blockedDomainsList.some((d: string) => emailDomain.includes(d))) {
        setRegStep(3);
        setErrorMessage(
          `Registration blocked: Temporary or disposable email addresses (@${emailDomain}) are not allowed. Please use a permanent email address.`
        );
        return;
      }
    }

    if (regPhone) {
      const phoneVal = validatePhoneNumber(regPhone);
      if (!phoneVal.isValid) {
        setRegStep(1);
        setErrorMessage(`Business Phone Error: ${phoneVal.error}`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await register({
        name: regFullName.trim(),
        fullName: regFullName.trim(),
        firstName: regFullName.trim(),
        lastName: '',
        prefix: '',
        businessName: regBusinessName,
        startDate: regStartDate,
        currency: regCurrency,
        currencySymbol: regCurrencySymbol,
        currencySymbolPlacement: regCurrencySymbolPlacement,
        logoUrl: regLogoUrl,
        website: regWebsite,
        phone: regPhone,
        alternatePhone: regAltPhone,
        country: regCountry,
        state: regState,
        city: regCity,
        district: regProvince,
        province: regProvince,
        zip: regZip,
        landmark: regLandmark,
        timezone: regTimezone,
        tax1Name: regTax1Name || regBusinessName,
        companyName: regTax1Name || regBusinessName,
        tax1No: regTax1No.trim(),
        taxNumber: regTax1No.trim(),
        gstin: regTax1No.trim(),
        financialYearStartMonth: regFinancialYearStartMonth,
        stockAccountingMethod: regStockAccountingMethod,
        username: regUsername || regEmail.split('@')[0],
        email: regEmail,
        password: regPassword,
        role: regRole || 'admin',
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Registration failed.');
      } else {
        setSuccessMessage('Account registered successfully! Entering your workspace...');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (val: string) => {
    setRegCurrency(val);
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: '$',
      AUD: '$',
      INR: '₹',
      AED: 'AED',
    };
    setRegCurrencySymbol(symbols[val] || '$');
  };

  return (
    <div className={`auth-page-root ${isLight ? 'auth-page-light is-light' : 'auth-page-dark'} min-h-screen flex flex-col justify-center relative overflow-hidden transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-900 selection:bg-indigo-600 selection:text-white' : 'bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white'
    }`}>
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Center Container */}
      <div className="max-w-6xl w-full mx-auto px-4 py-8 relative z-10">
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-3xl shadow-2xl overflow-hidden border ${
          isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/90 backdrop-blur-xl border-slate-800'
        }`}>
          {/* Left Hero & Feature Showcase (5 cols on lg) */}
          <div className={`lg:col-span-5 p-8 border-b lg:border-b-0 lg:border-r flex flex-col justify-between relative ${
            isLight ? 'bg-gradient-to-b from-slate-50 via-white to-slate-50 border-slate-200' : 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-slate-800'
          }`}>
            <div className="space-y-6">
              {/* Brand Header - Logo Alone */}
              <div className="flex items-center">
                <RoyalLogo
                  size="xl"
                  showText={false}
                  themeMode={isLight ? 'light' : 'dark'}
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2 pt-2">
                <h2 className={`text-2xl font-black tracking-tight leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Multi-Branch Inventory, POS & Financial P&L Suite.
                </h2>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Engineered with real-time multi-location inventory deduction, fast laser barcode checkout, shift drawer cash reconciliation, and AI CFO intelligence.
                </p>
              </div>

              {/* High-Value Feature Matrix */}
              <div className="space-y-3 pt-2">
                <div className={`flex items-start gap-3 p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950/60 border-slate-800/80'}`}>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Multi-Location Inventory</h4>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Live stock tracking across warehouse hubs, express outlets, and transfers.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950/60 border-slate-800/80'}`}>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>GAAP Financial P&L & COGS</h4>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Instant income statements, operating overhead deduction, and gross margin analytics.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-950/60 border-slate-800/80'}`}>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Gemini 2.5 AI Consultant</h4>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Predictive demand replenishment, CFO margin audits, and conversational insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Footer Pill */}
            <div className={`pt-6 mt-6 border-t flex items-center justify-between text-[11px] ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Cloud DB Connected</span>
              </div>
              <span className="font-mono text-slate-500">PHP 8.3 / Laravel 11 Architecture</span>
            </div>
          </div>

          {/* Right Authentication Form Card (7 cols on lg) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Tab Navigation Switcher */}
              <div className={`flex items-center justify-between pb-6 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className={`flex gap-2 ${isLight ? 'bg-transparent border-0 p-0' : 'p-1 rounded-xl bg-slate-950 border border-slate-800'}`}>
                  <button
                    id="auth-tab-login"
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isLight
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30'
                        : mode === 'login'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    id="auth-tab-register"
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isLight
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30'
                        : mode === 'register'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Register Business</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={`hidden sm:flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>256-Bit SSL</span>
                  </div>

                  {/* Explicit Dual Mode Switcher for Auth Page */}
                  <div className={`inline-flex items-center gap-2 ${
                    isLight ? 'bg-transparent border-0 p-0' : 'p-1 rounded-xl border bg-slate-950 border-slate-800'
                  }`}>
                    <button
                      id="auth-theme-light-btn"
                      type="button"
                      onClick={() => updateSettings({ themeMode: 'light' })}
                      className={`px-3 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 font-bold ${
                        isLight
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Activate Light Mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light</span>
                    </button>
                    <button
                      id="auth-theme-dark-btn"
                      type="button"
                      onClick={() => updateSettings({ themeMode: 'dark' })}
                      className={`px-3 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 font-bold ${
                        isLight
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : !isLight
                          ? 'bg-slate-800 text-white shadow-xs font-bold border border-slate-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                      title="Activate Dark Mode"
                    >
                      <Moon className={`w-3.5 h-3.5 ${isLight ? 'text-white' : !isLight ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status & Error Alerts */}
              {errorMessage && (
                <div className="mt-4 p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mt-4 p-3.5 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 1: LOGIN FORM & SECURITY FLOWS */}
              {/* ========================================================================= */}
              {mode === 'login' && (
                <div className="mt-6 space-y-5">
                  {/* SCENARIO 1: ACCOUNT IS LOCKED & FROZEN */}
                  {lockedAccountInfo ? (
                    <div className={`p-6 rounded-2xl border ${
                      isLight ? 'bg-amber-50/70 border-amber-200 shadow-sm' : 'bg-amber-950/20 border-amber-800/60'
                    } space-y-5 animate-fadeIn`}>
                      {/* Immediate Admin Sign In Banner */}
                      <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>Administrator Immediate Sign In</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Are you the Administrator? Sign in to review security notifications and unlock staff accounts.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLockedAccountInfo(null);
                            setLockoutRemainingSeconds(0);
                            setErrorMessage(null);
                            setSuccessMessage('Administrator sign-in selected. Enter your administrator credentials.');
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Sign In as Admin</span>
                        </button>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              Brute-Force Threshold Triggered
                            </span>
                          </div>
                          <h3 className={`text-base font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Account Temporarily Frozen
                          </h3>
                          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            Account <span className="font-semibold text-amber-600 dark:text-amber-400">{lockedAccountInfo.email}</span> exceeded maximum failed password attempts.
                          </p>
                        </div>
                      </div>

                      {/* Monospace Countdown Timer Box */}
                      <div className={`p-4 rounded-xl border text-center ${
                        isLight ? 'bg-white border-amber-200 shadow-2xs' : 'bg-slate-950/80 border-amber-900/40'
                      }`}>
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span>Minutes Account Remains Frozen</span>
                        </div>
                        <div className="text-3xl font-black font-mono tracking-wider text-rose-600 dark:text-rose-400 my-1">
                          {String(Math.floor(lockoutRemainingSeconds / 60)).padStart(2, '0')}:
                          {String(lockoutRemainingSeconds % 60).padStart(2, '0')}
                        </div>
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Frozen until automatic timer unfreeze, <span className="font-semibold">unless</span> Administrator unlocks immediately upon request.
                        </p>
                      </div>

                      {/* Notification Mail to Admin Section */}
                      <div className={`p-4 rounded-xl border ${
                        lockedAccountInfo.unlockRequested
                          ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                          : isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}>
                        {lockedAccountInfo.unlockRequested ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>Notification Mail Sent to Administrator!</span>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-90">
                              An urgent unlock request notification mail has been dispatched to the Administrator. The Admin can now unlock your user account immediately from the Admin Console without waiting for the freeze timer.
                            </p>
                            <div className="pt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  let targetUser = users.find(
                                    (u) =>
                                      (u.email && u.email.toLowerCase() === lockedAccountInfo.email.toLowerCase()) ||
                                      u.id === lockedAccountInfo.userId
                                  );
                                  try {
                                    const stored = localStorage.getItem('royal_pos_v1_users');
                                    if (stored) {
                                      const parsed = JSON.parse(stored);
                                      if (Array.isArray(parsed)) {
                                        const found = parsed.find(
                                          (u: any) =>
                                            (u.email && u.email.toLowerCase() === lockedAccountInfo.email.toLowerCase()) ||
                                            u.id === lockedAccountInfo.userId
                                        );
                                        if (found) targetUser = found;
                                      }
                                    }
                                  } catch (e) {
                                    // ignore
                                  }
                                  if (
                                    targetUser &&
                                    (targetUser.status === 'active' || targetUser.isUnlockedByAdmin) &&
                                    (!targetUser.lockedUntil || targetUser.lockedUntil <= Date.now())
                                  ) {
                                    setLockedAccountInfo(null);
                                    setLockoutRemainingSeconds(0);
                                    setErrorMessage(null);
                                    setSuccessMessage(`🎉 Account unlocked by Administrator! Please enter your password to proceed.`);
                                  } else {
                                    setErrorMessage('Admin has not yet unlocked this user. You may wait for the countdown or check again.');
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Check Unlock Status</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <div className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-white">
                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Request Immediate Admin Unlock</span>
                              </div>
                              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                You can request the Admin to unlock your account immediately without waiting for the {settings.lockoutDuration || 15}-minute freeze threshold.
                              </p>
                            </div>
                            <button
                              id="btn-request-admin-unlock"
                              type="button"
                              onClick={handleSendUnlockRequest}
                              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Unlock Request to Admin via Notification Mail</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Back / Switch Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLockedAccountInfo(null);
                            setLockoutRemainingSeconds(0);
                            setErrorMessage(null);
                          }}
                          className={`w-full py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Switch Account or Return to Login</span>
                        </button>
                      </div>
                    </div>
                  ) : otpState ? (
                    /* SCENARIO 2: ENFORCE EMAIL OTP CODE VERIFICATION */
                    <div className={`p-6 rounded-2xl border ${
                      isLight ? 'bg-indigo-50/60 border-indigo-200 shadow-sm' : 'bg-indigo-950/20 border-indigo-800/60'
                    } space-y-5 animate-fadeIn`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              High Security Check
                            </span>
                          </div>
                          <h3 className={`text-base font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Enforce Email OTP Code Verification
                          </h3>
                          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            A 6-digit one-time security code has been dispatched to <span className="font-semibold text-indigo-600 dark:text-indigo-400">{otpState.email}</span>.
                          </p>
                        </div>
                      </div>

                      {/* Simulation Card for Testing */}
                      <div className={`p-3.5 rounded-xl border ${
                        isLight ? 'bg-white border-indigo-200/80 shadow-2xs' : 'bg-slate-950/80 border-indigo-900/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Email OTP Delivery Mail
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                            Sent
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Your 6-Digit OTP Code:</div>
                            <div className="text-lg font-mono font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                              {otpState.otpCode || '123456'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOtpValue(otpState.otpCode || '123456')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold transition shadow-2xs"
                          >
                            Auto-Fill Code
                          </button>
                        </div>
                      </div>

                      {/* OTP Input Form */}
                      <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                          <label className={`text-xs font-semibold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            Enter 6-Digit OTP Code *
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              id="otp-code-input"
                              type="text"
                              maxLength={6}
                              required
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className={`w-full text-center text-xl font-mono tracking-widest font-bold py-3 pl-10 pr-4 rounded-xl border focus:outline-none focus:ring-2 transition ${
                                isLight
                                  ? 'bg-white text-slate-900 border-indigo-300 focus:border-indigo-600 focus:ring-indigo-600/20'
                                  : 'bg-slate-950 text-white border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500/30'
                              }`}
                            />
                          </div>
                        </div>

                        {otpError && (
                          <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{otpError}</span>
                          </div>
                        )}

                        <button
                          id="btn-submit-otp"
                          type="submit"
                          disabled={otpLoading || otpValue.length < 6}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                          {otpLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Verify OTP Code & Log In</span>
                            </>
                          )}
                        </button>
                      </form>

                      {/* Auxiliary Actions */}
                      <div className="flex items-center justify-between pt-2 text-xs">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={otpCooldown > 0 || otpLoading}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Resend OTP Code {otpCooldown > 0 && `(${otpCooldown}s)`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOtpState(null);
                            setOtpError(null);
                          }}
                          className={`hover:underline font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                        >
                          Cancel & Back to Login
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* SCENARIO 3: STANDARD LOGIN FORM */
                    <>
                      <div>
                        <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Welcome Back</h3>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          Enter your account credentials to access the console.
                        </p>
                      </div>

                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        {/* Email / Username */}
                        <div>
                          <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            Email Address or Username *
                          </label>
                          <div className="relative">
                            <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
                            <input
                              id="login-email-input"
                              type="text"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="admin@finiaspos.com"
                              className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                isLight
                                  ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                  : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Password *
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setForgotEmail(loginEmail);
                                setShowForgotModal(true);
                              }}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition"
                            >
                              Forgot Password?
                            </button>
                          </div>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              id="login-password-input"
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none focus:ring-1 transition font-mono ${
                                isLight
                                  ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                  : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Active Terminal Branch / Warehouse Field (Hidden & Disabled in Sign In per specification) */}
                        <div className="hidden" aria-hidden="true">
                          <select
                            id="login-location-select"
                            value={loginLocation}
                            onChange={(e) => setLoginLocation(e.target.value)}
                            disabled
                          >
                            {(locations || []).map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remember me */}
                        <div className={`flex items-center justify-between text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className={`rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}
                            />
                            <span>Remember credentials on this POS terminal</span>
                          </label>
                        </div>

                        {/* CAPTCHA / Bot Verification Widget */}
                        {renderCaptchaWidget(true)}

                        {/* Submit Button */}
                        <button
                          id="login-submit-btn"
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Sign In to ERP Terminal</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: REGISTER BUSINESS FORM (ULTIMATE POS STANDARD) */}
              {/* ========================================================================= */}
              {mode === 'register' && (
                <div className="mt-6 space-y-5">
                  <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                    <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Register and Get Started In Minutes
                    </h3>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Setup your business details, tax rates, and admin owner account.
                    </p>
                  </div>

                  {/* Wizard Stepper Header */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-center">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className={`p-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                        regStep === 1
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>1. Business Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className={`p-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                        regStep === 2
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>2. Tax & Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegStep(3)}
                      className={`p-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition ${
                        regStep === 3
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>3. Admin Details</span>
                    </button>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                    {/* Invisible Honeypot Trap Field */}
                    <input
                      type="text"
                      name="website_url_hp"
                      value={honeypotTrap}
                      onChange={(e) => setHoneypotTrap(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      className="hidden pointer-events-none opacity-0 h-0 w-0 absolute left-[-9999px]"
                    />

                    {/* STEP 1: BUSINESS DETAILS */}
                    {regStep === 1 && (
                      <div className="space-y-3.5 animate-fadeIn">
                        <div className="font-bold text-xs uppercase tracking-wider text-indigo-500 border-b pb-1 border-indigo-500/20">
                          Step 1: Business Details
                        </div>

                        {/* Business Name & Start Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Business Name *
                            </label>
                            <div className="relative">
                              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                required
                                type="text"
                                value={regBusinessName}
                                onChange={(e) => setRegBusinessName(e.target.value)}
                                placeholder="e.g. Apex Supermarket & Retail"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight
                                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                    : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Start Date
                            </label>
                            <div className="relative">
                              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="date"
                                value={regStartDate}
                                onChange={(e) => setRegStartDate(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight
                                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                    : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Currency & Currency Placement */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Currency *
                            </label>
                            <div className="relative">
                              <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <select
                                value={regCurrency}
                                onChange={(e) => handleCurrencyChange(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight
                                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                    : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                                }`}
                              >
                                <option value="USD">USD ($) - US Dollar</option>
                                <option value="EUR">EUR (€) - Euro</option>
                                <option value="GBP">GBP (£) - British Pound</option>
                                <option value="CAD">CAD ($) - Canadian Dollar</option>
                                <option value="AUD">AUD ($) - Australian Dollar</option>
                                <option value="INR">INR (₹) - Indian Rupee</option>
                                <option value="AED">AED - UAE Dirham</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Currency Symbol Placement
                            </label>
                            <select
                              value={regCurrencySymbolPlacement}
                              onChange={(e) => setRegCurrencySymbolPlacement(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                isLight
                                  ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                  : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                              }`}
                            >
                              <option value="before">Before Amount (e.g. $100)</option>
                              <option value="after">After Amount (e.g. 100$)</option>
                            </select>
                          </div>
                        </div>

                        {/* Website & Phone Numbers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Business Contact Number *
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                required
                                type="tel"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                                placeholder="+1 (555) 019-2834"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight
                                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                    : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Alternate Contact Number
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="tel"
                                value={regAltPhone}
                                onChange={(e) => setRegAltPhone(e.target.value)}
                                placeholder="+1 (555) 987-6543"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight
                                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                    : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Website & Timezone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Website
                            </label>
                            <div className="relative">
                              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="url"
                                value={regWebsite}
                                onChange={(e) => setRegWebsite(e.target.value)}
                                placeholder="https://mybusiness.com"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight
                                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                    : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Time Zone *
                            </label>
                            <div className="relative">
                              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <select
                                value={regTimezone}
                                onChange={(e) => setRegTimezone(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight
                                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                                    : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                                }`}
                              >
                                <option value="America/New_York">Eastern Time (US & Canada)</option>
                                <option value="America/Chicago">Central Time (US & Canada)</option>
                                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                <option value="Europe/London">London (GMT / BST)</option>
                                <option value="Asia/Dubai">Dubai (GST +4)</option>
                                <option value="Asia/Kolkata">India (IST +5:30)</option>
                                <option value="UTC">UTC Standard</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Zipcode, City, District / Province, State, Country */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold text-xs uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              Business Address & Location
                            </span>
                            {isLookingUpZip && (
                              <span className="text-[11px] text-indigo-500 font-semibold animate-pulse flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Auto-detecting location...
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className={`font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                  Zip / Postal / PIN Code *
                                </label>
                                <span className="text-[10px] text-indigo-500 font-medium">Auto-fills address</span>
                              </div>
                              <div className="relative">
                                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={regZip}
                                  onChange={(e) => handleZipChange(e.target.value)}
                                  placeholder="e.g. 10001, 560001, SW1A..."
                                  className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                    isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                  }`}
                                />
                              </div>
                            </div>

                            <div>
                              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>City *</label>
                              <input
                                type="text"
                                value={regCity}
                                onChange={(e) => setRegCity(e.target.value)}
                                placeholder="e.g. Los Angeles / Bangalore"
                                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>District / Province</label>
                              <input
                                type="text"
                                value={regProvince}
                                onChange={(e) => setRegProvince(e.target.value)}
                                placeholder="e.g. Manhattan District / Urban"
                                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>State *</label>
                              <input
                                type="text"
                                value={regState}
                                onChange={(e) => setRegState(e.target.value)}
                                placeholder="e.g. California / Karnataka"
                                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Country *</label>
                              <input
                                type="text"
                                value={regCountry}
                                onChange={(e) => setRegCountry(e.target.value)}
                                placeholder="e.g. United States / India"
                                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Landmark */}
                        <div>
                          <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Landmark / Location Address</label>
                          <input
                            type="text"
                            value={regLandmark}
                            onChange={(e) => setRegLandmark(e.target.value)}
                            placeholder="e.g. Opposite Main Street Mall, Suite 100"
                            className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                              isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                            }`}
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!regBusinessName.trim() || !regPhone.trim()) {
                                setErrorMessage('Please fill in Business Name and Contact Number before proceeding.');
                                return;
                              }
                              setErrorMessage(null);
                              setRegStep(2);
                            }}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow flex items-center gap-2 transition"
                          >
                            <span>Next: Tax & Settings</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: BUSINESS SETTINGS & TAX DETAILS */}
                    {regStep === 2 && (
                      <div className="space-y-3.5 animate-fadeIn">
                        <div className="font-bold text-xs uppercase tracking-wider text-indigo-500 border-b pb-1 border-indigo-500/20">
                          Step 2: Tax & Business Settings
                        </div>

                        {/* Company Name & GSTIN / Tax Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={regTax1Name}
                              onChange={(e) => setRegTax1Name(e.target.value)}
                              placeholder={regBusinessName ? regBusinessName : "e.g. Acme Enterprise Pvt Ltd"}
                              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                              }`}
                            />
                            <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                              isLight 
                                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Company Name should be as per provided in GST or Tax</span>
                            </div>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              GSTIN or Tax Number
                            </label>
                            <input
                              type="text"
                              value={regTax1No}
                              onChange={(e) => setRegTax1No(e.target.value.toUpperCase())}
                              placeholder="e.g. 29ABCDE1234F1Z5 or Tax ID"
                              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition font-mono uppercase ${
                                isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                              }`}
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              Automatically applied across tax configuration, POS invoices, and tax reports.
                            </p>
                          </div>
                        </div>

                        {/* Financial Year Start Month & Stock Accounting Method */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Financial Year Start Month *
                            </label>
                            <select
                              value={regFinancialYearStartMonth}
                              onChange={(e) => setRegFinancialYearStartMonth(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                              }`}
                            >
                              {[
                                'January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'
                              ].map((month) => (
                                <option key={month} value={month}>{month}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Stock Accounting Method *
                            </label>
                            <select
                              value={regStockAccountingMethod}
                              onChange={(e) => setRegStockAccountingMethod(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                              }`}
                            >
                              <option value="FIFO">FIFO (First In First Out)</option>
                              <option value="LIFO">LIFO (Last In First Out)</option>
                              <option value="AVCO">AVCO (Average Costing Method)</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage(null);
                              setRegStep(1);
                            }}
                            className={`px-4 py-2 border rounded-xl font-bold transition flex items-center gap-1.5 ${
                              isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage(null);
                              setRegStep(3);
                            }}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow flex items-center gap-2 transition"
                          >
                            <span>Next: Admin Details</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: ADMIN DETAILS */}
                    {regStep === 3 && (
                      <div className="space-y-3.5 animate-fadeIn">
                        <div className="font-bold text-xs uppercase tracking-wider text-indigo-500 border-b pb-1 border-indigo-500/20">
                          Step 3: Admin Details
                        </div>

                        {/* Full Name */}
                        <div>
                          <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            Full Name *
                          </label>
                          <div className="relative">
                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              required
                              type="text"
                              value={regFullName}
                              onChange={(e) => setRegFullName(e.target.value)}
                              placeholder="e.g. John Doe"
                              className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Username & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Username *
                            </label>
                            <div className="relative">
                              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                required
                                type="text"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                placeholder="e.g. admin or johndoe"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Work Email Address *
                            </label>
                            <div className="relative">
                              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                required
                                type="email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                placeholder="john@mybusiness.com"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>
                            {regEmail.trim() && users.some(u => u.email?.trim().toLowerCase() === regEmail.trim().toLowerCase()) && (
                              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                                Email is already registered, please sign in
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Password & Confirm Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Password *
                            </label>
                            <div className="relative">
                              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                required
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition font-mono ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              Confirm Password *
                            </label>
                            <div className="relative">
                              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                required
                                type="password"
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-1 transition font-mono ${
                                  isLight ? 'bg-slate-50 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* CAPTCHA / Bot Verification Widget */}
                        {renderCaptchaWidget(false)}

                        {/* Terms Checkbox */}
                        <div className="pt-1">
                          <label className={`flex items-center gap-2 text-xs cursor-pointer ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                            <input
                              type="checkbox"
                              checked={regAcceptTerms}
                              onChange={(e) => setRegAcceptTerms(e.target.checked)}
                              className={`rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}
                            />
                            <span>
                              I accept the Finias POS Terms of Service & Privacy Policy.
                            </span>
                          </label>
                        </div>

                        {/* Submit Register Button */}
                        <div className="pt-2 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage(null);
                              setRegStep(2);
                            }}
                            className={`px-4 py-2 border rounded-xl font-bold transition flex items-center gap-1.5 ${
                              isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                          </button>

                          <button
                            id="register-submit-btn"
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                          >
                            {loading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <span>Register Business & Launch Terminal</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>

            {/* Bottom Help & Switch Notice */}
            <div className={`pt-6 mt-6 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
              {mode === 'login' ? (
                <div>
                  Don't have an enterprise account?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold ml-1 transition"
                  >
                    Register Business Free
                  </button>
                </div>
              ) : (
                <div>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold ml-1 transition"
                  >
                    Sign In Here
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 text-slate-500">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Need assistance? Contact support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Reset Terminal Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSubmitted(false);
                }}
                className={`transition ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="space-y-3 py-2 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Recovery Link Sent!</h4>
                <p className={`${isLight ? 'text-slate-600' : 'text-slate-300'} leading-relaxed`}>
                  We have dispatched temporary password reset instructions to <span className="font-mono text-indigo-600 dark:text-indigo-400">{forgotEmail}</span>.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold mt-2 shadow-md"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validateEmail(forgotEmail)) {
                    setErrorMessage('Please enter a valid registered email address.');
                    return;
                  }
                  if (forgotEmail.trim()) {
                    setForgotSubmitted(true);
                  }
                }}
                className="space-y-3"
              >
                <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                  Enter your registered work email address and we'll send you a secure link to reset your account password.
                </p>
                <div>
                  <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Registered Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@finiaspos.com"
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 transition ${
                      isLight
                        ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/30'
                        : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                  Send Recovery Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
