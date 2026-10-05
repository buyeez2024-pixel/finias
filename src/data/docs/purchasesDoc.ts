import { DocModule } from './types';

export const purchasesDoc: DocModule = {
  id: 'purchases',
  title: '5. Purchase Management & Inward Supply',
  category: 'Procurement & Vendor Logistics',
  iconName: 'ShoppingBag',
  overview:
    'Complete inward procurement lifecycle: stock replenishment requisitions, purchase orders, goods receipt notes (GRN), vendor tax invoice processing, accounts payable, and purchase return debit notes.',
  workflowSteps: [
    {
      step: 1,
      title: 'Generate Purchase Requisition (Internal Demand)',
      description:
        'Store managers create requisitions when shelf items breach safety thresholds, routing to procurement for approval.',
    },
    {
      step: 2,
      title: 'Issue Purchase Order (PO) to Vendor',
      description:
        'Create a formal purchase bill specifying vendor, delivery destination branch, item quantities, and agreed unit costs.',
    },
    {
      step: 3,
      title: 'Receive Physical Goods (Goods Receipt / GRN)',
      description:
        'When shipment arrives, inspect goods and update Purchase Status from "Ordered" or "Pending" to "Received" to increment inventory stock.',
      tips: 'Only "Received" status purchase bills increment warehouse physical stock balances.',
    },
    {
      step: 4,
      title: 'Process Accounts Payable & Payment Terms',
      description:
        'Record payment status (Paid, Partial, Due) and disburse funds via Cash, Bank Wire, or Cheque.',
    },
    {
      step: 5,
      title: 'Process Purchase Returns (Debit Notes)',
      description:
        'If delivered stock is damaged or defective, issue a Purchase Return to reduce inventory and deduct vendor payables.',
    },
  ],
  submenus: [
    {
      id: 'all_purchases_list',
      title: 'All Purchases & Inward Goods Register',
      menuPath: 'Purchases > All Purchases',
      whyItIsUsed:
        'Master register of all vendor purchase orders and inward delivery receipts, tracking order reference numbers, supplier names, purchase status (Received/Pending/Ordered), payment status (Paid/Due), and total costs.',
      howToUse: [
        '1. Click "Purchases" in the sidebar, then select "All Purchases".',
        '2. Filter by Location, Supplier, Purchase Status, or Payment Status.',
        '3. Use the Date Range filter to inspect purchases within a specific fiscal month.',
        '4. Click "View" to inspect line items, or "Edit" to adjust costs or quantities.',
        '5. Click "Add Payment" to disburse payment against an outstanding purchase bill.',
        '6. Click "Return" to initiate a Purchase Return (Debit Note) for defective goods.',
      ],
      whereToEnterDate:
        'In All Purchases, date filtering is managed via the "Purchase Date Range" filter at the top-right [YYYY-MM-DD]. Each purchase row shows the official "Purchase Date" [YYYY-MM-DD] when the goods were ordered or received, and the "Payment Due Date" [YYYY-MM-DD] determining when accounts payable liabilities mature.',
      description:
        'Comprehensive register of vendor purchase orders, inward goods receipts, payment statuses, and debit notes.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Inward Purchases & Procurement Register',
        urlPath: 'https://pos.royal-erp.internal/#/purchases/list',
        dateBadgeText: '📅 Filter: Purchase Date [2026-10-01 to 2026-10-04] | FY 2026-27',
        primaryActionText: '+ Add Purchase Order',
        filterOptions: ['All Locations', 'Received Only', 'Pending Delivery', 'Payment Due', 'Fully Paid'],
        mockColumns: ['Purchase Date', 'Reference No', 'Location', 'Supplier Name', 'Purchase Status', 'Payment Status', 'Grand Total', 'Amount Due', 'Actions'],
        mockRows: [
          { 'Purchase Date': '2026-10-02', 'Reference No': 'PO-2026-108', Location: 'Main Flagship', 'Supplier Name': 'Acme Global Supplies', 'Purchase Status': 'Received', 'Payment Status': 'Paid', 'Grand Total': '$4,500.00', 'Amount Due': '$0.00', Actions: 'View | Print | Return' },
          { 'Purchase Date': '2026-10-03', 'Reference No': 'PO-2026-109', Location: 'Central Depot', 'Supplier Name': 'Pacific Wholesale Co', 'Purchase Status': 'Received', 'Payment Status': 'Due', 'Grand Total': '$3,200.00', 'Amount Due': '$3,200.00', Actions: 'View | Pay | Return' },
          { 'Purchase Date': '2026-10-04', 'Reference No': 'PO-2026-110', Location: 'Main Flagship', 'Supplier Name': 'Zenith Packaging', 'Purchase Status': 'Ordered', 'Payment Status': 'Due', 'Grand Total': '$1,150.00', 'Amount Due': '$1,150.00', Actions: 'Receive | Edit' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Purchase Order Primary Action',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to open the inward purchase bill creation screen.',
        },
        {
          pinNumber: 2,
          label: 'Purchase Date Range Filter',
          fieldOrSection: 'Filter Controls',
          instruction: 'Filter inward procurement bills between start and end calendar dates.',
          whereToEnterDate: 'Click to select Start and End dates in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Purchase Status Badge (Received / Ordered)',
          fieldOrSection: 'Grid Column 5',
          instruction: 'Received indicates stock is physically in warehouse and added to inventory balance.',
        },
        {
          pinNumber: 4,
          label: 'Payment Status & Amount Due',
          fieldOrSection: 'Grid Columns 6 & 8',
          instruction: 'Flags whether supplier bill has been paid or remains an accounts payable liability.',
        },
        {
          pinNumber: 5,
          label: 'Row Actions: View, Pay Due, Return',
          fieldOrSection: 'Rightmost Column',
          instruction: 'Launch payment voucher dialog or create debit note return.',
        },
      ],
      fields: [
        {
          name: 'Purchase Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Official accounting date of the purchase bill.',
          functionality: 'Dictates the fiscal tax month for claiming Input Tax Credits (ITC / VAT).',
          validationRules: 'Cannot be more than 30 days in the future.',
        },
        {
          name: 'Purchase Status',
          type: 'Select (Received | Pending | Ordered)',
          required: true,
          purpose: 'Physical inventory state of the ordered items.',
          functionality: 'Only "Received" status automatically increments warehouse stock on hand.',
          validationRules: 'Must select one of the three statuses.',
        },
        {
          name: 'Grand Total Amount',
          type: 'Computed Currency',
          required: true,
          purpose: 'Sum of item costs + shipping + taxes - supplier discounts.',
          functionality: 'Posted as a liability credit in Supplier Accounts Payable.',
          validationRules: 'Non-negative currency value.',
        },
      ],
    },
    {
      id: 'add_purchase_form',
      title: 'Add Purchase Order & Inward Bill Entry',
      menuPath: 'Purchases > Add Purchase Order',
      whyItIsUsed:
        'Enters new inward inventory shipments and vendor bills, recording Supplier, Destination Location, Purchase Date, Payment Terms, Line Items, Purchase Costs, Applicable Tax, and Initial Payment.',
      howToUse: [
        '1. Go to Purchases > Add Purchase Order.',
        '2. Select Supplier from the dropdown (or click "+ Add Supplier" for new vendors).',
        '3. Choose Destination Business Location where goods will physically reside.',
        '4. Set Purchase Date [YYYY-MM-DD] and Payment Terms (e.g. 30 Days).',
        '5. Set Purchase Status: "Received" (to add stock now) or "Ordered" (for advance POs).',
        '6. Search and add product line items: specify Quantity, Unit Purchase Cost, and Tax Slab.',
        '7. Enter Shipping Charges, Additional Discount, or Freight Notes.',
        '8. If paying immediately, fill in Payment Amount, Payment Mode (Cash/Bank), and Payment Date [YYYY-MM-DD].',
        '9. Click "Save Purchase" to finalize.',
      ],
      whereToEnterDate:
        'In the Add Purchase form, date entry occurs in two explicit locations: 1) "Purchase Date [YYYY-MM-DD]" in Section 1 (Header), which dictates the inventory capitalization date and Input Tax Credit period; and 2) "Payment Date [YYYY-MM-DD]" in Section 4 (Payment Section), which establishes the bank or cash voucher date for cash outflow tracking.',
      description:
        'Multi-line procurement entry form with automated tax calculations, landed cost allocations, and payment vouchers.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Inward Purchase Bill Entry',
        urlPath: 'https://pos.royal-erp.internal/#/purchases/add',
        dateBadgeText: '📅 Purchase Date: Required [YYYY-MM-DD] | Stock Auto-Increment',
        primaryActionText: 'Save Purchase & Inward Stock',
        formSections: [
          {
            title: '1. Vendor & Purchase Header Information',
            fields: [
              { label: 'Supplier Name *', placeholder: 'Select: Acme Global Supplies Ltd', isRequired: true, pinNumber: 1 },
              { label: 'Destination Location *', placeholder: 'Select: Main Flagship Outlet', isRequired: true },
              { label: 'Purchase Date *', placeholder: 'YYYY-MM-DD (e.g. 2026-10-04)', isDate: true, isRequired: true, pinNumber: 2 },
              { label: 'Purchase Status *', placeholder: 'Select: Received (Increments Stock)', isRequired: true, pinNumber: 3 },
            ],
          },
          {
            title: '2. Search & Add Inventory Line Items',
            fields: [
              { label: 'Search Products', placeholder: 'Scan barcode or type SKU / Name...', pinNumber: 4 },
              { label: 'Sample Item Added', placeholder: 'SKU-001 | Qty: 50 Pcs | Cost: $45.00 | Tax: 18% | Total: $2,655.00' },
            ],
          },
          {
            title: '3. Discounts, Freight & Grand Total',
            fields: [
              { label: 'Freight / Shipping ($)', placeholder: '$50.00' },
              { label: 'Purchase Grand Total', placeholder: '$2,705.00 (Auto-calculated)' },
            ],
          },
          {
            title: '4. Immediate Payment Disbursement (Optional)',
            fields: [
              { label: 'Payment Amount ($)', placeholder: '$2,705.00 (or partial amount)' },
              { label: 'Payment Mode', placeholder: 'Select: Bank Wire / Cash / Cheque' },
              { label: 'Payment Date *', placeholder: 'YYYY-MM-DD (e.g. 2026-10-04)', isDate: true, pinNumber: 5 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Supplier Selection Dropdown',
          fieldOrSection: 'Section 1: Vendor',
          instruction: 'Select vendor supplying the ordered stock.',
        },
        {
          pinNumber: 2,
          label: 'Purchase Date Input',
          fieldOrSection: 'Section 1: Date Input',
          instruction: 'Specify the inward invoice date in YYYY-MM-DD format.',
          whereToEnterDate: 'Purchase Date calendar field in Section 1: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Purchase Status (Received / Ordered)',
          fieldOrSection: 'Section 1: Status',
          instruction: 'Select Received to immediately increment current physical stock in the selected location.',
        },
        {
          pinNumber: 4,
          label: 'Product Search Barcode Input',
          fieldOrSection: 'Section 2: Item Grid',
          instruction: 'Type SKU or scan manufacturer barcode to append items to the bill.',
        },
        {
          pinNumber: 5,
          label: 'Payment Date Input',
          fieldOrSection: 'Section 4: Payment Voucher',
          instruction: 'Specify the cash outflow date if making an immediate payment.',
          whereToEnterDate: 'Payment Date field in Section 4: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 6,
          label: 'Save Purchase Action',
          fieldOrSection: 'Bottom Action Bar',
          instruction: 'Click to write purchase, update stock ledgers, and post accounts payable.',
        },
      ],
      fields: [
        {
          name: 'Purchase Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Official transaction date for financial ledger and inventory ledger posting.',
          functionality: 'Dictates the fiscal tax period for input tax credit claims.',
          validationRules: 'Valid calendar date.',
        },
        {
          name: 'Supplier',
          type: 'Select Dropdown',
          required: true,
          purpose: 'Identifies the vendor counterparty for payables accounting.',
          functionality: 'Updates vendor ledger with credit balance.',
          validationRules: 'Must select an existing registered supplier.',
        },
        {
          name: 'Line Items Grid',
          type: 'Dynamic Table (Item, Qty, Unit Cost, Tax, Line Total)',
          required: true,
          purpose: 'Specifies individual merchandise SKUs inwarded.',
          functionality: 'Computes purchase subtotal, tax amount, and updates cost prices.',
          validationRules: 'At least one line item with Quantity > 0 is mandatory.',
        },
      ],
    },
    {
      id: 'purchase_requisitions',
      title: 'Purchase Requisitions & Stock Requests',
      menuPath: 'Purchases > Purchase Requisitions',
      whyItIsUsed:
        'Allows branch supervisors and warehouse clerks to create formal stock replenishment requests when store supplies run low, routing them to central purchasing for approval and PO issuance.',
      howToUse: [
        '1. Go to Purchases > Purchase Requisitions.',
        '2. Review list of pending, approved, and fulfilled requisitions.',
        '3. Click "+ Create Purchase Requisition".',
        '4. Select Requesting Location and Required By Date [YYYY-MM-DD].',
        '5. Add products and requested quantities.',
        '6. Submit for approval. Once approved, click "Convert to Purchase Order" to generate a vendor PO.',
      ],
      whereToEnterDate:
        'In Purchase Requisitions, date entry is required in the "Required By Date" field [YYYY-MM-DD] to indicate the target arrival deadline for warehouse operations.',
      description:
        'Internal stock replenishment request workflow routing branch demands to purchasing managers.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Purchase Requisitions & Internal Demands',
        urlPath: 'https://pos.royal-erp.internal/#/purchases/requisitions',
        dateBadgeText: '📋 Requisition Pipeline: Active Demands',
        primaryActionText: '+ Create Requisition',
        mockColumns: ['Req Date', 'Requisition #', 'Requesting Branch', 'Required By Date', 'Items Count', 'Approval Status', 'Actions'],
        mockRows: [
          { 'Req Date': '2026-10-03', 'Requisition #': 'REQ-084', 'Requesting Branch': 'East Counter', 'Required By Date': '2026-10-08', 'Items Count': '6 SKUs', 'Approval Status': 'Pending Approval', Actions: 'Approve | Reject | View' },
          { 'Req Date': '2026-10-04', 'Requisition #': 'REQ-085', 'Requesting Branch': 'Main Flagship', 'Required By Date': '2026-10-10', 'Items Count': '12 SKUs', 'Approval Status': 'Approved', Actions: 'Convert to PO | View' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Create Requisition Button',
          fieldOrSection: 'Top Right Header',
          instruction: 'Click to launch the internal stock replenishment request form.',
        },
        {
          pinNumber: 2,
          label: 'Required By Date Column',
          fieldOrSection: 'Grid Column 4',
          instruction: 'Displays target delivery deadline for warehouse operations.',
          whereToEnterDate: 'Specify Required By Date in YYYY-MM-DD format in the requisition form.',
        },
        {
          pinNumber: 3,
          label: 'Convert to PO Action',
          fieldOrSection: 'Actions Column',
          instruction: 'Click to auto-populate a vendor Purchase Order with requested items.',
        },
      ],
      fields: [
        {
          name: 'Required By Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Deadline date when stock must physically be available at the branch.',
          functionality: 'Used to prioritize procurement logistics.',
          validationRules: 'Cannot be in the past.',
        },
      ],
    },
    {
      id: 'purchase_returns',
      title: 'Purchase Returns (Debit Note)',
      menuPath: 'Purchases > Purchase Returns (Debit Note)',
      whyItIsUsed:
        'Processes returns of damaged, expired, or non-conforming merchandise back to suppliers, automatically deducting inventory stock on hand and issuing a Debit Note to reduce accounts payable.',
      howToUse: [
        '1. Go to Purchases > Purchase Returns (Debit Note).',
        '2. Review past return records and debit note credit amounts.',
        '3. Click "+ Add Purchase Return".',
        '4. Select the original Purchase Order reference number or choose the Supplier directly.',
        '5. Specify Return Date [YYYY-MM-DD] and Return Reason (Damaged, Expired, Wrong Item).',
        '6. Specify returned quantities and unit refund costs.',
        '7. Click "Save Debit Note" to immediately decrement inventory and credit supplier account balance.',
      ],
      whereToEnterDate:
        'In the Purchase Return screen, enter the "Return Date [YYYY-MM-DD]" at the top of the form. This sets the date when inventory is written off warehouse stock and when the Debit Note is posted into the accounting ledger.',
      description:
        'Vendor return processing interface generating statutory Debit Notes and deducting damaged stock.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Purchase Returns & Debit Notes',
        urlPath: 'https://pos.royal-erp.internal/#/purchases/returns',
        dateBadgeText: '📅 Debit Notes Scope: FY 2026-27 | Stock Auto-Deducted',
        primaryActionText: '+ Add Purchase Return',
        mockColumns: ['Return Date', 'Debit Note #', 'Original PO Ref', 'Supplier Name', 'Returned Qty', 'Refund Total', 'Status', 'Actions'],
        mockRows: [
          { 'Return Date': '2026-10-04', 'Debit Note #': 'DN-2026-012', 'Original PO Ref': 'PO-2026-108', 'Supplier Name': 'Acme Global Supplies', 'Returned Qty': '5 Pcs', 'Refund Total': '$225.00', Status: 'Debit Note Issued', Actions: 'View | Print Debit Note' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Purchase Return Button',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to launch the return merchandise authorization dialog.',
        },
        {
          pinNumber: 2,
          label: 'Return Date Input',
          fieldOrSection: 'Header Form Controls',
          instruction: 'Specify the date of physical return in YYYY-MM-DD format.',
          whereToEnterDate: 'Return Date calendar picker: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Refund Total & Debit Note Number',
          fieldOrSection: 'Grid Columns 2 & 6',
          instruction: 'Financial liability deducted from outstanding accounts payable.',
        },
      ],
      fields: [
        {
          name: 'Return Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Timestamp for stock write-off and debit note posting.',
          functionality: 'Decrements warehouse quantity and reduces accounts payable balance.',
          validationRules: 'Cannot be earlier than original PO date.',
        },
      ],
    },
    {
      id: 'import_purchases',
      title: 'Bulk Purchases Spreadsheet Import',
      menuPath: 'Purchases > Import Purchases',
      whyItIsUsed:
        'Enables batch inwarding of historical purchase records, multi-container consignments, or electronic vendor data interchange (EDI) invoices from an Excel/CSV spreadsheet.',
      howToUse: [
        '1. Open Purchases > Import Purchases.',
        '2. Download the Purchases Import CSV template.',
        '3. Populate spreadsheet: Supplier Name, Purchase Date, Reference No, SKU, Quantity, Purchase Cost, Tax Rate.',
        '4. Upload the file and run validation checks.',
        '5. Click "Import Purchases" to inward the consignments in batch.',
      ],
      whereToEnterDate:
        'In the CSV import file, specify the purchase date in the "purchase_date" column using format YYYY-MM-DD (e.g. 2026-10-04).',
      description:
        'Batch spreadsheet importer for historical purchase invoices and multi-line vendor delivery consignments.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Bulk Purchase Consignment Importer',
        urlPath: 'https://pos.royal-erp.internal/#/purchases/import',
        dateBadgeText: '📄 Supported Formats: .CSV, .XLSX | Max: 2,000 Purchase Rows',
        primaryActionText: 'Validate & Inward Consignments',
        formSections: [
          {
            title: '1. Template Download & Column Mapping',
            fields: [
              { label: 'Download Template', placeholder: 'Download "purchases_import_template.csv" (Click to download)', pinNumber: 1 },
            ],
          },
          {
            title: '2. Select Purchase File',
            fields: [
              { label: 'Choose File *', placeholder: 'Drag and drop purchases.csv or click Browse', isRequired: true, pinNumber: 2 },
              { label: 'Default Destination Location', placeholder: 'Select: Main Flagship Outlet', isRequired: true, pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Template Download Button',
          fieldOrSection: 'Top Section',
          instruction: 'Get the exact column headers required for purchase batch processing.',
        },
        {
          pinNumber: 2,
          label: 'File Drag & Drop Area',
          fieldOrSection: 'Upload Zone',
          instruction: 'Attach completed CSV file.',
        },
      ],
      fields: [
        {
          name: 'Purchase CSV File',
          type: 'File Picker',
          required: true,
          purpose: 'Spreadsheet containing batch purchase records.',
          functionality: 'Parsed and validated against SKU and vendor masters.',
          validationRules: 'File size must not exceed 10 MB.',
        },
      ],
    },
  ],
  bestPractices: [
    'Always verify delivered physical quantities against the packing slip before marking Purchase Status as "Received".',
    'Review Purchase Requisitions weekly to consolidate vendor orders and negotiate bulk freight discounts.',
    'Ensure vendor tax numbers (GSTIN/VAT) are entered accurately to enable statutory tax input credits.',
  ],
  troubleshooting: [
    {
      issue: 'Stock did not increase after saving a purchase',
      solution:
        'Check the Purchase Status. If set to "Ordered" or "Pending", stock remains unchanged. Edit the purchase and change status to "Received" to increment inventory.',
    },
    {
      issue: 'Supplier balance shows incorrect due amount',
      solution:
        'Open Contacts > Supplier Ledger and cross-reference the inward purchase bill amounts against recorded payment vouchers and debit notes.',
    },
  ],
};
