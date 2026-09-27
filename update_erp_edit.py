import re

with open('src/context/ErpContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("handleSmartSetActiveTab('edit_customer');", "handleSmartSetActiveTab('edit_contact');")
content = content.replace("handleSmartSetActiveTab('edit_supplier');", "handleSmartSetActiveTab('edit_contact');")

with open('src/context/ErpContext.tsx', 'w') as f:
    f.write(content)
