const fs = require('fs');
const { execSync } = require('child_process');
const files = execSync('find src -type f -name "*.tsx"').toString().trim().split('\n');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // 2. Remove setting/removing to localStorage inside useEffect
  content = content.replace(/localStorage\.setItem\(['"]erp_modal_[a-zA-Z_]+['"]\s*,\s*['"]true['"]\);?/g, '');
  content = content.replace(/localStorage\.removeItem\(['"]erp_modal_[a-zA-Z_]+['"]\);?/g, '');
  content = content.replace(/localStorage\.setItem\(['"]erp_modal_add_customer['"]\s*,\s*['"]true['"]\);?/g, '');
  content = content.replace(/localStorage\.removeItem\(['"]erp_modal_add_customer['"]\);?/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
