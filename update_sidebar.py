with open('src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

# Add ShieldAlert import
content = content.replace("  ShieldCheck,", "  ShieldCheck,\n  ShieldAlert,")

# Add security to userMenuSubItems
old_user_menu = """    {
      id: 'permissions',
      label: 'Role & Access Permissions',"""

new_user_menu = """    {
      id: 'security',
      label: 'Security & Anti-Fake Guard',
      badge: 'Bot Shield',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      icon: ShieldAlert,
      onClick: () => setActiveTab('security'),
      isActive: activeTab === 'security' || (activeTab === 'user_menu' && userMenuSubTab === 'security'),
    },
    {
      id: 'permissions',
      label: 'Role & Access Permissions',"""

content = content.replace(old_user_menu, new_user_menu, 1)

# Add top-level Security item in moduleGroups under ADMINISTRATION
old_admin_group = """    {
      groupTitle: 'ADMINISTRATION',
      items: [
        {
          id: 'configuration',"""

new_admin_group = """    {
      groupTitle: 'SECURITY & ADMINISTRATION',
      items: [
        {
          id: 'security',
          label: 'Security & Anti-Fake Shield',
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-500/10 border-rose-500/20',
          onClick: () => setActiveTab('security'),
          isActive: activeTab === 'security' || activeTab === 'security_guard' || (activeTab === 'settings' && settingsSubTab === 'security'),
        },
        {
          id: 'configuration',"""

content = content.replace(old_admin_group, new_admin_group, 1)

with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)
print("Sidebar updated successfully.")
