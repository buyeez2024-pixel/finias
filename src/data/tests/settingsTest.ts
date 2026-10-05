import { TestingModule } from './types';

export const settingsTest: TestingModule = {
  id: 'settings',
  title: '14. Global Business & System Settings',
  category: 'System Governance',
  iconName: 'Settings',
  overview: 'Verification of core business profile data, currency symbol management, financial year definitions, and feature toggles.',
  testCases: [
    {
      id: 'TC-SET-001',
      title: 'Business Profile & Fiscal Year Setup',
      feature: 'Business Settings',
      targetMenu: 'Business Settings > Business',
      whatToCheck: 'Verify that the business name, logo, and financial year start date are correctly configured.',
      howToCheck: [
        '1. Open Business Settings > Business.',
        '2. Change Business Name to "Royal ERP Pro".',
        '3. Upload a new Logo.',
        '4. Save and check if the logo appears in the sidebar.'
      ],
      positiveTesting: {
        inputData: 'Name: Royal ERP Pro.',
        steps: ['Update name.', 'Save.'],
        expectedResult: 'Business name updates globally; Logo is reflected in all headers.'
      },
      negativeTesting: [
        {
          scenario: 'Empty Business Name',
          inputData: 'Name: [Empty].',
          steps: ['Try to save with empty name.'],
          expectedErrorOrBehavior: 'Error: "Business name is required."'
        }
      ],
      passCriteria: 'Core business data is editable and persistent.'
    },
    {
      id: 'TC-SET-002',
      title: 'Product SKU & Stock Logic Toggles',
      feature: 'Product Settings',
      targetMenu: 'Business Settings > Product',
      whatToCheck: 'Ensure that product-related settings like "Enable Sub-categories" or "Enable Warranty" toggle UI features.',
      howToCheck: [
        '1. Disable "Enable Warranty" in Product Settings.',
        '2. Navigate to "Add Product" and check if Warranty field is hidden.'
      ],
      positiveTesting: {
        inputData: 'Warranty: Disabled.',
        steps: ['Toggle off.', 'Check Add Product.'],
        expectedResult: 'Warranty fields are removed from the UI to simplify workflows.'
      },
      negativeTesting: [
        {
          scenario: 'Disabling Categories with Active Products',
          inputData: 'Toggle Categories: Off.',
          steps: ['Try to disable categories when they are already in use.'],
          expectedErrorOrBehavior: 'System warns of data association or allows disabling UI only.'
        }
      ],
      passCriteria: 'Feature toggles accurately control UI complexity.'
    },
    {
      id: 'TC-SET-003',
      title: 'Contact Default Credit & Terms',
      feature: 'Contact Settings',
      targetMenu: 'Business Settings > Contact',
      whatToCheck: 'Verify that default credit limits can be set for all new customers.',
      howToCheck: [
        '1. Set Default Credit Limit to $500.',
        '2. Create a new customer and check their default limit.'
      ],
      positiveTesting: {
        inputData: 'Default Limit: $500.',
        steps: ['Save setting.', 'Add contact.'],
        expectedResult: 'New contact automatically inherits the $500 credit limit.'
      },
      negativeTesting: [
        {
          scenario: 'Negative Default Limit',
          inputData: 'Limit: -100.',
          steps: ['Try to save negative limit.'],
          expectedErrorOrBehavior: 'Validation error: "Limit must be positive."'
        }
      ],
      passCriteria: 'Default contact terms are correctly applied.'
    },
    {
      id: 'TC-SET-004',
      title: 'Sales Commission & Discount Rules',
      feature: 'Sales Settings',
      targetMenu: 'Business Settings > Sale',
      whatToCheck: 'Ensure global sales settings like "Default Discount" or "Sales Commission Agent" type are applied.',
      howToCheck: [
        '1. Set Default Sale Discount to 5%.',
        '2. Open a new sale invoice.'
      ],
      positiveTesting: {
        inputData: 'Default Discount: 5%.',
        steps: ['Save setting.', 'Open Add Sale.'],
        expectedResult: 'The discount field is pre-filled with 5%.'
      },
      negativeTesting: [
        {
          scenario: 'Invalid Commission Calculation Method',
          inputData: 'Method: [Invalid Selection].',
          steps: ['Try to save unsupported method.'],
          expectedErrorOrBehavior: 'System restricts to "Sales Price" or "Profit Margin".'
        }
      ],
      passCriteria: 'Sales defaults streamline invoice creation.'
    },
    {
      id: 'TC-SET-005',
      title: 'POS Shortcuts & Keyboard Workflow',
      feature: 'POS Settings',
      targetMenu: 'Business Settings > POS',
      whatToCheck: 'Verify that POS keyboard shortcuts (e.g., F12 for Pay) can be customized.',
      howToCheck: [
        '1. Map "Pay" to "Ctrl+Enter".',
        '2. Use the shortcut in POS terminal.'
      ],
      positiveTesting: {
        inputData: 'Shortcut: Ctrl+Enter.',
        steps: ['Remap shortcut.', 'Test in POS.'],
        expectedResult: 'The payment modal opens upon pressing the new shortcut.'
      },
      negativeTesting: [
        {
          scenario: 'Hotkey Conflict',
          inputData: 'Mapping two actions to same key.',
          steps: ['Assign F1 to two different actions.'],
          expectedErrorOrBehavior: 'System flags conflict: "F1 is already assigned to Help."'
        }
      ],
      passCriteria: 'Shortcuts enhance operational speed.'
    },
    {
      id: 'TC-SET-006',
      title: 'Purchase Auto-Inward & Valuation Method',
      feature: 'Purchase Settings',
      targetMenu: 'Business Settings > Purchases',
      whatToCheck: 'Ensure that purchase settings like "Enable Editing Product Price from Purchase Screen" work.',
      howToCheck: [
        '1. Enable "Update Product Price on Purchase".',
        '2. Record a purchase with a higher price than catalog.'
      ],
      positiveTesting: {
        inputData: 'Toggle: On; New Price: $20.',
        steps: ['Perform purchase.', 'Check product catalog.'],
        expectedResult: 'Product selling price/cost is updated automatically.'
      },
      negativeTesting: [
        {
          scenario: 'Price Decrease Warning',
          inputData: 'New Purchase Price is lower.',
          steps: ['Verify if system warns about lower margin.'],
          expectedErrorOrBehavior: 'System may show advisory if enabled.'
        }
      ],
      passCriteria: 'Purchase-to-Inventory synchronization is configurable.'
    },
    {
      id: 'TC-SET-007',
      title: 'Payment Gateway & Multi-Tender Toggles',
      feature: 'Payment Settings',
      targetMenu: 'Business Settings > Payment',
      whatToCheck: 'Verify that cash/card payment methods can be globally enabled/disabled.',
      howToCheck: [
        '1. Disable "Cheque" as a valid payment method.',
        '2. Check payment options in Sales and Purchase screens.'
      ],
      positiveTesting: {
        inputData: 'Cheque: Disabled.',
        steps: ['Save setting.', 'Check checkout.'],
        expectedResult: 'Cheque is no longer an option for any transaction.'
      },
      negativeTesting: [
        {
          scenario: 'Disabling All Methods',
          inputData: 'Every method: Off.',
          steps: ['Try to turn off all payments.'],
          expectedErrorOrBehavior: 'System prevents this to avoid blocking the ERP.'
        }
      ],
      passCriteria: 'Payment workflows are strictly controlled.'
    },
    {
      id: 'TC-SET-008',
      title: 'System Update Frequency & Auto-Sync',
      feature: 'System Updates',
      targetMenu: 'Business Settings > System Updates',
      whatToCheck: 'Verify the "Auto-Check for Updates" toggle and update channel selection.',
      howToCheck: [
        '1. Set Update Channel to "Beta".',
        '2. Check for updates manually.'
      ],
      positiveTesting: {
        inputData: 'Channel: Beta.',
        steps: ['Save.', 'Trigger Check.'],
        expectedResult: 'System looks for beta builds on the update server.'
      },
      negativeTesting: [
        {
          scenario: 'Check Updates without Internet',
          inputData: 'No Network.',
          steps: ['Try to update offline.'],
          expectedErrorOrBehavior: 'Error: "Could not connect to update server."'
        }
      ],
      passCriteria: 'Maintenance settings are functional.'
    },
    {
      id: 'TC-SET-009',
      title: 'UI Theming: Dark Mode & Accent Colors',
      feature: 'Themes',
      targetMenu: 'Business Settings > Themes',
      whatToCheck: 'Ensure that changing the "Accent Color" or "Theme Mode" (Light/Dark) updates the entire UI.',
      howToCheck: [
        '1. Select "Deep Purple" accent color.',
        '2. Switch to "Dark Mode".',
        '3. Save and observe the application UI.'
      ],
      positiveTesting: {
        inputData: 'Color: Purple; Mode: Dark.',
        steps: ['Apply theme.', 'Browse various pages.'],
        expectedResult: 'All buttons, sidebar, and headers reflect purple accents on dark backgrounds.'
      },
      negativeTesting: [
        {
          scenario: 'Theme Reset',
          inputData: 'Action: Reset to Default.',
          steps: ['Click reset.'],
          expectedErrorOrBehavior: 'UI reverts to standard Blue/Light theme instantly.'
        }
      ],
      passCriteria: 'Theming engine is responsive and consistent.'
    },
    {
      id: 'TC-SET-010',
      title: 'Global Security Shield: Session & IP Lock',
      feature: 'System Security Shield',
      targetMenu: 'Business Settings > System Security Shield',
      whatToCheck: 'Verify that security policies like "Concurrent Logins" or "Login Captcha" can be enforced.',
      howToCheck: [
        '1. Enable "Disable Multiple Logins".',
        '2. Try logging in from two different browsers with same credentials.'
      ],
      positiveTesting: {
        inputData: 'Concurrent Logins: Blocked.',
        steps: ['Enable.', 'Login on Browser 1.', 'Attempt on Browser 2.'],
        expectedResult: 'Browser 2 login fails: "User already logged in elsewhere. Please logout first."'
      },
      negativeTesting: [
        {
          scenario: 'Super-Admin Lockdown',
          inputData: 'Try to lock out own account.',
          steps: ['Restrict admin IP inappropriately.'],
          expectedErrorOrBehavior: 'System warns: "You cannot block your current IP address."'
        }
      ],
      passCriteria: 'Security shield provides robust protection.'
    },
    {
      id: 'TC-SET-011',
      title: 'Document Prefix & Numbering Sequences',
      feature: 'Document Prefix',
      targetMenu: 'Business Settings > Document Prefix',
      whatToCheck: 'Ensure that prefixes for Sales (INV-), Purchases (PUR-), and Stock Transfers (TRA-) are applied correctly.',
      howToCheck: [
        '1. Set Sales Prefix to "ROYAL-".',
        '2. Create a new sale and check invoice number.'
      ],
      positiveTesting: {
        inputData: 'Prefix: ROYAL-.',
        steps: ['Save prefix.', 'Finalize sale.'],
        expectedResult: 'Invoice is numbered "ROYAL-0001".'
      },
      negativeTesting: [
        {
          scenario: 'Non-Alphanumeric Prefix',
          inputData: 'Prefix: "$#@".',
          steps: ['Try to save special chars in prefix.'],
          expectedErrorOrBehavior: 'System restricts to safe alphanumeric characters.'
        }
      ],
      passCriteria: 'Numbering schemes are customizable and sequential.'
    },
    {
      id: 'TC-SET-012',
      title: 'Loyalty & Reward Point Rules',
      feature: 'Reward Settings',
      targetMenu: 'Business Settings > Reward Settings',
      whatToCheck: 'Verify that "Point Earning" and "Redemption" rules are applied during POS sales.',
      howToCheck: [
        '1. Set: $10 Sale = 1 Point.',
        '2. Set: 1 Point = $1 Discount.',
        '3. Process a $100 sale for a customer.'
      ],
      positiveTesting: {
        inputData: 'Sale: $100.',
        steps: ['Complete sale.'],
        expectedResult: 'Customer profile reflects +10 reward points earned.'
      },
      negativeTesting: [
        {
          scenario: 'Redeeming Points without Balance',
          inputData: 'Redeeming: 50; Balance: 10.',
          steps: ['Try to use more points than available.'],
          expectedErrorOrBehavior: 'System blocks redemption: "Insufficient reward points."'
        }
      ],
      passCriteria: 'Loyalty program logic is mathematically sound.'
    },
    {
      id: 'TC-SET-013',
      title: 'Modular ERP: Enabling/Disabling Sub-Systems',
      feature: 'Modules Manager',
      targetMenu: 'Business Settings > Modules Manager',
      whatToCheck: 'Ensure that disabling a module (e.g., "Expenses") hides it from the sidebar and disables its routes.',
      howToCheck: [
        '1. Disable "Expenses" module.',
        '2. Verify Sidebar and try navigating to /expenses.'
      ],
      positiveTesting: {
        inputData: 'Module: Expenses; State: Disabled.',
        steps: ['Toggle off.', 'Check UI.'],
        expectedResult: 'Expense menu disappears; URL access is blocked.'
      },
      negativeTesting: [
        {
          scenario: 'Disabling Core Module',
          inputData: 'Module: Sales.',
          steps: ['Try to disable Sales.'],
          expectedErrorOrBehavior: 'System prevents disabling mission-critical modules like Sales or Products.'
        }
      ],
      passCriteria: 'ERP footprint is customizable via modules.'
    },
    {
      id: 'TC-SET-014',
      title: 'Cloud Print & Hardware Configuration',
      feature: 'Printer Configuration',
      targetMenu: 'Business Settings > Printer Configuration',
      whatToCheck: 'Verify that printers can be added and assigned as default for specific locations.',
      howToCheck: [
        '1. Add "Counter 1 Thermal Printer".',
        '2. Set as Default for POS.'
      ],
      positiveTesting: {
        inputData: 'Printer: EPSON TM-T88.',
        steps: ['Register printer.', 'Print test page.'],
        expectedResult: 'Test page prints correctly with the right character encoding.'
      },
      negativeTesting: [
        {
          scenario: 'Printing to Offline Hardware',
          inputData: 'Printer: Offline.',
          steps: ['Attempt to print.'],
          expectedErrorOrBehavior: 'System shows "Printer not reachable" error.'
        }
      ],
      passCriteria: 'Peripheral hardware is correctly mapped.'
    },
    {
      id: 'TC-SET-015',
      title: 'Custom Metadata & Extensible Fields',
      feature: 'Custom Fields',
      targetMenu: 'Business Settings > Custom Fields',
      whatToCheck: 'Ensure that custom fields (e.g., "Vehicle Number" for Sales) can be added to standard forms.',
      howToCheck: [
        '1. Add Custom Field "Vehicle No" to Sales Invoice.',
        '2. Open "Add Sale" and verify field exists.'
      ],
      positiveTesting: {
        inputData: 'Field: Vehicle No; Target: Sales.',
        steps: ['Save custom field.', 'Check sales form.'],
        expectedResult: 'The new field is visible and captures data which is then saved with the invoice.'
      },
      negativeTesting: [
        {
          scenario: 'Maximum Custom Fields Limit',
          inputData: 'Adding 100th custom field.',
          steps: ['Verify if there is a sensible limit.'],
          expectedErrorOrBehavior: 'System may restrict to a reasonable number to maintain performance.'
        }
      ],
      passCriteria: 'The ERP is truly extensible through custom metadata.'
    }
  ]
};
