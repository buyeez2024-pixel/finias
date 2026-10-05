import { DocModule } from './types';

export const accountsDoc: DocModule = {
  id: 'accounts',
  title: '9. Payment Accounts & Financial Ledgers',
  category: 'Treasury & Double-Entry Accounting',
  iconName: 'Landmark',
  overview:
    'Core double-entry treasury and monetary ledger management: physical cash drawers, petty cash vaults, multi-currency commercial bank accounts, inter-account fund transfers, Chart of Accounts, and Trial Balance generation.',
  workflowSteps: [
    {
      step: 1,
      title: 'Configure Chart of Accounts & Bank Accounts',
      description:
        'Set up financial asset accounts (e.g. Counter Cash Drawer, Corporate Checking Bank, Savings Reserve) with Opening Balances and account numbers.',
    },
    {
      step: 2,
      title: 'Map Sales & Purchase Inflows/Outflows',
      description:
        'Configure default accounts for POS cash receipts, card swipes, UPI online settlements, and supplier payment vouchers.',
    },
    {
      step: 3,
      title: 'Execute Inter-Account Fund Transfers (Contra Entries)',
      description:
        'Transfer cash collections from retail counter drawers to the corporate bank deposit vault, logging reference numbers and transfer dates.',
    },
    {
      step: 4,
      title: 'Audit Trial Balance & Balance Sheet',
      description:
        'Verify total debit and credit equality across all general ledger accounts at the close of every financial period.',
    },
  ],
  submenus: [
    {
      id: 'accounts_management',
      title: 'Bank & Cash Accounts Management',
      menuPath: 'Accounts > Payment Accounts',
      whyItIsUsed:
        'Tracks physical cash drawers, safe vaults, and commercial bank accounts, displaying account numbers, routing codes, opening balances, real-time current balances, and transaction histories.',
      howToUse: [
        '1. Click "Accounts" in the sidebar navigation.',
        '2. Review existing cash and bank accounts with current balances.',
        '3. Click "+ Add Payment Account" to register a new bank or cash drawer.',
        '4. Enter Account Name (e.g. "Chase Commercial Checking"), Account Number, and Opening Balance.',
        '5. Specify Opening Balance Date [YYYY-MM-DD].',
        '6. Click "Account Book" to view the detailed statement of all deposits and withdrawals.',
      ],
      whereToEnterDate:
        'When creating or editing a Payment Account, date entry occurs in the "Opening Balance Date [YYYY-MM-DD]" field. In the Account Book statement, date selection is performed via "Statement From Date [YYYY-MM-DD]" and "Statement To Date [YYYY-MM-DD]".',
      description:
        'Treasury register managing corporate bank accounts, physical cash drawers, and current liquid balances.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Financial Payment Accounts & Treasury',
        urlPath: 'https://pos.royal-erp.internal/#/accounts/list',
        dateBadgeText: '🏦 Treasury Status: Multi-Account Liquidity Live',
        primaryActionText: '+ Add New Account',
        mockColumns: ['Account Name', 'Account # / Type', 'Branch Assigned', 'Opening Balance', 'Current Balance', 'Actions'],
        mockRows: [
          { 'Account Name': 'Counter Cash Drawer #01', 'Account # / Type': 'Cash in Hand', 'Branch Assigned': 'Main Flagship', 'Opening Balance': '$500.00', 'Current Balance': '$3,450.00', Actions: 'Book | Transfer | Edit' },
          { 'Account Name': 'Primary Business Checking', 'Account # / Type': 'Bank (Acct: ...8821)', 'Branch Assigned': 'All Branches', 'Opening Balance': '$50,000.00', 'Current Balance': '$148,220.50', Actions: 'Book | Transfer | Edit' },
          { 'Account Name': 'Petty Cash Reserve', 'Account # / Type': 'Cash Vault', 'Branch Assigned': 'East Counter', 'Opening Balance': '$300.00', 'Current Balance': '$240.00', Actions: 'Book | Transfer | Edit' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Account Primary Button',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to open the cash/bank account creation dialog.',
        },
        {
          pinNumber: 2,
          label: 'Current Balance Column',
          fieldOrSection: 'Grid Column 5',
          instruction: 'Real-time liquid balance updated automatically on sales and expenses.',
        },
        {
          pinNumber: 3,
          label: 'Account Book & Fund Transfer Actions',
          fieldOrSection: 'Actions Column',
          instruction: 'Open statement of transactions or initiate an inter-account transfer.',
        },
      ],
      fields: [
        {
          name: 'Account Name',
          type: 'Text',
          required: true,
          purpose: 'Label identifying the bank or cash drawer.',
          functionality: 'Selected in checkout and expense forms.',
          validationRules: 'Minimum 2 characters.',
        },
        {
          name: 'Opening Balance',
          type: 'Currency Number',
          required: true,
          purpose: 'Starting liquidity amount when initializing the ERP.',
          functionality: 'Establishes beginning baseline for the account ledger.',
          validationRules: 'Non-negative number.',
        },
      ],
    },
    {
      id: 'account_transactions',
      title: 'Account Ledger Transactions & Fund Transfers',
      menuPath: 'Accounts > Account Transactions',
      whyItIsUsed:
        'Records contra entries and inter-account money transfers (e.g. depositing counter cash into the commercial bank, or replenishing petty cash from the checking account), with full audit tracking.',
      howToUse: [
        '1. Go to Accounts > Account Transactions.',
        '2. Click "+ Transfer Funds (Contra)".',
        '3. Select From Account (Source of funds) and To Account (Destination of funds).',
        '4. Enter Transfer Amount ($) and Transfer Date [YYYY-MM-DD].',
        '5. Input Reference / Cheque Number and Purpose / Notes.',
        '6. Click "Submit Transfer" to simultaneously debit source and credit destination accounts.',
      ],
      whereToEnterDate:
        'In the Fund Transfer form, enter the "Transfer Date [YYYY-MM-DD]" at the top. This sets the timestamp for double-entry ledger balance updates across both accounts.',
      description:
        'Inter-account fund transfer module executing contra entries between cash drawers and bank accounts.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Inter-Account Transfers & Contra Transactions',
        urlPath: 'https://pos.royal-erp.internal/#/accounts/transactions',
        dateBadgeText: '📅 Ledger Scope: 2026-10-01 to 2026-10-04 | Contra Entries Active',
        primaryActionText: '+ Transfer Funds (Contra)',
        mockColumns: ['Transfer Date', 'Ref / Voucher #', 'From Account (Debit)', 'To Account (Credit)', 'Amount', 'Initiated By', 'Actions'],
        mockRows: [
          { 'Transfer Date': '2026-10-02', 'Ref / Voucher #': 'TRF-0012', 'From Account (Debit)': 'Counter Cash Drawer #01', 'To Account (Credit)': 'Primary Business Checking', Amount: '$2,000.00', 'Initiated By': 'Alexander V.', Actions: 'View Receipt | Print' },
          { 'Transfer Date': '2026-10-04', 'Ref / Voucher #': 'TRF-0013', 'From Account (Debit)': 'Primary Business Checking', 'To Account (Credit)': 'Petty Cash Reserve', Amount: '$500.00', 'Initiated By': 'Elena R.', Actions: 'View Receipt | Print' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Transfer Funds Button',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'Click to launch the inter-account money transfer modal.',
        },
        {
          pinNumber: 2,
          label: 'Transfer Date Input',
          fieldOrSection: 'Transfer Modal Header',
          instruction: 'Specify the physical deposit or transfer date in YYYY-MM-DD format.',
          whereToEnterDate: 'Transfer Date field: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'From & To Account Mapping',
          fieldOrSection: 'Transfer Form Dropdowns',
          instruction: 'Select source account to debit and target account to credit.',
        },
      ],
      fields: [
        {
          name: 'Transfer Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Timestamp for the contra money movement.',
          functionality: 'Updates balances on both accounts simultaneously.',
          validationRules: 'Cannot be in the future.',
        },
      ],
    },
    {
      id: 'chart_of_accounts',
      title: 'Chart of Accounts & General Ledger Hierarchy',
      menuPath: 'Accounts > Chart of Accounts',
      whyItIsUsed:
        'Maintains the standard organizational ledger tree divided into the 5 primary accounting pillars: Assets, Liabilities, Equity, Revenue, and Expenses, allowing standardized reporting for external accountants and tax auditors.',
      howToUse: [
        '1. Go to Accounts > Chart of Accounts.',
        '2. Expand tree nodes to inspect Assets (Current, Fixed), Liabilities (Current, Long-term), Equity, Revenue, and Overheads.',
        '3. Click "+ Add Ledger Head" to create custom sub-ledgers (e.g. "Prepaid Insurance").',
        '4. Assign the parent account node and account code number.',
        '5. View current balance for every ledger account.',
      ],
      whereToEnterDate:
        'The Chart of Accounts structure does not require date entry; however, clicking any ledger head opens its general ledger statement where date ranges are specified in YYYY-MM-DD format.',
      description:
        'Hierarchical general ledger tree organizing Assets, Liabilities, Equity, Revenues, and Expenses.',
      mockup: {
        viewType: 'tree',
        windowTitle: 'Royal ERP - Chart of Accounts & General Ledger Tree',
        urlPath: 'https://pos.royal-erp.internal/#/accounts/chart-of-accounts',
        dateBadgeText: '🏛️ General Ledger: 5 Master Pillars Configured',
        primaryActionText: '+ Add Ledger Head',
        mockColumns: ['Account Code', 'Account Name', 'Category Pillar', 'Sub-Account Of', 'Current Balance', 'Actions'],
        mockRows: [
          { 'Account Code': '1010', 'Account Name': 'Cash on Hand (Drawers)', 'Category Pillar': 'Current Assets', 'Sub-Account Of': 'Cash & Equivalents', 'Current Balance': '$3,690.00', Actions: 'View Ledger | Edit' },
          { 'Account Code': '1020', 'Account Name': 'Business Checking Bank', 'Category Pillar': 'Current Assets', 'Sub-Account Of': 'Cash & Equivalents', 'Current Balance': '$148,220.50', Actions: 'View Ledger | Edit' },
          { 'Account Code': '1200', 'Account Name': 'Accounts Receivable (Customers)', 'Category Pillar': 'Current Assets', 'Sub-Account Of': 'Operating Assets', 'Current Balance': '$12,450.00', Actions: 'View Ledger' },
          { 'Account Code': '2010', 'Account Name': 'Accounts Payable (Vendors)', 'Category Pillar': 'Current Liabilities', 'Sub-Account Of': 'Trade Payables', 'Current Balance': '$8,920.00', Actions: 'View Ledger' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Ledger Head Button',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to create a new sub-account in the general ledger.',
        },
        {
          pinNumber: 2,
          label: 'Category Pillar Column',
          fieldOrSection: 'Grid Column 3',
          instruction: 'Classifies account as Asset, Liability, Equity, Revenue, or Expense.',
        },
      ],
      fields: [
        {
          name: 'Account Code',
          type: 'Alphanumeric Code (e.g. 1010)',
          required: true,
          purpose: 'Standardized numeric identifier for accounting sorting.',
          functionality: 'Used in financial statement export.',
          validationRules: 'Must be unique.',
        },
      ],
    },
    {
      id: 'balance_sheet',
      title: 'Trial Balance & Balance Sheet Overview',
      menuPath: 'Accounts > Balance Sheet',
      whyItIsUsed:
        'Verifies that total debits equal total credits across all accounts (Trial Balance) and presents the formal Balance Sheet summarizing Assets, Liabilities, and Owner Equity at any specified date.',
      howToUse: [
        '1. Go to Accounts > Balance Sheet.',
        '2. Select "As On Date [YYYY-MM-DD]" (e.g. Current Month End).',
        '3. Click "Generate Balance Sheet".',
        '4. Verify that Total Assets = Total Liabilities + Total Equity.',
        '5. Export PDF / Excel for corporate financial reporting.',
      ],
      whereToEnterDate:
        'In the Balance Sheet, enter the "As On Date [YYYY-MM-DD]" at the top. The report computes cumulative ledger balances from the inception of the business up to this exact date.',
      description:
        'Financial balance sheet and trial balance verifying debit/credit equality and net asset valuation.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Financial Balance Sheet & Trial Balance',
        urlPath: 'https://pos.royal-erp.internal/#/accounts/balance-sheet',
        dateBadgeText: '📅 As On Date: 2026-10-04 | Balanced ($185,420.00)',
        primaryActionText: 'Export Balance Sheet PDF',
        mockColumns: ['Financial Section', 'Ledger Head', 'Debit Balance ($)', 'Credit Balance ($)', 'Net Amount ($)'],
        mockRows: [
          { 'Financial Section': 'Assets', 'Ledger Head': 'Total Current Assets (Cash + Bank + AR)', 'Debit Balance ($)': '$164,360.50', 'Credit Balance ($)': '-', 'Net Amount ($)': '$164,360.50' },
          { 'Financial Section': 'Assets', 'Ledger Head': 'Inventory Asset Value', 'Debit Balance ($)': '$21,059.50', 'Credit Balance ($)': '-', 'Net Amount ($)': '$21,059.50' },
          { 'Financial Section': 'Liabilities', 'Ledger Head': 'Accounts Payable (Vendors)', 'Debit Balance ($)': '-', 'Credit Balance ($)': '$8,920.00', 'Net Amount ($)': '$8,920.00' },
          { 'Financial Section': 'Equity', 'Ledger Head': 'Retained Earnings & Owner Capital', 'Debit Balance ($)': '-', 'Credit Balance ($)': '$176,500.00', 'Net Amount ($)': '$176,500.00' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'As On Date Calendar Input',
          fieldOrSection: 'Top Control Bar',
          instruction: 'Specify the valuation date in YYYY-MM-DD format.',
          whereToEnterDate: 'As On Date field: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 2,
          label: 'Total Assets vs Liabilities + Equity',
          fieldOrSection: 'Bottom Summary Totals',
          instruction: 'Verifies accounting balance equality.',
        },
      ],
      fields: [
        {
          name: 'As On Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Cutoff date for balance sheet asset and liability valuation.',
          functionality: 'Sums all ledger entries up to 23:59:59 on this date.',
          validationRules: 'Valid calendar date.',
        },
      ],
    },
  ],
  bestPractices: [
    'Perform a physical cash count at each register at shift close and record an Inter-Account Transfer to the safe deposit vault.',
    'Reconcile bank account statements against the ERP Account Book at least once a month.',
    'Ensure that the Trial Balance debits and credits match before closing quarterly tax periods.',
  ],
  troubleshooting: [
    {
      issue: 'Trial Balance shows an imbalance between debits and credits',
      solution:
        'Inspect recent manual journal entries or deleted transactions to ensure no single-sided postings occurred. Run the Ledger Audit tool.',
    },
  ],
};
