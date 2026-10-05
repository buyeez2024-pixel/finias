import { DocModule } from './types';

export const settingsDoc: DocModule = {
  id: 'settings',
  title: '14. Global Business & Operational Settings',
  category: 'System Governance & Customization',
  iconName: 'Settings',
  overview:
    'Central configuration engine governing company identity, statutory tax identifiers, product catalog validation, credit rules, sales defaults, POS keyboard hotkeys, document reference prefixes (INV-, PO-, SO-, ADJ-), customer loyalty points, hardware printer drivers, and custom data field extensions.',
  workflowSteps: [
    {
      step: 1,
      title: 'Configure Corporate Profile & Financial Year',
      description:
        'Input company legal trade name, tax registration number, financial year start month (e.g. April 1 or January 1), and base currency.',
    },
    {
      step: 2,
      title: 'Configure Catalog Rules & HSN Enforcement',
      description:
        'Set mandatory HSN/SAC code rules, auto-SKU generation prefix formats, and stock alert notifications.',
    },
    {
      step: 3,
      title: 'Define Document Reference Prefixes',
      description:
        'Establish sequential numbering patterns for Sales Invoices (INV-2026-), Purchase Orders (PO-), Quotations (QT-), and Adjustments (ADJ-).',
    },
    {
      step: 4,
      title: 'Configure POS Hotkeys & Hardware Drivers',
      description:
        'Map keyboard shortcut hotkeys (F4 for Pay, F2 for Search, Esc to Clear) and configure USB / Network thermal printers.',
    },
    {
      step: 5,
      title: 'Activate Customer Loyalty Reward Points',
      description:
        'Set reward accrual rates (e.g. 1 Point per $10 spent) and redemption conversion values for retail shoppers.',
    },
  ],
  submenus: [
    {
      id: 'business_settings_tab',
      title: 'Business Profile, Financial Year & Tax Identifiers',
      menuPath: 'Business Settings > Business Profile',
      whyItIsUsed:
        'Establishes legal company identity, corporate headquarters address, official tax numbers, financial year accounting start month, and default fiscal time zone applied across all invoices and reports.',
      howToUse: [
        '1. Go to Business Settings > Business Profile.',
        '2. Enter Business Name, Legal Trade Name, and Company Registration Number.',
        '3. Select Financial Year Start Month (e.g. April or January).',
        '4. Set Default Currency ($ USD) and Time Zone.',
        '5. Upload High-Resolution Company Logo.',
        '6. Click "Save Business Settings".',
      ],
      whereToEnterDate:
        'In Business Settings, configure the "Financial Year Start Date" by selecting the start month (e.g. April 1st). All income statements, tax reports, and balance sheets align with this fiscal year boundary.',
      description:
        'Master business entity profile configuring trade names, corporate logos, fiscal year start dates, and base currency.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Corporate Business Profile',
        urlPath: 'https://pos.royal-erp.internal/#/settings/business',
        dateBadgeText: '🏢 FY Scope: April 1 to March 31 | Base Currency: USD ($)',
        primaryActionText: 'Save Profile Changes',
        formSections: [
          {
            title: '1. Legal Entity & Registration',
            fields: [
              { label: 'Business Name *', placeholder: 'e.g. Royal Retail & Wholesale Enterprises Inc.', isRequired: true, pinNumber: 1 },
              { label: 'Statutory Tax Registration *', placeholder: 'e.g. GSTIN / VAT ID: 27AABCS1429B1Z', isRequired: true, pinNumber: 2 },
              { label: 'Financial Year Start Month *', placeholder: 'Select: April (Fiscal Cycle: Apr - Mar)', isRequired: true, pinNumber: 3 },
            ],
          },
          {
            title: '2. Default Currency & Localization',
            fields: [
              { label: 'Default Currency *', placeholder: 'USD ($) - United States Dollar', isRequired: true },
              { label: 'System Time Zone', placeholder: 'Select: (GMT-05:00) Eastern Time (US & Canada)' },
              { label: 'Date Display Format', placeholder: 'Select: YYYY-MM-DD (ISO 8601)', pinNumber: 4 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Business Name Field',
          fieldOrSection: 'Section 1: Company Title',
          instruction: 'Printed on all invoices, receipts, and statutory tax returns.',
        },
        {
          pinNumber: 2,
          label: 'Tax Registration (GSTIN / VAT)',
          fieldOrSection: 'Section 1: Tax Identity',
          instruction: 'Legal corporate tax identifier required for tax invoice legitimacy.',
        },
        {
          pinNumber: 3,
          label: 'Financial Year Start Month',
          fieldOrSection: 'Section 1: Accounting Cycle',
          instruction: 'Sets the baseline date for fiscal year profit and tax reporting.',
          whereToEnterDate: 'Financial Year Start Month dropdown: Dictates annual fiscal boundary.',
        },
        {
          pinNumber: 4,
          label: 'Date Display Format',
          fieldOrSection: 'Section 2: Localization',
          instruction: 'Configures date string formatting (YYYY-MM-DD) across all app views.',
        },
      ],
      fields: [
        {
          name: 'Business Name',
          type: 'Text',
          required: true,
          purpose: 'Official commercial corporate name.',
          functionality: 'Printed at the top of all commercial documents.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
    {
      id: 'product_settings_hsn',
      title: 'Product Settings & Global HSN Rules',
      menuPath: 'Business Settings > Product Settings',
      whyItIsUsed:
        'Enforces enterprise product catalog rules: mandatory HSN/SAC code validation, SKU prefix formats, negative stock selling permissions, and automated low stock alert thresholds.',
      howToUse: [
        '1. Go to Business Settings > Product Settings.',
        '2. Toggle "Enforce Mandatory HSN/SAC Code on Product Creation" (Enabled by default).',
        '3. Toggle "Allow Overselling / Negative Stock" (Disable to prevent selling stock you do not physically possess).',
        '4. Set Default Low Stock Safety Threshold (e.g. 10 Units).',
        '5. Configure SKU Code Auto-Generation Prefix (e.g. "SKU-").',
        '6. Click "Save Product Settings".',
      ],
      whereToEnterDate:
        'Product settings do not require dates. Changes to product governance rules are logged with timestamps in YYYY-MM-DD format.',
      description:
        'Catalog governance rules regulating mandatory HSN validation, negative stock controls, and auto-SKU prefixes.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Product Catalog Governance',
        urlPath: 'https://pos.royal-erp.internal/#/settings/products',
        dateBadgeText: '📦 Catalog Policy: Mandatory HSN & No Overselling Active',
        primaryActionText: 'Save Catalog Rules',
        formSections: [
          {
            title: '1. Statutory Tax & HSN Rules',
            fields: [
              { label: 'Enforce Mandatory HSN / SAC Code *', placeholder: 'Checked: YES (Strict Tax Compliance)', isRequired: true, pinNumber: 1 },
              { label: 'Allow Selling Out of Stock (Overselling)', placeholder: 'Unchecked: NO (Strict Inventory)', pinNumber: 2 },
            ],
          },
          {
            title: '2. Stock Alert Thresholds & SKU Generation',
            fields: [
              { label: 'Default Safety Alert Quantity', placeholder: '10 Units', pinNumber: 3 },
              { label: 'SKU Prefix Format', placeholder: 'e.g. SKU-', pinNumber: 4 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Mandatory HSN / SAC Toggle',
          fieldOrSection: 'Section 1: Tax Policy',
          instruction: 'Prevents product saving without a valid statutory tariff code.',
        },
        {
          pinNumber: 2,
          label: 'Overselling Protection Switch',
          fieldOrSection: 'Section 1: Inventory Control',
          instruction: 'Prevents cashiers from completing sales when available stock is zero.',
        },
      ],
      fields: [
        {
          name: 'Enforce HSN Code',
          type: 'Boolean Toggle (Yes / No)',
          required: true,
          purpose: 'Guarantees that all products have an HSN code for tax filing.',
          functionality: 'Validates on product form submission.',
          validationRules: 'Yes or No.',
        },
      ],
    },
    {
      id: 'contact_settings',
      title: 'Contact Settings & Credit Limit Governance',
      menuPath: 'Business Settings > Contact Settings',
      whyItIsUsed:
        'Regulates customer credit rules, default payment terms (Days), credit limit enforcement at checkout, and mandatory phone number requirements for CRM profiling.',
      howToUse: [
        '1. Go to Business Settings > Contact Settings.',
        '2. Toggle "Block POS Sale if Customer Exceeds Credit Limit".',
        '3. Set Default Credit Terms for Commercial Clients (e.g. 30 Days).',
        '4. Toggle "Require Mobile Number for New Customers".',
        '5. Click "Save Contact Rules".',
      ],
      whereToEnterDate:
        'Contact governance rules apply system-wide without date inputs.',
      description:
        'Commercial counterparty policies regulating accounts receivable credit ceilings and phone validation.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Contact & Credit Governance',
        urlPath: 'https://pos.royal-erp.internal/#/settings/contacts',
        dateBadgeText: '🛡️ Credit Risk Policy: Strict Ceilings Active',
        primaryActionText: 'Save Contact Policies',
        formSections: [
          {
            title: '1. Customer Credit Limits & Terms',
            fields: [
              { label: 'Block Sale if Balance Exceeds Credit Limit', placeholder: 'Checked: YES (Supervisor Override Required)', pinNumber: 1 },
              { label: 'Default Payment Terms', placeholder: 'Select: Net 30 Days', pinNumber: 2 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Block Sale on Credit Limit Exceeded',
          fieldOrSection: 'Section 1: Risk Management',
          instruction: 'Prevents unpaid debt accumulation without managerial sign-off.',
        },
      ],
      fields: [
        {
          name: 'Credit Limit Enforcement',
          type: 'Boolean Toggle',
          required: true,
          purpose: 'Restricts sales to customers with overdue balances.',
          functionality: 'Enforced at checkout finalization.',
          validationRules: 'Yes or No.',
        },
      ],
    },
    {
      id: 'sale_settings',
      title: 'Sales Settings & Default Pricing Schemes',
      menuPath: 'Business Settings > Sales Settings',
      whyItIsUsed:
        'Configures sales billing behavior: default customer group, commission calculation method, sales price rounding rules, and quotation validity defaults.',
      howToUse: [
        '1. Open Business Settings > Sales Settings.',
        '2. Set Default Price Scheme: "Retail Standard" or "Wholesale Tier".',
        '3. Select Sales Commission Basis: "Invoice Total" or "Gross Margin".',
        '4. Set Default Quotation Validity Period (e.g. 15 Days).',
        '5. Click "Save Sales Settings".',
      ],
      whereToEnterDate:
        'Sales rules apply to all invoices generated on or after the configuration update.',
      description:
        'Sales billing rules configuring commission calculation models and price rounding conventions.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Sales Billing Policies',
        urlPath: 'https://pos.royal-erp.internal/#/settings/sales',
        dateBadgeText: '📈 Billing Rules: Auto-Rounding & Commission Linked',
        primaryActionText: 'Save Sales Rules',
        formSections: [
          {
            title: '1. Commission & Quotation Validity',
            fields: [
              { label: 'Sales Commission Calculation Basis', placeholder: 'Select: Total Invoiced Sales Revenue', pinNumber: 1 },
              { label: 'Default Quotation Validity Duration', placeholder: '15 Days', pinNumber: 2 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Commission Basis Selector',
          fieldOrSection: 'Section 1: Commission Engine',
          instruction: 'Determines whether agent cuts are based on gross sales or net profit.',
        },
      ],
      fields: [
        {
          name: 'Commission Basis',
          type: 'Select (Revenue | Profit)',
          required: true,
          purpose: 'Basis for sales agent incentive calculations.',
          functionality: 'Used by the Sales Representative Report.',
          validationRules: 'Must select one option.',
        },
      ],
    },
    {
      id: 'pos_shortcuts_settings',
      title: 'POS Terminal Shortcuts & Keyboard Hotkeys',
      menuPath: 'Business Settings > POS Settings',
      whyItIsUsed:
        'Maps keyboard shortcut hotkeys for high-speed cashier checkout operations without mouse usage, customizing keys for Checkout (F4), Search (F2), Line Discount (F8), Hold Cart (F9), and Cash Register Drawer Kick (F12).',
      howToUse: [
        '1. Go to Business Settings > POS Settings.',
        '2. Review hotkey bindings.',
        '3. Customize keys: Set "Pay & Finalize" to F4, "Hold Order" to F9, "Focus Search" to F2.',
        '4. Toggle "Auto-Print Receipt Upon Checkout".',
        '5. Click "Save POS Settings".',
      ],
      whereToEnterDate:
        'POS shortcut settings do not require dates.',
      description:
        'Cashier terminal configuration customizing hotkeys, express checkout keys, and auto-print triggers.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - POS Terminal Hotkeys & Hardware',
        urlPath: 'https://pos.royal-erp.internal/#/settings/pos-shortcuts',
        dateBadgeText: '⚡ Cashier Hotkeys: Express Checkout Mappings Active',
        primaryActionText: 'Save Shortcut Mappings',
        formSections: [
          {
            title: '1. Keyboard Hotkey Mappings',
            fields: [
              { label: 'Pay & Finalize Invoice Hotkey *', placeholder: 'F4 (Standard POS Hotkey)', pinNumber: 1 },
              { label: 'Focus Product Search / Scan *', placeholder: 'F2', pinNumber: 2 },
              { label: 'Hold Current Order as Draft', placeholder: 'F9' },
              { label: 'Cancel / Clear Active Cart', placeholder: 'Escape (Esc)' },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Pay & Finalize Key Binding',
          fieldOrSection: 'Section 1: Express Pay',
          instruction: 'Key pressed by cashier to trigger the payment tender dialog.',
        },
      ],
      fields: [
        {
          name: 'Finalize Hotkey',
          type: 'Text (Key Name)',
          required: true,
          purpose: 'Keyboard key triggering checkout.',
          functionality: 'Listened to globally on POS screen.',
          validationRules: 'Standard key name (e.g. F4).',
        },
      ],
    },
    {
      id: 'purchases_settings',
      title: 'Purchase Settings & Receiving Rules',
      menuPath: 'Business Settings > Purchase Settings',
      whyItIsUsed:
        'Regulates inward procurement controls: automatic purchase order numbering, default receiving status, and landed cost freight allocation rules.',
      howToUse: [
        '1. Open Business Settings > Purchase Settings.',
        '2. Set Default Purchase Status: "Ordered" vs "Received".',
        '3. Toggle "Allow Editing Cost Prices on Purchase Order".',
        '4. Click "Save Purchase Rules".',
      ],
      whereToEnterDate:
        'Purchase settings apply system-wide without date entry.',
      description:
        'Inward procurement policies configuring default receiving statuses and landed cost rules.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Purchase Governance Settings',
        urlPath: 'https://pos.royal-erp.internal/#/settings/purchases',
        dateBadgeText: '📦 Procurement Rules: Auto-PO Numbering Active',
        primaryActionText: 'Save Purchase Settings',
        formSections: [
          {
            title: '1. Inward Stock & Cost Updating',
            fields: [
              { label: 'Default Purchase Status', placeholder: 'Select: Received (Auto-increment stock)', pinNumber: 1 },
              { label: 'Auto-Update Product Purchase Cost on PO', placeholder: 'Checked: YES' },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Default Purchase Status Selector',
          fieldOrSection: 'Section 1: Receiving',
          instruction: 'Select default state for new inward vendor purchase bills.',
        },
      ],
      fields: [
        {
          name: 'Default Purchase Status',
          type: 'Select (Received | Ordered)',
          required: true,
          purpose: 'Sets initial state of purchase orders.',
          functionality: 'Controls whether stock increments automatically.',
          validationRules: 'Must select Received or Ordered.',
        },
      ],
    },
    {
      id: 'payment_settings',
      title: 'Payment Settings & Register Balancing Rules',
      menuPath: 'Business Settings > Payment Settings',
      whyItIsUsed:
        'Configures cashier shift cash register balancing rules, maximum allowable drawer cash limits before requiring safe drop, and payment rounding rules.',
      howToUse: [
        '1. Go to Business Settings > Payment Settings.',
        '2. Set Maximum Drawer Cash Threshold (e.g. $1,000.00; triggers manager safe drop alert).',
        '3. Toggle "Require Opening Cash Float Entry on Shift Start".',
        '4. Click "Save Payment Settings".',
      ],
      whereToEnterDate:
        'Payment settings apply system-wide without date entry.',
      description:
        'Cash register balancing rules regulating opening drawer floats and safe drop thresholds.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Cash Register Policies',
        urlPath: 'https://pos.royal-erp.internal/#/settings/payments',
        dateBadgeText: '💰 Cash Drawer Control: Float Verification Active',
        primaryActionText: 'Save Payment Policies',
        formSections: [
          {
            title: '1. Cash Drawer Float & Safety Drops',
            fields: [
              { label: 'Require Opening Float Entry on Shift Start', placeholder: 'Checked: YES', pinNumber: 1 },
              { label: 'Drawer Cash Limit for Safe Drop Alert ($)', placeholder: '$1,000.00', pinNumber: 2 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Opening Float Enforcement Toggle',
          fieldOrSection: 'Section 1: Register Opening',
          instruction: 'Forces cashiers to count and record physical drawer bills before opening register.',
        },
      ],
      fields: [
        {
          name: 'Opening Float Required',
          type: 'Boolean Toggle',
          required: true,
          purpose: 'Enforces cash drawer counting at shift start.',
          functionality: 'Blocks POS sales until morning float amount is entered.',
          validationRules: 'Yes or No.',
        },
      ],
    },
    {
      id: 'system_sync_settings',
      title: 'Themes, Display & Cloud Sync Settings',
      menuPath: 'Business Settings > Themes & Display',
      whyItIsUsed:
        'Customizes user interface visual styling (Light Mode vs Modern Dark Mode), brand theme accent colors, font sizes, offline caching behavior, and database sync polling intervals.',
      howToUse: [
        '1. Go to Business Settings > Themes & Display.',
        '2. Toggle Theme Mode: "Light Theme" or "Dark Theme".',
        '3. Select Brand Accent Color (Sky Blue, Emerald Green, Indigo Purple, Amber Gold).',
        '4. Set Background Cloud Sync Polling Interval (e.g. Every 30 Seconds).',
        '5. Click "Apply & Save Theme".',
      ],
      whereToEnterDate:
        'Theme settings apply in real time without date entry.',
      description:
        'UI appearance customizer regulating Light/Dark modes, accent colors, and background sync frequencies.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Visual Display & Cloud Sync',
        urlPath: 'https://pos.royal-erp.internal/#/settings/theme',
        dateBadgeText: '🎨 Visual Mode: Dynamic Light/Dark | Real-Time Sync',
        primaryActionText: 'Save Display Preferences',
        formSections: [
          {
            title: '1. UI Theme & Visual Styling',
            fields: [
              { label: 'Theme Mode *', placeholder: 'Toggle: Light Mode / Dark Mode', pinNumber: 1 },
              { label: 'Brand Accent Palette', placeholder: 'Select: Sky Blue (#0284c7)', pinNumber: 2 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Light / Dark Theme Switch',
          fieldOrSection: 'Section 1: Appearance',
          instruction: 'Toggles between high-contrast light and dark styling.',
        },
      ],
      fields: [
        {
          name: 'Theme Mode',
          type: 'Select (Light | Dark)',
          required: true,
          purpose: 'Sets the visual theme of the ERP.',
          functionality: 'Updates CSS data-theme attribute on root DOM.',
          validationRules: 'Must select Light or Dark.',
        },
      ],
    },
    {
      id: 'prefixes_settings',
      title: 'Document Reference Prefixes',
      menuPath: 'Business Settings > Document Prefix',
      whyItIsUsed:
        'Configures custom alphanumeric prefixes for all sequentially generated commercial documents: Sales Invoices (INV-), Purchase Orders (PO-), Quotations (QT-), Stock Adjustments (ADJ-), Branch Transfers (TR-), and Expense Vouchers (EXP-).',
      howToUse: [
        '1. Go to Business Settings > Document Prefix.',
        '2. Review and edit prefixes: Invoice Prefix (e.g. "INV-2026-"), Purchase Prefix ("PO-"), Customer Prefix ("CUST-").',
        '3. Click "Save Prefixes" to update numbering templates.',
      ],
      whereToEnterDate:
        'Prefixes can include dynamic date formatting tags like "{YYYY}" or "{YYMM}" to auto-generate year-specific document numbers (e.g. INV-2026-0001).',
      description:
        'Document sequence prefix configurator establishing organizational reference numbering standards.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Document Reference Prefixes',
        urlPath: 'https://pos.royal-erp.internal/#/settings/prefixes',
        dateBadgeText: '🔢 Sequence Prefixes: Standardized Format Active',
        primaryActionText: 'Save Prefix Settings',
        formSections: [
          {
            title: '1. Commercial & Transaction Prefixes',
            fields: [
              { label: 'Sales Invoice Prefix *', placeholder: 'INV-2026-', isRequired: true, pinNumber: 1 },
              { label: 'Purchase Order Prefix *', placeholder: 'PO-2026-', isRequired: true },
              { label: 'Quotation / Estimate Prefix *', placeholder: 'QT-2026-', isRequired: true },
              { label: 'Stock Adjustment Prefix *', placeholder: 'ADJ-2026-', isRequired: true },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Sales Invoice Prefix Input',
          fieldOrSection: 'Section 1: Billing',
          instruction: 'Prefix prepended to sequential numbers on customer bills.',
        },
      ],
      fields: [
        {
          name: 'Invoice Prefix',
          type: 'Text (Prefix String)',
          required: true,
          purpose: 'String prepended to sequential invoice numbers.',
          functionality: 'Auto-generates sequential invoice voucher IDs.',
          validationRules: 'Minimum 1 character.',
        },
      ],
    },
    {
      id: 'reward_points_settings',
      title: 'Customer Loyalty & Reward Points System',
      menuPath: 'Business Settings > Reward Settings',
      whyItIsUsed:
        'Configures customer loyalty point accrual rules (e.g. Earn 1 Point for every $10 spent at checkout) and redemption conversion values (e.g. 100 Points = $5 discount) to drive repeat store visits.',
      howToUse: [
        '1. Go to Business Settings > Reward Settings.',
        '2. Toggle "Enable Loyalty Reward Points".',
        '3. Set Accrual Rule: "Spend Amount for 1 Point" (e.g. $10.00).',
        '4. Set Redemption Value: "Cash Value per Point" (e.g. $0.05 per point).',
        '5. Specify Minimum Points required for redemption (e.g. 50 Points).',
        '6. Click "Save Reward Rules".',
      ],
      whereToEnterDate:
        'In Reward Settings, set "Point Expiration Duration (Months)" (e.g. 12 Months). The system uses the invoice date [YYYY-MM-DD] to compute the expiration timestamp of earned points.',
      description:
        'Loyalty rewards engine managing point accrual rates, redemption cash values, and expiration rules.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Loyalty Rewards Configuration',
        urlPath: 'https://pos.royal-erp.internal/#/settings/rewards',
        dateBadgeText: '🎁 Loyalty Engine: 1 Pt / $10 Spent | Expiry: 12 Mos',
        primaryActionText: 'Save Loyalty Rules',
        formSections: [
          {
            title: '1. Points Accrual & Conversion',
            fields: [
              { label: 'Enable Loyalty Rewards Program', placeholder: 'Checked: YES', pinNumber: 1 },
              { label: 'Amount Spent to Earn 1 Point ($)', placeholder: '$10.00', pinNumber: 2 },
              { label: 'Cash Value per Redeemed Point ($)', placeholder: '$0.05', pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Loyalty Program Toggle',
          fieldOrSection: 'Section 1: Activation',
          instruction: 'Enables loyalty point balances on customer profiles and checkout screens.',
        },
      ],
      fields: [
        {
          name: 'Spend per Point',
          type: 'Currency Number',
          required: true,
          purpose: 'Threshold spent to earn 1 point.',
          functionality: 'Divides invoice total to credit loyalty points.',
          validationRules: 'Positive number (> $0.00).',
        },
      ],
    },
    {
      id: 'modules_settings',
      title: 'Feature Modules Manager & Toggles',
      menuPath: 'Business Settings > Modules Manager',
      whyItIsUsed:
        'Allows business administrators to toggle major functional ERP modules on or off (e.g. Purchases, Expenses, Warranties, Barcode Studio, Stock Transfers) to streamline sidebar menus for specific business types.',
      howToUse: [
        '1. Go to Business Settings > Modules Manager.',
        '2. Review list of available functional modules.',
        '3. Toggle modules on or off based on operational requirements.',
        '4. Click "Save Module Settings" to instantly reconfigure sidebar navigation.',
      ],
      whereToEnterDate:
        'Module toggle settings do not require date entry.',
      description:
        'Modular feature toggle manager enabling or disabling major application capabilities.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Modules Manager',
        urlPath: 'https://pos.royal-erp.internal/#/settings/modules',
        dateBadgeText: '🧩 Modules Status: 14 Primary Modules Enabled',
        primaryActionText: 'Save Active Modules',
        mockColumns: ['Module Name', 'Functional Scope', 'Status', 'Toggle Action'],
        mockRows: [
          { 'Module Name': 'Purchases & Inward Procurement', 'Functional Scope': 'Vendor POs, Inward GRN, Debit Notes', Status: 'Enabled', 'Toggle Action': 'Active' },
          { 'Module Name': 'Expenses & Overheads', 'Functional Scope': 'Utility, Rent, Payroll Vouchers', Status: 'Enabled', 'Toggle Action': 'Active' },
          { 'Module Name': 'Warranty Management', 'Functional Scope': 'After-sales guarantee tracking', Status: 'Enabled', 'Toggle Action': 'Active' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Module Toggle Switches',
          fieldOrSection: 'Grid Column 4',
          instruction: 'Turn modules on or off to streamline employee interfaces.',
        },
      ],
      fields: [
        {
          name: 'Module Status',
          type: 'Boolean Flag',
          required: true,
          purpose: 'Controls module visibility in sidebar and API access.',
          functionality: 'Enforced dynamically in application layout.',
          validationRules: 'Enabled or Disabled.',
        },
      ],
    },
    {
      id: 'printers_settings',
      title: 'Printer Configuration & Barcode Hardware',
      menuPath: 'Business Settings > Printer Configuration',
      whyItIsUsed:
        'Configures physical printer hardware connections: USB Direct, Network IP thermal printers, continuous roll widths (58mm vs 80mm), and character encoding (ESC/POS) for instant receipt printing.',
      howToUse: [
        '1. Go to Business Settings > Printer Configuration.',
        '2. Choose Printer Type: "Browser Print Dialog", "Network IP Thermal", or "Direct USB".',
        '3. Select Paper Width: "80mm (Standard)" or "58mm (Compact)".',
        '4. Enter IP Address and Port if using network thermal printers.',
        '5. Click "Print Test Ticket" to verify hardware communication.',
        '6. Click "Save Printer Settings".',
      ],
      whereToEnterDate:
        'Hardware printer settings apply in real time without date entry.',
      description:
        'Hardware printer driver configuration supporting USB, Network IP, and thermal paper formats.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Hardware Printer Drivers',
        urlPath: 'https://pos.royal-erp.internal/#/settings/printers',
        dateBadgeText: '🖨️ Printer Driver: ESC/POS Thermal 80mm Connected',
        primaryActionText: 'Print Hardware Test Ticket',
        formSections: [
          {
            title: '1. Thermal Receipt Hardware Setup',
            fields: [
              { label: 'Connection Interface *', placeholder: 'Select: Network IP / Direct Thermal', isRequired: true, pinNumber: 1 },
              { label: 'Paper Width *', placeholder: 'Select: 80mm Thermal Roll', isRequired: true, pinNumber: 2 },
              { label: 'Printer Network IP Address', placeholder: '192.168.1.200 (Port 9100)' },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Connection Interface Selector',
          fieldOrSection: 'Section 1: Hardware Type',
          instruction: 'Select communication method (Network IP or Browser Dialog).',
        },
        {
          pinNumber: 2,
          label: 'Paper Width Selector',
          fieldOrSection: 'Section 1: Geometry',
          instruction: 'Sets formatting width to match physical thermal paper roll.',
        },
      ],
      fields: [
        {
          name: 'Paper Width',
          type: 'Select (58mm | 80mm)',
          required: true,
          purpose: 'Sets horizontal page constraints for thermal receipts.',
          functionality: 'Controls CSS print rules to prevent text wrapping.',
          validationRules: 'Must select 58mm or 80mm.',
        },
      ],
    },
    {
      id: 'custom_labels_settings',
      title: 'Custom Field Labels & Entity Extensibility',
      menuPath: 'Business Settings > Custom Fields',
      whyItIsUsed:
        'Extends standard ERP database tables by adding custom fields to Products, Customers, Suppliers, and Invoices (e.g. adding "Vehicle Registration #", "Fabric Composition", or "Delivery Slot" fields).',
      howToUse: [
        '1. Go to Business Settings > Custom Fields.',
        '2. Select target entity: Product, Customer, Supplier, or Sales Invoice.',
        '3. Enter custom labels for Custom Field 1, Custom Field 2, Custom Field 3.',
        '4. Check "Show on Invoices" if the custom field should print on customer bills.',
        '5. Click "Save Custom Field Labels".',
      ],
      whereToEnterDate:
        'If a custom field is configured for dates (e.g. "Inspection Expiry Date"), cashiers enter the date in YYYY-MM-DD format during invoice creation.',
      description:
        'Entity extensibility manager adding bespoke metadata fields to products, customers, and invoices.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Custom Field Labels & Extensibility',
        urlPath: 'https://pos.royal-erp.internal/#/settings/custom-fields',
        dateBadgeText: '🏷️ Schema Extensions: 4 Custom Fields Active',
        primaryActionText: 'Save Custom Fields',
        formSections: [
          {
            title: '1. Product Master Custom Fields',
            fields: [
              { label: 'Product Custom Field 1 Label', placeholder: 'e.g. Fabric Material / Composition', pinNumber: 1 },
              { label: 'Product Custom Field 2 Label', placeholder: 'e.g. Shelf Life / Storage Temperature' },
            ],
          },
          {
            title: '2. Sales Invoice Custom Fields',
            fields: [
              { label: 'Invoice Custom Field 1 Label', placeholder: 'e.g. Delivery Vehicle Reg #', pinNumber: 2 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Product Custom Field Label',
          fieldOrSection: 'Section 1: Product Extensions',
          instruction: 'Adds extra input to the Add Product creation form.',
        },
      ],
      fields: [
        {
          name: 'Custom Field Label',
          type: 'Text',
          required: false,
          purpose: 'Name of the bespoke field displayed on forms.',
          functionality: 'Renders custom input box on target entity screens.',
          validationRules: 'Maximum 50 characters.',
        },
      ],
    },
  ],
  bestPractices: [
    'Always mandate HSN/SAC code entry in Product Settings to maintain statutory tax compliance.',
    'Configure consistent document reference prefixes (INV-, PO-) to avoid confusion during manual audits.',
    'Test network thermal receipt printers before morning retail store opening.',
  ],
  troubleshooting: [
    {
      issue: 'Product form rejects submission stating HSN is missing',
      solution:
        'In Business Settings > Product Settings, "Enforce Mandatory HSN/SAC Code" is active. Provide a valid 4-, 6-, or 8-digit HSN code to proceed.',
    },
  ],
};
