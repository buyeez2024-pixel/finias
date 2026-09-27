const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/VariationsView.tsx', 'utf8');

const oldComboBtn = `                          <button
                            onClick={() => {
                              if (confirm(\`Delete combo product "\${product.name}"?\`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 p-2 rounded-xl transition border border-rose-900/40"
                            title="Delete Combo Set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>`;

const newComboBtn = `                          <button
                            onClick={() => {
                              if (product.currentStock > 0) {
                                showFlashNotification(\`Cannot delete \${product.name}. Stock must be zero. Current stock: \${product.currentStock}\`, 'error');
                                return;
                              }
                              if (confirm(\`Delete combo product "\${product.name}"?\`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className={\`p-2 rounded-xl transition border \${product.currentStock > 0 ? 'bg-slate-800/50 text-slate-500 border-slate-700/50 cursor-not-allowed' : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-900/40'}\`}
                            title={product.currentStock > 0 ? "Cannot delete product with existing stock" : "Delete Combo Set"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>`;

if (content.includes(oldComboBtn)) {
    content = content.replace(oldComboBtn, newComboBtn);
    fs.writeFileSync('src/components/inventory/VariationsView.tsx', content);
    console.log("Updated combo UI button in VariationsView");
} else {
    console.log("Could not find combo UI button");
}

