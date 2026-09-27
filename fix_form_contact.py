import re

with open('src/components/contacts/ContactFormPage.tsx', 'r') as f:
    content = f.read()

# Fix useEffect
content = content.replace("if (editingCustomer) {", "if (editingContact) {")
content = content.replace("}, [editingCustomer, customerGroups]);", "}, [editingContact, customerGroups]);")

# Replace handleSubmit entirely
submit_regex = r"const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?navigateToContacts\(\);\n\s*\};"

new_submit = """const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showFlashNotification('Please enter the contact full name.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedOpeningBal = parseFloat(openingBalance) || 0;
      const parsedAdvanceBal = parseFloat(advanceBalance) || 0;
      const parsedCreditLimit = parseFloat(creditLimit) || 0;

      const selectedGrp = customerGroups.find((g) => g.id === customerGroupId);
      const groupName = selectedGrp ? selectedGrp.name : 'Retail Customer';

      const baseData = {
        name: name.trim(),
        businessName: businessName.trim() || undefined,
        phone: phone.trim() || 'N/A',
        alternatePhone: alternatePhone.trim() || undefined,
        email: email.trim() || 'N/A',
        taxNumber: taxNumber.trim() || undefined,
        openingBalance: parsedOpeningBal,
        advanceBalance: parsedAdvanceBal,
        payTerm,
        address: address.trim() || 'N/A',
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        province: province.trim() || undefined,
        zipcode: zipcode.trim() || undefined,
        country: country.trim() || 'United States',
        notes: notes.trim() || undefined,
      };

      const contactId = editingContact?.id || `contact_${Date.now()}`;

      if (isEditMode) {
        if (contactType === 'customer' || contactType === 'both') {
          const customerData = {
            ...baseData,
            customerGroup: groupName,
            customerGroupId: customerGroupId,
            creditLimit: parsedCreditLimit,
          };
          if (customers.some(c => c.id === contactId)) {
            updateCustomer(contactId, customerData);
          } else {
            addCustomer({ ...customerData, id: contactId });
          }
        }
        
        if (contactType === 'supplier' || contactType === 'both') {
          if (suppliers.some(s => s.id === contactId)) {
            updateSupplier(contactId, baseData as any);
          } else {
            addSupplier({ ...(baseData as any), id: contactId });
          }
        }
        
        showFlashNotification(`Contact updated successfully`, 'success');
      } else {
        if (contactType === 'customer' || contactType === 'both') {
          const customerData = {
            ...baseData,
            customerGroup: groupName,
            customerGroupId: customerGroupId,
            creditLimit: parsedCreditLimit,
            id: contactId
          };
          addCustomer(customerData);
        }
        if (contactType === 'supplier' || contactType === 'both') {
          addSupplier({ ...(baseData as any), id: contactId });
        }
        showFlashNotification(`Contact added successfully`, 'success');
      }

      closeContactPage();
      navigateToContacts();
    } catch (err) {
      console.error('Error saving contact:', err);
      showFlashNotification('Error saving contact. Please check your inputs.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };"""

content = re.sub(submit_regex, new_submit, content)

# Check if `setIsSubmitting` is defined, if not, it was used previously so it should be there.
# Let's write the file.
with open('src/components/contacts/ContactFormPage.tsx', 'w') as f:
    f.write(content)
