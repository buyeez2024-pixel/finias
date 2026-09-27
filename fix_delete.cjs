const fs = require('fs');
let content = fs.readFileSync('src/context/ErpContext.tsx', 'utf8');

const oldDelete = `  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };`;

const newDelete = `  const deleteProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product && product.currentStock > 0) {
      showFlashNotification(\`Cannot delete \${product.name}. Stock must be zero. Current stock: \${product.currentStock}\`, 'error');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showFlashNotification(\`Product \${product?.name || ''} deleted successfully.\`, 'success');
  };`;

if (content.includes(oldDelete)) {
    content = content.replace(oldDelete, newDelete);
    fs.writeFileSync('src/context/ErpContext.tsx', content);
    console.log("Updated deleteProduct in ErpContext");
} else {
    console.log("Could not find old deleteProduct in ErpContext");
}
