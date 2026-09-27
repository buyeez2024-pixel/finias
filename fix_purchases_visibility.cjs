const fs = require('fs');

let content = fs.readFileSync('src/components/purchases/PurchasesView.tsx', 'utf-8');

// Replace the JSX for Column Visibility Section
const jsxToReplace = `          {/* Quick Presets */}
          <div className="flex items-center flex-wrap gap-1.5 self-start sm:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('all')}
              disabled={!isAuthorizedForColumns}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('standard')}
              disabled={!isAuthorizedForColumns}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('compact')}
              disabled={!isAuthorizedForColumns}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Compact
            </button>
          </div>
        </div>

        {/* Role restriction notice if non-admin/manager */}
        {!isAuthorizedForColumns && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-300">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p>You do not have permission to modify column visibility. Please contact your store manager or administrator.</p>
          </div>
        )}

        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {PURCHASE_COLUMN_DEFINITIONS.map((col) => (
            <label
              key={col.id}
              className={\`flex items-center gap-2 p-2 rounded-xl border \${
                visibleColumns[col.id as keyof PurchaseColumnVisibility]
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-slate-900/50 border-slate-800/60 text-slate-400'
              } \${
                (col.alwaysVisible || !isAuthorizedForColumns) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/50 transition-colors'
              }\`}
              title={col.alwaysVisible ? "This column cannot be hidden" : !isAuthorizedForColumns ? "You don't have permission to modify columns" : \`Toggle \${col.label}\`}
            >
              <input
                type="checkbox"
                checked={visibleColumns[col.id as keyof PurchaseColumnVisibility] as boolean}
                onChange={() => toggleColumn(col.id as keyof PurchaseColumnVisibility)}
                disabled={col.alwaysVisible || !isAuthorizedForColumns}
                className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-slate-900 bg-slate-900"
              />
              <span className="text-[11px] font-medium leading-tight select-none">
                {col.label}
              </span>
            </label>
          ))}
        </div>
      </div>`;

const jsxReplacement = `          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnVisibility && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('standard')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('compact')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Compact
                </button>
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
            {/* Role restriction notice if non-admin/manager */}
            {!isAuthorizedForColumns && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <p>You do not have permission to modify column visibility. Please contact your store manager or administrator.</p>
              </div>
            )}

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {PURCHASE_COLUMN_DEFINITIONS.map((col) => (
                <label
                  key={col.id}
                  className={\`flex items-center gap-2 p-2 rounded-xl border \${
                    visibleColumns[col.id as keyof PurchaseColumnVisibility]
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-slate-900/50 border-slate-800/60 text-slate-400'
                  } \${
                    (col.alwaysVisible || !isAuthorizedForColumns) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/50 transition-colors'
                  }\`}
                  title={col.alwaysVisible ? "This column cannot be hidden" : !isAuthorizedForColumns ? "You don't have permission to modify columns" : \`Toggle \${col.label}\`}
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns[col.id as keyof PurchaseColumnVisibility] as boolean}
                    onChange={() => toggleColumn(col.id as keyof PurchaseColumnVisibility)}
                    disabled={col.alwaysVisible || !isAuthorizedForColumns}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-slate-900 bg-slate-900"
                  />
                  <span className="text-[11px] font-medium leading-tight select-none">
                    {col.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>`;

if (content.includes(jsxToReplace)) {
    content = content.replace(jsxToReplace, jsxReplacement);
    fs.writeFileSync('src/components/purchases/PurchasesView.tsx', content);
    console.log("Updated PurchasesView.tsx");
} else {
    console.log("Could not find the JSX to replace in PurchasesView.tsx");
}
