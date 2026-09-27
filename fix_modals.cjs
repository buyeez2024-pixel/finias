const fs = require('fs');
const { execSync } = require('child_process');
const files = execSync('find src -type f -name "*.tsx"').toString().trim().split('\n');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // 1. Remove getting from localStorage in useState initialization
  content = content.replace(/\|\|\s*localStorage\.getItem\([^)]+\)\s*===\s*'true'/g, '');

  // 2. Remove setting/removing to localStorage inside useEffect
  content = content.replace(/localStorage\.setItem\(['"]erp_[a-zA-Z_]+(?:modal|open|create)[a-zA-Z_]*['"]\s*,\s*['"]true['"]\);?/g, '');
  content = content.replace(/localStorage\.removeItem\(['"]erp_[a-zA-Z_]+(?:modal|open|create)[a-zA-Z_]*['"]\);?/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
