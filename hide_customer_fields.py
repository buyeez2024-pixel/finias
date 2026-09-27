import re

with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

# Hide customer specific fields based on contactType
content = re.sub(
    r"(<div>\s*<label className=\"block text-xs font-semibold text-slate-400 mb-1\.5\">\s*Customer Group)",
    r"{(contactType === 'customer' || contactType === 'both') && (\n            \1",
    content
)
content = re.sub(
    r"(<option value=\"\">None</option>\s*</select>\s*</div>)",
    r"\1\n          )}",
    content
)

content = re.sub(
    r"(<div>\s*<label className=\"block text-xs font-semibold text-slate-400 mb-1\.5\">\s*Credit Limit)",
    r"{(contactType === 'customer' || contactType === 'both') && (\n            \1",
    content
)

content = re.sub(
    r"(placeholder=\"0\.00\"\s*/>\s*</div>)",
    r"\1\n          )}",
    content
)


with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
