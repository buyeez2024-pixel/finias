const fs = require('fs');
let content = fs.readFileSync('src/components/purchases/PurchasesView.tsx', 'utf-8');

const regex = /\{\/\*\s*Quick Presets\s*\*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\*\s*Role restriction notice if non-admin\/manager\s*\*\/\}([\s\S]*?)<\/div>\s*<\/div>/g;

const match = regex.exec(content);
if (match) {
  let quickPresetsBlock = match[1];
  let remainingBlock = match[2];

  const replacement = `{/* Quick Presets */}
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnVisibility && (
              <div className="flex items-center flex-wrap gap-1.5 mr-2">
                ${quickPresetsBlock.trim().replace(/^/gm, '                ')}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowColumnVisibility(!showColumnVisibility)}
              className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer \${
                showColumnVisibility 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }\`}
            >
              {showColumnVisibility ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Fields</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show Fields</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showColumnVisibility && (
          <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50">
            {/* Role restriction notice if non-admin/manager */}${remainingBlock}</div>
          </div>
        )}`;

  content = content.replace(match[0], replacement);
  fs.writeFileSync('src/components/purchases/PurchasesView.tsx', content);
  console.log("Updated PurchasesView.tsx");
} else {
  console.log("Could not find the JSX to replace in PurchasesView.tsx");
}
