const fs = require('fs');
let content = fs.readFileSync('src/components/purchases/PurchasesView.tsx', 'utf-8');

const regex = /<div className="flex items-center flex-wrap gap-1\.5 mr-2">([\s\S]*?)<div className="flex items-center flex-wrap gap-1\.5 self-start sm:self-auto">([\s\S]*?)<\/button>\s*<\/div>\s*\)\}/;

content = content.replace(regex, `<div className="flex items-center flex-wrap gap-1.5 mr-2">$2</button>\n              </div>\n            )}`);

fs.writeFileSync('src/components/purchases/PurchasesView.tsx', content);
