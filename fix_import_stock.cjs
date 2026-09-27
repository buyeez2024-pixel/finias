const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ProductImportModal.tsx', 'utf8');

// 1. Add locations to useErp
content = content.replace(
  "const { addProducts, taxGroups, settings } = useErp();",
  "const { addProducts, taxGroups, settings, locations } = useErp();"
);

// 2. Add OpeningStock to headers
content = content.replace(
  `      'TaxRate', \n      'AlertQuantity'\n    ];`,
  `      'TaxRate', \n      'AlertQuantity',\n      'OpeningStock'\n    ];`
);

// 3. Add to mock data
content = content.replace(
  `+ "Sample Product,,123456789,Electronics,BrandX,Nos,100,150,18,10";`,
  `+ "Sample Product,,123456789,Electronics,BrandX,Nos,100,150,18,10,50";`
);

// 4. Update the fallback logic and locationStocks assignment
const newLogic = `        const alertQtyStr = getIdx('alertquantity') !== -1 ? row[getIdx('alertquantity')] : '10';
        const alertQuantity = parseInt(alertQtyStr) || 10;
        
        const stockStr = getIdx('openingstock') !== -1 ? row[getIdx('openingstock')] : '0';
        const openingStock = parseInt(stockStr) || 0;
        
        const defaultLocId = locations && locations.length > 0 ? (locations.find(l => l.isDefault)?.id || locations[0].id) : 'loc_1';

        newProducts.push({
          name,
          sku,
          barcode,
          category,
          brand,
          unit,
          costPrice,
          sellingPrice,
          taxRate,
          alertQuantity,
          type: 'single',
          taxType: 'exclusive',
          locationStocks: {
            [defaultLocId]: openingStock
          }
        });`;

const oldLogic = `        const alertQtyStr = getIdx('alertquantity') !== -1 ? row[getIdx('alertquantity')] : '10';
        const alertQuantity = parseInt(alertQtyStr) || 10;

        newProducts.push({
          name,
          sku,
          barcode,
          category,
          brand,
          unit,
          costPrice,
          sellingPrice,
          taxRate,
          alertQuantity,
          type: 'single',
          taxType: 'exclusive',
          locationStocks: {
            'loc_1': 0
          }
        });`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, newLogic);
  fs.writeFileSync('src/components/inventory/ProductImportModal.tsx', content);
  console.log("Successfully fixed stock import!");
} else {
  console.log("Could not find the old logic block to replace.");
}

