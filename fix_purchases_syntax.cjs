const fs = require('fs');
let content = fs.readFileSync('src/components/purchases/PurchasesView.tsx', 'utf-8');

// The stray </div> )} is right after {col.description} </div>
content = content.replace(/\{col\.description\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/button>/g, '{col.description}\n                  </div>\n                </div>\n              </button>');

// We also need to add </div> )} at the very end of the column visibility section before {/* Purchases Table */}
content = content.replace(/<\/div>\s*<\/div>\s*\{\/\* Purchases Table \*\/\}/, '</div>\n          </div>\n        )}\n      </div>\n\n      {/* Purchases Table */}');

fs.writeFileSync('src/components/purchases/PurchasesView.tsx', content);
console.log("Syntax fixed in PurchasesView.tsx");
