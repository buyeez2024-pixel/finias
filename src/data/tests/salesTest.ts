import { TestingModule } from './types';

export const salesTest: TestingModule = {
  id: 'sales',
  title: '6. Sales, POS Terminal & Revenue Tracking',
  category: 'Revenue & Retail Operations',
  iconName: 'Receipt',
  overview: 'Verification of high-frequency POS terminal operations, barcode scanning speed, cart calculations, multi-tender payments, and tax invoice generation.',
  testCases: [
    {
      id: 'TC-SAL-001',
      title: 'Sales Dashboard & Fiscal Summary',
      feature: 'Sales Management',
      targetMenu: 'Sales > All Sales',
      whatToCheck: 'Verify that the all sales list provides a comprehensive overview of all transactions, showing payment status and shipping details.',
      howToCheck: [
        '1. Navigate to Sales > All Sales.',
        '2. Filter by Payment Status "Partial".',
        '3. Verify that the table only shows partially paid invoices.'
      ],
      positiveTesting: {
        inputData: 'Payment Filter: "Partial".',
        steps: ['Apply payment filter.', 'Verify totals.'],
        expectedResult: 'List displays only invoices with outstanding balances.'
      },
      negativeTesting: [
        {
          scenario: 'Filtering by Future Date',
          inputData: 'Date Range: Next Year.',
          steps: ['Select a date range in the future.'],
          expectedErrorOrBehavior: 'System shows "No sales found for the selected period".'
        }
      ],
      passCriteria: 'Sales registry is accurate and filterable.'
    },
    {
      id: 'TC-SAL-002',
      title: 'POS Transaction Audit Trail',
      feature: 'POS Transactions',
      targetMenu: 'Sales > POS Transactions',
      whatToCheck: 'Verify that every sale processed through the POS terminal is logged with cashier details and timestamp.',
      howToCheck: [
        '1. Open Sales > POS Transactions.',
        '2. Verify that the most recent POS sale appears at the top.',
        '3. Click "View" to check receipt details.'
      ],
      positiveTesting: {
        inputData: 'Action: View last POS sale.',
        steps: ['Open transaction list.', 'Inspect row data.'],
        expectedResult: 'Transaction ID, Customer, and Amount match the POS checkout data.'
      },
      negativeTesting: [
        {
          scenario: 'Voiding a Finalized POS Sale',
          inputData: 'Sale ID: POS-123.',
          steps: ['Attempt to delete a finalized sale (if restricted).'],
          expectedErrorOrBehavior: 'System prevents deletion, requiring a "Return" instead to maintain audit integrity.'
        }
      ],
      passCriteria: 'Audit trail for POS transactions is indestructible.'
    },
    {
      id: 'TC-SAL-003',
      title: 'Back-Office Sales Entry & Credit Control',
      feature: 'Add Sale',
      targetMenu: 'Sales > Add Sale',
      whatToCheck: 'Ensure that back-office sales (manual invoices) can be created with advanced shipping and tax options.',
      howToCheck: [
        '1. Open Sales > Add Sale.',
        '2. Select customer, add items.',
        '3. Enter "Shipping Charges" and "Discount".',
        '4. Save as Final.'
      ],
      positiveTesting: {
        inputData: 'Shipping: $50; Tax: 18%.',
        steps: ['Fill invoice details.', 'Calculate grand total.'],
        expectedResult: 'Grand total includes base price + tax + shipping - discount accurately.'
      },
      negativeTesting: [
        {
          scenario: 'Selling Out-of-Stock Item',
          inputData: 'Item Qty: 0 in stock; Selling: 5.',
          steps: ['Add OOS item to manual sale.'],
          expectedErrorOrBehavior: 'System warns or blocks: "Insufficient stock for this item."'
        }
      ],
      passCriteria: 'Manual sales entry is robust and accurate.'
    },
    {
      id: 'TC-SAL-004',
      title: 'Draft Management & Sales Resumption',
      feature: 'Draft Invoices',
      targetMenu: 'Sales > Draft Invoices',
      whatToCheck: 'Verify that sales can be saved as drafts and completed later.',
      howToCheck: [
        '1. Start a sale, add items.',
        '2. Click "Save as Draft".',
        '3. Navigate to Draft Invoices.',
        '4. Resume and finalize.'
      ],
      positiveTesting: {
        inputData: 'Draft ID: D-999.',
        steps: ['Save draft.', 'Open from list.', 'Finalize.'],
        expectedResult: 'Draft is converted to a Final Invoice; stock is updated only after finalization.'
      },
      negativeTesting: [
        {
          scenario: 'Deleting a Draft',
          inputData: 'Action: Delete Draft.',
          steps: ['Delete an unwanted draft.'],
          expectedErrorOrBehavior: 'Draft is removed; no stock change occurs.'
        }
      ],
      passCriteria: 'Draft workflow is seamless.'
    },
    {
      id: 'TC-SAL-005',
      title: 'Quotation to Invoice Conversion',
      feature: 'Quotations & Estimates',
      targetMenu: 'Sales > Quotations & Estimates',
      whatToCheck: 'Ensure quotations can be printed and converted to invoices.',
      howToCheck: [
        '1. Create a Quotation.',
        '2. Print the quotation for the customer.',
        '3. Convert to Invoice once accepted.'
      ],
      positiveTesting: {
        inputData: 'Action: Convert Quote #Q001.',
        steps: ['Select quote.', 'Convert.'],
        expectedResult: 'Data is perfectly transferred to a new sale invoice.'
      },
      negativeTesting: [
        {
          scenario: 'Converting Expired Quotation',
          inputData: 'Quote Status: Expired.',
          steps: ['Try to convert an old quote.'],
          expectedErrorOrBehavior: 'System prompts to update prices as per current rates.'
        }
      ],
      passCriteria: 'Quote-to-sale pipeline is efficient.'
    },
    {
      id: 'TC-SAL-006',
      title: 'Sales Returns & Financial Credit Notes',
      feature: 'Sales Returns',
      targetMenu: 'Sales > Sales Returns (Credit Note)',
      whatToCheck: 'Verify that customer returns increment stock and reduce the receivable amount.',
      howToCheck: [
        '1. Select an invoice to return.',
        '2. Specify returned items.',
        '3. Save return.'
      ],
      positiveTesting: {
        inputData: 'Invoice: S005; Return Qty: 2.',
        steps: ['Execute return.'],
        expectedResult: 'Stock of returned items increases; Credit note is generated.'
      },
      negativeTesting: [
        {
          scenario: 'Returning Non-Returnable Item',
          inputData: 'Item: "Service Fee" (Non-stock).',
          steps: ['Attempt to return a service item.'],
          expectedErrorOrBehavior: 'System handles financial credit but no stock change occurs.'
        }
      ],
      passCriteria: 'Returns are handled professionally with proper documentation.'
    },
    {
      id: 'TC-SAL-007',
      title: 'POS Terminal Speed & Multi-Payment',
      feature: 'POS Terminal',
      targetMenu: 'Sales > POS Terminal',
      whatToCheck: 'Ensure the live POS terminal is responsive and supports Split Payments (Cash + Card).',
      howToCheck: [
        '1. Open POS Terminal.',
        '2. Scan 5 items quickly.',
        '3. Click "Pay" and choose "Split Payment".',
        '4. Enter $50 Cash and $100 Card.'
      ],
      positiveTesting: {
        inputData: 'Split: $50 Cash; $100 Card; Total: $150.',
        steps: ['Process split payment.', 'Finalize.'],
        expectedResult: 'Transaction is successful; receipt shows break-up of payment modes.'
      },
      negativeTesting: [
        {
          scenario: 'Underpayment Block',
          inputData: 'Total: $150; Paid: $140.',
          steps: ['Try to finalize without full payment.'],
          expectedErrorOrBehavior: 'System blocks until balance is zero or records as "Due" if permitted.'
        }
      ],
      passCriteria: 'POS terminal is high-performance and flexible.'
    }
  ]
};
