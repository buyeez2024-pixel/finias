const fs = require('fs');
let text = fs.readFileSync('src/components/inventory/ProductImportModal.tsx', 'utf8');
text = text.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/inventory/ProductImportModal.tsx', text);
