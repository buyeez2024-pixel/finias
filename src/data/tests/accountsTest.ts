import { TestingModule } from './types';

export const accountsTest: TestingModule = {
  id: 'accounts',
  title: '9. Payment Accounts & Financial Ledgers',
  category: 'Treasury & Accounting',
  iconName: 'Landmark',
  overview: 'Verification of double-entry accounting integrity, cash/bank account management, fund transfers between ledgers, and closing balance accuracy.',
  testCases: [
    {
      id: 'TC-ACC-001',
      title: 'Fund Transfer Between Accounts (Bank to Cash)',
      feature: 'Treasury Management',
      targetMenu: 'Accounts > Account Management',
      whatToCheck: 'Ensure that transferring money from a Bank account to Petty Cash correctly updates both ledger balances in a single transaction.',
      howToCheck: [
        '1. Bank A: $10,000; Cash B: $1,000.',
        '2. Transfer $2,000 from A to B.',
        '3. Verify balances: A ($8,000); B ($3,000).'
      ],
      positiveTesting: {
        inputData: 'Amount: $2,000; From: Chase Bank; To: Main Safe.',
        steps: [
          'Execute transfer.'
        ],
        expectedResult: 'Balances update instantly; Ledger history shows two entries (Debit A, Credit B).'
      },
      negativeTesting: [
        {
          scenario: 'Transfer from Insufficient Funds',
          inputData: 'Balance: $100; Requested Transfer: $500.',
          steps: ['Attempt transfer exceeding balance.'],
          expectedErrorOrBehavior: 'System warns user: "Insufficient funds in source account. Transaction would result in negative balance."'
        }
      ],
      passCriteria: 'Treasury movements maintain mathematical consistency across all sub-ledgers.'
    },
    {
      id: 'TC-ACC-002',
      title: 'Chart of Accounts Node Integrity',
      feature: 'Accounting Structure',
      targetMenu: 'Accounts > Chart of Accounts',
      whatToCheck: 'Verify that parent-child relationships in the CoA are maintained and total balances roll up correctly to top-level categories.',
      howToCheck: [
        '1. View "Assets" hierarchy.',
        '2. Verify that "Cash" + "Bank" + "Stock" matches total Assets shown at the root level.'
      ],
      positiveTesting: {
        inputData: 'Standard CoA structure.',
        steps: ['Inspect rolled-up totals.'],
        expectedResult: 'Root categories correctly aggregate values from all nested sub-accounts.'
      },
      negativeTesting: [
        {
          scenario: 'Circular Reference / Invalid Parent',
          inputData: 'Attempting to set an account as its own parent.',
          steps: ['Edit account hierarchy.'],
          expectedErrorOrBehavior: 'System blocks save: "Recursive hierarchy detected. An account cannot be its own parent."'
        }
      ],
      passCriteria: 'The general ledger maintains a valid and auditable tree structure.'
    }
  ]
};
