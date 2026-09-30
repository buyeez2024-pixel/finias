import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useErp } from '../../context/ErpContext';
import { Product, Supplier } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Truck,
  Package,
  DollarSign,
  FileText,
  Sparkles,
  HelpCircle,
  X,
  Check,
  Search,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Layers,
  Building2,
  Tag,
  Info
} from 'lucide-react';

interface ParsedPurchaseRow {
  id: string;
  rowIndex: number;
  selected: boolean;
  // Mandatory Fields
  supplierName: string;
  date: string;
  productName: string;
  productSku: string;
  productIdentifier: string;
  quantity: number;
  unitCostPrice: number;
  // Optional / Advanced Fields
  invoiceNo: string;
  locationName: string;
  taxRate: number;
  discountAmount: number;
  shippingCharges: number;
  lotNumber: string;
  purchaseStatus: 'received' | 'ordered' | 'pending';
  paymentStatus: 'paid' | 'partial' | 'due';
  paidAmount: number;
  paymentMethod: string;
  notes: string;
  // Computed / Matched
  matchedProductId?: string;
  matchedProductName?: string;
  matchedSupplierId?: string;
  matchedLocationId?: string;
  subtotal: number;
  total: number;
  // Validation state
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  raw: Record<string, any>;
}

interface ImportPurchasesPageProps {
  onBack: () => void;
}

