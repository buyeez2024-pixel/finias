import re

# 1. ContactFormPage
with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()
content = content.replace("export const CustomerFormPage", "export const ContactFormPage")
with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)

# 2. Sidebar.tsx
with open('src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()
content = content.replace("openAddCustomerPage,", "openAddContactPage,")
content = content.replace("openAddSupplierPage,", "")
with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)

