import re

with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

# 1. Add editingSupplier, suppliers, addSupplier, updateSupplier to useErp destructing
content = re.sub(
    r"const \{\s*customerGroups,\s*editingCustomer,\s*addCustomer,\s*updateCustomer,",
    "const {\n    customerGroups,\n    customers,\n    suppliers,\n    editingCustomer,\n    editingSupplier,\n    addCustomer,\n    updateCustomer,\n    addSupplier,\n    updateSupplier,",
    content
)

# 2. Modify isEditMode and add editingContact & contactType
replacement = """  const editingContact = editingCustomer || editingSupplier;
  const isEditMode = !!editingContact;
  
  const [contactType, setContactType] = useState<'customer' | 'supplier' | 'both'>(() => {
    if (editingCustomer && editingSupplier) return 'both';
    if (editingCustomer) {
      if (suppliers.some(s => s.id === editingCustomer.id)) return 'both';
      return 'customer';
    }
    if (editingSupplier) {
      if (customers.some(c => c.id === editingSupplier.id)) return 'both';
      return 'supplier';
    }
    return 'customer';
  });
"""
content = re.sub(r"const isEditMode = !!editingCustomer;", replacement, content)

# 3. Replace editingCustomer?. with editingContact?.
content = content.replace("editingCustomer?.name", "editingContact?.name")
content = content.replace("editingCustomer?.businessName", "(editingContact as any)?.businessName")
content = content.replace("editingCustomer?.customerGroupId", "(editingContact as any)?.customerGroupId")
content = content.replace("editingCustomer?.customerGroup", "(editingContact as any)?.customerGroup")
content = content.replace("editingCustomer?.phone", "editingContact?.phone")
content = content.replace("editingCustomer?.alternatePhone", "editingContact?.alternatePhone")
content = content.replace("editingCustomer?.email", "editingContact?.email")
content = content.replace("editingCustomer?.address", "editingContact?.address")
content = content.replace("editingCustomer?.city", "editingContact?.city")
content = content.replace("editingCustomer?.state", "editingContact?.state")
content = content.replace("editingCustomer?.province", "editingContact?.province")
content = content.replace("editingCustomer?.zipcode", "editingContact?.zipcode")
content = content.replace("editingCustomer?.country", "editingContact?.country")
content = content.replace("editingCustomer?.taxNumber", "editingContact?.taxNumber")
content = content.replace("editingCustomer?.gstin", "editingContact?.gstin")
content = content.replace("editingCustomer?.stateCode", "editingContact?.stateCode")
content = content.replace("editingCustomer?.openingBalance", "editingContact?.openingBalance")
content = content.replace("editingCustomer?.advanceBalance", "editingContact?.advanceBalance")
content = content.replace("editingCustomer?.creditLimit", "(editingContact as any)?.creditLimit")
content = content.replace("editingCustomer?.payTerm", "editingContact?.payTerm")
content = content.replace("editingCustomer?.notes", "editingContact?.notes")

# 4. In handleSave, use contactType
save_replacement = """  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone) {
      showFlashNotification('Name and Phone are required.', 'error');
      return;
    }

    const baseData = {
      name,
      businessName,
      email,
      phone,
      alternatePhone,
      address,
      city,
      state,
      province,
      zipcode,
      country,
      taxNumber,
      gstin,
      stateCode,
      openingBalance: Number(openingBalance) || 0,
      advanceBalance: Number(advanceBalance) || 0,
      payTerm,
      notes,
    };
    
    // We want to keep the same ID across both if 'both' is selected
    const contactId = editingContact?.id || `contact_${Date.now()}`;

    if (isEditMode) {
      if (contactType === 'customer' || contactType === 'both') {
        const customerData = {
          ...baseData,
          customerGroupId,
          customerGroup: customerGroups.find(g => g.id === customerGroupId)?.name,
          creditLimit: Number(creditLimit) || 0,
        };
        if (customers.some(c => c.id === contactId)) {
          updateCustomer(contactId, customerData);
        } else {
          addCustomer({ ...customerData, id: contactId });
        }
      } else {
        // If they switched from both/customer to supplier only, we might want to delete it from customers, but we'll just leave it or handle it.
      }
      
      if (contactType === 'supplier' || contactType === 'both') {
        if (suppliers.some(s => s.id === contactId)) {
          updateSupplier(contactId, baseData as any);
        } else {
          addSupplier({ ...(baseData as any), id: contactId });
        }
      }
      showFlashNotification(`Contact ${name} updated successfully`, 'success');
    } else {
      if (contactType === 'customer' || contactType === 'both') {
        const customerData = {
          ...baseData,
          customerGroupId,
          customerGroup: customerGroups.find(g => g.id === customerGroupId)?.name,
          creditLimit: Number(creditLimit) || 0,
          id: contactId
        };
        addCustomer(customerData);
      }
      if (contactType === 'supplier' || contactType === 'both') {
        addSupplier({ ...(baseData as any), id: contactId });
      }
      showFlashNotification(`Contact ${name} added successfully`, 'success');
    }

    closeContactPage();
  };
"""

content = re.sub(r"const handleSave = \(e: React\.FormEvent\) => \{[\s\S]*?closeContactPage\(\);\n\s*\};", save_replacement, content)

# 5. Add UI for Contact Type
type_ui = """
          {/* Contact Type */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Contact Type
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Type <span className="text-rose-500">*</span></label>
              <select
                value={contactType}
                onChange={(e) => setContactType(e.target.value as any)}
                disabled={isEditMode}
                className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none"
              >
                <option value="customer">Customer Only</option>
                <option value="supplier">Supplier Only</option>
                <option value="both">Both (Customer & Supplier)</option>
              </select>
              {isEditMode && <p className="text-xs text-slate-500 mt-2">Contact type cannot be changed while editing. Please create a new contact to change type.</p>}
            </div>
          </div>
          
"""
content = re.sub(r"(<div className=\"grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8\">\s*<!-- Left Column: Primary Info -->\s*<div className=\"xl:col-span-2 space-y-6 lg:space-y-8\">)", r"\1" + type_ui, content)


with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
