# Fix SettingsView.tsx
with open('src/components/settings/SettingsView.tsx', 'r') as f:
    sv = f.read()

sv = sv.replace('  ShieldCheck,', '  ShieldCheck,\n  ShieldAlert,')
with open('src/components/settings/SettingsView.tsx', 'w') as f:
    f.write(sv)

# Fix UserMenuView.tsx
with open('src/components/users/UserMenuView.tsx', 'r') as f:
    um = f.read()

um = um.replace('  ShieldCheck,', '  ShieldCheck,\n  ShieldAlert,')
with open('src/components/users/UserMenuView.tsx', 'w') as f:
    f.write(um)

# Fix Sidebar.tsx
with open('src/components/layout/Sidebar.tsx', 'r') as f:
    sb = f.read()

sb = sb.replace("          onClick: () => setActiveTab('security'),\n          isActive: activeTab === 'security' || activeTab === 'security_guard' || (activeTab === 'settings' && settingsSubTab === 'security'),", "")
with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(sb)

print("Imports and Sidebar fixed.")
