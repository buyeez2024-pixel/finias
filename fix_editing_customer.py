import re

with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("editingCustomer.customerGroup", "(editingContact as any)?.customerGroup")
content = content.replace("editingCustomer.", "(editingContact as any)?.")
content = content.replace("isEditMode ? `Edit Customer: ${(editingContact as any)?.name}` : 'Add New Customer Profile'", "isEditMode ? `Edit Contact: ${(editingContact as any)?.name}` : 'Add New Contact'")
content = content.replace("isEditMode ? `Edit Customer: ${editingContact?.name}` : 'Add New Customer Profile'", "isEditMode ? `Edit Contact: ${(editingContact as any)?.name}` : 'Add New Contact'")

# Also fix the title! Wait, let me check the title specifically
with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
