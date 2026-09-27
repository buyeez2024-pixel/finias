const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/InventoryView.tsx', 'utf8');

const importTarget = `import { ProductFormPage } from './ProductFormPage';`;
if (content.includes(importTarget) && !content.includes('ProductImportModal')) {
    content = content.replace(importTarget, importTarget + `\nimport { ProductImportModal } from './ProductImportModal';`);
}

const iconTarget = `  Upload,`;
if (!content.includes('Upload,')) {
    content = content.replace(`  Plus,`, `  Plus,\n  Upload,`);
}

const stateTarget = `const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);`;
if (content.includes(stateTarget) && !content.includes('showImportModal')) {
    content = content.replace(stateTarget, stateTarget + `\n  const [showImportModal, setShowImportModal] = useState(false);`);
}

const buttonTarget = `          <button
            id="inv-add-product-btn"
            onClick={openAddProductPage}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>`;
const newButton = `          <button
            id="inv-add-product-btn"
            onClick={openAddProductPage}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import Bulk</span>
          </button>`;

if (content.includes(buttonTarget) && !content.includes('Import Bulk')) {
    content = content.replace(buttonTarget, newButton);
}

const modalTarget = `      {isAdjustmentModalOpen && (`;
const newModal = `      <ProductImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
      {isAdjustmentModalOpen && (`;

if (content.includes(modalTarget) && !content.includes('<ProductImportModal')) {
    content = content.replace(modalTarget, newModal);
}

fs.writeFileSync('src/components/inventory/InventoryView.tsx', content);
console.log('Updated InventoryView.tsx');
