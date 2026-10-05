import { TestingModule } from './types';

export const dashboardTest: TestingModule = {
  id: 'dashboard',
  title: '1. Dashboard & Analytical Intelligence',
  category: 'Analytics & Command Center',
  iconName: 'LayoutDashboard',
  overview: 'Verifies the integrity of high-level executive analytics, real-time telemetry feeds, fiscal metrics synchronization, and the operational responsiveness of the central command center.',
  testCases: [
    {
      id: 'TC-DASH-001',
      title: 'Real-Time Sales & Profit Metrics Dynamic Update',
      feature: 'Live Telemetry Engine',
      targetMenu: 'Dashboard > Metrics Bar',
      whatToCheck: 'Ensure that the total sales, net profit, and invoice count tiles update instantly when a new transaction is processed without requiring a page refresh.',
      howToCheck: [
        '1. Open Dashboard in one tab and POS in another tab.',
        '2. Note the current "Total Sales" value on the Dashboard.',
        '3. Process a $1,000 cash sale in the POS tab.',
        '4. Switch back to the Dashboard tab.',
        '5. Verify the metric has incremented by exactly $1,000.'
      ],
      positiveTesting: {
        inputData: 'Transaction: $1,000 POS Sale; Payment: Cash; Status: Finalized.',
        steps: [
          'Process sale in POS.',
          'Observe Dashboard metric tiles.'
        ],
        expectedResult: 'Dashboard metrics (Total Sales, Total Paid, Net Profit) reflect the new transaction value immediately with animated increment.'
      },
      negativeTesting: [
        {
          scenario: 'Unfinalized / Draft Sale Impact',
          inputData: 'Transaction: $500 Quotation; Status: Draft.',
          steps: ['Create a quotation or draft sale.', 'Check Dashboard metrics.'],
          expectedErrorOrBehavior: 'Dashboard metrics MUST NOT include draft or quotation values as they are not realized revenue.'
        }
      ],
      passCriteria: 'Realized revenue increments metrics; draft states are correctly excluded.'
    },
    {
      id: 'TC-DASH-002',
      title: 'Fiscal Period Filter Persistence & Date Synchronization',
      feature: 'Fiscal Analytics Filter',
      targetMenu: 'Dashboard > Top Filter Bar',
      whatToCheck: 'Verify that changing the Dashboard date range (e.g., "This Month" to "Today") correctly re-queries the database and updates all charts and stat cards.',
      howToCheck: [
        '1. Click the date filter on the Dashboard.',
        '2. Select "Today".',
        '3. Note values.',
        '4. Change filter to "This Month".',
        '5. Verify values expand to include historical transactions for the month.'
      ],
      positiveTesting: {
        inputData: 'Date Range: "Today" vs "Last 30 Days".',
        steps: ['Switch between predefined date ranges.'],
        expectedResult: 'Chart data and summary cards update within 300ms to match the selected fiscal window.'
      },
      negativeTesting: [
        {
          scenario: 'Invalid Custom Date Range',
          inputData: 'Start Date: 2026-12-31; End Date: 2026-01-01 (Reverse chronological).',
          steps: ['Open custom date picker.', 'Select end date prior to start date.'],
          expectedErrorOrBehavior: 'System prevents selection or displays validation error: "End date cannot be earlier than start date."'
        }
      ],
      passCriteria: 'Analytics engine correctly scopes data based on user-defined temporal boundaries.'
    }
  ]
};
