import { DocModule } from './types';

export const inventoryDoc: DocModule = {
  id: 'inventory',
  title: '4. Products & Inventory Management',
  category: 'Supply Chain & Stock Control',
  iconName: 'Boxes',
  overview:
    'Comprehensive product catalog, inventory tracking, multi-variant matrices, barcode printing, brand management, warranty periods, warehouse rack locations, and units of measure.',
  workflowSteps: [
    {
      step: 1,
      title: 'Configure Master Taxonomies (Brands, Categories, Units)',
      description:
        'Set up base Units of Measure (e.g. Pcs, Kg, Box), Brands, Categories, and Warranty policies before adding products.',
    },
    {
      step: 2,
      title: 'Create Product Masters (Single, Variable, or Combo)',
      description:
        'Input product title, SKU code, mandatory HSN/SAC tax code, tax rate, purchase price, selling price, and safety alert quantity.',
      tips: 'Always configure the Alert Quantity to receive automated replenishment notices when inventory dips.',
    },
    {
      step: 3,
      title: 'Assign Warehouse Storage Racks & Bins',
      description:
        'Map products to physical warehouse rack, row, and shelf locations to expedite order picking and cycle audits.',
    },
    {
      step: 4,
      title: 'Print Barcode & QR Shelf Labels',
      description:
        'Generate thermal adhesive barcode labels using the Barcode Studio for immediate scanning at POS counters.',
    },
    {
      step: 5,
      title: 'Audit Stock Movement in Product History',
      description:
        'Inspect the perpetual stock ledger to trace every inward purchase, outward sales invoice, transfer, or adjustment.',
    },
  ],
  submenus: [
    {
      id: 'all_products_matrix',
      title: 'All Products Matrix & Inventory Catalog',
      menuPath: 'Products > All products',
      whyItIsUsed:
        'Central searchable inventory grid displaying active stock levels, SKU codes, categories, unit purchase costs, selling prices, tax slabs, and real-time stock alert statuses across all stores.',
      howToUse: [
        '1. Click "Products" in the sidebar, then select "All products".',
        '2. Use the search bar to locate an item by Product Name, SKU, Barcode, or Brand.',
        '3. Filter by Category, Brand, Unit, or Stock Status (In Stock, Low Stock, Out of Stock).',
        '4. View current stock on hand across outlets.',
        '5. Click "Edit" to modify pricing, or "History" to open the perpetual stock ledger.',
        '6. Click "Print Labels" to queue selected products for thermal barcode printing.',
      ],
      whereToEnterDate:
        'In the All Products view, date filtering appears under "Stock Movement Date Range" in the advanced filter drawer [YYYY-MM-DD]. This isolates products sold or restocked within specific dates. In the product row, "Last Restocked Date" is displayed in YYYY-MM-DD format.',
      description:
        'Searchable inventory catalog with real-time stock levels, pricing, category filters, and bulk label printing.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Product Catalog & Inventory Matrix',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/matrix',
        dateBadgeText: '📅 Filter: All Time | Live Multi-Branch Stock Tracking',
        primaryActionText: '+ Add New Product',
        filterOptions: ['All Categories', 'Electronics', 'Apparel', 'Groceries', 'Low Stock Alert (< 10)', 'Out of Stock'],
        mockColumns: ['SKU / Code', 'Product Name', 'Category', 'Brand', 'Purchase Cost', 'Selling Price', 'Current Stock', 'Actions'],
        mockRows: [
          { 'SKU / Code': 'SKU-001', 'Product Name': 'Wireless Bluetooth Headset', Category: 'Electronics', Brand: 'Sony', 'Purchase Cost': '$45.00', 'Selling Price': '$79.99', 'Current Stock': '142 Pcs', Actions: 'Edit | History | Labels' },
          { 'SKU / Code': 'SKU-002', 'Product Name': 'Ultra HD 4K Monitor 27"', Category: 'Electronics', Brand: 'Dell', 'Purchase Cost': '$180.00', 'Selling Price': '$289.00', 'Current Stock': '8 Pcs (Low)', Actions: 'Edit | History | Labels' },
          { 'SKU / Code': 'SKU-003', 'Product Name': 'Ergonomic Office Chair', Category: 'Furniture', Brand: 'Herman', 'Purchase Cost': '$120.00', 'Selling Price': '$210.00', 'Current Stock': '24 Pcs', Actions: 'Edit | History | Labels' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Primary Action: + Add New Product',
          fieldOrSection: 'Top Right Header Bar',
          instruction: 'Click to open the comprehensive product creation form.',
        },
        {
          pinNumber: 2,
          label: 'Stock Date & Movement Filter',
          fieldOrSection: 'Filter Drawer Controls',
          instruction: 'Filter catalog items based on recent inward or outward activity.',
          whereToEnterDate: 'Specify Date Range in YYYY-MM-DD format in the filter drawer.',
        },
        {
          pinNumber: 3,
          label: 'Category & Brand Filter Dropdowns',
          fieldOrSection: 'Top Filter Bar',
          instruction: 'Narrow down inventory table by specific merchandise classifications.',
        },
        {
          pinNumber: 4,
          label: 'Current Stock & Low Stock Warnings',
          fieldOrSection: 'Table Column 7',
          instruction: 'Real-time stock balance. Amber/Red badge flags safety threshold breaches.',
        },
        {
          pinNumber: 5,
          label: 'Product History & Barcode Actions',
          fieldOrSection: 'Actions Column',
          instruction: 'Launch perpetual ledger or print barcode shelf stickers.',
        },
      ],
      fields: [
        {
          name: 'SKU / Item Code',
          type: 'Text (Unique Identifier)',
          required: true,
          purpose: 'Primary inventory identifier used in barcode scanning and stock ledgers.',
          functionality: 'Scanned at POS or typed during invoice line item lookup.',
          validationRules: 'Alphanumeric, no spaces. Must be unique across all products.',
        },
        {
          name: 'Product Name',
          type: 'Text',
          required: true,
          purpose: 'Official commercial title of the item.',
          functionality: 'Printed on thermal receipts, tax invoices, and displayed on POS buttons.',
          validationRules: 'Minimum 2 characters, maximum 150 characters.',
        },
        {
          name: 'Current Stock',
          type: 'Decimal / Quantity',
          required: false,
          purpose: 'Current units available for immediate sale.',
          functionality: 'Decremented on sales/transfers; incremented on purchases/returns.',
          validationRules: 'Non-negative unless negative stock selling is enabled in settings.',
        },
        {
          name: 'Purchase Cost (Excl. Tax)',
          type: 'Currency Number',
          required: true,
          purpose: 'Acquisition cost per unit paid to vendors.',
          functionality: 'Used to calculate Cost of Goods Sold (COGS) and inventory asset valuation.',
          validationRules: 'Positive number with up to 2 decimal places.',
        },
        {
          name: 'Selling Price (Excl. Tax)',
          type: 'Currency Number',
          required: true,
          purpose: 'Base retail or wholesale price charged to customers before tax.',
          functionality: 'Default unit price loaded into sales invoices.',
          validationRules: 'Must be greater than $0.00.',
        },
      ],
    },
    {
      id: 'add_product_form',
      title: 'Add New Product Master Form',
      menuPath: 'Products > Add New Product',
      whyItIsUsed:
        'Registers new inventory items into the master database, configuring product type (Single, Variable, Combo), SKU code, mandatory HSN/SAC tax code, tax rate, purchase price, selling price, warranty, and storage rack location.',
      howToUse: [
        '1. Navigate to Products > Add New Product.',
        '2. Enter Product Name, select Product Type (Single / Variable / Combo), and input SKU or click "Auto-Generate".',
        '3. Select Category, Brand, Unit of Measure, and Rack Location.',
        '4. Set Alert Quantity (e.g. 10 units) to trigger automatic low-stock warnings.',
        '5. Input Mandatory HSN/SAC Code and select applicable Tax Rate (e.g. GST 18%).',
        '6. Enter Purchase Price (Excl. Tax) and Selling Price (Excl. Tax); system computes margins.',
        '7. Set Opening Stock Quantity, Opening Stock Location, and Opening Stock Date [YYYY-MM-DD].',
        '8. Click "Save & Add Another" or "Save Product" to commit.',
      ],
      whereToEnterDate:
        'In the Add Product form, date entry occurs in the "Opening Stock Date" field located in the Initial Stock & Inventory section. Input the date in YYYY-MM-DD format (e.g. 2026-10-04). This sets the accounting timestamp for opening inventory valuation on balance sheets and establishes the beginning row in the Product History ledger.',
      description:
        'Comprehensive product creation form with tax slabs, margin calculators, multi-location opening stock, and warranty periods.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Create Master Product',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/add',
        dateBadgeText: '📅 Opening Stock Date: Required [YYYY-MM-DD]',
        primaryActionText: 'Save Product Record',
        formSections: [
          {
            title: '1. Basic Product Identity',
            fields: [
              { label: 'Product Name *', placeholder: 'e.g. Wireless Noise-Cancelling Headphones', isRequired: true, pinNumber: 1 },
              { label: 'SKU / Barcode *', placeholder: 'e.g. WNH-8821 (or click Auto)', isRequired: true, pinNumber: 2 },
              { label: 'Category *', placeholder: 'Select: Consumer Electronics', isRequired: true },
              { label: 'Brand', placeholder: 'Select: Sony' },
              { label: 'Unit of Measure (UoM) *', placeholder: 'Select: Pieces (Pcs)', isRequired: true },
            ],
          },
          {
            title: '2. Tax & Statutory Identifiers',
            fields: [
              { label: 'HSN / SAC Code *', placeholder: 'e.g. 85183000 (Mandatory for Tax)', isRequired: true, pinNumber: 3 },
              { label: 'Applicable Tax Slab *', placeholder: 'Select: GST 18% (CGST 9% + SGST 9%)', isRequired: true },
              { label: 'Tax Type', placeholder: 'Exclusive (Tax added on top of base price)' },
            ],
          },
          {
            title: '3. Pricing & Profit Margin',
            fields: [
              { label: 'Purchase Price (Excl. Tax) *', placeholder: '$45.00', isRequired: true, pinNumber: 4 },
              { label: 'Profit Margin %', placeholder: '77.78% (Auto-calculated)' },
              { label: 'Selling Price (Excl. Tax) *', placeholder: '$79.99', isRequired: true },
            ],
          },
          {
            title: '4. Stock Alert & Opening Stock Date',
            fields: [
              { label: 'Safety Alert Quantity', placeholder: '10 (Alert when below 10)' },
              { label: 'Opening Stock Quantity', placeholder: '50' },
              { label: 'Opening Stock Date *', placeholder: 'YYYY-MM-DD (e.g. 2026-10-04)', isDate: true, isRequired: true, pinNumber: 5 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Product Name & Description',
          fieldOrSection: 'Section 1: General Info',
          instruction: 'Enter clear commercial product name as displayed on receipts.',
        },
        {
          pinNumber: 2,
          label: 'SKU / Barcode Generator',
          fieldOrSection: 'Section 1: Item Code',
          instruction: 'Type manufacturer barcode or click Generate for auto-created code.',
        },
        {
          pinNumber: 3,
          label: 'Mandatory HSN / SAC Tax Code',
          fieldOrSection: 'Section 2: Tax Configuration',
          instruction: 'Enter official tariff code required for B2B tax compliance and invoice validity.',
        },
        {
          pinNumber: 4,
          label: 'Cost & Selling Price Inputs',
          fieldOrSection: 'Section 3: Pricing Engine',
          instruction: 'System computes profit margins and selling price inclusive of tax dynamically.',
        },
        {
          pinNumber: 5,
          label: 'Opening Stock Date Input',
          fieldOrSection: 'Section 4: Initial Inventory',
          instruction: 'Specify the baseline date in YYYY-MM-DD format for initial quantity capitalization.',
          whereToEnterDate: 'Opening Stock Date field in Section 4: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 6,
          label: 'Save & Submit Action',
          fieldOrSection: 'Bottom Action Bar',
          instruction: 'Click Save Product to commit or Save & Add Another for batch creation.',
        },
      ],
      fields: [
        {
          name: 'HSN / SAC Code',
          type: 'Text (Tariff Code)',
          required: true,
          purpose: 'Harmonized System of Nomenclature code for statutory tax reporting.',
          functionality: 'Enforced by government tax authorities; printed on invoices and GSTR reports.',
          validationRules: 'Must be 4, 6, or 8 digits. Numbers only.',
        },
        {
          name: 'Opening Stock Date',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Baseline date for initial stock count.',
          functionality: 'Enters the opening inventory balance into the general ledger.',
          validationRules: 'Valid calendar date.',
        },
        {
          name: 'Alert Quantity',
          type: 'Integer',
          required: false,
          purpose: 'Minimum threshold before product appears in Low Stock alert notifications.',
          functionality: 'Triggers amber highlight when current stock falls below this quantity.',
          validationRules: 'Non-negative integer.',
        },
      ],
    },
    {
      id: 'product_history',
      title: 'Product Stock Movement & Audit Ledger',
      menuPath: 'Products > Product History',
      whyItIsUsed:
        'Provides an immutable, chronological stock movement audit trail for every SKU, showing every inward purchase receipt, outward POS sale, customer return, branch transfer, and manual stock adjustment with running balance.',
      howToUse: [
        '1. Go to Products > Product History.',
        '2. Select the product from the SKU/Title search dropdown.',
        '3. Choose the Location (or All Outlets).',
        '4. Set Date Range: From Date [YYYY-MM-DD] to To Date [YYYY-MM-DD].',
        '5. Click "Search History" to inspect transaction records, quantities in/out, reference numbers, and running balance.',
        '6. Export CSV / PDF for inventory loss investigations or physical stocktaking reconciliation.',
      ],
      whereToEnterDate:
        'In Product History, date selection occurs at the top via "Movement Date From [YYYY-MM-DD]" and "Movement Date To [YYYY-MM-DD]". Each ledger row displays the exact "Transaction Timestamp" in YYYY-MM-DD HH:MM:SS format to provide forensic traceability for inventory audits.',
      description:
        'Perpetual stock card ledger displaying chronological inward/outward quantity movements and running inventory balance.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Product Stock Movement History',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/history',
        dateBadgeText: '📅 Ledger Scope: 2026-10-01 to 2026-10-04 | SKU-001 (Sony Headset)',
        primaryActionText: 'Export Stock Card PDF',
        mockColumns: ['Timestamp', 'Event Type', 'Reference No', 'Location', 'Quantity In (+)', 'Quantity Out (-)', 'Balance on Hand', 'User'],
        mockRows: [
          { Timestamp: '2026-10-01 09:00', 'Event Type': 'Opening Stock', 'Reference No': 'INIT-01', Location: 'Main Flagship', 'Quantity In (+)': '+150', 'Quantity Out (-)': '-', 'Balance on Hand': '150 Pcs', User: 'System' },
          { Timestamp: '2026-10-02 11:14', 'Event Type': 'POS Sale', 'Reference No': 'POS-8841', Location: 'Main Flagship', 'Quantity In (+)': '-', 'Quantity Out (-)': '-5', 'Balance on Hand': '145 Pcs', User: 'Cashier-01' },
          { Timestamp: '2026-10-03 16:30', 'Event Type': 'POS Sale', 'Reference No': 'POS-8910', Location: 'Main Flagship', 'Quantity In (+)': '-', 'Quantity Out (-)': '-3', 'Balance on Hand': '142 Pcs', User: 'Cashier-02' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Product SKU Selector',
          fieldOrSection: 'Top Control Bar',
          instruction: 'Select product item to load its perpetual inventory ledger.',
        },
        {
          pinNumber: 2,
          label: 'Date Range Selector (From & To)',
          fieldOrSection: 'Date Filter Inputs',
          instruction: 'Filter stock movements between specific calendar dates.',
          whereToEnterDate: 'Specify From Date and To Date in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Quantity In / Out Columns',
          fieldOrSection: 'Grid Columns 5 & 6',
          instruction: 'Shows additions from purchases/returns (+) and deductions from sales/transfers (-).',
        },
        {
          pinNumber: 4,
          label: 'Balance on Hand Running Total',
          fieldOrSection: 'Column 7',
          instruction: 'Computes physical inventory remaining after each event.',
        },
      ],
      fields: [
        {
          name: 'Movement Date Range',
          type: 'Dual Date Picker',
          required: true,
          purpose: 'Sets the audit interval for inventory movements.',
          functionality: 'Filters ledger entries based on transaction execution timestamp.',
          validationRules: 'From Date must precede To Date.',
        },
      ],
    },
    {
      id: 'import_products',
      title: 'Bulk Product Import (CSV / Excel)',
      menuPath: 'Products > Import products',
      whyItIsUsed:
        'Enables rapid onboarding of large product catalogs with SKUs, categories, brands, HSN codes, cost prices, selling prices, and opening stock quantities from an Excel/CSV file.',
      howToUse: [
        '1. Go to Products > Import products.',
        '2. Click "Download Template" to get the standardized spreadsheet template.',
        '3. Fill in product rows: Product Name, SKU, Category, Brand, Unit, HSN Code, Tax Rate, Cost Price, Selling Price, Opening Stock.',
        '4. Upload the file (.csv or .xlsx).',
        '5. Validate preview for errors (e.g. duplicate SKUs, missing HSN codes).',
        '6. Click "Execute Bulk Import" to commit valid records.',
      ],
      whereToEnterDate:
        'In the bulk import template, date entry is specified in the "opening_stock_date" column in YYYY-MM-DD format. Missing dates automatically inherit the system upload date.',
      description:
        'High-capacity spreadsheet product importer with automatic taxonomy mapping and HSN validation.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Bulk Catalog Importer',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/import',
        dateBadgeText: '📄 Spreadsheet Format: .CSV or .XLSX | Max: 10,000 SKUs',
        primaryActionText: 'Validate & Import Catalog',
        formSections: [
          {
            title: '1. Download Instructions & Template',
            fields: [
              { label: 'Template Download', placeholder: 'Download "product_catalog_template.csv" (Click to download)', pinNumber: 1 },
            ],
          },
          {
            title: '2. Upload Completed Spreadsheet',
            fields: [
              { label: 'Select Catalog File *', placeholder: 'Drag file here or click Browse', isRequired: true, pinNumber: 2 },
              { label: 'Duplicate SKU Action', placeholder: 'Select: Skip Existing / Update Prices', pinNumber: 3 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Template Download Action',
          fieldOrSection: 'Top Help Box',
          instruction: 'Download official column format to avoid parsing errors.',
        },
        {
          pinNumber: 2,
          label: 'File Drag & Drop Area',
          fieldOrSection: 'Upload Zone',
          instruction: 'Attach your populated CSV or Excel file.',
        },
        {
          pinNumber: 3,
          label: 'Duplicate Handling Rule',
          fieldOrSection: 'Import Options',
          instruction: 'Choose whether existing SKUs should be updated or skipped.',
        },
      ],
      fields: [
        {
          name: 'Catalog Spreadsheet',
          type: 'File Picker',
          required: true,
          purpose: 'Source file containing catalog rows.',
          functionality: 'Parsed and validated against SKU uniqueness and mandatory HSN rules.',
          validationRules: 'Max size 15 MB. Valid CSV or XLSX format.',
        },
      ],
    },
    {
      id: 'variations',
      title: 'Product Variations & Combo Types',
      menuPath: 'Products > Variations & Combo Types',
      whyItIsUsed:
        'Configures multi-attribute matrix templates (e.g. Size: S/M/L/XL, Color: Red/Blue/Green) and composite combo kits (bundle items sold under a single price) for flexible retail retailing.',
      howToUse: [
        '1. Click "Variations & Combo Types" under Products.',
        '2. Review existing attribute sets (e.g. T-Shirt Sizes, Shoe Sizes, Storage Capacities).',
        '3. Click "+ Add Variation Template".',
        '4. Enter Variation Name (e.g. "Apparel Sizes") and add values: "Small", "Medium", "Large", "XL".',
        '5. When creating a Variable Product in Add Product, select this template to auto-generate all SKU permutations.',
      ],
      whereToEnterDate:
        'Variations are structural attribute templates and do not require date entry. When a variable SKU is sold, the transaction date is recorded on the parent sales invoice in YYYY-MM-DD format.',
      description:
        'Management of multi-variant attribute dimensions and combo product bundles.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Variation Templates & Attributes',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/variations',
        dateBadgeText: '🧩 Attribute Sets: Dynamic Matrix Active',
        primaryActionText: '+ Add Variation Template',
        mockColumns: ['Template ID', 'Attribute Name', 'Attribute Values', 'Assigned Products', 'Actions'],
        mockRows: [
          { 'Template ID': 'VAR-01', 'Attribute Name': 'Apparel Size', 'Attribute Values': 'XS, S, M, L, XL, XXL', 'Assigned Products': '42 SKUs', Actions: 'Edit | Delete' },
          { 'Template ID': 'VAR-02', 'Attribute Name': 'Storage Capacity', 'Attribute Values': '64GB, 128GB, 256GB, 512GB', 'Assigned Products': '18 SKUs', Actions: 'Edit | Delete' },
          { 'Template ID': 'VAR-03', 'Attribute Name': 'Shoe Size (UK/US)', 'Attribute Values': '7, 8, 9, 10, 11, 12', 'Assigned Products': '29 SKUs', Actions: 'Edit | Delete' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Variation Template Button',
          fieldOrSection: 'Top Right Header',
          instruction: 'Click to open the attribute set creation dialog.',
        },
        {
          pinNumber: 2,
          label: 'Attribute Values Tag List',
          fieldOrSection: 'Data Grid Column 3',
          instruction: 'Displays specific dimensional options (e.g. Small, Medium, Large).',
        },
      ],
      fields: [
        {
          name: 'Variation Name',
          type: 'Text',
          required: true,
          purpose: 'Label for the attribute dimension (e.g. Color, Size, Storage).',
          functionality: 'Appears as option selector on product forms and POS checkout.',
          validationRules: 'Minimum 2 characters.',
        },
        {
          name: 'Variation Values',
          type: 'Comma-separated Tags',
          required: true,
          purpose: 'The specific values within this attribute dimension.',
          functionality: 'Generates separate SKU lines for each value during variable product setup.',
          validationRules: 'At least 1 value required.',
        },
      ],
    },
    {
      id: 'categories',
      title: 'Product Categories & Sub-Categories Tree',
      menuPath: 'Products > Categories',
      whyItIsUsed:
        'Organizes the product catalog into a hierarchical tree structure (Parent Categories and Sub-Categories) to accelerate POS screen navigation, POS touch grid filtering, and segmented revenue reports.',
      howToUse: [
        '1. Select Products > Categories.',
        '2. Review category hierarchy with associated category codes and product counts.',
        '3. Click "+ Add Category".',
        '4. Enter Category Name and unique Category Code (e.g. "CAT-ELEC").',
        '5. If creating a sub-category, check "Add as Sub-Category" and select the Parent Category.',
        '6. Click "Save Category".',
      ],
      whereToEnterDate:
        'Categories do not require dates. Category revenue and sales velocity can be analyzed by setting fiscal dates in the Product Sell Report in YYYY-MM-DD format.',
      description:
        'Hierarchical taxonomy tree organizing merchandise into parent and sub-categories for POS grid display.',
      mockup: {
        viewType: 'tree',
        windowTitle: 'Royal ERP - Product Categories & Taxonomies',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/categories',
        dateBadgeText: '📁 Category Hierarchy: Multi-Level Active',
        primaryActionText: '+ Add New Category',
        mockColumns: ['Category Code', 'Category Name', 'Parent Category', 'Products Count', 'POS Display', 'Actions'],
        mockRows: [
          { 'Category Code': 'ELEC-01', 'Category Name': 'Consumer Electronics', 'Parent Category': 'Root (None)', 'Products Count': '124', 'POS Display': 'Visible', Actions: 'Edit | Add Sub' },
          { 'Category Code': 'ELEC-SUB-01', 'Category Name': 'Audio & Headphones', 'Parent Category': 'Consumer Electronics', 'Products Count': '38', 'POS Display': 'Visible', Actions: 'Edit | Delete' },
          { 'Category Code': 'FURN-01', 'Category Name': 'Office Furniture', 'Parent Category': 'Root (None)', 'Products Count': '46', 'POS Display': 'Visible', Actions: 'Edit | Add Sub' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Category Button',
          fieldOrSection: 'Top Right Action Bar',
          instruction: 'Click to open the category creation dialog.',
        },
        {
          pinNumber: 2,
          label: 'Parent Category Selector',
          fieldOrSection: 'Category Form Dialog',
          instruction: 'Select parent category to build nested sub-category hierarchy.',
        },
        {
          pinNumber: 3,
          label: 'POS Display Toggle',
          fieldOrSection: 'Column 5 in Grid',
          instruction: 'Toggle whether this category appears as a quick-filter tab on POS touchscreens.',
        },
      ],
      fields: [
        {
          name: 'Category Name',
          type: 'Text',
          required: true,
          purpose: 'Name displayed on category buttons and reports.',
          functionality: 'Used as primary grouping in inventory searches.',
          validationRules: 'Minimum 2 characters.',
        },
        {
          name: 'Category Code',
          type: 'Alphanumeric Code',
          required: true,
          purpose: 'Short identifier used in automated SKU generation prefixes.',
          functionality: 'Unique identifier for the category.',
          validationRules: 'Must be unique.',
        },
      ],
    },
    {
      id: 'brands_view',
      title: 'Product Brands & Manufacturers',
      menuPath: 'Products > Brands',
      whyItIsUsed:
        'Registers merchandise manufacturers and brand labels (e.g. Apple, Samsung, Nike, Sony) for brand-level margin analysis, supplier warranty tracking, and POS filtering.',
      howToUse: [
        '1. Go to Products > Brands.',
        '2. Review existing registered brands and their descriptions.',
        '3. Click "+ Add Brand".',
        '4. Enter Brand Name and optional Brand Description.',
        '5. Upload Brand Logo image if desired for printed label headers.',
        '6. Click "Save Brand".',
      ],
      whereToEnterDate:
        'Brands are master entities without date inputs. Brand sales and profitability can be audited in the Reports section by selecting date ranges in YYYY-MM-DD format.',
      description:
        'Master list of product brands and manufacturers for reporting and POS catalog categorization.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Product Brands & Manufacturers',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/brands',
        dateBadgeText: '🏷️ Brand Catalog: 28 Brands Active',
        primaryActionText: '+ Add New Brand',
        mockColumns: ['Brand ID', 'Brand Name', 'Manufacturer / Vendor', 'Total SKUs', 'Status', 'Actions'],
        mockRows: [
          { 'Brand ID': 'BRD-01', 'Brand Name': 'Sony Corporation', 'Manufacturer / Vendor': 'Sony Global', 'Total SKUs': '48', Status: 'Active', Actions: 'Edit | View Products' },
          { 'Brand ID': 'BRD-02', 'Brand Name': 'Dell Technologies', 'Manufacturer / Vendor': 'Dell Commercial', 'Total SKUs': '32', Status: 'Active', Actions: 'Edit | View Products' },
          { 'Brand ID': 'BRD-03', 'Brand Name': 'Logitech', 'Manufacturer / Vendor': 'Logitech Dist', 'Total SKUs': '19', Status: 'Active', Actions: 'Edit | View Products' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Brand Action',
          fieldOrSection: 'Top Action Bar',
          instruction: 'Click to launch the brand creation popup dialog.',
        },
        {
          pinNumber: 2,
          label: 'Total SKUs Assigned',
          fieldOrSection: 'Grid Column 4',
          instruction: 'Shows active catalog items associated with this brand.',
        },
      ],
      fields: [
        {
          name: 'Brand Name',
          type: 'Text',
          required: true,
          purpose: 'Official commercial trademark name.',
          functionality: 'Printed on invoices and product shelf labels.',
          validationRules: 'Minimum 2 characters.',
        },
      ],
    },
    {
      id: 'warranties_view',
      title: 'Warranties & Guarantee Policies',
      menuPath: 'Products > Warranty',
      whyItIsUsed:
        'Configures after-sales warranty and guarantee durations (e.g. 6 Months Replacement, 1 Year Manufacturer Warranty, 3 Years Comprehensive) that automatically attach to sold serial numbers and print on customer receipts.',
      howToUse: [
        '1. Select Products > Warranty in the sidebar.',
        '2. Review active warranty terms.',
        '3. Click "+ Add Warranty".',
        '4. Provide Warranty Title, Duration Value (e.g. 12), and Duration Unit (Days / Months / Years).',
        '5. Input Warranty Terms and policy details.',
        '6. Attach this policy to products in Add Product to have expiration dates auto-calculate on invoices.',
      ],
      whereToEnterDate:
        'In the Warranty view, you define duration units (e.g. 12 Months). When a product is sold at POS, the system takes the Sale Date [YYYY-MM-DD] and computes the exact "Warranty Expiration Date" [YYYY-MM-DD] printed on the customer receipt.',
      description:
        'Configuration of warranty periods and terms printed on customer receipts for after-sales support.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Product Warranty Policies',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/warranties',
        dateBadgeText: '🛡️ Warranty Engine: Auto-Expiry Computation Active',
        primaryActionText: '+ Add Warranty Policy',
        mockColumns: ['Warranty ID', 'Policy Title', 'Duration', 'Duration Type', 'Description / Terms', 'Actions'],
        mockRows: [
          { 'Warranty ID': 'WAR-01', 'Policy Title': 'Standard 1 Year Limited', Duration: '12', 'Duration Type': 'Months', 'Description / Terms': 'Covers manufacturing defects; excludes accidental damage', Actions: 'Edit | Delete' },
          { 'Warranty ID': 'WAR-02', 'Policy Title': '6 Months Replacement', Duration: '6', 'Duration Type': 'Months', 'Description / Terms': 'Instant over-the-counter replacement upon fault verification', Actions: 'Edit | Delete' },
          { 'Warranty ID': 'WAR-03', 'Policy Title': '2 Years Comprehensive', Duration: '2', 'Duration Type': 'Years', 'Description / Terms': 'Full parts & labor coverage including battery health', Actions: 'Edit | Delete' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Warranty Policy Button',
          fieldOrSection: 'Top Right Header',
          instruction: 'Click to open the warranty creation modal.',
        },
        {
          pinNumber: 2,
          label: 'Duration & Unit (Months/Years)',
          fieldOrSection: 'Grid Columns 3 & 4',
          instruction: 'Specifies the temporal duration added to invoice date.',
        },
      ],
      fields: [
        {
          name: 'Warranty Name',
          type: 'Text',
          required: true,
          purpose: 'Label printed on customer invoice (e.g. 12 Months Warranty).',
          functionality: 'Informs customer of coverage duration.',
          validationRules: 'Minimum 2 characters.',
        },
        {
          name: 'Duration Value',
          type: 'Integer',
          required: true,
          purpose: 'Number of time units for coverage.',
          functionality: 'Multiplied by Duration Type to compute expiry date.',
          validationRules: 'Must be positive integer (> 0).',
        },
        {
          name: 'Duration Type',
          type: 'Select (Days | Months | Years)',
          required: true,
          purpose: 'Time metric unit for warranty duration.',
          functionality: 'Dictates calendar addition to invoice timestamp.',
          validationRules: 'Must select Days, Months, or Years.',
        },
      ],
    },
    {
      id: 'racks',
      title: 'Warehouse Racks, Rows & Storage Bins',
      menuPath: 'Products > Rack, Row & Shelf Positions',
      whyItIsUsed:
        'Maps products to physical storage coordinates (Rack number, Row level, Bin/Shelf position) across warehouse zones to accelerate picking and packing for counter cashiers and dispatch staff.',
      howToUse: [
        '1. Open Products > Rack, Row & Shelf Positions.',
        '2. Filter by Warehouse Location.',
        '3. Review or assign Rack, Row, and Shelf coordinates for each SKU.',
        '4. Update positions when warehouse layouts undergo reorganizations.',
        '5. Coordinates print on picking slips and packing lists to guide warehouse staff.',
      ],
      whereToEnterDate:
        'Rack coordinates are spatial attributes and do not require date entry. Reorganization audit timestamps are tracked in the System Security audit logs in YYYY-MM-DD format.',
      description:
        'Physical bin location coordinates (Rack, Row, Shelf) mapped to products for warehouse picking optimization.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Warehouse Storage Bins & Rack Coordinates',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/racks',
        dateBadgeText: '📍 Storage Logistics: Fast-Picking Map Active',
        primaryActionText: '+ Assign Rack Position',
        mockColumns: ['SKU', 'Product Name', 'Warehouse Location', 'Rack #', 'Row #', 'Shelf / Bin #', 'Actions'],
        mockRows: [
          { SKU: 'SKU-001', 'Product Name': 'Wireless Bluetooth Headset', 'Warehouse Location': 'Central Depot', 'Rack #': 'Rack-A', 'Row #': 'Row-02', 'Shelf / Bin #': 'Bin-14', Actions: 'Edit Position' },
          { SKU: 'SKU-002', 'Product Name': 'Ultra HD 4K Monitor 27"', 'Warehouse Location': 'Central Depot', 'Rack #': 'Rack-B', 'Row #': 'Row-01', 'Shelf / Bin #': 'Pallet-04', Actions: 'Edit Position' },
          { SKU: 'SKU-003', 'Product Name': 'Ergonomic Office Chair', 'Warehouse Location': 'Furniture Depot', 'Rack #': 'Rack-F', 'Row #': 'Row-04', 'Shelf / Bin #': 'Aisle-08', Actions: 'Edit Position' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Location Filter',
          fieldOrSection: 'Top Control Bar',
          instruction: 'Filter storage map by specific physical warehouse facility.',
        },
        {
          pinNumber: 2,
          label: 'Rack, Row, and Bin Columns',
          fieldOrSection: 'Grid Columns 4, 5, 6',
          instruction: 'Displays physical aisle, vertical level, and shelf coordinate.',
        },
      ],
      fields: [
        {
          name: 'Rack Identifier',
          type: 'Text',
          required: false,
          purpose: 'Aisle or vertical rack structure label.',
          functionality: 'Guides picker to the correct storage zone.',
          validationRules: 'Alphanumeric (e.g. Rack-A, Aisle-3).',
        },
      ],
    },
    {
      id: 'units',
      title: 'Units of Measure (UoM) & Decimal Precision',
      menuPath: 'Products > Units of Measure (UoM)',
      whyItIsUsed:
        'Configures physical measurement units (Pieces, Kilograms, Liters, Meters, Boxes, Dozens) and specifies whether fractional decimal quantities (e.g. 1.750 Kg) are permitted during POS sales.',
      howToUse: [
        '1. Go to Products > Units of Measure (UoM).',
        '2. Review existing units: Pcs, Kg, Box, Mtr, Ltr.',
        '3. Click "+ Add Unit".',
        '4. Enter Unit Name (e.g. "Kilogram"), Short Name (e.g. "Kg"), and toggle "Allow Decimals".',
        '5. If creating composite units, set conversion multiplier (e.g. 1 Box = 12 Pieces).',
        '6. Click "Save Unit".',
      ],
      whereToEnterDate:
        'Units of measurement do not require date entry. Transactional quantities using these units are recorded with invoice timestamps in YYYY-MM-DD format.',
      description:
        'Configuration of measurement units, fractional decimal permissions, and conversion multipliers.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Units of Measure (UoM) Directory',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/units',
        dateBadgeText: '⚖️ Units Engine: Fractional Precision Configured',
        primaryActionText: '+ Add New Unit',
        mockColumns: ['Unit ID', 'Unit Name', 'Short Code', 'Allow Decimals', 'Multiple of Base Unit', 'Actions'],
        mockRows: [
          { 'Unit ID': 'UOM-01', 'Unit Name': 'Pieces', 'Short Code': 'Pcs', 'Allow Decimals': 'No (Integer Only)', 'Multiple of Base Unit': '1.00 Base', Actions: 'Edit | Delete' },
          { 'Unit ID': 'UOM-02', 'Unit Name': 'Kilograms', 'Short Code': 'Kg', 'Allow Decimals': 'Yes (Up to 3 Decimals)', 'Multiple of Base Unit': '1.00 Base', Actions: 'Edit | Delete' },
          { 'Unit ID': 'UOM-03', 'Unit Name': 'Box (12 Pcs)', 'Short Code': 'Box-12', 'Allow Decimals': 'No', 'Multiple of Base Unit': '12.00 Pcs', Actions: 'Edit | Delete' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Unit Button',
          fieldOrSection: 'Top Right Header',
          instruction: 'Click to open the unit configuration dialog.',
        },
        {
          pinNumber: 2,
          label: 'Allow Decimals Column',
          fieldOrSection: 'Grid Column 4',
          instruction: 'Indicates whether cashiers can input fractional quantities at checkout.',
        },
      ],
      fields: [
        {
          name: 'Unit Name',
          type: 'Text',
          required: true,
          purpose: 'Full name of measurement metric.',
          functionality: 'Selected in product profile.',
          validationRules: 'Minimum 2 characters.',
        },
        {
          name: 'Allow Decimals',
          type: 'Boolean Toggle (Yes / No)',
          required: true,
          purpose: 'Dictates whether quantities can be fractional (e.g. 1.250).',
          functionality: 'Enforced at POS and sales inputs to prevent decimal errors on discreet items.',
          validationRules: 'Yes or No.',
        },
      ],
    },
    {
      id: 'barcode_studio_view',
      title: 'Barcode Studio & Thermal Label Generator',
      menuPath: 'Products > Barcode & Labels',
      whyItIsUsed:
        'Generates and prints custom adhesive barcode/QR labels for product packaging and retail shelves, supporting Code-128, EAN-13, and QR Code symbologies across standard thermal roll and sheet printer formats.',
      howToUse: [
        '1. Click "Barcode & Labels" under Products in the primary sidebar.',
        '2. Select products to print: search and add products to the print queue.',
        '3. Enter label quantity for each item (or click "Auto-fill with current stock quantity").',
        '4. Select Label Format: 20 per sheet, 30 per sheet, or Continuous Thermal Roll (e.g. 50mm x 25mm).',
        '5. Toggle Elements to Display: Product Name, Price, Barcode, Company Name, Category, HSN Code.',
        '6. Click "Generate Labels Preview" to inspect the visual sheet.',
        '7. Click "Print Labels" to output to your connected thermal or desktop printer.',
      ],
      whereToEnterDate:
        'In Barcode Studio, you can toggle the "Print Packaging Date" checkbox. When enabled, enter the "Packaging / Manufacturing Date [YYYY-MM-DD]" or select "Current Date" to print expiration or batch dates directly onto the adhesive sticker.',
      description:
        'Professional label designer and thermal print generator supporting Code-128, EAN-13, and QR formats.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Barcode Studio & Thermal Label Generator',
        urlPath: 'https://pos.royal-erp.internal/#/inventory/barcode-studio',
        dateBadgeText: '🏷️ Barcode Symbology: CODE-128 / EAN-13 / QR Active',
        primaryActionText: 'Print Labels via Thermal Driver',
        formSections: [
          {
            title: '1. Select Products for Label Queue',
            fields: [
              { label: 'Search & Add Products', placeholder: 'Type product name or SKU to add...', pinNumber: 1 },
              { label: 'Auto-fill Quantities', placeholder: 'Button: Use Current Warehouse Stock Qty', pinNumber: 2 },
            ],
          },
          {
            title: '2. Label Layout & Printer Paper Settings',
            fields: [
              { label: 'Paper Size / Sticker Sheet', placeholder: 'Select: Continuous Roll (50mm x 25mm)', pinNumber: 3 },
              { label: 'Barcode Symbology', placeholder: 'Select: Code 128 (High Density)' },
            ],
          },
          {
            title: '3. Printed Sticker Elements & Date',
            fields: [
              { label: 'Print Product Name', placeholder: 'Checked: YES' },
              { label: 'Print Retail Price', placeholder: 'Checked: YES ($79.99)' },
              { label: 'Print Manufacturing / Packaging Date', placeholder: 'Checked: YES | Date: 2026-10-04 [YYYY-MM-DD]', isDate: true, pinNumber: 4 },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Product Search & Queue Bar',
          fieldOrSection: 'Section 1: Item Selection',
          instruction: 'Search and queue products for barcode generation.',
        },
        {
          pinNumber: 2,
          label: 'Quantity Multiplier',
          fieldOrSection: 'Queue Table',
          instruction: 'Specify exact sticker count to print for each item.',
        },
        {
          pinNumber: 3,
          label: 'Label Paper Format Selector',
          fieldOrSection: 'Section 2: Paper Geometry',
          instruction: 'Choose standard sheet or roll dimensions (e.g. 50x25mm).',
        },
        {
          pinNumber: 4,
          label: 'Print Packaging Date Field',
          fieldOrSection: 'Section 3: Sticker Elements',
          instruction: 'Input batch date in YYYY-MM-DD format to print on label.',
          whereToEnterDate: 'Packaging Date input in Section 3: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 5,
          label: 'Thermal Print Trigger Action',
          fieldOrSection: 'Bottom Action Bar',
          instruction: 'Click to open browser print dialog formatted for thermal rolls.',
        },
      ],
      fields: [
        {
          name: 'Sticker Paper Geometry',
          type: 'Select Dropdown',
          required: true,
          purpose: 'Sets dimensions for print output.',
          functionality: 'Configures CSS print page rules to match thermal roll width.',
          validationRules: 'Must select valid sticker dimension.',
        },
      ],
    },
  ],
  bestPractices: [
    'Always mandate HSN/SAC codes during product creation to guarantee tax compliance.',
    'Set realistic Alert Quantities to receive early warnings before high-turnover items go out of stock.',
    'Use Product History to investigate any stock variances uncovered during periodic physical inventory counts.',
  ],
  troubleshooting: [
    {
      issue: 'Barcode will not scan at POS counter',
      solution:
        'Verify that the barcode symbology matches your scanner configuration (Code-128 is universal). Ensure thermal printer darkness is set to high contrast.',
    },
    {
      issue: 'Negative stock balance appears in catalog',
      solution:
        'Check Business Settings > Product Settings. If "Allow Overselling" is enabled, sales can finalize when stock is zero. Record an inward purchase or stock adjustment to true-up.',
    },
  ],
};
