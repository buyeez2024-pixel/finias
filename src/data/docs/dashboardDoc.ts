import { DocModule } from './types';

export const dashboardDoc: DocModule = {
  id: 'dashboard',
  title: '1. Dashboard & Executive Analytics',
  category: 'Analytics & Command Center',
  iconName: 'LayoutDashboard',
  overview:
    'The central command telemetry hub of the ERP. Consolidates multi-branch monetary metrics, cash flow summaries, live inventory alert tickers, and quick operational buttons into a single real-time executive dashboard.',
  workflowSteps: [
    {
      step: 1,
      title: 'Select Active Branch / Consolidated View',
      description:
        'Choose whether to inspect a single retail outlet or global consolidated totals for the business using the branch selector.',
      tips: 'Admins can switch to "All Branches" to aggregate performance across all retail outlets.',
    },
    {
      step: 2,
      title: 'Configure Fiscal Date Boundaries',
      description:
        'Click the Date Range filter to select predefined periods (Today, This Week, This Month, Current Fiscal Quarter, Year to Date) or enter custom Start and End calendar dates.',
      tips: 'Revenue, profit, and expense figures dynamically recompute upon date selection.',
    },
    {
      step: 3,
      title: 'Review Financial Balance KPIs & Cash Flow',
      description:
        'Audit Total Sales revenue, Net Margin, outstanding Customer Invoice Due receivables, and Supplier Accounts Payable.',
    },
    {
      step: 4,
      title: 'Inspect Low Stock Warnings & Expiry Tickers',
      description:
        'Identify fast-moving inventory items that have dipped below safety thresholds to generate immediate purchase requisitions.',
    },
  ],
  submenus: [
    {
      id: 'dashboard_overview',
      title: 'Executive Financial KPIs & Performance Charts',
      menuPath: 'Dashboard > Executive Overview',
      whyItIsUsed:
        'Gives executives, store managers, and business owners instantaneous visibility into net financial health, cash collections, sales trends, and stock valuation without running multi-table reports.',
      howToUse: [
        '1. Upon application sign-in, the Dashboard loads as the default home view.',
        '2. Inspect the top 5 Scorecards: Total Sales, Net Profit, Invoice Due, Purchase Due, and Total Stock Value.',
        '3. Hover over the Monthly Sales vs Purchase bar chart to view breakdown numbers per month.',
        '4. Review the Payment Method Distribution donut chart to balance physical cash in registers against bank UPI/card deposits.',
        '5. Use the Quick Action buttons (+Sale, +Purchase, +Expense, +Product) to execute rapid transactional workflows without browsing deep menus.',
      ],
      whereToEnterDate:
        'Date selection is executed via the "Date Range Filter" situated at the top-right of the Dashboard header. Click the calendar icon to reveal the dropdown preset menu or choose "Custom Range" to specify Start Date [YYYY-MM-DD] and End Date [YYYY-MM-DD]. All scorecards, charts, and table rows re-aggregate according to the selected date boundaries.',
      description:
        'Real-time executive performance dashboard featuring revenue metrics, sales trends, payment reconciliations, and inventory alerts.',
      mockup: {
        viewType: 'dashboard',
        windowTitle: 'Royal ERP - Executive Telemetry Dashboard',
        urlPath: 'https://pos.royal-erp.internal/#/dashboard',
        dateBadgeText: '📅 Filter Date: Today (2026-10-04) | FY 2026-27',
        primaryActionText: '+ Quick New Sale',
        filterOptions: ['Today', 'Yesterday', 'This Month', 'Last 30 Days', 'This Fiscal Year', 'Custom Range'],
        statCards: [
          { title: 'Total Sales Revenue', value: '$124,580.00', change: '+14.2% vs last month', isPositive: true },
          { title: 'Net Profit Margin', value: '$38,240.50', change: '+8.6% margin', isPositive: true },
          { title: 'Customer Due (Receivable)', value: '$12,450.00', change: '18 invoices pending', isPositive: false },
          { title: 'Supplier Due (Payable)', value: '$8,920.00', change: '5 bills due this week', isPositive: false },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Branch Location Switcher',
          fieldOrSection: 'Top Header Bar (Left)',
          instruction: 'Select between Main Flagship Store, Warehouse Depot, or All Locations consolidated.',
        },
        {
          pinNumber: 2,
          label: 'Fiscal Date Range Filter',
          fieldOrSection: 'Top Header Bar (Right)',
          instruction: 'Click the calendar button to select predefined dates or enter custom date ranges.',
          whereToEnterDate: 'Top-right calendar picker: Click to input Start Date & End Date in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Executive KPI Metric Cards',
          fieldOrSection: 'Top Metric Grid',
          instruction: 'Real-time telemetry showing Gross Sales, Net Profit, Invoices Due, and Warehouse Stock Asset Valuation.',
        },
        {
          pinNumber: 4,
          label: 'Revenue vs Expenditure Time-Series Chart',
          fieldOrSection: 'Center Graph Section',
          instruction: 'Interactive visual bar and line chart displaying monthly sales trends vs inward inventory purchases.',
        },
        {
          pinNumber: 5,
          label: 'Quick Transaction Launchpad',
          fieldOrSection: 'Right Utility Panel',
          instruction: 'One-click shortcuts to launch +POS Sale, +Purchase Bill, +Add Product, or +Expense Voucher.',
        },
        {
          pinNumber: 6,
          label: 'Stock Alert & Replenishment Ticker',
          fieldOrSection: 'Bottom Left Table',
          instruction: 'Real-time table listing SKU items that have breached safety alert quantity thresholds.',
        },
      ],
      fields: [
        {
          name: 'Branch / Outlet Selector',
          type: 'Dropdown (Single Selection)',
          required: true,
          purpose: 'Filters telemetry to a specific store location or aggregates enterprise-wide data.',
          functionality: 'Updates all query parameters; resets charts and totals to match selected branch permissions.',
          validationRules: 'Must be an active location assigned to the logged-in user credentials.',
        },
        {
          name: 'Dashboard Date Range Filter',
          type: 'Date Range Picker (Start & End Date)',
          required: false,
          purpose: 'Sets the temporal boundary for calculation of revenue, profit, expenses, and transaction logs.',
          functionality: 'Accepts standard presets or custom ISO dates (YYYY-MM-DD). Dynamically recomputes totals.',
          validationRules: 'Start date cannot be posterior to End date. Defaults to current month to date.',
        },
        {
          name: 'Total Sales Revenue Card',
          type: 'Computed Currency Indicator',
          required: false,
          purpose: 'Summarizes gross revenue generated from POS counter tickets and backend tax invoices.',
          functionality: 'Calculated as: Total Invoice Totals - Credit Notes / Returns across the selected date range.',
          validationRules: 'Read-only financial output computed from sales ledger entries.',
        },
        {
          name: 'Net Profit Margin Card',
          type: 'Computed Currency Indicator',
          required: false,
          purpose: 'Quantifies net operational earnings after accounting for direct COGS and categorized expenses.',
          functionality: 'Calculated as: Gross Revenue - Cost of Goods Sold - Operational Expenses.',
          validationRules: 'Read-only financial output; audited against the general ledger.',
        },
        {
          name: 'Customer Invoice Due (Receivables)',
          type: 'Computed Currency Indicator',
          required: false,
          purpose: 'Tracks overdue and pending accounts receivable balances from credit customers.',
          functionality: 'Sums unpaid invoice balances where payment status is "Due" or "Partial".',
          validationRules: 'Increases upon credit sale; decreases upon cash/bank collection receipt.',
        },
        {
          name: 'Supplier Purchase Due (Payables)',
          type: 'Computed Currency Indicator',
          required: false,
          purpose: 'Highlights short-term accounts payable liabilities owed to raw material and trade vendors.',
          functionality: 'Aggregates inward purchase orders with unpaid balances.',
          validationRules: 'Decreases when a purchase payment voucher is authorized and paid out.',
        },
        {
          name: 'Current Inventory Valuation',
          type: 'Computed Dual Currency Indicator',
          required: false,
          purpose: 'Shows total capital locked in warehouse goods at purchase cost vs expected retail selling price.',
          functionality: 'Calculates: Sum(Unit Cost * Stock Qty) and Sum(Unit Selling Price * Stock Qty) for all active SKUs.',
          validationRules: 'Auto-recalculated upon every stock movement, transfer, or adjustment.',
        },
      ],
      actions: [
        { action: 'Switch Date Preset', description: 'Filter metrics for Today, Yesterday, This Month, or Custom Period' },
        { action: 'Refresh Data', description: 'Force re-query of live cache and background database records' },
        { action: 'Export Dashboard Summary', description: 'Download PDF executive report of current KPI scorecards' },
      ],
    },
  ],
  bestPractices: [
    'Always verify the selected branch location filter before drawing managerial conclusions from metrics.',
    'Reconcile Daily Sales against Physical Cash in Drawer at the close of every business shift.',
    'Review the Low Stock alert table every morning to initiate timely supplier purchase requisitions.',
  ],
  troubleshooting: [
    {
      issue: 'Dashboard figures show zero or unpopulated data',
      solution:
        'Verify that your user account has been assigned permission to the selected branch, and verify that the date range filter includes periods with recorded transactions.',
    },
    {
      issue: 'Discrepancy between Total Sales and Cash Balance',
      solution:
        'Total Sales includes credit sales (Invoice Due) and non-cash payment modes (Cards, UPI, Bank Transfers). Check the Payment Method Donut chart for the breakdown.',
    },
  ],
};
