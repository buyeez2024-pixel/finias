import { TestingModule } from './types';

export const reportsTest: TestingModule = {
  id: 'reports',
  title: '10. Business Intelligence & Financial Reporting',
  category: 'Audit & Analytics',
  iconName: 'BarChart3',
  overview: 'Verification of tax reporting accuracy, Profit & Loss integrity, stock valuation logic, and date-filtered analytical summaries.',
  testCases: [
    {
      id: 'TC-REP-001',
      title: 'Profit & Loss Statement Accuracy',
      feature: 'Financial Reporting',
      targetMenu: 'Reports > Profit & Loss Statement',
      whatToCheck: 'Verify that the P&L statement correctly calculates Gross Profit and Net Profit based on Sales, COGS, and Expenses.',
      howToCheck: [
        '1. Open Reports > Profit & Loss.',
        '2. Filter by "Last Month".',
        '3. Compare Net Profit with (Total Sales - Total Purchases - Total Expenses).'
      ],
      positiveTesting: {
        inputData: 'Period: Last Month.',
        steps: ['Run report.', 'Cross-verify totals.'],
        expectedResult: 'Net profit value matches manual calculation from dashboard metrics.'
      },
      negativeTesting: [
        {
          scenario: 'Report for Zero Transaction Period',
          inputData: 'Date Range: [No Activity].',
          steps: ['Run report for empty period.'],
          expectedErrorOrBehavior: 'Report shows all values as $0.00.'
        }
      ],
      passCriteria: 'Financial accuracy in P&L reporting.'
    },
    {
      id: 'TC-REP-002',
      title: 'Product Purchase Report: Sourcing Insights',
      feature: 'Procurement Reports',
      targetMenu: 'Reports > Product Purchase Report',
      whatToCheck: 'Ensure that the report correctly lists all purchased products with their respective quantities and costs.',
      howToCheck: [
        '1. Open Product Purchase Report.',
        '2. Filter by Product "Item X".',
        '3. Verify that the total quantity matches purchase history.'
      ],
      positiveTesting: {
        inputData: 'Filter: Product A.',
        steps: ['Run report.'],
        expectedResult: 'Report lists all instances where Product A was purchased with correct cost price.'
      },
      negativeTesting: [
        {
          scenario: 'Filtering by Unpurchased Product',
          inputData: 'Filter: New Product.',
          steps: ['Run report for unpurchased item.'],
          expectedErrorOrBehavior: 'Report shows "No records found".'
        }
      ],
      passCriteria: 'Procurement data is correctly aggregated.'
    },
    {
      id: 'TC-REP-003',
      title: 'Purchase Payment Report: Cash Outflow',
      feature: 'Payment Reports',
      targetMenu: 'Reports > Purchase Payment Report',
      whatToCheck: 'Verify all payments made to suppliers are tracked with payment method and reference number.',
      howToCheck: [
        '1. Navigate to Reports > Purchase Payment Report.',
        '2. Check for a specific payment made via "Bank Transfer".'
      ],
      positiveTesting: {
        inputData: 'Method: Bank Transfer.',
        steps: ['Filter by payment mode.'],
        expectedResult: 'All bank payments are listed with their transaction IDs.'
      },
      negativeTesting: [
        {
          scenario: 'Searching with Invalid Reference',
          inputData: 'Ref: "REF-VOID".',
          steps: ['Enter invalid ref in search.'],
          expectedErrorOrBehavior: 'No records found.'
        }
      ],
      passCriteria: 'Payment tracking for purchases is accurate.'
    },
    {
      id: 'TC-REP-004',
      title: 'Product Sell Report: Sales Velocity',
      feature: 'Sales Reports',
      targetMenu: 'Reports > Product Sell Report',
      whatToCheck: 'Ensure the report shows which products are selling most and their total revenue.',
      howToCheck: [
        '1. Open Product Sell Report.',
        '2. Sort by "Quantity Sold" (Descending).'
      ],
      positiveTesting: {
        inputData: 'Sort: Highest Qty.',
        steps: ['Run and sort report.'],
        expectedResult: 'Top-selling products are displayed at the top.'
      },
      negativeTesting: [
        {
          scenario: 'Negative Sales Value Check',
          inputData: 'Refunded Items.',
          steps: ['Verify if returns are deducted.'],
          expectedErrorOrBehavior: 'Net sales correctly subtracts return quantities.'
        }
      ],
      passCriteria: 'Sales data provides clear business insights.'
    },
    {
      id: 'TC-REP-005',
      title: 'Sell Payment Report: Revenue Inflow',
      feature: 'Payment Reports',
      targetMenu: 'Reports > Sell Payment Report',
      whatToCheck: 'Verify all customer payments (Cash, Card, Online) are correctly logged.',
      howToCheck: [
        '1. Open Sell Payment Report.',
        '2. Filter by "Payment Method" = "Card".'
      ],
      positiveTesting: {
        inputData: 'Filter: Card.',
        steps: ['Apply filter.'],
        expectedResult: 'Lists all card transactions for reconciliation.'
      },
      negativeTesting: [
        {
          scenario: 'Mismatch in Payment Totals',
          inputData: 'Manual Audit.',
          steps: ['Sum payments and compare with bank statement.'],
          expectedErrorOrBehavior: 'System reports must match actual cash/bank receipts.'
        }
      ],
      passCriteria: 'Payment reconciliation is possible through reports.'
    },
    {
      id: 'TC-REP-006',
      title: 'GST & Tax Summary: Compliance Reporting',
      feature: 'Tax Reports',
      targetMenu: 'Reports > GST & Tax Summary Report',
      whatToCheck: 'Ensure that Output GST and Input Tax Credit (ITC) are calculated correctly for tax filing.',
      howToCheck: [
        '1. Open Tax Summary Report.',
        '2. Verify "Total Output Tax" (from sales) and "Total Input Tax" (from purchases).'
      ],
      positiveTesting: {
        inputData: 'Period: Q1.',
        steps: ['Run report.', 'Verify HSN-wise tax breakdown.'],
        expectedResult: 'Tax amounts match the sum of tax on all invoices in the period.'
      },
      negativeTesting: [
        {
          scenario: 'Invoices with No Tax',
          inputData: 'Zero Tax Items.',
          steps: ['Verify zero tax reporting.'],
          expectedErrorOrBehavior: 'Zero-rated items are shown under "Exempted" or "Nil-rated" columns.'
        }
      ],
      passCriteria: 'Tax reporting is legally compliant.'
    },
    {
      id: 'TC-REP-007',
      title: 'Customer & Supplier Balances: Outstanding Ledger',
      feature: 'Credit Reports',
      targetMenu: 'Reports > Customer & Supplier Balances',
      whatToCheck: 'Verify that the report correctly lists all outstanding receivables and payables.',
      howToCheck: [
        '1. Open Balances Report.',
        '2. Sort by "Outstanding Balance" (Descending).'
      ],
      positiveTesting: {
        inputData: 'Contact: All.',
        steps: ['Run report.'],
        expectedResult: 'Lists all contacts with their current debit/credit balances.'
      },
      negativeTesting: [
        {
          scenario: 'Contacts with Zero Balance',
          inputData: 'Balance: 0.',
          steps: ['Verify if zero-balance contacts are filtered if requested.'],
          expectedErrorOrBehavior: 'Optionally hides zero balances for cleaner reporting.'
        }
      ],
      passCriteria: 'Outstanding dues are easily identifiable.'
    },
    {
      id: 'TC-REP-008',
      title: 'Stock Report: Inventory Valuation',
      feature: 'Inventory Reports',
      targetMenu: 'Reports > Stock Report',
      whatToCheck: 'Ensure the stock report shows current quantity, stock value (at cost), and stock value (at selling price).',
      howToCheck: [
        '1. Open Stock Report.',
        '2. Verify "Stock Value by Cost Price" column.'
      ],
      positiveTesting: {
        inputData: 'Filter: All Locations.',
        steps: ['Run report.'],
        expectedResult: 'Total inventory value is displayed accurately.'
      },
      negativeTesting: [
        {
          scenario: 'Inconsistent Stock Count',
          inputData: 'Negative Stock.',
          steps: ['Check for negative stock flags.'],
          expectedErrorOrBehavior: 'Negative quantities are highlighted for correction.'
        }
      ],
      passCriteria: 'Inventory valuation is mathematically correct.'
    },
    {
      id: 'TC-REP-009',
      title: 'Stock Adjustment Report: Loss/Damage Audit',
      feature: 'Audit Reports',
      targetMenu: 'Reports > Stock Adjustment Report',
      whatToCheck: 'Verify that all manual stock corrections are logged with reasons.',
      howToCheck: [
        '1. Open Stock Adjustment Report.',
        '2. Filter by "Reason" = "Damage".'
      ],
      positiveTesting: {
        inputData: 'Reason: Damage.',
        steps: ['Apply filter.'],
        expectedResult: 'Lists all stock losses due to damage with their monetary impact.'
      },
      negativeTesting: [
        {
          scenario: 'Adjustment without Note',
          inputData: 'Empty Reason.',
          steps: ['Verify if system allows empty reasons.'],
          expectedErrorOrBehavior: 'System encourages or mandates notes for all adjustments.'
        }
      ],
      passCriteria: 'Audit trail for stock corrections is clear.'
    },
    {
      id: 'TC-REP-010',
      title: 'Sales Representative Report: Commission Tracking',
      feature: 'Commission Reports',
      targetMenu: 'Reports > Sales Representative Report',
      whatToCheck: 'Ensure sales representatives are credited with their respective sales and commissions.',
      howToCheck: [
        '1. Select Rep: "Alexander Magnus".',
        '2. Verify total sales and calculated commission (e.g., 5%).'
      ],
      positiveTesting: {
        inputData: 'Rep: Alexander; Sales: $10,000; Rate: 5%.',
        steps: ['Run report for the Rep.'],
        expectedResult: 'Commission is correctly shown as $500.'
      },
      negativeTesting: [
        {
          scenario: 'Rep with No Sales',
          inputData: 'Rep: New Agent.',
          steps: ['Run report.'],
          expectedErrorOrBehavior: 'Shows zero sales and zero commission.'
        }
      ],
      passCriteria: 'Commission calculations are precise.'
    }
  ]
};
