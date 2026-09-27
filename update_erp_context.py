import re

with open('src/context/ErpContext.tsx', 'r') as f:
    content = f.read()

# Replace openAddCustomerPage / openAddSupplierPage with openAddContactPage
content = re.sub(r"openAddCustomerPage: \(\) => void;", "openAddContactPage: () => void;", content)
content = re.sub(r"openAddSupplierPage: \(\) => void;\n", "", content)

# In the context provider
content = re.sub(r"const openAddCustomerPage = \(\) => \{\n\s*setEditingCustomer\(null\);\n\s*handleSmartSetActiveTab\('add_customer'\);\n\s*\};", 
"""const openAddContactPage = () => {
    setEditingCustomer(null);
    setEditingSupplier(null);
    handleSmartSetActiveTab('add_contact');
  };""", content)
  
content = re.sub(r"const openAddSupplierPage = \(\) => \{\n\s*setEditingSupplier\(null\);\n\s*handleSmartSetActiveTab\('add_supplier'\);\n\s*\};\n", "", content)

# Update return values
content = re.sub(r"openAddCustomerPage,", "openAddContactPage,", content)
content = re.sub(r"openAddSupplierPage,\n", "", content)

with open('src/context/ErpContext.tsx', 'w') as f:
    f.write(content)
