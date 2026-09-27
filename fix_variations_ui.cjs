const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/VariationsView.tsx', 'utf8');

const oldExtraction = `    deleteProduct,
  } = useErp();`;

const newExtraction = `    deleteProduct,
    showFlashNotification,
  } = useErp();`;

if (content.includes(oldExtraction) && !content.includes('showFlashNotification,')) {
    content = content.replace(oldExtraction, newExtraction);
}

const oldDeleteBtn = `                            <button
                              onClick={() => {
                                if (window.confirm(\`Delete product \${product.name}?\`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`;

const newDeleteBtn = `                            <button
                              onClick={() => {
                                if (product.currentStock > 0) {
                                  showFlashNotification(\`Cannot delete \${product.name}. Stock must be zero. Current stock: \${product.currentStock}\`, 'error');
                                  return;
                                }
                                if (window.confirm(\`Delete product \${product.name}?\`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className={\`p-1.5 rounded-lg transition \${product.currentStock > 0 ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300'}\`}
                              title={product.currentStock > 0 ? "Cannot delete product with existing stock" : "Delete product"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>`;

content = content.replace(new RegExp(oldDeleteBtn.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), newDeleteBtn);

fs.writeFileSync('src/components/inventory/VariationsView.tsx', content);
console.log("Updated UI button in VariationsView");

