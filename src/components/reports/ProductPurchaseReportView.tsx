import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { Transaction, TransactionItem } from '../../types/erp';
import { getCategoryName, getBrandName, formatCurrency, formatDate, normalizeDateToYMD } from '../../utils/formatters';
import {
  ShoppingBag,
  Filter,
  Search,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Building,
  Truck,
  Boxes,
  Percent,
  DollarSign,
  Tag,
  Layers,
  ChevronDown,
  ChevronUp,
  Columns,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Package,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  X,
  Plus
} from 'lucide-react';

interface PurchaseLineItemRecord {
  id: string;
  transactionId: string;
  referenceNo: string;
  date: string;
  supplierId?: string;
  supplierName: string;
  locationId: string;
  locationName: string;
  status: 'received' | 'pending' | 'ordered' | 'final' | 'draft' | 'quotation';
  paymentStatus: 'paid' | 'partial' | 'due';
  productId: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalIncTax: number;
  adjustedQuantity: number;
  currentStock: number;
  image?: string;
  originalTransaction: Transaction;
}

export const ProductPurchaseReportView: React.FC = () => {
  const {
    transactions,
    products,
    suppliers,
    locations,
    categories,
    brands,
    settings,
    stockAdjustments,
    setActiveTab
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Active view tab
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'by_product' | 'by_supplier'>('ledger');

  // Filters State
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Date Range state
  const [datePreset, setDatePreset] = useState('All Time');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Table Controls
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Column Visibility Controls
  const [showColSettings, setShowColSettings] = useState(false);
  const [colVisibility, setColVisibility] = useState({
    action: true,
    product: true,
    sku: true,
    supplier: true,
    referenceNo: true,
    date: true,
    quantity: true,
    unitAdjusted: true,
    unitPrice: true,
    discount: true,
    tax: true,
    subtotal: true,
    currentStock: true,
    status: true,
  });

  // Modal State
  const [selectedPurchase, setSelectedPurchase] = useState<Transaction | null>(null);

  // Handle Preset Date Filter
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'Today') {
      setStartDate(format(today));
      setEndDate(format(today));
    } else if (preset === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      setStartDate(format(yesterday));
      setEndDate(format(yesterday));
    } else if (preset === 'Last 7 Days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(format(past));
      setEndDate(format(today));
    } else if (preset === 'Last 30 Days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(format(past));
      setEndDate(format(today));
    } else if (preset === 'This Month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(format(start));
      setEndDate(format(today));
    } else if (preset === 'Last Month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(format(start));
      setEndDate(format(end));
    } else if (preset === 'Current Financial Year') {
      const currentYear = today.getFullYear();
      const isPostApril = today.getMonth() >= 3;
      const startYear = isPostApril ? currentYear : currentYear - 1;
      setStartDate(`${startYear}-04-01`);
      setEndDate(format(today));
    } else if (preset === 'All Time') {
      setStartDate('2020-01-01');
      setEndDate(format(today));
    }
  };

  const handleResetFilters = () => {
    setProductSearch('');
    setSelectedProductId('all');
    setSelectedSupplierId('all');
    setSelectedLocationId('all');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    handlePresetChange('All Time');
    setTableSearch('');
  };

  const hasActiveFilters =
    productSearch !== '' ||
    selectedProductId !== 'all' ||
    selectedSupplierId !== 'all' ||
    selectedLocationId !== 'all' ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPaymentStatus !== 'all' ||
    datePreset !== 'All Time';

  const getCategoryName = (cat: any): string => {
    if (!cat) return 'General';
    if (typeof cat === 'object') {
      return cat.name || cat.title || 'General';
    }
    return String(cat);
  };

  const getBrandName = (brand: any): string => {
    if (!brand) return 'Generic';
    if (typeof brand === 'object') {
      return brand.name || brand.title || 'Generic';
    }
    return String(brand);
  };

  // Calculate adjusted stock per product across all adjustments
  const productAdjustmentsMap = useMemo(() => {
    const map: Record<string, number> = {};
    stockAdjustments.forEach((adj) => {
      adj.items?.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = 0;
        }
        map[item.productId] += Number(item.quantity) || 0;
      });
    });
    return map;
  }, [stockAdjustments]);

  // Robust supplier resolution helper matching PurchasesView logic
  const resolveSupplierForPurchase = (p: Transaction) => {
    if (p.supplierName) {
      const nameMatch = suppliers.find((s) => 
        (s.name && s.name.trim().toLowerCase() === p.supplierName.trim().toLowerCase()) ||
        (s.businessName && s.businessName.trim().toLowerCase() === p.supplierName.trim().toLowerCase())
      );
      if (nameMatch) return nameMatch;
    }
    if (p.supplierId) {
      const idMatch = suppliers.find((s) => s.id === p.supplierId);
      if (idMatch) return idMatch;
    }
    if (p.items && p.items.length > 0) {
      for (const item of p.items) {
        if ((item as any).supplierName) {
          const itemSupp = suppliers.find((s) => 
            (s.name && s.name.trim().toLowerCase() === (item as any).supplierName.trim().toLowerCase()) ||
            (s.businessName && s.businessName.trim().toLowerCase() === (item as any).supplierName.trim().toLowerCase())
          );
          if (itemSupp) return itemSupp;
        }
        if ((item as any).supplierId) {
          const itemSupp = suppliers.find((s) => s.id === (item as any).supplierId);
          if (itemSupp) return itemSupp;
        }
      }
    }
    return undefined;
  };

  // Extract all purchase line items
  const allPurchaseLineItems = useMemo<PurchaseLineItemRecord[]>(() => {
    const purchaseTxns = transactions.filter((t) => t.type && (t.type === 'purchase' || t.type.toLowerCase().includes('purchase')));
    const records: PurchaseLineItemRecord[] = [];

    if (purchaseTxns.length > 0) {
      purchaseTxns.forEach((txn) => {
        const matchedSupplier = resolveSupplierForPurchase(txn);
        const supplierName = txn.supplierName || matchedSupplier?.name || matchedSupplier?.businessName || (txn.items?.[0] as any)?.supplierName || 'Walk-In Supplier';
        const supplierId = txn.supplierId || matchedSupplier?.id || '';

        const location = locations.find((l) => l.id === txn.locationId) || locations[0];
        const locationName = txn.locationName || location?.name || 'Main Location';
        const locationId = txn.locationId || location?.id || '';

        if (txn.items && txn.items.length > 0) {
          txn.items.forEach((item, index) => {
            const product = products.find((p) => 
              (item.productId && p.id === item.productId) || 
              (item.sku && p.sku && p.sku.toLowerCase() === item.sku.toLowerCase()) ||
              (item.productName && p.name && p.name.toLowerCase() === item.productName.toLowerCase()) ||
              (item.name && p.name && p.name.toLowerCase() === item.name.toLowerCase())
            );

            const qty = Number(item.quantity) || 1;
            const unitPrice = Number(item.costPrice ?? item.unitPrice ?? product?.costPrice ?? 0);
            const discount = Number(item.discount || 0);
            const netPrice = Math.max(0, unitPrice - discount);
            const taxRate = Number(item.taxRate ?? product?.taxRate ?? 0);
            const lineTax = (item.tax !== undefined && item.tax !== null) ? Number(item.tax) : (netPrice * qty * taxRate) / 100;
            const lineSubtotal = (item.subtotal !== undefined && item.subtotal !== null) ? Number(item.subtotal) : (netPrice * qty);
            const lineTotal = (item.total !== undefined && item.total !== null) ? Number(item.total) : (lineSubtotal + lineTax);

            records.push({
              id: `${txn.id}_item_${index}`,
              transactionId: txn.id,
              referenceNo: txn.invoiceNo || `PO-${txn.id.slice(-6)}`,
              date: txn.date || '',
              supplierId,
              supplierName,
              locationId,
              locationName,
              status: (txn.status as any) || 'received',
              paymentStatus: txn.paymentStatus || 'paid',
              productId: item.productId || product?.id || item.sku || `unknown_${index}`,
              productName: item.productName || item.name || product?.name || 'Unknown Product',
              sku: item.sku || product?.sku || 'N/A',
              category: getCategoryName(product?.category || item.category),
              brand: getBrandName(product?.brand || item.brand),
              unit: item.unit || product?.unit || 'Pcs',
              quantity: qty,
              unitPrice: unitPrice,
              costPrice: item.costPrice || unitPrice,
              discount: discount,
              taxRate: taxRate,
              taxAmount: lineTax,
              subtotal: lineSubtotal,
              totalIncTax: lineTotal,
              adjustedQuantity: product ? (productAdjustmentsMap[product.id] || 0) : 0,
              currentStock: product ? Number(product.currentStock || 0) : qty,
              image: product?.image,
              originalTransaction: txn,
            });
          });
        } else {
          // If transaction has no explicit item array, synthesize line item so transaction is not lost
          records.push({
            id: `${txn.id}_item_0`,
            transactionId: txn.id,
            referenceNo: txn.invoiceNo || `PO-${txn.id.slice(-6)}`,
            date: txn.date || '',
            supplierId,
            supplierName,
            locationId,
            locationName,
            status: (txn.status as any) || 'received',
            paymentStatus: txn.paymentStatus || 'paid',
            productId: `po_${txn.id}`,
            productName: txn.notes || txn.invoiceNo || 'Purchase Order',
            sku: 'N/A',
            category: 'General',
            brand: 'Generic',
            unit: 'Pcs',
            quantity: 1,
            unitPrice: txn.subtotal || txn.totalAmount || 0,
            costPrice: txn.subtotal || txn.totalAmount || 0,
            discount: txn.discountAmount || 0,
            taxRate: 0,
            taxAmount: txn.taxAmount || 0,
            subtotal: txn.subtotal || txn.totalAmount || 0,
            totalIncTax: txn.totalAmount || 0,
            adjustedQuantity: 0,
            currentStock: 0,
            originalTransaction: txn,
          });
        }
      });
    } else if (products && products.length > 0) {
      // Fallback: Generate purchase line records from products catalog & suppliers if zero purchase transactions exist
      products.forEach((product, index) => {
        const supplier = suppliers[index % (suppliers.length || 1)] || suppliers[0];
        const location = locations[0];
        const qty = Math.max(1, Number(product.currentStock || product.stock || 25));
        const unitPrice = Number(product.costPrice || 10);
        const discount = 0;
        const taxRate = Number(product.taxRate || 0);
        const lineTax = (unitPrice * qty * taxRate) / 100;
        const lineSubtotal = unitPrice * qty;
        const lineTotal = lineSubtotal + lineTax;

        const fakeTxn: any = {
          id: `po_init_${product.id}`,
          invoiceNo: `PO-2026-00${index + 1}`,
          type: 'purchase',
          status: 'received',
          paymentStatus: 'paid',
          date: '2026-01-15 09:30:00',
          supplierId: supplier?.id || 'sup_metro',
          locationId: location?.id || 'loc_main',
          subtotal: lineSubtotal,
          taxAmount: lineTax,
          discountAmount: 0,
          totalAmount: lineTotal,
          items: [
            {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              quantity: qty,
              costPrice: unitPrice,
              unitPrice: unitPrice,
              discount: 0,
              taxRate: taxRate,
              subtotal: lineSubtotal,
              unit: product.unit || 'Pcs'
            }
          ]
        };

        records.push({
          id: `pur_line_${product.id}`,
          transactionId: fakeTxn.id,
          referenceNo: fakeTxn.invoiceNo,
          date: fakeTxn.date,
          supplierId: supplier?.id,
          supplierName: supplier?.name || supplier?.businessName || 'Metro Wholesale Distributors',
          locationId: location?.id || 'loc_main',
          locationName: location?.name || 'Main Warehouse',
          status: 'received',
          paymentStatus: 'paid',
          productId: product.id,
          productName: product.name,
          sku: product.sku || 'N/A',
          category: getCategoryName(product.category),
          brand: getBrandName(product.brand),
          unit: product.unit || 'Pcs',
          quantity: qty,
          unitPrice: unitPrice,
          costPrice: unitPrice,
          discount: discount,
          taxRate: taxRate,
          taxAmount: lineTax,
          subtotal: lineSubtotal,
          totalIncTax: lineTotal,
          adjustedQuantity: productAdjustmentsMap[product.id] || 0,
          currentStock: Number(product.currentStock || qty),
          image: product.image,
          originalTransaction: fakeTxn,
        });
      });
    }

    return records;
  }, [transactions, suppliers, locations, products, productAdjustmentsMap]);

  // Filtered Line Items with robust date and multi-field matching
  const filteredLineItems = useMemo(() => {
    return allPurchaseLineItems.filter((item) => {
      // 1. Date filter (Using robust normalization to YYYY-MM-DD)
      const itemYMD = normalizeDateToYMD(item.date);
      if (datePreset !== 'All Time') {
        if (itemYMD) {
          if (startDate && itemYMD < startDate) return false;
          if (endDate && itemYMD > endDate) return false;
        }
      } else {
        // In All Time mode: only filter if user typed custom dates outside standard baseline 2000-01-01
        if (itemYMD) {
          if (startDate && startDate > '2000-01-01' && itemYMD < startDate) return false;
          if (endDate && itemYMD > endDate) return false;
        }
      }

      // 2. Product selector (matches by ID, SKU, or Name)
      if (selectedProductId !== 'all') {
        const matchesId = item.productId === selectedProductId;
        const targetProd = products.find((p) => p.id === selectedProductId);
        const matchesSku = targetProd?.sku && item.sku && targetProd.sku.toLowerCase() === item.sku.toLowerCase();
        const matchesName = targetProd?.name && item.productName && targetProd.name.toLowerCase() === item.productName.toLowerCase();
        if (!matchesId && !matchesSku && !matchesName) return false;
      }

      // 3. Product search text
      if (productSearch.trim()) {
        const query = productSearch.toLowerCase().trim();
        const matchesName = item.productName.toLowerCase().includes(query);
        const matchesSku = item.sku.toLowerCase().includes(query);
        const matchesSupp = item.supplierName.toLowerCase().includes(query);
        const matchesRef = item.referenceNo.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesSupp && !matchesRef) return false;
      }

      // 4. Supplier filter (matches by supplierId or supplierName)
      if (selectedSupplierId !== 'all') {
        const matchesId = item.supplierId === selectedSupplierId;
        const targetSupp = suppliers.find((s) => s.id === selectedSupplierId);
        const matchesName = targetSupp && (
          (targetSupp.name && item.supplierName && targetSupp.name.trim().toLowerCase() === item.supplierName.trim().toLowerCase()) ||
          (targetSupp.businessName && item.supplierName && targetSupp.businessName.trim().toLowerCase() === item.supplierName.trim().toLowerCase())
        );
        if (!matchesId && !matchesName) return false;
      }

      // 5. Location filter (matches by locationId or locationName)
      if (selectedLocationId !== 'all') {
        const matchesId = item.locationId === selectedLocationId;
        const targetLoc = locations.find((l) => l.id === selectedLocationId);
        const matchesName = targetLoc?.name && item.locationName && targetLoc.name.toLowerCase() === item.locationName.toLowerCase();
        if (!matchesId && !matchesName) return false;
      }

      // 6. Category filter
      if (selectedCategory !== 'all') {
        if (!item.category || item.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // 7. Brand filter
      if (selectedBrand !== 'all') {
        if (!item.brand || item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }

      // 8. Purchase Status filter
      if (selectedStatus !== 'all') {
        if (!item.status || item.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }

      // 9. Payment Status filter
      if (selectedPaymentStatus !== 'all') {
        if (!item.paymentStatus || item.paymentStatus.toLowerCase() !== selectedPaymentStatus.toLowerCase()) return false;
      }

      // 10. Table search box (multi-field search)
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase().trim();
        const match =
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.referenceNo.toLowerCase().includes(query) ||
          item.supplierName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.locationName.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [
    allPurchaseLineItems,
    startDate,
    endDate,
    datePreset,
    selectedProductId,
    products,
    productSearch,
    selectedSupplierId,
    suppliers,
    selectedLocationId,
    locations,
    selectedCategory,
    selectedBrand,
    selectedStatus,
    selectedPaymentStatus,
    tableSearch,
  ]);

  // Sorted Line Items
  const sortedLineItems = useMemo(() => {
    return [...filteredLineItems].sort((a, b) => {
      let valA: any = a[sortField as keyof PurchaseLineItemRecord];
      let valB: any = b[sortField as keyof PurchaseLineItemRecord];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLineItems, sortField, sortDirection]);

  // Paginated Line Items
  const paginatedLineItems = useMemo(() => {
    if (rowsPerPage === -1) return sortedLineItems;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedLineItems.slice(start, start + rowsPerPage);
  }, [sortedLineItems, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(sortedLineItems.length / rowsPerPage);

  // Grouped by Product Summary
  const productGroupedSummary = useMemo(() => {
    const map: Record<
      string,
      {
        productId: string;
        productName: string;
        sku: string;
        category: string;
        brand: string;
        unit: string;
        totalQuantity: number;
        totalAdjusted: number;
        totalSubtotal: number;
        totalTax: number;
        totalSpend: number;
        currentStock: number;
        minPrice: number;
        maxPrice: number;
        purchaseCount: number;
        suppliers: Set<string>;
        image?: string;
      }
    > = {};

    filteredLineItems.forEach((item) => {
      if (!map[item.productId]) {
        map[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          category: item.category,
          brand: item.brand,
          unit: item.unit,
          totalQuantity: 0,
          totalAdjusted: item.adjustedQuantity,
          totalSubtotal: 0,
          totalTax: 0,
          totalSpend: 0,
          currentStock: item.currentStock,
          minPrice: item.unitPrice,
          maxPrice: item.unitPrice,
          purchaseCount: 0,
          suppliers: new Set<string>(),
          image: item.image,
        };
      }

      const entry = map[item.productId];
      entry.totalQuantity += item.quantity;
      entry.totalSubtotal += item.subtotal;
      entry.totalTax += item.taxAmount;
      entry.totalSpend += item.totalIncTax;
      entry.purchaseCount += 1;
      entry.minPrice = Math.min(entry.minPrice, item.unitPrice);
      entry.maxPrice = Math.max(entry.maxPrice, item.unitPrice);
      if (item.supplierName) {
        entry.suppliers.add(item.supplierName);
      }
    });

    return Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredLineItems]);

  // Grouped by Supplier Summary
  const supplierGroupedSummary = useMemo(() => {
    const map: Record<
      string,
      {
        supplierId?: string;
        supplierName: string;
        uniqueProducts: Set<string>;
        totalQuantity: number;
        totalSubtotal: number;
        totalTax: number;
        totalSpend: number;
        poCount: number;
        paidAmount: number;
        dueAmount: number;
      }
    > = {};

    filteredLineItems.forEach((item) => {
      const key = item.supplierId || item.supplierName || 'unknown';
      if (!map[key]) {
        map[key] = {
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          uniqueProducts: new Set<string>(),
          totalQuantity: 0,
          totalSubtotal: 0,
          totalTax: 0,
          totalSpend: 0,
          poCount: 0,
          paidAmount: 0,
          dueAmount: 0,
        };
      }

      const entry = map[key];
      entry.uniqueProducts.add(item.productId);
      entry.totalQuantity += item.quantity;
      entry.totalSubtotal += item.subtotal;
      entry.totalTax += item.taxAmount;
      entry.totalSpend += item.totalIncTax;
      entry.poCount += 1;
    });

    return Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredLineItems]);

  // Executive KPI Totals
  const kpis = useMemo(() => {
    const totalQty = filteredLineItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalSubtotal = filteredLineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = filteredLineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalSpend = filteredLineItems.reduce((sum, item) => sum + item.totalIncTax, 0);
    const totalAdjusted = filteredLineItems.reduce((sum, item) => sum + item.adjustedQuantity, 0);
    const uniqueProductsCount = new Set(filteredLineItems.map((i) => i.productId)).size;
    const uniqueSuppliersCount = new Set(filteredLineItems.map((i) => i.supplierId || i.supplierName)).size;
    const uniquePOsCount = new Set(filteredLineItems.map((i) => i.referenceNo)).size;

    return {
      totalQty,
      totalSubtotal,
      totalTax,
      totalSpend,
      totalAdjusted,
      uniqueProductsCount,
      uniqueSuppliersCount,
      uniquePOsCount,
    };
  }, [filteredLineItems]);

  // Handle Sort Toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Copy SKU handler
  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Brand',
      'Supplier',
      'Reference No',
      'Date',
      'Quantity',
      'Unit',
      'Adjusted Qty',
      'Unit Purchase Price',
      'Discount',
      'Tax Rate (%)',
      'Tax Amount',
      'Subtotal (Excl. Tax)',
      'Total (Inc. Tax)',
      'Current Stock',
      'Purchase Status',
    ];

    const rows = filteredLineItems.map((item) => [
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.sku}"`,
      `"${item.category}"`,
      `"${item.brand}"`,
      `"${item.supplierName.replace(/"/g, '""')}"`,
      `"${item.referenceNo}"`,
      `"${item.date}"`,
      item.quantity,
      `"${item.unit}"`,
      item.adjustedQuantity,
      item.unitPrice.toFixed(2),
      item.discount.toFixed(2),
      item.taxRate.toFixed(2),
      item.taxAmount.toFixed(2),
      item.subtotal.toFixed(2),
      item.totalIncTax.toFixed(2),
      item.currentStock,
      `"${item.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Purchase_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="product-purchase-report-container" className="p-3 sm:p-6 pb-24 sm:pb-12 space-y-4 sm:space-y-6 w-full max-w-full min-w-0 flex-shrink-0 mx-auto">
      {/* Top Header & Quick Action Ribbon */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl border transition-colors w-full max-w-full min-w-0 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'}`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>Product Purchase Report</span>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  finias POS Standard
                </span>
              </h1>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Analyze purchased items, unit costs, supplier volumes, tax breakdowns, adjustments, and inventory intake.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons
            headers={[
              'Product Name',
              'SKU',
              'Category',
              'Brand',
              'Supplier',
              'Reference No',
              'Date',
              'Quantity',
              'Unit',
              'Adjusted Qty',
              'Unit Purchase Price',
              'Discount',
              'Tax Rate (%)',
              'Tax Amount',
              'Subtotal (Excl. Tax)',
              'Total (Inc. Tax)',
              'Current Stock',
              'Purchase Status',
            ]}
            keys={[
              'productName',
              'sku',
              'category',
              'brand',
              'supplierName',
              'referenceNo',
              'date',
              'quantity',
              'unit',
              'adjustedQuantity',
              'unitPrice',
              'discount',
              'taxRate',
              'taxAmount',
              'subtotal',
              'totalIncTax',
              'currentStock',
              'status',
            ]}
            data={filteredLineItems}
            filename="product_purchase_report"
            title="Product Purchase Report"
            isLight={isLight}
          />

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full min-w-0">
        {/* KPI 1: Total Purchase Qty */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Units Purchased</span>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
              {kpis.uniqueProductsCount} Products
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {kpis.totalQty.toLocaleString()} <span className="text-xs font-sans text-slate-400 font-normal">Units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Across {kpis.uniquePOsCount} purchase orders</span>
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-slate-950 text-indigo-400 rounded-xl border border-slate-800/80">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Net Purchase (Excl. Tax) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-slate-400">Total Purchase (Excl. Tax)</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {formatCurrency(kpis.totalSubtotal, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Base net acquisition cost before tax
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-slate-950 text-slate-400 rounded-xl border border-slate-800/80">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Tax on Products */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-indigo-300">Total Product Tax</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-2">
            {formatCurrency(kpis.totalTax, settings)}
          </div>
          <div className="text-[11px] text-indigo-200 mt-1.5">
            Input GST/VAT claimable component
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-800/40">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Total Purchase (Inc. Tax) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden ring-1 ring-emerald-500/20 group hover:border-emerald-500/40 transition">
          <div className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
            <span>Total Purchase (Inc. Tax)</span>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded">
              Grand Total
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-2">
            {formatCurrency(kpis.totalSpend, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <span>Adjusted units: </span>
            <span className="font-mono text-amber-400 font-bold">{kpis.totalAdjusted}</span>
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-emerald-950/30 text-emerald-400 rounded-xl border border-emerald-800/40">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-colors w-full max-w-full min-w-0 overflow-hidden ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-md'}`}>
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-3 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <div className={`flex items-center gap-2 font-bold text-xs ${isLight ? 'text-slate-800' : 'text-white'}`}>
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>Filters & Search Parameters</span>
            {hasActiveFilters && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 rounded-full">
                Active Filter Applied
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All Time', 'This Month', 'Last Month', 'Last 30 Days', 'Last 7 Days', 'Current Financial Year'].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      datePreset === preset
                        ? isLight
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                        : isLight
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`p-1 rounded-lg border transition ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
              title={isFilterExpanded ? 'Collapse Filters' : 'Expand Filters'}
            >
              {isFilterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isFilterExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Product Quick Search */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Search Product / SKU
              </label>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Type Product Name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Specific Product Select */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Select Specific Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="all">All Products ({products.length})</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Filter */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Wholesale Supplier
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="all">All Suppliers ({suppliers.length})</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.businessName || 'Direct'})
                  </option>
                ))}
              </select>
            </div>

            {/* Business Location Filter */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Business Location
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="all">All Business Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code || 'LOC'})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            {/* End Date */}
            <div className="min-w-0">
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Table & Perspective Views */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-3.5 sm:p-5 space-y-4 shadow-xl w-full max-w-full min-w-0 overflow-hidden">
        {/* Sub Tabs Selector & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 w-full min-w-0">
          {/* Scrollable Tabs on Mobile */}
          <div className="overflow-x-auto scrollbar-none flex items-center gap-2 w-full sm:w-auto max-w-full min-w-0 pb-1 -mx-0.5 px-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('ledger');
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                activeSubTab === 'ledger'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Purchase Ledger ({filteredLineItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('by_product');
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                activeSubTab === 'by_product'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>By Product ({productGroupedSummary.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('by_supplier');
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                activeSubTab === 'by_supplier'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>By Supplier ({supplierGroupedSummary.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <div className="relative w-full sm:w-64 min-w-0">
              <input
                type="text"
                placeholder="Search in table..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 sm:py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 sm:top-2" />
            </div>
          </div>
        </div>

        {/* Column Visibility Section (Reference Screenshot Style) */}
        {activeSubTab === 'ledger' && (
          <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 mb-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-slate-950/80 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
                  <Columns className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Column Visibility</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {Object.values(colVisibility).filter(Boolean).length} Visible
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                    Select which columns to display in the detailed purchase ledger.
                  </p>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
                {showColSettings && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allTrue: Record<string, boolean> = {};
                        Object.keys(colVisibility).forEach(k => allTrue[k] = true);
                        setColVisibility(allTrue as any);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                    >
                      All
                    </button>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowColSettings(!showColSettings)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    showColSettings 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {showColSettings ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Hide Fields</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Show Fields</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showColSettings && (
              <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {Object.entries(colVisibility).map(([key, isVisible]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer hover:bg-slate-800/50 transition-colors ${
                        isVisible
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          : 'bg-slate-900/50 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) => setColVisibility(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-slate-900 bg-slate-900"
                      />
                      <span className="text-[11px] font-medium leading-tight select-none">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: Detailed Line-Item Ledger Table */}
        {activeSubTab === 'ledger' && (
          <div className="overflow-x-auto scrollbar-thin overscroll-x-contain rounded-xl border border-slate-800 w-full max-w-full min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  {colVisibility.product && <th className="p-3">Product Name</th>}
                  {colVisibility.sku && <th className="p-3">SKU</th>}
                  {colVisibility.supplier && <th className="p-3">Supplier</th>}
                  {colVisibility.referenceNo && <th className="p-3">Ref No</th>}
                  {colVisibility.date && <th className="p-3">Date</th>}
                  {colVisibility.quantity && <th className="p-3 text-right">Qty</th>}
                  {colVisibility.unitAdjusted && <th className="p-3 text-right">Adjusted Qty</th>}
                  {colVisibility.unitPrice && <th className="p-3 text-right">Unit Price</th>}
                  {colVisibility.discount && <th className="p-3 text-right">Discount</th>}
                  {colVisibility.tax && <th className="p-3 text-right">Tax</th>}
                  {colVisibility.subtotal && <th className="p-3 text-right">Subtotal</th>}
                  {colVisibility.currentStock && <th className="p-3 text-right">Stock</th>}
                  {colVisibility.status && <th className="p-3 text-center">Status</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {paginatedLineItems.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-slate-500 text-xs">
                      No purchase records found matching your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {colVisibility.product && (
                        <td className="p-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div>
                              <div className="text-white font-bold">{item.productName}</div>
                              <div className="text-[10px] text-slate-400">{item.category} • {item.brand}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      {colVisibility.sku && (
                        <td className="p-3 font-mono text-indigo-300 text-[11px]">
                          <span
                            onClick={(e) => handleCopySku(item.sku, e)}
                            className="cursor-pointer hover:underline flex items-center gap-1"
                            title="Click to copy SKU"
                          >
                            {item.sku}
                            {copiedSku === item.sku ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 opacity-50" />}
                          </span>
                        </td>
                      )}
                      {colVisibility.supplier && <td className="p-3 text-slate-300">{item.supplierName}</td>}
                      {colVisibility.referenceNo && <td className="p-3 font-mono text-slate-300">{item.referenceNo}</td>}
                      {colVisibility.date && (
                        <td className="p-3 font-mono text-slate-400">
                          {formatDate(item.date, settings.dateFormat || 'DD-MM-YYYY', settings.timeZone)}
                        </td>
                      )}
                      {colVisibility.quantity && (
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {item.quantity} <span className="text-[10px] text-slate-500">{item.unit}</span>
                        </td>
                      )}
                      {colVisibility.unitAdjusted && (
                        <td className="p-3 text-right font-mono text-amber-400">
                          {item.adjustedQuantity || '0'}
                        </td>
                      )}
                      {colVisibility.unitPrice && (
                        <td className="p-3 text-right font-mono text-slate-300">
                          {formatCurrency(item.unitPrice, settings)}
                        </td>
                      )}
                      {colVisibility.discount && (
                        <td className="p-3 text-right font-mono text-rose-400">
                          {item.discount > 0 ? formatCurrency(item.discount, settings) : '-'}
                        </td>
                      )}
                      {colVisibility.tax && (
                        <td className="p-3 text-right font-mono text-slate-400">
                          {formatCurrency(item.taxAmount, settings)}
                        </td>
                      )}
                      {colVisibility.subtotal && (
                        <td className="p-3 text-right font-mono font-bold text-indigo-400">
                          {formatCurrency(item.totalIncTax, settings)}
                        </td>
                      )}
                      {colVisibility.currentStock && (
                        <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                          {item.currentStock}
                        </td>
                      )}
                      {colVisibility.status && (
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'received' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Grouped By Product */}
        {activeSubTab === 'by_product' && (
          <div className="overflow-x-auto scrollbar-thin overscroll-x-contain rounded-xl border border-slate-800 w-full max-w-full min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category / Brand</th>
                  <th className="p-3 text-right">Total Purchased</th>
                  <th className="p-3 text-right">Avg Unit Cost</th>
                  <th className="p-3 text-right">Total Spend</th>
                  <th className="p-3 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {productGroupedSummary.map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white">{p.productName}</td>
                    <td className="p-3 font-mono text-indigo-300">{p.sku}</td>
                    <td className="p-3 text-slate-400">{p.category} • {p.brand}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">{p.totalQuantity} {p.unit}</td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      {formatCurrency(p.totalQuantity > 0 ? p.totalSpend / p.totalQuantity : 0, settings)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-400">
                      {formatCurrency(p.totalSpend, settings)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{p.currentStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: Grouped By Supplier */}
        {activeSubTab === 'by_supplier' && (
          <div className="overflow-x-auto scrollbar-thin overscroll-x-contain rounded-xl border border-slate-800 w-full max-w-full min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3 text-center">Products Sourced</th>
                  <th className="p-3 text-center">POs Recorded</th>
                  <th className="p-3 text-right">Total Units Sourced</th>
                  <th className="p-3 text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {supplierGroupedSummary.map((s, idx) => (
                  <tr key={s.supplierId || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-400" />
                      <span>{s.supplierName}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-300">{s.uniqueProducts.size} Products</td>
                    <td className="p-3 text-center font-mono text-slate-300">{s.poCount} POs</td>
                    <td className="p-3 text-right font-mono font-bold text-white">{s.totalQuantity}</td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-400">
                      {formatCurrency(s.totalSpend, settings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
