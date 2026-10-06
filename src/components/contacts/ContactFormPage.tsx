import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { Customer } from '../../types/erp';
import { formatCurrency, validateEmail } from '../../utils/formatters';
import {
  validatePhoneWithCountry,
  extractRawPhoneAndCountry,
  resolveCountryCodeFromContact,
  isDuplicatePhone,
  COUNTRY_CODES,
} from '../../utils/phoneValidation';
import { validateContactData } from '../../utils/validation';
import { FormFieldError } from '../common/FormFieldError';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  Receipt,
  DollarSign,
  MapPin,
  FileText,
  HelpCircle,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Award,
  Wallet
} from 'lucide-react';

export interface ContactFormPageProps {
  isModal?: boolean;
  initialType?: 'customer' | 'supplier' | 'both';
  onBack?: () => void;
  onSaved?: (contact: any) => void;
}

export const ContactFormPage: React.FC<ContactFormPageProps> = ({
  isModal = false,
  initialType,
  onBack,
  onSaved,
}) => {
  const {
    customerGroups,
    customers,
    suppliers,
    editingCustomer,
    editingSupplier,
    addCustomer,
    updateCustomer,
    addSupplier,
    updateSupplier,
    closeContactPage,
    navigateToContacts,
    showFlashNotification,
    settings,
    generateNextContactId,
  } = useErp();

  const isLight = settings?.themeMode === 'light';
  const editingContact = editingCustomer || editingSupplier;
  const isEditMode = !!editingContact;

  // Compute business default country dial code from system currency or settings
  const defaultFallbackCode = useMemo(() => {
    if (settings?.currencyCode === 'INR' || settings?.currencySymbol === '₹' || settings?.country?.toLowerCase() === 'india') {
      return '+91';
    }
    if (settings?.country) {
      const match = COUNTRY_CODES.find((c) => c.country.toLowerCase().includes(settings.country!.toLowerCase()));
      if (match) return match.code;
    }
    return '+1';
  }, [settings?.currencyCode, settings?.currencySymbol, settings?.country]);

  const [contactType, setContactType] = useState<'customer' | 'supplier' | 'both' | ''>(() => {
    if (editingCustomer && editingSupplier) return 'both';
    if (editingCustomer) {
      if (suppliers.some(s => s.id === editingCustomer.id)) return 'both';
      return 'customer';
    }
    if (editingSupplier) {
      if (customers.some(c => c.id === editingSupplier.id)) return 'both';
      return 'supplier';
    }
    if (initialType) return initialType;
    return 'customer';
  });

  const getCleanFieldValue = (val?: string) => {
    if (!val || val.trim().toUpperCase() === 'N/A') return '';
    return val;
  };

  // Form State
  const [name, setName] = useState(editingContact?.name || '');
  const [contactCustomId, setContactCustomId] = useState(() => {
    if ((editingContact as any)?.contactId) return (editingContact as any).contactId;
    if (editingContact?.id) return editingContact.id;
    if (settings.autoGenerateContactId !== false) {
      return generateNextContactId(contactType === 'supplier' ? 'supplier' : 'customer');
    }
    return '';
  });
  const [businessName, setBusinessName] = useState((editingContact as any)?.businessName || '');
  const [customerGroupId, setCustomerGroupId] = useState(
    (editingContact as any)?.customerGroupId ||
      ((editingContact as any)?.customerGroup
        ? customerGroups.find((g) => g.name.toLowerCase() === (editingContact as any)?.customerGroup?.toLowerCase())?.id
        : '') ||
      ''
  );

  const [countryCode, setCountryCode] = useState(() => {
    return (editingContact as any)?.countryCode || resolveCountryCodeFromContact(editingContact, defaultFallbackCode);
  });

  const [phone, setPhone] = useState(() => {
    if (!editingContact?.phone || editingContact.phone === 'N/A') return '';
    const cCode = (editingContact as any)?.countryCode || resolveCountryCodeFromContact(editingContact, defaultFallbackCode);
    const { rawPhone } = extractRawPhoneAndCountry(editingContact.phone, cCode);
    return rawPhone;
  });

  const [altCountryCode, setAltCountryCode] = useState(() => {
    if ((editingContact as any)?.altCountryCode) return (editingContact as any).altCountryCode;
    return (editingContact as any)?.countryCode || resolveCountryCodeFromContact(editingContact, defaultFallbackCode);
  });

  const [alternatePhone, setAlternatePhone] = useState(() => {
    if (!editingContact?.alternatePhone || editingContact.alternatePhone === 'N/A') return '';
    const defCode = (editingContact as any)?.altCountryCode || (editingContact as any)?.countryCode || resolveCountryCodeFromContact(editingContact, defaultFallbackCode);
    const { rawPhone } = extractRawPhoneAndCountry(editingContact.alternatePhone, defCode);
    return rawPhone;
  });

  const [email, setEmail] = useState(() => getCleanFieldValue(editingContact?.email));
  const [taxNumber, setTaxNumber] = useState(() => getCleanFieldValue(editingContact?.taxNumber));
  
  // Financial Fields
  const [openingBalance, setOpeningBalance] = useState(editingContact?.openingBalance?.toString() || '0');
  const [advanceBalance, setAdvanceBalance] = useState(editingContact?.advanceBalance?.toString() || '0');
  const [creditLimit, setCreditLimit] = useState((editingContact as any)?.creditLimit?.toString() || '1000.00');
  const [payTerm, setPayTerm] = useState(editingContact?.payTerm || 'Due on Receipt');

  // Address Details
  const [address, setAddress] = useState(() => getCleanFieldValue(editingContact?.address));
  const [city, setCity] = useState(() => getCleanFieldValue(editingContact?.city));
  const [state, setState] = useState(() => getCleanFieldValue(editingContact?.state));
  const [province, setProvince] = useState(() => getCleanFieldValue(editingContact?.province));
  const [zipcode, setZipcode] = useState(() => getCleanFieldValue(editingContact?.zipcode));
  const [country, setCountry] = useState(
    editingContact?.country || (defaultFallbackCode === '+91' ? 'India' : 'United States')
  );

  // Additional Information
  const [notes, setNotes] = useState(editingContact?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const lastContactIdRef = useRef<string | null>(editingContact?.id || null);

  const handleZipCodeLookup = async (zip: string) => {
    const cleanZip = zip.trim();
    if (!cleanZip) return;

    // Local Dictionary Match First for instant response
    const localDict: Record<string, { city: string; state: string; region: string; country: string }> = {
      '110001': { city: 'New Delhi', state: 'Delhi', region: 'Delhi NCR', country: 'India' },
      '400001': { city: 'Mumbai', state: 'Maharashtra', region: 'Mumbai South', country: 'India' },
      '560001': { city: 'Bengaluru', state: 'Karnataka', region: 'Bangalore East', country: 'India' },
      '600001': { city: 'Chennai', state: 'Tamil Nadu', region: 'Chennai Central', country: 'India' },
      '700001': { city: 'Kolkata', state: 'West Bengal', region: 'Kolkata North', country: 'India' },
      '517325': { city: 'Madanapalle', state: 'Andhra Pradesh', region: 'Annamayya', country: 'India' },
      '90210': { city: 'Beverly Hills', state: 'California', region: 'CA', country: 'United States' },
      '10001': { city: 'New York', state: 'New York', region: 'NY', country: 'United States' },
      '60601': { city: 'Chicago', state: 'Illinois', region: 'IL', country: 'United States' },
      '94101': { city: 'San Francisco', state: 'California', region: 'CA', country: 'United States' },
      '75001': { city: 'Paris', state: 'Île-de-France', region: 'IDF', country: 'France' },
    };

    if (localDict[cleanZip]) {
      const match = localDict[cleanZip];
      setCity(match.city);
      setState(match.state);
      setProvince(match.region);
      setCountry(match.country);
      return;
    }

    // Dynamic API Check for India Pincode (6 digits)
    if (/^\d{6}$/.test(cleanZip)) {
      setIsZipLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanZip}`);
        const data = await response.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
          const po = data[0].PostOffice[0];
          
          let blockName = po.Block || po.Name || '';
          if (blockName.toLowerCase().includes('madanapalle') || po.Name.toLowerCase().includes('madanapalle')) {
            blockName = 'Madanapalle';
          }
          
          let districtName = po.District || '';
          if (cleanZip === '517325' || blockName === 'Madanapalle' || po.Name === 'Madanapalle') {
            districtName = 'Annamayya';
            blockName = 'Madanapalle';
          }

          setCity(blockName || po.Name || '');
          setState(po.State || '');
          setProvince(districtName || '');
          setCountry(po.Country || 'India');
        }
      } catch (err) {
        console.error('Pincode API lookup error:', err);
      } finally {
        setIsZipLoading(false);
      }
      return;
    }

    // Dynamic API Check for US Zip Code (5 digits)
    if (/^\d{5}$/.test(cleanZip)) {
      setIsZipLoading(true);
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.places && data.places[0]) {
            const place = data.places[0];
            setCity(place['place name'] || '');
            setState(place['state'] || '');
            setProvince(place['state abbreviation'] || '');
            setCountry(data.country || 'United States');
          }
        }
      } catch (err) {
        console.error('US Zipcode API lookup error:', err);
      } finally {
        setIsZipLoading(false);
      }
      return;
    }
  };

  useEffect(() => {
    const contactId = editingContact?.id || null;
    if (contactId !== lastContactIdRef.current) {
      lastContactIdRef.current = contactId;
      if (editingContact) {
        setName((editingContact as any)?.name || '');
        setContactCustomId((editingContact as any)?.contactId || editingContact?.id || '');
        setBusinessName((editingContact as any)?.businessName || '');
        setCustomerGroupId(
          (editingContact as any)?.customerGroupId ||
            ((editingContact as any)?.customerGroup
              ? customerGroups.find((g) => g.name.toLowerCase() === (editingContact as any)?.customerGroup?.toLowerCase())?.id
              : '') ||
            ''
        );
        const resolvedCountryCode = (editingContact as any)?.countryCode || resolveCountryCodeFromContact(editingContact, defaultFallbackCode);
        const contactPhone = (editingContact as any)?.phone;
        const rawPhoneData = (!contactPhone || contactPhone === 'N/A')
          ? { rawPhone: '' }
          : extractRawPhoneAndCountry(contactPhone, resolvedCountryCode);
        setCountryCode(resolvedCountryCode);
        setPhone(rawPhoneData.rawPhone);

        const resolvedAltCountryCode = (editingContact as any)?.altCountryCode || (editingContact as any)?.countryCode || resolvedCountryCode;
        const contactAltPhone = (editingContact as any)?.alternatePhone;
        const rawAltData = (!contactAltPhone || contactAltPhone === 'N/A')
          ? { rawPhone: '' }
          : extractRawPhoneAndCountry(contactAltPhone, resolvedAltCountryCode);
        setAltCountryCode(resolvedAltCountryCode);
        setAlternatePhone(rawAltData.rawPhone);

        setEmail(getCleanFieldValue((editingContact as any)?.email));
        setTaxNumber(getCleanFieldValue((editingContact as any)?.taxNumber));
        setOpeningBalance((editingContact as any)?.openingBalance?.toString() || '0');
        setAdvanceBalance((editingContact as any)?.advanceBalance?.toString() || '0');
        setCreditLimit((editingContact as any)?.creditLimit?.toString() || '1000.00');
        setPayTerm((editingContact as any)?.payTerm || 'Due on Receipt');
        setAddress(getCleanFieldValue((editingContact as any)?.address));
        setCity(getCleanFieldValue((editingContact as any)?.city));
        setState(getCleanFieldValue((editingContact as any)?.state));
        setProvince(getCleanFieldValue((editingContact as any)?.province));
        setZipcode(getCleanFieldValue((editingContact as any)?.zipcode));
        setCountry(
          (editingContact as any)?.country || (resolvedCountryCode === '+91' ? 'India' : 'United States')
        );
        setNotes(getCleanFieldValue((editingContact as any)?.notes));
      } else if (settings.autoGenerateContactId !== false) {
        setContactCustomId(generateNextContactId(contactType === 'supplier' ? 'supplier' : 'customer'));
      }
    }
  }, [editingContact?.id, editingContact, defaultFallbackCode, customerGroups, contactType, settings.autoGenerateContactId, settings.customerPrefix, settings.supplierPrefix, generateNextContactId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Run strict schema validation (all address fields mandatory, GST mandatory for suppliers)
    const schemaRes = validateContactData({
      name,
      contactType,
      mobile: phone,
      countryCode,
      alternatePhone,
      altCountryCode,
      email: email.trim().toUpperCase() === 'N/A' || !email.trim() ? undefined : email.trim(),
      taxNumber,
      businessName,
      openingBalance,
      advanceBalance,
      creditLimit,
      address,
      addressLine1: address,
      city,
      province,
      state,
      country,
      zipcode,
      zipCode: zipcode,
      notes,
    });

    if (!schemaRes.isValid) {
      setFieldErrors(schemaRes.errors);
      showFlashNotification(schemaRes.firstError || 'Please fix the form errors before saving.', 'error');
      return;
    }

    if (!contactType) {
      setFieldErrors(prev => ({ ...prev, contactType: 'Please select a Customer Type.' }));
      showFlashNotification('Please select a Customer Type.', 'error');
      return;
    }

    if (!phone.trim()) {
      setFieldErrors(prev => ({ ...prev, mobile: 'Primary Phone Number is required.' }));
      showFlashNotification('Primary Phone Number is required.', 'error');
      return;
    }

    // Phone validation with country code
    if (phone.trim()) {
      const primaryPhoneVal = validatePhoneWithCountry(phone, countryCode);
      if (!primaryPhoneVal.isValid) {
        setFieldErrors(prev => ({ ...prev, mobile: primaryPhoneVal.error || 'Invalid phone number' }));
        showFlashNotification(`Primary Phone Error: ${primaryPhoneVal.error}`, 'error');
        return;
      }
    }

    if (alternatePhone.trim()) {
      const altPhoneVal = validatePhoneWithCountry(alternatePhone, altCountryCode);
      if (!altPhoneVal.isValid) {
        setFieldErrors(prev => ({ ...prev, alternatePhone: altPhoneVal.error || 'Invalid alternate phone' }));
        showFlashNotification(`Alternate Phone Error: ${altPhoneVal.error}`, 'error');
        return;
      }
    }

    // Duplicate Phone check
    const currentId = editingContact?.id;
    if (phone.trim()) {
      const phoneExists = customers.some(c => c.id !== currentId && c.phone && isDuplicatePhone(c.phone, phone)) ||
                          suppliers.some(s => s.id !== currentId && s.phone && isDuplicatePhone(s.phone, phone));
      if (phoneExists) {
        setFieldErrors(prev => ({ ...prev, mobile: 'Mobile number is already registered under another contact' }));
        showFlashNotification('Mobile number is already registered under another contact', 'error');
        return;
      }
    }

    // Email format validation & Duplicate Email check
    if (email.trim() && email.trim().toUpperCase() !== 'N/A') {
      if (!validateEmail(email)) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address with a proper domain (e.g. name@mail.com).' }));
        showFlashNotification('Please enter a valid email address with a proper domain (e.g. name@mail.com).', 'error');
        return;
      }
      const emailClean = email.trim().toLowerCase();
      const emailExists = customers.some(c => c.id !== currentId && c.email?.trim().toLowerCase() === emailClean) ||
                          suppliers.some(s => s.id !== currentId && s.email?.trim().toLowerCase() === emailClean);
      if (emailExists) {
        setFieldErrors(prev => ({ ...prev, email: 'Email is already registered under another contact' }));
        showFlashNotification('Email is already registered under another contact', 'error');
        return;
      }
    }

    // GST / TAX Number unique check across all companies (customers & suppliers)
    if (taxNumber && taxNumber.trim()) {
      const cleanTax = taxNumber.trim().toLowerCase();
      const dupCustomer = customers.find(c => c.id !== currentId && c.taxNumber && c.taxNumber.trim().toLowerCase() === cleanTax);
      const dupSupplier = suppliers.find(s => s.id !== currentId && s.taxNumber && s.taxNumber.trim().toLowerCase() === cleanTax);
      if (dupCustomer || dupSupplier) {
        const conflictingCompany = dupCustomer
          ? (dupCustomer.businessName || dupCustomer.name)
          : (dupSupplier!.businessName || dupSupplier!.name);
        const errMsg = `GST / TAX Number "${taxNumber.trim()}" is already registered to "${conflictingCompany}". No two companies can share the same GST / TAX Number.`;
        setFieldErrors(prev => ({ ...prev, taxNumber: errMsg }));
        showFlashNotification(errMsg, 'error');
        return;
      }
    }

    // Opening Balance non-negative check
    if (openingBalance !== undefined && openingBalance !== '') {
      const parsedOpening = parseFloat(openingBalance);
      if (isNaN(parsedOpening) || parsedOpening < 0) {
        setFieldErrors(prev => ({ ...prev, openingBalance: 'Opening balance cannot be negative. Must be 0 or greater.' }));
        showFlashNotification('Opening balance cannot be negative. Must be 0 or greater.', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const parsedOpeningBal = parseFloat(openingBalance) || 0;
      const parsedAdvanceBal = parseFloat(advanceBalance) || 0;
      const parsedCreditLimit = parseFloat(creditLimit) || 0;

      const selectedGrp = customerGroups.find((g) => g.id === customerGroupId);
      const groupName = selectedGrp ? selectedGrp.name : '';
      const finalGroupId = selectedGrp ? selectedGrp.id : undefined;

      const finalCustomId = contactCustomId.trim() || undefined;

      const cleanPhone = phone.trim().replace(/^\+\d+\s*/, '');
      const cleanAltPhone = alternatePhone.trim().replace(/^\+\d+\s*/, '');
      const finalFormattedPhone = cleanPhone ? `${countryCode} ${cleanPhone}` : 'N/A';
      const finalFormattedAltPhone = cleanAltPhone ? `${altCountryCode} ${cleanAltPhone}` : undefined;

      const baseData = {
        name: name.trim(),
        contactId: finalCustomId,
        businessName: businessName.trim() || undefined,
        phone: finalFormattedPhone,
        countryCode: countryCode || defaultFallbackCode,
        alternatePhone: finalFormattedAltPhone,
        altCountryCode: altCountryCode || defaultFallbackCode,
        email: email.trim() && email.trim().toUpperCase() !== 'N/A' ? email.trim() : '',
        taxNumber: taxNumber.trim() || undefined,
        openingBalance: parsedOpeningBal,
        advanceBalance: parsedAdvanceBal,
        payTerm,
        address: address.trim() || '',
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        province: province.trim() || state.trim() || undefined,
        zipcode: zipcode.trim() || undefined,
        country: country.trim() || (countryCode === '+91' ? 'India' : 'United States'),
        notes: notes.trim() || undefined,
      };

      const contactId = editingContact?.id || `contact_${Date.now()}`;

      let savedObj: any = null;

      if (isEditMode) {
        if (contactType === 'customer' || contactType === 'both') {
          const customerData = {
            ...baseData,
            customerGroup: groupName || undefined,
            customerGroupId: finalGroupId,
            creditLimit: parsedCreditLimit,
          };
          if (customers.some(c => c.id === contactId)) {
            updateCustomer(contactId, customerData);
            savedObj = { ...customerData, id: contactId };
          } else {
            savedObj = addCustomer({ ...customerData, id: contactId });
          }
        }
        
        if (contactType === 'supplier' || contactType === 'both') {
          if (suppliers.some(s => s.id === contactId)) {
            updateSupplier(contactId, baseData as any);
            savedObj = { ...baseData, id: contactId };
          } else {
            savedObj = addSupplier({ ...(baseData as any), id: contactId });
          }
        }
        
        showFlashNotification(`Contact updated successfully`, 'success');
      } else {
        if (contactType === 'customer' || contactType === 'both') {
          const customerData = {
            ...baseData,
            customerGroup: groupName || undefined,
            customerGroupId: finalGroupId,
            creditLimit: parsedCreditLimit,
            id: contactId
          };
          savedObj = addCustomer(customerData);
        }
        if (contactType === 'supplier' || contactType === 'both') {
          savedObj = addSupplier({ ...(baseData as any), id: contactId });
        }
        showFlashNotification(`Contact added successfully`, 'success');
      }

      if (onSaved) {
        onSaved(savedObj || { ...baseData, id: contactId });
      } else if (onBack && isModal) {
        onBack();
      } else {
        closeContactPage();
      }
    } catch (err: any) {
      console.error('Error saving contact:', err);
      showFlashNotification(err?.message || 'Error saving contact. Please check your inputs.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = settings.currencySymbol || '$';

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn min-w-0 overflow-x-hidden ${isModal ? 'p-0 pb-6' : 'p-2.5 sm:p-6 lg:p-8 pb-36 sm:pb-28'}`}>
      {/* Top Header & Breadcrumbs */}
      <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0 overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack || closeContactPage}
            id="btn-back-to-customers"
            className={`transition shrink-0 cursor-pointer ${
              isLight
                ? 'p-1.5 rounded-lg border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'p-2 rounded-xl border bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 shadow-xs'
            }`}
            title="Back to Contact Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate">
              <span className="text-indigo-500 shrink-0">Contacts</span>
              <span className="text-slate-400 shrink-0">/</span>
              <span className={`shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{contactType === 'supplier' ? 'Suppliers' : 'Customers'}</span>
              <span className="text-slate-400 shrink-0">/</span>
              <span className={`truncate font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {isEditMode ? 'Edit Profile' : contactType === 'supplier' ? 'New Supplier' : 'New Contact'}
              </span>
            </div>
            <h1 className={`text-base sm:text-2xl font-bold tracking-tight flex items-center gap-2 mt-0.5 min-w-0 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 shrink-0" />
              <span className="truncate">
                {isEditMode
                  ? `Edit ${contactType === 'supplier' ? 'Supplier' : 'Customer'}: ${(editingContact as any)?.name}`
                  : contactType === 'supplier'
                  ? 'Add New Supplier'
                  : 'Add New Contact'}
              </span>
            </h1>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className={`flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 shrink-0 min-w-0 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <button
            type="button"
            onClick={closeContactPage}
            id="btn-cancel-customer-form"
            className={`flex-1 sm:flex-initial px-3 sm:px-4 text-xs font-bold transition text-center cursor-pointer truncate ${
              isLight
                ? 'p-1.5 rounded-lg border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'py-2.5 rounded-xl border bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            id="btn-save-customer"
            className="flex-[1.5] sm:flex-initial px-3.5 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 truncate min-w-0"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {isEditMode
                ? contactType === 'supplier' ? 'Update Supplier' : 'Update Customer'
                : contactType === 'supplier' ? 'Save Supplier' : 'Save Customer'}
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Section 1: Primary Identification */}
        <div className={`p-3.5 sm:p-6 rounded-2xl border shadow-xs space-y-4 w-full min-w-0 overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center gap-2.5 pb-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>Basic & Contact Information</h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Essential identification and communication details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
            {/* Customer Full Name */}
            <div className="lg:col-span-1">
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                id="input-customer-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Johnathan Doe"
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                  fieldErrors.name
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                }`}
              />
              <FormFieldError error={fieldErrors.name} />
            </div>

            {(contactType === 'supplier' || contactType === 'both') && (
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Business / Organization Name
                </label>
                <input
                  type="text"
                  id="input-customer-business"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (fieldErrors.businessName) setFieldErrors(prev => ({ ...prev, businessName: '' }));
                  }}
                  placeholder="e.g. Doe Enterprises Inc."
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                    fieldErrors.businessName
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <FormFieldError error={fieldErrors.businessName} />
              </div>
            )}

            {/* Customer Type */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Contact Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-customer-type"
                value={contactType}
                onChange={(e) => {
                  setContactType(e.target.value as any);
                  if (fieldErrors.contactType) setFieldErrors(prev => ({ ...prev, contactType: '' }));
                }}
                disabled={isEditMode}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                  fieldErrors.contactType
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100'
                }`}
              >
                <option value="">Please select</option>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="both">Both (Customer & Supplier)</option>
              </select>
              <FormFieldError error={fieldErrors.contactType} />
            </div>

            {/* Customer Group (Pricing Strategy) */}
            {contactType !== 'supplier' && (
              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <span>Customer Group</span>
                  {customerGroupId && (
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      {(() => {
                        const g = customerGroups.find((grp) => grp.id === customerGroupId);
                        const p = g?.calculationPercentage ?? g?.percentage ?? 0;
                        return p > 0 ? `+${p}% Mark-up` : p < 0 ? `${p}% Discount` : '0% Standard';
                      })()}
                    </span>
                  )}
                </label>
                <select
                  value={customerGroupId}
                  onChange={(e) => setCustomerGroupId(e.target.value)}
                  id="select-customer-group"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700/80 text-slate-100'
                  }`}
                >
                  <option value="">None / Standard Pricing (No Group Discount)</option>
                  {customerGroups.map((g) => {
                    const p = g.calculationPercentage ?? g.percentage ?? 0;
                    const badge = p > 0 ? `+${p}%` : `${p}%`;
                    return (
                      <option key={g.id} value={g.id}>
                        {g.name} ({badge} {p < 0 ? 'Discount' : p > 0 ? 'Mark-up' : ''})
                      </option>
                    );
                  })}
                </select>
                <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Optional: Select a group for automatic pricing adjustments at POS/Checkout. Leave as &quot;None&quot; for standard retail price.
                </p>
              </div>
            )}

            {/* Contact ID */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Contact ID</span>
                {(settings.autoGenerateContactId ?? true) && (
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-normal font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    Auto-generated
                  </span>
                )}
              </label>
              <input
                type="text"
                id="input-contact-id"
                value={contactCustomId}
                onChange={(e) => setContactCustomId(e.target.value)}
                placeholder={
                  (settings.autoGenerateContactId ?? true)
                    ? (contactType === 'supplier' ? (settings.supplierPrefix || 'SUP-') + '0001' : (settings.customerPrefix || 'CUST-') + '0001')
                    : 'e.g. CUST-0001'
                }
                className={`w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100'
                }`}
              />
            </div>

            {/* Phone Number */}
            <div>
              <PhoneInputWithCountry
                label="Primary Phone Number"
                id="input-customer-phone"
                phoneValue={phone}
                countryCode={countryCode}
                onChangePhone={(val) => {
                  setPhone(val);
                  if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: '' }));
                }}
                onChangeCountryCode={(code) => {
                  setCountryCode(code);
                  if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: '' }));
                  const cfg = COUNTRY_CODES.find(c => c.code === code);
                  if (cfg) {
                    if (code === '+91') setCountry('India');
                    else if (code === '+1') setCountry('United States');
                    else if (code === '+44') setCountry('United Kingdom');
                    else if (code === '+61') setCountry('Australia');
                    else if (code === '+971') setCountry('UAE');
                    else if (code === '+966') setCountry('Saudi Arabia');
                    else if (code === '+92') setCountry('Pakistan');
                    else if (code === '+880') setCountry('Bangladesh');
                    else if (code === '+60') setCountry('Malaysia');
                    else if (code === '+65') setCountry('Singapore');
                    else if (code === '+49') setCountry('Germany');
                    else if (code === '+33') setCountry('France');
                    else if (code === '+27') setCountry('South Africa');
                    else if (code === '+234') setCountry('Nigeria');
                    else setCountry(cfg.country);
                  }
                }}
                showHint={true}
                required={true}
              />
              <FormFieldError error={fieldErrors.mobile} />
              {phone.trim() && (customers.some(c => c.id !== editingContact?.id && c.phone && isDuplicatePhone(c.phone, phone)) || suppliers.some(s => s.id !== editingContact?.id && s.phone && isDuplicatePhone(s.phone, phone))) && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  Mobile number is already registered under another contact
                </p>
              )}
            </div>

            {/* Alternate Phone */}
            <div>
              <PhoneInputWithCountry
                label="Alternate Contact Phone"
                id="input-customer-alt-phone"
                phoneValue={alternatePhone}
                countryCode={altCountryCode}
                onChangePhone={(val) => {
                  setAlternatePhone(val);
                  if (fieldErrors.alternatePhone) setFieldErrors(prev => ({ ...prev, alternatePhone: '' }));
                }}
                onChangeCountryCode={(code) => {
                  setAltCountryCode(code);
                  if (fieldErrors.alternatePhone) setFieldErrors(prev => ({ ...prev, alternatePhone: '' }));
                }}
                showHint={true}
              />
              <FormFieldError error={fieldErrors.alternatePhone} />
            </div>

            {/* Email Address */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                id="input-customer-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="e.g. contact@doe-enterprises.com"
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition font-mono ${
                  fieldErrors.email
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                }`}
              />
              <FormFieldError error={fieldErrors.email} />
              {email.trim() && email.trim() !== 'N/A' && (customers.some(c => c.id !== editingContact?.id && c.email?.trim().toLowerCase() === email.trim().toLowerCase()) || suppliers.some(s => s.id !== editingContact?.id && s.email?.trim().toLowerCase() === email.trim().toLowerCase())) && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  Email is already registered under another contact
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Tax & Financial Ledger */}
        <div className={`p-4 sm:p-6 rounded-2xl border shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center gap-2.5 pb-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>Tax & Ledger Balances</h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Opening balances, advance deposits, credit limits, and taxation details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
            {/* GST / TAX Number */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span className="flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  <span>GST / TAX Number</span>
                  {(contactType === 'supplier' || contactType === 'both') && (
                    <span className="text-rose-500 font-bold">*</span>
                  )}
                </span>
                {(contactType === 'supplier' || contactType === 'both') ? (
                  <span className="text-[10px] text-rose-500 font-bold">Required for Supplier</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                )}
              </label>
              <input
                type="text"
                id="input-customer-tax"
                required={contactType === 'supplier' || contactType === 'both'}
                value={taxNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setTaxNumber(val);
                  if (fieldErrors.taxNumber) setFieldErrors(prev => ({ ...prev, taxNumber: '' }));
                  if (val.trim()) {
                    const clean = val.trim().toLowerCase();
                    const currentId = editingContact?.id;
                    const dupCust = customers.find(c => c.id !== currentId && c.taxNumber && c.taxNumber.trim().toLowerCase() === clean);
                    const dupSupp = suppliers.find(s => s.id !== currentId && s.taxNumber && s.taxNumber.trim().toLowerCase() === clean);
                    if (dupCust || dupSupp) {
                      const conflict = dupCust ? (dupCust.businessName || dupCust.name) : (dupSupp!.businessName || dupSupp!.name);
                      setFieldErrors(prev => ({
                        ...prev,
                        taxNumber: `GST / TAX Number "${val.trim()}" is already registered to "${conflict}". Numbers must be unique.`
                      }));
                    }
                  }
                }}
                onBlur={() => {
                  if (taxNumber.trim()) {
                    const clean = taxNumber.trim().toLowerCase();
                    const currentId = editingContact?.id;
                    const dupCust = customers.find(c => c.id !== currentId && c.taxNumber && c.taxNumber.trim().toLowerCase() === clean);
                    const dupSupp = suppliers.find(s => s.id !== currentId && s.taxNumber && s.taxNumber.trim().toLowerCase() === clean);
                    if (dupCust || dupSupp) {
                      const conflict = dupCust ? (dupCust.businessName || dupCust.name) : (dupSupp!.businessName || dupSupp!.name);
                      setFieldErrors(prev => ({
                        ...prev,
                        taxNumber: `GST / TAX Number is already registered to "${conflict}". Each company must have a unique GST / TAX Number.`
                      }));
                    }
                  }
                }}
                placeholder="e.g. GSTIN27AABCU9603R1ZM"
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition uppercase font-mono ${
                  fieldErrors.taxNumber
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                }`}
              />
              <FormFieldError error={fieldErrors.taxNumber} />
              <p className="text-[10px] text-slate-400 mt-1">
                {(contactType === 'supplier' || contactType === 'both')
                  ? 'Mandatory unique government tax & GST registration identifier for suppliers'
                  : 'Unique tax identifier for B2B company contact invoice generation'}
              </p>
            </div>

            {/* Opening Balance */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Opening Balance ({currencySymbol})</span>
                <span className="text-[10px] text-amber-500 font-bold">Non-negative (≥ 0)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                id="input-customer-opening-balance"
                value={openingBalance}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setOpeningBalance(val);
                  if (val !== '' && parseFloat(val) < 0) {
                    setFieldErrors(prev => ({ ...prev, openingBalance: 'Opening balance cannot be negative. Must be 0 or greater.' }));
                  } else {
                    if (fieldErrors.openingBalance) setFieldErrors(prev => ({ ...prev, openingBalance: '' }));
                  }
                }}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none font-mono ${
                  fieldErrors.openingBalance
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100'
                }`}
              />
              <FormFieldError error={fieldErrors.openingBalance} />
              <div className="flex items-start gap-1 mt-1 text-[10px] text-slate-400 leading-tight">
                <HelpCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span>Any previous balance owed before system setup (must be 0 or positive).</span>
              </div>
            </div>

            {/* Advance Balance */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Advance Balance ({currencySymbol})</span>
                <span className="text-[10px] text-emerald-500 font-bold">Prepaid</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="input-customer-advance-balance"
                value={advanceBalance}
                onChange={(e) => {
                  setAdvanceBalance(e.target.value);
                  if (fieldErrors.advanceBalance) setFieldErrors(prev => ({ ...prev, advanceBalance: '' }));
                }}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none font-mono ${
                  fieldErrors.advanceBalance
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100'
                }`}
              />
              <FormFieldError error={fieldErrors.advanceBalance} />
              <div className="flex items-start gap-1 mt-1 text-[10px] text-slate-400 leading-tight">
                <HelpCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span>Advance money deposited by contact.</span>
              </div>
            </div>

            {/* Credit Limit */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span>Credit Limit ({currencySymbol})</span>
                <span className="text-[10px] text-indigo-500 font-bold">Max Ceiling</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="input-customer-credit-limit"
                value={creditLimit}
                onChange={(e) => {
                  setCreditLimit(e.target.value);
                  if (fieldErrors.creditLimit) setFieldErrors(prev => ({ ...prev, creditLimit: '' }));
                }}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none font-mono ${
                  fieldErrors.creditLimit
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100'
                }`}
              />
              <FormFieldError error={fieldErrors.creditLimit} />
              <p className="text-[10px] text-slate-400 mt-1">Maximum allowed credit for deferred orders</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Payment Terms
              </label>
              <select
                id="select-customer-payterm"
                value={payTerm}
                onChange={(e) => setPayTerm(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100'
                }`}
              >
                <option value="Due on Receipt">Due on Receipt (Immediate)</option>
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>

            {/* Financial Summary Card - Mobile Friendly Grid */}
            <div className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 sm:bg-transparent sm:border-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Starting Due</span>
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {formatCurrency(parseFloat(openingBalance || '0'), settings)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 sm:bg-transparent sm:border-0 sm:border-l sm:border-slate-200 sm:dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Advance Deposit</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(parseFloat(advanceBalance || '0'), settings)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 sm:bg-transparent sm:border-0 sm:border-l sm:border-slate-200 sm:dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Credit Limit</span>
                <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(parseFloat(creditLimit || '0'), settings)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Address & Location Details */}
        <div className={`p-4 sm:p-6 rounded-2xl border shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center gap-2.5 pb-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500 border border-sky-500/20 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <div>
                <h2 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Address & Geographical Details <span className="text-rose-500 font-bold">*</span>
                </h2>
                <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  All geographical and physical street address fields are mandatory
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                All Fields Mandatory
              </span>
            </div>
          </div>

          <div className="space-y-3.5 sm:space-y-4 pt-1">
            {/* Street Address */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                id="input-customer-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: '' }));
                }}
                placeholder="e.g. 742 Evergreen Terrace, Suite 400"
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                  fieldErrors.address
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                }`}
              />
              <FormFieldError error={fieldErrors.address} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {/* Zip / Postal Code */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <span>Zip / Postal Code <span className="text-rose-500">*</span></span>
                  {isZipLoading && (
                    <span className="text-[10px] text-indigo-500 animate-pulse font-medium">Fetching...</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  id="input-customer-zipcode"
                  value={zipcode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setZipcode(val);
                    if (fieldErrors.zipcode) setFieldErrors(prev => ({ ...prev, zipcode: '' }));
                    const cleanZip = val.trim();
                    if (cleanZip.length === 5 || cleanZip.length === 6) {
                      handleZipCodeLookup(cleanZip);
                    }
                  }}
                  placeholder="e.g. 62701 or 517325"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none font-mono transition ${
                    fieldErrors.zipcode
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <FormFieldError error={fieldErrors.zipcode} />
              </div>

              {/* City */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-customer-city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: '' }));
                  }}
                  placeholder="e.g. Springfield"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                    fieldErrors.city
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <FormFieldError error={fieldErrors.city} />
              </div>

              {/* Province / District */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Province / District <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-customer-province"
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    if (fieldErrors.province) setFieldErrors(prev => ({ ...prev, province: '' }));
                  }}
                  placeholder="e.g. Sangamon County / Central"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                    fieldErrors.province
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <FormFieldError error={fieldErrors.province} />
              </div>

              {/* State / Region */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-customer-state"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    if (fieldErrors.state) setFieldErrors(prev => ({ ...prev, state: '' }));
                  }}
                  placeholder="e.g. Illinois"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                    fieldErrors.state
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <FormFieldError error={fieldErrors.state} />
              </div>

              {/* Country */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-customer-country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    if (fieldErrors.country) setFieldErrors(prev => ({ ...prev, country: '' }));
                  }}
                  placeholder="e.g. United States / India"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                    fieldErrors.country
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <FormFieldError error={fieldErrors.country} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Notes & Remarks */}
        <div className={`p-4 sm:p-6 rounded-2xl border shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center gap-2.5 pb-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 border border-purple-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>Additional Notes & Remarks</h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Internal remarks, shipping instructions, or customer preferences</p>
            </div>
          </div>

          <div>
            <textarea
              id="textarea-customer-notes"
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (fieldErrors.notes) setFieldErrors(prev => ({ ...prev, notes: '' }));
              }}
              placeholder="Add internal remarks, special instructions, tax exemption IDs, or contact preferences..."
              className={`w-full text-xs p-3.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition resize-none ${
                fieldErrors.notes
                  ? 'border-red-500 ring-1 ring-red-500/20'
                  : isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500'
              }`}
            />
            <FormFieldError error={fieldErrors.notes} />
          </div>
        </div>

        {/* Bottom Actions Bar (Desktop & Tablet) */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={closeContactPage}
            className={`w-full sm:w-auto px-5 text-xs font-bold transition text-center cursor-pointer ${
              isLight
                ? 'p-1.5 rounded-lg border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'py-2.5 rounded-xl border bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            Cancel & Return
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isEditMode
                ? contactType === 'supplier' ? 'Update Supplier Profile' : 'Update Customer Profile'
                : contactType === 'supplier' ? 'Save Supplier Profile' : 'Save Customer Profile'}
            </span>
          </button>
        </div>

        {/* Sticky Mobile Bottom Floating Save Bar (< lg) */}
        <div className={`lg:hidden fixed bottom-14 left-0 right-0 z-30 p-2.5 border-t backdrop-blur-md flex items-center gap-2 shadow-2xl ${
          isLight ? 'bg-white/95 border-slate-200 shadow-slate-300/80' : 'bg-slate-950/95 border-slate-800 shadow-black/90'
        }`}>
          <button
            type="button"
            onClick={closeContactPage}
            className={`flex-1 px-3 text-xs font-bold transition text-center cursor-pointer ${
              isLight
                ? 'p-1.5 rounded-lg border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                : 'py-2.5 rounded-xl border bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[1.6] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {isEditMode
                ? contactType === 'supplier' ? 'Update Supplier' : 'Update Customer'
                : contactType === 'supplier' ? 'Save Supplier' : 'Save Customer'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
