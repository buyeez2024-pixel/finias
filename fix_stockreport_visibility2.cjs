const fs = require('fs');
let content = fs.readFileSync('src/components/reports/StockReportView.tsx', 'utf-8');

const regex = /\{\/\*\s*Column Visibility Selector\s*\*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\*\s*5\./g;

const match = regex.exec(content);
if (match) {
  const replacement = `{/* Column Visibility Section (Reference Screenshot Style) */}
      <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 mb-6 animate-in fade-in slide-in-from-top-2 duration-150 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Column Visibility</span>
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {Object.values(visibleColumns).filter(Boolean).length} Visible
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Select which columns to display in the report table.
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnDropdown && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = {};
                    Object.keys(visibleColumns).forEach(k => allTrue[k] = true);
                    setVisibleColumns(allTrue);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  All
                </button>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer \${
                showColumnDropdown 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }\`}
            >
              {showColumnDropdown ? (
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

        {showColumnDropdown && (
          <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Object.entries(visibleColumns).map(([key, isVisible]) => (
                <label
                  key={key}
                  className={\`flex items-center gap-2 p-2 rounded-xl border cursor-pointer hover:bg-slate-800/50 transition-colors \${
                    isVisible
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-slate-900/50 border-slate-800/60 text-slate-400'
                  }\`}
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-slate-900 bg-slate-900"
                  />
                  <span className="text-[11px] font-medium leading-tight select-none">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5.`;

  content = content.replace(match[0], replacement);
  fs.writeFileSync('src/components/reports/StockReportView.tsx', content);
  console.log("Updated StockReportView.tsx");
} else {
  console.log("Could not find the JSX to replace in StockReportView.tsx");
}
