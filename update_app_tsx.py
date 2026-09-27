with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import for SecurityGuardView
content = content.replace(
    "import { SettingsView } from './components/settings/SettingsView';",
    "import { SettingsView } from './components/settings/SettingsView';\nimport { SecurityGuardView } from './components/security/SecurityGuardView';"
)

# Render SecurityGuardView
content = content.replace(
    "{(activeTab === 'settings' || activeTab === 'notification_templates') && <SettingsView />}",
    "{(activeTab === 'settings' || activeTab === 'notification_templates') && <SettingsView />}\n              {(activeTab === 'security' || activeTab === 'security_guard') && <SecurityGuardView />}"
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("App.tsx updated successfully.")
