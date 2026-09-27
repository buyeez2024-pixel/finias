const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ProductFormPage.tsx', 'utf8');

const targetStr = `              {/* Profitability Live KPI Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Gross Profit Margin</span>
                  </span>
                  <p
                    className={\`text-xl font-black mt-0.5 \${
                      grossProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }\`}
                  >
                    {marginPercentage}%
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gross Profit per Unit</span>
                  </span>
                  <p
                    className={\`text-xl font-black mt-0.5 \${
                      grossProfit >= 0 ? 'text-white' : 'text-rose-400'
                    }\`}
                  >
                    {settings.currencySymbol} {grossProfit.toFixed(2)}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cost Markup</span>
                  </span>
                  <p className="text-xl font-black text-amber-400 mt-0.5">{markupPercentage}%</p>
                </div>
              </div>
`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, "");
    fs.writeFileSync('src/components/inventory/ProductFormPage.tsx', content);
    console.log("Removed KPI bar");
} else {
    console.log("Could not find KPI bar");
}
