import { DocModule } from './types';

export const transfersDoc: DocModule = {
  id: 'transfer_adjustment',
  title: '7. Stock Transfers & Inventory Adjustments',
  category: 'Warehouse & Stock Balancing',
  iconName: 'ArrowLeftRight',
  overview:
    'Internal inventory reallocation and reconciliation workflows: moving merchandise between retail outlets or warehouse depots (Branch Transfers) and true-up reconciliations for damaged, expired, lost, or surplus stock uncovered during physical cycle counts (Stock Adjustments).',
  workflowSteps: [
    {
      step: 1,
      title: 'Dispatch Stock from Source Facility (Branch Transfer)',
      description:
        'Initiate a transfer from Source Location (e.g. Central Warehouse) to Destination Location (e.g. East Counter).',
    },
    {
      step: 2,
      title: 'Track Goods in Transit & Confirm Receipt',
      description:
        'Mark shipment as "In Transit" with transport details, then update to "Completed" upon physical delivery and verification at the receiving outlet.',
    },
    {
      step: 3,
      title: 'Conduct Physical Cycle Counts & Audits',
      description:
        'Compare physical shelf counts against system on-hand balances in Product History.',
    },
    {
      step: 4,
      title: 'Record Stock Adjustments (Damage, Expiry, Discrepancy)',
      description:
        'Create an Adjustment Voucher to deduct damaged or expired units, or increment unrecorded surplus items, posting to the Inventory Loss account.',
    },
  ],
  submenus: [
    {
      id: 'stock_adjustments',
      title: 'Stock Adjustments (Damage, Loss, Expiry, Surplus)',
      menuPath: 'Stock Transfer > Stock Adjustments',
      whyItIsUsed:
        'Reconciles system inventory with physical stock counts by writing off broken, expired, or stolen items, or adding unrecorded surplus stock found during physical audits, maintaining precise asset valuation.',
      howToUse: [
        '1. Go to Stock Transfer > Stock Adjustments.',
        '2. Click "+ Add Stock Adjustment".',
        '3. Select Business Location where variance occurred.',
        '4. Set Adjustment Date [YYYY-MM-DD] and Adjustment Type: "Normal" (minor variance) or "Abnormal" (major loss/theft).',
        '5. Search and add product items.',
        '6. Enter adjusted quantity (+ for surplus additions, - for damage write-offs).',
        '7. Enter Total Amount Recovered (if scrap was sold) and input Reason / Notes.',
        '8. Click "Save Adjustment" to immediately update stock balance and write off financial costs.',
      ],
      whereToEnterDate:
        'In Stock Adjustments, date entry occurs in the "Adjustment Date [YYYY-MM-DD]" field at the top of the creation form. In the main adjustments register, use the "Date Range Filter" [YYYY-MM-DD] to audit inventory shrinkage over monthly or quarterly cycles.',
      description:
        'Inventory shrinkage and write-off reconciliation interface for damage, expiry, theft, and physical audit variances.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Stock Adjustment & Shrinkage Register',
        urlPath: 'https://pos.royal-erp.internal/#/transfers/adjustments',
        dateBadgeText: '📅 Audit Cycle: FY 2026-27 | Inventory True-Up Active',
        primaryActionText: '+ Add Stock Adjustment',
        mockColumns: ['Adjustment Date', 'Voucher Ref #', 'Location', 'Adjustment Type', 'Total Items', 'Total Cost Value', 'Reason', 'Actions'],
        mockRows: [
          { 'Adjustment Date': '2026-10-02', 'Voucher Ref #': 'ADJ-2026-004', Location: 'Main Flagship', 'Adjustment Type': 'Normal', 'Total Items': '2 Pcs', 'Total Cost Value': '$90.00', Reason: 'Water damage during cleaning', Actions: 'View | Print Voucher' },
          { 'Adjustment Date': '2026-10-04', 'Voucher Ref #': 'ADJ-2026-005', Location: 'Central Depot', 'Adjustment Type': 'Abnormal', 'Total Items': '1 Pc', 'Total Cost Value': '$180.00', Reason: 'Screen shattered during forklift move', Actions: 'View | Print Voucher' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Stock Adjustment Button',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'Click to open the inventory reconciliation voucher.',
        },
        {
          pinNumber: 2,
          label: 'Adjustment Date Input',
          fieldOrSection: 'Adjustment Form Header',
          instruction: 'Specify the physical audit date in YYYY-MM-DD format.',
          whereToEnterDate: 'Adjustment Date field: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Adjustment Type & Reason Notes',
          fieldOrSection: 'Form Details',
          instruction: 'Classify as Normal (routine shrinkage) or Abnormal (major theft/incident).',
        },
        {
          pinNumber: 4,
          label: 'Total Cost Value Written Off',
          fieldOrSection: 'Grid Column 6',
          instruction: 'Financial cost debited to Inventory Loss / Shrinkage account.',
        },
      ],
      fields: [
        {
          name: 'Adjustment Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Official timestamp for the inventory write-off.',
          functionality: 'Dictates the financial month for reporting inventory loss.',
          validationRules: 'Cannot be in the future.',
        },
        {
          name: 'Adjustment Type',
          type: 'Select (Normal | Abnormal)',
          required: true,
          purpose: 'Tax classification of the inventory shrinkage.',
          functionality: 'Normal loss is absorbed into COGS; Abnormal loss is posted as extraordinary loss.',
          validationRules: 'Must select Normal or Abnormal.',
        },
      ],
    },
    {
      id: 'branch_transfers',
      title: 'Branch & Warehouse Stock Transfers',
      menuPath: 'Stock Transfer > Branch Transfers',
      whyItIsUsed:
        'Coordinates and tracks the physical movement of inventory between corporate warehouses, central depots, and retail shop counters, preventing stock duplication and tracking items in transit.',
      howToUse: [
        '1. Go to Stock Transfer > Branch Transfers.',
        '2. Click "+ Add Branch Transfer".',
        '3. Select Source Location (Where items are deducted) and Destination Location (Where items are received).',
        '4. Set Transfer Date [YYYY-MM-DD].',
        '5. Set Transfer Status: "Pending", "In Transit", or "Completed".',
        '6. Add product items and quantities to transfer.',
        '7. Enter Shipping / Transport Charges and Vehicle Details.',
        '8. Click "Save Transfer" to generate the Delivery Challan / Transfer Gate Pass.',
        '9. Receiving store changes status to "Completed" upon physical receipt.',
      ],
      whereToEnterDate:
        'In Branch Transfers, date entry occurs in the "Transfer Date [YYYY-MM-DD]" field in the transfer creation form. When receiving goods, the receiving clerk logs the "Receipt Date [YYYY-MM-DD]". In the main list, use the Date Range Filter to audit inter-branch freight within any time window.',
      description:
        'Inter-branch stock movement coordination with delivery challans, in-transit tracking, and receipt verification.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Inter-Branch Stock Transfers & Logistics',
        urlPath: 'https://pos.royal-erp.internal/#/transfers/list',
        dateBadgeText: '🚚 Logistics Pipeline: 2 Consignments In Transit',
        primaryActionText: '+ Add Branch Transfer',
        mockColumns: ['Transfer Date', 'Transfer #', 'From Location', 'To Location', 'Status', 'Shipping Cost', 'Total Items', 'Actions'],
        mockRows: [
          { 'Transfer Date': '2026-10-03', 'Transfer #': 'TR-2026-022', 'From Location': 'Central Depot', 'To Location': 'Main Flagship', Status: 'Completed', 'Shipping Cost': '$25.00', 'Total Items': '40 Pcs', Actions: 'View Challan | Print' },
          { 'Transfer Date': '2026-10-04', 'Transfer #': 'TR-2026-023', 'From Location': 'Central Depot', 'To Location': 'East Counter', Status: 'In Transit', 'Shipping Cost': '$15.00', 'Total Items': '25 Pcs', Actions: 'Receive | View Challan' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Branch Transfer Action',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to open the inter-branch stock dispatch form.',
        },
        {
          pinNumber: 2,
          label: 'Transfer Date Input',
          fieldOrSection: 'Transfer Header',
          instruction: 'Specify the physical dispatch date in YYYY-MM-DD format.',
          whereToEnterDate: 'Transfer Date calendar input: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 3,
          label: 'Transfer Status Badge (In Transit / Completed)',
          fieldOrSection: 'Grid Column 5',
          instruction: 'Stock is deducted from source and held in transit until marked Completed.',
        },
        {
          pinNumber: 4,
          label: 'Print Delivery Challan',
          fieldOrSection: 'Actions Column',
          instruction: 'Generate the legal road transport gate pass for shipping vehicle.',
        },
      ],
      fields: [
        {
          name: 'Transfer Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Dispatch timestamp for inventory movement.',
          functionality: 'Deducts stock from source location at this timestamp.',
          validationRules: 'Cannot be in the future.',
        },
        {
          name: 'Transfer Status',
          type: 'Select (Pending | In Transit | Completed)',
          required: true,
          purpose: 'Physical custody state of the transferred items.',
          functionality: 'Completed status adds items to destination location inventory.',
          validationRules: 'Must select one of the three statuses.',
        },
      ],
    },
  ],
  bestPractices: [
    'Always generate and sign a physical Delivery Challan before trucks depart warehouse docks.',
    'Never mark a transfer as "Completed" until the receiving store verifies quantities against the packing list.',
    'Conduct periodic stock adjustments after physical inventory counts to keep system numbers true.',
  ],
  troubleshooting: [
    {
      issue: 'Transferred stock does not appear in receiving store',
      solution:
        'Verify the Transfer Status under Stock Transfer > Branch Transfers. If status is "In Transit", the receiving manager must click Edit and change status to "Completed".',
    },
  ],
};
