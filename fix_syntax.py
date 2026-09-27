import re

with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

# Fix the JSX fragment wrapper issue
content = content.replace("{(contactType === 'supplier' || contactType === 'both') && (\n            {/* Business / Company Name */}\n            <div>", "{(contactType === 'supplier' || contactType === 'both') && (\n            <>\n            {/* Business / Company Name */}\n            <div>")

content = content.replace("              />\n            </div>\n          )}", "              />\n            </div>\n            </>\n          )}")

with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
