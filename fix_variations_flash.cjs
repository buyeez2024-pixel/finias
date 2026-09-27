const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/VariationsView.tsx', 'utf8');

const oldExtraction = `    deleteProduct,
    openAddProductPage,`;

const newExtraction = `    deleteProduct,
    showFlashNotification,
    openAddProductPage,`;

if (content.includes(oldExtraction) && !content.includes('showFlashNotification,')) {
    content = content.replace(oldExtraction, newExtraction);
    fs.writeFileSync('src/components/inventory/VariationsView.tsx', content);
    console.log("Added showFlashNotification to VariationsView extraction");
} else {
    console.log("Could not find extraction block or already added.");
}
