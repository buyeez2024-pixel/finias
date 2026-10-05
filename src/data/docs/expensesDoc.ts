import { DocModule } from './types';

export const expensesDoc: DocModule = {
  id: 'expenses',
  title: '8. Expense Management & Operational Overheads',
  category: 'Financial Accounting & Cash Outflow',
  iconName: 'CreditCard',
  overview:
    'Tracks non-inventory operational overheads: facility rent, electricity utilities, staff payroll, transport fuel, packaging supplies, and marketing campaigns to compute true net operating profit on the Profit & Loss statement.',
  workflowSteps: [
    {
      step: 1,
      title: 'Classify Overhead Expense Heads',
      description:
        'Create Expense Categories (e.g. Utility Bills, Store Rent, Staff Travel, Advertising, Office Supplies).',
    },
    {
      step: 2,
      title: 'Record Outflow Expense Voucher',
      description:
        'Fill in the Expense Voucher: select category, location, expense date, total amount, tax deducted, and payment account (Cash or Bank).',
      tips: 'Attach physical receipt photo or PDF bill to maintain tax audit documentation.',
    },
    {
      step: 3,
      title: 'Audit Cash Drawer Deductions',
      description:
        'If paid from a retail cash register, verify that drawer balances automatically adjust on cashier shift reports.',
    },
    {
      step: 4,
      title: 'Reconcile on Profit & Loss Statement',
      description:
        'Aggregated categorized expenses automatically subtract from gross sales profit to calculate final Net Operating Income.',
    },
  ],
  submenus: [
    {
      id: 'expense_vouchers',
      title: 'All Expenses & Voucher Register',
      menuPath: 'Expenses > Expenses List',
      whyItIsUsed:
        'Central searchable ledger of all recorded business expenses, tracking reference numbers, expense categories, outlet locations, payment modes, amounts, and receipt attachments.',
      howToUse: [
        '1. Click "Expenses" in the primary navigation sidebar.',
        '2. Filter by Business Location, Expense Category, Payment Mode, or Date Range.',
        '3. Inspect the total cumulative expense tally displayed in the summary cards.',
        '4. Click "View Voucher" to see line details and attached receipt documents.',
        '5. Click "Edit" or "Delete" to adjust erroneous expense entries.',
      ],
      whereToEnterDate:
        'In the Expenses Register, use the "Expense Date Range Filter" [YYYY-MM-DD] at the top-right to isolate expenses incurred within a specific accounting period. Each expense row displays the official "Voucher Date" [YYYY-MM-DD] when the expenditure was approved and paid.',
      description:
        'Master register of operational overhead vouchers, categorized spending, and payment account allocations.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Operational Overheads & Expenses Register',
        urlPath: 'https://pos.royal-erp.internal/#/expenses/list',
        dateBadgeText: '📅 Expense Scope: 2026-10-01 to 2026-10-04 | FY 2026-27',
        primaryActionText: '+ Add New Expense',
        filterOptions: ['All Locations', 'Utilities & Electricity', 'Facility Rent', 'Office Supplies', 'Staff Welfare', 'Marketing'],
        mockColumns: ['Voucher Date', 'Ref No', 'Location', 'Expense Category', 'Expense For', 'Payment Account', 'Total Amount', 'Actions'],
        mockRows: [
          { 'Voucher Date': '2026-10-01', 'Ref No': 'EXP-2026-081', Location: 'Main Flagship', 'Expense Category': 'Facility Rent', 'Expense For': 'Commercial Shop Rent (Oct)', 'Payment Account': 'Primary Business Bank', 'Total Amount': '$2,500.00', Actions: 'View | Receipt | Edit' },
          { 'Voucher Date': '2026-10-03', 'Ref No': 'EXP-2026-082', Location: 'Main Flagship', 'Expense Category': 'Utility Bills', 'Expense For': 'Electricity Bill (Sep)', 'Payment Account': 'Primary Business Bank', 'Total Amount': '$340.50', Actions: 'View | Receipt | Edit' },
          { 'Voucher Date': '2026-10-04', 'Ref No': 'EXP-2026-083', Location: 'East Counter', 'Expense Category': 'Office Supplies', 'Expense For': 'Thermal Paper Rolls (50 Rolls)', 'Payment Account': 'Petty Cash Drawer', 'Total Amount': '$65.00', Actions: 'View | Receipt | Edit' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Expense Primary Action',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'Click to launch the expense entry voucher dialog.',
        },
        {
          pinNumber: 2,
          label: 'Expense Date Range Filter',
          fieldOrSection: 'Top Filter Bar',
          instruction: 'Filter overhead expenditures within specific calendar dates.',
          whereToEnterDate: 'Click to specify Start Date and End Date in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Expense Category & Account Columns',
          fieldOrSection: 'Grid Columns 4 & 6',
          instruction: 'Shows budget classification and funding source (Petty Cash vs Bank Wire).',
        },
        {
          pinNumber: 4,
          label: 'View Receipt & Voucher Actions',
          fieldOrSection: 'Rightmost Column',
          instruction: 'Inspect scanned vendor invoice or download accounting voucher PDF.',
        },
      ],
      fields: [
        {
          name: 'Voucher Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Official transaction date for general ledger expense entry.',
          functionality: 'Dictates the fiscal month for P&L net margin calculations.',
          validationRules: 'Cannot be in the future.',
        },
        {
          name: 'Total Amount',
          type: 'Currency Number',
          required: true,
          purpose: 'Total cash outflow spent on the expense.',
          functionality: 'Deducted from the designated cash or bank account ledger balance.',
          validationRules: 'Positive number (> $0.00).',
        },
      ],
    },
    {
      id: 'add_expense_form',
      title: 'Add Operational Expense Voucher Form',
      menuPath: 'Expenses > Add Expense',
      whyItIsUsed:
        'Records a new business overhead expenditure, allocating the cost to a specific store location, budget category, vendor payee, and funding source (cash register drawer or corporate bank account).',
      howToUse: [
        '1. Go to Expenses > Add Expense.',
        '2. Select Business Location and Expense Category.',
        '3. Enter Expense Date [YYYY-MM-DD].',
        '4. Fill in "Expense For" note (e.g. October Store Rent) and specify Total Amount ($).',
        '5. Select Payment Account (e.g. Petty Cash Drawer or Business Checking Bank).',
        '6. Select Payment Method (Cash, Cheque, Bank Transfer, Debit Card).',
        '7. Upload an image or PDF of the vendor invoice/receipt for tax audit compliance.',
        '8. Click "Save Expense" to deduct cash and post the debit voucher.',
      ],
      whereToEnterDate:
        'In the Add Expense form, date entry occurs in the "Expense Date [YYYY-MM-DD]" field located in Section 1 (Header). Specify the date the funds were disbursed to ensure accurate cash register reconciliation.',
      description:
        'Expense voucher entry screen with receipt attachment upload, tax inputs, and funding account selection.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Create Operational Expense Voucher',
        urlPath: 'https://pos.royal-erp.internal/#/expenses/add',
        dateBadgeText: '📅 Expense Date: Required [YYYY-MM-DD] | General Ledger Linked',
        primaryActionText: 'Save & Disburse Expense',
        formSections: [
          {
            title: '1. Expense Classification & Date',
            fields: [
              { label: 'Business Location *', placeholder: 'Select: Main Flagship Store', isRequired: true, pinNumber: 1 },
              { label: 'Expense Category *', placeholder: 'Select: Utility Bills (Electricity & Water)', isRequired: true },
              { label: 'Expense Date *', placeholder: 'YYYY-MM-DD (e.g. 2026-10-04)', isDate: true, isRequired: true, pinNumber: 2 },
              { label: 'Reference Voucher No', placeholder: 'Auto: EXP-2026-0084' },
            ],
          },
          {
            title: '2. Payment Outflow & Funding Account',
            fields: [
              { label: 'Total Amount ($) *', placeholder: '$340.50', isRequired: true, pinNumber: 3 },
              { label: 'Funding Payment Account *', placeholder: 'Select: Primary Business Checking Bank', isRequired: true, pinNumber: 4 },
              { label: 'Payment Method', placeholder: 'Select: Bank Wire / Online Transfer' },
            ],
          },
          {
            title: '3. Description & Receipt Attachment',
            fields: [
              { label: 'Expense Purpose / Note', placeholder: 'e.g. Electricity bill for September 2026' },
              { label: 'Attach Scanned Receipt', placeholder: 'Upload bill_receipt.pdf or .jpg (Click to upload)', pinNumber: 5 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Location Selector',
          fieldOrSection: 'Section 1: Facility',
          instruction: 'Select branch bearing the operational cost.',
        },
        {
          pinNumber: 2,
          label: 'Expense Date Calendar Input',
          fieldOrSection: 'Section 1: Date Input',
          instruction: 'Specify disbursement date in YYYY-MM-DD format.',
          whereToEnterDate: 'Expense Date input field: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Expense Outflow Amount',
          fieldOrSection: 'Section 2: Monetary Value',
          instruction: 'Input the exact currency amount spent.',
        },
        {
          pinNumber: 4,
          label: 'Funding Payment Account',
          fieldOrSection: 'Section 2: Funding Source',
          instruction: 'Choose whether payment came from Cash Register or Bank Account.',
        },
        {
          pinNumber: 5,
          label: 'Attach Receipt File',
          fieldOrSection: 'Section 3: Document Proof',
          instruction: 'Attach digital receipt photo or PDF for audit verification.',
        },
      ],
      fields: [
        {
          name: 'Expense Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Official timestamp for cash outflow.',
          functionality: 'Deducted from general ledger and cash drawer reports on this date.',
          validationRules: 'Valid calendar date.',
        },
        {
          name: 'Expense Category',
          type: 'Select Dropdown',
          required: true,
          purpose: 'Classifies overhead into standardized accounting heads.',
          functionality: 'Aggregates onto Profit & Loss statement breakdown.',
          validationRules: 'Must select an existing active category.',
        },
      ],
    },
    {
      id: 'expense_categories',
      title: 'Expense Categories & Budget Centers',
      menuPath: 'Expenses > Expense Categories',
      whyItIsUsed:
        'Configures standardized overhead classifications (e.g. Rent, Utilities, Logistics, Payroll, Travel, Marketing) and sub-categories to enable detailed departmental budget audits and expenditure analysis.',
      howToUse: [
        '1. Go to Expenses > Expense Categories.',
        '2. Review existing categories and associated voucher counts.',
        '3. Click "+ Add Expense Category".',
        '4. Provide Category Name (e.g. "Software & Cloud Subscriptions") and Category Code.',
        '5. If creating a sub-category, choose the Parent Category.',
        '6. Click "Save Category".',
      ],
      whereToEnterDate:
        'Expense categories are master taxonomy entities without date inputs. Expenditure velocity across categories is audited by selecting date ranges in the Profit & Loss statement in YYYY-MM-DD format.',
      description:
        'Master taxonomy of operational expenditure classifications and sub-categories.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Expense Categories & Budget Classifications',
        urlPath: 'https://pos.royal-erp.internal/#/expenses/categories',
        dateBadgeText: '📁 Expense Taxonomies: 12 Categories Active',
        primaryActionText: '+ Add Expense Category',
        mockColumns: ['Category Code', 'Category Name', 'Sub-Category Of', 'Total Expenses Incurred', 'Status', 'Actions'],
        mockRows: [
          { 'Category Code': 'EXP-RENT', 'Category Name': 'Facility Rent', 'Sub-Category Of': 'None (Parent)', 'Total Expenses Incurred': '$25,000.00', Status: 'Active', Actions: 'Edit | Delete' },
          { 'Category Code': 'EXP-UTIL', 'Category Name': 'Utility Bills', 'Sub-Category Of': 'None (Parent)', 'Total Expenses Incurred': '$3,420.00', Status: 'Active', Actions: 'Edit | Delete' },
          { 'Category Code': 'EXP-OFFC', 'Category Name': 'Office Supplies & Stationery', 'Sub-Category Of': 'None (Parent)', 'Total Expenses Incurred': '$890.00', Status: 'Active', Actions: 'Edit | Delete' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Category Button',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to open the expense category modal.',
        },
        {
          pinNumber: 2,
          label: 'Total Expenses Incurred',
          fieldOrSection: 'Grid Column 4',
          instruction: 'Aggregated lifetime spending recorded under this accounting head.',
        },
      ],
      fields: [
        {
          name: 'Category Name',
          type: 'Text',
          required: true,
          purpose: 'Label identifying the budget category.',
          functionality: 'Selected when recording operational expenses.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
  ],
  bestPractices: [
    'Always attach scanned receipt photos or PDF invoices to expense vouchers to ensure tax deductibility during corporate audits.',
    'Differentiate between petty cash counter expenses and bank wire disbursements to maintain accurate physical drawer balances.',
    'Review the Monthly Expense report to identify and curb discretionary operational cost inflation.',
  ],
  troubleshooting: [
    {
      issue: 'Cash drawer closing total is short at end of day',
      solution:
        'Verify if a cashier paid a vendor or delivery driver in cash without recording an Expense Voucher. Record the expense with funding account set to "Cash Drawer" to reconcile.',
    },
  ],
};
