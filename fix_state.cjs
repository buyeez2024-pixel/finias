const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/InventoryView.tsx', 'utf8');

const target = `  const [searchQuery, setSearchQuery] = useState('');`;
if(content.includes(target) && !content.includes('showImportModal')) {
    content = content.replace(target, target + `\n  const [showImportModal, setShowImportModal] = useState(false);`);
    fs.writeFileSync('src/components/inventory/InventoryView.tsx', content);
    console.log("Fixed state in InventoryView");
} else {
    console.log("Could not fix state.");
}
