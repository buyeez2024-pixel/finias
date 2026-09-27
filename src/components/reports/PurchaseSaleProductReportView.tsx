import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction, Product } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import {
  Boxes,
  ShoppingBag,
  TrendingUp,
  Filter,
  Search,
  Printer,
  FileSpreadsheet,
  Calendar,
  Building,
  Truck,
  Users,
  DollarSign,
  Tag,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Package,
  FileText,
  SlidersHorizontal,
  ArrowRightLeft,
  X,
  Scale,
  Percent,
  Plus
} from 'lucide-react';

interface ConsolidatedProductRow {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  unit: string;
  currentStock: number;
  alertQuantity: number;
  image?: string;
  // Purchase statistics
  totalPurchasedQty: number;
  totalPurchaseAmount: number; // Inc tax
  avgPurchasePrice: number;
  lastPurchaseDate?: string;
  supplierNames: string[];
  // Sale statistics
  totalSoldQty: number;
  totalSaleAmount: number; // Inc tax
  avgSalePrice: number;
  lastSaleDate?: string;
  customerNames: string[];
  // Calculated flows & margins
  netQuantityFlow: number; // Purchased - Sold
  totalCostOfSoldGoods: number; // SoldQty * AvgPurchasePrice (or standard cost)
  grossProfit: number; // TotalSaleAmount - totalCostOfSoldGoods (or tax adjusted)
  profitMarginPercent: number;
  // Stock valuation
  stockValueAtCost: number;
  stockValueAtSale: number;
  potentialProfit: number;
}

interface ItemLedgerRow {
  id: string;
  type: 'purchase' | 'sale';
  date: string;
  referenceNo: string;
  contactName: string;
  contactType: 'supplier' | 'customer';
  locationName: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  totalIncTax: number;
  paymentStatus: 'paid' | 'partial' | 'due';
  profitOrCost?: number;
}

