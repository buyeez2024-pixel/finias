with open('src/components/users/UserMenuView.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { SalesCommissionAgentsView } from './SalesCommissionAgentsView';",
    "import { SalesCommissionAgentsView } from './SalesCommissionAgentsView';\nimport { SecurityGuardView } from '../security/SecurityGuardView';"
)
content = content.replace(
    "import {  ShieldCheck,",
    "import {  ShieldCheck,  ShieldAlert,"
)

# Add security tab
old_sub_tabs = "const USER_SUB_TABS: UserMenuTabConfig[] = ["
new_sub_tabs = """const USER_SUB_TABS: UserMenuTabConfig[] = [
  {
    id: 'security' as any,
    label: 'Security & Anti-Fake Guard',
    badge: 'Bot Shield',
    badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    icon: ShieldAlert,
  },"""

content = content.replace(old_sub_tabs, new_sub_tabs, 1)

# Render SecurityGuardView
old_render = """        {currentTab === 'sales_commission_agents' ? (
          <SalesCommissionAgentsView />
        ) : ("""

new_render = """        {currentTab === 'security' ? (
          <SecurityGuardView />
        ) : currentTab === 'sales_commission_agents' ? (
          <SalesCommissionAgentsView />
        ) : ("""

content = content.replace(old_render, new_render, 1)

with open('src/components/users/UserMenuView.tsx', 'w') as f:
    f.write(content)
print("UserMenuView updated successfully.")