export const ImportPurchasesPage: React.FC<ImportPurchasesPageProps> = ({ onBack }) => {
  const {
    suppliers,
    products,
    locations,
    settings,
    createPurchase,
    addProducts,
    addSupplier,
    showFlashNotification,
    currentUser,
  } = useErp();

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  // Default location
  const defaultLocation = locations?.find((l) => l.isDefault) || locations?.[0] || { id: 'loc_1', name: 'Main Location' };

  // Component states
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedPurchaseRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  
  // Default override settings
  const [fallbackLocationId, setFallbackLocationId] = useState<string>(defaultLocation.id);
  const [defaultOrderStatus, setDefaultOrderStatus] = useState<'received' | 'ordered' | 'pending'>('received');
  const [autoCreateProducts, setAutoCreateProducts] = useState<boolean>(true);
  const [autoCreateSuppliers, setAutoCreateSuppliers] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate Template with Mandatory Features & Clear Instructions
  const generateTemplateData = () => {
    const headers = [
      'Supplier Name*',
      'Purchase Date* (DD-MM-YYYY)',
      'Product Name*',
      'Product SKU',
      'Quantity*',
      'Unit Cost Price*',
      'PO / Invoice No',
      'Location / Branch',
      'Tax Rate (%)',
      'Discount Amount',
      'Shipping Charges',
      'Lot / Batch Number',
      'Purchase Status (received/ordered/pending)',
      'Payment Status (paid/partial/due)',
      'Paid Amount',
      'Payment Method (cash/bank_transfer/credit_card)',
      'Notes',
    ];

    const now = new Date();
    const todayDDMMYYYY = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    const sampleRows = [
      [
        'Sri Vijaya Lakshmi Traders',
        todayDDMMYYYY,
        'Wireless Bluetooth Headphones',
        'SKU-WBH-001',
        '25',
        '45.00',
        'PO-2026-8801',
        defaultLocation.name,
        '18',
        '0',
        '25.00',
        'LOT-2026-09A',
        'received',
        'paid',
        '1150.00',
        'bank_transfer',
        'Bulk inward order from Sri Vijaya Lakshmi Traders',
      ],
      [
        'EcoRoast Distributors',
        todayDDMMYYYY,
        'Organic Coffee Beans (500g)',
        'SKU-OCB-500',
        '50',
        '8.50',
        'PO-2026-8802',
        defaultLocation.name,
        '5',
        '15.00',
        '10.00',
        'LOT-2026-09B',
        'received',
        'due',
        '0.00',
        'cash',
        'Vendor net-30 terms with EcoRoast Distributors',
      ],
      [
        'Apex Global Supplies',
        todayDDMMYYYY,
        'Ergonomic Desk Chair',
        '', // Leaving SKU blank so user sees auto SKU allocation when left empty
        '15',
        '120.00',
        'PO-2026-8803',
        defaultLocation.name,
        '18',
        '0',
        '50.00',
        'LOT-2026-09C',
        'received',
        'partial',
        '1000.00',
        'credit_card',
        'Advance shipment from Apex Global Supplies (SKU auto-allocated)',
      ],
    ];

    return [headers, ...sampleRows];
  };

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = generateTemplateData();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths for readability
    worksheet['!cols'] = [
      { wch: 30 }, // Supplier Name*
      { wch: 28 }, // Purchase Date* (DD-MM-YYYY)
      { wch: 32 }, // Product Name*
      { wch: 20 }, // Product SKU
      { wch: 12 }, // Quantity*
      { wch: 16 }, // Unit Cost Price*
      { wch: 18 }, // PO / Invoice No
      { wch: 20 }, // Location / Branch
      { wch: 14 }, // Tax Rate (%)
      { wch: 16 }, // Discount Amount
      { wch: 16 }, // Shipping Charges
      { wch: 18 }, // Lot / Batch Number
      { wch: 30 }, // Purchase Status
      { wch: 25 }, // Payment Status
      { wch: 14 }, // Paid Amount
      { wch: 25 }, // Payment Method
      { wch: 35 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Import Template');

    const fileName = `purchases_import_template.${format}`;
    if (format === 'xlsx') {
      XLSX.writeFile(workbook, fileName);
    } else {
      XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
    }

    showFlashNotification(`Downloaded Purchase Order ${format.toUpperCase()} template in DD-MM-YYYY format with mandatory fields.`, 'info');
  };

  // Parser helper
  const processWorkbook = (wb: XLSX.WorkBook, sheetNameToParse?: string) => {
    const nameToUse = sheetNameToParse || wb.SheetNames[0];
    setSelectedSheet(nameToUse);

    const worksheet = wb.Sheets[nameToUse];
    if (!worksheet) return;

    const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawJson || rawJson.length === 0) {
      setParsedRows([]);
      showFlashNotification('The uploaded file contains no data rows.', 'error');
      return;
    }

    const parsed: ParsedPurchaseRow[] = rawJson.map((row, index) => {
      const findVal = (...aliases: string[]): string => {
        // Pass 1: exact match on sanitized names
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchedKey = Object.keys(row).find((k) => {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanK === cleanAlias;
          });
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
            return String(row[matchedKey]).trim();
          }
        }
        // Pass 2: prefix match on sanitized names (e.g. "purchasedateddmmyyyy" matching "purchasedate")
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchedKey = Object.keys(row).find((k) => {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanK.startsWith(cleanAlias) || cleanAlias.startsWith(cleanK);
          });
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
            return String(row[matchedKey]).trim();
          }
        }
        return '';
      };

      // 1. Mandatory & Product Fields
      const supplierName = findVal('Supplier Name', 'Supplier Name*', 'Supplier', 'Vendor Name', 'Vendor Name*', 'Vendor', 'Party Name');
      const dateRaw = findVal('Purchase Date (DD-MM-YYYY)', 'Purchase Date* (DD-MM-YYYY)', 'Purchase Date (YYYY-MM-DD)', 'Purchase Date* (YYYY-MM-DD)', 'Purchase Date', 'Purchase Date*', 'Date', 'Order Date', 'PO Date');
      const productName = findVal('Product Name*', 'Product Name', 'Item Name', 'Item', 'Product SKU or Name*', 'Product SKU or Name', 'Product');
      const productSku = findVal('Product SKU', 'Product SKU (Optional)', 'SKU', 'Item SKU', 'Barcode');
      const qtyStr = findVal('Quantity', 'Quantity*', 'Qty', 'Units', 'Quantity Ordered');
      const costStr = findVal('Unit Cost Price', 'Unit Cost Price*', 'Unit Cost', 'Cost Price', 'Purchase Price', 'Unit Price', 'Cost');

      // 2. Optional Fields
      const invoiceNo = findVal('PO / Invoice No', 'PO / Invoice No.', 'Invoice No', 'Invoice No.', 'PO Number', 'PO No', 'Invoice', 'Bill No');
      const locationName = findVal('Location / Branch', 'Location', 'Branch', 'Store', 'Warehouse');
      const taxStr = findVal('Tax Rate (%)', 'Tax Rate', 'Tax', 'Tax (%)', 'GST Rate');
      const discountStr = findVal('Discount Amount', 'Discount', 'Discount ($)');
      const shippingStr = findVal('Shipping Charges', 'Shipping', 'Freight', 'Delivery Charges');
      const lotNumber = findVal('Lot / Batch Number', 'Lot Number', 'Batch Number', 'Lot', 'Batch');
      const statusRaw = findVal('Purchase Status (received/ordered/pending)', 'Purchase Status', 'Status', 'Order Status').toLowerCase();
      const payStatusRaw = findVal('Payment Status (paid/partial/due)', 'Payment Status', 'Pay Status').toLowerCase();
      const paidStr = findVal('Paid Amount', 'Amount Paid', 'Paid');
      const paymentMethodRaw = findVal('Payment Method (cash/bank_transfer/credit_card)', 'Payment Method', 'Method', 'Payment Mode').toLowerCase();
      const notes = findVal('Notes', 'Remarks', 'Memo', 'Comments');

      // Validations & Parsing
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate Supplier
      if (!supplierName) {
        errors.push('Supplier Name is required (Mandatory)');
      }

      // Validate Date (Supports DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, and Excel serial numbers)
      let cleanDate = dateRaw;
      if (!cleanDate) {
        const now = new Date();
        cleanDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        warnings.push('Date missing; defaulted to today');
      } else {
        // Try parsing date if Excel serial number
        if (!isNaN(Number(cleanDate)) && Number(cleanDate) > 30000) {
          const excelDate = new Date(Math.round((Number(cleanDate) - 25569) * 86400 * 1000));
          const d = String(excelDate.getUTCDate()).padStart(2, '0');
          const m = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
          const y = excelDate.getUTCFullYear();
          cleanDate = `${d}-${m}-${y}`;
        } else {
          // Normalize DD-MM-YYYY, DD/MM/YYYY, or DD.MM.YYYY
          const ddmmyyyyMatch = cleanDate.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
          const yyyymmddMatch = cleanDate.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
          if (ddmmyyyyMatch) {
            const [, d, m, y] = ddmmyyyyMatch;
            cleanDate = `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
          } else if (yyyymmddMatch) {
            const [, y, m, d] = yyyymmddMatch;
            cleanDate = `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
          }
        }
      }

      // Validate Product Name (Mandatory)
      if (!productName) {
        errors.push('Product Name is required (Mandatory)');
      }

      const productIdentifier = productName
        ? (productSku ? `${productName} (SKU: ${productSku})` : productName)
        : productSku || '';

      // Validate Quantity
      const quantity = parseFloat(qtyStr);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push('Quantity must be a valid number greater than 0 (Mandatory)');
      }

      // Validate Cost Price
      const unitCostPrice = parseFloat(costStr);
      if (isNaN(unitCostPrice) || unitCostPrice < 0) {
        errors.push('Unit Cost Price must be a valid number >= 0 (Mandatory)');
      }

      // Optional numbers
      const taxRate = !isNaN(parseFloat(taxStr)) ? parseFloat(taxStr) : 0;
      const discountAmount = !isNaN(parseFloat(discountStr)) ? parseFloat(discountStr) : 0;
      const shippingCharges = !isNaN(parseFloat(shippingStr)) ? parseFloat(shippingStr) : 0;

      // Calculate totals
      const validQty = isNaN(quantity) || quantity <= 0 ? 0 : quantity;
      const validCost = isNaN(unitCostPrice) || unitCostPrice < 0 ? 0 : unitCostPrice;
      const subtotal = validQty * validCost;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = Math.max(0, subtotal + taxAmount + shippingCharges - discountAmount);

      const paidAmount = !isNaN(parseFloat(paidStr)) ? parseFloat(paidStr) : (payStatusRaw === 'paid' ? total : 0);

      // Status resolution
      let purchaseStatus: 'received' | 'ordered' | 'pending' = defaultOrderStatus;
      if (statusRaw.includes('receiv') || statusRaw === 'received') {
        purchaseStatus = 'received';
      } else if (statusRaw.includes('order') || statusRaw === 'ordered') {
        purchaseStatus = 'ordered';
      } else if (statusRaw.includes('pend') || statusRaw === 'pending') {
        purchaseStatus = 'pending';
      }

      // Payment Status
      let paymentStatus: 'paid' | 'partial' | 'due' = 'due';
      if (paidAmount >= total && total > 0) {
        paymentStatus = 'paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      } else if (payStatusRaw === 'paid') {
        paymentStatus = 'paid';
      }

      // Payment Method
      let paymentMethod = 'cash';
      if (paymentMethodRaw.includes('bank') || paymentMethodRaw.includes('transfer')) {
        paymentMethod = 'bank_transfer';
      } else if (paymentMethodRaw.includes('card') || paymentMethodRaw.includes('credit') || paymentMethodRaw.includes('debit')) {
        paymentMethod = 'credit_card';
      } else if (paymentMethodRaw.includes('cheque') || paymentMethodRaw.includes('check')) {
        paymentMethod = 'cheque';
      } else if (paymentMethodRaw.includes('upi') || paymentMethodRaw.includes('online')) {
        paymentMethod = 'upi';
      }

      // Match Supplier
      const matchedSupplier = suppliers?.find(
        (s) =>
          s.name.toLowerCase() === supplierName.toLowerCase() ||
          (s.businessName && s.businessName.toLowerCase() === supplierName.toLowerCase())
      );
      if (!matchedSupplier && supplierName) {
        warnings.push(`New supplier "${supplierName}" will be auto-created`);
      }

      // Match Product (First by SKU if provided, then by Product Name)
      let matchedProduct = undefined;
      if (productSku) {
        matchedProduct = products?.find(
          (p) =>
            p.sku?.toLowerCase() === productSku.toLowerCase() ||
            p.barcode?.toLowerCase() === productSku.toLowerCase()
        );
      }
      if (!matchedProduct && productName) {
        matchedProduct = products?.find(
          (p) => p.name.toLowerCase() === productName.toLowerCase()
        );
      }

      if (!matchedProduct && productName) {
        if (productSku) {
          warnings.push(`New product "${productName}" with SKU "${productSku}" will be auto-created in inventory`);
        } else {
          warnings.push(`New product "${productName}" will be auto-created with an auto-allocated SKU`);
        }
      }

      // Match Location
      let matchedLocationId = fallbackLocationId;
      if (locationName) {
        const foundLoc = locations?.find(
          (l) => l.name.toLowerCase() === locationName.toLowerCase() || l.id.toLowerCase() === locationName.toLowerCase()
        );
        if (foundLoc) {
          matchedLocationId = foundLoc.id;
        } else {
          warnings.push(`Location "${locationName}" not found; using "${defaultLocation.name}"`);
        }
      }

      const isValid = errors.length === 0;

      return {
        id: `row_${index}_${Date.now()}`,
        rowIndex: index + 1,
        selected: isValid,
        supplierName,
        date: cleanDate,
        productName,
        productSku,
        productIdentifier,
        quantity: isNaN(quantity) ? 0 : quantity,
        unitCostPrice: isNaN(unitCostPrice) ? 0 : unitCostPrice,
        invoiceNo: invoiceNo || '',
        locationName: locationName || defaultLocation.name,
        taxRate,
        discountAmount,
        shippingCharges,
        lotNumber: lotNumber || '',
        purchaseStatus,
        paymentStatus,
        paidAmount,
        paymentMethod,
        notes,
        matchedProductId: matchedProduct?.id,
        matchedProductName: matchedProduct?.name,
        matchedSupplierId: matchedSupplier?.id,
        matchedLocationId,
        subtotal,
        total,
        isValid,
        validationErrors: errors,
        validationWarnings: warnings,
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
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: selectAll ? r.isValid : false })));
  };

  // Execution: Batch Import Purchases
  const handleExecuteImport = async () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.isValid);
    if (selectedRows.length === 0) {
      showFlashNotification('No valid purchase rows selected for import.', 'error');
      return;
    }

    setIsImporting(true);

    try {
      // 1. Pre-process missing suppliers
      const supplierMap = new Map<string, string>(); // normalized name -> supplierId
      suppliers.forEach((s) => {
        if (s.name) supplierMap.set(s.name.trim().toLowerCase(), s.id);
        if (s.businessName) supplierMap.set(s.businessName.trim().toLowerCase(), s.id);
      });

      const uniqueNewSupplierNames = new Set<string>();
      selectedRows.forEach((r) => {
        const cleanName = (r.supplierName || '').trim();
        if (cleanName && !supplierMap.has(cleanName.toLowerCase())) {
          uniqueNewSupplierNames.add(cleanName);
        }
      });

      if (autoCreateSuppliers && uniqueNewSupplierNames.size > 0) {
        let sIdx = 0;
        uniqueNewSupplierNames.forEach((sName) => {
          sIdx++;
          const cleanName = sName.trim();
          const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const generatedId = `sup_${slug}_${Date.now()}_${sIdx}_${Math.floor(1000 + Math.random() * 9000)}`;
          const newSupp = addSupplier({
            id: generatedId,
            name: cleanName,
            businessName: cleanName,
            email: 'N/A',
            phone: 'N/A',
            address: 'Created via Purchase Import',
            city: '',
            state: '',
            zipcode: '',
            country: 'United States',
            taxNumber: '',
            openingBalance: 0,
            payTerm: 'Net 30 Days',
            notes: 'Auto-created during bulk purchase import',
          });
          const assignedId = newSupp?.id || generatedId;
          supplierMap.set(cleanName.toLowerCase(), assignedId);
        });
      }

      // 2. Pre-process missing products
      const productMap = new Map<string, Product>(); // identifier.toLowerCase() -> Product
      products.forEach((p) => {
        productMap.set(p.name.toLowerCase(), p);
        if (p.sku) productMap.set(p.sku.toLowerCase(), p);
        if (p.barcode) productMap.set(p.barcode.toLowerCase(), p);
      });

      const newProductsToCreate: Omit<Product, 'id'>[] = [];
      const handledNewProductKeys = new Set<string>();

      selectedRows.forEach((r) => {
        const targetName = (r.productName || r.productIdentifier || '').trim();
        const targetSku = r.productSku ? r.productSku.trim() : `SKU-IMP-${Math.floor(10000 + Math.random() * 90000)}`;
        const keySku = targetSku.toLowerCase();
        const keyName = targetName.toLowerCase();
        const keyId = (r.productIdentifier || '').toLowerCase();

        if (
          !productMap.has(keySku) &&
          !productMap.has(keyName) &&
          !productMap.has(keyId) &&
          !handledNewProductKeys.has(keySku) &&
          !handledNewProductKeys.has(keyName)
        ) {
          handledNewProductKeys.add(keySku);
          handledNewProductKeys.add(keyName);
          const cost = r.unitCostPrice || 10;
          const sellingPrice = Math.round(cost * 1.35 * 100) / 100;

          const itemLot = r.lotNumber ? r.lotNumber.trim() : undefined;
          newProductsToCreate.push({
            name: targetName,
            sku: targetSku,
            barcode: `${Date.now()}${Math.floor(Math.random() * 100)}`,
            category: 'General',
            unit: 'Pcs',
            costPrice: cost,
            sellingPrice,
            taxRate: r.taxRate || 0,
            alertQuantity: 10,
            currentStock: 0,
            locationStocks: {
              [r.matchedLocationId || fallbackLocationId]: 0,
            },
            type: 'single',
            source: 'purchase',
            creationSource: 'direct_purchase',
            isDirectPurchase: true,
            createdAt: new Date().toISOString(),
            lotNumber: itemLot,
            lots: itemLot ? [
              {
                id: `lot_imp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                lotNumber: itemLot,
                costPrice: cost,
                sellingPrice,
                currentStock: 0,
                createdDate: new Date().toISOString().slice(0, 10),
              }
            ] : [],
          } as any);
        }
      });

      if (autoCreateProducts && newProductsToCreate.length > 0) {
        const createdProds = addProducts(newProductsToCreate);
        if (createdProds && Array.isArray(createdProds)) {
          createdProds.forEach((mappedProd) => {
            productMap.set(mappedProd.name.toLowerCase(), mappedProd);
            if (mappedProd.sku) productMap.set(mappedProd.sku.toLowerCase(), mappedProd);
            if (mappedProd.barcode) productMap.set(mappedProd.barcode.toLowerCase(), mappedProd);
          });
        }
      }

      // 3. Group rows by Supplier & PO / Invoice No
      interface PurchaseGroup {
        invoiceNo?: string;
        supplierId: string;
        supplierName: string;
        locationId: string;
        date: string;
        status: 'received' | 'ordered' | 'pending';
        paymentStatus: 'paid' | 'partial' | 'due';
        paymentMethod: string;
        notes: string;
        lotNumber?: string;
        shippingCharges: number;
        discountAmount: number;
        paidAmount: number;
        items: {
          productId: string;
          productName: string;
          sku: string;
          unit: string;
          quantity: number;
          unitPrice: number;
          costPrice: number;
          taxRate: number;
          tax: number;
          discount: number;
          total: number;
          supplierId?: string;
          supplierName?: string;
        }[];
      }

      const groups = new Map<string, PurchaseGroup>();

      selectedRows.forEach((row, idx) => {
        const cleanSuppName = (row.supplierName || '').trim();
        let suppId = supplierMap.get(cleanSuppName.toLowerCase());
        if (!suppId) {
          const directMatch = suppliers.find(
            (s) => (s.name && s.name.trim().toLowerCase() === cleanSuppName.toLowerCase()) ||
                   (s.businessName && s.businessName.trim().toLowerCase() === cleanSuppName.toLowerCase())
          );
          if (directMatch) {
            suppId = directMatch.id;
          }
        }
        if (!suppId) {
          const slug = cleanSuppName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const fallbackId = `sup_${slug}_${Date.now()}_${idx}_${Math.floor(1000 + Math.random() * 9000)}`;
          const created = addSupplier({
            id: fallbackId,
            name: cleanSuppName || 'Unknown Supplier',
            businessName: cleanSuppName || 'Unknown Supplier',
            email: 'N/A',
            phone: 'N/A',
            address: 'Created via Purchase Import',
            city: '',
            state: '',
            zipcode: '',
            country: 'United States',
          });
          suppId = created?.id || fallbackId;
          supplierMap.set(cleanSuppName.toLowerCase(), suppId);
        }

        const locId = row.matchedLocationId || fallbackLocationId;

        // Group key: Scoped by supplierId so different suppliers are NEVER combined into one purchase order!
        const cleanInvoice = row.invoiceNo?.trim() ? row.invoiceNo.trim().toUpperCase() : '';
        const groupKey = cleanInvoice
          ? `SUP_${suppId}__PO_${cleanInvoice}`
          : `ROW_${suppId}_${idx}_${Date.now()}`;

        const prodKeySku = row.productSku ? row.productSku.trim().toLowerCase() : '';
        const prodKeyName = row.productName ? row.productName.trim().toLowerCase() : '';
        const prodKeyId = row.productIdentifier ? row.productIdentifier.trim().toLowerCase() : '';

        const prod = (prodKeySku ? productMap.get(prodKeySku) : undefined) ||
                     (prodKeyName ? productMap.get(prodKeyName) : undefined) ||
                     (prodKeyId ? productMap.get(prodKeyId) : undefined);

        const prodId = prod?.id || `prod_imp_${idx}`;
        const prodName = prod?.name || row.productName || row.productIdentifier;
        const prodSku = prod?.sku || row.productSku || `SKU-${idx}`;
        const prodUnit = prod?.unit || 'Pcs';

        const itemSubtotal = row.quantity * row.unitCostPrice;
        const itemTax = (itemSubtotal * (row.taxRate || 0)) / 100;
        const itemDiscount = row.discountAmount || 0;
        const itemTotal = Math.max(0, itemSubtotal + itemTax - itemDiscount);

        const purchaseItem = {
          productId: prodId,
          productName: prodName,
          sku: prodSku,
          unit: prodUnit,
          quantity: row.quantity,
          unitPrice: row.unitCostPrice,
          costPrice: row.unitCostPrice,
          taxRate: row.taxRate || 0,
          tax: itemTax,
          discount: itemDiscount,
          total: itemTotal,
          supplierId: suppId,
          supplierName: cleanSuppName,
          lotNumber: row.lotNumber ? row.lotNumber.trim() : undefined,
        };

        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            invoiceNo: row.invoiceNo ? row.invoiceNo.trim() : undefined,
            supplierId: suppId,
            supplierName: cleanSuppName,
            locationId: locId,
            date: row.date,
            status: row.purchaseStatus,
            paymentStatus: row.paymentStatus,
            paymentMethod: row.paymentMethod || 'bank_transfer',
            notes: row.notes || `Imported purchase order from ${cleanSuppName}`,
            lotNumber: row.lotNumber || undefined,
            shippingCharges: row.shippingCharges || 0,
            discountAmount: row.discountAmount || 0,
            paidAmount: row.paidAmount || 0,
            items: [purchaseItem],
          });
        } else {
          const existing = groups.get(groupKey)!;
          existing.items.push(purchaseItem);
          existing.shippingCharges += row.shippingCharges || 0;
          existing.discountAmount += row.discountAmount || 0;
          existing.paidAmount += row.paidAmount || 0;
        }
      });

      // 4. Create Purchases in ErpContext
      let createdCount = 0;
      let totalAmountImported = 0;

      for (const [, group] of groups) {
        const subtotal = group.items.reduce((s, it) => s + (it.quantity * it.costPrice), 0);
        const taxAmount = group.items.reduce((s, it) => s + it.tax, 0);
        const totalAmount = Math.max(0, subtotal + taxAmount + group.shippingCharges - group.discountAmount);

        createPurchase({
          invoiceNo: group.invoiceNo,
          supplierId: group.supplierId,
          supplierName: group.supplierName,
          locationId: group.locationId,
          type: 'purchase',
          date: group.date,
          items: group.items,
          subtotal,
          taxAmount,
          discountAmount: group.discountAmount,
          shippingCharges: group.shippingCharges,
          totalAmount,
          paidAmount: group.paidAmount > 0 ? group.paidAmount : (group.paymentStatus === 'paid' ? totalAmount : 0),
          paymentMethod: group.paymentMethod,
          notes: group.notes,
          status: group.status,
          lotNumber: group.lotNumber,
        });

        createdCount++;
        totalAmountImported += totalAmount;
      }

      showFlashNotification(
        `Successfully imported ${createdCount} Purchase Order(s) (${selectedRows.length} line items) totaling ${formatCurrency(totalAmountImported, settings)}!`,
        'success'
      );

      // Return to All Purchases view
      onBack();
    } catch (err: any) {
      console.error('Error importing purchases:', err);
      showFlashNotification(`Error importing purchases: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered rows for the preview table
  const filteredRows = useMemo(() => {
    return parsedRows.filter((r) => {
      const matchSearch =
        !searchFilter ||
        r.supplierName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.productIdentifier.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.invoiceNo.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.locationName.toLowerCase().includes(searchFilter.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'valid' && r.isValid) ||
        (statusFilter === 'invalid' && !r.isValid);

      return matchSearch && matchStatus;
    });
  }, [parsedRows, searchFilter, statusFilter]);

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowsCount = parsedRows.filter((r) => !r.isValid).length;
  const selectedRowsCount = parsedRows.filter((r) => r.selected && r.isValid).length;
  const totalValueParsed = parsedRows.filter((r) => r.selected && r.isValid).reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Back to All Purchases"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <span>Import Purchases (Bulk Procurement Upload)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bulk import supplier purchase orders, inward goods receipts, and stock replenishments from Excel (.xlsx) or CSV (.csv) spreadsheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin & Procurement Manager</span>
          </span>
        </div>
      </div>

      {/* Mandatory Features & Template Download Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Download Purchase Import Template</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  Pre-configured with Mandatory Features
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Download the standardized import template with pre-labeled mandatory columns, sample data, and field validation rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV (.csv)</span>
            </button>

            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>{showInstructions ? 'Hide Field Guide' : 'Show Field Guide'}</span>
              {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Field Guide with Mandatory & Optional Matrix */}
        {showInstructions && (
          <div className="p-5 bg-slate-900/60 border-t border-slate-800/60 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Column Field Reference & Mandatory Requirements</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Columns marked with <strong className="text-rose-400 font-bold">*</strong> are strictly mandatory
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Mandatory 1: Supplier */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Supplier Name*</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Merchant or vendor name. If supplier doesn't exist yet, a profile will be auto-created.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "Apex Global Supplies"</div>
              </div>

              {/* Mandatory 2: Purchase Date */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Purchase Date* (DD-MM-YYYY)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Date of purchase order in <code className="text-indigo-300">DD-MM-YYYY</code> format. Defaults to today if omitted.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "26-09-2026"</div>
              </div>

              {/* Mandatory 3: Product Name */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Product Name*</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Exact title or item description. Auto-links existing catalog item or creates new inventory product.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "Wireless Headphones"</div>
              </div>

              {/* Optional: Product SKU */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Product SKU</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Custom item SKU code. If filled, it will be used as product SKU; if left empty, an SKU is automatically allocated.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "SKU-BTH-01" or empty</div>
              </div>

              {/* Mandatory 4: Quantity */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Quantity*</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Number of units received/ordered. Must be a positive numeric value greater than zero.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "50" or "25.5"</div>
              </div>

              {/* Mandatory 5: Unit Cost Price */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Unit Cost Price*</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Per-unit purchase cost before tax. Must be a valid numeric price.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "45.00"</div>
              </div>

              {/* Optional: PO / Invoice No */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">PO / Invoice No</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Invoice reference. Rows with the <strong>same PO number</strong> are grouped into a single multi-item invoice.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "PO-2026-8801"</div>
              </div>

              {/* Optional: Location */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Location / Branch</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Warehouse or store receiving the stock. Defaults to default store location if left blank.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Example: "Main Location"</div>
              </div>

              {/* Optional: Status & Lots */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Purchase Status & Lots</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  <strong className="text-emerald-400">received</strong> (replenishes stock), <strong className="text-blue-400">ordered</strong>, or <strong className="text-amber-400">pending</strong>. Lot tracking supported.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Status: "received" | Lot: "LOT-2026-09A"</div>
              </div>

              {/* Optional: Payment Details */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Payment Status & Method</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Status: <code>paid</code>, <code>partial</code>, <code>due</code>. Method: <code>cash</code>, <code>bank_transfer</code>, <code>credit_card</code>.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">Status: "paid" | Method: "bank_transfer"</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone & Default Settings Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: File Upload Dropzone */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">1</span>
              <span>Upload Purchases Spreadsheet</span>
            </div>
            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setSheetNames([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear File</span>
              </button>
            )}
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
                  {(file.size / 1024).toFixed(1)} KB &bull; Click or drop a new file to replace
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
                  Accepts Excel spreadsheets (.xlsx, .xls) and standard CSV files (.csv)
                </div>
              </div>
            )}
          </div>

          {sheetNames.length > 1 && (
            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Selected Worksheet:</span>
              <select
                value={selectedSheet}
                onChange={(e) => {
                  const sName = e.target.value;
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const buffer = evt.target?.result;
                      const wb = XLSX.read(buffer, { type: 'array' });
                      processWorkbook(wb, sName);
                    };
                    reader.readAsArrayBuffer(file);
                  }
                }}
                className="bg-slate-900 text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
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

        {/* Right: Default Configuration & Overrides */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">2</span>
              <span>Default Import Options</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Default Receiving Location
                </label>
                <select
                  value={fallbackLocationId}
                  onChange={(e) => setFallbackLocationId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  {locations?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Used if spreadsheet row does not specify a location.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Default Order Status
                </label>
                <select
                  value={defaultOrderStatus}
                  onChange={(e) => setDefaultOrderStatus(e.target.value as any)}
                  className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="received">Received / Inward Stocked (Adds to Warehouse Stock)</option>
                  <option value="ordered">Ordered (Pending Delivery)</option>
                  <option value="pending">Pending Inward Review</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateProducts}
                    onChange={(e) => setAutoCreateProducts(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-slate-300 font-medium">
                    Auto-create missing products in inventory
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateSuppliers}
                    onChange={(e) => setAutoCreateSuppliers(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-slate-300 font-medium">
                    Auto-create missing supplier profiles
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-900/40 text-[11px] text-indigo-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              Rows sharing identical <strong>PO / Invoice No</strong> will be consolidated into a single multi-item Purchase invoice.
            </span>
          </div>
        </div>
      </div>

      {/* Parsed Data Preview & Validation Table */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          {/* Section Header & Metrics */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">3</span>
                <span>Review & Validate Parsed Purchases ({parsedRows.length} Line Items)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Inspect parsed records, check mandatory validations, and choose items to import into the ERP system.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{validRowsCount} Valid</span>
                </span>
                {invalidRowsCount > 0 && (
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold pl-3 border-l border-slate-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{invalidRowsCount} Invalid</span>
                  </span>
                )}
                <span className="text-slate-400 pl-3 border-l border-slate-800">
                  Total Value: <strong className="text-white font-mono">{formatCurrency(totalValueParsed, settings)}</strong>
                </span>
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={selectedRowsCount === 0 || isImporting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition cursor-pointer ${
                  selectedRowsCount > 0 && !isImporting
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isImporting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Importing Purchases...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Import {selectedRowsCount} Selected Line Items</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by supplier, product, or PO..."
                className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({parsedRows.length})
              </button>
              <button
                onClick={() => setStatusFilter('valid')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'valid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                Valid ({validRowsCount})
              </button>
              {invalidRowsCount > 0 && (
                <button
                  onClick={() => setStatusFilter('invalid')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === 'invalid'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-rose-400/80 hover:text-rose-300'
                  }`}
                >
                  Invalid ({invalidRowsCount})
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRowsCount > 0 && selectedRowsCount === validRowsCount}
                      onChange={(e) => handleSelectAllToggle(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      title="Select / Deselect all valid rows"
                    />
                  </th>
                  <th className="p-3">Status</th>
                  <th className="p-3">PO Invoice No</th>
                  <th className="p-3">Purchase Date* (DD-MM-YYYY)</th>
                  <th className="p-3">Supplier Name*</th>
                  <th className="p-3">Product Name*</th>
                  <th className="p-3">Product SKU</th>
                  <th className="p-3 text-right">Qty*</th>
                  <th className="p-3 text-right">Unit Cost*</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      !row.isValid
                        ? 'bg-rose-950/15 hover:bg-rose-950/25'
                        : row.selected
                        ? 'bg-indigo-950/15 hover:bg-indigo-950/25'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={!row.isValid}
                        onChange={() => handleSelectRowToggle(row.id)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>

                    <td className="p-3">
                      {row.isValid ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Valid</span>
                          </span>
                          {row.validationWarnings.length > 0 && (
                            <span className="text-[10px] text-amber-400/90 truncate max-w-[140px]" title={row.validationWarnings.join(', ')}>
                              {row.validationWarnings[0]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Error</span>
                          </span>
                          <span className="text-[10px] text-rose-400 truncate max-w-[160px]" title={row.validationErrors.join(', ')}>
                            {row.validationErrors[0]}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-mono font-medium text-slate-300">
                      {row.invoiceNo || <span className="text-slate-500 italic text-[11px]">(Auto-gen)</span>}
                    </td>

                    <td className="p-3 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                      {row.date && row.date.includes('-') && row.date.split('-').length === 3 && row.date.split('-')[0].length === 4
                        ? row.date.split('-').reverse().join('-')
                        : row.date}
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-white">{row.supplierName || <span className="text-rose-400">Missing</span>}</div>
                      {row.matchedSupplierId ? (
                        <span className="text-[10px] text-emerald-400">Matched Supplier</span>
                      ) : row.supplierName ? (
                        <span className="text-[10px] text-amber-400">New Supplier</span>
                      ) : null}
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-white">{row.productName || row.productIdentifier || <span className="text-rose-400">Missing</span>}</div>
                      {row.matchedProductId ? (
                        <span className="text-[10px] text-emerald-400">Matched: {row.matchedProductName}</span>
                      ) : (row.productName || row.productIdentifier) ? (
                        <span className="text-[10px] text-amber-400">New Product</span>
                      ) : null}
                    </td>

                    <td className="p-3 font-mono text-[11px]">
                      {row.productSku ? (
                        <span className="text-indigo-300 font-bold bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                          {row.productSku}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[10px]">(Auto-allocated)</span>
                      )}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-white">
                      {row.quantity > 0 ? row.quantity : <span className="text-rose-400">0</span>}
                    </td>

                    <td className="p-3 text-right font-mono text-slate-200">
                      {formatCurrency(row.unitCostPrice, settings)}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(row.total, settings)}
                    </td>

                    <td className="p-3 text-slate-400">
                      {row.locationName}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.purchaseStatus === 'received'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : row.purchaseStatus === 'ordered'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {row.purchaseStatus.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.paymentStatus === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : row.paymentStatus === 'partial'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {row.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="text-slate-400">
              Selected <strong className="text-white">{selectedRowsCount}</strong> of <strong className="text-white">{validRowsCount}</strong> valid purchase records ({parsedRows.length} total rows)
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={selectedRowsCount === 0 || isImporting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition cursor-pointer ${
                  selectedRowsCount > 0 && !isImporting
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isImporting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm & Import Purchases ({selectedRowsCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
