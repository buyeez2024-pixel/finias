with open('src/components/settings/SettingsView.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace(
    "import { PosSecurityTab } from './PosSecurityTab';",
    "import { PosSecurityTab } from './PosSecurityTab';\nimport { SecurityGuardView } from '../security/SecurityGuardView';"
)
content = content.replace(
    "import {  ShieldCheck,",
    "import {  ShieldCheck,  ShieldAlert,"
)

# Update security in SUB_TAB_TITLES
old_sec_title = """  security: {
    label: 'POS Register & Shift Security',
    description: 'Register float policies, supervisor override codes, and cashier shift closure lockouts.',
    icon: Lock,
  },"""

new_sec_title = """  security: {
    label: 'Security & Anti-Fake Guard',
    description: 'Detect and block fake user signups, disposable email addresses, honeypot traps, and brute-force logins.',
    icon: ShieldAlert,
    badge: 'Bot & Auth Shield',
  },
  pos_security: {
    label: 'POS Register & Shift Security',
    description: 'Register float policies, supervisor override codes, and cashier shift closure lockouts.',
    icon: Lock,
  },"""

content = content.replace(old_sec_title, new_sec_title)

# Update tab rendering
old_tab_render = "{settingsSubTab === 'security' && <PosSecurityTab />}"
new_tab_render = "{(settingsSubTab === 'security' || settingsSubTab === 'security_guard') && <SecurityGuardView />}\n        {settingsSubTab === 'pos_security' && <PosSecurityTab />}"

content = content.replace(old_tab_render, new_tab_render)

with open('src/components/settings/SettingsView.tsx', 'w') as f:
    f.write(content)
print("SettingsView updated successfully.")
