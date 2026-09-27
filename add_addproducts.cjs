const fs = require('fs');
let content = fs.readFileSync('src/context/ErpContext.tsx', 'utf8');

const typeTarget = `  addProduct: (product: Omit<Product, 'id' | 'currentStock'>) => void;`;
if(content.includes(typeTarget) && !content.includes('addProducts: (products:')) {
    content = content.replace(typeTarget, typeTarget + `\n  addProducts: (products: Omit<Product, 'id' | 'currentStock'>[]) => void;`);
}

const implTarget = `  const addProduct = (productData: Omit<Product, 'id' | 'currentStock'>) => {`;
const implStr = `  const addProducts = (productsData: Omit<Product, 'id' | 'currentStock'>[]) => {
    const newProducts = productsData.map((productData, idx) => {
      const totalStock = Object.values(productData.locationStocks || {}).reduce((a, b) => a + b, 0);
      const newId = \`prod_\${Date.now()}_\${idx}\`;
      const lots = productData.lots && productData.lots.length > 0 ? productData.lots : [
        {
          id: \`lot_\${Date.now()}_\${idx}\`,
          lotNumber: \`LOT-\${new Date().getFullYear()}-\${String(idx + 1).padStart(3, '0')}\`,
          costPrice: productData.costPrice,
          sellingPrice: productData.sellingPrice,
          currentStock: totalStock,
          createdDate: new Date().toISOString().slice(0, 10),
        }
      ];
      return {
        ...productData,
        id: newId,
        currentStock: totalStock,
        lots: lots,
      };
    });
    setProducts((prev) => [...newProducts, ...prev]);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'currentStock'>) => {`;

if(content.includes(implTarget) && !content.includes('const addProducts = (productsData:')) {
    content = content.replace(implTarget, implStr);
}

const exportTarget = `        addProduct,`;
if(content.includes(exportTarget) && !content.includes('addProducts,')) {
    content = content.replace(exportTarget, exportTarget + `\n        addProducts,`);
}

fs.writeFileSync('src/context/ErpContext.tsx', content);
console.log("Updated ErpContext.tsx");
