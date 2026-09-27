import re

with open('src/context/ErpContext.tsx', 'r') as f:
    content = f.read()

# Replace openAddCustomerPage implementation
content = re.sub(r"const openAddCustomerPage = \(\) => \{[\s\S]*?handleSmartSetActiveTab\('add_customer'\);\n\s*\};", 
"""const openAddContactPage = () => {
    setEditingCustomer(null);
    setEditingSupplier(null);
    setContactsSubTab('add_contact');
    handleSmartSetActiveTab('add_contact');
  };""", content)

# Remove openAddSupplierPage implementation
content = re.sub(r"const openAddSupplierPage = \(\) => \{[\s\S]*?handleSmartSetActiveTab\('add_supplier'\);\n\s*\};", "", content)

with open('src/context/ErpContext.tsx', 'w') as f:
    f.write(content)
