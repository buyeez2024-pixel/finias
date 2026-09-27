with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("{(contactType === 'supplier' || contactType === 'both') && (\n            {(contactType === 'supplier' || contactType === 'both') && (\n            {/* Business / Company Name */}", "{(contactType === 'supplier' || contactType === 'both') && (\n            {/* Business / Company Name */}")

content = content.replace("          )}\n          )}", "          )}")

with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
