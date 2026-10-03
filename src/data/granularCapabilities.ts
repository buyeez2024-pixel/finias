export interface GranularCapability {
  module: string;
  category: string;
  key: string;
  label: string;
  desc: string;
  accessType?: 'view' | 'edit' | 'delete' | 'manage';
}

export const GRANULAR_CAPABILITIES: GranularCapability[] = [
  // DASHBOARD / HOME
  {
    module: 'dashboard',
    category: 'Dashboard / Home',
    key: 'canViewDashboard',
    label: 'View Dashboard Analytics (Read-Only)',
    desc: 'Access executive KPI metrics, sales trend charts, and daily summary statistics.',
    accessType: 'view',
  },
  {
    module: 'dashboard',
    category: 'Dashboard / Home',
    key: 'canEditDashboard',
    label: 'Customize Dashboard Layout & Widgets',
    desc: 'Rearrange, add, or customize analytical widgets and key operational KPIs.',
    accessType: 'edit',
  },
  {
    module: 'dashboard',
    category: 'Dashboard / Home',
    key: 'canDeleteDashboard',
    label: 'Reset Dashboard Benchmarks & Data Cards',
    desc: 'Clear, archive, or reset custom widget configurations and benchmark targets.',
    accessType: 'delete',
  },

  // POINT OF SALE (POS)
  {
    module: 'pos',
    category: 'Point of Sale (POS)',
    key: 'canAccessPos',
    label: 'Operate POS Checkout Register (View & Checkout)',
    desc: 'Process terminal register sales, scan barcodes, print receipts, and balance daily cash till.',
    accessType: 'view',
  },
  {
    module: 'pos',
    category: 'Point of Sale (POS)',
    key: 'canGiveDiscount',
    label: 'Apply Sales & Cart Discounts (Edit)',
    desc: 'Grant line-item or invoice percentage discounts during POS register checkout.',
    accessType: 'edit',
  },
  {
    module: 'pos',
    category: 'Point of Sale (POS)',
    key: 'canEditPrices',
    label: 'Override Unit Selling Prices at POS (Edit)',
    desc: 'Allow cashiers to edit or override unit selling prices directly during sales checkout.',
    accessType: 'edit',
  },
  {
    module: 'pos',
    category: 'Point of Sale (POS)',
    key: 'canVoidPosRegister',
    label: 'Void Active POS Till & Cash Register Sessions (Delete)',
    desc: 'Close, void, or override register sessions and clear till floats.',
    accessType: 'delete',
  },

  // PRODUCTS & INVENTORY
  {
    module: 'inventory',
    category: 'Products & Inventory',
    key: 'canViewProducts',
    label: 'View Products Catalog (Read-Only)',
    desc: 'Browse product listings, stock levels, SKUs, barcodes, and master lists without editing rights.',
    accessType: 'view',
  },
  {
    module: 'inventory',
    category: 'Products & Inventory',
    key: 'canCreateProducts',
    label: 'Add New Products & Master Data (Edit)',
    desc: 'Create new catalog items, categories, brands, units, and barcode labels.',
    accessType: 'edit',
  },
  {
    module: 'inventory',
    category: 'Products & Inventory',
    key: 'canEditProducts',
    label: 'Edit Product Details & Selling Prices (Edit)',
    desc: 'Modify existing product specifications, selling prices, tax rules, and variations.',
    accessType: 'edit',
  },
  {
    module: 'inventory',
    category: 'Products & Inventory',
    key: 'canDeleteProducts',
    label: 'Delete / Archive Products (Delete)',
    desc: 'Permanently remove or archive catalog products, categories, and brand entries.',
    accessType: 'delete',
  },
  {
    module: 'inventory',
    category: 'Products & Inventory',
    key: 'canManageStock',
    label: 'Stock Adjustments & Transfers (Edit)',
    desc: 'Perform physical stock audits, manual inventory adjustments, and branch stock transfers.',
    accessType: 'edit',
  },
  {
    module: 'inventory',
    category: 'Products & Inventory',
    key: 'canViewCostPrice',
    label: 'View Wholesale Cost Price & Margins (View)',
    desc: 'Display wholesale purchase cost prices, cost valuation, and gross margin percentages in catalog.',
    accessType: 'view',
  },

  // PURCHASES & PROCUREMENT
  {
    module: 'purchases',
    category: 'Purchases & Procurement',
    key: 'canViewPurchases',
    label: 'View Purchase Orders & Inward Bills (Read-Only)',
    desc: 'Browse supplier purchase requisitions, inward stock logs, and vendor invoices.',
    accessType: 'view',
  },
  {
    module: 'purchases',
    category: 'Purchases & Procurement',
    key: 'canProcessPurchases',
    label: 'Create & Edit Purchase Orders (Edit)',
    desc: 'Create purchase requisitions, POs, and inward stock deliveries from suppliers.',
    accessType: 'edit',
  },
  {
    module: 'purchases',
    category: 'Purchases & Procurement',
    key: 'canApprovePurchases',
    label: 'Approve Supplier POs & Invoices (Edit)',
    desc: 'Formally approve pending purchase orders, supplier bills, and payment disbursements.',
    accessType: 'edit',
  },
  {
    module: 'purchases',
    category: 'Purchases & Procurement',
    key: 'canDeletePurchases',
    label: 'Delete / Cancel Purchase Orders (Delete)',
    desc: 'Permanently cancel or delete supplier purchase orders, inward stock bills, and vouchers.',
    accessType: 'delete',
  },

  // SALES & INVOICES
  {
    module: 'sales',
    category: 'Sales & Invoices',
    key: 'canViewSales',
    label: 'View Sales Invoices & Orders (Read-Only)',
    desc: 'Access sales invoice history, customer receipts, and completed order registers.',
    accessType: 'view',
  },
  {
    module: 'sales',
    category: 'Sales & Invoices',
    key: 'canEditSales',
    label: 'Edit Sales Invoices & Quotations (Edit)',
    desc: 'Modify pending quotations, sales orders, customer delivery notes, and tax invoices.',
    accessType: 'edit',
  },
  {
    module: 'sales',
    category: 'Sales & Invoices',
    key: 'canVoidSales',
    label: 'Void Invoices & Process Returns (Delete)',
    desc: 'Cancel completed invoices, issue cash refunds, and generate credit notes.',
    accessType: 'delete',
  },

  // CONTACTS CRM
  {
    module: 'contacts',
    category: 'Contacts (CRM)',
    key: 'canViewContacts',
    label: 'View Contacts CRM Directory (Read-Only)',
    desc: 'Browse customer profiles, supplier contacts, ledger credit limits, and addresses.',
    accessType: 'view',
  },
  {
    module: 'contacts',
    category: 'Contacts (CRM)',
    key: 'canEditContacts',
    label: 'Add & Edit Customer / Supplier Profiles (Edit)',
    desc: 'Create new contact records, edit tax IDs, credit limits, and customer group assignments.',
    accessType: 'edit',
  },
  {
    module: 'contacts',
    category: 'Contacts (CRM)',
    key: 'canDeleteContacts',
    label: 'Delete / Archive Contact Records (Delete)',
    desc: 'Permanently remove or archive customer profiles, supplier cards, and ledger directories.',
    accessType: 'delete',
  },

  // EXPENSES
  {
    module: 'expenses',
    category: 'Expenses',
    key: 'canViewExpenses',
    label: 'View Expense Logs & Overhead Accounts (Read-Only)',
    desc: 'Inspect store expense ledgers, petty cash logs, and vendor expense summaries.',
    accessType: 'view',
  },
  {
    module: 'expenses',
    category: 'Expenses',
    key: 'canManageExpenses',
    label: 'Record & Edit Petty Cash Overheads (Edit)',
    desc: 'Record, edit, and categorize store petty cash & expense entries.',
    accessType: 'edit',
  },
  {
    module: 'expenses',
    category: 'Expenses',
    key: 'canDeleteExpenses',
    label: 'Delete / Cancel Expense Vouchers (Delete)',
    desc: 'Delete, void, or purge expense payment vouchers and petty cash claims.',
    accessType: 'delete',
  },

  // FINANCIAL REPORTS & ACCOUNTS
  {
    module: 'reports',
    category: 'Reports & P&L',
    key: 'canViewReports',
    label: 'View Analytics & Financial Reports (Read-Only)',
    desc: 'Access P&L statements, sales volume, stock reports, and tax logs.',
    accessType: 'view',
  },
  {
    module: 'reports',
    category: 'Reports & P&L',
    key: 'canExportReports',
    label: 'Export Reports (PDF / Excel / CSV) (Edit)',
    desc: 'Download CSV/PDF audit trails and financial summaries.',
    accessType: 'edit',
  },
  {
    module: 'reports',
    category: 'Reports & P&L',
    key: 'canDeleteReports',
    label: 'Purge / Archive Saved Audit Logs (Delete)',
    desc: 'Delete or archive historical audit snapshots and saved financial custom reports.',
    accessType: 'delete',
  },

  // BANK & CASH ACCOUNTS
  {
    module: 'accounts',
    category: 'Accounts & Ledger',
    key: 'canAccessAccounts',
    label: 'Access Bank & Cash Accounts (Read-Only)',
    desc: 'View ledger accounts, payment flows, and financial balances.',
    accessType: 'view',
  },
  {
    module: 'accounts',
    category: 'Accounts & Ledger',
    key: 'canEditAccounts',
    label: 'Create & Edit Account Entries (Edit)',
    desc: 'Create, reconcile, and adjust bank, cash, and credit card ledger balances.',
    accessType: 'edit',
  },
  {
    module: 'accounts',
    category: 'Accounts & Ledger',
    key: 'canDeleteAccounts',
    label: 'Delete / Close Account Records (Delete)',
    desc: 'Close, void, or delete ledger accounts and journal balance entries.',
    accessType: 'delete',
  },

  // AI BUSINESS INTELLIGENCE
  {
    module: 'ai',
    category: 'AI Business Intelligence',
    key: 'canViewAi',
    label: 'View AI Demand Forecasts & Insights (Read-Only)',
    desc: 'Access Gemini demand forecasting, automated reorder triggers, and sales predictions.',
    accessType: 'view',
  },
  {
    module: 'ai',
    category: 'AI Business Intelligence',
    key: 'canEditAi',
    label: 'Run Custom AI Simulations & Prompts (Edit)',
    desc: 'Execute interactive AI profit optimization queries, scenario testing, and custom prompts.',
    accessType: 'edit',
  },
  {
    module: 'ai',
    category: 'AI Business Intelligence',
    key: 'canDeleteAi',
    label: 'Clear AI Insight Logs & Prompt History (Delete)',
    desc: 'Delete saved AI analysis reports, historical prompt logs, and cached recommendations.',
    accessType: 'delete',
  },

  // USER PROFILE & MENU
  {
    module: 'user_menu',
    category: 'User Profile & Menu',
    key: 'canViewUserMenu',
    label: 'View Staff Directory & Profiles (Read-Only)',
    desc: 'Browse employee list, branch assignments, and staff profiles.',
    accessType: 'view',
  },
  {
    module: 'user_menu',
    category: 'User Profile & Menu',
    key: 'canManageUsers',
    label: 'Manage Staff Accounts & Roles (Edit)',
    desc: 'Add new staff members, assign RBAC roles, and set user passwords.',
    accessType: 'edit',
  },
  {
    module: 'user_menu',
    category: 'User Profile & Menu',
    key: 'canDeleteUsers',
    label: 'Delete / Deactivate Staff Accounts (Delete)',
    desc: 'Permanently delete, deactivate, or revoke staff user accounts.',
    accessType: 'delete',
  },

  // SYSTEM SETTINGS
  {
    module: 'settings',
    category: 'Settings',
    key: 'canViewSettings',
    label: 'View System & Branch Configurations (Read-Only)',
    desc: 'Inspect store branch details, tax settings, currency rules, and print layouts.',
    accessType: 'view',
  },
  {
    module: 'settings',
    category: 'Settings',
    key: 'canEditSettings',
    label: 'Configure System & Tax Rules (Edit)',
    desc: 'Modify business profile, tax rules, invoice layouts, and store branches.',
    accessType: 'edit',
  },
  {
    module: 'settings',
    category: 'Settings',
    key: 'canDeleteSettings',
    label: 'Reset System & Branch Configurations (Delete)',
    desc: 'Reset store defaults, tax groups, printer configurations, and branch profiles.',
    accessType: 'delete',
  },
];
