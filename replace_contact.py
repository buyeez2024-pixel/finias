import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = re.sub(r"import { CustomerFormPage } from '\./components/contacts/CustomerFormPage';", "import { ContactFormPage } from './components/contacts/ContactFormPage';", content)
content = re.sub(r"import { SupplierFormPage } from '\./components/contacts/SupplierFormPage';\n", "", content)

# Replace components
content = re.sub(r"\{\(activeTab === 'add_customer' \|\| activeTab === 'edit_customer'\) && \(\s*<CustomerFormPage />\s*\)\}", "{(activeTab === 'add_contact' || activeTab === 'edit_contact') && (\n                <ContactFormPage />\n              )}", content)
content = re.sub(r"\{\(activeTab === 'add_supplier' \|\| activeTab === 'edit_supplier'\) && \(\s*<SupplierFormPage />\s*\)\}\n", "", content)

# Replace context tabs (we will rename add_customer / add_supplier in ErpContext later)
with open('src/App.tsx', 'w') as f:
    f.write(content)
