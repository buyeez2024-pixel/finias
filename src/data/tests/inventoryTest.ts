import { TestingModule } from './types';

export const inventoryTest: TestingModule = {
  id: 'inventory',
  title: '4. Products & Inventory Control',
  category: 'Supply Chain & Stock Management',
  iconName: 'Boxes',
  overview: 'End-to-end verification of product catalog management, mandatory HSN/SAC enforcement for tax compliance, barcode integrity, and stock level tracking.',
  testCases: [
    {
      id: 'TC-INV-001',
      title: 'Product Catalog Integrity & Search',
      feature: 'Product Management',
      targetMenu: 'Inventory > All Products',
      whatToCheck: 'Verify that the product list accurately shows current stock, price, and category for all items.',
      howToCheck: [
        '1. Navigate to Inventory > All Products.',
        '2. Verify data columns for Stock, Price, and HSN.',
        '3. Filter by Category "Electronics".'
      ],
      positiveTesting: {
        inputData: 'Category Filter: "Electronics".',
        steps: ['Select category from dropdown.', 'Apply filter.'],
        expectedResult: 'Only products assigned to Electronics category are displayed.'
      },
      negativeTesting: [
        {
          scenario: 'Search with Special Characters',
          inputData: 'Query: "@#$%^&*()_+"',
          steps: ['Enter special characters in search bar.'],
          expectedErrorOrBehavior: 'System handles query safely, showing "No products found".'
        }
      ],
      passCriteria: 'Product catalog is searchable and accurate.'
    },
    {
      id: 'TC-INV-002',
      title: 'Mandatory HSN / SAC Code Enforcement',
      feature: 'Add New Product',
      targetMenu: 'Inventory > Add New Product',
      whatToCheck: 'Verify that the product form cannot be submitted without a valid HSN (Goods) or SAC (Services) code.',
      howToCheck: [
        '1. Open "Add Product" screen.',
        '2. Fill Name, Category, Price.',
        '3. Leave "HSN/SAC Code" empty.',
        '4. Click "Save Product".'
      ],
      positiveTesting: {
        inputData: 'Product: "Laptop"; HSN Code: "8471".',
        steps: ['Fill all required fields including HSN code.', 'Save.'],
        expectedResult: 'Product is created successfully.'
      },
      negativeTesting: [
        {
          scenario: 'Missing Mandatory HSN Code',
          inputData: 'All fields filled EXCEPT HSN Code.',
          steps: ['Attempt to save product with empty HSN.'],
          expectedErrorOrBehavior: 'System blocks save; highlights field in red.'
        }
      ],
      passCriteria: 'HSN/SAC codes are enforced.'
    },
    {
      id: 'TC-INV-003',
      title: 'Product History: Lifecycle Tracking',
      feature: 'Product History',
      targetMenu: 'Inventory > Product History',
      whatToCheck: 'Ensure all stock movements (purchases, sales, adjustments) are recorded for every product.',
      howToCheck: [
        '1. Open Inventory > Product History.',
        '2. Select a specific product.',
        '3. Verify that the last sale is visible in the history.'
      ],
      positiveTesting: {
        inputData: 'Product: "Coca Cola 500ml".',
        steps: ['Search and select product.', 'Check movement rows.'],
        expectedResult: 'Detailed log of all stock changes with dates and transaction IDs.'
      },
      negativeTesting: [
        {
          scenario: 'Viewing History for New Item',
          inputData: 'Item: "New Item" (No transactions yet).',
          steps: ['Open history for new item.'],
          expectedErrorOrBehavior: 'History shows "Initial Stock" entry or "No movements recorded".'
        }
      ],
      passCriteria: 'Full audit trail for inventory movements.'
    },
    {
      id: 'TC-INV-004',
      title: 'Bulk Product Migration via Import',
      feature: 'Import Products',
      targetMenu: 'Inventory > Import products',
      whatToCheck: 'Verify bulk product creation via CSV upload.',
      howToCheck: [
        '1. Upload a CSV with 50 products.',
        '2. Map the columns correctly.',
        '3. Run the import.'
      ],
      positiveTesting: {
        inputData: 'CSV: 50 Valid Products.',
        steps: ['Upload and map.', 'Confirm import.'],
        expectedResult: 'All 50 products are added to the system.'
      },
      negativeTesting: [
        {
          scenario: 'Duplicate SKU in CSV',
          inputData: 'CSV with 2 rows having same SKU.',
          steps: ['Upload CSV with duplicate SKUs.'],
          expectedErrorOrBehavior: 'System flags the duplicate SKU row and skips it or errors.'
        }
      ],
      passCriteria: 'Bulk import handles mapping and duplicates correctly.'
    },
    {
      id: 'TC-INV-005',
      title: 'Variations & Combo Types Management',
      feature: 'Variations',
      targetMenu: 'Inventory > Variations & Combo Types',
      whatToCheck: 'Ensure product variations (Color, Size) can be defined and assigned to products.',
      howToCheck: [
        '1. Create a "Size" variation with "Small, Medium, Large".',
        '2. Assign this variation to a product.'
      ],
      positiveTesting: {
        inputData: 'Variation: "Size"; Values: "S, M, L".',
        steps: ['Save variation.', 'Check in Add Product dropdown.'],
        expectedResult: 'Variation is available for selection when adding products.'
      },
      negativeTesting: [
        {
          scenario: 'Empty Variation Values',
          inputData: 'Variation: "Color"; Values: [Empty].',
          steps: ['Try to save variation without values.'],
          expectedErrorOrBehavior: 'Validation error: "At least one value is required for a variation."'
        }
      ],
      passCriteria: 'Variations are manageable and linkable to products.'
    },
    {
      id: 'TC-INV-006',
      title: 'Category Hierarchy & Organization',
      feature: 'Categories',
      targetMenu: 'Inventory > Categories',
      whatToCheck: 'Verify that categories and sub-categories can be created to organize products.',
      howToCheck: [
        '1. Create a Parent Category "Beverages".',
        '2. Create a Sub-category "Soft Drinks" under "Beverages".'
      ],
      positiveTesting: {
        inputData: 'Parent: Beverages; Sub: Soft Drinks.',
        steps: ['Save both categories.', 'Verify hierarchy in list.'],
        expectedResult: 'Sub-category is correctly nested under the parent.'
      },
      negativeTesting: [
        {
          scenario: 'Self-Referencing Parent',
          inputData: 'Category: "Category A"; Parent: "Category A".',
          steps: ['Try to set a category as its own parent.'],
          expectedErrorOrBehavior: 'System prevents circular dependency.'
        }
      ],
      passCriteria: 'Category tree structure is maintained correctly.'
    },
    {
      id: 'TC-INV-007',
      title: 'Brand Registry & Logo Branding',
      feature: 'Brands',
      targetMenu: 'Inventory > Brands',
      whatToCheck: 'Verify brands can be added with optional descriptions.',
      howToCheck: [
        '1. Add brand "Samsung".',
        '2. Assign brand to a product.'
      ],
      positiveTesting: {
        inputData: 'Brand: Samsung.',
        steps: ['Save brand.', 'Assign to product.'],
        expectedResult: 'Brand name appears in product details and reports.'
      },
      negativeTesting: [
        {
          scenario: 'Duplicate Brand Name',
          inputData: 'Brand: "Samsung" (Already exists).',
          steps: ['Try to add existing brand.'],
          expectedErrorOrBehavior: 'Error: "Brand already exists."'
        }
      ],
      passCriteria: 'Brands are uniquely identifiable.'
    },
    {
      id: 'TC-INV-008',
      title: 'Warranty Management & Duration Rules',
      feature: 'Warranty',
      targetMenu: 'Inventory > Warranty',
      whatToCheck: 'Ensure warranties (e.g., 1 Year Manufacturer) can be defined and linked to products.',
      howToCheck: [
        '1. Create a warranty "1 Year Domestic".',
        '2. Assign to an electronic product.'
      ],
      positiveTesting: {
        inputData: 'Duration: 12 Months.',
        steps: ['Save warranty.', 'Check on invoice printout.'],
        expectedResult: 'Warranty period is shown on sales receipts for the linked product.'
      },
      negativeTesting: [
        {
          scenario: 'Zero Duration Warranty',
          inputData: 'Duration: 0.',
          steps: ['Try to save warranty with 0 duration.'],
          expectedErrorOrBehavior: 'Validation error: "Duration must be greater than zero."'
        }
      ],
      passCriteria: 'Warranties are correctly linked and displayed.'
    },
    {
      id: 'TC-INV-009',
      title: 'Warehouse Rack & Shelf Positioning',
      feature: 'Racks',
      targetMenu: 'Inventory > Rack, Row & Shelf Positions',
      whatToCheck: 'Verify that storage locations can be assigned to products for warehouse efficiency.',
      howToCheck: [
        '1. Define Rack: A1, Row: 2, Shelf: 3.',
        '2. Assign to Product X.'
      ],
      positiveTesting: {
        inputData: 'Rack: A1; Row: 2; Shelf: 3.',
        steps: ['Save position.', 'View in product details.'],
        expectedResult: 'Warehouse location is displayed, helping staff find the item.'
      },
      negativeTesting: [
        {
          scenario: 'Assigning Non-Existent Rack',
          inputData: 'Rack: "Z99" (Not defined).',
          steps: ['Attempt to assign undefined rack.'],
          expectedErrorOrBehavior: 'System restricts to defined locations via dropdown.'
        }
      ],
      passCriteria: 'Storage positions are manageable and helpful for logistics.'
    },
    {
      id: 'TC-INV-010',
      title: 'Units of Measure (UoM) Conversion Rules',
      feature: 'Units',
      targetMenu: 'Inventory > Units of Measure (UoM)',
      whatToCheck: 'Verify base units (Pcs) and sub-units (Box of 12) with conversion factors.',
      howToCheck: [
        '1. Define Unit: "Box of 12".',
        '2. Set Base Unit: "Pcs".',
        '3. Set Multiplier: 12.'
      ],
      positiveTesting: {
        inputData: 'Base: Pcs; Sub: Box; Multiplier: 12.',
        steps: ['Save unit.', 'Perform purchase in "Boxes".'],
        expectedResult: 'System correctly increments stock by 12 pieces for every 1 box purchased.'
      },
      negativeTesting: [
        {
          scenario: 'Multiplier less than 1',
          inputData: 'Multiplier: 0.5.',
          steps: ['Try to save sub-unit with multiplier < 1.'],
          expectedErrorOrBehavior: 'System accepts or flags based on sub-unit configuration.'
        }
      ],
      passCriteria: 'UoM conversions are mathematically accurate.'
    },
    {
      id: 'TC-INV-011',
      title: 'Barcode Studio: Label Generation & Design',
      feature: 'Barcode & Labels',
      targetMenu: 'Inventory > Barcode & Labels',
      whatToCheck: 'Verify that barcodes and labels can be designed and printed for products.',
      howToCheck: [
        '1. Select 3 products.',
        '2. Choose "Sticker" layout.',
        '3. Click "Preview/Print".'
      ],
      positiveTesting: {
        inputData: 'Products: P1, P2, P3; Layout: 20 per sheet.',
        steps: ['Select items.', 'Set quantity of labels.', 'Preview.'],
        expectedResult: 'PDF/Print preview shows correctly formatted barcodes for all selected items.'
      },
      negativeTesting: [
        {
          scenario: 'Printing Labels for Zero Qty',
          inputData: 'Label Qty: 0.',
          steps: ['Try to print 0 labels.'],
          expectedErrorOrBehavior: 'System disables "Print" button or shows warning.'
        }
      ],
      passCriteria: 'Barcode labels are accurately generated and printable.'
    }
  ]
};
