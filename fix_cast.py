import re
with open('src/context/ErpContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("return {\n        ...productData,\n        id: newId,\n        currentStock: totalStock,\n        lots: lots,\n      };", "return {\n        ...productData,\n        id: newId,\n        currentStock: totalStock as number,\n        lots: lots,\n      } as Product;")

content = content.replace("const newProduct: Product = {\n      ...productData,\n      id: newId,\n      currentStock: totalStock,\n      lots: lots,\n    };", "const newProduct: Product = {\n      ...productData,\n      id: newId,\n      currentStock: totalStock as number,\n      lots: lots,\n    } as Product;")

with open('src/context/ErpContext.tsx', 'w') as f:
    f.write(content)
