import { DocModule } from './types';

export const securityDoc: DocModule = {
  id: 'security',
  title: '11. POS & System Security Shield',
  category: 'Cybersecurity & Internal Fraud Prevention',
  iconName: 'ShieldAlert',
  overview:
    'Enterprise cybersecurity, internal fraud mitigation, cashier shift PIN authorization, supervisor price overrides, automatic brute-force lockout defenses, and immutable system audit trail logging.',
  workflowSteps: [
    {
      step: 1,
      title: 'Configure POS Counter PIN Protection',
      description:
        'Require cashiers to enter a 4-digit PIN to unlock registers, open physical cash drawers, or access supervisor settings.',
    },
    {
      step: 2,
      title: 'Enforce Supervisor Authorization Overrides',
      description:
        'Require managerial PIN authorization whenever a cashier attempts to apply a discount exceeding 10%, void a scanned item, or edit selling prices.',
    },
    {
      step: 3,
      title: 'Monitor Automated Brute-Force Lockouts',
      description:
        'The security engine monitors failed password attempts; 5 consecutive bad attempts trigger an instant 15-minute IP/account lockout.',
    },
    {
      step: 4,
      title: 'Inspect Immutable Security Audit Logs',
      description:
        'Audit user activities: logins, price changes, invoice deletions, role modifications, and cash drawer kickouts with exact timestamps and IP addresses.',
    },
  ],
  submenus: [
    {
      id: 'pos_security',
      title: 'POS Security & Supervisor Shift PIN',
      menuPath: 'Security > POS Security & Shift PIN',
      whyItIsUsed:
        'Prevents counter theft, unauthorized discounts, and cash drawer tampering by requiring 4-digit numeric PINs for shift start, register access, manual price reductions, and drawer kickouts.',
      howToUse: [
        '1. Go to Security > POS Security & Shift PIN.',
        '2. Toggle "Require PIN on POS Lock" to prevent walk-up access when cashier steps away.',
        '3. Toggle "Supervisor Approval for Line Item Deletion" and "Supervisor Approval for Price Override".',
        '4. Set Master Supervisor Authorization PIN.',
        '5. Assign personal 4-digit PINs to individual cashiers.',
        '6. Click "Save Security Policy".',
      ],
      whereToEnterDate:
        'POS Security policy updates are timestamped in the security logs under "Policy Update Timestamp [YYYY-MM-DD HH:MM:SS]".',
      description:
        'Counter terminal security policies requiring numeric PINs for price overrides, discounts, and drawer opening.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - POS Terminal Security & PIN Controls',
        urlPath: 'https://pos.royal-erp.internal/#/security/pos-pin',
        dateBadgeText: '🔒 Counter Protection: High Security Mode Active',
        primaryActionText: 'Save Security Policy',
        formSections: [
          {
            title: '1. Cashier Shift PIN & Screen Lock',
            fields: [
              { label: 'Require 4-Digit PIN to Unlock Register', placeholder: 'Checked: ENABLED', pinNumber: 1 },
              { label: 'Auto-Lock Screen After Inactivity', placeholder: 'Select: 3 Minutes' },
            ],
          },
          {
            title: '2. Supervisor Overrides & Discount Guards',
            fields: [
              { label: 'Require Manager PIN for Selling Price Override', placeholder: 'Checked: YES', pinNumber: 2 },
              { label: 'Require Manager PIN for Discount > 10%', placeholder: 'Checked: YES' },
              { label: 'Require Manager PIN to Void Scanned Line Item', placeholder: 'Checked: YES' },
              { label: 'Master Supervisor Override PIN', placeholder: '•••• (Masked)', isRequired: true, pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Register PIN Lock Toggle',
          fieldOrSection: 'Section 1: Shift Lock',
          instruction: 'Enable to require cashier PIN on register wake.',
        },
        {
          pinNumber: 2,
          label: 'Price Override Manager Protection',
          fieldOrSection: 'Section 2: Fraud Prevention',
          instruction: 'Prevents counter staff from discounting items without authorization.',
        },
        {
          pinNumber: 3,
          label: 'Master Supervisor PIN Field',
          fieldOrSection: 'Section 2: Master PIN',
          instruction: 'Secret 4-digit code known only to store managers.',
        },
      ],
      fields: [
        {
          name: 'Supervisor PIN',
          type: 'Numeric Code (4 to 6 Digits)',
          required: true,
          purpose: 'Authorizes managerial overrides at checkout.',
          functionality: 'Verified on cashier screen before sensitive actions execute.',
          validationRules: '4 to 6 digits.',
        },
      ],
    },
    {
      id: 'system_security',
      title: 'System Security Shield & Audit Trail Logs',
      menuPath: 'Security > System Security Shield',
      whyItIsUsed:
        'Provides an immutable forensic audit log of all system activities, recording employee logins, IP addresses, failed brute-force attempts, database exports, price edits, and invoice cancellations.',
      howToUse: [
        '1. Go to Security > System Security Shield.',
        '2. Review real-time security events in the live feed.',
        '3. Filter logs by Event Type (Login, Logout, Failed Attempt, Price Change, Delete Record) or User.',
        '4. Specify Audit Date Range [YYYY-MM-DD].',
        '5. If an account is locked due to repeated bad logins, click "Unlock Account" to restore access.',
        '6. Export audit log CSV for external compliance reviews.',
      ],
      whereToEnterDate:
        'In the Security Audit Log, date filtering is managed via the "Audit Date Range" picker [YYYY-MM-DD] at the top-right. Every log row records its immutable "Event Timestamp" in YYYY-MM-DD HH:MM:SS format.',
      description:
        'Immutable forensic audit log tracking logins, brute-force defenses, IP addresses, and record modifications.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Security Shield & Audit Logs',
        urlPath: 'https://pos.royal-erp.internal/#/security/audit-trail',
        dateBadgeText: '🛡️ Audit Window: 2026-10-01 to 2026-10-04 | 0 Breaches Detected',
        primaryActionText: 'Export Audit Log CSV',
        mockColumns: ['Timestamp', 'Event Type', 'User Account', 'IP Address', 'Severity', 'Event Details', 'Actions'],
        mockRows: [
          { Timestamp: '2026-10-04 09:00:12', 'Event Type': 'User Login', 'User Account': 'alex_admin', 'IP Address': '192.168.1.104', Severity: 'Normal', 'Event Details': 'Successful login from Chrome / Windows', Actions: 'Details' },
          { Timestamp: '2026-10-04 10:15:30', 'Event Type': 'Price Override', 'User Account': 'mchen_pos', 'IP Address': '192.168.1.112', Severity: 'Warning', 'Event Details': 'Overrode price on SKU-001 with Supervisor PIN', Actions: 'Details' },
          { Timestamp: '2026-10-04 11:02:44', 'Event Type': 'Failed Password', 'User Account': 'unknown_user', 'IP Address': '203.0.113.42', Severity: 'Alert', 'Event Details': 'Failed login attempt; Brute-force defense flagged IP', Actions: 'Block IP' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Audit Date Range Selector',
          fieldOrSection: 'Top Date Filter',
          instruction: 'Select date window in YYYY-MM-DD format to review historical security events.',
          whereToEnterDate: 'Audit Date Range inputs: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 2,
          label: 'Event Type & Severity Filters',
          fieldOrSection: 'Toolbar Filter Buttons',
          instruction: 'Filter logs by Normal, Warning, or Security Alert events.',
        },
      ],
      fields: [
        {
          name: 'Audit Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets the interval for security event audits.',
          functionality: 'Queries immutable log entries within dates.',
          validationRules: 'Valid calendar dates.',
        },
      ],
    },
    {
      id: 'active_user_sessions',
      title: 'Active User Sessions & Connected Device Security',
      menuPath: 'Security > System Security Shield > Active User Sessions & Connected Devices',
      whyItIsUsed:
        'Enforces real-time access security and fraud mitigation by monitoring all authenticated devices (mobile, tablet, POS terminals, desktop PCs), tracking IP addresses and browser fingerprints, permitting one-click session revocation, and enforcing custom Inactivity Session Timeouts including rapid 2-minute and 5-minute lockdown policies.',
      howToUse: [
        '1. Navigate to Security > System Security Shield and click the "Active User Sessions & Devices" tab.',
        '2. Inspect all active user sessions across the enterprise, observing device type, browser, IP address, and login timestamps.',
        '3. Under "Session Security Parameters", configure "Inactivity Session Timeout".',
        '4. Select "2 Minutes (High Security)" or "5 Minutes (Fast Lockdown)" for high-risk POS terminals or back-office PCs.',
        '5. Optionally toggle "Enforce Single Active Session Per User" to prevent simultaneous logins from multiple devices.',
        '6. Click "Apply Policy" to propagate the timeout policy across all active connections.',
        '7. Click "Ping Heartbeat" to test real-time session liveness or "Revoke" next to any unrecognized device to terminate it immediately.',
      ],
      whereToEnterDate:
        'Each session display records immutable "Session Initiated [YYYY-MM-DD HH:MM:SS]" and "Last Active Heartbeat [YYYY-MM-DD HH:MM:SS]". Timeout duration is configured in minutes (e.g. 2 minutes or 5 minutes) via the Inactivity Session Timeout dropdown.',
      description:
        'Connected device management, real-time token tracking, remote logout, and inactivity timeout configuration (2 min, 5 min, 15 min, 30 min, 1h, 4h, 8h, 24h, Never).',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Active User Sessions & Connected Device Security',
        urlPath: 'https://pos.royal-erp.internal/#/security/active-sessions',
        dateBadgeText: '⏱️ Session Guard: 2-Minute High Security Timeout Active',
        primaryActionText: 'Apply Security Policy',
        formSections: [
          {
            title: '1. Inactivity Session Timeout Configuration',
            fields: [
              {
                label: 'Inactivity Session Timeout *',
                placeholder: '2 Minutes (High Security) | 5 Minutes (Fast Lockdown)',
                isRequired: true,
                pinNumber: 1,
              },
              {
                label: 'Enforce Single Active Session Per User',
                placeholder: 'Checked: YES (Revoke previous device on new login)',
                pinNumber: 2,
              },
            ],
          },
          {
            title: '2. Connected Devices & Live Session Tokens',
            fields: [
              {
                label: 'Desktop Terminal 01 (192.168.1.104)',
                placeholder: 'Status: Active | Heartbeat: 2026-10-04 14:22:10',
                pinNumber: 3,
              },
              {
                label: 'POS Register Terminal (Counter A)',
                placeholder: 'Status: Active | Timeout Policy: 2 Minutes',
                pinNumber: 4,
              },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Inactivity Session Timeout Dropdown',
          fieldOrSection: 'Session Security Parameters',
          instruction: 'Select 2 Minutes (High Security) or 5 Minutes (Fast Lockdown) for maximum protection against unattended terminal theft.',
          whereToEnterDate: 'Choose timeout interval: 2 min, 5 min, 15 min, 30 min, 1 hr, 4 hrs, 8 hrs, 24 hrs, or 0 (Never).',
        },
        {
          pinNumber: 2,
          label: 'Enforce Single Session Switch',
          fieldOrSection: 'Concurrent Session Control',
          instruction: 'Toggle ON to automatically disconnect any older sessions when an employee signs in from a new device.',
        },
        {
          pinNumber: 3,
          label: 'Ping Heartbeat & Device Live Status',
          fieldOrSection: 'Connected Devices List',
          instruction: 'Test WebSocket/heartbeat connection latency to verify device online status in real-time.',
        },
        {
          pinNumber: 4,
          label: 'Remote Terminate / Revoke Action',
          fieldOrSection: 'Device Session Action Column',
          instruction: 'Click to immediately destroy the auth token on the remote device and force an instant logout screen.',
        },
      ],
      fields: [
        {
          name: 'Inactivity Session Timeout',
          type: 'Select Dropdown (2 min, 5 min, 15 min, 30 min, 60 min, 240 min, 480 min, 1440 min, 0)',
          required: true,
          purpose: 'Sets the idle duration before the app automatically displays a 60-second warning and locks or logs out.',
          functionality: 'Timer resets on mouse moves, keystrokes, or touch events. 2 minutes and 5 minutes provide high-security counter lockdown.',
          validationRules: 'Must be one of the permitted integer values (2, 5, 15, 30, 60, 240, 480, 1440, 0).',
        },
        {
          name: 'Enforce Single Active Session Per User',
          type: 'Boolean Toggle (True / False)',
          required: false,
          purpose: 'Restricts simultaneous multi-device logins under the same staff credentials.',
          functionality: 'When true, a new login event revokes active session tokens for the user on all other computers and phones.',
          validationRules: 'Boolean true or false.',
        },
        {
          name: 'Device Type & IP Address',
          type: 'Read-only Device Metadata',
          required: true,
          purpose: 'Identifies the physical hardware (POS, Desktop, Mobile, Tablet) and network origin of the session.',
          functionality: 'Enables administrators to detect anomalous geographic locations or unauthorized home computers.',
          validationRules: 'Valid IPv4/IPv6 string and User-Agent parser string.',
        },
      ],
    },
  ],
  bestPractices: [
    'Change Master Supervisor PINs every 90 days to maintain counter integrity.',
    'Review the Security Audit log weekly to inspect repeated failed logins or unusual price overrides.',
    'Enable automatic screen locking on all counter terminals to prevent unauthorized walk-up transactions.',
  ],
  troubleshooting: [
    {
      issue: 'Cashier account is locked due to excessive failed passwords',
      solution:
        'An administrator can navigate to Security > System Security Shield or Users > Users List, locate the user profile, and click "Unlock Account".',
    },
  ],
};
