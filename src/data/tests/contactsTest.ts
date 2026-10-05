import { TestingModule } from './types';

export const contactsTest: TestingModule = {
  id: 'contacts',
  title: '3. Contact Management (Customers & Suppliers)',
  category: 'CRM & Trade Relations',
  iconName: 'UserCheck',
  overview: 'Verification of customer and supplier registries, international phone format validation, credit limit enforcement, and contact grouping logic.',
  testCases: [
    {
      id: 'TC-CON-001',
      title: 'Customer Registry & Search Proficiency',
      feature: 'Customer Management',
      targetMenu: 'Contacts > Customers',
      whatToCheck: 'Verify that the customer list displays all registered clients, shows their total dues, and allows advanced filtering by name, group, or location.',
      howToCheck: [
        '1. Navigate to Contacts > Customers.',
        '2. Verify that the table loads existing customers.',
        '3. Use the search bar to filter by mobile number.',
        '4. Click on a customer row to view detailed profile.'
      ],
      positiveTesting: {
        inputData: 'Search Query: "9876543210" (Valid Mobile).',
        steps: ['Enter mobile in search field.', 'Check filtered results.'],
        expectedResult: 'System displays the specific customer matching that mobile number instantly.'
      },
      negativeTesting: [
        {
          scenario: 'Search with Invalid Mobile Format',
          inputData: 'Query: "ABC-123"',
          steps: ['Enter malformed query in search bar.'],
          expectedErrorOrBehavior: 'System handles query gracefully, showing "No records found" without crashing.'
        }
      ],
      passCriteria: 'Customer registry is functional and searchable.'
    },
    {
      id: 'TC-CON-002',
      title: 'Supplier Onboarding & Commercial Terms',
      feature: 'Supplier Management',
      targetMenu: 'Contacts > Suppliers',
      whatToCheck: 'Ensure suppliers can be managed, showing their outstanding balances and primary contact details.',
      howToCheck: [
        '1. Navigate to Contacts > Suppliers.',
        '2. Click on a supplier name.',
        '3. Verify that "Total Due" matches the sum of unpaid purchase invoices.'
      ],
      positiveTesting: {
        inputData: 'Action: View Supplier "Tech Giant Corp".',
        steps: ['Select supplier from list.', 'Inspect outstanding balance.'],
        expectedResult: 'Supplier profile opens; financial summary is accurate.'
      },
      negativeTesting: [
        {
          scenario: 'Deleting Supplier with Active Transactions',
          inputData: 'Supplier: "Active Supplier" (Has 5 unpaid invoices).',
          steps: ['Attempt to delete the supplier.'],
          expectedErrorOrBehavior: 'System prevents deletion: "Supplier cannot be deleted as there are active transactions associated with them."'
        }
      ],
      passCriteria: 'Supplier data is secure and lifecycle is managed correctly.'
    },
    {
      id: 'TC-CON-003',
      title: 'Customer Group Pricing & Discount Rules',
      feature: 'Customer Groups',
      targetMenu: 'Contacts > Customer Groups',
      whatToCheck: 'Verify that customer groups correctly apply percentage-based discounts to all users assigned to that group during POS checkout.',
      howToCheck: [
        '1. Create a "VIP" group with 10% discount.',
        '2. Assign a customer to this group.',
        '3. Open POS and select this customer.',
        '4. Add a $100 item to cart.'
      ],
      positiveTesting: {
        inputData: 'Group: "VIP" (10% Off); Item: $100.',
        steps: ['Select VIP customer in POS.', 'Add item.'],
        expectedResult: 'Price is automatically adjusted to $90 in the cart.'
      },
      negativeTesting: [
        {
          scenario: 'Negative Discount Percentage',
          inputData: 'Discount: -5%.',
          steps: ['Try to save a group with negative discount.'],
          expectedErrorOrBehavior: 'Validation error: "Discount percentage must be a positive number."'
        }
      ],
      passCriteria: 'Pricing rules are applied accurately based on group membership.'
    },
    {
      id: 'TC-CON-004',
      title: 'International Phone Format Validation & Country Selection',
      feature: 'Add Contact',
      targetMenu: 'Contacts > Add Customer / Supplier',
      whatToCheck: 'Ensure the phone number input correctly validates based on selected country and prevents submission of malformed digits.',
      howToCheck: [
        '1. Open "Add Contact" form.',
        '2. Select "United States (+1)".',
        '3. Enter "12345" (Insufficient digits).',
        '4. Attempt to save.'
      ],
      positiveTesting: {
        inputData: 'Country: USA; Phone: 212 555 0198.',
        steps: [
          'Select USA from dropdown.',
          'Enter valid 10-digit number.',
          'Submit.'
        ],
        expectedResult: 'Contact is saved successfully; number is auto-formatted as +1 (212) 555-0198.'
      },
      negativeTesting: [
        {
          scenario: 'Invalid Characters in Phone Field',
          inputData: 'Phone: "ABC-555-1234"',
          steps: ['Enter alphabetic characters in phone field.'],
          expectedErrorOrBehavior: 'Input field rejects non-numeric keystrokes or displays error: "Please enter a valid numeric phone number."'
        }
      ],
      passCriteria: 'Phone numbers adhere to international standards.'
    },
    {
      id: 'TC-CON-005',
      title: 'Customer Ledger: Transaction Traceability',
      feature: 'Financial Ledgers',
      targetMenu: 'Contacts > Customer Ledger',
      whatToCheck: 'Verify that the ledger accurately tracks all sales, payments, and credit notes for a specific customer with a running balance.',
      howToCheck: [
        '1. Open Contacts > Customer Ledger.',
        '2. Select "John Smith".',
        '3. Verify that the "Total Outstanding" matches the ledger balance.'
      ],
      positiveTesting: {
        inputData: 'Customer: John Smith; Filter: "Current Year".',
        steps: ['Select customer and date range.', 'Inspect transaction rows.'],
        expectedResult: 'Ledger displays chronological list of all financial events with correct running balance.'
      },
      negativeTesting: [
        {
          scenario: 'Ledger for Contact with No Transactions',
          inputData: 'Contact: "New Client" (Just registered).',
          steps: ['View ledger for new client.'],
          expectedErrorOrBehavior: 'Ledger shows "No transactions found" with $0.00 balance.'
        }
      ],
      passCriteria: 'Financial history is accurately logged and transparent.'
    },
    {
      id: 'TC-CON-006',
      title: 'Supplier Ledger & Debit/Credit Reconciliation',
      feature: 'Financial Ledgers',
      targetMenu: 'Contacts > Supplier Ledger',
      whatToCheck: 'Ensure all purchase invoices and payments to suppliers are reflected in the supplier ledger.',
      howToCheck: [
        '1. Open Contacts > Supplier Ledger.',
        '2. Select a supplier.',
        '3. Post a payment and verify the ledger updates instantly.'
      ],
      positiveTesting: {
        inputData: 'Supplier: "Vendor A"; Action: Post $500 Payment.',
        steps: ['Record payment against supplier account.', 'Check ledger.'],
        expectedResult: 'Outstanding balance decreases by exactly $500.'
      },
      negativeTesting: [
        {
          scenario: 'Payment Amount Exceeding Due',
          inputData: 'Due: $200; Payment: $300.',
          steps: ['Attempt to overpay a supplier.'],
          expectedErrorOrBehavior: 'System records as "Advance Payment" or "Credit Balance" depending on configuration.'
        }
      ],
      passCriteria: 'Accounts payable are tracked with precision.'
    },
    {
      id: 'TC-CON-007',
      title: 'Bulk Import Contacts via CSV/Excel',
      feature: 'Bulk Data Operations',
      targetMenu: 'Contacts > Import Contacts',
      whatToCheck: 'Verify that the system correctly parses and imports contact data from external files while flagging invalid entries.',
      howToCheck: [
        '1. Download the sample import template.',
        '2. Fill with 5 customer records.',
        '3. Upload the file.',
        '4. Click "Import".'
      ],
      positiveTesting: {
        inputData: 'File: contacts_import.csv (5 valid rows).',
        steps: ['Upload template with valid data.', 'Execute import.'],
        expectedResult: '5 new contacts are added to the registry; success message: "5 Contacts imported successfully."'
      },
      negativeTesting: [
        {
          scenario: 'Malformed CSV Headers',
          inputData: 'File: wrong_headers.csv.',
          steps: ['Upload file with incorrect column names.'],
          expectedErrorOrBehavior: 'System displays error: "Invalid template format. Please use the provided sample file."'
        }
      ],
      passCriteria: 'Bulk data migration is robust and error-tolerant.'
    }
  ]
};