export const PurchaseSaleProductReportView: React.FC = () => {
  const {
    transactions = [],
    products = [],
    suppliers = [],
    customers = [],
    locations = [],
    categories = [],
    brands = [],
    settings = {},
    stockAdjustments = [],
    setActiveTab
  } = useErp() || {};

  // Active view tab
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'purchases' | 'sales' | 'stock_flow' | 'by_category' | 'by_brand'>('matrix');

  // Filters State
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all'); // all, in_stock, low_stock, out_of_stock
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Date Range state
  const [datePreset, setDatePreset] = useState('All Time');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Table controls
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<string>('totalSaleAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Modal / Drilldown
  const [inspectingProduct, setInspectingProduct] = useState<ConsolidatedProductRow | null>(null);

  // Column visibility for Product Matrix tab
  const [columnVisibility, setColumnVisibility] = useState({
    sku: true,
    categoryBrand: true,
    currentStock: true,
    purchasedQty: true,
    purchaseAmount: true,
    soldQty: true,
    saleAmount: true,
    netFlow: true,
    grossProfit: true,
    profitMargin: true,
    stockValuation: true,
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Format currency
  const formatMoney = (val: number) => {
    return formatCurrency(val, settings);
  };

  // Date Presets Handler
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'Today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'Yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'Last 7 Days') {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'Last 30 Days') {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 30);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'This Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'Last Month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(startOfLastMonth.toISOString().split('T')[0]);
      setEndDate(endOfLastMonth.toISOString().split('T')[0]);
    } else if (preset === 'Financial Year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(startOfYear.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'All Time') {
      setStartDate('2020-01-01');
      setEndDate(todayStr);
    }
  };

  // Copy SKU helper
  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setProductSearch('');
    setSelectedProductId('all');
    setSelectedSupplierId('all');
    setSelectedCustomerId('all');
    setSelectedLocationId('all');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStockStatus('all');
    handleDatePreset('All Time');
    setTableSearch('');
  };

  // Filtered transactions based on Date & Location
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Date filter
      const tDate = t.date ? t.date.substring(0, 10) : '';
      if (startDate && tDate < startDate) return false;
      if (endDate && tDate > endDate) return false;

      // Location filter
      if (selectedLocationId !== 'all' && t.locationId !== selectedLocationId) {
        return false;
      }

      // Supplier filter for purchases
      if (selectedSupplierId !== 'all' && t.type === 'purchase' && t.supplierId !== selectedSupplierId) {
        return false;
      }

      // Customer filter for sales
      if (selectedCustomerId !== 'all' && t.type === 'sale' && t.customerId !== selectedCustomerId) {
        return false;
      }

      return true;
    });
  }, [transactions, startDate, endDate, selectedLocationId, selectedSupplierId, selectedCustomerId]);

  // Helper to safely extract category name if category is an object
  const getCategoryName = (cat: any): string => {
    if (!cat) return 'General';
    if (typeof cat === 'object') {
      return cat.name || cat.title || 'General';
    }
    return String(cat);
  };

  // Helper to safely extract brand name if brand is an object
  const getBrandName = (brand: any): string => {
    if (!brand) return 'Standard';
    if (typeof brand === 'object') {
      return brand.name || brand.title || 'Standard';
    }
    return String(brand);
  };

  // Aggregate Product Purchases and Sales into Consolidated Matrix
  const consolidatedProducts = useMemo(() => {
    const map = new Map<string, ConsolidatedProductRow>();

    // Initialize all existing products
    products.forEach(p => {
      const unitCost = Number(p.costPrice || p.purchasePrice || (p.price * 0.7) || 0);
      const unitPrice = Number(p.price || 0);
      const currentStock = Number(p.stock || 0);

      map.set(p.id, {
        productId: p.id,
        productName: p.name,
        sku: p.sku || 'N/A',
        category: getCategoryName(p.category),
        brand: getBrandName(p.brand),
        unit: p.unit || 'Pc',
        currentStock: currentStock,
        alertQuantity: Number(p.alertQuantity || 5),
        image: p.image,
        totalPurchasedQty: 0,
        totalPurchaseAmount: 0,
        avgPurchasePrice: unitCost,
        supplierNames: [],
        totalSoldQty: 0,
        totalSaleAmount: 0,
        avgSalePrice: unitPrice,
        customerNames: [],
        netQuantityFlow: 0,
        totalCostOfSoldGoods: 0,
        grossProfit: 0,
        profitMarginPercent: 0,
        stockValueAtCost: currentStock * unitCost,
        stockValueAtSale: currentStock * unitPrice,
        potentialProfit: Math.max(0, (currentStock * unitPrice) - (currentStock * unitCost)),
      });
    });

    // Accumulate transactions
    filteredTransactions.forEach(tx => {
      if (!tx.items || !Array.isArray(tx.items)) return;

      const txType = tx.type; // 'purchase' or 'sale'

      tx.items.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId || p.sku === item.sku);
        const effectiveId = item.productId || product?.id || item.sku || `unknown_${index}`;
        let entry = map.get(effectiveId);
        if (!entry) {
          // In case item belongs to a deleted/legacy product
          const fallbackCost = Number(item.costPrice || item.purchasePrice || (item.unitPrice * 0.7) || 0);
          entry = {
            productId: effectiveId,
            productName: item.productName || product?.name || 'Unknown Product',
            sku: item.sku || product?.sku || 'N/A',
            category: getCategoryName(product?.category),
            brand: getBrandName(product?.brand),
            unit: item.unit || product?.unit || 'Pc',
            currentStock: Number(product?.stock || 0),
            alertQuantity: Number(product?.alertQuantity || 5),
            totalPurchasedQty: 0,
            totalPurchaseAmount: 0,
            avgPurchasePrice: fallbackCost,
            supplierNames: [],
            totalSoldQty: 0,
            totalSaleAmount: 0,
            avgSalePrice: Number(item.unitPrice || product?.price || 0),
            customerNames: [],
            netQuantityFlow: 0,
            totalCostOfSoldGoods: 0,
            grossProfit: 0,
            profitMarginPercent: 0,
            stockValueAtCost: 0,
            stockValueAtSale: 0,
            potentialProfit: 0,
          };
          map.set(effectiveId, entry);
        }

        const qty = Number(item.quantity || 0);
        const unitP = Number(item.unitPrice || 0);
        const lineTotal = Number(item.total || (qty * unitP) || 0);
        const itemCost = Number(item.costPrice || item.purchasePrice || entry.avgPurchasePrice || 0);

        if (txType === 'purchase') {
          entry.totalPurchasedQty += qty;
          entry.totalPurchaseAmount += lineTotal;
          if (tx.supplierName && !entry.supplierNames.includes(tx.supplierName)) {
            entry.supplierNames.push(tx.supplierName);
          }
          if (!entry.lastPurchaseDate || (tx.date && tx.date > entry.lastPurchaseDate)) {
            entry.lastPurchaseDate = tx.date;
          }
        } else if (txType === 'sale') {
          entry.totalSoldQty += qty;
          entry.totalSaleAmount += lineTotal;
          const costForThisLine = qty * itemCost;
          entry.totalCostOfSoldGoods += costForThisLine;
          if (tx.customerName && !entry.customerNames.includes(tx.customerName)) {
            entry.customerNames.push(tx.customerName);
          }
          if (!entry.lastSaleDate || (tx.date && tx.date > entry.lastSaleDate)) {
            entry.lastSaleDate = tx.date;
          }
        }
      });
    });

    // Final calculations per product
    const result: ConsolidatedProductRow[] = [];
    map.forEach(item => {
      // Recalculate average purchase price if items were purchased
      if (item.totalPurchasedQty > 0) {
        item.avgPurchasePrice = item.totalPurchaseAmount / item.totalPurchasedQty;
      }
      // Recalculate average selling price if items were sold
      if (item.totalSoldQty > 0) {
        item.avgSalePrice = item.totalSaleAmount / item.totalSoldQty;
      }

      // Net flow: Purchased - Sold
      item.netQuantityFlow = item.totalPurchasedQty - item.totalSoldQty;

      // Gross profit on sold goods
      if (item.totalSoldQty > 0) {
        const standardCostSold = item.totalSoldQty * item.avgPurchasePrice;
        item.grossProfit = item.totalSaleAmount - standardCostSold;
        item.profitMarginPercent = item.totalSaleAmount > 0
          ? (item.grossProfit / item.totalSaleAmount) * 100
          : 0;
      } else {
        item.grossProfit = 0;
        item.profitMarginPercent = 0;
      }

      // Update valuations with dynamic avgPurchasePrice
      item.stockValueAtCost = item.currentStock * item.avgPurchasePrice;
      item.stockValueAtSale = item.currentStock * (item.avgSalePrice || (item.avgPurchasePrice * 1.3));
      item.potentialProfit = Math.max(0, item.stockValueAtSale - item.stockValueAtCost);

      result.push(item);
    });

    return result;
  }, [products, filteredTransactions]);

  // Filter rows based on product search and drop-downs
  const filteredProductRows = useMemo(() => {
    return consolidatedProducts.filter(row => {
      // Product search text
      if (productSearch) {
        const s = productSearch.toLowerCase();
        const matches =
          row.productName.toLowerCase().includes(s) ||
          row.sku.toLowerCase().includes(s) ||
          row.category.toLowerCase().includes(s) ||
          row.brand.toLowerCase().includes(s);
        if (!matches) return false;
      }

      // Specific product select
      if (selectedProductId !== 'all' && row.productId !== selectedProductId) {
        return false;
      }

      // Category select
      if (selectedCategory !== 'all' && row.category !== selectedCategory) {
        return false;
      }

      // Brand select
      if (selectedBrand !== 'all' && row.brand !== selectedBrand) {
        return false;
      }

      // Stock status select
      if (selectedStockStatus === 'in_stock' && row.currentStock <= 0) return false;
      if (selectedStockStatus === 'low_stock' && (row.currentStock <= 0 || row.currentStock > row.alertQuantity)) return false;
      if (selectedStockStatus === 'out_of_stock' && row.currentStock > 0) return false;

      // Table general search
      if (tableSearch) {
        const ts = tableSearch.toLowerCase();
        const matches =
          row.productName.toLowerCase().includes(ts) ||
          row.sku.toLowerCase().includes(ts) ||
          row.category.toLowerCase().includes(ts) ||
          row.brand.toLowerCase().includes(ts);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    consolidatedProducts,
    productSearch,
    selectedProductId,
    selectedCategory,
    selectedBrand,
    selectedStockStatus,
    tableSearch,
  ]);

  // Sorted product rows
  const sortedProductRows = useMemo(() => {
    return [...filteredProductRows].sort((a, b) => {
      let aVal = (a as any)[sortField];
      let bVal = (b as any)[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal || 0);
      bVal = Number(bVal || 0);
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredProductRows, sortField, sortDirection]);

  // Paginated Rows
  const paginatedProductRows = useMemo(() => {
    if (itemsPerPage === -1) return sortedProductRows;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProductRows.slice(start, start + itemsPerPage);
  }, [sortedProductRows, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(sortedProductRows.length / itemsPerPage);

  // Overall Aggregate KPIs across all filtered rows
  const overallMetrics = useMemo(() => {
    let totalPurchasedUnits = 0;
    let totalPurchaseAmount = 0;
    let totalSoldUnits = 0;
    let totalSaleAmount = 0;
    let totalGrossProfit = 0;
    let totalCurrentStock = 0;
    let totalStockValueCost = 0;
    let totalStockValueRetail = 0;

    filteredProductRows.forEach(r => {
      totalPurchasedUnits += r.totalPurchasedQty;
      totalPurchaseAmount += r.totalPurchaseAmount;
      totalSoldUnits += r.totalSoldQty;
      totalSaleAmount += r.totalSaleAmount;
      totalGrossProfit += r.grossProfit;
      totalCurrentStock += r.currentStock;
      totalStockValueCost += r.stockValueAtCost;
      totalStockValueRetail += r.stockValueAtSale;
    });

    const netQuantityDiff = totalPurchasedUnits - totalSoldUnits;
    const overallMarginPercent = totalSaleAmount > 0 ? (totalGrossProfit / totalSaleAmount) * 100 : 0;

    return {
      totalPurchasedUnits,
      totalPurchaseAmount,
      totalSoldUnits,
      totalSaleAmount,
      totalGrossProfit,
      netQuantityDiff,
      overallMarginPercent,
      totalCurrentStock,
      totalStockValueCost,
      totalStockValueRetail,
      activeProductsCount: filteredProductRows.length,
    };
  }, [filteredProductRows]);

  // Detailed Purchase Transactions Ledger
  const purchaseTransactionsLedger = useMemo(() => {
    const list: ItemLedgerRow[] = [];
    filteredTransactions
      .filter(t => t.type === 'purchase')
      .forEach(t => {
        if (!t.items || !Array.isArray(t.items)) return;
        t.items.forEach((item, idx) => {
          // Check product matches
          if (selectedProductId !== 'all' && item.productId !== selectedProductId) return;
          if (productSearch) {
            const ps = productSearch.toLowerCase();
            const m =
              item.productName.toLowerCase().includes(ps) ||
              (item.sku && item.sku.toLowerCase().includes(ps));
            if (!m) return;
          }

          list.push({
            id: `${t.id}_item_${idx}`,
            type: 'purchase',
            date: t.date || '',
            referenceNo: t.referenceNo || `PO-${t.id.substring(0, 6)}`,
            contactName: t.supplierName || 'Unknown Supplier',
            contactType: 'supplier',
            locationName: t.locationName || locations.find(l => l.id === t.locationId)?.name || 'Main Warehouse',
            productName: item.productName || 'Product',
            sku: item.sku || 'N/A',
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || item.costPrice || 0),
            taxAmount: Number(item.taxAmount || 0),
            discountAmount: Number(item.discount || 0),
            totalIncTax: Number(item.total || 0),
            paymentStatus: t.paymentStatus || 'paid',
          });
        });
      });
    return list;
  }, [filteredTransactions, selectedProductId, productSearch, locations]);

  // Detailed Sales Transactions Ledger
  const saleTransactionsLedger = useMemo(() => {
    const list: ItemLedgerRow[] = [];
    filteredTransactions
      .filter(t => t.type === 'sale')
      .forEach(t => {
        if (!t.items || !Array.isArray(t.items)) return;
        t.items.forEach((item, idx) => {
          if (selectedProductId !== 'all' && item.productId !== selectedProductId) return;
          if (productSearch) {
            const ps = productSearch.toLowerCase();
            const m =
              item.productName.toLowerCase().includes(ps) ||
              (item.sku && item.sku.toLowerCase().includes(ps));
            if (!m) return;
          }

          const qty = Number(item.quantity || 0);
          const unitPrice = Number(item.unitPrice || 0);
          const cost = Number(item.costPrice || (unitPrice * 0.7) || 0);
          const totalLine = Number(item.total || (qty * unitPrice) || 0);
          const lineProfit = totalLine - (qty * cost);

          list.push({
            id: `${t.id}_item_${idx}`,
            type: 'sale',
            date: t.date || '',
            referenceNo: t.referenceNo || `INV-${t.id.substring(0, 6)}`,
            contactName: t.customerName || 'Walk-in Customer',
            contactType: 'customer',
            locationName: t.locationName || locations.find(l => l.id === t.locationId)?.name || 'Main Store',
            productName: item.productName || 'Product',
            sku: item.sku || 'N/A',
            quantity: qty,
            unitPrice: unitPrice,
            taxAmount: Number(item.taxAmount || 0),
            discountAmount: Number(item.discount || 0),
            totalIncTax: totalLine,
            paymentStatus: t.paymentStatus || 'paid',
            profitOrCost: lineProfit,
          });
        });
      });
    return list;
  }, [filteredTransactions, selectedProductId, productSearch, locations]);

  // Category Aggregate Analysis
  const categoryAnalytics = useMemo(() => {
    const catMap = new Map<string, {
      category: string;
      productCount: number;
      purchasedQty: number;
      purchaseAmount: number;
      soldQty: number;
      saleAmount: number;
      grossProfit: number;
      currentStock: number;
    }>();

    consolidatedProducts.forEach(p => {
      const cat = p.category || 'Uncategorized';
      let entry = catMap.get(cat);
      if (!entry) {
        entry = {
          category: cat,
          productCount: 0,
          purchasedQty: 0,
          purchaseAmount: 0,
          soldQty: 0,
          saleAmount: 0,
          grossProfit: 0,
          currentStock: 0,
        };
        catMap.set(cat, entry);
      }
      entry.productCount += 1;
      entry.purchasedQty += p.totalPurchasedQty;
      entry.purchaseAmount += p.totalPurchaseAmount;
      entry.soldQty += p.totalSoldQty;
      entry.saleAmount += p.totalSaleAmount;
      entry.grossProfit += p.grossProfit;
      entry.currentStock += p.currentStock;
    });

    return Array.from(catMap.values()).sort((a, b) => b.saleAmount - a.saleAmount);
  }, [consolidatedProducts]);

  // Brand Aggregate Analysis
  const brandAnalytics = useMemo(() => {
    const brandMap = new Map<string, {
      brand: string;
      productCount: number;
      purchasedQty: number;
      purchaseAmount: number;
      soldQty: number;
      saleAmount: number;
      grossProfit: number;
      currentStock: number;
    }>();

    consolidatedProducts.forEach(p => {
      const brand = p.brand || 'Unbranded';
      let entry = brandMap.get(brand);
      if (!entry) {
        entry = {
          brand: brand,
          productCount: 0,
          purchasedQty: 0,
          purchaseAmount: 0,
          soldQty: 0,
          saleAmount: 0,
          grossProfit: 0,
          currentStock: 0,
        };
        brandMap.set(brand, entry);
      }
      entry.productCount += 1;
      entry.purchasedQty += p.totalPurchasedQty;
      entry.purchaseAmount += p.totalPurchaseAmount;
      entry.soldQty += p.totalSoldQty;
      entry.saleAmount += p.totalSaleAmount;
      entry.grossProfit += p.grossProfit;
      entry.currentStock += p.currentStock;
    });

    return Array.from(brandMap.values()).sort((a, b) => b.saleAmount - a.saleAmount);
  }, [consolidatedProducts]);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let csvData: string[][] = [];

    if (activeSubTab === 'matrix') {
      headers = [
        'Product Name',
        'SKU',
        'Category',
        'Brand',
        'Current Stock',
        'Purchased Units',
        'Total Purchase Amount',
        'Avg Purchase Price',
        'Sold Units',
        'Total Sale Amount',
        'Avg Sale Price',
        'Net Flow (Qty)',
        'Gross Profit',
        'Margin %',
        'Stock Valuation (Cost)',
      ];
      csvData = filteredProductRows.map(r => [
        `"${r.productName}"`,
        `"${r.sku}"`,
        `"${r.category}"`,
        `"${r.brand}"`,
        r.currentStock.toString(),
        r.totalPurchasedQty.toString(),
        r.totalPurchaseAmount.toFixed(2),
        r.avgPurchasePrice.toFixed(2),
        r.totalSoldQty.toString(),
        r.totalSaleAmount.toFixed(2),
        r.avgSalePrice.toFixed(2),
        r.netQuantityFlow.toString(),
        r.grossProfit.toFixed(2),
        r.profitMarginPercent.toFixed(1) + '%',
        r.stockValueAtCost.toFixed(2),
      ]);
    } else if (activeSubTab === 'purchases') {
      headers = ['Date', 'Reference No', 'Supplier', 'Location', 'Product', 'SKU', 'Quantity', 'Unit Cost', 'Tax', 'Total (Inc Tax)', 'Status'];
      csvData = purchaseTransactionsLedger.map(r => [
        r.date,
        r.referenceNo,
        `"${r.contactName}"`,
        `"${r.locationName}"`,
        `"${r.productName}"`,
        `"${r.sku}"`,
        r.quantity.toString(),
        r.unitPrice.toFixed(2),
        r.taxAmount.toFixed(2),
        r.totalIncTax.toFixed(2),
        r.paymentStatus,
      ]);
    } else if (activeSubTab === 'sales') {
      headers = ['Date', 'Invoice No', 'Customer', 'Location', 'Product', 'SKU', 'Quantity', 'Unit Price', 'Total (Inc Tax)', 'Realized Profit', 'Status'];
      csvData = saleTransactionsLedger.map(r => [
        r.date,
        r.referenceNo,
        `"${r.contactName}"`,
        `"${r.locationName}"`,
        `"${r.productName}"`,
        `"${r.sku}"`,
        r.quantity.toString(),
        r.unitPrice.toFixed(2),
        r.totalIncTax.toFixed(2),
        (r.profitOrCost || 0).toFixed(2),
        r.paymentStatus,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvData.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Sale_Product_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Header & Navigation Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span>Reports</span>
            <span>/</span>
            <span>Inventory & Commercial</span>
            <span>/</span>
            <span className="text-slate-700">Items Report</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg text-white shadow-sm">
              <Boxes className="w-5 h-5" />
            </div>
            Items Report (Purchase & Sale by Product)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive multi-channel product intelligence syncing purchases, sales velocity, net item flow, margins, and inventory valuations.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={() => setIsFilterExpanded(prev => !prev)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              isFilterExpanded
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{isFilterExpanded ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Purchased Qty */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Purchased Units</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">{overallMetrics.totalPurchasedUnits.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-0.5">Spend: {formatMoney(overallMetrics.totalPurchaseAmount)}</div>
          </div>
        </div>

        {/* Total Sold Qty */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Sold Units</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">{overallMetrics.totalSoldUnits.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-0.5">Sales: {formatMoney(overallMetrics.totalSaleAmount)}</div>
          </div>
        </div>

        {/* Net Flow Balance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Net Item In/Out</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl font-bold ${overallMetrics.netQuantityDiff >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {overallMetrics.netQuantityDiff > 0 ? `+${overallMetrics.netQuantityDiff.toLocaleString()}` : overallMetrics.netQuantityDiff.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Units Purchased - Sold</div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Realized Gross Profit</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-emerald-600">{formatMoney(overallMetrics.totalGrossProfit)}</div>
            <div className="text-xs text-emerald-700 font-medium mt-0.5">{overallMetrics.overallMarginPercent.toFixed(1)}% Margin</div>
          </div>
        </div>

        {/* Current In-Stock Qty */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Current Inventory</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900">{overallMetrics.totalCurrentStock.toLocaleString()} Units</div>
            <div className="text-xs text-slate-500 mt-0.5">{overallMetrics.activeProductsCount} active items</div>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Stock Valuation</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-indigo-700">{formatMoney(overallMetrics.totalStockValueCost)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Retail: {formatMoney(overallMetrics.totalStockValueRetail)}</div>
          </div>
        </div>
      </div>

      {/* 3. Advanced Filter Collapsible Panel */}
      {isFilterExpanded && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Multi-Dimension Filters</h2>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>

          {/* Quick Date Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            <span className="text-xs font-medium text-slate-500 mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date Presets:
            </span>
            {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Financial Year', 'All Time'].map(preset => (
              <button
                key={preset}
                onClick={() => handleDatePreset(preset)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  datePreset === preset
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Filter Dropdown Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1">
            {/* 1. Product Search Keyword */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search Product / SKU</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Type product name, SKU..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">All Products ({products.length})</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Supplier Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">All Suppliers ({suppliers.length})</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.businessName ? `(${s.businessName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Customer Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">All Customers ({customers.length})</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Business Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Business Location</label>
              <select
                value={selectedLocationId}
                onChange={e => setSelectedLocationId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">All Locations ({locations.length})</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.city ? `(${loc.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Brand</label>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">All Brands ({brands.length})</option>
                {brands.map((b, idx) => (
                  <option key={idx} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* 8. Stock Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Level Status</label>
              <select
                value={selectedStockStatus}
                onChange={e => setSelectedStockStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt; 0)</option>
                <option value="low_stock">Low Stock (≤ Alert Level)</option>
                <option value="out_of_stock">Out of Stock (= 0)</option>
              </select>
            </div>

            {/* 9. Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              />
            </div>

            {/* 10. End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => {
              setActiveSubTab('matrix');
              setCurrentPage(1);
            }}
            className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'matrix'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Product Purchase & Sale Matrix</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700 font-semibold">
              {filteredProductRows.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('purchases');
              setCurrentPage(1);
            }}
            className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'purchases'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Purchase Item Lines</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 font-semibold">
              {purchaseTransactionsLedger.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('sales');
              setCurrentPage(1);
            }}
            className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'sales'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Sale Item Lines</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 font-semibold">
              {saleTransactionsLedger.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('stock_flow');
              setCurrentPage(1);
            }}
            className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'stock_flow'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-purple-600" />
            <span>Inventory Flow & Movement</span>
          </button>

          <button
            onClick={() => setActiveSubTab('by_category')}
            className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'by_category'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>By Category ({categoryAnalytics.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('by_brand')}
            className={`px-5 py-3.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'by_brand'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>By Brand ({brandAnalytics.length})</span>
          </button>
        </div>

        {/* Tab Controls / Table Header Options */}
        {(activeSubTab === 'matrix' || activeSubTab === 'purchases' || activeSubTab === 'sales' || activeSubTab === 'stock_flow') && (
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={e => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter current view..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
                />
              </div>

              {/* Items Per Page */}
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={-1}>All rows</option>
              </select>
            </div>

            {/* Column Picker for Matrix */}
            {activeSubTab === 'matrix' && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnPicker(prev => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Columns</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showColumnPicker && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-30 space-y-2">
                    <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                      Toggle Columns
                    </div>
                    {Object.entries({
                      sku: 'Product SKU',
                      categoryBrand: 'Category & Brand',
                      currentStock: 'Current Stock',
                      purchasedQty: 'Purchased Qty',
                      purchaseAmount: 'Purchase Spend',
                      soldQty: 'Sold Qty',
                      saleAmount: 'Sales Revenue',
                      netFlow: 'Net Flow (In/Out)',
                      grossProfit: 'Gross Profit ($)',
                      profitMargin: 'Profit Margin (%)',
                      stockValuation: 'Stock Valuation',
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={(columnVisibility as any)[key]}
                          onChange={e => setColumnVisibility(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. TAB 1: PRODUCT PURCHASE & SALE MATRIX */}
        {activeSubTab === 'matrix' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th
                    onClick={() => handleSort('productName')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Product</span>
                      {sortField === 'productName' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>

                  {columnVisibility.sku && (
                    <th onClick={() => handleSort('sku')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center gap-1">
                        <span>SKU</span>
                        {sortField === 'sku' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.categoryBrand && (
                    <th onClick={() => handleSort('category')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center gap-1">
                        <span>Category / Brand</span>
                        {sortField === 'category' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.currentStock && (
                    <th onClick={() => handleSort('currentStock')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center justify-end gap-1">
                        <span>Current Stock</span>
                        {sortField === 'currentStock' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.purchasedQty && (
                    <th onClick={() => handleSort('totalPurchasedQty')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 bg-blue-50/50">
                      <div className="flex items-center justify-end gap-1 text-blue-800">
                        <span>Purchased (Qty)</span>
                        {sortField === 'totalPurchasedQty' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.purchaseAmount && (
                    <th onClick={() => handleSort('totalPurchaseAmount')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 bg-blue-50/50">
                      <div className="flex items-center justify-end gap-1 text-blue-800">
                        <span>Total Purchase</span>
                        {sortField === 'totalPurchaseAmount' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.soldQty && (
                    <th onClick={() => handleSort('totalSoldQty')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 bg-emerald-50/50">
                      <div className="flex items-center justify-end gap-1 text-emerald-800">
                        <span>Sold (Qty)</span>
                        {sortField === 'totalSoldQty' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.saleAmount && (
                    <th onClick={() => handleSort('totalSaleAmount')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 bg-emerald-50/50">
                      <div className="flex items-center justify-end gap-1 text-emerald-800">
                        <span>Total Sales</span>
                        {sortField === 'totalSaleAmount' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.netFlow && (
                    <th onClick={() => handleSort('netQuantityFlow')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center justify-end gap-1">
                        <span>Net Flow (Qty)</span>
                        {sortField === 'netQuantityFlow' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.grossProfit && (
                    <th onClick={() => handleSort('grossProfit')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 bg-emerald-50/40">
                      <div className="flex items-center justify-end gap-1 text-emerald-800">
                        <span>Gross Profit</span>
                        {sortField === 'grossProfit' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.profitMargin && (
                    <th onClick={() => handleSort('profitMarginPercent')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center justify-end gap-1">
                        <span>Margin %</span>
                        {sortField === 'profitMarginPercent' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  {columnVisibility.stockValuation && (
                    <th onClick={() => handleSort('stockValueAtCost')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center justify-end gap-1">
                        <span>Stock Value</span>
                        {sortField === 'stockValueAtCost' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  )}

                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedProductRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400">
                      <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No product records found matching your filters</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the date range or clearing the search terms</p>
                    </td>
                  </tr>
                ) : (
                  paginatedProductRows.map((row, idx) => {
                    const rowNumber = itemsPerPage === -1 ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1;
                    const isLowStock = row.currentStock > 0 && row.currentStock <= row.alertQuantity;
                    const isOutOfStock = row.currentStock <= 0;

                    return (
                      <tr key={row.productId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">{rowNumber}</td>

                        {/* Product Name & Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 overflow-hidden">
                              {row.image ? (
                                <img src={row.image} alt={row.productName} className="w-full h-full object-cover" />
                              ) : (
                                row.productName.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => setInspectingProduct(row)}>
                                {row.productName}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Unit: {row.unit}</span>
                                {row.supplierNames.length > 0 && (
                                  <span className="text-slate-500 font-normal">
                                    • Supp: {row.supplierNames[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        {columnVisibility.sku && (
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-600 text-xs">{row.sku}</span>
                              <button
                                onClick={() => handleCopySku(row.sku)}
                                title="Copy SKU"
                                className="text-slate-400 hover:text-slate-600 p-1"
                              >
                                {copiedSku === row.sku ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                        )}

                        {/* Category & Brand */}
                        {columnVisibility.categoryBrand && (
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold w-fit">
                                {row.category}
                              </span>
                              <span className="text-[11px] text-slate-500">{row.brand}</span>
                            </div>
                          </td>
                        )}

                        {/* Current Stock */}
                        {columnVisibility.currentStock && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                                {row.currentStock} {row.unit}
                              </span>
                              {isOutOfStock ? (
                                <span className="text-[10px] text-rose-500 font-semibold">Out of Stock</span>
                              ) : isLowStock ? (
                                <span className="text-[10px] text-amber-500 font-semibold">Low Stock</span>
                              ) : (
                                <span className="text-[10px] text-emerald-600">Available</span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Total Purchased Qty */}
                        {columnVisibility.purchasedQty && (
                          <td className="py-3.5 px-4 text-right font-bold text-blue-900 bg-blue-50/20">
                            {row.totalPurchasedQty.toLocaleString()} {row.unit}
                          </td>
                        )}

                        {/* Total Purchase Spend */}
                        {columnVisibility.purchaseAmount && (
                          <td className="py-3.5 px-4 text-right bg-blue-50/20">
                            <div className="font-bold text-slate-900">{formatMoney(row.totalPurchaseAmount)}</div>
                            <div className="text-[10px] text-slate-400">Avg: {formatMoney(row.avgPurchasePrice)}</div>
                          </td>
                        )}

                        {/* Total Sold Qty */}
                        {columnVisibility.soldQty && (
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-900 bg-emerald-50/20">
                            {row.totalSoldQty.toLocaleString()} {row.unit}
                          </td>
                        )}

                        {/* Total Sales Revenue */}
                        {columnVisibility.saleAmount && (
                          <td className="py-3.5 px-4 text-right bg-emerald-50/20">
                            <div className="font-bold text-emerald-700">{formatMoney(row.totalSaleAmount)}</div>
                            <div className="text-[10px] text-slate-400">Avg: {formatMoney(row.avgSalePrice)}</div>
                          </td>
                        )}

                        {/* Net Flow (In - Out) */}
                        {columnVisibility.netFlow && (
                          <td className="py-3.5 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              row.netQuantityFlow >= 0
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {row.netQuantityFlow > 0 ? `+${row.netQuantityFlow}` : row.netQuantityFlow} {row.unit}
                            </span>
                          </td>
                        )}

                        {/* Gross Profit */}
                        {columnVisibility.grossProfit && (
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600 bg-emerald-50/10">
                            {formatMoney(row.grossProfit)}
                          </td>
                        )}

                        {/* Margin % */}
                        {columnVisibility.profitMargin && (
                          <td className="py-3.5 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              row.profitMarginPercent >= 25
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.profitMarginPercent > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {row.profitMarginPercent.toFixed(1)}%
                            </span>
                          </td>
                        )}

                        {/* Stock Valuation */}
                        {columnVisibility.stockValuation && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-slate-900">{formatMoney(row.stockValueAtCost)}</div>
                            <div className="text-[10px] text-slate-400">Retail: {formatMoney(row.stockValueAtSale)}</div>
                          </td>
                        )}

                        {/* Quick View Action */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setInspectingProduct(row)}
                            title="Drilldown Product Details"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Grand Total Footer */}
              {paginatedProductRows.length > 0 && (
                <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <tr>
                    <td colSpan={columnVisibility.sku ? (columnVisibility.categoryBrand ? 4 : 3) : (columnVisibility.categoryBrand ? 3 : 2)} className="py-3.5 px-4 text-right uppercase">
                      Filtered Totals:
                    </td>

                    {columnVisibility.currentStock && (
                      <td className="py-3.5 px-4 text-right text-slate-900">
                        {overallMetrics.totalCurrentStock.toLocaleString()}
                      </td>
                    )}

                    {columnVisibility.purchasedQty && (
                      <td className="py-3.5 px-4 text-right text-blue-900 bg-blue-100/50">
                        {overallMetrics.totalPurchasedUnits.toLocaleString()}
                      </td>
                    )}

                    {columnVisibility.purchaseAmount && (
                      <td className="py-3.5 px-4 text-right text-blue-900 bg-blue-100/50">
                        {formatMoney(overallMetrics.totalPurchaseAmount)}
                      </td>
                    )}

                    {columnVisibility.soldQty && (
                      <td className="py-3.5 px-4 text-right text-emerald-900 bg-emerald-100/50">
                        {overallMetrics.totalSoldUnits.toLocaleString()}
                      </td>
                    )}

                    {columnVisibility.saleAmount && (
                      <td className="py-3.5 px-4 text-right text-emerald-900 bg-emerald-100/50">
                        {formatMoney(overallMetrics.totalSaleAmount)}
                      </td>
                    )}

                    {columnVisibility.netFlow && (
                      <td className="py-3.5 px-4 text-right text-purple-900">
                        {overallMetrics.netQuantityDiff > 0 ? `+${overallMetrics.netQuantityDiff}` : overallMetrics.netQuantityDiff}
                      </td>
                    )}

                    {columnVisibility.grossProfit && (
                      <td className="py-3.5 px-4 text-right text-emerald-700 bg-emerald-100/50">
                        {formatMoney(overallMetrics.totalGrossProfit)}
                      </td>
                    )}

                    {columnVisibility.profitMargin && (
                      <td className="py-3.5 px-4 text-right text-slate-900">
                        {overallMetrics.overallMarginPercent.toFixed(1)}%
                      </td>
                    )}

                    {columnVisibility.stockValuation && (
                      <td className="py-3.5 px-4 text-right text-indigo-900">
                        {formatMoney(overallMetrics.totalStockValueCost)}
                      </td>
                    )}

                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* 6. TAB 2: PURCHASE ITEM LINES */}
        {activeSubTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Total (Inc Tax)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchaseTransactionsLedger.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No purchase line items match the criteria</p>
                    </td>
                  </tr>
                ) : (
                  purchaseTransactionsLedger.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{item.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{item.referenceNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.contactName}</td>
                      <td className="py-3 px-4 text-slate-600">{item.locationName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.productName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatMoney(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{formatMoney(item.taxAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatMoney(item.totalIncTax)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. TAB 3: SALE ITEM LINES */}
        {activeSubTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total (Inc Tax)</th>
                  <th className="py-3 px-4 text-right">Realized Profit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {saleTransactionsLedger.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <TrendingUp className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No sale line items match the criteria</p>
                    </td>
                  </tr>
                ) : (
                  saleTransactionsLedger.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{item.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">{item.referenceNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.contactName}</td>
                      <td className="py-3 px-4 text-slate-600">{item.locationName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.productName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatMoney(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatMoney(item.totalIncTax)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(item.profitOrCost || 0)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. TAB 4: INVENTORY FLOW & MOVEMENT */}
        {activeSubTab === 'stock_flow' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Inflow (Purchased)</th>
                  <th className="py-3 px-4 text-right">Outflow (Sold)</th>
                  <th className="py-3 px-4 text-right">Net Flow (In - Out)</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                  <th className="py-3 px-4 text-right">Valuation (Cost)</th>
                  <th className="py-3 px-4 text-right">Valuation (Retail)</th>
                  <th className="py-3 px-4 text-right">Potential Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProductRows.map(row => (
                  <tr key={row.productId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.productName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{row.sku}</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-700">+{row.totalPurchasedQty}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">-{row.totalSoldQty}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold ${row.netQuantityFlow >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                        {row.netQuantityFlow > 0 ? `+${row.netQuantityFlow}` : row.netQuantityFlow}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{row.currentStock} {row.unit}</td>
                    <td className="py-3 px-4 text-right text-slate-800">{formatMoney(row.stockValueAtCost)}</td>
                    <td className="py-3 px-4 text-right text-slate-800">{formatMoney(row.stockValueAtSale)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(row.potentialProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 9. TAB 5: BY CATEGORY */}
        {activeSubTab === 'by_category' && (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Products Count</th>
                  <th className="py-3 px-4 text-right">Purchased Units</th>
                  <th className="py-3 px-4 text-right">Purchase Spend</th>
                  <th className="py-3 px-4 text-right">Sold Units</th>
                  <th className="py-3 px-4 text-right">Sales Revenue</th>
                  <th className="py-3 px-4 text-right">Realized Profit</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categoryAnalytics.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>{cat.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">{cat.productCount}</td>
                    <td className="py-3.5 px-4 text-right text-blue-700 font-bold">{cat.purchasedQty}</td>
                    <td className="py-3.5 px-4 text-right text-slate-800">{formatMoney(cat.purchaseAmount)}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">{cat.soldQty}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-800">{formatMoney(cat.saleAmount)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatMoney(cat.grossProfit)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-900 font-bold">{cat.currentStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 10. TAB 6: BY BRAND */}
        {activeSubTab === 'by_brand' && (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4 text-center">Products Count</th>
                  <th className="py-3 px-4 text-right">Purchased Units</th>
                  <th className="py-3 px-4 text-right">Purchase Spend</th>
                  <th className="py-3 px-4 text-right">Sold Units</th>
                  <th className="py-3 px-4 text-right">Sales Revenue</th>
                  <th className="py-3 px-4 text-right">Realized Profit</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {brandAnalytics.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-600" />
                      <span>{b.brand}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-600">{b.productCount}</td>
                    <td className="py-3.5 px-4 text-right text-blue-700 font-bold">{b.purchasedQty}</td>
                    <td className="py-3.5 px-4 text-right text-slate-800">{formatMoney(b.purchaseAmount)}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">{b.soldQty}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-800">{formatMoney(b.saleAmount)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatMoney(b.grossProfit)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-900 font-bold">{b.currentStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {activeSubTab === 'matrix' && itemsPerPage !== -1 && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, filteredProductRows.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filteredProductRows.length}</span> items
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 11. Interactive Product Drilldown Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">Product Intelligence Drilldown</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{inspectingProduct.productName}</h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {inspectingProduct.sku} • {inspectingProduct.category}</div>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Purchased</span>
                <div className="text-base font-bold text-blue-700 mt-1">{inspectingProduct.totalPurchasedQty} {inspectingProduct.unit}</div>
                <div className="text-[11px] text-slate-500">{formatMoney(inspectingProduct.totalPurchaseAmount)}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Sold</span>
                <div className="text-base font-bold text-emerald-700 mt-1">{inspectingProduct.totalSoldQty} {inspectingProduct.unit}</div>
                <div className="text-[11px] text-slate-500">{formatMoney(inspectingProduct.totalSaleAmount)}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Profit</span>
                <div className="text-base font-bold text-emerald-600 mt-1">{formatMoney(inspectingProduct.grossProfit)}</div>
                <div className="text-[11px] text-emerald-700 font-medium">{inspectingProduct.profitMarginPercent.toFixed(1)}% Margin</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Inventory</span>
                <div className="text-base font-bold text-slate-900 mt-1">{inspectingProduct.currentStock} {inspectingProduct.unit}</div>
                <div className="text-[11px] text-slate-500">Valuation: {formatMoney(inspectingProduct.stockValueAtCost)}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Purchase Cost</span>
                <div className="text-base font-bold text-slate-800 mt-1">{formatMoney(inspectingProduct.avgPurchasePrice)}</div>
                <div className="text-[11px] text-slate-500">Per {inspectingProduct.unit}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Selling Price</span>
                <div className="text-base font-bold text-slate-800 mt-1">{formatMoney(inspectingProduct.avgSalePrice)}</div>
                <div className="text-[11px] text-slate-500">Per {inspectingProduct.unit}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
