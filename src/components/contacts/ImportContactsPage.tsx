import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useErp } from '../../context/ErpContext';
import { Customer, Supplier } from '../../types/erp';
import { isDuplicatePhone, resolveCountryCodeFromContact, extractRawPhoneAndCountry, COUNTRY_CODES } from '../../utils/phoneValidation';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  Truck,
  Info,
  X,
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ParsedContactRow {
  id: string;
  selected: boolean;
  name: string;
  contactType?: 'customer' | 'supplier' | 'both';
  businessName?: string;
  customerGroup?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  taxNumber?: string;
  openingBalance?: number;
  creditLimit?: number;
  payTerm?: string;
  notes?: string;
  isValid: boolean;
  validationError?: string;
  alreadyExists?: boolean;
  duplicateReason?: string;
  raw: Record<string, any>;
}

export const ImportContactsPage: React.FC = () => {
  const {
    customers,
    suppliers,
    importCustomers,
    importSuppliers,
    customerGroups,
    navigateToContacts,
    showFlashNotification,
    settings,
  } = useErp();

  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedContactRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Template Data Generator
  const generateUnifiedTemplateData = () => {
    const headers = [
      'Name',
      'Business Name',
      'Contact Type', // 'customer' or 'supplier' or 'both'
      'Customer Group',
      'Email',
      'Phone',
      'Alternate Phone',
      'Address',
      'City',
      'State',
      'Zipcode',
      'Country',
      'Tax Number / GSTIN',
      'Opening Balance',
      'Credit Limit',
      'Pay Term',
      'Notes',
    ];

    const sampleRows = [
      [
        'John Doe',
        'Doe Retail Enterprises',
        'customer',
        'Retail Customer',
        'john.doe@example.com',
        '+1 555-0199',
        '+1 555-0198',
        '100 Main Street, Suite 400',
        'New York',
        'NY',
        '10001',
        'United States',
        'US987654321',
        '250.00',
        '5000.00',
        '30 Days',
        'Key VIP retail client',
      ],
      [
        'Sarah Smith',
        'Apex Wholesale Ltd',
        'customer',
        'Wholesale Client',
        'sarah@apexwholesale.com',
        '+1 555-0288',
        '',
        '75 Industrial Parkway',
        'Chicago',
        'IL',
        '60601',
        'United States',
        'US123456789',
        '0.00',
        '10000.00',
        '15 Days',
        'Bulk buyer for electronics',
      ],
      [
        'Global Tech Logistics',
        'Global Tech Suppliers Inc.',
        'supplier',
        '',
        'sales@globaltechlogistics.com',
        '+1 800-555-0144',
        '+1 800-555-0145',
        '500 Technology Drive',
        'San Jose',
        'CA',
        '95110',
        'United States',
        'US555123987',
        '1200.00',
        '',
        '30 Days',
        'Primary hardware and chip vendor',
      ],
      [
        'Pacific Wholesale Foods',
        'Pacific Goods Co',
        'supplier',
        '',
        'orders@pacificwholesale.com',
        '+1 800-555-0299',
        '',
        '120 Harbor View Way',
        'Seattle',
        'WA',
        '98101',
        'United States',
        'US444987123',
        '0.00',
        '',
        '15 Days',
        'Organic beans and specialty coffee supplier',
      ],
    ];

    return [headers, ...sampleRows];
  };

  // Download Unified Sample Template File
  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = generateUnifiedTemplateData();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths for nice appearance
    const cols = data[0].map(() => ({ wch: 22 }));
    worksheet['!cols'] = cols;

    const workbook = XLSX.utils.book_new();
    const sheetName = 'Contact Import Template';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const fileName = `contacts_import_template.${format}`;
    if (format === 'xlsx') {
      XLSX.writeFile(workbook, fileName);
    } else {
      XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
    }

    showFlashNotification(`Downloaded contacts ${format.toUpperCase()} template file.`, 'info');
  };

  // Process File Parsing
  const processWorkbook = (wb: XLSX.WorkBook, sheetNameToParse?: string) => {
    const nameToUse = sheetNameToParse || wb.SheetNames[0];
    setSelectedSheet(nameToUse);

    const worksheet = wb.Sheets[nameToUse];
    if (!worksheet) return;

    // Convert worksheet to JSON rows with header objects
    const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawJson || rawJson.length === 0) {
      setParsedRows([]);
      showFlashNotification('The uploaded file is empty or missing data rows.', 'error');
      return;
    }

    // Map rows flexibly
    const parsed: ParsedContactRow[] = rawJson.map((row, index) => {
      // Find key matching helpers
      const findVal = (...aliases: string[]): string => {
        for (const alias of aliases) {
          const matchedKey = Object.keys(row).find(
            (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
            return String(row[matchedKey]).trim();
          }
        }
        return '';
      };

      const name = findVal('Name', 'Contact Name', 'Customer Name', 'Supplier Name', 'Full Name');
      const businessName = findVal('Business Name', 'Company Name', 'Company', 'Organization', 'Business');
      const contactTypeRaw = findVal('Contact Type', 'Type', 'Category').toLowerCase().trim();

      let finalContactType: 'customer' | 'supplier' | 'both' = 'customer';
      if (contactTypeRaw.includes('supplier')) {
        finalContactType = 'supplier';
      } else if (contactTypeRaw.includes('both')) {
        finalContactType = 'both';
      } else if (contactTypeRaw.includes('customer')) {
        finalContactType = 'customer';
      }

      const customerGroup = findVal('Customer Group', 'Group', 'Pricing Group');
      const email = findVal('Email', 'Email Address', 'E-mail');
      const phone = findVal('Phone', 'Phone Number', 'Mobile', 'Mobile Number', 'Contact Number', 'Telephone');
      const alternatePhone = findVal('Alternate Phone', 'Alt Phone', 'Secondary Phone');
      const address = findVal('Address', 'Street', 'Street Address');
      const city = findVal('City', 'Town');
      const state = findVal('State', 'Province');
      const zipcode = findVal('Zipcode', 'Zip Code', 'Zip', 'Postal Code', 'Pincode');
      const country = findVal('Country');
      const taxNumber = findVal('Tax Number / GSTIN', 'Tax Number', 'GSTIN', 'Tax ID', 'VAT Number');
      const openingBalStr = findVal('Opening Balance', 'Balance');
      const creditLimitStr = findVal('Credit Limit');
      const payTerm = findVal('Pay Term', 'Payment Term');
      const notes = findVal('Notes', 'Note', 'Comments');

      const openingBalance = openingBalStr ? parseFloat(openingBalStr) || 0 : 0;
      const creditLimit = creditLimitStr ? parseFloat(creditLimitStr) || 0 : 0;

      // Auto-resolve country dial code
      const sysDefaultCode = (settings?.countryCode || settings?.currencySymbol === '₹' || settings?.currencyCode === 'INR' || settings?.country?.toLowerCase() === 'india') ? '+91' : '+1';
      const rowCountryCode = resolveCountryCodeFromContact({ phone, country }, sysDefaultCode);

      let isValid = true;
      let validationError = '';

      if (!name) {
        isValid = false;
        validationError = 'Missing Contact Name';
      }

      // Check if this contact record already exists in the database
      let alreadyExists = false;
      let duplicateReason = '';

      const isCustomer = finalContactType === 'customer' || finalContactType === 'both';
      const isSupplier = finalContactType === 'supplier' || finalContactType === 'both';

      if (name) {
        const cleanName = name.trim().toLowerCase();
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const cleanTax = taxNumber ? taxNumber.trim().toLowerCase() : '';

        // Check against existing customers
        if (isCustomer) {
          const dupCust = customers.find((c) => {
            if (phone && phone !== 'N/A' && c.phone && isDuplicatePhone(c.phone, phone)) {
              duplicateReason = `Customer with phone "${phone}" already exists (${c.name})`;
              return true;
            }
            if (cleanEmail && cleanEmail !== 'n/a' && c.email && c.email.trim().toLowerCase() === cleanEmail) {
              duplicateReason = `Customer with email "${email}" already exists (${c.name})`;
              return true;
            }
            if (c.name && c.name.trim().toLowerCase() === cleanName) {
              duplicateReason = `Customer with name "${name}" already exists`;
              return true;
            }
            if (cleanTax && c.taxNumber && c.taxNumber.trim().toLowerCase() === cleanTax) {
              duplicateReason = `Customer with Tax/GST "${taxNumber}" already exists (${c.name})`;
              return true;
            }
            return false;
          });

          if (dupCust) {
            alreadyExists = true;
          }
        }

        // Check against existing suppliers
        if (isSupplier && !alreadyExists) {
          const dupSupp = suppliers.find((s) => {
            if (phone && phone !== 'N/A' && s.phone && isDuplicatePhone(s.phone, phone)) {
              duplicateReason = `Supplier with phone "${phone}" already exists (${s.name})`;
              return true;
            }
            if (cleanEmail && cleanEmail !== 'n/a' && s.email && s.email.trim().toLowerCase() === cleanEmail) {
              duplicateReason = `Supplier with email "${email}" already exists (${s.name})`;
              return true;
            }
            if (s.name && s.name.trim().toLowerCase() === cleanName) {
              duplicateReason = `Supplier with name "${name}" already exists`;
              return true;
            }
            if (cleanTax && s.taxNumber && s.taxNumber.trim().toLowerCase() === cleanTax) {
              duplicateReason = `Supplier with Tax/GST "${taxNumber}" already exists (${s.name})`;
              return true;
            }
            return false;
          });

          if (dupSupp) {
            alreadyExists = true;
          }
        }
      }

      return {
        id: `row_${index}_${Date.now()}`,
        selected: isValid && !alreadyExists,
        name,
        businessName: businessName || undefined,
        contactType: finalContactType,
        customerGroup: customerGroup || (finalContactType === 'customer' ? 'Retail Customer' : undefined),
        email: email || 'N/A',
        phone: phone || 'N/A',
        countryCode: rowCountryCode,
        alternatePhone: alternatePhone || undefined,
        address: address || 'N/A',
        city: city || undefined,
        state: state || undefined,
        zipcode: zipcode || undefined,
        country: country || (rowCountryCode === '+91' ? 'India' : 'United States'),
        taxNumber: taxNumber || undefined,
        openingBalance,
        creditLimit,
        payTerm: payTerm || undefined,
        notes: notes || undefined,
        isValid,
        validationError,
        alreadyExists,
        duplicateReason,
        raw: row,
      };
    });

    setParsedRows(parsed);
  };

  const handleFileUpload = (f: File) => {
    if (!f) return;
    setIsProcessing(true);
    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        setSheetNames(wb.SheetNames);
        processWorkbook(wb);
        showFlashNotification(`Successfully parsed file "${f.name}".`, 'success');
      } catch (err) {
        console.error('Error parsing file:', err);
        showFlashNotification('Failed to parse Excel/CSV file. Please ensure it is a valid format.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showFlashNotification('Failed to read file.', 'error');
    };
    reader.readAsArrayBuffer(f);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSelectRowToggle = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAllToggle = (selectAll: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: selectAll ? (r.isValid && !r.alreadyExists) : false })));
  };

  const handleExecuteImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.name && r.isValid);
    if (selectedRows.length === 0) {
      showFlashNotification('No valid, un-imported rows selected for import.', 'error');
      return;
    }

    // Double check with database in real-time to avoid duplicate contacts
    const newRowsToImport: ParsedContactRow[] = [];
    const duplicateRowsLeft: ParsedContactRow[] = [];

    selectedRows.forEach((r) => {
      const isCustomer = r.contactType === 'customer' || r.contactType === 'both';
      const isSupplier = r.contactType === 'supplier' || r.contactType === 'both';
      const cleanName = r.name.trim().toLowerCase();
      const cleanEmail = r.email && r.email !== 'N/A' ? r.email.trim().toLowerCase() : '';
      const cleanTax = r.taxNumber ? r.taxNumber.trim().toLowerCase() : '';

      let isDuplicate = false;
      let reason = '';

      if (isCustomer) {
        const dupCust = customers.find((c) => {
          if (r.phone && r.phone !== 'N/A' && c.phone && isDuplicatePhone(c.phone, r.phone)) {
            reason = `Customer with phone "${r.phone}" already exists in database`;
            return true;
          }
          if (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail) {
            reason = `Customer with email "${r.email}" already exists in database`;
            return true;
          }
          if (c.name && c.name.trim().toLowerCase() === cleanName) {
            reason = `Customer "${r.name}" already exists in database`;
            return true;
          }
          if (cleanTax && c.taxNumber && c.taxNumber.trim().toLowerCase() === cleanTax) {
            reason = `Customer with Tax ID "${r.taxNumber}" already exists in database`;
            return true;
          }
          return false;
        });
        if (dupCust) isDuplicate = true;
      }

      if (isSupplier && !isDuplicate) {
        const dupSupp = suppliers.find((s) => {
          if (r.phone && r.phone !== 'N/A' && s.phone && isDuplicatePhone(s.phone, r.phone)) {
            reason = `Supplier with phone "${r.phone}" already exists in database`;
            return true;
          }
          if (cleanEmail && s.email && s.email.trim().toLowerCase() === cleanEmail) {
            reason = `Supplier with email "${r.email}" already exists in database`;
            return true;
          }
          if (s.name && s.name.trim().toLowerCase() === cleanName) {
            reason = `Supplier "${r.name}" already exists in database`;
            return true;
          }
          if (cleanTax && s.taxNumber && s.taxNumber.trim().toLowerCase() === cleanTax) {
            reason = `Supplier with Tax ID "${r.taxNumber}" already exists in database`;
            return true;
          }
          return false;
        });
        if (dupSupp) isDuplicate = true;
      }

      if (isDuplicate) {
        duplicateRowsLeft.push({ ...r, alreadyExists: true, duplicateReason: reason });
      } else {
        newRowsToImport.push(r);
      }
    });

    // If duplicate records exist, leave them in the Review section and mark them
    if (duplicateRowsLeft.length > 0) {
      setParsedRows((prev) =>
        prev.map((r) => {
          const matchedDup = duplicateRowsLeft.find((d) => d.id === r.id);
          if (matchedDup) {
            return {
              ...r,
              selected: false,
              alreadyExists: true,
              duplicateReason: matchedDup.duplicateReason,
            };
          }
          return r;
        })
      );
    }

    if (newRowsToImport.length === 0) {
      showFlashNotification(`All ${selectedRows.length} selected records already exist in the database. Duplicates were left and not imported.`, 'error');
      return;
    }

    const customersToImport: any[] = [];
    const suppliersToImport: any[] = [];

    newRowsToImport.forEach((r) => {
      const isCustomer = r.contactType === 'customer' || r.contactType === 'both';
      const isSupplier = r.contactType === 'supplier' || r.contactType === 'both';

      const cleanPhone = (r.phone || '').trim().replace(/^\+\d+\s*/, '');
      const formattedPhone = cleanPhone && cleanPhone !== 'N/A' ? `${r.countryCode || '+1'} ${cleanPhone}` : (r.phone || 'N/A');

      if (isCustomer) {
        const matchedGrp = customerGroups.find(
          (g) => g.name.toLowerCase() === (r.customerGroup || '').toLowerCase()
        );
        customersToImport.push({
          name: r.name,
          businessName: r.businessName,
          customerGroup: r.customerGroup || 'Retail Customer',
          customerGroupId: matchedGrp?.id,
          email: r.email || 'N/A',
          phone: formattedPhone,
          countryCode: r.countryCode || '+1',
          alternatePhone: r.alternatePhone,
          address: r.address || 'N/A',
          city: r.city,
          state: r.state,
          zipcode: r.zipcode,
          country: r.country || (r.countryCode === '+91' ? 'India' : 'United States'),
          taxNumber: r.taxNumber,
          openingBalance: r.openingBalance || 0,
          creditLimit: r.creditLimit || 0,
          payTerm: r.payTerm,
          notes: r.notes,
        });
      }

      if (isSupplier) {
        suppliersToImport.push({
          name: r.name,
          businessName: r.businessName || r.name,
          email: r.email || 'N/A',
          phone: formattedPhone,
          countryCode: r.countryCode || '+1',
          alternatePhone: r.alternatePhone,
          address: r.address || 'N/A',
          city: r.city,
          state: r.state,
          zipcode: r.zipcode,
          country: r.country || (r.countryCode === '+91' ? 'India' : 'United States'),
          taxNumber: r.taxNumber,
          openingBalance: r.openingBalance || 0,
          payTerm: r.payTerm,
          notes: r.notes,
        });
      }
    });

    let message = '';
    if (customersToImport.length > 0) {
      importCustomers(customersToImport);
      message += `Imported ${customersToImport.length} customer(s). `;
    }
    if (suppliersToImport.length > 0) {
      importSuppliers(suppliersToImport);
      message += `Imported ${suppliersToImport.length} supplier(s). `;
    }

    if (duplicateRowsLeft.length > 0) {
      message += `${duplicateRowsLeft.length} duplicate record(s) already existed and were left behind.`;
    }

    showFlashNotification(message || 'Contacts processed successfully.', 'success');

    // Push remaining imported records accordingly to their respective menus
    if (customersToImport.length >= suppliersToImport.length) {
      navigateToContacts('customers');
    } else {
      navigateToContacts('suppliers');
    }
  };

  const validNewRowsCount = parsedRows.filter((r) => r.isValid && !r.alreadyExists).length;
  const duplicateRowsCount = parsedRows.filter((r) => r.alreadyExists).length;
  const selectedRowsCount = parsedRows.filter((r) => r.selected).length;
  const invalidRowsCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToContacts('customers')}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="Back to Contacts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span>Import Contacts (Bulk Upload)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bulk import customer accounts and wholesale suppliers from a single, unified Excel (.xlsx) or CSV (.csv) spreadsheet.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Download Template & File Upload Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Download Predesigned Templates */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">1</span>
              <span>Download Contact Template</span>
            </div>
            <p className="text-xs text-slate-400">
              Download the predesigned spreadsheet format with pre-formatted column headers and sample data rows. Fill in your contact list and re-upload.
            </p>

            <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Supported Headers:</span>
                <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Unified Form
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span>Includes headers: Name, Business Name, Contact Type (customer/supplier), Customer Group, Email, Phone, Alternate Phone, Address, City, State, Zipcode, Country, Tax Number, Opening Balance, Credit Limit, Pay Term, Notes.</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Template (.xlsx)</span>
            </button>
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="w-full py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Download CSV Template (.csv)</span>
            </button>
          </div>
        </div>

        {/* Step 2: Upload File Box */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">2</span>
            <span>Upload Completed Spreadsheet</span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                : file
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">{file.name}</div>
                <div className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB &bull; Click or drag new file to replace
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center mx-auto border border-slate-700">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-200">
                  Click to select file or drag & drop here
                </div>
                <div className="text-xs text-slate-400">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) spreadsheet formats
                </div>
              </div>
            )}
          </div>

          {sheetNames.length > 1 && (
            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Select Worksheet:</span>
              <select
                value={selectedSheet}
                onChange={(e) => {
                  const name = e.target.value;
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const buffer = evt.target?.result;
                      const wb = XLSX.read(buffer, { type: 'array' });
                      processWorkbook(wb, name);
                    };
                    reader.readAsArrayBuffer(file);
                  }
                }}
                className="bg-slate-900 text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Data Table Preview & Import Execution */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">3</span>
                <span>Review Parsed Contact Records ({parsedRows.length})</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Review extracted records before finalizing the bulk import.
              </p>
            </div>

            {/* Quick Stats & Import CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-bold" title="New contacts ready to import">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {validNewRowsCount} New
                </span>
                {duplicateRowsCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold pl-2 border-l border-slate-800" title="Existing in database (will be skipped and left behind)">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {duplicateRowsCount} Already in DB (Left)
                  </span>
                )}
                {invalidRowsCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-400 font-bold pl-2 border-l border-slate-800" title="Missing required info">
                    <X className="w-3.5 h-3.5" />
                    {invalidRowsCount} Invalid
                  </span>
                )}
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={selectedRowsCount === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition cursor-pointer ${
                  selectedRowsCount > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Import {selectedRowsCount} Contacts</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRowsCount > 0 && selectedRowsCount === validNewRowsCount}
                      onChange={(e) => handleSelectAllToggle(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Contact Name</th>
                  <th className="p-3.5">Business Name</th>
                  <th className="p-3.5">Contact Type</th>
                  <th className="p-3.5">Customer Group</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Location / Address</th>
                  <th className="p-3.5">Tax No. / GSTIN</th>
                  <th className="p-3.5 text-right">Opening Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                {parsedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-800/40 transition ${
                      !row.isValid
                        ? 'bg-rose-500/5'
                        : row.alreadyExists
                        ? 'bg-amber-500/10'
                        : row.selected
                        ? 'bg-indigo-600/5'
                        : 'opacity-60'
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={!row.isValid || row.alreadyExists}
                        onChange={() => handleSelectRowToggle(row.id)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-30"
                      />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {row.alreadyExists ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30" title={row.duplicateReason}>
                          <AlertTriangle className="w-3 h-3" /> Already in DB (Left)
                        </span>
                      ) : row.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" /> {row.validationError || 'Invalid'}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {row.name || <span className="text-slate-500 italic">Empty Name</span>}
                    </td>
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      {row.businessName || <span className="text-slate-500">&mdash;</span>}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {row.contactType === 'both' ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-extrabold border border-indigo-500/20 uppercase text-[10px]">
                          Both
                        </span>
                      ) : row.contactType === 'supplier' ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-extrabold border border-purple-500/20 uppercase text-[10px]">
                          Supplier
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-extrabold border border-blue-500/20 uppercase text-[10px]">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {row.contactType === 'supplier' ? (
                        <span className="text-slate-500">&mdash;</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700 text-[11px]">
                          {row.customerGroup || 'Retail Customer'}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                      {row.phone !== 'N/A' ? row.phone : <span className="text-slate-500">&mdash;</span>}
                    </td>
                    <td className="p-3.5 text-slate-300 whitespace-nowrap">
                      {row.email !== 'N/A' ? row.email : <span className="text-slate-500">&mdash;</span>}
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-[200px] truncate">
                      {[row.address, row.city, row.state].filter((x) => x && x !== 'N/A').join(', ') || '&mdash;'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                      {row.taxNumber || <span className="text-slate-500">&mdash;</span>}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-indigo-400 whitespace-nowrap">
                      ${(row.openingBalance || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
