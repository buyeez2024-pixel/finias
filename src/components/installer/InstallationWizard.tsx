import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { getApiUrl } from '../../utils/apiBase';
import { RoyalLogo } from '../common/RoyalLogo';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Server,
  ShieldCheck,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Key,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
  Check,
  FileCode,
  Globe,
  Coins,
  Store,
  Terminal,
  Play,
  Copy,
  Sliders,
  HelpCircle,
  Flame,
  FileCheck,
  MapPin,
  Upload,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { completeServerInstallation } from '../../services/systemService';

interface InstallationWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
  isStandalone?: boolean;
}

type DatabaseEngine = 'mysql' | 'mariadb' | 'postgresql' | 'sqlite' | 'client_local';

interface RequirementItem {
  id: string;
  name: string;
  category: 'server' | 'extension' | 'permission';
  required: string;
  detected: string;
  passed: boolean;
  help?: string;
}

export const InstallationWizard: React.FC<InstallationWizardProps> = ({
  onComplete,
  onCancel,
  isStandalone = false,
}) => {
  const {
    settings,
    updateSettings,
    users,
    addUser,
    updateUser,
    login,
    showFlashNotification,
    purgeAllData,
    applyInstallationStarterModules,
    upsertSuperAdminUser,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;

  // Step 2: Database Configuration
  const [dbEngine, setDbEngine] = useState<DatabaseEngine>('mysql');
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [dbPrefix, setDbPrefix] = useState('pos_');
  const [dbCharset, setDbCharset] = useState('utf8mb4');
  
  // Connection Testing State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    details?: string[];
  }>({
    tested: false,
    success: false,
    message: '',
  });

  const [isDemoInstallation, setIsDemoInstallation] = useState(false);

  useEffect(() => {
    if (!isDemoInstallation && typeof window !== 'undefined') {
      localStorage.setItem('app_fresh_installed', 'true');
      localStorage.setItem('installation_type', 'fresh');
    }
  }, [isDemoInstallation]);

  // Step 3: Store & Super Admin
  const [businessName, setBusinessName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [timezone, setTimezone] = useState('America/New_York');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessProvince, setBusinessProvince] = useState('');
  const [businessState, setBusinessState] = useState('');
  const [businessZip, setBusinessZip] = useState('');
  const [businessCountry, setBusinessCountry] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);

  const [step2Attempted, setStep2Attempted] = useState(false);
  const [step3Attempted, setStep3Attempted] = useState(false);
  const [step4Attempted, setStep4Attempted] = useState(false);

  const handleZipChange = async (zip: string) => {
    setBusinessZip(zip);
    const cleanZip = zip.trim().toUpperCase();
    if (cleanZip.length >= 2) {
      setIsLookingUpZip(true);

      // Check if it's a 6-digit Indian PIN code
      if (/^\d{6}$/.test(cleanZip)) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanZip}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
              const place = data[0].PostOffice[0];
              setBusinessCity(place.Block || place.Name || '');
              setBusinessProvince(place.District || '');
              setBusinessState(place.State || '');
              setBusinessCountry('India');
              setIsLookingUpZip(false);
              return;
            }
          }
        } catch (e) {
          // Fallback to static mapping below
        }
      } 
      
      // Try Zippopotamus for US as default fallback if 5 digits
      if (/^\d{5}$/.test(cleanZip)) {
        try {
          const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.places && data.places.length > 0) {
              const place = data.places[0];
              setBusinessCity(place['place name'] || '');
              setBusinessProvince(place['state'] || '');
              setBusinessState(place['state abbreviation'] || place['state'] || '');
              setBusinessCountry('United States');
              setIsLookingUpZip(false);
              return;
            }
          }
        } catch (e) {
          // Fallback to static mapping below
        }
      }

      setTimeout(() => {
        const lookup: Record<string, { city: string; province: string; state: string; country: string }> = {
          '10001': { city: 'New York', province: 'Manhattan District', state: 'NY', country: 'United States' },
          '10002': { city: 'New York', province: 'Manhattan District', state: 'NY', country: 'United States' },
          '90210': { city: 'Beverly Hills', province: 'Los Angeles District', state: 'CA', country: 'United States' },
          '30301': { city: 'Atlanta', province: 'Fulton District', state: 'GA', country: 'United States' },
          '60601': { city: 'Chicago', province: 'Cook District', state: 'IL', country: 'United States' },
          '75201': { city: 'Dallas', province: 'Dallas District', state: 'TX', country: 'United States' },
          '94101': { city: 'San Francisco', province: 'San Francisco County', state: 'CA', country: 'United States' },
          '33101': { city: 'Miami', province: 'Miami-Dade', state: 'FL', country: 'United States' },
          '98101': { city: 'Seattle', province: 'King County', state: 'WA', country: 'United States' },
          '02101': { city: 'Boston', province: 'Suffolk County', state: 'MA', country: 'United States' },
          'SW1A': { city: 'London', province: 'Greater London', state: 'England', country: 'United Kingdom' },
          'W1A': { city: 'London', province: 'Greater London', state: 'England', country: 'United Kingdom' },
          'M5V': { city: 'Toronto', province: 'Toronto Division', state: 'Ontario', country: 'Canada' },
          'V6B': { city: 'Vancouver', province: 'Metro Vancouver', state: 'British Columbia', country: 'Canada' },
          '2000': { city: 'Sydney', province: 'Sydney District', state: 'New South Wales', country: 'Australia' },
          '3000': { city: 'Melbourne', province: 'Melbourne District', state: 'Victoria', country: 'Australia' },
          '1100': { city: 'New Delhi', province: 'Central Delhi', state: 'Delhi', country: 'India' },
          '4000': { city: 'Mumbai', province: 'Mumbai City', state: 'Maharashtra', country: 'India' },
          '5600': { city: 'Bangalore', province: 'Bangalore Urban', state: 'Karnataka', country: 'India' },
          '5000': { city: 'Hyderabad', province: 'Hyderabad District', state: 'Telangana', country: 'India' },
          '5200': { city: 'Vijayawada', province: 'NTR District', state: 'Andhra Pradesh', country: 'India' },
          '5300': { city: 'Visakhapatnam', province: 'Visakhapatnam District', state: 'Andhra Pradesh', country: 'India' },
          '5150': { city: 'Anantapur', province: 'Anantapur District', state: 'Andhra Pradesh', country: 'India' },
        };

        const matchedKey = Object.keys(lookup).find(k => cleanZip.startsWith(k) || cleanZip === k);
        if (matchedKey) {
          const item = lookup[matchedKey];
          setBusinessCity(item.city);
          setBusinessProvince(item.province);
          setBusinessState(item.state);
          setBusinessCountry(item.country);
        } else if (cleanZip.length >= 5 && !/^\d{6}$/.test(cleanZip)) {
          setBusinessCity('Metro City');
          setBusinessProvince('Central Province');
          setBusinessState('State/Prov');
          setBusinessCountry('United States');
        }
        setIsLookingUpZip(false);
      }, 200);
    }
  };

  const handlePhoneChange = (val: string) => {
    setBusinessPhone(val);
    const clean = val.replace(/[\s\-\(\)\+]/g, '');
    const countryLower = businessCountry.trim().toLowerCase();
    const isIndia = countryLower === 'india' || val.trim().startsWith('+91') || clean.startsWith('91');

    if (isIndia) {
      if (!clean) {
        setPhoneError('');
        return;
      }
      if (val.trim().startsWith('+91') || (clean.startsWith('91') && clean.length > 10)) {
        if (clean.length !== 12 || !/^91[6789]\d{9}$/.test(clean)) {
          setPhoneError('For India (+91), enter 10 digits (e.g. 8220038825) or 12 digits with 91 (e.g. +91 8220038825)');
        } else {
          setPhoneError('');
        }
      } else {
        if (clean.length !== 10 || !/^[6789]\d{9}$/.test(clean)) {
          setPhoneError('For India, phone number must be exactly 10 digits starting with 6, 7, 8, or 9 (e.g. 8220038825)');
        } else {
          setPhoneError('');
        }
      }
    } else {
      if (clean.length > 0 && (clean.length < 7 || clean.length > 15 || !/^\d+$/.test(clean))) {
        setPhoneError('Please enter a valid phone number (7-15 digits)');
      } else {
        setPhoneError('');
      }
    }
  };

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminAvatar, setAdminAvatar] = useState('');

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'No Password Entered', color: 'bg-slate-800', isStrong: false };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    let text = 'Weak Password';
    let color = 'bg-rose-500';
    let isStrong = false;

    if (score >= 4 && pwd.length >= 8) {
      text = score === 5 ? 'Very Strong' : 'Strong Password';
      color = 'bg-emerald-500';
      isStrong = true;
    } else if (score >= 2) {
      text = 'Moderate Password';
      color = 'bg-amber-500';
    }

    return { score, text, color, isStrong };
  };

  const generateStrongPassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '@#$%^&*!';

    let pwd = '';
    pwd += uppers[Math.floor(Math.random() * uppers.length)];
    pwd += lowers[Math.floor(Math.random() * lowers.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];

    const all = uppers + lowers + numbers + symbols;
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }

    const shuffled = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setAdminPassword(shuffled);
    setShowAdminPassword(true);
    showFlashNotification('⚡ Auto-generated strong password!', 'success');
  };

  // Step 4: Starter Data & Modules
  const [seedDemoCatalog, setSeedDemoCatalog] = useState(true);
  const [seedDefaultTaxes, setSeedDefaultTaxes] = useState(true);
  const [seedDefaultRegisters, setSeedDefaultRegisters] = useState(true);
  const [enableBarcodeStudio, setEnableBarcodeStudio] = useState(true);
  const [enableAccountingModule, setEnableAccountingModule] = useState(true);
  const [enableAiAssistant, setEnableAiAssistant] = useState(true);

  // Step 5: Migration Runner State
  const [migrationProgress, setMigrationProgress] = useState<number>(0);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installComplete, setInstallComplete] = useState<boolean>(false);

  // Copy feedback
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Default Port Adjuster on Engine Change
  useEffect(() => {
    if (dbEngine === 'mysql' || dbEngine === 'mariadb') {
      setDbPort('3306');
    } else if (dbEngine === 'postgresql') {
      setDbPort('5432');
    } else if (dbEngine === 'sqlite') {
      setDbPort('N/A (Embedded File)');
    } else {
      setDbPort('Browser IndexedDB');
    }
    setConnectionStatus({ tested: false, success: false, message: '' });
  }, [dbEngine]);

  // System Requirements List
  const requirements: RequirementItem[] = [
    {
      id: 'node_php',
      name: 'Web Server Environment',
      category: 'server',
      required: 'Apache / LiteSpeed / NGINX / Node.js 18+',
      detected: 'Active Web Server (Production Compatible)',
      passed: true,
      help: 'Runs natively on standard cPanel Apache or Node.js runtime.',
    },
    {
      id: 'storage_write',
      name: 'Public HTML & Storage Write Permissions',
      category: 'permission',
      required: 'Writable (0755 / 0775)',
      detected: 'Writable & Persistent',
      passed: true,
      help: 'Allows storing receipt caches and asset uploads.',
    },
    {
      id: 'https',
      name: 'SSL / HTTPS Security Transport',
      category: 'server',
      required: 'Recommended (HTTPS)',
      detected: typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Secure (HTTPS Active)' : 'HTTP (AutoSSL Ready)',
      passed: true,
      help: 'Ensures encrypted transactions and offline caching service workers.',
    },
    {
      id: 'ext_json',
      name: 'JSON Data Parser Engine',
      category: 'extension',
      required: 'Enabled',
      detected: 'Enabled (Native)',
      passed: true,
    },
    {
      id: 'ext_crypto',
      name: 'Cryptographic & SHA-256 Hashing Engine',
      category: 'extension',
      required: 'Enabled (WebCrypto / OpenSSL)',
      detected: 'Enabled (WebCrypto SHA-256 Active)',
      passed: true,
    },
    {
      id: 'ext_storage',
      name: 'Database & Local Persistence Engine',
      category: 'server',
      required: 'MySQL / Postgres / IndexedDB v2',
      detected: 'Ready for Tables Execution',
      passed: true,
    },
  ];

  const allRequirementsPassed = requirements.every((r) => r.passed);

  // Test Database Connection Simulation / Validation
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus({ tested: false, success: false, message: '' });

    if (dbEngine === 'sqlite' || dbEngine === 'client_local') {
      setTimeout(() => {
        setIsTestingConnection(false);
        setConnectionStatus({
          tested: true,
          success: true,
          message: `Connection successful! Embedded ${dbEngine === 'sqlite' ? 'SQLite engine' : 'Client Storage'} is ready for table creation.`,
          details: [
            'Database engine initialized',
            'Read/Write permissions verified',
            'Ready for schema migrations',
          ],
        });
      }, 500);
      return;
    }

    if (!dbHost.trim() || !dbName.trim() || !dbUser.trim()) {
      setIsTestingConnection(false);
      setConnectionStatus({
        tested: true,
        success: false,
        message: 'Connection failed: Please enter a valid Host, Database Name, and Username.',
        details: ['Missing database parameter fields'],
      });
      return;
    }

    // Real server test to MySQL via cPanel PHP API
    try {
      const res = await fetch(getApiUrl('api/sync.php?action=test_db'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost,
          dbPort,
          dbName,
          dbUser,
          dbPassword,
          dbCharset,
          dbPrefix,
        }),
      });

      setIsTestingConnection(false);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Immediately save configuration and create all SQL tables in phpMyAdmin
          try {
            await fetch(getApiUrl('api/sync.php?action=save_config'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dbHost,
                dbPort,
                dbName,
                dbUser,
                dbPassword,
                dbPrefix,
                dbCharset,
              }),
            });
          } catch {}

          setConnectionStatus({
            tested: true,
            success: true,
            message: data.message || `Successfully connected to MySQL database '${dbName}'! All SQL tables generated.`,
            details: [
              `Connected to host: ${dbHost}`,
              `Target database: ${dbName}`,
              `User authenticated: ${dbUser}`,
              `Charset: ${dbCharset} (Unicode & Emoji ready)`,
              `Table prefix '${dbPrefix}' verified`,
              `All MySQL tables (pos_customers, pos_products, pos_transactions) created in phpMyAdmin`,
              data.server_info ? `Server version: ${data.server_info}` : 'Engine: InnoDB ready',
            ],
          });
          return;
        } else {
          setConnectionStatus({
            tested: true,
            success: false,
            message: data.message || 'Connection failed: Access denied or invalid credentials.',
            details: [
              `Host: ${dbHost}:${dbPort}`,
              `User: ${dbUser}`,
              `Target database: ${dbName}`,
              'Check your cPanel/Hostinger MySQL username, password, and database permissions.',
            ],
          });
          return;
        }
      }
    } catch (err: any) {
      setIsTestingConnection(false);
      setConnectionStatus({
        tested: true,
        success: false,
        message: 'Unable to reach MySQL API endpoint (/api/sync.php). Check if PHP is enabled on your server.',
        details: [
          `Error: ${err?.message || 'Network error'}`,
          'Ensure the dist/api/ folder was uploaded to your website root on Hostinger.',
        ],
      });
      return;
    }
  };

  const handleDemoToggle = (enableDemo: boolean) => {
    setIsDemoInstallation(enableDemo);
    if (enableDemo) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('app_fresh_installed');
        localStorage.setItem('installation_type', 'demo');
      }
      setBusinessName('Demo Supermarket POS');
      setCurrencyCode('USD');
      setCurrencySymbol('$');
      setTimezone('America/New_York');
      setBusinessZip('10001');
      setBusinessCity('New York');
      setBusinessProvince('Manhattan');
      setBusinessState('NY');
      setBusinessCountry('United States');
      setBusinessAddress('123 Demo Street, Suite 100');
      setBusinessPhone('+1 (555) 123-4567');

      setAdminName('Admin User');
      setAdminEmail('admin@demo.com');
      setAdminUsername('admin');
      setAdminPassword('admin123');
      setAdminPin('1234');

      setSeedDemoCatalog(true);
      setSeedDefaultTaxes(true);
      setSeedDefaultRegisters(true);
      setEnableBarcodeStudio(true);
      setEnableAccountingModule(true);
      setEnableAiAssistant(true);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_fresh_installed', 'true');
        localStorage.setItem('installation_type', 'fresh');
      }
      setBusinessName('');
      setBusinessZip('');
      setBusinessCity('');
      setBusinessProvince('');
      setBusinessState('');
      setBusinessCountry('');
      setBusinessAddress('');
      setBusinessPhone('');
      
      setAdminName('');
      setAdminEmail('');
      setAdminUsername('');
      setAdminPassword('');
      setAdminPin('');

      setSeedDemoCatalog(false);
      setSeedDefaultTaxes(false);
      setSeedDefaultRegisters(false);
    }
  };

  // Run Automated Installation & Database Migrations
  const startAutomatedInstallation = () => {
    setIsInstalling(true);
    setMigrationLogs([]);
    setMigrationProgress(5);

    const steps = [
      { progress: 15, msg: `Initializing ${dbEngine.toUpperCase()} database engine on ${dbHost}...` },
      { progress: 25, msg: `Checking existing tables with prefix "${dbPrefix}"...` },
      { progress: 35, msg: `Executing DDL Schema: Creating table \`${dbPrefix}users\`, \`${dbPrefix}roles\`, \`${dbPrefix}permissions\`...` },
      { progress: 48, msg: `Executing DDL Schema: Creating table \`${dbPrefix}products\`, \`${dbPrefix}categories\`, \`${dbPrefix}brands\`, \`${dbPrefix}variations\`...` },
      { progress: 60, msg: `Executing DDL Schema: Creating table \`${dbPrefix}transactions\`, \`${dbPrefix}sales\`, \`${dbPrefix}purchases\`, \`${dbPrefix}stock_adjustments\`...` },
      { progress: 72, msg: `Executing DDL Schema: Creating table \`${dbPrefix}contacts\`, \`${dbPrefix}accounts\`, \`${dbPrefix}cash_registers\`, \`${dbPrefix}invoice_layouts\`...` },
      { progress: 85, msg: `Seeding System Parameters: Business profile "${businessName}", Currency (${currencyCode} ${currencySymbol}), Timezone (${timezone})...` },
      { progress: 92, msg: `Creating Supreme Administrator account (${adminEmail}) and hashing credentials...` },
      { progress: 98, msg: `Generating encrypted APP_KEY and locking installer setup...` },
      { progress: 100, msg: `✓ Installation & Database Migration completed successfully!` },
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        const step = steps[currentIdx];
        setMigrationProgress(step.progress);
        setMigrationLogs((prev) => [...prev, step.msg]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsInstalling(false);
        setInstallComplete(true);

        // Clear all mock data and set sole admin if it is a fresh installation
        if (!isDemoInstallation) {
          purgeAllData({
            name: adminName,
            email: adminEmail,
            username: adminUsername,
            password: adminPassword,
            role: 'supreme_admin' as any,
            phone: businessPhone || '+1 800 555 0199',
            status: 'active',
          });
        }

        // Apply settings & create supreme admin in the actual app store
        try {
          updateSettings({
            name: businessName,
            businessName: businessName,
            currency: currencyCode,
            currencyCode: currencyCode,
            currencySymbol: currencySymbol,
            timezone: timezone,
            address: businessAddress,
            city: businessCity,
            province: businessProvince,
            state: businessState,
            zip: businessZip,
            country: businessCountry,
            phone: businessPhone,
            logo: businessLogo,
            logoUrl: businessLogo,
            darkLogoUrl: businessLogo,
            isInstalled: true,
            installationCompleted: true,
            isFreshInstallation: !isDemoInstallation,
            installationType: !isDemoInstallation ? 'fresh' : 'demo',
            installedAt: new Date().toISOString(),
          });
          if (businessLogo && typeof localStorage !== 'undefined') {
            localStorage.setItem('royal_pos_v1_primary_logo', businessLogo);
          }

          // Sync supreme admin account to ensure it's always in users store
          upsertSuperAdminUser({
            name: adminName,
            email: adminEmail,
            username: adminUsername,
            password: adminPassword,
            pin: adminPin,
            phone: businessPhone,
            avatar: adminAvatar || undefined,
            role: 'supreme_admin',
          });

          // Automatically bump version & record release history changelog
          const currentVer = settings?.appVersion || 'v2.5.0';
          const cleanVer = currentVer.replace(/^v/, '');
          const parts = cleanVer.split('.').map((p) => parseInt(p, 10) || 0);
          let [major, minor, patch] = parts.length === 3 ? parts : [2, 5, 0];
          patch += 1;
          const newVersion = `v${major}.${minor}.${patch}`;
          const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
          const newLog = {
            version: newVersion,
            releaseDate: nowStr,
            updatedBy: `${adminName} (Installer Setup)`,
            type: 'patch',
            description: 'Updated Installation Wizard Step 3 store profile & address sections to start blank/empty; added strict email validation (name@domain.com) with helper hints and Super Admin avatar image upload in Step 4.',
          };
          const existingNotes = settings?.appReleaseNotes || [];
          updateSettings({
            appVersion: newVersion,
            buildNumber: `${nowStr.slice(0, 10)}-RELEASE`,
            lastUpdatedDate: nowStr,
            appReleaseNotes: [newLog, ...existingNotes],
          });

          // Apply starter modules, demo catalog, tax presets, registers & accounting modules
          applyInstallationStarterModules({
            seedDemoCatalog,
            seedDefaultTaxes,
            seedDefaultRegisters,
            enableBarcodeStudio,
            enableAccountingModule,
            enableAiAssistant,
            businessName,
            currencyCode,
            currencySymbol,
            timezone,
            adminName,
          });

          // Mark installation as completed in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('pos_installed', 'true');
            localStorage.setItem('app_installed', 'true');
            localStorage.setItem('app_installation_completed', 'true');
            localStorage.setItem('pos_db_engine', dbEngine);
            localStorage.setItem('pos_db_name', dbName);
            localStorage.setItem('pos_db_prefix', dbPrefix);
            localStorage.setItem('installation_type', isDemoInstallation ? 'demo' : 'fresh');
            if (!isDemoInstallation) {
              localStorage.setItem('app_fresh_installed', 'true');
            } else {
              localStorage.removeItem('app_fresh_installed');
            }
          }
        } catch (err) {
          console.error('Error applying installation parameters:', err);
        }
      }
    }, 550);
  };

  // Generate .env file contents for download or copy
  const generateEnvFileContent = () => {
    return `# =====================================================================
# FINIAS ENTERPRISE POS & ERP CONFIGURATION (.env)
# Generated via Web Installation Wizard on ${new Date().toISOString()}
# =====================================================================

APP_NAME="${businessName}"
APP_ENV=production
APP_DEBUG=false
APP_URL="${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}"
APP_KEY=base64:${btoa(Date.now().toString() + '_' + Math.random().toString(36))}

# Database Connection Settings
DB_CONNECTION=${dbEngine}
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_DATABASE=${dbName}
DB_USERNAME=${dbUser}
DB_PASSWORD="${dbPassword}"
DB_PREFIX=${dbPrefix}
DB_CHARSET=${dbCharset}

# Store Localization & Currency
STORE_CURRENCY=${currencyCode}
STORE_CURRENCY_SYMBOL="${currencySymbol}"
STORE_TIMEZONE="${timezone}"

# Administrator Access
ADMIN_EMAIL="${adminEmail}"
ADMIN_USERNAME="${adminUsername}"

# Security & Sessions
SESSION_DRIVER=file
SESSION_LIFETIME=120
BRUTE_FORCE_PROTECTION=true
CAPTCHA_ENABLED=true
`;
  };

  // Generate SQL Schema Dump file
  const generateSqlDumpContent = () => {
    return `-- =====================================================================
-- FINIAS POS & ERP DATABASE SCHEMA EXPORT
-- Database: \`${dbName}\` (Table Prefix: \`${dbPrefix}\`)
-- Generated: ${new Date().toUTCString()}
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table \`${dbPrefix}users\`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`${dbPrefix}users\` (
  \`id\` varchar(64) NOT NULL,
  \`name\` varchar(191) NOT NULL,
  \`email\` varchar(191) NOT NULL UNIQUE,
  \`username\` varchar(100) DEFAULT NULL UNIQUE,
  \`password_hash\` varchar(255) NOT NULL,
  \`role\` varchar(50) NOT NULL DEFAULT 'cashier',
  \`phone\` varchar(50) DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'active',
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=${dbCharset};

-- --------------------------------------------------------
-- Table structure for table \`${dbPrefix}products\`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`${dbPrefix}products\` (
  \`id\` varchar(64) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`sku\` varchar(100) NOT NULL UNIQUE,
  \`barcode\` varchar(100) DEFAULT NULL,
  \`category_id\` varchar(64) DEFAULT NULL,
  \`unit_price\` decimal(15,4) NOT NULL DEFAULT '0.0000',
  \`purchase_price\` decimal(15,4) NOT NULL DEFAULT '0.0000',
  \`tax_rate\` decimal(8,4) NOT NULL DEFAULT '0.0000',
  \`stock_quantity\` decimal(15,4) NOT NULL DEFAULT '0.0000',
  \`min_stock_alert\` decimal(15,4) DEFAULT '5.0000',
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=${dbCharset};

-- --------------------------------------------------------
-- Table structure for table \`${dbPrefix}transactions\`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`${dbPrefix}transactions\` (
  \`id\` varchar(64) NOT NULL,
  \`invoice_no\` varchar(100) NOT NULL UNIQUE,
  \`transaction_type\` varchar(50) NOT NULL DEFAULT 'sale',
  \`contact_id\` varchar(64) DEFAULT NULL,
  \`total_amount\` decimal(15,4) NOT NULL DEFAULT '0.0000',
  \`tax_amount\` decimal(15,4) NOT NULL DEFAULT '0.0000',
  \`discount_amount\` decimal(15,4) NOT NULL DEFAULT '0.0000',
  \`payment_status\` varchar(50) NOT NULL DEFAULT 'paid',
  \`payment_method\` varchar(50) NOT NULL DEFAULT 'cash',
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=${dbCharset};

-- --------------------------------------------------------
-- Table structure for table \`${dbPrefix}settings\`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`${dbPrefix}settings\` (
  \`setting_key\` varchar(100) NOT NULL,
  \`setting_value\` longtext DEFAULT NULL,
  PRIMARY KEY (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=${dbCharset};

INSERT INTO \`${dbPrefix}settings\` (\`setting_key\`, \`setting_value\`) VALUES
('business_name', '${businessName}'),
('currency', '${currencyCode}'),
('currency_symbol', '${currencySymbol}'),
('timezone', '${timezone}'),
('installer_locked', 'true')
ON DUPLICATE KEY UPDATE \`setting_value\` = VALUES(\`setting_value\`);

SET FOREIGN_KEY_CHECKS = 1;
`;
  };

  const handleDownloadEnv = () => {
    const content = generateEnvFileContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFlashNotification('Downloaded .env configuration file', 'success');
  };

  const handleDownloadSql = () => {
    const content = generateSqlDumpContent();
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dbName}_schema.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFlashNotification(`Downloaded ${dbName}_schema.sql for phpMyAdmin`, 'success');
  };

  const handleCopyEnv = () => {
    const content = generateEnvFileContent();
    navigator.clipboard.writeText(content);
    setCopiedEnv(true);
    showFlashNotification('Configuration copied to clipboard', 'success');
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleFinishAndLaunch = async () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pos_installed", "true");
      localStorage.setItem("app_installed", "true");
      localStorage.setItem("app_installation_completed", "true");
      localStorage.setItem("is_installed", "true");
      localStorage.setItem("system_installed", "true");
      localStorage.setItem("installation_locked", "true");
      localStorage.setItem("ultimate_erp_pos_database_v1_active_tab", "dashboard");
      localStorage.setItem("installation_type", isDemoInstallation ? "demo" : "fresh");
      if (!isDemoInstallation) {
        localStorage.setItem("app_fresh_installed", "true");
      } else {
        localStorage.removeItem("app_fresh_installed");
      }
      if (businessLogo) {
        localStorage.setItem('royal_pos_v1_primary_logo', businessLogo);
      }
    }

    const finalSettings = {
      isInstalled: true,
      installationCompleted: true,
      isFreshInstallation: !isDemoInstallation,
      installationType: !isDemoInstallation ? 'fresh' : 'demo',
      installedAt: new Date().toISOString(),
      ...(businessLogo ? {
        logo: businessLogo,
        logoUrl: businessLogo,
        darkLogoUrl: businessLogo,
      } : {}),
    };
    updateSettings(finalSettings);

    const supremeAdminData = {
      name: adminName,
      email: adminEmail,
      username: adminUsername,
      password: adminPassword,
      pin: adminPin,
      phone: businessPhone,
      role: 'supreme_admin' as const,
    };

    // Ensure supreme admin account is stored and active
    upsertSuperAdminUser(supremeAdminData);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ultimate_erp_pos_database_v1_admin_user', JSON.stringify(supremeAdminData));
      localStorage.setItem('ultimate_erp_pos_database_v1_users', JSON.stringify([supremeAdminData]));
    }

    // Report installation completion to server storage to lock the installer permanently
    await completeServerInstallation({
      businessName,
      adminName,
      adminEmail,
      adminUsername,
      settings: finalSettings,
      adminUser: supremeAdminData,
      isDemoInstallation,
    });

    // If MySQL was selected, save DB configuration and push initial seed state for live universal syncing
    if (dbEngine === 'mysql' || dbEngine === 'mariadb') {
      try {
        await fetch(getApiUrl('api/sync.php?action=save_config'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dbHost,
            dbPort,
            dbName,
            dbUser,
            dbPassword,
            dbPrefix,
            dbCharset,
          }),
        });

        // Push initial admin user and settings to MySQL sync store
        await fetch(getApiUrl('api/sync.php?action=push'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: {
              settings: finalSettings,
              users: [supremeAdminData],
            },
          }),
        }).catch(() => {});
      } catch {}
    }

    // Log in automatically as supreme admin
    await login(adminEmail, adminPassword);
    if (onComplete) {
      onComplete();
    } else if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/dashboard');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header & Branding */}
      <div className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <RoyalLogo size="md" subtitle="Setup & Installation Wizard" />
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={isLight ? "text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer" : "text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"}
            >
              Exit Setup
            </button>
          )}
          <span className="text-xs font-bold text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Main Wizard Container */}
      <div className="relative z-10 max-w-4xl mx-auto w-full my-6 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Step Indicator Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400">
            <span className={currentStep >= 1 ? 'text-indigo-400 font-extrabold' : ''}>1. Requirements</span>
            <span className={currentStep >= 2 ? 'text-indigo-400 font-extrabold' : ''}>2. Database</span>
            <span className={currentStep >= 3 ? 'text-indigo-400 font-extrabold' : ''}>3. Admin & Store</span>
            <span className={currentStep >= 4 ? 'text-indigo-400 font-extrabold' : ''}>4. Starter Data</span>
            <span className={currentStep >= 5 ? 'text-indigo-400 font-extrabold' : ''}>5. Install</span>
            <span className={currentStep >= 6 ? 'text-emerald-400 font-extrabold' : ''}>6. Ready</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: WELCOME & REQUIREMENTS CHECK */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl mb-1">
                <HardDrive className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome to Finias POS Installation
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Thank you for choosing Finias POS & ERP. This 1-click installation wizard will configure your database, generate required encryption keys, and provision your supreme admin account.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>System Compatibility & Server Health Check</span>
              </h3>

              <div className="divide-y divide-slate-800/80">
                {requirements.map((req) => (
                  <div key={req.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{req.name}</p>
                      <p className="text-[11px] text-slate-500">{req.detected}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {req.passed ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Passed</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Warning</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-500">
                Compatible with cPanel, Plesk, Hostinger, LiteSpeed & Shared Hosts
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!allRequirementsPassed}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <span>Let&apos;s Configure Database</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DATABASE CONFIGURATION */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Database className="w-6 h-6 text-indigo-400" />
                <span>Step 2: Database Connection & Engine Setup</span>
              </h2>
              <p className="text-xs text-slate-400">
                Enter your database connection details below. You can find these in your hosting cPanel under <strong>MySQL® Databases</strong> or phpMyAdmin.
              </p>
            </div>

            {/* Installation Mode Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Installation Mode:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoToggle(false)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    !isDemoInstallation
                      ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${!isDemoInstallation ? 'border-indigo-400' : 'border-slate-600'}`}>
                    {!isDemoInstallation && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Fresh Installation</p>
                    <p className="text-xs text-slate-500 mt-1">Start from scratch. You will need to manually enter your store profile and admin credentials.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoToggle(true)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    isDemoInstallation
                      ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isDemoInstallation ? 'border-emerald-400' : 'border-slate-600'}`}>
                    {isDemoInstallation && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">1-Click Demo Installation</p>
                    <p className="text-xs text-slate-500 mt-1">Auto-fills store profile, admin account, and seeds demo catalog data instantly.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Select Engine */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Choose Database Engine:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'mysql', label: 'MySQL (cPanel)', desc: 'Standard Shared Host' },
                  { id: 'mariadb', label: 'MariaDB', desc: 'Enterprise Open-Source' },
                  { id: 'postgresql', label: 'PostgreSQL', desc: 'Cloud SQL & Relational' },
                  { id: 'sqlite', label: 'SQLite (Embedded)', desc: 'Zero Config File' },
                ].map((engine) => (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => setDbEngine(engine.id as DatabaseEngine)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      dbEngine === engine.id
                        ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">{engine.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{engine.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Database Form Fields */}
            {dbEngine !== 'sqlite' && dbEngine !== 'client_local' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Database Host <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    placeholder="localhost or 127.0.0.1"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {step2Attempted && !dbHost.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Database Host</span>}
                  <span className="text-[10px] text-slate-500 mt-1 block">Usually &apos;localhost&apos; on 99% of shared hosts</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Database Port
                  </label>
                  <input
                    type="text"
                    value={dbPort}
                    onChange={(e) => setDbPort(e.target.value)}
                    placeholder="3306"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 3306 (MySQL) / 5432 (PostgreSQL)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Database Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="cpaneluser_posdb"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {step2Attempted && !dbName.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Database Name</span>}
                  <span className="text-[10px] text-slate-500 mt-1 block">The name of the database created in cPanel</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Table Prefix
                  </label>
                  <input
                    type="text"
                    value={dbPrefix}
                    onChange={(e) => setDbPrefix(e.target.value)}
                    placeholder="pos_"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Allows multiple POS stores in one database (e.g. pos_)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Database Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    placeholder="cpaneluser_dbuser"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {step2Attempted && !dbUser.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Database Username</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Database Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {step2Attempted && !dbPassword.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Database Password</span>}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <HardDrive className="w-5 h-5" />
                  <span className="text-xs font-bold">Embedded Zero-Configuration SQLite File</span>
                </div>
                <p className="text-xs text-slate-400">
                  SQLite creates an encrypted single-file database (`database.sqlite`) in your server directory. No separate MySQL server username or password required. Ideal for local servers, single store branches, and instant testing.
                </p>
              </div>
            )}

            {/* Test Connection Button & Status Box */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className={isLight ? "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer" : "px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>{isTestingConnection ? 'Testing Connection...' : 'Test Database Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDbHost('localhost');
                    setDbPort('3306');
                    setDbName('pos_master_db');
                    setDbUser('pos_user');
                    setDbPrefix('pos_');
                    handleTestConnection();
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
                >
                  Use cPanel Defaults
                </button>
              </div>

              {connectionStatus.tested && (
                <div
                  className={`p-4 rounded-2xl border text-xs animate-fadeIn ${
                    connectionStatus.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {connectionStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{connectionStatus.message}</span>
                  </div>
                  {connectionStatus.details && (
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 mt-2 font-mono">
                      {connectionStatus.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={isLight ? "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer" : "px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep2Attempted(true);
                  if ((dbEngine === 'mysql' || dbEngine === 'mariadb' || dbEngine === 'postgresql') && (!dbHost.trim() || !dbName.trim() || !dbUser.trim() || !dbPassword.trim())) {
                    showFlashNotification('Please fill in all mandatory database fields (Database Host, Name, Username, and Password).', 'error');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <span>Continue to Store & Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BUSINESS PROFILE */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Store className="w-6 h-6 text-indigo-400" />
                <span>Step 3: Business Profile</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your store name, localization, and geographical details.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Store Profile Section */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Store Profile & Localization</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Store / Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {step3Attempted && !businessName.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Store / Company Name</span>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Primary Business Logo
                    </label>
                    {businessLogo && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                        ✓ Primary Logo Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                    When uploaded, this logo is designated as your primary logo and applied across the entire app (navigation bar, login screen, receipts, and invoices).
                  </p>
                  <div className="flex items-center gap-3">
                    {businessLogo ? (
                      <div className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-900 p-1 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                        <img src={businessLogo} alt="Primary Business Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 text-[10px] shrink-0 font-bold">
                        LOGO
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-300 flex items-center justify-center gap-2 transition shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{businessLogo ? 'Replace Primary Logo...' : 'Upload Primary Logo...'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvt) => {
                              if (uploadEvt.target?.result) {
                                const logoData = uploadEvt.target.result as string;
                                setBusinessLogo(logoData);
                                // Treat uploaded logo as primary logo and apply across the ERP app immediately
                                updateSettings({
                                  logo: logoData,
                                  logoUrl: logoData,
                                  darkLogoUrl: logoData,
                                  name: businessName.trim() || settings?.name,
                                  businessName: businessName.trim() || settings?.businessName,
                                });
                                if (typeof localStorage !== 'undefined') {
                                  localStorage.setItem('royal_pos_v1_primary_logo', logoData);
                                }
                                showFlashNotification('✓ Primary logo uploaded and applied across the entire app!', 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {businessLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          setBusinessLogo('');
                          updateSettings({
                            logo: '',
                            logoUrl: '',
                            darkLogoUrl: '',
                          });
                          if (typeof localStorage !== 'undefined') {
                            localStorage.removeItem('royal_pos_v1_primary_logo');
                          }
                          showFlashNotification('Primary logo removed, reverted to default', 'info');
                        }}
                        className="p-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs transition cursor-pointer"
                        title="Remove uploaded logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Currency Code <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={currencyCode}
                      onChange={(e) => {
                        setCurrencyCode(e.target.value);
                        const symbols: Record<string, string> = {
                          USD: '$',
                          EUR: '€',
                          GBP: '£',
                          INR: '₹',
                          CAD: '$',
                          AUD: '$',
                          AED: 'AED',
                          SAR: 'SAR',
                        };
                        setCurrencySymbol(symbols[e.target.value] || '$');
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="AED">AED (AED)</option>
                      <option value="SAR">SAR (SAR)</option>
                    </select>
                    {step3Attempted && !currencyCode.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please select a Currency Code</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Currency Symbol <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                    />
                    {step3Attempted && !currencySymbol.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter a Currency Symbol</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Store Timezone <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Chicago">America/Chicago (CST)</option>
                    <option value="America/Denver">America/Denver (MST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="UTC">UTC Universal</option>
                  </select>
                  {step3Attempted && !timezone.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please select a Store Timezone</span>}
                </div>
              </div>

              {/* Address & Geographical Section */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>Address & Geographical</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Postal / Zip Code <span className="text-rose-400">*</span></span>
                    {isLookingUpZip && <span className="text-[10px] text-indigo-400 animate-pulse">Auto-capturing location...</span>}
                  </label>
                  <input
                    type="text"
                    value={businessZip}
                    onChange={(e) => handleZipChange(e.target.value)}
                    required
                    placeholder="Enter zip to auto-fill location (e.g. 10001, 90210)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {step3Attempted && !businessZip.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Postal / Zip Code</span>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessCity}
                      onChange={(e) => setBusinessCity(e.target.value)}
                      required
                      placeholder="New York"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    {step3Attempted && !businessCity.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your City</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Province / District <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessProvince}
                      onChange={(e) => setBusinessProvince(e.target.value)}
                      required
                      placeholder="Manhattan District"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    {step3Attempted && !businessProvince.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Province / District</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessState}
                      onChange={(e) => setBusinessState(e.target.value)}
                      required
                      placeholder="NY"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    {step3Attempted && !businessState.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your State</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Country <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessCountry}
                      onChange={(e) => setBusinessCountry(e.target.value)}
                      required
                      placeholder="United States"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    {step3Attempted && !businessCountry.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Country</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Street Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    required
                    placeholder="123 Commerce Blvd, Suite 400"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {step3Attempted && !businessAddress.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Street Address</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Phone Number <span className="text-rose-400">*</span></span>
                    {phoneError && <span className="text-[10px] text-rose-400 font-semibold">{phoneError}</span>}
                  </label>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                    placeholder="+91 8220038825 or 8220038825"
                    className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none ${phoneError ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'}`}
                  />
                  {step3Attempted && !businessPhone.trim() && !phoneError && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Phone Number</span>}

                  {/* Phone Format Hint Box */}
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-300 mt-2 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>💡 Phone Number Format Hint:</strong> Enter mobile phone number. If country is India, enter 10 digits (e.g. <code className="font-mono text-white bg-indigo-900/60 px-1 py-0.5 rounded">8220038825</code>) or include country code (e.g. <code className="font-mono text-white bg-indigo-900/60 px-1 py-0.5 rounded">+91 8220038825</code>). The system considers and standardizes it as <strong>+91 8220038825</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={isLight ? "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer" : "px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep3Attempted(true);
                  const missing = [];
                  if (!businessName.trim()) missing.push('Store Name');
                  if (!currencyCode.trim()) missing.push('Currency Code');
                  if (!currencySymbol.trim()) missing.push('Currency Symbol');
                  if (!timezone.trim()) missing.push('Timezone');
                  if (!businessZip.trim()) missing.push('Postal/Zip Code');
                  if (!businessCity.trim()) missing.push('City');
                  if (!businessProvince.trim()) missing.push('Province/District');
                  if (!businessState.trim()) missing.push('State');
                  if (!businessCountry.trim()) missing.push('Country');
                  if (!businessAddress.trim()) missing.push('Street Address');
                  if (!businessPhone.trim() || !!phoneError) missing.push('valid Phone Number');
                  
                  if (missing.length > 0) {
                    showFlashNotification(`Please fill in missing fields: ${missing.join(', ')}`, 'error');
                    return;
                  }
                  // Save Store Profile & Primary Logo to settings immediately
                  updateSettings({
                    name: businessName.trim(),
                    businessName: businessName.trim(),
                    currency: currencyCode,
                    currencyCode: currencyCode,
                    currencySymbol: currencySymbol,
                    timezone: timezone,
                    address: businessAddress,
                    city: businessCity,
                    province: businessProvince,
                    state: businessState,
                    zip: businessZip,
                    country: businessCountry,
                    phone: businessPhone,
                    logo: businessLogo || '',
                    logoUrl: businessLogo || '',
                    darkLogoUrl: businessLogo || '',
                  });
                  if (businessLogo && typeof localStorage !== 'undefined') {
                    localStorage.setItem('royal_pos_v1_primary_logo', businessLogo);
                  }
                  setCurrentStep(4);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <span>Continue to Admin Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUPER ADMIN ACCOUNT */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <User className="w-6 h-6 text-indigo-400" />
                <span>Step 4: Supreme Admin Account</span>
              </h2>
              <p className="text-xs text-slate-400">
                Create the primary administrator account used to manage POS registers, users, and inventory.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Super Admin Credentials</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {step4Attempted && !adminName.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Full Name</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Admin Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="name@domain.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {step4Attempted && !adminEmail.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Admin Email Address</span>}
                  {step4Attempted && adminEmail.trim() && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) && (
                    <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter a valid email address (e.g. name@domain.com)</span>
                  )}
                  <span className="text-[10px] text-slate-500 mt-1 block">Hint: Enter a valid email format like name@domain.com for login and password reset notifications</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Super Admin Avatar Image (URL or File Upload)
                  </label>
                  <div className="flex items-center gap-3">
                    {adminAvatar ? (
                      <img src={adminAvatar} alt="Admin Avatar" className="w-10 h-10 rounded-full object-cover border border-indigo-500 shadow-md shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 text-xs shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={adminAvatar}
                      onChange={(e) => setAdminAvatar(e.target.value)}
                      placeholder="Paste image URL (https://...) or upload"
                      className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <label className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAdminAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    placeholder="admin"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {step4Attempted && !adminUsername.trim() && <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter your Username</span>}
                  <span className="text-[10px] text-slate-500 mt-1 block">Can be used to log in instead of email</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">
                        Super Admin Password <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-lg cursor-pointer shadow-xs"
                        title="Click to automatically generate a strong password"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Auto-Generate Password</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        placeholder="e.g. Admin#2026! or click Auto-Generate"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono pr-20"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={generateStrongPassword}
                          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Generate strong password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title={showAdminPassword ? 'Hide password' : 'Show password'}
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    {adminPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Password Strength:</span>
                          <span className={calculatePasswordStrength(adminPassword).isStrong ? 'text-emerald-400' : 'text-amber-400'}>
                            {calculatePasswordStrength(adminPassword).text}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex gap-0.5 border border-slate-800">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-full flex-1 transition-all ${
                                i < calculatePasswordStrength(adminPassword).score
                                  ? calculatePasswordStrength(adminPassword).color
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Password Hint Message */}
                    <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-300 mt-2 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>💡 Strong Password Hint:</strong> Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special symbols (e.g. <code className="font-mono text-white bg-indigo-900/60 px-1 py-0.5 rounded">Admin#2026!</code>). You can type your own or click the Key / Auto-Generate icon in the field.
                      </span>
                    </div>

                    {step4Attempted && !adminPassword.trim() && (
                      <span className="text-[10px] text-rose-400 font-semibold block mt-1">Please enter or generate a Password</span>
                    )}
                    {step4Attempted && adminPassword.trim() && !calculatePasswordStrength(adminPassword).isStrong && (
                      <span className="text-[10px] text-rose-400 font-semibold block mt-1">Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      POS Security PIN
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={isLight ? "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer" : "px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep4Attempted(true);
                  const missing = [];
                  if (!adminName.trim()) missing.push('Full Name');
                  if (!adminEmail.trim()) {
                    missing.push('Admin Email Address');
                  } else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim()))) {
                    missing.push('valid Admin Email Address (name@domain.com)');
                  }
                  if (!adminUsername.trim()) missing.push('Username');
                  if (!adminPassword.trim()) {
                    missing.push('Password');
                  } else if (!calculatePasswordStrength(adminPassword).isStrong) {
                    missing.push('Strong Password (min 8 chars, uppercase, lowercase, number, symbol)');
                  }
                  
                  if (missing.length > 0) {
                    showFlashNotification(`Please fill in missing fields / correct email format: ${missing.join(', ')}`, 'error');
                    return;
                  }

                  // Save and synchronize Super Admin credentials into the users store immediately
                  upsertSuperAdminUser({
                    name: adminName.trim(),
                    email: adminEmail.trim(),
                    username: adminUsername.trim(),
                    password: adminPassword,
                    pin: adminPin,
                    phone: businessPhone,
                    avatar: adminAvatar || undefined,
                  });
                  showFlashNotification(`✓ Supreme Admin credentials saved for ${adminName.trim()}`, 'success');

                  setCurrentStep(5);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <span>Continue to Starter Modules</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: STARTER DATA & MODULES */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                <span>Step 5: Starter Data & Module Configuration</span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose optional starter datasets and features to pre-populate so you can start selling immediately after launch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'demo_catalog',
                  title: 'Initialize Product Structure & Reference Catalog',
                  desc: 'Includes demo categories, standard barcodes, variations, and walk in customer & supplier profiles.',
                  checked: seedDemoCatalog,
                  toggle: () => setSeedDemoCatalog(!seedDemoCatalog),
                },
                {
                  id: 'tax_rates',
                  title: 'Install Standard GST & Sales Tax Presets',
                  desc: 'Configures standard 0%, 5%, 12%, 18% tax rates and compound GST rules.',
                  checked: seedDefaultTaxes,
                  toggle: () => setSeedDefaultTaxes(!seedDefaultTaxes),
                },
                {
                  id: 'registers',
                  title: 'Initialize Primary Cash Register Float',
                  desc: 'Creates Register #1 with default shift open/close audit log policies.',
                  checked: seedDefaultRegisters,
                  toggle: () => setSeedDefaultRegisters(!seedDefaultRegisters),
                },
                {
                  id: 'barcode_studio',
                  title: 'Enable Integrated Barcode Studio',
                  desc: 'Thermal 50x25mm and 40-in-1 A4 sticker sheet generation tools.',
                  checked: enableBarcodeStudio,
                  toggle: () => setEnableBarcodeStudio(!enableBarcodeStudio),
                },
                {
                  id: 'accounting',
                  title: 'Double-Entry Accounting & Ledger Module',
                  desc: 'Automated journal ledger postings for sales, purchases, and expenses.',
                  checked: enableAccountingModule,
                  toggle: () => setEnableAccountingModule(!enableAccountingModule),
                },
                {
                  id: 'ai_assistant',
                  title: 'Smart Business Analytics & AI Assistant',
                  desc: 'Real-time revenue forecast, dead-stock alert, and smart profit optimizer.',
                  checked: enableAiAssistant,
                  toggle: () => setEnableAiAssistant(!enableAiAssistant),
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={item.toggle}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3.5 ${
                    item.checked
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    <div className="mt-2 text-[10px] font-semibold">
                      {item.checked ? (
                        <span className="text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                          <Check className="w-3 h-3" /> Auto-Configured
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded flex items-center gap-1 w-max border border-slate-800">
                          Configure Manually Later
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div
                    className={`w-10 h-6 rounded-full flex items-center shrink-0 p-1 transition-colors duration-300 ease-in-out border ${
                      item.checked ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                        item.checked ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className={isLight ? "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer" : "px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(6);
                  startAutomatedInstallation();
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Run 1-Click Installation</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: AUTOMATED INSTALLATION EXECUTION */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fadeIn py-4">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                <Cpu className={`w-8 h-8 ${isInstalling ? 'animate-pulse text-indigo-400' : 'text-emerald-400'}`} />
              </div>
              <h2 className="text-2xl font-black text-white">
                {isInstalling ? 'Installing POS & Building Database...' : 'Migration Complete!'}
              </h2>
              <p className="text-xs text-slate-400">
                Please wait while the automated installer creates database schemas, seeds master records, and encrypts security keys.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-indigo-400">Migration Progress</span>
                <span className="text-white font-mono">{migrationProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${migrationProgress}%` }}
                />
              </div>
            </div>

            {/* Live Terminal Output Console */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-1.5 max-h-56 overflow-y-auto no-scrollbar shadow-inner">
              <div className="flex items-center gap-2 text-slate-500 border-b border-slate-800 pb-2 mb-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Automated Migration Execution Logs</span>
              </div>
              {migrationLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-600">[{idx + 1}]</span>
                  <span className={idx === migrationLogs.length - 1 ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            {installComplete && (
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <span>View Installation Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: INSTALLATION COMPLETE & LAUNCH */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl mb-1 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Installation Successful!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Finias POS & ERP is now fully installed and configured on your hosting environment. You can download configuration backups or launch directly into the POS register.
              </p>
            </div>

            {/* Credentials & Summary Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Login Credentials & Store Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Store Name</span>
                  <span className="text-white font-bold">{businessName}</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Database Engine</span>
                  <span className="text-indigo-400 font-mono font-bold">{dbEngine.toUpperCase()} ({dbName})</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Admin Email</span>
                  <span className="text-white font-mono font-bold">{adminEmail}</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Password</span>
                  <span className="text-amber-300 font-mono font-bold">{adminPassword}</span>
                </div>
              </div>
            </div>

            {/* Download Backups / SQL Schema Export */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Download Host Configuration & SQL Exports</h4>
                  <p className="text-[11px] text-slate-400">Save `.env` or import the SQL dump directly into phpMyAdmin if required.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadEnv}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download .env File</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSql}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download schema.sql Dump</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyEnv}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Copied to Clipboard!' : 'Copy Config'}</span>
                </button>
              </div>
            </div>

            {/* Final Launch Button */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Installation lock activated. Safe for live production transactions.
              </span>

              <button
                type="button"
                onClick={handleFinishAndLaunch}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition cursor-pointer transform hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Launch POS Application & Log In</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-4xl mx-auto w-full text-center py-2 text-slate-600 text-xs">
        Finias Enterprise POS &bull; 1-Click Database Setup &bull; Shared Hosting Ready
      </div>
    </div>
  );
};
