import { TestingModule } from './types';

export const transfersTest: TestingModule = {
  id: 'transfer_adjustment',
  title: '7. Stock Transfers & Inventory Adjustments',
  category: 'Warehouse & Logistics',
  iconName: 'ArrowLeftRight',
  overview: 'Verification of inter-branch stock movement, damage/loss adjustments, expiry management, and logistical tracking between storage locations.',
  testCases: [
    {
      id: 'TC-TRA-001',
      title: 'Stock Adjustments: Waste & Damage Management',
      feature: 'Stock Adjustments',
      targetMenu: 'Stock Transfer > Stock Adjustments',
      whatToCheck: 'Verify that manual stock reductions due to damage correctly update inventory.',
      howToCheck: [
        '1. Navigate to Stock Transfer > Stock Adjustments.',
        '2. Click "Add Adjustment".',
        '3. Select items and quantities to adjust.',
        '4. Save and verify stock decrement.'
      ],
      positiveTesting: {
        inputData: 'Item: Glass; Qty: 2 (Broken).',
        steps: ['Perform adjustment.'],
        expectedResult: 'Stock count decreases; adjustment record is created.'
      },
      negativeTesting: [
        {
          scenario: 'Zero Adjustment',
          inputData: 'Qty: 0.',
          steps: ['Try to save 0 qty adjustment.'],
          expectedErrorOrBehavior: 'Validation error: "Quantity must be non-zero."'
        }
      ],
      passCriteria: 'Inventory corrections are accurate.'
    },
    {
      id: 'TC-TRA-002',
      title: 'Branch Transfers: Multi-Location Logistics',
      feature: 'Branch Transfers',
      targetMenu: 'Stock Transfer > Branch Transfers',
      whatToCheck: 'Ensure stock can be moved between outlets with "Sent" and "Received" status tracking.',
      howToCheck: [
        '1. Open Stock Transfer > Branch Transfers.',
        '2. Create a transfer from Branch A to Branch B.',
        '3. Mark as "Sent".',
        '4. Mark as "Received" at destination.'
      ],
      positiveTesting: {
        inputData: 'Source: Main; Dest: Branch B; Qty: 10.',
        steps: ['Create transfer.', 'Mark Received.'],
        expectedResult: 'Stock moves from source to destination successfully.'
      },
      negativeTesting: [
        {
          scenario: 'Transferring More than Available',
          inputData: 'Stock: 5; Transfer: 10.',
          steps: ['Attempt to transfer over stock.'],
          expectedErrorOrBehavior: 'System blocks: "Insufficient stock at source."'
        }
      ],
      passCriteria: 'Logistics tracking is reliable.'
    }
  ]
};
