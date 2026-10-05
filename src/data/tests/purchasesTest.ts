import { TestingModule } from './types';

export const purchasesTest: TestingModule = {
  id: 'purchases',
  title: '5. Purchase Management & Inward Supply',
  category: 'Procurement & Logistics',
  iconName: 'ShoppingBag',
  overview: 'Verification of inward procurement workflows, Goods Receipt Note (GRN) processing, vendor billing, and automated stock increments.',
  testCases: [
    {
      id: 'TC-PUR-001',
      title: 'Procurement Dashboard & Filter Integrity',
      feature: 'Purchase Management',
      targetMenu: 'Purchases > All Purchases',
      whatToCheck: 'Verify that the purchase list displays all bills, their status (Received/Ordered/Pending), and payment status.',
      howToCheck: [
        '1. Navigate to Purchases > All Purchases.',
        '2. Filter by Status "Received".',
        '3. Verify that the table only shows received items.'
      ],
      positiveTesting: {
        inputData: 'Status Filter: "Received".',
        steps: ['Apply filter.', 'Verify results.'],
        expectedResult: 'List displays only purchase invoices marked as received.'
      },
      negativeTesting: [
        {
          scenario: 'Search with Invalid Invoice Number',
          inputData: 'Invoice No: "INV-999999" (Non-existent).',
          steps: ['Enter non-existent ID in search bar.'],
          expectedErrorOrBehavior: 'System shows "No purchases found".'
        }
      ],
      passCriteria: 'Purchase registry is reliable and filterable.'
    },
    {
      id: 'TC-PUR-002',
      title: 'Bulk Inward Procurement via Import',
      feature: 'Import Purchases',
      targetMenu: 'Purchases > Import Purchases',
      whatToCheck: 'Verify that purchase data can be imported from CSV files.',
      howToCheck: [
        '1. Upload a CSV with 10 purchase records.',
        '2. Map fields and import.'
      ],
      positiveTesting: {
        inputData: 'CSV: 10 Valid Purchase Records.',
        steps: ['Upload and map.', 'Import.'],
        expectedResult: '10 purchases are created in the system.'
      },
      negativeTesting: [
        {
          scenario: 'Importing with Missing Supplier',
          inputData: 'CSV row with supplier that does not exist.',
          steps: ['Try to import purchase for non-existent supplier.'],
          expectedErrorOrBehavior: 'System flags the row with "Supplier not found" error.'
        }
      ],
      passCriteria: 'Bulk purchase import is data-consistent.'
    },
    {
      id: 'TC-PUR-003',
      title: 'Purchase Order (PO) Creation & Stock Impact',
      feature: 'Add Purchase Order',
      targetMenu: 'Purchases > Add Purchase Order',
      whatToCheck: 'Ensure that finalizing a purchase increments stock correctly.',
      howToCheck: [
        '1. Note stock of Item A.',
        '2. Create purchase for 10 units of Item A.',
        '3. Mark as "Received".'
      ],
      positiveTesting: {
        inputData: 'Item: A; Qty: 10; Status: Received.',
        steps: ['Finalize purchase.'],
        expectedResult: 'Stock of Item A increases by 10 units.'
      },
      negativeTesting: [
        {
          scenario: 'Draft Purchase Stock impact',
          inputData: 'Qty: 10; Status: Ordered (Pending).',
          steps: ['Save as Ordered but not Received.'],
          expectedErrorOrBehavior: 'Stock levels do not increment until marked as "Received".'
        }
      ],
      passCriteria: 'Stock increments only on physical receipt.'
    },
    {
      id: 'TC-PUR-004',
      title: 'Internal Purchase Requisitions Workflow',
      feature: 'Purchase Requisitions',
      targetMenu: 'Purchases > Purchase Requisitions',
      whatToCheck: 'Verify that internal requests for stock can be created and tracked.',
      howToCheck: [
        '1. Create a requisition for 20 units of "Office Paper".',
        '2. Save and verify status is "Pending".'
      ],
      positiveTesting: {
        inputData: 'Item: Paper; Qty: 20.',
        steps: ['Create requisition.', 'View in list.'],
        expectedResult: 'Requisition is listed as "Pending" and available for manager approval.'
      },
      negativeTesting: [
        {
          scenario: 'Requisition for Zero Quantity',
          inputData: 'Qty: 0.',
          steps: ['Try to request 0 items.'],
          expectedErrorOrBehavior: 'Validation error: "Quantity must be greater than zero."'
        }
      ],
      passCriteria: 'Requisitions are manageable and valid.'
    },
    {
      id: 'TC-PUR-005',
      title: 'Purchase Returns: Debit Note Generation',
      feature: 'Purchase Returns',
      targetMenu: 'Purchases > Purchase Returns (Debit Note)',
      whatToCheck: 'Ensure that returning items to suppliers decrements stock and creates a debit note.',
      howToCheck: [
        '1. Select a purchase to return.',
        '2. Enter return quantity for an item.',
        '3. Save return.'
      ],
      positiveTesting: {
        inputData: 'Purchase ID: P001; Return Qty: 5.',
        steps: ['Select purchase.', 'Input return qty.', 'Save.'],
        expectedResult: 'Stock decrements by 5; supplier due decreases by return value.'
      },
      negativeTesting: [
        {
          scenario: 'Return Quantity Exceeding Purchased',
          inputData: 'Purchased: 10; Returning: 15.',
          steps: ['Try to return more than what was bought.'],
          expectedErrorOrBehavior: 'Error: "Return quantity cannot exceed purchased quantity."'
        }
      ],
      passCriteria: 'Returns accurately adjust stock and financial balances.'
    }
  ]
};
