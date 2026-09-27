const fs = require('fs');
let content = fs.readFileSync('src/components/contacts/ContactsView.tsx', 'utf-8');

// Replace renderColumnVisibility function
const functionRegex = /const renderColumnVisibility = \(\) => \([\s\S]*?\n  \);\n/g;
content = content.replace(functionRegex, '');

// Replace where it is used
const usageRegex = /\{\s*renderColumnVisibility\(\)\s*\}/g;
content = content.replace(usageRegex, '');

// Insert the new Section right before "{/* Search & Statistics Bar */}"
const newSection = `      {/* Column Visibility Section (Reference Screenshot Style) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 mb-6 animate-in fade-in slide-in-from-top-2 duration-150">
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
                  {isSuppliers ? Object.values(visibleSupplierColumns).filter(Boolean).length : Object.values(visibleCustomerColumns).filter(Boolean).length} of {isSuppliers ? supplierColumns.length : customerColumns.length} Visible
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Select which columns to display in the contacts table.
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnVisibility && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = {};
                    (isSuppliers ? supplierColumns : customerColumns).forEach(c => allTrue[c.key] = true);
                    isSuppliers ? setVisibleSupplierColumns(allTrue) : setVisibleCustomerColumns(allTrue);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  All
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
          <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {(isSuppliers ? supplierColumns : customerColumns).map((col) => {
                const isVisible = isSuppliers ? visibleSupplierColumns[col.key] : visibleCustomerColumns[col.key];
                return (
                  <label
                    key={col.key}
                    className={\`flex items-center gap-2 p-2 rounded-xl border cursor-pointer hover:bg-slate-800/50 transition-colors \${
                      isVisible
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                        : 'bg-slate-900/50 border-slate-800/60 text-slate-400'
                    }\`}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => isSuppliers ? toggleSupplierColumn(col.key) : toggleCustomerColumn(col.key)}
                      className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-slate-900 bg-slate-900"
                    />
                    <span className="text-[11px] font-medium leading-tight select-none">
                      {col.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>\n      `;

content = content.replace('{/* Search & Statistics Bar */}', newSection + '{/* Search & Statistics Bar */}');

fs.writeFileSync('src/components/contacts/ContactsView.tsx', content);
console.log("Updated ContactsView.tsx");
