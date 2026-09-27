import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add fallback matches for old tabs to render ContactFormPage
new_cond = "{(activeTab === 'add_contact' || activeTab === 'edit_contact' || activeTab === 'add_customer' || activeTab === 'add_supplier' || activeTab === 'edit_customer' || activeTab === 'edit_supplier') && ("
content = content.replace("{(activeTab === 'add_contact' || activeTab === 'edit_contact') && (", new_cond)

with open('src/App.tsx', 'w') as f:
    f.write(content)
