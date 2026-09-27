import re

with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

# Replace the Business Name div to be conditional
business_name_regex = r"(\{\/\* Business / Company Name \*\/}\s*<div>\s*<label className=\"block text-xs font-semibold text-slate-300 mb-1\.5\">\s*Business / Organization Name\s*<\/label>\s*<input[\s\S]*?<\/div>)"

def replacer(match):
    return f"{{(contactType === 'supplier' || contactType === 'both') && (\n            {match.group(1)}\n          )}}"

content = re.sub(business_name_regex, replacer, content)

with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
