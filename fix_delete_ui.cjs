const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/InventoryView.tsx', 'utf8');

const oldExtraction = `    closeProductPage,
  } = useErp();`;

const newExtraction = `    closeProductPage,
    showFlashNotification,
  } = useErp();`;

if (content.includes(oldExtraction) && !content.includes('showFlashNotification,')) {
    content = content.replace(oldExtraction, newExtraction);
}

const oldDeleteBtn = `                            <button
                              onClick={() => {
                                if (window.confirm(\`Delete product \${p.name}?\`)) deleteProduct(p.id);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`;

const newDeleteBtn = `                            <button
                              onClick={() => {
                                if (p.currentStock > 0) {
                                  showFlashNotification(\`Cannot delete \${p.name}. Stock must be zero. Current stock: \${p.currentStock}\`, 'error');
                                  return;
                                }
                                if (window.confirm(\`Delete product \${p.name}?\`)) deleteProduct(p.id);
                              }}
                              className={\`p-1.5 rounded-lg transition \${p.currentStock > 0 ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300'}\`}
                              title={p.currentStock > 0 ? "Cannot delete product with existing stock" : "Delete product"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`;

if (content.includes(oldDeleteBtn)) {
    content = content.replace(oldDeleteBtn, newDeleteBtn);
    fs.writeFileSync('src/components/inventory/InventoryView.tsx', content);
    console.log("Updated UI button");
} else {
    console.log("Could not find old UI button");
}

