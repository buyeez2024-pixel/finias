const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/InventoryView.tsx', 'utf-8');

// Remove the renderColumnVisibilityDropdown function and its usage
const dropdownRegex = /const renderColumnVisibilityDropdown = \(\) => \([\s\S]*?\n  \);\n/g;
content = content.replace(dropdownRegex, '');

// If it's used somewhere in JSX, remove it
content = content.replace(/\{renderColumnVisibilityDropdown\(\)\}/g, '');

fs.writeFileSync('src/components/inventory/InventoryView.tsx', content);
console.log("Updated InventoryView.tsx");
