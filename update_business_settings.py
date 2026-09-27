import re

with open('src/components/settings/BusinessSettingsTab.tsx', 'r') as f:
    content = f.read()

# Add AlertCircle import
content = content.replace('  ExternalLink,\n  Shield,', '  ExternalLink,\n  Shield,\n  AlertCircle,')

# Add system_security to SettingsSectionId
content = content.replace("| 'system' | 'printers'", "| 'system' | 'system_security' | 'printers'")

# Add system_security section to SECTIONS array
system_sec_def = """  {
    id: 'system_security',
    label: 'System Security Shield',
    shortLabel: 'System Security',
    icon: Shield,
    description: 'Ransomware & Anti-Hacking Protection (Helmet, Rate Limiting, HPP, CORS anti-injection shield).',
    badge: 'Anti-Hacking',
  },"""

content = content.replace("  { border-color: ", "  { border-color: ") # safety check

if "id: 'system_security'" not in content:
    content = content.replace(
        "  {\n    id: 'prefixes',",
        system_sec_def + "\n  {\n    id: 'prefixes',"
    )

# Add rendering for system_security
security_ui = """
            {/* ========================================================================= */}
            {/* SYSTEM SECURITY SHIELD SECTION */}
            {/* ========================================================================= */}
            {activeSection === 'system_security' && (
              <div className="space-y-6">
                <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-5">
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
                      onClick={() => setFormData({ ...formData, enableSecurityShield: !(formData.enableSecurityShield ?? true) })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${(formData.enableSecurityShield ?? true) ? 'bg-rose-500' : 'bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(formData.enableSecurityShield ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                      This module actively protects the application from automated ransomware attacks, DDoS, brute-force hacking, and cross-site scripting (XSS) injections.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Helmet Configured</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">DDoS Rate Limiter</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">HPP Anti-Pollution</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Strict CORS</span>
                    </div>
                    {(formData.enableSecurityShield ?? true) ? (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3">
                        <Shield className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-rose-300 font-bold">
                            Shield Active & Anti-Hacking Operational
                          </p>
                          <p className="text-xs text-rose-300/80">
                            Your application server, API routes, and source code are strictly protected against threat vectors, parameter pollution, and virus injections.
                          </p>
                        </div>
                      </div>
                    ) : (
                       <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-amber-300 font-bold">
                            Shield Disabled (Vulnerable Mode)
                          </p>
                          <p className="text-xs text-amber-300/80">
                            The security shield is currently inactive. The system is exposed to parameter pollution and automated DDoS requests.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
"""

if "{activeSection === 'system_security' && (" not in content:
    content = content.replace(
        "{/* 10. SYSTEM SETTINGS TAB */}",
        security_ui + "\n            {/* 10. SYSTEM SETTINGS TAB */}"
    )

with open('src/components/settings/BusinessSettingsTab.tsx', 'w') as f:
    f.write(content)

