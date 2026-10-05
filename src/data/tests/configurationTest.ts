import { TestingModule } from './types';

export const configurationTest: TestingModule = {
  id: 'configuration',
  title: '13. Store Configurations & Master Data',
  category: 'System Foundation',
  iconName: 'Sliders',
  overview: 'Verification of multi-location setup, invoice layout customization, tax rate groups, and global numbering schemes.',
  testCases: [
    {
      id: 'TC-CFG-001',
      title: 'Branch Outlets: Multi-Location Setup',
      feature: 'Location Management',
      targetMenu: 'Configurations > Branch Outlets',
      whatToCheck: 'Verify that new business locations can be added with specific contact details and tax IDs.',
      howToCheck: [
        '1. Add a new location "Downtown Outlet".',
        '2. Fill address and phone number.',
        '3. Save and verify it appears in the location switcher.'
      ],
      positiveTesting: {
        inputData: 'Location: Downtown Outlet.',
        steps: ['Save location.', 'Check location dropdown.'],
        expectedResult: 'Outlet is added and selectable for stock/sales operations.'
      },
      negativeTesting: [
        {
          scenario: 'Duplicate Location ID',
          inputData: 'Location ID: "MAIN" (Already exists).',
          steps: ['Try to add location with existing ID.'],
          expectedErrorOrBehavior: 'System rejects duplicate ID.'
        }
      ],
      passCriteria: 'Locations are uniquely manageable.'
    },
    {
      id: 'TC-CFG-002',
      title: 'Invoice Layouts: Visual Branding',
      feature: 'Invoice Design',
      targetMenu: 'Configurations > Invoice Layouts',
      whatToCheck: 'Ensure that choosing a different invoice layout (e.g., "Elegant" vs "Classic") changes the PDF output.',
      howToCheck: [
        '1. Set default layout to "Elegant".',
        '2. Generate a sales invoice PDF.',
        '3. Change to "Classic" and regenerate.'
      ],
      positiveTesting: {
        inputData: 'Layout: Elegant.',
        steps: ['Change layout.', 'Preview invoice.'],
        expectedResult: 'PDF design reflects the selected layout style.'
      },
      negativeTesting: [
        {
          scenario: 'Missing Logo on Layout',
          inputData: 'Layout with Logo enabled but no logo uploaded.',
          steps: ['Preview layout.'],
          expectedErrorOrBehavior: 'System shows a placeholder or business name if logo is missing.'
        }
      ],
      passCriteria: 'Invoice layouts are visually distinct and selectable.'
    },
    {
      id: 'TC-CFG-003',
      title: 'Tax Configuration: GST/VAT Rules',
      feature: 'Tax Management',
      targetMenu: 'Configurations > Tax Configuration',
      whatToCheck: 'Verify tax rates (e.g., GST 18%) can be defined and applied to products.',
      howToCheck: [
        '1. Create tax "GST 18%" (9% CGST + 9% SGST).',
        '2. Apply to a taxable product.'
      ],
      positiveTesting: {
        inputData: 'Tax: 18%.',
        steps: ['Save tax.', 'Check sales calculation.'],
        expectedResult: 'System correctly calculates 18% tax on taxable items.'
      },
      negativeTesting: [
        {
          scenario: 'Negative Tax Rate',
          inputData: 'Rate: -1%.',
          steps: ['Try to save negative tax.'],
          expectedErrorOrBehavior: 'Validation error: "Tax rate must be zero or positive."'
        }
      ],
      passCriteria: 'Tax rules are accurate and compliant.'
    },
    {
      id: 'TC-CFG-004',
      title: 'Currency & Regional Formatting',
      feature: 'Localization',
      targetMenu: 'Configurations > Currency Configuration',
      whatToCheck: 'Ensure currency symbols and decimal placements are correctly reflected across the app.',
      howToCheck: [
        '1. Set currency to "USD ($)".',
        '2. Verify that prices show $ prefix.'
      ],
      positiveTesting: {
        inputData: 'Currency: USD.',
        steps: ['Apply currency.', 'Check dashboard.'],
        expectedResult: 'All monetary values show "$" symbol.'
      },
      negativeTesting: [
        {
          scenario: 'Unsupported Currency Symbol',
          inputData: 'Symbol: "@#".',
          steps: ['Try to set invalid symbol.'],
          expectedErrorOrBehavior: 'System restricts to standard currency codes.'
        }
      ],
      passCriteria: 'Currency formatting is consistent.'
    },
    {
      id: 'TC-CFG-005',
      title: 'POS Security: Shift PIN Enforcement',
      feature: 'Terminal Security',
      targetMenu: 'Configurations > POS Security',
      whatToCheck: 'Verify that opening a POS shift requires a secure PIN.',
      howToCheck: [
        '1. Enable Shift PIN in settings.',
        '2. Open POS and attempt to start shift.'
      ],
      positiveTesting: {
        inputData: 'PIN: 1234.',
        steps: ['Enter valid PIN.'],
        expectedResult: 'Shift opens and cashier is logged in.'
      },
      negativeTesting: [
        {
          scenario: 'Incorrect Shift PIN',
          inputData: 'PIN: 0000.',
          steps: ['Enter wrong PIN.'],
          expectedErrorOrBehavior: 'Access denied; "Invalid PIN for this location."'
        }
      ],
      passCriteria: 'Shift security prevents unauthorized terminal use.'
    },
    {
      id: 'TC-CFG-006',
      title: 'Receipt Layouts: Thermal Printer Compatibility',
      feature: 'POS Printing',
      targetMenu: 'Configurations > Receipt Layouts',
      whatToCheck: 'Ensure thermal receipt layouts (58mm/80mm) are correctly formatted.',
      howToCheck: [
        '1. Set Receipt Size to 80mm.',
        '2. Print a test receipt from POS.'
      ],
      positiveTesting: {
        inputData: 'Size: 80mm.',
        steps: ['Set size.', 'Print.'],
        expectedResult: 'Receipt text fits within 80mm width without clipping.'
      },
      negativeTesting: [
        {
          scenario: 'Too many columns for 58mm',
          inputData: 'Size: 58mm; Content: Large tables.',
          steps: ['Print on narrow paper.'],
          expectedErrorOrBehavior: 'System auto-wraps or simplifies table for narrow paper.'
        }
      ],
      passCriteria: 'Receipts are readable and well-formatted.'
    },
    {
      id: 'TC-CFG-007',
      title: 'Payment Accounts: Cash & Bank Ledgers',
      feature: 'Treasury Configuration',
      targetMenu: 'Configurations > Payment Accounts',
      whatToCheck: 'Verify bank and cash accounts can be created with initial balances.',
      howToCheck: [
        '1. Add "HDFC Bank" with $5000 balance.',
        '2. Save and verify in Accounts list.'
      ],
      positiveTesting: {
        inputData: 'Bank: HDFC; Balance: $5000.',
        steps: ['Save account.'],
        expectedResult: 'Account is ready for transactions.'
      },
      negativeTesting: [
        {
          scenario: 'Negative Opening Balance',
          inputData: 'Balance: -100.',
          steps: ['Try to save negative balance.'],
          expectedErrorOrBehavior: 'System may allow if representing an overdraft or block based on config.'
        }
      ],
      passCriteria: 'Accounts are correctly initialized.'
    },
    {
      id: 'TC-CFG-008',
      title: 'Payment Methods: Active Toggle',
      feature: 'Checkout Options',
      targetMenu: 'Configurations > Payment Methods',
      whatToCheck: 'Ensure that only "Active" payment methods appear in the POS checkout.',
      howToCheck: [
        '1. Deactivate "Cheque" as a payment method.',
        '2. Open POS and check payment options.'
      ],
      positiveTesting: {
        inputData: 'Deactivate: Cheque.',
        steps: ['Toggle off.', 'Check POS.'],
        expectedResult: '"Cheque" option is no longer visible in the checkout modal.'
      },
      negativeTesting: [
        {
          scenario: 'No Active Payment Methods',
          inputData: 'All methods deactivated.',
          steps: ['Deactivate all methods.'],
          expectedErrorOrBehavior: 'System prevents deactivating the last payment method to ensure checkout is possible.'
        }
      ],
      passCriteria: 'Payment method visibility is controlled.'
    },
    {
      id: 'TC-CFG-009',
      title: 'Signature & Seal: Official Branding',
      feature: 'Authorization Design',
      targetMenu: 'Configurations > Signature & Seal',
       whatToCheck: 'Verify authorized signatures and business seals can be uploaded for invoices.',
      howToCheck: [
        '1. Upload "Manager Signature" image.',
        '2. Preview a finalized invoice.'
      ],
      positiveTesting: {
        inputData: 'File: signature.png.',
        steps: ['Upload.', 'View invoice.'],
        expectedResult: 'Signature appears at the bottom of the invoice PDF.'
      },
      negativeTesting: [
        {
          scenario: 'Malformed Image Upload',
          inputData: 'File: corrupted.jpg.',
          steps: ['Try to upload corrupted file.'],
          expectedErrorOrBehavior: 'Error: "Invalid image format."'
        }
      ],
      passCriteria: 'Official marks are correctly applied to documents.'
    },
    {
      id: 'TC-CFG-010',
      title: 'Notification Templates: SMS/Email Automation',
      feature: 'Automated Communication',
      targetMenu: 'Configurations > Notification Templates',
      whatToCheck: 'Ensure templates (e.g., "Thank you for shopping") can be edited with dynamic tags like {customer_name}.',
      howToCheck: [
        '1. Edit "Sales Notification" template.',
        '2. Add text: "Hello {customer_name}, your bill is {total_amount}".'
      ],
      positiveTesting: {
        inputData: 'Tag: {customer_name}.',
        steps: ['Save template.', 'Trigger a sale.'],
        expectedResult: 'Actual message replaces tags with real data: "Hello John, your bill is $150".'
      },
      negativeTesting: [
        {
          scenario: 'Broken Tags',
          inputData: 'Tag: {wrong_tag_name}.',
          steps: ['Use non-existent tag.'],
          expectedErrorOrBehavior: 'System skips broken tag or leaves it as text.'
        }
      ],
      passCriteria: 'Dynamic notifications work correctly.'
    }
  ]
};
