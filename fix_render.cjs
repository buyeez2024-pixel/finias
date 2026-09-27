const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/InventoryView.tsx', 'utf8');

const target = `    </div>
  );
};`;

if(content.includes(target) && !content.includes('<ProductImportModal')) {
    const replacement = `      <ProductImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
    </div>
  );
};`;
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/inventory/InventoryView.tsx', content);
    console.log("Rendered modal.");
} else {
    console.log("Could not find target or already rendered.");
}
