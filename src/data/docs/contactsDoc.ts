import { DocModule } from './types';

export const contactsDoc: DocModule = {
  id: 'contacts',
  title: '3. Contact Management (Customers & Suppliers)',
  category: 'CRM & Trade Relations',
  iconName: 'UserCheck',
  overview:
    'End-to-end management of commercial counterparties: retail shoppers, B2B wholesale buyers, raw material vendors, and distributors. Handles tax registration numbers, customer credit limits, payment terms, and double-entry accounts receivable/payable ledgers.',
  workflowSteps: [
    {
      step: 1,
      title: 'Categorize Customer Pricing Tiers',
      description:
        'Set up Customer Groups (e.g. Retail, Wholesale, VIP Corporate) with automated percentage discounts or special price lists.',
    },
    {
      step: 2,
      title: 'Register Counterparties (Customers & Suppliers)',
      description:
        'Input business trade names, statutory tax registration (GSTIN / VAT ID), billing/shipping addresses, and opening balances.',
      tips: 'Always set a Credit Limit for B2B buyers to prevent unauthorized debt accumulation.',
    },
    {
      step: 3,
      title: 'Attach Contacts to Invoices & Bills',
      description:
        'Select the registered customer during POS/Sales invoicing, and select registered suppliers during Purchase Order entry.',
    },
    {
      step: 4,
      title: 'Reconcile Ledgers & Aging Statements',
      description:
        'Inspect Customer Ledger and Supplier Ledger to review statement dates, credit notes, payments received, and outstanding aging balances.',
    },
  ],
  submenus: [
    {
      id: 'customers_list',
      title: 'Customers Directory & Credit Balances',
      menuPath: 'Contacts > Customers',
      whyItIsUsed:
        'Stores the directory of retail and B2B customers, showing contact details, assigned customer group, credit limit, and real-time accounts receivable balance.',
      howToUse: [
        '1. Open "Contacts" in the sidebar and choose "Customers".',
        '2. Use the search input to look up a customer by name, business trade name, phone number, or tax ID.',
        '3. Filter by Customer Group (e.g. Wholesale, Regular) or Outstanding Due Status.',
        '4. Click "Ledger" to open the detailed customer statement of accounts.',
        '5. Click "Pay Due" to record a cash, card, or bank collection against outstanding invoices.',
      ],
      whereToEnterDate:
        'In the Customers List, date filtering is available under the "Registration Date" filter toolbar (Format: YYYY-MM-DD). Use this to view customers registered within a specific campaign period. When viewing an individual customer statement, date entry occurs in "Statement Date From [YYYY-MM-DD]" and "Statement Date To [YYYY-MM-DD]".',
      description:
        'Comprehensive directory of all purchasing clients with credit balances, tax identifiers, and contact details.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Customer Accounts Directory',
        urlPath: 'https://pos.royal-erp.internal/#/contacts/customers',
        dateBadgeText: '📅 Filter: Registration Date (All Time) | Balances Live',
        primaryActionText: '+ Add New Customer',
        filterOptions: ['All Groups', 'Retail Shoppers', 'Wholesale Tier A', 'VIP Corporate', 'Has Due Balance'],
        mockColumns: ['Customer ID', 'Contact Name', 'Business Name', 'Phone', 'Customer Group', 'Credit Limit', 'Total Due', 'Actions'],
        mockRows: [
          { 'Customer ID': 'CUST-001', 'Contact Name': 'Walk-in Customer', 'Business Name': 'General Retail', Phone: 'N/A', 'Customer Group': 'Retail Default', 'Credit Limit': '$0.00', 'Total Due': '$0.00', Actions: 'View Ledger' },
          { 'Customer ID': 'CUST-002', 'Contact Name': 'Robert Harrison', 'Business Name': 'Apex Hardware Ltd', Phone: '+1 555-0142', 'Customer Group': 'Wholesale Tier A', 'Credit Limit': '$10,000.00', 'Total Due': '$2,450.00', Actions: 'Ledger | Pay' },
          { 'Customer ID': 'CUST-003', 'Contact Name': 'Emily Davis', 'Business Name': 'Metro Superstore', Phone: '+1 555-0189', 'Customer Group': 'VIP Corporate', 'Credit Limit': '$25,000.00', 'Total Due': '$6,800.00', Actions: 'Ledger | Pay' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Customer Button',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'Click to launch the customer creation dialog.',
        },
        {
          pinNumber: 2,
          label: 'Customer Registration Date Filter',
          fieldOrSection: 'Filter Toolbar',
          instruction: 'Filter customers onboarded within specific marketing cycles.',
          whereToEnterDate: 'Click date filter to set Start and End dates in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Search by Phone / Name / Tax ID',
          fieldOrSection: 'Center Search Bar',
          instruction: 'Instant query matching name, mobile, email, or GSTIN.',
        },
        {
          pinNumber: 4,
          label: 'Total Due (Accounts Receivable) Column',
          fieldOrSection: 'Data Grid Column 7',
          instruction: 'Displays unpaid debt balance. Highlighted in red if payment is overdue.',
        },
        {
          pinNumber: 5,
          label: 'View Ledger & Record Payment Actions',
          fieldOrSection: 'Row Action Menu',
          instruction: 'Click Ledger to inspect all debit invoices and credit receipts.',
        },
      ],
      fields: [
        {
          name: 'Customer Name',
          type: 'Text',
          required: true,
          purpose: 'Name of the primary contact person or authorized purchasing officer.',
          functionality: 'Printed on retail receipts, invoices, and payment receipts.',
          validationRules: 'Minimum 2 characters.',
        },
        {
          name: 'Business Name',
          type: 'Text',
          required: false,
          purpose: 'Legal enterprise entity name for B2B billing.',
          functionality: 'Printed on formal Tax Invoices; required for corporate accounts.',
          validationRules: 'Optional for retail walk-ins; recommended for commercial accounts.',
        },
        {
          name: 'Contact Mobile Number',
          type: 'Tel Number',
          required: true,
          purpose: 'Primary telephone number for SMS notifications and payment reminders.',
          functionality: 'Used as lookup key in POS terminal to pull loyalty profiles.',
          validationRules: 'Minimum 7 digits, digits and optional leading plus sign.',
        },
        {
          name: 'Tax ID / GSTIN / VAT',
          type: 'Alphanumeric Code',
          required: false,
          purpose: 'Statutory tax registration number for tax deduction and input credits.',
          functionality: 'Validated for format; determines whether B2B tax invoice is generated.',
          validationRules: 'Matches national tax regex (e.g. 15-digit GSTIN).',
        },
        {
          name: 'Credit Limit',
          type: 'Currency Number',
          required: false,
          purpose: 'Caps maximum permissible unpaid accounts receivable balance.',
          functionality: 'POS/Sales invoice blocks finalization if invoice value pushes balance past limit.',
          validationRules: 'Positive number. Defaults to $0.00 (No credit allowed).',
        },
      ],
    },
    {
      id: 'suppliers_list',
      title: 'Suppliers Directory & Payables',
      menuPath: 'Contacts > Suppliers',
      whyItIsUsed:
        'Maintains records of vendors, raw material suppliers, manufacturers, and distributors who supply stock to the business, tracking payables liabilities and purchase histories.',
      howToUse: [
        '1. Click "Contacts" > "Suppliers" in the main navigation.',
        '2. Search for vendors by trade name, contact person, or tax registration ID.',
        '3. Inspect current Total Purchase Due (Accounts Payable) for each vendor.',
        '4. Click "Pay Due" to issue an outward payment voucher from Cash or Bank.',
        '5. Click "Ledger" to audit bills, returns (debit notes), and payments.',
      ],
      whereToEnterDate:
        'In the Suppliers List, the "Vendor Onboard Date" filter is available in the filter menu (Format: YYYY-MM-DD). Inside the Supplier Ledger statement, date inputs are "From Date [YYYY-MM-DD]" and "To Date [YYYY-MM-DD]" which define the accounting span for balancing accounts payable.',
      description:
        'Master list of inventory vendors, payment terms, tax IDs, and outstanding accounts payable balances.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Supplier & Vendor Directory',
        urlPath: 'https://pos.royal-erp.internal/#/contacts/suppliers',
        dateBadgeText: '📅 Payables Aging: Real-Time Current Ledger',
        primaryActionText: '+ Add New Supplier',
        mockColumns: ['Supplier ID', 'Supplier Name', 'Business / Company', 'Phone', 'Tax Number', 'Total Purchase Due', 'Actions'],
        mockRows: [
          { 'Supplier ID': 'SUP-101', 'Supplier Name': 'Acme Global Supplies', 'Business / Company': 'Acme Corp Ltd', Phone: '+1 555-0912', 'Tax Number': 'TAX-998811', 'Total Purchase Due': '$4,500.00', Actions: 'Ledger | Pay Bill' },
          { 'Supplier ID': 'SUP-102', 'Supplier Name': 'Pacific Wholesale Imports', 'Business / Company': 'Pacific Trading Co', Phone: '+1 555-0944', 'Tax Number': 'TAX-772244', 'Total Purchase Due': '$1,820.00', Actions: 'Ledger | Pay Bill' },
          { 'Supplier ID': 'SUP-103', 'Supplier Name': 'Zenith Packaging Materials', 'Business / Company': 'Zenith Pack Inc', Phone: '+1 555-0988', 'Tax Number': 'TAX-331199', 'Total Purchase Due': '$0.00', Actions: 'Ledger | Pay Bill' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Supplier Button',
          fieldOrSection: 'Top Right Header',
          instruction: 'Click to launch the supplier profile creation form.',
        },
        {
          pinNumber: 2,
          label: 'Payables Date Range Filter',
          fieldOrSection: 'Filter Drawer',
          instruction: 'Filter vendor bills by due date to prepare upcoming payment runs.',
          whereToEnterDate: 'Set Start and End dates in YYYY-MM-DD format in the filter panel.',
        },
        {
          pinNumber: 3,
          label: 'Total Purchase Due Column',
          fieldOrSection: 'Column 6 in Grid',
          instruction: 'Displays accounts payable liability owed to the vendor.',
        },
        {
          pinNumber: 4,
          label: 'Pay Bill Quick Action',
          fieldOrSection: 'Actions Column',
          instruction: 'Click Pay Bill to launch outward payment voucher dialog.',
        },
      ],
      fields: [
        {
          name: 'Supplier Business Name',
          type: 'Text',
          required: true,
          purpose: 'Legal trade name of the supplier company.',
          functionality: 'Appears on Purchase Orders, receiving vouchers, and financial ledgers.',
          validationRules: 'Minimum 2 characters.',
        },
        {
          name: 'Contact Person Name',
          type: 'Text',
          required: true,
          purpose: 'Name of the account manager or sales representative at the supplier.',
          functionality: 'Used for order follow-up and delivery coordination.',
          validationRules: 'Letters and spaces.',
        },
        {
          name: 'Payment Terms (Days)',
          type: 'Integer Number',
          required: false,
          purpose: 'Credit term duration (e.g. Net 15, Net 30, Net 60 days).',
          functionality: 'Automatically computes Due Date on Inward Purchase Orders.',
          validationRules: 'Non-negative integer (0 to 365).',
        },
      ],
    },
    {
      id: 'customer_groups',
      title: 'Customer Groups & Wholesale Pricing Tiers',
      menuPath: 'Contacts > Customer Groups',
      whyItIsUsed:
        'Organizes customers into distinct commercial brackets (e.g. Retail, Wholesale, Preferred Partner) with automated price adjustments or percentage discounts applied during POS sales.',
      howToUse: [
        '1. Go to Contacts > Customer Groups.',
        '2. Review existing tiers and their discount percentage calculation rules.',
        '3. Click "+ Add Customer Group".',
        '4. Enter Group Name (e.g. "Wholesale Bulk Tier B") and Calculation Percentage (e.g. 15.00%).',
        '5. Assign customers to this group to have discounts automatically reflected on invoices.',
      ],
      whereToEnterDate:
        'Customer Groups do not require date entry; however, seasonal group promotions can be audited by checking the creation timestamp displayed in the group details drawer in YYYY-MM-DD format.',
      description:
        'Tiered pricing groups applying automatic discounts and wholesale rates to classified customer accounts.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Customer Groups & Pricing Brackets',
        urlPath: 'https://pos.royal-erp.internal/#/contacts/customer-groups',
        dateBadgeText: '🏷️ Pricing Rules: Auto-Discount Active',
        primaryActionText: '+ Add Customer Group',
        mockColumns: ['Group ID', 'Group Name', 'Calculation Type', 'Discount % / Markup', 'Members Count', 'Status', 'Actions'],
        mockRows: [
          { 'Group ID': 'GRP-01', 'Group Name': 'Retail Standard', 'Calculation Type': 'Standard Retail Price', 'Discount % / Markup': '0.00%', 'Members Count': '248', Status: 'Active', Actions: 'Edit | View' },
          { 'Group ID': 'GRP-02', 'Group Name': 'Wholesale Tier A', 'Calculation Type': 'Percentage Discount', 'Discount % / Markup': '10.00%', 'Members Count': '32', Status: 'Active', Actions: 'Edit | View' },
          { 'Group ID': 'GRP-03', 'Group Name': 'VIP Corporate', 'Calculation Type': 'Percentage Discount', 'Discount % / Markup': '15.00%', 'Members Count': '14', Status: 'Active', Actions: 'Edit | View' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Customer Group Action',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to open the customer group configuration modal.',
        },
        {
          pinNumber: 2,
          label: 'Discount Calculation Percentage (%)',
          fieldOrSection: 'Data Grid Column 4',
          instruction: 'Specifies the price deduction auto-applied to all products at POS checkout.',
        },
        {
          pinNumber: 3,
          label: 'Members Count',
          fieldOrSection: 'Data Grid Column 5',
          instruction: 'Shows the number of registered clients enrolled in this pricing bracket.',
        },
      ],
      fields: [
        {
          name: 'Customer Group Name',
          type: 'Text',
          required: true,
          purpose: 'Label identifying the client pricing category.',
          functionality: 'Selected in Customer Profile to bind group discount rules.',
          validationRules: 'Minimum 3 characters.',
        },
        {
          name: 'Calculation Percentage',
          type: 'Decimal',
          required: true,
          purpose: 'Percentage reduction applied to selling price for group members.',
          functionality: 'Auto-applies price adjustment on POS and Sales invoice line items.',
          validationRules: 'Number between 0.00% and 100.00%.',
        },
      ],
    },
    {
      id: 'add_contact_form',
      title: 'Add Customer / Supplier Master Form',
      menuPath: 'Contacts > Add Customer / Supplier',
      whyItIsUsed:
        'Unified registration interface to create new commercial counterparties (Customers, Suppliers, or Both) with contact details, tax numbers, credit limits, opening balance, and billing address.',
      howToUse: [
        '1. Click "+ Add Contact" in the sidebar or from the Customers/Suppliers list.',
        '2. Choose Contact Type: "Customer", "Supplier", or "Both".',
        '3. Input Contact Name, Mobile Number, Email, and Business Trade Name.',
        '4. Enter Opening Balance [Amount] and Opening Balance Date [YYYY-MM-DD].',
        '5. Specify Credit Limit and Credit Payment Terms (Days).',
        '6. Fill in Billing and Shipping Address lines, City, State, Country, and Postal Code.',
        '7. Click "Save Contact" to record the party in the ERP.',
      ],
      whereToEnterDate:
        'In the Add Contact Form, date entry occurs in the "Opening Balance Date" field located in the Financial & Balances section. Input the date in YYYY-MM-DD format (e.g. 2026-10-04). This sets the accounting baseline timestamp for opening receivables or payables before subsequent invoices are generated.',
      description:
        'Unified counterparty creation form with tax details, credit limits, opening balance dates, and address blocks.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Register Commercial Contact',
        urlPath: 'https://pos.royal-erp.internal/#/contacts/add',
        dateBadgeText: '📅 Opening Balance Baseline Date: Required [YYYY-MM-DD]',
        primaryActionText: 'Save Contact Record',
        formSections: [
          {
            title: '1. Contact Classification & Identity',
            fields: [
              { label: 'Contact Type *', placeholder: 'Select: Customer / Supplier / Both', isRequired: true, pinNumber: 1 },
              { label: 'Primary Contact Name *', placeholder: 'e.g. Robert Harrison', isRequired: true },
              { label: 'Business / Company Name', placeholder: 'e.g. Apex Hardware Supplies Ltd' },
              { label: 'Mobile Number *', placeholder: '+1 555-0142', isRequired: true, pinNumber: 2 },
              { label: 'Email Address', placeholder: 'robert@apexhardware.com' },
            ],
          },
          {
            title: '2. Tax Identifiers & Credit Terms',
            fields: [
              { label: 'Tax Registration (GSTIN / VAT)', placeholder: 'e.g. 27AABCS1429B1Z', pinNumber: 3 },
              { label: 'Customer Group', placeholder: 'Select: Wholesale Tier A' },
              { label: 'Credit Limit ($)', placeholder: '$10,000.00', pinNumber: 4 },
              { label: 'Payment Terms (Days)', placeholder: '30 Days' },
            ],
          },
          {
            title: '3. Opening Balances & Accounting Date',
            fields: [
              { label: 'Opening Balance ($)', placeholder: '$0.00 (or previous debt balance)' },
              { label: 'Opening Balance Date *', placeholder: 'YYYY-MM-DD (e.g. 2026-10-04)', isDate: true, isRequired: true, pinNumber: 5 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Contact Type Selector (Customer / Supplier / Both)',
          fieldOrSection: 'Section 1: Classification',
          instruction: 'Select whether this party is a buyer, vendor, or dual trading partner.',
        },
        {
          pinNumber: 2,
          label: 'Mobile Telephone Number',
          fieldOrSection: 'Section 1: Contact Details',
          instruction: 'Mandatory field used for POS phone lookup and WhatsApp invoice dispatch.',
        },
        {
          pinNumber: 3,
          label: 'Tax Registration (GSTIN / VAT ID)',
          fieldOrSection: 'Section 2: Tax Details',
          instruction: 'Enter commercial tax number for B2B input tax credit eligibility.',
        },
        {
          pinNumber: 4,
          label: 'Credit Limit Amount',
          fieldOrSection: 'Section 2: Credit Terms',
          instruction: 'Set maximum allowed accounts receivable debt ceiling.',
        },
        {
          pinNumber: 5,
          label: 'Opening Balance Date Field',
          fieldOrSection: 'Section 3: Opening Financials',
          instruction: 'Select the baseline ledger date for starting debt or credit in YYYY-MM-DD format.',
          whereToEnterDate: 'Opening Balance Date calendar input: Specify format YYYY-MM-DD.',
        },
        {
          pinNumber: 6,
          label: 'Save Contact Primary Action',
          fieldOrSection: 'Bottom Action Bar',
          instruction: 'Click to write record into the database.',
        },
      ],
      fields: [
        {
          name: 'Contact Type',
          type: 'Select (Customer | Supplier | Both)',
          required: true,
          purpose: 'Determines whether party appears in Sales or Purchase workflows.',
          functionality: 'Controls display in checkout dropdowns and invoice registers.',
          validationRules: 'Must select one of the three options.',
        },
        {
          name: 'Opening Balance Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Timestamp for the initial ledger balance transferred from legacy systems.',
          functionality: 'Dictates the beginning balance row on generated customer statement PDFs.',
          validationRules: 'Valid calendar date.',
        },
        {
          name: 'Billing Address Line',
          type: 'Text Area',
          required: false,
          purpose: 'Physical address for invoicing and tax jurisdiction determination.',
          functionality: 'Printed on official Tax Invoices.',
          validationRules: 'Maximum 200 characters.',
        },
      ],
    },
    {
      id: 'customer_ledger',
      title: 'Customer Ledger & Statement of Accounts',
      menuPath: 'Contacts > Customer Ledger',
      whyItIsUsed:
        'Provides a complete, chronologically sorted financial statement of all debit invoices, credit notes, payments received, and running balance for any selected customer.',
      howToUse: [
        '1. Select "Customer Ledger" from the Contacts menu.',
        '2. Choose the Customer from the dropdown search selector.',
        '3. Select the Statement Date Period: From Date [YYYY-MM-DD] to To Date [YYYY-MM-DD].',
        '4. Click "Generate Statement" to view all debit invoices, payment vouchers, and running balance.',
        '5. Click "Print Statement" or "Download PDF" to send the account summary to the client.',
      ],
      whereToEnterDate:
        'In Customer Ledger, date entry occurs in two explicit fields at the top of the screen: 1) "Statement From Date [YYYY-MM-DD]" and 2) "Statement To Date [YYYY-MM-DD]". Each transaction row within the ledger displays its immutable "Transaction Date" [YYYY-MM-DD HH:MM] representing the exact moment the invoice or receipt was executed.',
      description:
        'Chronological double-entry customer statement displaying opening balances, debit invoices, payment credits, and running balance.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Customer Financial Statement of Accounts',
        urlPath: 'https://pos.royal-erp.internal/#/contacts/customer-ledger',
        dateBadgeText: '📅 Statement Period: 2026-10-01 to 2026-10-31 [Monthly Audit]',
        primaryActionText: 'Export PDF Statement',
        mockColumns: ['Date & Time', 'Reference No', 'Transaction Type', 'Debit (+)', 'Credit (-)', 'Running Balance', 'Payment Mode'],
        mockRows: [
          { 'Date & Time': '2026-10-01 09:00', 'Reference No': 'OPB-001', 'Transaction Type': 'Opening Balance', 'Debit (+)': '$1,000.00', 'Credit (-)': '$0.00', 'Running Balance': '$1,000.00', 'Payment Mode': 'Initial' },
          { 'Date & Time': '2026-10-08 14:22', 'Reference No': 'INV-2026-089', 'Transaction Type': 'Sales Invoice', 'Debit (+)': '$2,450.00', 'Credit (-)': '$0.00', 'Running Balance': '$3,450.00', 'Payment Mode': 'Credit Sale' },
          { 'Date & Time': '2026-10-15 11:30', 'Reference No': 'REC-2026-042', 'Transaction Type': 'Payment Receipt', 'Debit (+)': '$0.00', 'Credit (-)': '$1,000.00', 'Running Balance': '$2,450.00', 'Payment Mode': 'Bank Wire' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Customer Account Selector',
          fieldOrSection: 'Top Selection Dropdown',
          instruction: 'Select customer whose financial statement you want to audit.',
        },
        {
          pinNumber: 2,
          label: 'Statement From Date & To Date',
          fieldOrSection: 'Top Date Boundary Bar',
          instruction: 'Specify the fiscal start and end date for ledger calculation.',
          whereToEnterDate: 'From Date [YYYY-MM-DD] and To Date [YYYY-MM-DD] date inputs.',
        },
        {
          pinNumber: 3,
          label: 'Debit vs Credit Running Balance Table',
          fieldOrSection: 'Center Ledger Data Grid',
          instruction: 'Shows invoice debits, payment receipts, and cumulative balance.',
        },
        {
          pinNumber: 4,
          label: 'Export Statement & Send WhatsApp',
          fieldOrSection: 'Top Right Utility Buttons',
          instruction: 'Download formal PDF ledger or send payment link directly to customer.',
        },
      ],
      fields: [
        {
          name: 'Statement Date Range',
          type: 'Dual Date Picker (From Date & To Date)',
          required: true,
          purpose: 'Sets temporal boundary for ledger calculations.',
          functionality: 'Filters all sales, payments, and credit notes between selected dates.',
          validationRules: 'From Date cannot be later than To Date.',
        },
        {
          name: 'Running Balance Column',
          type: 'Computed Currency',
          required: false,
          purpose: 'Displays cumulative unpaid balance after each transactional event.',
          functionality: 'Calculated as: Previous Balance + Debit - Credit.',
          validationRules: 'Read-only financial output.',
        },
      ],
    },
    {
      id: 'supplier_ledger',
      title: 'Supplier Ledger & Purchase Bill Payables',
      menuPath: 'Contacts > Supplier Ledger',
      whyItIsUsed:
        'Audits vendor accounts payable, showing inward purchase bills, payments issued, purchase return debit notes, and outstanding amounts owed to each supplier.',
      howToUse: [
        '1. Open "Supplier Ledger" from the Contacts menu.',
        '2. Choose the Supplier from the dropdown list.',
        '3. Select Date Range (From Date [YYYY-MM-DD] to To Date [YYYY-MM-DD]).',
        '4. Review inward bill debits, payments made, and current payable balance.',
        '5. Export PDF to reconcile vendor invoices against vendor-provided account statements.',
      ],
      whereToEnterDate:
        'In the Supplier Ledger, date filtering is defined by "Period Start Date [YYYY-MM-DD]" and "Period End Date [YYYY-MM-DD]" at the top of the view. Each entry row notes its "Bill / Payment Date" in YYYY-MM-DD format.',
      description:
        'Chronological vendor ledger tracking purchase order debits, outgoing payment disbursements, and net payables.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Supplier Accounts Payable Ledger',
        urlPath: 'https://pos.royal-erp.internal/#/contacts/supplier-ledger',
        dateBadgeText: '📅 Audit Cycle: 2026-10-01 to 2026-10-31',
        primaryActionText: 'Export Vendor Ledger',
        mockColumns: ['Bill Date', 'Ref / Voucher No', 'Event Type', 'Inward Bill (+)', 'Paid Amount (-)', 'Net Due Payable', 'Status'],
        mockRows: [
          { 'Bill Date': '2026-10-02', 'Ref / Voucher No': 'PO-8812', 'Event Type': 'Purchase Bill', 'Inward Bill (+)': '$4,500.00', 'Paid Amount (-)': '$0.00', 'Net Due Payable': '$4,500.00', Status: 'Due' },
          { 'Bill Date': '2026-10-12', 'Ref / Voucher No': 'VCH-991', 'Event Type': 'Supplier Payment', 'Inward Bill (+)': '$0.00', 'Paid Amount (-)': '$2,000.00', 'Net Due Payable': '$2,500.00', Status: 'Partial' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Supplier Dropdown Selector',
          fieldOrSection: 'Top Control Bar',
          instruction: 'Select vendor to load accounts payable record.',
        },
        {
          pinNumber: 2,
          label: 'Ledger Date Bounds',
          fieldOrSection: 'Top Date Picker',
          instruction: 'Specify start and end dates to compute net balance owed.',
          whereToEnterDate: 'Enter Start and End dates in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Net Due Payable Balance',
          fieldOrSection: 'Ledger Summary Header',
          instruction: 'Summarizes remaining liability to be disbursed.',
        },
      ],
      fields: [
        {
          name: 'Supplier Selector',
          type: 'Select Dropdown',
          required: true,
          purpose: 'Selects the vendor whose ledger is being audited.',
          functionality: 'Queries inward purchase bills and payment disbursements.',
          validationRules: 'Must select an active registered supplier.',
        },
      ],
    },
    {
      id: 'import_contacts',
      title: 'Bulk Contact CSV / Excel Import',
      menuPath: 'Contacts > Import Contacts',
      whyItIsUsed:
        'Allows bulk onboarding of hundreds or thousands of customer and supplier records from external spreadsheets, legacy ERPs, or accounting packages with automated column validation.',
      howToUse: [
        '1. Navigate to Contacts > Import Contacts.',
        '2. Download the sample CSV template by clicking "Download Sample Template".',
        '3. Populate columns: Name, Mobile, Email, Tax Number, Contact Type (Customer/Supplier), Credit Limit, Opening Balance.',
        '4. Upload the completed CSV file.',
        '5. Review data preview and mapping verification.',
        '6. Click "Start Bulk Import" to commit valid records.',
      ],
      whereToEnterDate:
        'In the CSV template, date entry is provided in the "opening_balance_date" column using format YYYY-MM-DD (e.g. 2026-10-04). Any row without a date defaults to the current system date.',
      description:
        'Bulk importer for customer and supplier records with validation mapping, error reporting, and sample templates.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Bulk Contact CSV Importer',
        urlPath: 'https://pos.royal-erp.internal/#/contacts/import',
        dateBadgeText: '📄 Supported Formats: .CSV, .XLSX | Max: 5,000 Rows',
        primaryActionText: 'Upload & Process File',
        formSections: [
          {
            title: '1. Download Standard Template',
            fields: [
              { label: 'Sample CSV File', placeholder: 'Download "contacts_import_template.csv" (Click to download)', pinNumber: 1 },
            ],
          },
          {
            title: '2. Select & Upload File',
            fields: [
              { label: 'Choose File *', placeholder: 'Drag & drop contacts.csv or click Browse', isRequired: true, pinNumber: 2 },
              { label: 'Default Contact Type', placeholder: 'Select: Customer (if not specified in CSV)', pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Download Sample Template Button',
          fieldOrSection: 'Top Download Card',
          instruction: 'Download official CSV with pre-configured column headers.',
        },
        {
          pinNumber: 2,
          label: 'File Drag & Drop Upload Zone',
          fieldOrSection: 'Upload Container',
          instruction: 'Select or drag your completed contacts CSV file.',
        },
        {
          pinNumber: 3,
          label: 'Import Execution Button',
          fieldOrSection: 'Bottom Action Bar',
          instruction: 'Click to parse, validate, and write contacts into the database.',
        },
      ],
      fields: [
        {
          name: 'CSV File Upload',
          type: 'File Picker (.csv, .xlsx)',
          required: true,
          purpose: 'Source spreadsheet containing batch contact records.',
          functionality: 'Parsed on client and server to validate phone uniqueness and email formats.',
          validationRules: 'File size must not exceed 10 MB.',
        },
      ],
    },
  ],
  bestPractices: [
    'Always enter mobile phone numbers with standard formatting to ensure SMS and WhatsApp receipts deliver reliably.',
    'Set realistic Credit Limits for B2B buyers to prevent unmanageable accounts receivable debt.',
    'Reconcile Customer and Supplier Ledgers at the end of each calendar month.',
  ],
  troubleshooting: [
    {
      issue: 'Customer cannot be given credit during POS sale',
      solution:
        'Check the customer’s profile under Contacts > Customers. Ensure their Credit Limit is greater than $0.00 and that their current Total Due has not exceeded the limit.',
    },
    {
      issue: 'Import Contacts fails with validation errors',
      solution:
        'Ensure that phone numbers do not contain invalid characters, that email addresses are formatted properly, and that dates follow the YYYY-MM-DD pattern.',
    },
  ],
};
