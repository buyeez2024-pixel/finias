import re

with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

# 1. Update contactType state definition
content = content.replace("useState<'customer' | 'supplier' | 'both'>", "useState<'customer' | 'supplier' | 'both' | ''>")
content = content.replace("return 'customer';\n  });", "return '';\n  });")

# 2. Update the Customer Group block
group_block_regex = r"\{/\* Customer Group / Tier \*/\}[\s\S]*?</select>\s*</div>"
new_group_block = """{/* Customer Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Customer Type
              </label>
              <select
                id="select-customer-type"
                value={contactType}
                onChange={(e) => setContactType(e.target.value as any)}
                disabled={isEditMode}
                className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:border-indigo-500 focus:outline-none transition"
              >
                <option value="">Please select</option>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="both">Both</option>
              </select>
            </div>"""
content = re.sub(group_block_regex, new_group_block, content)

# 3. Add validation to handleSubmit
submit_validation = """
    if (!name.trim()) {
      showFlashNotification('Please enter the contact full name.', 'error');
      return;
    }

    if (!contactType) {
      showFlashNotification('Please select a Customer Type.', 'error');
      return;
    }
"""
content = re.sub(r"if \(!name\.trim\(\)\) \{[\s\S]*?return;\n\s*\}", submit_validation.strip(), content)

with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
