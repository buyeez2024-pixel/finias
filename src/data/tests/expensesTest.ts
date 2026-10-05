import { TestingModule } from './types';

export const expensesTest: TestingModule = {
  id: 'expenses',
  title: '8. Expense Management & Operational Overheads',
  category: 'Financial Accounting',
  iconName: 'CreditCard',
  overview: 'Verification of operational cash outflow, expense categorization, payment account mapping, and recurring overhead tracking.',
  testCases: [
    {
      id: 'TC-EXP-001',
      title: 'Expense Categorization & Payment Account Mapping',
      feature: 'Cash Flow Management',
      targetMenu: 'Expenses > Add Expense',
      whatToCheck: 'Verify that saving an expense correctly deducts the amount from the selected Payment Account (e.g., Bank or Petty Cash).',
      howToCheck: [
        '1. Note balance of "Petty Cash" ($500).',
        '2. Add expense of $50 for "Office Stationery".',
        '3. Select "Petty Cash" as Payment Account.',
        '4. Save and check Petty Cash balance.'
      ],
      positiveTesting: {
        inputData: 'Category: Utilities; Amount: $50; Account: Petty Cash.',
        steps: [
          'Register expense.'
        ],
        expectedResult: 'Expense registry displays $50 record; Petty Cash account balance is exactly $450.'
      },
      negativeTesting: [
        {
          scenario: 'Expense Amount Zero or Negative',
          inputData: 'Amount: -10.',
          steps: ['Enter negative value.'],
          expectedErrorOrBehavior: 'Validation error: "Expense amount must be a positive numeric value."'
        }
      ],
      passCriteria: 'Expenses are correctly categorized and reflected in real-time treasury balances.'
    },
    {
      id: 'TC-EXP-002',
      title: 'Attachment Upload & File Integrity',
      feature: 'Audit Documentation',
      targetMenu: 'Expenses > Add Expense',
      whatToCheck: 'Ensure that receipt images (JPG/PNG) or PDFs can be uploaded and retrieved for auditing purposes.',
      howToCheck: [
        '1. Create expense.',
        '2. Upload a sample receipt image.',
        '3. Save expense.',
        '4. View expense from list and click attachment icon.'
      ],
      positiveTesting: {
        inputData: 'File: "invoice_copy.pdf".',
        steps: ['Attach file during creation.'],
        expectedResult: 'File uploads successfully; preview is available in the expense details view.'
      },
      negativeTesting: [
        {
          scenario: 'Oversized File Upload',
          inputData: 'File size: 15MB (Limit is 2MB).',
          steps: ['Attempt to upload large file.'],
          expectedErrorOrBehavior: 'System blocks upload: "File size exceeds the 2MB limit for attachments."'
        }
      ],
      passCriteria: 'Supporting documents are reliably linked to financial records.'
    }
  ]
};
