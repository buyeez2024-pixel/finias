import { DocModule } from './types';

export const reportsDoc: DocModule = {
  id: 'reports',
  title: '10. Reports & Business Intelligence',
  category: 'Financial Analytics & Audit Intelligence',
  iconName: 'BarChart3',
  overview:
    'Comprehensive business intelligence and financial reporting suite: Profit & Loss statements, Product Sell velocity, Purchase Reports, Payment Collection audits, GST/VAT tax filings, Customer/Supplier Aging balances, Stock Valuation, and Sales Representative Commission reports.',
  workflowSteps: [
    {
      step: 1,
      title: 'Select Analytical Scope & Outlets',
      description:
        'Choose whether to audit a specific retail location or consolidated enterprise performance across all stores.',
    },
    {
      step: 2,
      title: 'Specify Fiscal Date Ranges',
      description:
        'Set Start Date [YYYY-MM-DD] and End Date [YYYY-MM-DD] to analyze weekly, monthly, quarterly, or annual performance.',
    },
    {
      step: 3,
      title: 'Review Metric Breakdown Tables',
      description:
        'Audit margins, tax liability lines, payment modes, and stock movement velocities.',
    },
    {
      step: 4,
      title: 'Export to PDF & Excel for Board Audits',
      description:
        'Generate publication-ready PDF financial reports or CSV spreadsheets for CPA tax filings and board meetings.',
    },
  ],
  submenus: [
    {
      id: 'profit_loss_report',
      title: 'Profit & Loss Statement (P&L)',
      menuPath: 'Reports > Profit & Loss Statement',
      whyItIsUsed:
        'Primary financial income statement calculating Gross Profit, Net Operating Income, and Net Profit after subtracting direct Cost of Goods Sold (COGS) and categorized operational expenses from total sales revenue.',
      howToUse: [
        '1. Go to Reports > Profit & Loss Statement.',
        '2. Select Location (or All Locations consolidated).',
        '3. Choose Fiscal Date Range: Start Date [YYYY-MM-DD] to End Date [YYYY-MM-DD].',
        '4. Review breakdown: Total Sales Revenue (-) Cost of Goods Sold (=) Gross Profit (-) Total Operational Expenses (=) Net Profit.',
        '5. Export PDF / Excel for corporate tax filings and shareholder presentations.',
      ],
      whereToEnterDate:
        'In the Profit & Loss Report, date selection occurs via the "Financial Date Range" filter [YYYY-MM-DD] at the top of the screen. Pre-configured buttons provide instant selection for "This Month", "Last Quarter", "Current Fiscal Year", or "Custom Range".',
      description:
        'Official income statement summarizing gross revenue, COGS, operating overheads, and net profit margin.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Profit & Loss Income Statement',
        urlPath: 'https://pos.royal-erp.internal/#/reports/profit-loss',
        dateBadgeText: '📅 Financial Period: 2026-10-01 to 2026-10-04 | Net Profit: $38,240.50',
        primaryActionText: 'Export P&L Statement PDF',
        mockColumns: ['Income / Expense Head', 'Gross Amount ($)', 'Percentage of Revenue', 'Notes / Breakdown'],
        mockRows: [
          { 'Income / Expense Head': 'Gross Sales Revenue', 'Gross Amount ($)': '$124,580.00', 'Percentage of Revenue': '100.00%', 'Notes / Breakdown': 'Invoiced Sales minus Returns' },
          { 'Income / Expense Head': 'Cost of Goods Sold (COGS)', 'Gross Amount ($)': '-$82,400.00', 'Percentage of Revenue': '66.14%', 'Notes / Breakdown': 'Direct inventory acquisition costs' },
          { 'Income / Expense Head': 'Gross Profit Margin', 'Gross Amount ($)': '$42,180.00', 'Percentage of Revenue': '33.86%', 'Notes / Breakdown': 'Revenue minus direct COGS' },
          { 'Income / Expense Head': 'Total Operational Expenses', 'Gross Amount ($)': '-$3,939.50', 'Percentage of Revenue': '3.16%', 'Notes / Breakdown': 'Rent, Utilities, Staff, Supplies' },
          { 'Income / Expense Head': 'Net Operating Profit', 'Gross Amount ($)': '$38,240.50', 'Percentage of Revenue': '30.70%', 'Notes / Breakdown': 'Bottom-line net earnings' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Date Range Preset Controls',
          fieldOrSection: 'Top Control Bar',
          instruction: 'Select fiscal period for profit calculation.',
          whereToEnterDate: 'Click to input Start Date and End Date in YYYY-MM-DD format.',
        },
        {
          pinNumber: 2,
          label: 'Net Operating Profit Scorecard',
          fieldOrSection: 'Center Summary Card',
          instruction: 'Displays final net earnings after COGS and overheads.',
        },
      ],
      fields: [
        {
          name: 'P&L Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets temporal boundary for revenue and expense calculation.',
          functionality: 'Aggregates sales invoices and expense vouchers within the dates.',
          validationRules: 'Start date must precede End date.',
        },
      ],
    },
    {
      id: 'product_purchase_report',
      title: 'Product Purchase Analysis Report',
      menuPath: 'Reports > Product Purchase Report',
      whyItIsUsed:
        'Audits SKU-level inward procurement volume, average unit purchase cost variations, supplier distribution, and total expenditure per inventory item over time.',
      howToUse: [
        '1. Go to Reports > Product Purchase Report.',
        '2. Filter by Category, Brand, Supplier, or Date Range [YYYY-MM-DD].',
        '3. Inspect total units purchased and average purchase price per item.',
        '4. Identify suppliers offering the most competitive acquisition costs.',
      ],
      whereToEnterDate:
        'Date filtering is specified via "Purchase Date From [YYYY-MM-DD]" and "Purchase Date To [YYYY-MM-DD]" at the top-right.',
      description:
        'Detailed procurement analysis tracking purchased quantities, supplier costs, and item expenditures.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Product Purchase Volume & Cost Analysis',
        urlPath: 'https://pos.royal-erp.internal/#/reports/purchase-products',
        dateBadgeText: '📅 Date Filter: 2026-10-01 to 2026-10-04 | 120 SKUs Analyzed',
        primaryActionText: 'Export Purchase Report',
        mockColumns: ['SKU', 'Product Title', 'Supplier Name', 'Total Units Bought', 'Average Cost / Unit', 'Total Spend ($)', 'Last Purchase Date'],
        mockRows: [
          { SKU: 'SKU-001', 'Product Title': 'Wireless Bluetooth Headset', 'Supplier Name': 'Acme Global Supplies', 'Total Units Bought': '150 Pcs', 'Average Cost / Unit': '$45.00', 'Total Spend ($)': '$6,750.00', 'Last Purchase Date': '2026-10-02' },
          { SKU: 'SKU-002', 'Product Title': 'Ultra HD 4K Monitor 27"', 'Supplier Name': 'Pacific Wholesale Co', 'Total Units Bought': '20 Pcs', 'Average Cost / Unit': '$180.00', 'Total Spend ($)': '$3,600.00', 'Last Purchase Date': '2026-10-03' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Purchase Date Range Selector',
          fieldOrSection: 'Top Filter Bar',
          instruction: 'Specify start and end dates in YYYY-MM-DD format.',
          whereToEnterDate: 'Date inputs at top: Format YYYY-MM-DD.',
        },
      ],
      fields: [
        {
          name: 'Purchase Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets the inward procurement reporting interval.',
          functionality: 'Filters purchase records by bill date.',
          validationRules: 'Valid calendar dates.',
        },
      ],
    },
    {
      id: 'purchase_payment_report',
      title: 'Purchase Payment & Supplier Dues Report',
      menuPath: 'Reports > Purchase Payment Report',
      whyItIsUsed:
        'Tracks cash outflows to suppliers, displaying payment voucher numbers, disbursement dates, payment accounts (Cash/Bank), and remaining accounts payable balances.',
      howToUse: [
        '1. Open Reports > Purchase Payment Report.',
        '2. Filter by Supplier or Payment Account.',
        '3. Select Payment Date Range [YYYY-MM-DD].',
        '4. Inspect total disbursements and balance against bank withdrawal statements.',
      ],
      whereToEnterDate:
        'Filter payments by specifying "Disbursement Start Date [YYYY-MM-DD]" and "Disbursement End Date [YYYY-MM-DD]".',
      description:
        'Disbursement audit report tracking outward payments to suppliers and remaining liabilities.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Purchase Payment & Outflow Audit',
        urlPath: 'https://pos.royal-erp.internal/#/reports/purchase-payments',
        dateBadgeText: '📅 Payment Cycle: 2026-10-01 to 2026-10-04 | Total Paid: $8,700.00',
        primaryActionText: 'Export Payment Ledger',
        mockColumns: ['Payment Date', 'Voucher #', 'Supplier Name', 'Paid Amount', 'Payment Mode', 'Account Used', 'PO Reference'],
        mockRows: [
          { 'Payment Date': '2026-10-02', 'Voucher #': 'PV-101', 'Supplier Name': 'Acme Global Supplies', 'Paid Amount': '$4,500.00', 'Payment Mode': 'Bank Wire', 'Account Used': 'Primary Business Checking', 'PO Reference': 'PO-2026-108' },
          { 'Payment Date': '2026-10-04', 'Voucher #': 'PV-102', 'Supplier Name': 'Pacific Wholesale Co', 'Paid Amount': '$2,000.00', 'Payment Mode': 'Bank Wire', 'Account Used': 'Primary Business Checking', 'PO Reference': 'PO-2026-109' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Payment Date Selector',
          fieldOrSection: 'Top Date Filter',
          instruction: 'Specify disbursement dates in YYYY-MM-DD format.',
          whereToEnterDate: 'Start and End date inputs: Format YYYY-MM-DD.',
        },
      ],
      fields: [
        {
          name: 'Payment Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets interval for auditing vendor disbursements.',
          functionality: 'Queries payment vouchers within dates.',
          validationRules: 'Valid calendar dates.',
        },
      ],
    },
    {
      id: 'product_sell_report',
      title: 'Product Sell Velocity & Margin Report',
      menuPath: 'Reports > Product Sell Report',
      whyItIsUsed:
        'Analyzes product sales velocity, total units sold, gross sales revenue, direct COGS, and profit margin per individual SKU to identify top revenue drivers and slow-moving dead stock.',
      howToUse: [
        '1. Go to Reports > Product Sell Report.',
        '2. Select Date Range: Start Date [YYYY-MM-DD] to End Date [YYYY-MM-DD].',
        '3. Filter by Category, Brand, or Location.',
        '4. Sort by "Total Revenue" or "Profit Margin" to identify top-performing merchandise.',
        '5. Export report for retail merchandising and promotional planning.',
      ],
      whereToEnterDate:
        'In the Product Sell Report, date selection occurs via the "Sales Date Range" filter [YYYY-MM-DD] at the top-right to isolate sales velocity across weekly, monthly, or seasonal intervals.',
      description:
        'Merchandise sales velocity report detailing unit sales, revenues, COGS, and profit margins per SKU.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Product Sell Velocity & Margins',
        urlPath: 'https://pos.royal-erp.internal/#/reports/sell-products',
        dateBadgeText: '📅 Sales Scope: 2026-10-01 to 2026-10-04 | 480 Units Sold',
        primaryActionText: 'Export Sales Velocity Report',
        mockColumns: ['SKU', 'Product Name', 'Category', 'Units Sold', 'Gross Revenue ($)', 'Total COGS ($)', 'Gross Profit ($)', 'Margin %'],
        mockRows: [
          { SKU: 'SKU-001', 'Product Name': 'Wireless Bluetooth Headset', Category: 'Electronics', 'Units Sold': '18 Pcs', 'Gross Revenue ($)': '$1,439.82', 'Total COGS ($)': '$810.00', 'Gross Profit ($)': '$629.82', 'Margin %': '43.74%' },
          { SKU: 'SKU-002', 'Product Name': 'Ultra HD 4K Monitor 27"', Category: 'Electronics', 'Units Sold': '6 Pcs', 'Gross Revenue ($)': '$1,734.00', 'Total COGS ($)': '$1,080.00', 'Gross Profit ($)': '$654.00', 'Margin %': '37.71%' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Sales Date Filter',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Filter sales volume between start and end dates.',
          whereToEnterDate: 'Specify dates in YYYY-MM-DD format.',
        },
      ],
      fields: [
        {
          name: 'Sales Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets interval for sales velocity calculation.',
          functionality: 'Sums line items from finalized sales invoices.',
          validationRules: 'Valid calendar dates.',
        },
      ],
    },
    {
      id: 'sell_payment_report',
      title: 'Sell Payment & Cash Collection Report',
      menuPath: 'Reports > Sell Payment Report',
      whyItIsUsed:
        'Reconciles counter collections across payment channels (Physical Cash, Credit Cards, UPI / QR, Bank Wire) to balance cashier shift handovers and verify bank deposits.',
      howToUse: [
        '1. Go to Reports > Sell Payment Report.',
        '2. Select Payment Date Range [YYYY-MM-DD].',
        '3. Filter by Cashier Staff or Register Location.',
        '4. Review collection totals per payment method to balance physical cash drawers against bank statements.',
      ],
      whereToEnterDate:
        'Specify "Collection Start Date [YYYY-MM-DD]" and "Collection End Date [YYYY-MM-DD]" at the top of the report.',
      description:
        'Cashier collection reconciliation report balancing cash, card, and digital payment tenders.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Cash Collections & Tender Reconciliation',
        urlPath: 'https://pos.royal-erp.internal/#/reports/sell-payments',
        dateBadgeText: '📅 Collections: Today (2026-10-04) | Total Collections: $14,240.00',
        primaryActionText: 'Export Collection Summary',
        mockColumns: ['Payment Date', 'Receipt / Ref #', 'Customer Name', 'Amount Collected', 'Payment Mode', 'Payment Account', 'Cashier'],
        mockRows: [
          { 'Payment Date': '2026-10-04 10:14', 'Receipt / Ref #': 'REC-901', 'Customer Name': 'Walk-in Customer', 'Amount Collected': '$45.00', 'Payment Mode': 'Cash', 'Payment Account': 'Cash Drawer #01', Cashier: 'Marcus Chen' },
          { 'Payment Date': '2026-10-04 11:30', 'Receipt / Ref #': 'REC-902', 'Customer Name': 'Apex Hardware Ltd', 'Amount Collected': '$1,000.00', 'Payment Mode': 'Bank Wire', 'Account Used': 'Primary Business Checking', Cashier: 'Alexander V.' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Collection Date Picker',
          fieldOrSection: 'Top Date Controls',
          instruction: 'Specify collection date interval in YYYY-MM-DD format.',
          whereToEnterDate: 'Collection date range input: Format YYYY-MM-DD.',
        },
      ],
      fields: [
        {
          name: 'Collection Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets interval for cash collection audit.',
          functionality: 'Aggregates payment receipts within dates.',
          validationRules: 'Valid calendar dates.',
        },
      ],
    },
    {
      id: 'tax_report_view',
      title: 'GST & Tax Summary Report (Output vs Input Tax)',
      menuPath: 'Reports > GST & Tax Summary Report',
      whyItIsUsed:
        'Provides statutory tax breakdowns for GST, VAT, and Sales Tax declarations, computing Output Tax collected on sales, Input Tax Credit (ITC) paid on purchases, and Net Tax Payable to the revenue authority.',
      howToUse: [
        '1. Go to Reports > GST & Tax Summary Report.',
        '2. Select Tax Period: Start Date [YYYY-MM-DD] to End Date [YYYY-MM-DD] (e.g. Monthly or Quarterly).',
        '3. Review Output Tax table (CGST, SGST, IGST / VAT on Sales).',
        '4. Review Input Tax Credit table (Tax paid on Purchases).',
        '5. Inspect Net Tax Payable formula: Output Tax - Input Tax Credit.',
        '6. Export official tax declaration PDF / Excel for filing statutory returns.',
      ],
      whereToEnterDate:
        'In the Tax Report, date selection occurs in the "Tax Period Date Range" picker [YYYY-MM-DD] at the top-right. Set the start and end dates to match statutory filing periods (e.g. 2026-10-01 to 2026-10-31 for monthly GSTR-1 / GSTR-3B filings).',
      description:
        'Statutory tax audit report computing Output Tax on sales, Input Tax Credits on purchases, and Net Tax Payable.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Statutory GST / VAT Tax Summary',
        urlPath: 'https://pos.royal-erp.internal/#/reports/tax',
        dateBadgeText: '📅 Tax Period: 2026-10-01 to 2026-10-31 | Net Tax Due: $4,580.00',
        primaryActionText: 'Export Statutory Tax PDF',
        mockColumns: ['Tax Slab / Rate', 'Taxable Sales Amount', 'Output Tax Collected', 'Taxable Purchases', 'Input Tax Credit (ITC)', 'Net Tax Payable'],
        mockRows: [
          { 'Tax Slab / Rate': 'GST 5% (CGST 2.5% + SGST 2.5%)', 'Taxable Sales Amount': '$18,400.00', 'Output Tax Collected': '$920.00', 'Taxable Purchases': '$12,000.00', 'Input Tax Credit (ITC)': '$600.00', 'Net Tax Payable': '$320.00' },
          { 'Tax Slab / Rate': 'GST 18% (CGST 9% + SGST 9%)', 'Taxable Sales Amount': '$54,200.00', 'Output Tax Collected': '$9,756.00', 'Taxable Purchases': '$32,000.00', 'Input Tax Credit (ITC)': '$5,760.00', 'Net Tax Payable': '$3,996.00' },
          { 'Tax Slab / Rate': 'Exempt / Zero-Rated (0%)', 'Taxable Sales Amount': '$8,500.00', 'Output Tax Collected': '$0.00', 'Taxable Purchases': '$4,000.00', 'Input Tax Credit (ITC)': '$0.00', 'Net Tax Payable': '$0.00' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Tax Period Date Filter',
          fieldOrSection: 'Top Control Bar',
          instruction: 'Select monthly or quarterly tax filing dates.',
          whereToEnterDate: 'Specify filing period Start and End dates in YYYY-MM-DD format.',
        },
        {
          pinNumber: 2,
          label: 'Net Tax Payable Summary Scorecard',
          fieldOrSection: 'Center Summary Box',
          instruction: 'Displays final liability owed to government tax authorities.',
        },
      ],
      fields: [
        {
          name: 'Tax Period Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets official statutory declaration period.',
          functionality: 'Calculates tax liabilities based on invoice and purchase dates.',
          validationRules: 'Matches legal tax filing period boundaries.',
        },
      ],
    },
    {
      id: 'customer_supplier_report',
      title: 'Customer & Supplier Balance Aging Report',
      menuPath: 'Reports > Customer & Supplier Balances',
      whyItIsUsed:
        'Provides aging debt analysis for accounts receivable and accounts payable (Current, 1-30 Days Overdue, 31-60 Days Overdue, 61-90 Days, 90+ Days) to expedite credit collections and plan supplier disbursements.',
      howToUse: [
        '1. Go to Reports > Customer & Supplier Balances.',
        '2. Choose Report Mode: "Customer Receivables" or "Supplier Payables".',
        '3. Select As On Date [YYYY-MM-DD].',
        '4. Review aging brackets to identify overdue clients requiring payment demand notices.',
        '5. Export aging schedule for financial management.',
      ],
      whereToEnterDate:
        'In the Balance Aging report, specify the "As On Date [YYYY-MM-DD]" at the top to compute aging buckets relative to that date.',
      description:
        'Aging analysis schedule for trade receivables and payables across 30, 60, and 90+ day buckets.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Trade Debt Aging Schedule',
        urlPath: 'https://pos.royal-erp.internal/#/reports/customer-supplier-balances',
        dateBadgeText: '📅 Aging As On: 2026-10-04 | Total Receivables: $12,450.00',
        primaryActionText: 'Export Aging Schedule',
        mockColumns: ['Party Name', 'Contact Type', 'Current (< 30 Days)', '31-60 Days', '61-90 Days', '90+ Days Overdue', 'Total Outstanding', 'Actions'],
        mockRows: [
          { 'Party Name': 'Apex Hardware Ltd', 'Contact Type': 'Customer', 'Current (< 30 Days)': '$1,240.00', '31-60 Days': '$1,210.00', '61-90 Days': '$0.00', '90+ Days Overdue': '$0.00', 'Total Outstanding': '$2,450.00', Actions: 'Ledger | Notice' },
          { 'Party Name': 'Metro Superstore', 'Contact Type': 'Customer', 'Current (< 30 Days)': '$4,800.00', '31-60 Days': '$2,000.00', '61-90 Days': '$0.00', '90+ Days Overdue': '$0.00', 'Total Outstanding': '$6,800.00', Actions: 'Ledger | Notice' },
          { 'Party Name': 'Acme Global Supplies', 'Contact Type': 'Supplier', 'Current (< 30 Days)': '$4,500.00', '31-60 Days': '$0.00', '61-90 Days': '$0.00', '90+ Days Overdue': '$0.00', 'Total Outstanding': '$4,500.00', Actions: 'Ledger | Pay' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Aging As On Date Input',
          fieldOrSection: 'Top Date Bar',
          instruction: 'Specify valuation date in YYYY-MM-DD format.',
          whereToEnterDate: 'As On Date calendar input: Format YYYY-MM-DD.',
        },
      ],
      fields: [
        {
          name: 'As On Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Reference date for calculating invoice age.',
          functionality: 'Computes days elapsed between invoice due date and reference date.',
          validationRules: 'Valid calendar date.',
        },
      ],
    },
    {
      id: 'stock_report_view',
      title: 'Stock Inventory Valuation Report',
      menuPath: 'Reports > Stock Report',
      whyItIsUsed:
        'Calculates real-time inventory asset valuation across all warehouse and retail facilities, showing unit cost value, potential selling revenue value, and estimated gross profit margin locked in warehouse stock.',
      howToUse: [
        '1. Open Reports > Stock Report.',
        '2. Filter by Location, Category, or Brand.',
        '3. Inspect current stock quantity, unit cost price, and unit selling price.',
        '4. Review consolidated Total Stock Cost Valuation and Potential Retail Valuation.',
        '5. Export PDF / Excel for company asset statements.',
      ],
      whereToEnterDate:
        'In the Stock Valuation report, inventory is calculated in real time as of the current system moment. Historic valuation can be inspected by setting the "Historic Valuation Date [YYYY-MM-DD]" in the advanced filter.',
      description:
        'Warehouse inventory asset valuation report computing total capital locked in stock at purchase cost vs selling price.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Inventory Asset Valuation Report',
        urlPath: 'https://pos.royal-erp.internal/#/reports/stock',
        dateBadgeText: '📦 Valuation Status: Real-Time Live | Total Stock Value: $21,059.50',
        primaryActionText: 'Export Stock Valuation PDF',
        mockColumns: ['SKU', 'Product Name', 'Category', 'Current Stock', 'Unit Cost ($)', 'Total Cost Value ($)', 'Unit Price ($)', 'Potential Revenue ($)'],
        mockRows: [
          { SKU: 'SKU-001', 'Product Name': 'Wireless Bluetooth Headset', Category: 'Electronics', 'Current Stock': '142 Pcs', 'Unit Cost ($)': '$45.00', 'Total Cost Value ($)': '$6,390.00', 'Unit Price ($)': '$79.99', 'Potential Revenue ($)': '$11,358.58' },
          { SKU: 'SKU-002', 'Product Name': 'Ultra HD 4K Monitor 27"', Category: 'Electronics', 'Current Stock': '8 Pcs', 'Unit Cost ($)': '$180.00', 'Total Cost Value ($)': '$1,440.00', 'Unit Price ($)': '$289.00', 'Potential Revenue ($)': '$2,312.00' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Total Stock Valuation Card',
          fieldOrSection: 'Top Metric Card',
          instruction: 'Displays cumulative capital invested in physical inventory.',
        },
      ],
      fields: [
        {
          name: 'Historic Valuation Date',
          type: 'Date (YYYY-MM-DD)',
          required: false,
          purpose: 'Allows evaluating stock value at past accounting year-end.',
          functionality: 'Reconstructs perpetual stock ledger backward to specified date.',
          validationRules: 'Cannot be in the future.',
        },
      ],
    },
    {
      id: 'stock_adjustment_report',
      title: 'Stock Adjustment & Wastage Audit Report',
      menuPath: 'Reports > Stock Adjustment Report',
      whyItIsUsed:
        'Audits cumulative inventory losses resulting from physical damage, expiration, theft, and inventory write-offs over specified time windows to monitor store shrinkage rates.',
      howToUse: [
        '1. Go to Reports > Stock Adjustment Report.',
        '2. Select Date Range: Start Date [YYYY-MM-DD] to End Date [YYYY-MM-DD].',
        '3. Filter by Location or Adjustment Type (Normal vs Abnormal).',
        '4. Review total monetary loss and units written off.',
      ],
      whereToEnterDate:
        'Filter adjustment shrinkage by specifying "Adjustment Start Date [YYYY-MM-DD]" and "Adjustment End Date [YYYY-MM-DD]" at the top.',
      description:
        'Inventory shrinkage and damage audit report tracking total monetary write-offs and waste causes.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Inventory Shrinkage & Adjustment Audit',
        urlPath: 'https://pos.royal-erp.internal/#/reports/adjustment-audit',
        dateBadgeText: '📅 Audit Window: 2026-10-01 to 2026-10-04 | Total Shrinkage: $270.00',
        primaryActionText: 'Export Shrinkage Report',
        mockColumns: ['Date', 'Voucher #', 'Location', 'Total Items Written Off', 'Total Cost Written Off ($)', 'Amount Recovered ($)', 'Net Shrinkage ($)'],
        mockRows: [
          { Date: '2026-10-02', 'Voucher #': 'ADJ-2026-004', Location: 'Main Flagship', 'Total Items Written Off': '2 Pcs', 'Total Cost Written Off ($)': '$90.00', 'Amount Recovered ($)': '$0.00', 'Net Shrinkage ($)': '$90.00' },
          { Date: '2026-10-04', 'Voucher #': 'ADJ-2026-005', Location: 'Central Depot', 'Total Items Written Off': '1 Pc', 'Total Cost Written Off ($)': '$180.00', 'Amount Recovered ($)': '$0.00', 'Net Shrinkage ($)': '$180.00' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Date Range Selector',
          fieldOrSection: 'Top Date Filter',
          instruction: 'Specify shrinkage audit dates in YYYY-MM-DD format.',
          whereToEnterDate: 'Start and End dates: Format YYYY-MM-DD.',
        },
      ],
      fields: [
        {
          name: 'Adjustment Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets interval for auditing inventory shrinkage.',
          functionality: 'Aggregates adjustment vouchers within dates.',
          validationRules: 'Valid calendar dates.',
        },
      ],
    },
    {
      id: 'sales_representative_report',
      title: 'Sales Representative Commission & Performance Report',
      menuPath: 'Reports > Sales Representative Report',
      whyItIsUsed:
        'Computes sales performance, total revenue closed, total invoices generated, and earned commission payouts for internal sales representatives and external field agents over any payroll cycle.',
      howToUse: [
        '1. Go to Reports > Sales Representative Report.',
        '2. Select the Sales Representative (or view All Agents).',
        '3. Choose Commission Date Cycle: Start Date [YYYY-MM-DD] to End Date [YYYY-MM-DD].',
        '4. Review Total Invoiced Sales, Commission Percentage, and Net Commission Earned ($).',
        '5. Export PDF commission statement for payroll disbursement.',
      ],
      whereToEnterDate:
        'In the Sales Representative Report, date selection occurs via the "Commission Period Date Range" picker [YYYY-MM-DD] at the top of the view. Specify the exact payroll cycle start and end dates to compute earned commissions.',
      description:
        'Sales performance and commission calculation report tracking agent revenues and earned payouts.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Sales Representative Performance & Commissions',
        urlPath: 'https://pos.royal-erp.internal/#/reports/sales-representatives',
        dateBadgeText: '📅 Payroll Cycle: 2026-10-01 to 2026-10-31 | Total Commission: $2,981.00',
        primaryActionText: 'Export Commission Slips PDF',
        mockColumns: ['Agent Name', 'Invoices Generated', 'Total Sales Invoiced ($)', 'Commission Rate %', 'Gross Commission Earned ($)', 'Paid Out ($)', 'Balance Due ($)'],
        mockRows: [
          { 'Agent Name': 'David Sterling', 'Invoices Generated': '28 Invoices', 'Total Sales Invoiced ($)': '$45,800.00', 'Commission Rate %': '3.50%', 'Gross Commission Earned ($)': '$1,603.00', 'Paid Out ($)': '$0.00', 'Balance Due ($)': '$1,603.00' },
          { 'Agent Name': 'Jessica Alba', 'Invoices Generated': '19 Invoices', 'Total Sales Invoiced ($)': '$32,100.00', 'Commission Rate %': '2.00%', 'Gross Commission Earned ($)': '$642.00', 'Paid Out ($)': '$0.00', 'Balance Due ($)': '$642.00' },
          { 'Agent Name': 'Michael Chang', 'Invoices Generated': '14 Invoices', 'Total Sales Invoiced ($)': '$18,400.00', 'Commission Rate %': '4.00%', 'Gross Commission Earned ($)': '$736.00', 'Paid Out ($)': '$0.00', 'Balance Due ($)': '$736.00' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Commission Cycle Date Range',
          fieldOrSection: 'Top Date Control',
          instruction: 'Select payroll period in YYYY-MM-DD format to compute commissions.',
          whereToEnterDate: 'Commission Period Start and End dates: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 2,
          label: 'Gross Commission Earned Column',
          fieldOrSection: 'Grid Column 5',
          instruction: 'Computed as: Total Sales Invoiced * (Commission Rate / 100).',
        },
      ],
      fields: [
        {
          name: 'Commission Period Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets the payroll cycle for commission calculation.',
          functionality: 'Sums sales invoices facilitated by the agent within dates.',
          validationRules: 'Valid calendar dates.',
        },
      ],
    },
  ],
  bestPractices: [
    'Always generate the Profit & Loss statement with both Start Date and End Date aligned to your official financial month.',
    'Reconcile the GST/Tax Summary report with your external government tax portal before final tax remittance.',
    'Review the Product Sell Report monthly to discontinue low-margin, slow-moving dead stock.',
  ],
  troubleshooting: [
    {
      issue: 'Report shows unpopulated or zero values',
      solution:
        'Verify that your date range filter includes periods with recorded sales or purchases, and confirm that the selected location filter includes active stores.',
    },
  ],
};
