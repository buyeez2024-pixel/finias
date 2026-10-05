import { TestingModule } from './types';

export const securityTest: TestingModule = {
  id: 'security',
  title: '11. POS & System Security Shield',
  category: 'Cybersecurity & Internal Control',
  iconName: 'ShieldAlert',
  overview: 'Verification of cashier shift PINs, supervisor overrides, inactivity session timeouts (2min/5min), and audit trail logging.',
  testCases: [
    {
      id: 'TC-SEC-001',
      title: 'Inactivity Session Timeout (2 Min High Security)',
      feature: 'Session Guard',
      targetMenu: 'Security > Active Sessions',
      whatToCheck: 'Verify that the application automatically locks or logs out the user after 2 minutes of idle time as configured.',
      howToCheck: [
        '1. Navigate to Security > Active Sessions.',
        '2. Set Inactivity Timeout to "2 Minutes (High Security)".',
        '3. Apply Policy.',
        '4. Leave application untouched for 2 minutes.'
      ],
      positiveTesting: {
        inputData: 'Timeout: 120 seconds.',
        steps: [
          'Wait for inactivity period.'
        ],
        expectedResult: 'System displays a 60-second warning modal at 60s idle; locks screen at 120s idle.'
      },
      negativeTesting: [
        {
          scenario: 'Session Persistence on Tab Close',
          inputData: 'Timeout: 2 mins; Action: Close and re-open tab after 3 mins.',
          steps: ['Idle for 3 mins with tab closed.'],
          expectedErrorOrBehavior: 'Re-opening the tab MUST require a new login or show the locked screen; session MUST NOT remain authorized.'
        }
      ],
      passCriteria: 'Idle timeouts protect unattended terminals from unauthorized access.'
    },
    {
      id: 'TC-SEC-002',
      title: 'Supervisor PIN Override for Price Edits',
      feature: 'Fraud Prevention',
      targetMenu: 'Sales > POS',
      whatToCheck: 'Ensure that modifying a selling price in the cart triggers a PIN prompt that only accepts a valid Supervisor code.',
      howToCheck: [
        '1. Login as Cashier.',
        '2. Add item to cart.',
        '3. Try to change unit price.',
        '4. Observe "Enter Supervisor PIN" modal.'
      ],
      positiveTesting: {
        inputData: 'Correct Master PIN: 1234.',
        steps: ['Enter valid supervisor PIN.'],
        expectedResult: 'Price modification is allowed; cart total updates; activity is logged in Audit Trail.'
      },
      negativeTesting: [
        {
          scenario: 'Incorrect PIN Submission',
          inputData: 'Wrong PIN: 0000.',
          steps: ['Enter invalid PIN.'],
          expectedErrorOrBehavior: 'System rejects PIN: "Access Denied. Invalid Supervisor PIN." Price remains unchanged.'
        }
      ],
      passCriteria: 'Managerial overrides prevent unauthorized price manipulation at the counter.'
    }
  ]
};
