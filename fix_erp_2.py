import re

with open('src/context/ErpContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("openAddCustomerPage()", "openAddContactPage()")
content = content.replace("if (subTab === 'add_supplier') {", "if (subTab === 'add_supplier') {\n      openAddContactPage();\n      return;\n    }\n    if (False) {")
content = content.replace("openAddSupplierPage();", "//openAddSupplierPage();")

with open('src/context/ErpContext.tsx', 'w') as f:
    f.write(content)
