import re

with open('src/components/settings/PosSecurityTab.tsx', 'r') as f:
    content = f.read()

# Add state variable
content = re.sub(
    r'(const \[branchRestriction, setBranchRestriction\] = useState\(settings\.enableBranchRestriction \?\? false\);)',
    r'\1\n  const [enableSecurityShield, setEnableSecurityShield] = useState(settings.enableSecurityShield ?? true);',
    content
)

# Add to handleSave
content = re.sub(
    r'(enableBranchRestriction: branchRestriction,)',
    r'\1\n      enableSecurityShield,',
    content
)

# Add UI section
new_ui = """
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-500" />
              <span>Ultimate System Security Shield</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ransomware & Anti-Hacking Protection (Helmet, Rate Limiting, HPP, CORS)
            </p>
          </div>
          <div 
            onClick={() => setEnableSecurityShield(!enableSecurityShield)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${enableSecurityShield ? 'bg-rose-500' : 'bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableSecurityShield ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            This module actively protects the application from automated ransomware attacks, DDoS, brute-force hacking, and cross-site scripting (XSS) injections.
          </p>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Helmet Configured</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">DDoS Rate Limiter</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">HPP Anti-Pollution</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Strict CORS</span>
          </div>
          {enableSecurityShield ? (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3">
              <Shield className="w-5 h-5 text-rose-400 shrink-0" />
              <p className="text-xs text-rose-300">
                <strong>Shield Active:</strong> Your application's server and source code are strictly protected against threat vectors and automated injection attacks.
              </p>
            </div>
          ) : (
             <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">
                <strong>Shield Disabled:</strong> The system is currently vulnerable to automated attacks and parameter pollution. Not recommended for production.
              </p>
            </div>
          )}
        </div>
      </div>
"""

content = re.sub(
    r'(<form onSubmit=\{handleSave\} className="space-y-6 max-w-3xl">)',
    r'\1\n' + new_ui,
    content
)

with open('src/components/settings/PosSecurityTab.tsx', 'w') as f:
    f.write(content)
