import { DocModule } from './types';

export const salesDoc: DocModule = {
  id: 'sales',
  title: '6. Sales, POS Terminal & Invoicing',
  category: 'Revenue & Commercial Checkout',
  iconName: 'Receipt',
  overview:
    'Complete retail and wholesale commercial billing engine: touchscreen POS terminal with high-speed barcode scanning, B2B tax invoices, quotations/estimates, draft invoice holding, payment receipts, and customer sales returns (Credit Notes).',
  workflowSteps: [
    {
      step: 1,
      title: 'Counter Fast Checkout via POS Terminal',
      description:
        'Cashiers scan barcodes or tap touchscreen product tiles, apply line discounts, select payment tender (Cash, Card, UPI, Split), and print thermal receipts.',
    },
    {
      step: 2,
      title: 'Generate B2B Commercial Tax Invoices (Add Sale)',
      description:
        'Create formal B2B invoices with customer GSTIN/VAT, shipping addresses, payment terms, and HSN tax breakdowns.',
    },
    {
      step: 3,
      title: 'Manage Quotations & Estimates',
      description:
        'Provide price quotations to commercial prospective buyers, converting approved quotes into finalized sales with one click.',
    },
    {
      step: 4,
      title: 'Hold & Resume Incomplete Carts (Drafts)',
      description:
        'Save customer baskets on hold as Drafts during peak retail queues and resume checkout when the customer returns.',
    },
    {
      step: 5,
      title: 'Process Customer Returns & Credit Notes',
      description:
        'Accept returned items, inspect condition, return items to warehouse inventory, and issue customer refunds or store credit notes.',
    },
  ],
  submenus: [
    {
      id: 'all_sales_list',
      title: 'All Sales Invoices & Billing Register',
      menuPath: 'Sales > All Sales',
      whyItIsUsed:
        'Master register of all finalized commercial invoices and POS transactions across all retail branches, tracking invoice reference numbers, customer names, payment status (Paid, Partial, Due), delivery status, and revenue totals.',
      howToUse: [
        '1. Click "Sales" > "All Sales" in the primary navigation sidebar.',
        '2. Filter by Business Location, Customer, Payment Status (Paid / Due / Partial), or Date Range.',
        '3. Use the global search to find invoices by Invoice Number or Customer Phone.',
        '4. Click "View" to open the formal invoice modal; click "Print" to output A4 or thermal receipts.',
        '5. Click "Add Payment" to record balance collections against credit sales.',
        '6. Click "Return" to initiate a Sales Return (Credit Note).',
      ],
      whereToEnterDate:
        'In the All Sales view, date filtering is managed via the "Invoice Date Range" picker at the top-right [YYYY-MM-DD]. Specify Start Date and End Date to audit revenue within any fiscal time window. Each table row displays the official "Invoice Date" [YYYY-MM-DD HH:MM] representing the exact second the sale was recorded.',
      description:
        'Master billing register tracking finalized sales invoices, payment collections, customer dues, and credit notes.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Sales Invoices & Commercial Register',
        urlPath: 'https://pos.royal-erp.internal/#/sales/list',
        dateBadgeText: '📅 Filter: Invoice Date [2026-10-01 to 2026-10-04] | FY 2026-27',
        primaryActionText: '+ Add New Sale',
        filterOptions: ['All Locations', 'Fully Paid', 'Payment Due', 'Partial Payment', 'POS Sales Only', 'B2B Invoices Only'],
        mockColumns: ['Invoice Date', 'Invoice No', 'Customer Name', 'Location', 'Payment Status', 'Total Amount', 'Total Paid', 'Amount Due', 'Actions'],
        mockRows: [
          { 'Invoice Date': '2026-10-04 10:14', 'Invoice No': 'INV-2026-0881', 'Customer Name': 'Robert Harrison', Location: 'Main Flagship', 'Payment Status': 'Paid', 'Total Amount': '$159.98', 'Total Paid': '$159.98', 'Amount Due': '$0.00', Actions: 'View | Print | Return' },
          { 'Invoice Date': '2026-10-04 11:32', 'Invoice No': 'INV-2026-0882', 'Customer Name': 'Apex Hardware Ltd', Location: 'Main Flagship', 'Payment Status': 'Due', 'Total Amount': '$1,240.00', 'Total Paid': '$0.00', 'Amount Due': '$1,240.00', Actions: 'View | Pay Due | Return' },
          { 'Invoice Date': '2026-10-04 12:05', 'Invoice No': 'INV-2026-0883', 'Customer Name': 'Walk-in Customer', Location: 'East Counter', 'Payment Status': 'Paid', 'Total Amount': '$79.99', 'Total Paid': '$79.99', 'Amount Due': '$0.00', Actions: 'View | Print' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Sale Primary Action',
          fieldOrSection: 'Top Right Header Bar',
          instruction: 'Click to open the backend B2B tax invoice generator.',
        },
        {
          pinNumber: 2,
          label: 'Invoice Date Range Picker',
          fieldOrSection: 'Top Filter Bar',
          instruction: 'Select fiscal date boundary to compute gross sales and taxes.',
          whereToEnterDate: 'Click calendar icon to input Start Date and End Date in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Payment Status & Due Balance Columns',
          fieldOrSection: 'Grid Columns 5 & 8',
          instruction: 'Red badge flags unpaid credit balances requiring collection follow-up.',
        },
        {
          pinNumber: 4,
          label: 'Row Actions: View, Print, Pay Due, Return',
          fieldOrSection: 'Rightmost Column',
          instruction: 'Instant shortcuts to print PDF, record payment collections, or issue returns.',
        },
      ],
      fields: [
        {
          name: 'Invoice Date',
          type: 'DateTime (YYYY-MM-DD HH:MM)',
          required: true,
          purpose: 'Official transaction execution timestamp for sales ledger and tax periods.',
          functionality: 'Dictates the fiscal tax period for GSTR-1 and VAT output liability.',
          validationRules: 'Cannot be in the future.',
        },
        {
          name: 'Invoice Number',
          type: 'Text (Unique Voucher Reference)',
          required: true,
          purpose: 'Sequential document identifier printed on customer bills.',
          functionality: 'Auto-generated using prefix configured in Settings (e.g. INV-2026-0001).',
          validationRules: 'Unique alphanumeric voucher number.',
        },
        {
          name: 'Amount Due (Receivable)',
          type: 'Computed Currency',
          required: false,
          purpose: 'Unpaid invoice balance added to the customer’s ledger balance.',
          functionality: 'Calculated as: Total Amount - Total Paid.',
          validationRules: 'Non-negative number.',
        },
      ],
    },
    {
      id: 'pos_sales_list',
      title: 'POS Transactions Register',
      menuPath: 'Sales > POS Transactions',
      whyItIsUsed:
        'Filtered sales register isolating front-counter POS checkout tickets, showing cashier username, cash register shift, receipt number, payment mode breakdown (Cash, Card, UPI), and thermal printing shortcuts.',
      howToUse: [
        '1. Open Sales > POS Transactions.',
        '2. Filter by Cashier Staff member or Register Shift.',
        '3. Inspect payment breakdown to balance the physical cash drawer at end of day.',
        '4. Click "Reprint Receipt" to generate duplicate thermal slips for customers.',
      ],
      whereToEnterDate:
        'In POS Transactions, date selection occurs via the "Shift Date" filter [YYYY-MM-DD] to reconcile cash register drawer tallies against the day’s closing report.',
      description:
        'Filtered register dedicated to front-counter POS terminal receipts, cashier shifts, and payment methods.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Front Counter POS Sales Register',
        urlPath: 'https://pos.royal-erp.internal/#/sales/pos-transactions',
        dateBadgeText: '📅 Counter Shift: Today (2026-10-04) | Shift #1',
        primaryActionText: 'Launch POS Terminal',
        mockColumns: ['Time', 'Receipt #', 'Cashier', 'Customer', 'Items', 'Payment Tender', 'Total Amount', 'Actions'],
        mockRows: [
          { Time: '10:14 AM', 'Receipt #': 'REC-901', Cashier: 'Marcus Chen', Customer: 'Walk-in Customer', Items: '2 Items', 'Payment Tender': 'Cash', 'Total Amount': '$45.00', Actions: 'Reprint | View' },
          { Time: '10:48 AM', 'Receipt #': 'REC-902', Cashier: 'Marcus Chen', Customer: 'Sarah Connor', Items: '4 Items', 'Payment Tender': 'UPI / QR', 'Total Amount': '$120.50', Actions: 'Reprint | View' },
          { Time: '11:15 AM', 'Receipt #': 'REC-903', Cashier: 'Elena R.', Customer: 'David Smith', Items: '1 Item', 'Payment Tender': 'Credit Card', 'Total Amount': '$79.99', Actions: 'Reprint | View' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Launch POS Terminal Button',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'One-click launch into the fullscreen cashier terminal interface.',
        },
        {
          pinNumber: 2,
          label: 'Payment Tender Column',
          fieldOrSection: 'Grid Column 6',
          instruction: 'Shows whether receipt was settled in physical Cash, Card, or Digital UPI.',
        },
      ],
      fields: [
        {
          name: 'Payment Tender',
          type: 'Select (Cash | Card | UPI | Split)',
          required: true,
          purpose: 'Records payment mode used at the checkout counter.',
          functionality: 'Routes collection into the corresponding Cash or Bank account ledger.',
          validationRules: 'Must match an active Payment Method.',
        },
      ],
    },
    {
      id: 'add_sale_form',
      title: 'Add Sales Invoice (B2B Tax Invoice & Commercial Bill)',
      menuPath: 'Sales > Add Sale',
      whyItIsUsed:
        'Creates formal commercial B2B sales invoices with full customer billing and shipping address blocks, statutory tax rates, HSN breakdowns, payment terms (e.g. Net 30), and accounts receivable credit ledger posting.',
      howToUse: [
        '1. Navigate to Sales > Add Sale.',
        '2. Select Customer (or create new B2B client profile).',
        '3. Choose Business Location and Price Scheme (e.g. Retail vs Wholesale).',
        '4. Set Invoice Date [YYYY-MM-DD] and Payment Terms (e.g. 15 Days).',
        '5. Search and add product line items: adjust quantities, unit prices, or item discounts.',
        '6. Inspect statutory HSN/SAC tax breakdown (CGST, SGST, IGST or VAT).',
        '7. Fill in Shipping Details, Transport Vehicle Number, and Packaging Notes.',
        '8. If paying now, enter Payment Amount and Payment Method; or leave as Due for credit sales.',
        '9. Click "Save & Print Tax Invoice" to generate the legal A4 invoice.',
      ],
      whereToEnterDate:
        'In the Add Sale form, date entry occurs in two explicit locations: 1) "Invoice Date [YYYY-MM-DD]" in Section 1 (Header), which establishes the legal tax invoice date and general ledger revenue timestamp; and 2) "Payment Due Date [YYYY-MM-DD]" in Section 2 (Credit Terms), which dictates accounts receivable aging and automatic payment reminder alerts.',
      description:
        'Comprehensive B2B commercial invoice generator with tax slabs, credit term calculators, and shipping notes.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Commercial B2B Tax Invoice Generator',
        urlPath: 'https://pos.royal-erp.internal/#/sales/add',
        dateBadgeText: '📅 Invoice Date: Required [YYYY-MM-DD] | GST / VAT Ready',
        primaryActionText: 'Save & Generate Tax Invoice',
        formSections: [
          {
            title: '1. Customer & Invoicing Header Information',
            fields: [
              { label: 'Customer Name *', placeholder: 'Select: Apex Hardware Ltd (B2B Client)', isRequired: true, pinNumber: 1 },
              { label: 'Billing Location *', placeholder: 'Select: Main Flagship Store', isRequired: true },
              { label: 'Invoice Date *', placeholder: 'YYYY-MM-DD (e.g. 2026-10-04)', isDate: true, isRequired: true, pinNumber: 2 },
              { label: 'Invoice Scheme / Prefix', placeholder: 'Select: Commercial Tax Invoice (INV-)' },
            ],
          },
          {
            title: '2. Credit Terms & Due Date',
            fields: [
              { label: 'Payment Terms (Days)', placeholder: '30 Days Net' },
              { label: 'Payment Due Date *', placeholder: 'YYYY-MM-DD (e.g. 2026-11-03)', isDate: true, pinNumber: 3 },
            ],
          },
          {
            title: '3. Line Items & HSN Tax Engine',
            fields: [
              { label: 'Search Item / Barcode', placeholder: 'Scan or type SKU...', pinNumber: 4 },
              { label: 'Sample Row', placeholder: 'SKU-001 | Qty: 10 Pcs | Rate: $79.99 | Tax: 18% | Total: $943.88' },
            ],
          },
          {
            title: '4. Summary, Discount & Payment',
            fields: [
              { label: 'Total Invoice Amount', placeholder: '$943.88 (Inclusive of Tax)' },
              { label: 'Amount Paid Now ($)', placeholder: '$0.00 (or enter cash/bank payment)', pinNumber: 5 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Customer Selection Dropdown',
          fieldOrSection: 'Section 1: Party Header',
          instruction: 'Select commercial buyer; system loads address, tax ID, and credit limit.',
        },
        {
          pinNumber: 2,
          label: 'Invoice Date Input',
          fieldOrSection: 'Section 1: Invoicing Date',
          instruction: 'Specify the legal tax invoice date in YYYY-MM-DD format.',
          whereToEnterDate: 'Invoice Date field in Section 1: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Payment Due Date Input',
          fieldOrSection: 'Section 2: Credit Terms',
          instruction: 'Specifies when customer payment matures for accounts receivable tracking.',
          whereToEnterDate: 'Payment Due Date field in Section 2: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 4,
          label: 'Line Item Scanner & Grid',
          fieldOrSection: 'Section 3: Product Items',
          instruction: 'Add items, adjust selling prices, and apply line item discounts.',
        },
        {
          pinNumber: 5,
          label: 'Immediate Payment Disbursement',
          fieldOrSection: 'Section 4: Payment Drawer',
          instruction: 'Specify amount collected upfront or leave balance as accounts receivable.',
        },
        {
          pinNumber: 6,
          label: 'Save & Print Invoice Action',
          fieldOrSection: 'Bottom Action Bar',
          instruction: 'Click to write invoice, decrement stock, and print formal tax invoice.',
        },
      ],
      fields: [
        {
          name: 'Invoice Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Establishes legal billing date for commercial accounting.',
          functionality: 'Dictates reporting period for sales tax declarations.',
          validationRules: 'Valid calendar date.',
        },
        {
          name: 'Payment Due Date',
          type: 'Date (YYYY-MM-DD)',
          required: false,
          purpose: 'Maturity date for receivables collection.',
          functionality: 'Flags invoice as overdue when system date surpasses this timestamp.',
          validationRules: 'Cannot be earlier than Invoice Date.',
        },
      ],
    },
    {
      id: 'list_drafts',
      title: 'Draft Invoices & Basket Holds',
      menuPath: 'Sales > Draft Invoices',
      whyItIsUsed:
        'Stores incomplete sales orders and cart baskets placed on hold by counter staff during peak queues, allowing cashiers to attend to other customers and resume the held transaction later without re-scanning items.',
      howToUse: [
        '1. In POS Terminal, click "Hold / Save as Draft" to put current cart on hold.',
        '2. Go to Sales > Draft Invoices to inspect all held baskets.',
        '3. Filter by Location or Cashier.',
        '4. Click "Resume in POS" to restore all items into the active checkout cart.',
        '5. Click "Delete" to cancel abandoned carts.',
      ],
      whereToEnterDate:
        'Draft invoices do not require manual date entry; they record the "Hold Timestamp" in YYYY-MM-DD HH:MM:SS format to track how long a basket has been held.',
      description:
        'Suspended shopping cart register holding multi-item orders for later resumption and finalization.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Draft Invoices & Suspended Baskets',
        urlPath: 'https://pos.royal-erp.internal/#/sales/drafts',
        dateBadgeText: '⏱️ Cart Holds: Temporary Session Cache',
        primaryActionText: '+ Create New Draft',
        mockColumns: ['Draft Timestamp', 'Draft Ref #', 'Customer', 'Location', 'Total Items', 'Total Value', 'Held By', 'Actions'],
        mockRows: [
          { 'Draft Timestamp': '2026-10-04 11:20', 'Draft Ref #': 'DFT-0941', Customer: 'Walk-in Customer', Location: 'Main Flagship', 'Total Items': '3 Items', 'Total Value': '$145.00', 'Held By': 'Marcus Chen', Actions: 'Resume in POS | Delete' },
          { 'Draft Timestamp': '2026-10-04 11:45', 'Draft Ref #': 'DFT-0942', Customer: 'Robert Harrison', Location: 'Main Flagship', 'Total Items': '8 Items', 'Total Value': '$620.00', 'Held By': 'Elena R.', Actions: 'Resume in POS | Delete' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Resume in POS Primary Action',
          fieldOrSection: 'Row Actions Column',
          instruction: 'Click to load all line items back onto the active POS terminal screen.',
        },
        {
          pinNumber: 2,
          label: 'Draft Hold Timestamp',
          fieldOrSection: 'Grid Column 1',
          instruction: 'Shows the exact time the customer basket was suspended.',
        },
      ],
      fields: [
        {
          name: 'Draft Reference',
          type: 'Text (Draft ID)',
          required: true,
          purpose: 'Identifier for recalling the held basket.',
          functionality: 'Restores items into POS cart session.',
          validationRules: 'Auto-generated.',
        },
      ],
    },
    {
      id: 'list_quotations',
      title: 'Quotations & Price Estimates',
      menuPath: 'Sales > Quotations & Estimates',
      whyItIsUsed:
        'Generates commercial price estimates and formal proforma quotations for prospective buyers with validity expiration dates, terms of delivery, and one-click conversion to finalized sales invoices.',
      howToUse: [
        '1. Go to Sales > Quotations & Estimates.',
        '2. Click "+ Create Quotation".',
        '3. Select Customer, Quotation Date [YYYY-MM-DD], and Expiration Validity Date [YYYY-MM-DD].',
        '4. Add proposed products, quantities, and negotiated price discounts.',
        '5. Print or email the official Quotation PDF to the client.',
        '6. When the client approves, click "Convert to Invoice" to finalize the sale and reserve stock.',
      ],
      whereToEnterDate:
        'In Quotations, date entry occurs in two fields: 1) "Quotation Date [YYYY-MM-DD]" (issue date); and 2) "Quotation Validity Expiry Date [YYYY-MM-DD]" which dictates when the offered pricing terms expire.',
      description:
        'Proforma quotation generator with validity expiration dates and one-click invoice conversion.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Price Quotations & Commercial Estimates',
        urlPath: 'https://pos.royal-erp.internal/#/sales/quotations',
        dateBadgeText: '📅 Quotations Scope: Active Commercial Pipeline',
        primaryActionText: '+ Create New Quotation',
        mockColumns: ['Quote Date', 'Quote Ref #', 'Customer Name', 'Expiry Date', 'Total Value', 'Status', 'Actions'],
        mockRows: [
          { 'Quote Date': '2026-10-02', 'Quote Ref #': 'QT-2026-042', 'Customer Name': 'Metro Superstore', 'Expiry Date': '2026-10-16', 'Total Value': '$4,800.00', Status: 'Sent to Client', Actions: 'Convert to Invoice | Edit | PDF' },
          { 'Quote Date': '2026-10-04', 'Quote Ref #': 'QT-2026-043', 'Customer Name': 'Apex Hardware Ltd', 'Expiry Date': '2026-10-18', 'Total Value': '$1,950.00', Status: 'Draft', Actions: 'Convert to Invoice | Edit | PDF' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Create Quotation Action',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to open the proforma quotation creation screen.',
        },
        {
          pinNumber: 2,
          label: 'Quotation Expiration Date Column',
          fieldOrSection: 'Grid Column 4',
          instruction: 'Indicates the date until which quoted pricing and discounts remain valid.',
          whereToEnterDate: 'Expiry Date field in Quotation form: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Convert to Invoice Action',
          fieldOrSection: 'Actions Column',
          instruction: 'Instantly turns the accepted quote into a live sales invoice.',
        },
      ],
      fields: [
        {
          name: 'Quotation Expiry Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Sets commercial deadline for quoted prices.',
          functionality: 'Prevents conversion to sale after deadline without managerial re-approval.',
          validationRules: 'Cannot be earlier than Quotation Date.',
        },
      ],
    },
    {
      id: 'sale_returns',
      title: 'Sales Returns & Customer Credit Notes',
      menuPath: 'Sales > Sales Returns (Credit Note)',
      whyItIsUsed:
        'Processes returns of sold merchandise from customers, restoring items back to physical warehouse inventory, generating a statutory Credit Note, and issuing cash refunds or adjusting customer credit dues.',
      howToUse: [
        '1. Go to Sales > Sales Returns (Credit Note).',
        '2. Click "+ Add Sales Return".',
        '3. Enter original Invoice Reference Number (or select Customer).',
        '4. Set Return Date [YYYY-MM-DD] and Return Reason (Defective, Exchange, Customer Changed Mind).',
        '5. Specify returned quantities and unit refund values.',
        '6. Select Refund Settlement: Cash Refund, Bank Transfer, or Credit Note on Account.',
        '7. Click "Save Return & Issue Credit Note" to increment stock and adjust customer ledger.',
      ],
      whereToEnterDate:
        'In the Sales Return form, date entry occurs in the "Return Date [YYYY-MM-DD]" field. This sets the date when goods re-enter warehouse inventory and when the Credit Note is recorded for tax deductions.',
      description:
        'Merchandise return management issuing legal Credit Notes and restoring items to inventory balance.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Sales Returns & Credit Notes Register',
        urlPath: 'https://pos.royal-erp.internal/#/sales/returns',
        dateBadgeText: '📅 Credit Notes Scope: FY 2026-27 | Stock Auto-Incremented',
        primaryActionText: '+ Add Sales Return',
        mockColumns: ['Return Date', 'Credit Note #', 'Original Invoice #', 'Customer Name', 'Returned Items', 'Refund Total', 'Status', 'Actions'],
        mockRows: [
          { 'Return Date': '2026-10-04', 'Credit Note #': 'CN-2026-018', 'Original Invoice #': 'INV-2026-0881', 'Customer Name': 'Robert Harrison', 'Returned Items': '1 Pc (Headset)', 'Refund Total': '$79.99', Status: 'Refunded (Cash)', Actions: 'View | Print Credit Note' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Sales Return Button',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'Click to launch the customer return processing form.',
        },
        {
          pinNumber: 2,
          label: 'Return Date Input',
          fieldOrSection: 'Return Form Header',
          instruction: 'Input the physical return date in YYYY-MM-DD format.',
          whereToEnterDate: 'Return Date calendar field: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Credit Note Number Column',
          fieldOrSection: 'Grid Column 2',
          instruction: 'Official tax document reducing the business’s output tax liability.',
        },
      ],
      fields: [
        {
          name: 'Return Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Official timestamp for the return event.',
          functionality: 'Restores inventory quantities and reduces gross sales figures.',
          validationRules: 'Cannot be earlier than original sale date.',
        },
      ],
    },
    {
      id: 'pos_terminal',
      title: 'POS Terminal (Touch & Barcode Fast Checkout)',
      menuPath: 'Sales > POS Terminal',
      whyItIsUsed:
        'High-performance touchscreen and barcode scanning counter terminal designed for rapid retail checkout, featuring category filter tabs, hotkeys, customer phone lookup, discount keys, split tender, and instant thermal receipt printing.',
      howToUse: [
        '1. Click "POS Terminal" in the primary sidebar or top navigation bar.',
        '2. Select or search customer (defaults to Walk-in Customer).',
        '3. Scan item barcode with hardware scanner, or tap category buttons and product cards.',
        '4. Adjust item quantities or line discounts using keyboard shortcuts or on-screen keypad.',
        '5. Press F4 or click "Pay / Checkout" to open the payment modal.',
        '6. Select Tender Mode: Cash, Card, UPI / QR, or Multi-Pay (Split Tender).',
        '7. Enter tender received; system computes change to return.',
        '8. Click "Finalize Sale & Print Receipt" (Shortcut: Ctrl+Enter).',
      ],
      whereToEnterDate:
        'In the POS Terminal, the transaction date defaults to the real-time system clock (YYYY-MM-DD HH:MM:SS) for rapid counter checkout. Cashiers with authorized supervisor permissions can click the "Edit Shift Date" icon in the header to backdate a sale (Format: YYYY-MM-DD) if entering offline handwritten tickets.',
      description:
        'Rapid checkout cashier terminal with touchscreen tiles, barcode scanning, hotkeys, and thermal printing.',
      mockup: {
        viewType: 'pos',
        windowTitle: 'Royal ERP - Point of Sale (POS) Counter Terminal',
        urlPath: 'https://pos.royal-erp.internal/#/pos',
        dateBadgeText: '⚡ Active Register: Register #01 | Date: 2026-10-04 (Live)',
        primaryActionText: 'Pay & Finalize (F4)',
        mockColumns: ['Item Name', 'Price', 'Qty', 'Discount', 'Total Amount', 'Delete'],
        mockRows: [
          { 'Item Name': 'Sony Wireless Headset (SKU-001)', Price: '$79.99', Qty: '1', Discount: '$0.00', 'Total Amount': '$79.99', Delete: '✕' },
          { 'Item Name': 'USB-C Charging Cable 2M', Price: '$12.00', Qty: '2', Discount: '$2.00', 'Total Amount': '$22.00', Delete: '✕' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Customer Phone Lookup & Selector',
          fieldOrSection: 'Top POS Header Bar',
          instruction: 'Type customer phone or name to attach loyalty points and credit limits.',
        },
        {
          pinNumber: 2,
          label: 'Barcode Search & Category Quick Tabs',
          fieldOrSection: 'Right Catalog Panel',
          instruction: 'Scan barcode or tap categories (Electronics, Apparel) to populate cart.',
        },
        {
          pinNumber: 3,
          label: 'Active Cart Items Grid',
          fieldOrSection: 'Left Billing Window',
          instruction: 'Displays scanned items, quantities, unit prices, and line discounts.',
        },
        {
          pinNumber: 4,
          label: 'Hold Cart & Suspend Order Action',
          fieldOrSection: 'Bottom Left Utility Buttons',
          instruction: 'Put current cart on hold as a Draft to attend to next customer.',
        },
        {
          pinNumber: 5,
          label: 'Finalize Pay & Print Button (F4)',
          fieldOrSection: 'Bottom Action Bar (Right)',
          instruction: 'Click or press F4 to open the payment modal and print receipt.',
        },
      ],
      fields: [
        {
          name: 'Barcode Scan Input',
          type: 'Text (Hardware Scanner Auto-Focus)',
          required: true,
          purpose: 'Receives barcode signals directly from handheld scanner.',
          functionality: 'Instantly appends item to cart or increments quantity if already present.',
          validationRules: 'Matches registered product barcode or SKU.',
        },
      ],
    },
  ],
  bestPractices: [
    'Use POS Terminal hotkeys (F4 for Pay, F2 for Search, Esc to Clear) to maximize checkout speed.',
    'Always verify customer mobile numbers during POS checkout to build repeat customer loyalty profiles.',
    'Ensure thermal printers have sufficient paper roll before opening morning cashier registers.',
  ],
  troubleshooting: [
    {
      issue: 'Cashier cannot finalize sale due to credit limit error',
      solution:
        'The customer’s unpaid balance exceeds their permitted Credit Limit. Collect cash for the current invoice or increase credit limit under Contacts > Customers.',
    },
    {
      issue: 'Thermal receipt prints with scrambled characters',
      solution:
        'Navigate to Settings > Printer Configuration. Ensure printer type is set to "Thermal 80mm" or "58mm" and correct character encoding (UTF-8 / ESC/POS) is selected.',
    },
  ],
};
