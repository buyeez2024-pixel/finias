import { DocModule } from './types';

export const configurationDoc: DocModule = {
  id: 'configuration',
  title: '13. Store Configurations & Master Settings',
  category: 'System Architecture & Global Rules',
  iconName: 'Sliders',
  overview:
    'Master enterprise configuration regulating multi-branch retail outlets, legal invoice layouts, statutory tax slabs, multi-currency display, receipt paper formats, payment accounts, digital signature/seal stamps, and automated customer notification templates.',
  workflowSteps: [
    {
      step: 1,
      title: 'Provision Physical Branch Outlets',
      description:
        'Set up physical retail shops and warehouse depot facilities with trade licenses, addresses, and local tax IDs.',
    },
    {
      step: 2,
      title: 'Configure Tax Slabs & Mandatory HSN Rates',
      description:
        'Define tax rates (e.g. GST 5%, 12%, 18%, 28% or VAT 15%) and map them to statutory HSN codes.',
    },
    {
      step: 3,
      title: 'Design Invoice Layouts & Thermal Receipts',
      description:
        'Customize company header logos, terms & conditions, tax breakdown tables, return policies, and barcode formats.',
    },
    {
      step: 4,
      title: 'Upload Official Seal & Digital Signature',
      description:
        'Attach authorized company rubber stamps and signatory signatures to automatically stamp finalized tax invoices.',
    },
    {
      step: 5,
      title: 'Configure Notification Templates (SMS / WhatsApp)',
      description:
        'Customize automated customer SMS and WhatsApp templates dispatched upon invoice completion or payment receipt.',
    },
  ],
  submenus: [
    {
      id: 'branch_outlets',
      title: 'Branch Outlets & Business Locations',
      menuPath: 'Store Configurations > Branch Outlets',
      whyItIsUsed:
        'Manages multi-store facilities, retail flagship outlets, and storage warehouses, assigning distinct physical addresses, telephone contacts, local tax IDs, and invoice numbering schemes.',
      howToUse: [
        '1. Go to Store Configurations > Branch Outlets.',
        '2. Review list of configured business locations.',
        '3. Click "+ Add Business Location".',
        '4. Provide Location Name (e.g. "West Coast Distribution Hub"), City, State, Country, and Zip Code.',
        '5. Input Local Tax Registration Number (GSTIN / VAT ID).',
        '6. Select default Invoice Layout and Scheme.',
        '7. Click "Save Location".',
      ],
      whereToEnterDate:
        'In Branch Outlets, each facility records its official "Establishment / Opening Date [YYYY-MM-DD]" to document trade license validity and branch tenure.',
      description:
        'Multi-branch retail store and warehouse facility manager configuring addresses, tax IDs, and printers.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Multi-Branch Retail Outlets & Warehouses',
        urlPath: 'https://pos.royal-erp.internal/#/config/locations',
        dateBadgeText: '🏢 Outlets Active: 3 Operating Facilities',
        primaryActionText: '+ Add Business Location',
        mockColumns: ['Location Name', 'Location Code', 'Address', 'Tax ID (GSTIN/VAT)', 'Phone', 'Assigned Staff', 'Actions'],
        mockRows: [
          { 'Location Name': 'Main Flagship Store', 'Location Code': 'LOC-01', Address: '100 Broadway, New York, NY', 'Tax ID (GSTIN/VAT)': 'TAX-NY-8812', Phone: '+1 555-0100', 'Assigned Staff': '8 Users', Actions: 'Edit | Settings' },
          { 'Location Name': 'Central Warehouse Depot', 'Location Code': 'LOC-02', Address: '450 Industrial Pkwy, Newark, NJ', 'Tax ID (GSTIN/VAT)': 'TAX-NJ-4412', Phone: '+1 555-0200', 'Assigned Staff': '4 Users', Actions: 'Edit | Settings' },
          { 'Location Name': 'East Counter Retail', 'Location Code': 'LOC-03', Address: '72 Queens Blvd, Queens, NY', 'Tax ID (GSTIN/VAT)': 'TAX-NY-9901', Phone: '+1 555-0300', 'Assigned Staff': '3 Users', Actions: 'Edit | Settings' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Location Action',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'Click to open the branch store registration modal.',
        },
        {
          pinNumber: 2,
          label: 'Tax ID Column',
          fieldOrSection: 'Grid Column 4',
          instruction: 'Specific regional GSTIN/VAT printed on receipts from this location.',
        },
      ],
      fields: [
        {
          name: 'Location Name',
          type: 'Text',
          required: true,
          purpose: 'Official commercial name of the store or depot.',
          functionality: 'Printed on top of receipts and selected in cashier logins.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
    {
      id: 'invoice_layouts_config',
      title: 'Invoice Layouts & Print Schemes',
      menuPath: 'Store Configurations > Invoice Layouts',
      whyItIsUsed:
        'Configures visual design, column order, company branding headers, font sizes, QR code placement, and legal terms printed on customer invoices across A4, Letter, and thermal roll layouts.',
      howToUse: [
        '1. Go to Store Configurations > Invoice Layouts.',
        '2. Review existing templates (Classic A4, Detailed Tax Invoice, Compact Thermal 80mm).',
        '3. Click "+ Add Invoice Layout".',
        '4. Toggle elements: Show Company Logo, Show Tax Breakdown, Show Customer Due, Show QR Code.',
        '5. Input Legal Terms & Conditions and Bank Details for Wire Transfers.',
        '6. Click "Preview & Save Layout".',
      ],
      whereToEnterDate:
        'In the Invoice Layout designer, you can configure the "Invoice Date Display Format" (e.g. YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY) to comply with local tax conventions.',
      description:
        'Visual invoice layout designer customizing headers, legal disclosures, tax grids, and print dimensions.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Invoice Print Layout & Template Designer',
        urlPath: 'https://pos.royal-erp.internal/#/config/invoice-layouts',
        dateBadgeText: '📄 Templates Active: A4 Commercial & 80mm Thermal',
        primaryActionText: '+ Create New Layout',
        formSections: [
          {
            title: '1. Layout Identity & Header Branding',
            fields: [
              { label: 'Layout Name *', placeholder: 'e.g. Standard GST Tax Invoice A4', isRequired: true, pinNumber: 1 },
              { label: 'Show Company Logo', placeholder: 'Checked: YES' },
              { label: 'Date Format on Invoice', placeholder: 'Select: YYYY-MM-DD (ISO Standard)', pinNumber: 2 },
            ],
          },
          {
            title: '2. Table Columns & Legal Terms',
            fields: [
              { label: 'Show HSN / SAC Code Column', placeholder: 'Checked: YES (Mandatory for B2B)' },
              { label: 'Show Tax Amount per Line Item', placeholder: 'Checked: YES' },
              { label: 'Terms & Conditions Footer', placeholder: 'Goods once sold cannot be returned without original receipt within 7 days.', pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Layout Name & Style',
          fieldOrSection: 'Section 1: Identity',
          instruction: 'Define title for this invoice layout template.',
        },
        {
          pinNumber: 2,
          label: 'Date Format Selector',
          fieldOrSection: 'Section 1: Date Format',
          instruction: 'Choose date convention (YYYY-MM-DD or DD/MM/YYYY) printed on customer bills.',
        },
        {
          pinNumber: 3,
          label: 'Terms & Conditions Footer',
          fieldOrSection: 'Section 2: Disclosures',
          instruction: 'Legal terms printed at the bottom of the invoice.',
        },
      ],
      fields: [
        {
          name: 'Layout Name',
          type: 'Text',
          required: true,
          purpose: 'Label for the layout configuration.',
          functionality: 'Assigned to business locations or checkout registers.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
    {
      id: 'tax_config_view',
      title: 'Tax Rates, Slabs & HSN Mapping',
      menuPath: 'Store Configurations > Tax Configuration',
      whyItIsUsed:
        'Sets up statutory tax rates (e.g. GST 0%, 5%, 12%, 18%, 28%, VAT 5%, Sales Tax 8.875%), tax grouping components (CGST + SGST vs IGST), and tax exemption rules.',
      howToUse: [
        '1. Go to Store Configurations > Tax Configuration.',
        '2. Review existing tax rates and sub-tax distributions.',
        '3. Click "+ Add Tax Rate".',
        '4. Provide Tax Name (e.g. "GST 18%"), Tax Percentage (e.g. 18.00%), and select Sub-Taxes (CGST 9% + SGST 9%).',
        '5. Click "Save Tax Rate".',
      ],
      whereToEnterDate:
        'Tax rates do not require temporal dates, but statutory tax rate revision dates are logged in the System Security audit logs in YYYY-MM-DD format.',
      description:
        'Statutory tax rate configurator defining GST/VAT percentage slabs and component distributions.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Statutory Tax Rates & Slabs',
        urlPath: 'https://pos.royal-erp.internal/#/config/tax',
        dateBadgeText: '⚖️ Tax Engine: Dual GST / VAT Engine Configured',
        primaryActionText: '+ Add New Tax Rate',
        mockColumns: ['Tax Rate Name', 'Tax %', 'Sub-Tax Components', 'Tax Type', 'Status', 'Actions'],
        mockRows: [
          { 'Tax Rate Name': 'GST 0% (Exempt)', 'Tax %': '0.00%', 'Sub-Tax Components': 'None', 'Tax Type': 'Single', Status: 'Active', Actions: 'Edit | Delete' },
          { 'Tax Rate Name': 'GST 5%', 'Tax %': '5.00%', 'Sub-Tax Components': 'CGST 2.5% + SGST 2.5%', 'Tax Type': 'Compound', Status: 'Active', Actions: 'Edit | Delete' },
          { 'Tax Rate Name': 'GST 18%', 'Tax %': '18.00%', 'Sub-Tax Components': 'CGST 9.0% + SGST 9.0%', 'Tax Type': 'Compound', Status: 'Active', Actions: 'Edit | Delete' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Tax Rate Button',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to open the tax rate creation modal.',
        },
        {
          pinNumber: 2,
          label: 'Sub-Tax Components Column',
          fieldOrSection: 'Grid Column 3',
          instruction: 'Shows the division between central and state/local tax pools.',
        },
      ],
      fields: [
        {
          name: 'Tax Percentage',
          type: 'Decimal Number',
          required: true,
          purpose: 'Rate applied against product taxable base value.',
          functionality: 'Auto-computes tax line totals on sales and purchase invoices.',
          validationRules: 'Between 0.00% and 100.00%.',
        },
      ],
    },
    {
      id: 'currency_settings',
      title: 'Currency Settings & Exchange Rates',
      menuPath: 'Store Configurations > Currency Configuration',
      whyItIsUsed:
        'Configures primary operating currency (e.g. USD, EUR, INR, GBP, CAD), currency symbol ($ / € / ₹), decimal separator (dot vs comma), and currency symbol placement (Before / After amount).',
      howToUse: [
        '1. Go to Store Configurations > Currency Configuration.',
        '2. Select Base Currency Code from the international ISO 4217 list.',
        '3. Choose Symbol Placement: "Before Amount ($100)" or "After Amount (100 €)".',
        '4. Set Decimal Precision (0, 2, or 3 decimals).',
        '5. Click "Save Currency Settings".',
      ],
      whereToEnterDate:
        'Currency settings do not require dates. Currency configuration timestamps are tracked in the System Security audit logs in YYYY-MM-DD format.',
      description:
        'Base currency selector, symbol placement rules, and decimal separator configurations.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Currency Configuration',
        urlPath: 'https://pos.royal-erp.internal/#/config/currency',
        dateBadgeText: '💲 Base Currency: USD ($) | Decimals: 2',
        primaryActionText: 'Save Currency Rules',
        formSections: [
          {
            title: '1. Base Currency & Format',
            fields: [
              { label: 'Currency Code *', placeholder: 'USD - United States Dollar', isRequired: true, pinNumber: 1 },
              { label: 'Currency Symbol *', placeholder: '$', isRequired: true },
              { label: 'Symbol Placement', placeholder: 'Select: Before Amount ($100)', pinNumber: 2 },
              { label: 'Decimal Precision', placeholder: 'Select: 2 Decimal Places (e.g. 99.99)' },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Currency Code Selector',
          fieldOrSection: 'Section 1: Code',
          instruction: 'Select standard ISO 3-letter currency identifier.',
        },
        {
          pinNumber: 2,
          label: 'Symbol Placement Toggle',
          fieldOrSection: 'Section 1: Formatting',
          instruction: 'Position symbol before ($100) or after (100 €) monetary figures.',
        },
      ],
      fields: [
        {
          name: 'Currency Symbol',
          type: 'Text',
          required: true,
          purpose: 'Symbol prefixed or suffixed to currency displays across the app.',
          functionality: 'Rendered on dashboard cards, invoices, receipts, and reports.',
          validationRules: '1 to 5 characters.',
        },
      ],
    },
    {
      id: 'receipt_config',
      title: 'Receipt Layouts & Thermal Printer Templates',
      menuPath: 'Store Configurations > Receipt Layouts',
      whyItIsUsed:
        'Configures narrow thermal receipt slips (58mm and 80mm roll widths), tailoring store contact lines, greeting messages, QR code loyalty links, and compact barcode print layouts.',
      howToUse: [
        '1. Open Store Configurations > Receipt Layouts.',
        '2. Select active thermal template (Standard 80mm POS).',
        '3. Enter Header Lines: Store Name, Branch Address, Hotline Telephone, GSTIN.',
        '4. Toggle "Show Cashier Name", "Show Customer Phone", and "Show Tax Breakdown".',
        '5. Input Footer Message: "Thank you for shopping with us! Please visit again."',
        '6. Click "Save Receipt Layout".',
      ],
      whereToEnterDate:
        'In the Receipt Layout, toggle the "Print Date & Time on Receipt" setting. Dates print in the format configured in your global settings (e.g. YYYY-MM-DD HH:MM).',
      description:
        'Thermal receipt format designer optimizing line spacing, barcode rendering, and store headers.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Thermal Receipt Designer',
        urlPath: 'https://pos.royal-erp.internal/#/config/receipts',
        dateBadgeText: '🧾 Paper Width: 80mm Thermal Roll Active',
        primaryActionText: 'Save Receipt Design',
        formSections: [
          {
            title: '1. Receipt Header Information',
            fields: [
              { label: 'Store Header Title *', placeholder: 'e.g. ROYAL DEPARTMENT STORE', isRequired: true, pinNumber: 1 },
              { label: 'Address & Phone Lines', placeholder: '100 Broadway, NY | Tel: 555-0100' },
            ],
          },
          {
            title: '2. Printed Date & Cashier Details',
            fields: [
              { label: 'Print Date & Time Stamp', placeholder: 'Checked: YES (YYYY-MM-DD HH:MM)', pinNumber: 2 },
              { label: 'Print Cashier Name', placeholder: 'Checked: YES' },
              { label: 'Footer Greeting', placeholder: 'Thank you for your visit! Follow us on Instagram @royalerp', pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Store Header Title',
          fieldOrSection: 'Section 1: Header',
          instruction: 'Primary store banner printed at the very top of thermal slips.',
        },
        {
          pinNumber: 2,
          label: 'Print Date & Time Stamp',
          fieldOrSection: 'Section 2: Timestamps',
          instruction: 'Ensures customer has official receipt timestamp for refund eligibility.',
        },
      ],
      fields: [
        {
          name: 'Store Header Title',
          type: 'Text',
          required: true,
          purpose: 'Name printed in bold at top of receipt.',
          functionality: 'Identifies retail outlet.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
    {
      id: 'payment_accounts_config',
      title: 'Payment Account Mapping & Default Ledgers',
      menuPath: 'Store Configurations > Payment Accounts',
      whyItIsUsed:
        'Binds checkout payment methods (Cash, Card, UPI) to designated general ledger accounts, ensuring automated double-entry ledger postings upon invoice finalization.',
      howToUse: [
        '1. Go to Store Configurations > Payment Accounts.',
        '2. Map "Cash Tender" to "Counter Cash Drawer #01".',
        '3. Map "Credit Card Swipes" to "Merchant POS Bank Account".',
        '4. Map "UPI / QR Payments" to "Digital UPI Clearing Bank".',
        '5. Click "Save Account Mappings".',
      ],
      whereToEnterDate:
        'Payment account mappings do not require dates. Mapping changes are logged with audit timestamps in YYYY-MM-DD format.',
      description:
        'Treasury integration mapping payment tender types directly to general ledger asset accounts.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Payment Tender to Ledger Mapping',
        urlPath: 'https://pos.royal-erp.internal/#/config/payment-accounts',
        dateBadgeText: '🔗 Ledger Integration: Auto-Posting Active',
        primaryActionText: 'Save Account Mappings',
        formSections: [
          {
            title: '1. Default Payment Ledger Mappings',
            fields: [
              { label: 'Cash Tender Default Account *', placeholder: 'Mapped to: Counter Cash Drawer #01', isRequired: true, pinNumber: 1 },
              { label: 'Credit Card Default Account *', placeholder: 'Mapped to: Primary Business Checking Bank', isRequired: true, pinNumber: 2 },
              { label: 'UPI / Digital Default Account *', placeholder: 'Mapped to: Digital UPI Clearing Bank', isRequired: true },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Cash Tender Mapping',
          fieldOrSection: 'Section 1: Cash Mapping',
          instruction: 'Routes physical cash payments into the register drawer ledger.',
        },
        {
          pinNumber: 2,
          label: 'Card & Bank Mapping',
          fieldOrSection: 'Section 1: Bank Mapping',
          instruction: 'Routes electronic card collections directly to bank ledger.',
        },
      ],
      fields: [
        {
          name: 'Cash Ledger Account',
          type: 'Select Dropdown',
          required: true,
          purpose: 'Asset account debited when cash is received.',
          functionality: 'Updates cash ledger automatically upon POS sale.',
          validationRules: 'Must select an active cash account.',
        },
      ],
    },
    {
      id: 'payment_methods_config',
      title: 'Payment Methods (Cash, Card, UPI, Wire)',
      menuPath: 'Store Configurations > Payment Methods',
      whyItIsUsed:
        'Defines and toggles active payment options displayed at checkout: Cash, Credit/Debit Cards, UPI QR Codes, Net Banking, Cheques, and Custom Loyalty Vouchers.',
      howToUse: [
        '1. Go to Store Configurations > Payment Methods.',
        '2. Review list of available tender methods.',
        '3. Toggle methods on/off based on counter terminal equipment.',
        '4. Click "+ Add Custom Payment Method" (e.g. "Store Gift Card").',
        '5. Click "Save Payment Methods".',
      ],
      whereToEnterDate:
        'Payment methods are static operational settings and do not require date entry.',
      description:
        'Tender method configurator enabling or disabling Cash, Card, UPI, and voucher payment modes.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Active Payment Methods',
        urlPath: 'https://pos.royal-erp.internal/#/config/payment-methods',
        dateBadgeText: '💳 Payment Tenders: 5 Methods Active',
        primaryActionText: '+ Add Payment Method',
        mockColumns: ['Method Name', 'Code', 'Enabled in POS', 'Enabled in Invoices', 'Status', 'Actions'],
        mockRows: [
          { 'Method Name': 'Cash', Code: 'CASH', 'Enabled in POS': 'Yes (Default)', 'Enabled in Invoices': 'Yes', Status: 'Active', Actions: 'Edit' },
          { 'Method Name': 'Credit / Debit Card', Code: 'CARD', 'Enabled in POS': 'Yes', 'Enabled in Invoices': 'Yes', Status: 'Active', Actions: 'Edit' },
          { 'Method Name': 'UPI / QR Code', Code: 'UPI', 'Enabled in POS': 'Yes', 'Enabled in Invoices': 'Yes', Status: 'Active', Actions: 'Edit' },
          { 'Method Name': 'Bank Transfer / Wire', Code: 'BANK', 'Enabled in POS': 'No', 'Enabled in Invoices': 'Yes', Status: 'Active', Actions: 'Edit' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Method Action',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to create a new tender type.',
        },
        {
          pinNumber: 2,
          label: 'Enabled in POS Toggle',
          fieldOrSection: 'Grid Column 3',
          instruction: 'Controls button visibility on the cashier checkout screen.',
        },
      ],
      fields: [
        {
          name: 'Payment Method Name',
          type: 'Text',
          required: true,
          purpose: 'Label displayed on checkout tender buttons.',
          functionality: 'Categorizes receipts on collection reports.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
    {
      id: 'signature_seal_config',
      title: 'Digital Signature & Official Rubber Seal',
      menuPath: 'Store Configurations > Signature & Seal',
      whyItIsUsed:
        'Allows business owners to upload authorized digital signature graphics and official corporate rubber stamps to automatically print on finalized B2B tax invoices, quotations, and delivery challans.',
      howToUse: [
        '1. Go to Store Configurations > Signature & Seal.',
        '2. In the "Authorized Signature" block, upload a transparent PNG image of the authorized signatory.',
        '3. Enter Signatory Name (e.g. "Alexander Vance") and Designation (e.g. "Managing Director").',
        '4. In the "Official Rubber Stamp / Seal" block, upload a circular corporate stamp image.',
        '5. Toggle "Display on Invoices" and "Display on Quotations".',
        '6. Click "Save Signature & Seal".',
      ],
      whereToEnterDate:
        'Signature graphics do not require date inputs; the active date of invoice issuance is stamped alongside the signature in YYYY-MM-DD format.',
      description:
        'Upload portal for authorized corporate rubber stamps and signatory graphics for automatic invoice stamping.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Corporate Signature & Official Seal',
        urlPath: 'https://pos.royal-erp.internal/#/config/signature-seal',
        dateBadgeText: '✍️ Digital Stamps: Verified Signatory Active',
        primaryActionText: 'Save Signature & Stamp',
        formSections: [
          {
            title: '1. Authorized Signatory Details',
            fields: [
              { label: 'Authorized Person Name *', placeholder: 'e.g. Alexander Vance', isRequired: true, pinNumber: 1 },
              { label: 'Designation / Title *', placeholder: 'Managing Director / Authorized Officer', isRequired: true },
              { label: 'Signature Graphic Image *', placeholder: 'signature_alex_vance.png (Uploaded)', isRequired: true, pinNumber: 2 },
            ],
          },
          {
            title: '2. Official Company Rubber Stamp',
            fields: [
              { label: 'Company Rubber Stamp Graphic', placeholder: 'royal_official_seal.png (Uploaded)', pinNumber: 3 },
              { label: 'Auto-Stamp Invoices & Challans', placeholder: 'Checked: YES' },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Signatory Name & Title',
          fieldOrSection: 'Section 1: Signatory',
          instruction: 'Printed under the signature line on formal tax invoices.',
        },
        {
          pinNumber: 2,
          label: 'Upload Signature Graphic',
          fieldOrSection: 'Section 1: Upload',
          instruction: 'Attach clean transparent PNG of the physical signature.',
        },
        {
          pinNumber: 3,
          label: 'Upload Rubber Stamp Graphic',
          fieldOrSection: 'Section 2: Stamp',
          instruction: 'Attach digital corporate seal image.',
        },
      ],
      fields: [
        {
          name: 'Signatory Name',
          type: 'Text',
          required: true,
          purpose: 'Name printed on authorized signature line.',
          functionality: 'Validates commercial invoices legally.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
    {
      id: 'notification_templates_config',
      title: 'Notification Templates (SMS, WhatsApp, Email)',
      menuPath: 'Store Configurations > Notification Templates',
      whyItIsUsed:
        'Configures automated transactional communication templates dispatched to customers and suppliers: New Sale SMS, Invoice WhatsApp message with PDF download link, Payment Receipt confirmation, and Low Stock internal alerts.',
      howToUse: [
        '1. Go to Store Configurations > Notification Templates.',
        '2. Select Event: "New Sale Invoice", "Payment Received", or "Customer Welcome".',
        '3. Choose Channel: SMS, WhatsApp, or Email.',
        '4. Customize message body using dynamic shortcodes: {customer_name}, {invoice_no}, {grand_total}, {payment_due}, {business_name}.',
        '5. Click "Send Test Message" to verify formatting on your mobile phone.',
        '6. Click "Save Notification Template".',
      ],
      whereToEnterDate:
        'In the notification body, use the dynamic variable tag "{invoice_date}" or "{payment_date}". The system automatically substitutes the exact transaction date in YYYY-MM-DD format upon dispatch.',
      description:
        'Automated messaging template editor supporting SMS, WhatsApp, and Email with dynamic placeholder tags.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Customer Notification Templates',
        urlPath: 'https://pos.royal-erp.internal/#/config/notifications',
        dateBadgeText: '💬 Messaging Channels: SMS & WhatsApp Active',
        primaryActionText: 'Save Notification Templates',
        formSections: [
          {
            title: '1. Event & Channel Selection',
            fields: [
              { label: 'Event Trigger *', placeholder: 'Select: New Sale Invoice Finalized', isRequired: true, pinNumber: 1 },
              { label: 'Notification Channel', placeholder: 'Select: WhatsApp & SMS' },
            ],
          },
          {
            title: '2. Message Body & Dynamic Tags',
            fields: [
              { label: 'Available Dynamic Tags', placeholder: '{customer_name}, {invoice_no}, {grand_total}, {invoice_date}', pinNumber: 2 },
              { label: 'Message Text Template *', placeholder: 'Dear {customer_name}, thank you for your purchase of {grand_total} on {invoice_date}. Invoice #{invoice_no}. Download receipt: {receipt_url}', isRequired: true, pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Event Trigger Selector',
          fieldOrSection: 'Section 1: Trigger',
          instruction: 'Select transactional event (New Sale, Payment Received, Return).',
        },
        {
          pinNumber: 2,
          label: 'Dynamic Variable Tags',
          fieldOrSection: 'Section 2: Tags Help',
          instruction: 'Click tags to insert placeholders like {invoice_date} and {grand_total}.',
        },
        {
          pinNumber: 3,
          label: 'Template Message Body',
          fieldOrSection: 'Section 2: Body Input',
          instruction: 'The exact text message dispatched to customer mobile numbers.',
        },
      ],
      fields: [
        {
          name: 'Template Message Body',
          type: 'Text Area',
          required: true,
          purpose: 'Message content delivered to customer.',
          functionality: 'Substituted with real data and pushed via SMS/WhatsApp API gateway.',
          validationRules: 'Minimum 10 characters.',
        },
      ],
    },
  ],
  bestPractices: [
    'Ensure all business locations have accurate statutory tax IDs (GSTIN/VAT) configured to prevent legal non-compliance on printed receipts.',
    'Test thermal receipt layout printouts after modifying font sizes to avoid line clipping on 80mm rolls.',
    'Keep authorized digital signatures secured with admin role permissions.',
  ],
  troubleshooting: [
    {
      issue: 'Notification message fails to deliver to customer',
      solution:
        'Verify that customer telephone numbers are saved with international or domestic country prefixes, and check your SMS/WhatsApp gateway credentials under System Settings.',
    },
  ],
};
