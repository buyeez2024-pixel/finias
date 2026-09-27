import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { Product, ProductVariation, Transaction, StockAdjustment, StockTransfer } from '../../types/erp';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { StockTransferModal } from '../inventory/StockTransferModal';
import { getCategoryName, getBrandName, formatCurrency } from '../../utils/formatters';
import {
  Boxes,
  Package,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  CheckCircle2,
  History,
  ArrowRightLeft,
  Scale,
  ChevronDown,
  ChevronUp,
  Columns,
  X,
  FileSpreadsheet,
  Info,
  Building,
  Tag,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';

interface StockReportRow {
  productId: string;
  variationId?: string;
  sku: string;
  barcode: string;
  productName: string;
  variationName: string;
  category: string;
  brand: string;
  unit: string;
  type: string;
  image?: string;
  alertQuantity: number;
  locationName: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  stockValuePurchase: number;
  stockValueSale: number;
  potentialProfit: number;
  profitMarginPercent: number;
  totalUnitSold: number;
  totalUnitTransferred: number;
  totalUnitAdjusted: number;
  rawProduct: Product;
}

export const StockReportView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    units,
    locations,
    taxRates,
    taxGroups,
    transactions,
    stockAdjustments,
    stockTransfers,
    settings,
    setActiveTab,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Filters State
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [taxFilter, setTaxFilter] = useState<string>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Sorting State
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<keyof StockReportRow>('productName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column Visibility State
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    sku: true,
    product: true,
    variation: true,
    category: true,
    brand: true,
    location: true,
    costPrice: true,
    sellingPrice: true,
    currentStock: true,
    stockValuePurchase: true,
    stockValueSale: true,
    potentialProfit: true,
    profitMargin: true,
    totalUnitSold: true,
    totalUnitTransferred: true,
    totalUnitAdjusted: true,
  });

  // Modals State
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Reset Filters
  const handleResetFilters = () => {
    setLocationFilter('all');
    setCategoryFilter('all');
    setBrandFilter('all');
    setUnitFilter('all');
    setTaxFilter('all');
    setProductTypeFilter('all');
    setStockStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Pre-calculate movements for all products to ensure high rendering performance
  const movementStats = useMemo(() => {
    const soldMap: Record<string, number> = {};
    const transferMap: Record<string, number> = {};
    const adjustMap: Record<string, number> = {};

    // 1. Calculate units sold and sell returns
    transactions.forEach((txn) => {
      if (txn.status !== 'draft') {
        txn.items?.forEach((item) => {
          if (!item.productId) return;
          const key = item.productId;
          if (txn.type === 'sale') {
            soldMap[key] = (soldMap[key] || 0) + (item.quantity || 0);
          } else if (txn.type === 'sell_return') {
            soldMap[key] = (soldMap[key] || 0) - (item.quantity || 0);
          }
        });
      }
    });

    // 2. Calculate stock transfers
    stockTransfers.forEach((trf) => {
      trf.items?.forEach((item) => {
        if (!item.productId) return;
        transferMap[item.productId] = (transferMap[item.productId] || 0) + (item.quantity || 0);
      });
    });

    // 3. Calculate stock adjustments
    stockAdjustments.forEach((adj) => {
      adj.items?.forEach((item) => {
        if (!item.productId) return;
        adjustMap[item.productId] = (adjustMap[item.productId] || 0) + (item.quantity || 0);
      });
    });

    return { soldMap, transferMap, adjustMap };
  }, [transactions, stockTransfers, stockAdjustments]);

  // Generate All Stock Rows (Expanding variable products into distinct variation rows if applicable)
  const allStockRows = useMemo<StockReportRow[]>(() => {
    const rows: StockReportRow[] = [];

    products.forEach((prod) => {
      const isVariable = prod.type === 'variable' && prod.variations && prod.variations.length > 0;

      if (isVariable && prod.variations) {
        // Variable product rows
        prod.variations.forEach((v) => {
          // Calculate stock based on location filter
          let stock = v.currentStock || 0;
          let locName = 'All Locations';
          if (locationFilter !== 'all') {
            stock = v.locationStocks?.[locationFilter] ?? 0;
            const matchedLoc = locations.find((l) => l.id === locationFilter);
            locName = matchedLoc ? matchedLoc.name : locationFilter;
          }

          const cost = v.costPrice || prod.costPrice || 0;
          const selling = v.sellingPrice || prod.sellingPrice || 0;
          const stockValPurchase = stock * cost;
          const stockValSale = stock * selling;
          const profit = stockValSale - stockValPurchase;
          const margin = stockValPurchase > 0 ? (profit / stockValPurchase) * 100 : 0;

          rows.push({
            productId: prod.id,
            variationId: v.id,
            sku: v.sku || prod.sku,
            barcode: v.barcode || prod.barcode,
            productName: prod.name,
            variationName: v.name || Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(', ') || 'Variation',
            category: getCategoryName(prod.category),
            brand: getBrandName(prod.brand),
            unit: prod.unit || 'Pcs',
            type: 'Variable',
            image: v.image || prod.image,
            alertQuantity: prod.alertQuantity || 5,
            locationName: locName,
            costPrice: cost,
            sellingPrice: selling,
            currentStock: stock,
            stockValuePurchase: stockValPurchase,
            stockValueSale: stockValSale,
            potentialProfit: profit,
            profitMarginPercent: margin,
            totalUnitSold: movementStats.soldMap[prod.id] || 0,
            totalUnitTransferred: movementStats.transferMap[prod.id] || 0,
            totalUnitAdjusted: movementStats.adjustMap[prod.id] || 0,
            rawProduct: prod,
          });
        });
      } else {
        // Single / Combo product row
        let stock = prod.currentStock || 0;
        let locName = 'All Locations';
        if (locationFilter !== 'all') {
          stock = prod.locationStocks?.[locationFilter] ?? 0;
          const matchedLoc = locations.find((l) => l.id === locationFilter);
          locName = matchedLoc ? matchedLoc.name : locationFilter;
        }

        const cost = prod.costPrice || 0;
        const selling = prod.sellingPrice || 0;
        const stockValPurchase = stock * cost;
        const stockValSale = stock * selling;
        const profit = stockValSale - stockValPurchase;
        const margin = stockValPurchase > 0 ? (profit / stockValPurchase) * 100 : 0;

        rows.push({
          productId: prod.id,
          sku: prod.sku,
          barcode: prod.barcode,
          productName: prod.name,
          variationName: prod.type === 'combo' ? 'Combo Bundle' : 'Single',
          category: getCategoryName(prod.category),
          brand: getBrandName(prod.brand),
          unit: prod.unit || 'Pcs',
          type: prod.type ? prod.type.charAt(0).toUpperCase() + prod.type.slice(1) : 'Single',
          image: prod.image,
          alertQuantity: prod.alertQuantity || 5,
          locationName: locName,
          costPrice: cost,
          sellingPrice: selling,
          currentStock: stock,
          stockValuePurchase: stockValPurchase,
          stockValueSale: stockValSale,
          potentialProfit: profit,
          profitMarginPercent: margin,
          totalUnitSold: movementStats.soldMap[prod.id] || 0,
          totalUnitTransferred: movementStats.transferMap[prod.id] || 0,
          totalUnitAdjusted: movementStats.adjustMap[prod.id] || 0,
          rawProduct: prod,
        });
      }
    });

    return rows;
  }, [products, locationFilter, locations, movementStats]);

  // Filtered Stock Rows
  const filteredRows = useMemo(() => {
    return allStockRows.filter((row) => {
      // 1. Category Filter
      if (categoryFilter !== 'all' && row.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // 2. Brand Filter
      if (brandFilter !== 'all' && row.brand.toLowerCase() !== brandFilter.toLowerCase()) {
        return false;
      }

      // 3. Unit Filter
      if (unitFilter !== 'all' && row.unit.toLowerCase() !== unitFilter.toLowerCase()) {
        return false;
      }

      // 4. Product Type Filter
      if (productTypeFilter !== 'all' && row.type.toLowerCase() !== productTypeFilter.toLowerCase()) {
        return false;
      }

      // 5. Stock Status Filter
      if (stockStatusFilter === 'in_stock' && row.currentStock <= row.alertQuantity) {
        return false;
      }
      if (stockStatusFilter === 'low_stock' && (row.currentStock <= 0 || row.currentStock > row.alertQuantity)) {
        return false;
      }
      if (stockStatusFilter === 'out_of_stock' && row.currentStock > 0) {
        return false;
      }

      // 6. Tax Filter
      if (taxFilter !== 'all') {
        const prodTaxGroup = row.rawProduct.taxGroupId;
        const prodTaxRate = String(row.rawProduct.taxRate);
        if (prodTaxGroup !== taxFilter && prodTaxRate !== taxFilter) {
          return false;
        }
      }

      // 7. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSku = row.sku.toLowerCase().includes(q);
        const matchesBarcode = row.barcode.toLowerCase().includes(q);
        const matchesName = row.productName.toLowerCase().includes(q);
        const matchesVariation = row.variationName.toLowerCase().includes(q);
        const matchesBrand = row.brand.toLowerCase().includes(q);
        const matchesCategory = row.category.toLowerCase().includes(q);

        if (!matchesSku && !matchesBarcode && !matchesName && !matchesVariation && !matchesBrand && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [allStockRows, categoryFilter, brandFilter, unitFilter, productTypeFilter, stockStatusFilter, taxFilter, searchQuery]);

  // Summary Metrics (finias POS 4-Card Formula)
  const summaryMetrics = useMemo(() => {
    const totalClosingStockPurchase = filteredRows.reduce((sum, r) => sum + (r.stockValuePurchase || 0), 0);
    const totalClosingStockSale = filteredRows.reduce((sum, r) => sum + (r.stockValueSale || 0), 0);
    const totalPotentialProfit = totalClosingStockSale - totalClosingStockPurchase;
    const profitMargin = totalClosingStockPurchase > 0 ? (totalPotentialProfit / totalClosingStockPurchase) * 100 : 0;

    const totalStockQty = filteredRows.reduce((sum, r) => sum + (r.currentStock || 0), 0);
    const totalUnitsSold = filteredRows.reduce((sum, r) => sum + (r.totalUnitSold || 0), 0);
    const totalUnitsTransferred = filteredRows.reduce((sum, r) => sum + (r.totalUnitTransferred || 0), 0);
    const totalUnitsAdjusted = filteredRows.reduce((sum, r) => sum + (r.totalUnitAdjusted || 0), 0);

    const inStockCount = filteredRows.filter((r) => r.currentStock > r.alertQuantity).length;
    const lowStockCount = filteredRows.filter((r) => r.currentStock > 0 && r.currentStock <= r.alertQuantity).length;
    const outOfStockCount = filteredRows.filter((r) => r.currentStock <= 0).length;

    return {
      totalClosingStockPurchase,
      totalClosingStockSale,
      totalPotentialProfit,
      profitMargin,
      totalStockQty,
      totalUnitsSold,
      totalUnitsTransferred,
      totalUnitsAdjusted,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      itemCount: filteredRows.length,
    };
  }, [filteredRows]);

  // Sorted Rows
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredRows, sortField, sortDirection]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return sortedRows;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedRows.length / pageSize);

  const handleSort = (field: keyof StockReportRow) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Variation',
      'Category',
      'Brand',
      'Location',
      'Unit',
      `Unit Purchase Price (${settings.currencySymbol})`,
      `Unit Selling Price (${settings.currencySymbol})`,
      'Current Stock',
      `Stock Value by Purchase (${settings.currencySymbol})`,
      `Stock Value by Sale (${settings.currencySymbol})`,
      `Potential Profit (${settings.currencySymbol})`,
      'Profit Margin (%)',
      'Total Unit Sold',
      'Total Unit Transferred',
      'Total Unit Adjusted',
    ];

    const rows = sortedRows.map((r) => [
      `"${r.sku}"`,
      `"${r.barcode}"`,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.variationName.replace(/"/g, '""')}"`,
      `"${r.category.replace(/"/g, '""')}"`,
      `"${r.brand.replace(/"/g, '""')}"`,
      `"${r.locationName.replace(/"/g, '""')}"`,
      `"${r.unit}"`,
      r.costPrice.toFixed(2),
      r.sellingPrice.toFixed(2),
      r.currentStock.toFixed(2),
      r.stockValuePurchase.toFixed(2),
      r.stockValueSale.toFixed(2),
      r.potentialProfit.toFixed(2),
      r.profitMarginPercent.toFixed(2) + '%',
      r.totalUnitSold.toFixed(2),
      r.totalUnitTransferred.toFixed(2),
      r.totalUnitAdjusted.toFixed(2),
    ]);

    // Add totals row
    rows.push([
      '"TOTAL"',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      summaryMetrics.totalStockQty.toFixed(2),
      summaryMetrics.totalClosingStockPurchase.toFixed(2),
      summaryMetrics.totalClosingStockSale.toFixed(2),
      summaryMetrics.totalPotentialProfit.toFixed(2),
      summaryMetrics.profitMargin.toFixed(2) + '%',
      summaryMetrics.totalUnitsSold.toFixed(2),
      summaryMetrics.totalUnitsTransferred.toFixed(2),
      summaryMetrics.totalUnitsAdjusted.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Stock History Calculations for Modal
  const productStockHistory = useMemo(() => {
    if (!historyProduct) return [];

    const movements: {
      date: string;
      refNo: string;
      type: 'purchase' | 'sale' | 'sale_return' | 'purchase_return' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'opening';
      location: string;
      partyName: string;
      qtyChange: number;
      unitPrice: number;
      totalValue: number;
      notes: string;
    }[] = [];

    // 1. Purchases
    transactions.forEach((txn) => {
      if (txn.type === 'purchase' && txn.status !== 'draft') {
        const item = txn.items?.find((i) => i.productId === historyProduct.id);
        if (item) {
          const loc = locations.find((l) => l.id === txn.locationId)?.name || 'Store';
          movements.push({
            date: txn.date,
            refNo: txn.invoiceNo,
            type: 'purchase',
            location: loc,
            partyName: 'Supplier Purchase',
            qtyChange: item.quantity,
            unitPrice: item.unitPrice,
            totalValue: item.quantity * item.unitPrice,
            notes: txn.notes || 'Goods receipt purchase bill',
          });
        }
      } else if (txn.type === 'purchase_return' && txn.status !== 'draft') {
        const item = txn.items?.find((i) => i.productId === historyProduct.id);
        if (item) {
          const loc = locations.find((l) => l.id === txn.locationId)?.name || 'Store';
          movements.push({
            date: txn.date,
            refNo: txn.invoiceNo,
            type: 'purchase_return',
            location: loc,
            partyName: 'Supplier Return',
            qtyChange: -item.quantity,
            unitPrice: item.unitPrice,
            totalValue: item.quantity * item.unitPrice,
            notes: 'Debit Note / Return to vendor',
          });
        }
      } else if (txn.type === 'sale' && txn.status !== 'draft') {
        const item = txn.items?.find((i) => i.productId === historyProduct.id);
        if (item) {
          const loc = locations.find((l) => l.id === txn.locationId)?.name || 'Store';
          movements.push({
            date: txn.date,
            refNo: txn.invoiceNo,
            type: 'sale',
            location: loc,
            partyName: 'Customer Invoice',
            qtyChange: -item.quantity,
            unitPrice: item.unitPrice,
            totalValue: item.quantity * item.unitPrice,
            notes: 'Sold at POS / Retail Order',
          });
        }
      } else if (txn.type === 'sell_return' && txn.status !== 'draft') {
        const item = txn.items?.find((i) => i.productId === historyProduct.id);
        if (item) {
          const loc = locations.find((l) => l.id === txn.locationId)?.name || 'Store';
          movements.push({
            date: txn.date,
            refNo: txn.invoiceNo,
            type: 'sale_return',
            location: loc,
            partyName: 'Customer Return',
            qtyChange: item.quantity,
            unitPrice: item.unitPrice,
            totalValue: item.quantity * item.unitPrice,
            notes: 'Credit Note / Restocked from customer return',
          });
        }
      }
    });

    // 2. Adjustments
    stockAdjustments.forEach((adj) => {
      const item = adj.items?.find((i) => i.productId === historyProduct.id);
      if (item) {
        const loc = locations.find((l) => l.id === adj.locationId)?.name || 'Store';
        const isDeduction = item.type !== 'found';
        movements.push({
          date: adj.date,
          refNo: adj.referenceNo,
          type: 'adjustment',
          location: loc,
          partyName: `Adjustment (${item.type.toUpperCase()})`,
          qtyChange: isDeduction ? -item.quantity : item.quantity,
          unitPrice: item.unitCost,
          totalValue: item.quantity * item.unitCost,
          notes: adj.reason || `Reason: ${item.type}`,
        });
      }
    });

    // 3. Transfers
    stockTransfers.forEach((trf) => {
      const item = trf.items?.find((i) => i.productId === historyProduct.id);
      if (item) {
        const fromLoc = locations.find((l) => l.id === trf.fromLocationId)?.name || 'Source';
        const toLoc = locations.find((l) => l.id === trf.toLocationId)?.name || 'Dest';
        movements.push({
          date: trf.date,
          refNo: trf.referenceNo,
          type: 'transfer_out',
          location: `${fromLoc} → ${toLoc}`,
          partyName: `Inter-Branch Transfer`,
          qtyChange: -item.quantity,
          unitPrice: item.unitCost,
          totalValue: item.quantity * item.unitCost,
          notes: trf.notes || 'Transferred out to branch',
        });
      }
    });

    // Sort chronologically ascending to calculate running balance
    movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    return movements.map((m) => {
      runningBalance += m.qtyChange;
      return {
        ...m,
        balance: runningBalance,
      };
    }).reverse(); // display newest first in UI
  }, [historyProduct, transactions, stockAdjustments, stockTransfers, locations]);

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-16 font-sans">
      {/* 1. Header Section with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Stock Report
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  finias POS Standard
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Real-time inventory valuation, stock units, movements, potential profits, and stock ledger
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              !isFilterCollapsed
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {isFilterCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <ExportButtons
            headers={[
              'SKU',
              'Barcode',
              'Product Name',
              'Variation',
              'Category',
              'Brand',
              'Location',
              'Unit',
              'Unit Purchase Price',
              'Unit Selling Price',
              'Current Stock',
              'Stock Value by Purchase',
              'Stock Value by Sale',
              'Potential Profit',
              'Profit Margin (%)',
              'Total Unit Sold',
              'Total Unit Transferred',
              'Total Unit Adjusted',
            ]}
            keys={[
              'sku',
              'barcode',
              'productName',
              'variationName',
              'category',
              'brand',
              'locationName',
              'unit',
              'costPrice',
              'sellingPrice',
              'currentStock',
              'stockValuePurchase',
              'stockValueSale',
              'potentialProfit',
              'profitMarginPercent',
              'totalUnitSold',
              'totalUnitTransferred',
              'totalUnitAdjusted',
            ]}
            data={sortedRows}
            filename="stock_report"
            title="Stock Inventory Valuation Report"
            isLight={isLight}
          />

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. finias POS 4-Card Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Closing stock (By purchase price) */}
        <div className="relative overflow-hidden bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg hover:border-slate-700 transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-400" />
              Closing stock (By purchase price)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
            {formatCurrency(summaryMetrics.totalClosingStockPurchase || 0, settings)}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>Total Units on Hand</span>
            <span className="font-semibold text-white font-mono">{summaryMetrics.totalStockQty.toLocaleString()} Units</span>
          </div>
        </div>

        {/* Card 2: Closing stock (By sale price) */}
        <div className="relative overflow-hidden bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg hover:border-slate-700 transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-400" />
              Closing stock (By sale price)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(summaryMetrics.totalClosingStockSale || 0, settings)}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>Total Catalog Products</span>
            <span className="font-semibold text-slate-300 font-mono">{summaryMetrics.itemCount} SKUs / Variants</span>
          </div>
        </div>

        {/* Card 3: Potential profit */}
        <div className="relative overflow-hidden bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg hover:border-slate-700 transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-indigo-400" />
              Potential profit
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-indigo-400 font-mono">
            {formatCurrency(summaryMetrics.totalPotentialProfit || 0, settings)}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>(Sale Value - Cost Value)</span>
            <span className="font-semibold text-emerald-400 font-mono">
              {summaryMetrics.totalPotentialProfit >= 0 ? '+' : ''}
              {((summaryMetrics.totalPotentialProfit / (summaryMetrics.totalClosingStockPurchase || 1)) * 100).toFixed(1)}% Markup
            </span>
          </div>
        </div>

        {/* Card 4: Profit Margin % */}
        <div className="relative overflow-hidden bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg hover:border-slate-700 transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-purple-400" />
              Profit Margin %
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-purple-400 font-mono">
            {(summaryMetrics.profitMargin || 0).toFixed(2)}%
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>Stock Status</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> {summaryMetrics.inStockCount} Ok
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" /> {summaryMetrics.lowStockCount} Low
              <span className="w-2 h-2 rounded-full bg-rose-400 ml-1" /> {summaryMetrics.outOfStockCount} Out
            </span>
          </div>
        </div>
      </div>

      {/* 3. finias POS Filters Accordion Box */}
      {!isFilterCollapsed && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl transition-all animate-fadeIn">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Filters & Parameters</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                {filteredRows.length} Matches Found
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                Business Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                Brand
              </label>
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Unit
              </label>
              <select
                value={unitFilter}
                onChange={(e) => {
                  setUnitFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.shortName || u.name}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Type Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Product Type
              </label>
              <select
                value={productTypeFilter}
                onChange={(e) => {
                  setProductTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="single">Single</option>
                <option value="variable">Variable</option>
                <option value="combo">Combo / Bundle</option>
              </select>
            </div>

            {/* Stock Alert Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Stock Status
              </label>
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock (Healthy)</option>
                <option value="low_stock">Low Stock (≤ Alert Level)</option>
                <option value="out_of_stock">Out of Stock (0 Quantity)</option>
              </select>
            </div>

            {/* Tax Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Tax Rate / Group
              </label>
              <select
                value={taxFilter}
                onChange={(e) => {
                  setTaxFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Taxes</option>
                {taxGroups.map((tg) => (
                  <option key={tg.id} value={tg.id}>
                    {tg.name} ({tg.totalRate}%)
                  </option>
                ))}
                {taxRates.map((tr) => (
                  <option key={tr.id} value={String(tr.rate)}>
                    {tr.name} ({tr.rate}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Instant Search Bar */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Search SKU / Name / Barcode
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by product, SKU, barcode..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Visibility Section (Placed right after Filters & Parameters) */}
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
                  {Object.values(visibleColumns).filter(Boolean).length} Visible
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Select which columns to display in the report table.
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnDropdown && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue: Record<string, boolean> = {};
                    Object.keys(visibleColumns).forEach(k => allTrue[k] = true);
                    setVisibleColumns(allTrue as any);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  All
                </button>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                showColumnDropdown 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {showColumnDropdown ? (
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

        {showColumnDropdown && (
          <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Object.entries(visibleColumns).map(([key, isVisible]) => (
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
                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
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

      {/* 5. finias POS Main Stock Data Table with Integrated Table Controls & Clear Horizontal Scrollbar */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Integrated Table Header Controls */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
              <span>entries</span>
            </div>

            <span className="text-slate-700 hidden sm:inline">|</span>

            <span className="text-xs text-slate-400 whitespace-nowrap">
              Showing <strong className="text-white font-mono">{sortedRows.length === 0 ? 0 : (currentPage - 1) * (pageSize === -1 ? sortedRows.length : pageSize) + 1}</strong> to{' '}
              <strong className="text-white font-mono">
                {pageSize === -1 ? sortedRows.length : Math.min(currentPage * pageSize, sortedRows.length)}
              </strong>{' '}
              of <strong className="text-white font-mono">{sortedRows.length}</strong> items
            </span>
          </div>
        </div>

        <div className="overflow-x-auto w-full custom-scrollbar stock-report-table-scrollbar">
          <table className="w-full min-w-[1450px] text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md shadow-sm">
              <tr className="text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800 select-none">
                {visibleColumns.action && (
                  <th className="py-3.5 px-3 text-center w-14 sticky left-0 z-30 bg-slate-950 border-r border-slate-800 shadow-sm">
                    Action
                  </th>
                )}

                {visibleColumns.sku && (
                  <th
                    onClick={() => handleSort('sku')}
                    className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[120px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SKU</span>
                      {sortField === 'sku' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.product && (
                  <th
                    onClick={() => handleSort('productName')}
                    className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors min-w-[240px] max-w-[320px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product</span>
                      {sortField === 'productName' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.variation && (
                  <th
                    onClick={() => handleSort('variationName')}
                    className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[110px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Variation</span>
                      {sortField === 'variationName' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.category && (
                  <th
                    onClick={() => handleSort('category')}
                    className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[120px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortField === 'category' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.location && (
                  <th className="py-3.5 px-3 whitespace-nowrap min-w-[130px]">Location</th>
                )}

                {visibleColumns.costPrice && (
                  <th
                    onClick={() => handleSort('costPrice')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[110px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Unit Cost</span>
                      {sortField === 'costPrice' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.sellingPrice && (
                  <th
                    onClick={() => handleSort('sellingPrice')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[110px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Unit Price</span>
                      {sortField === 'sellingPrice' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.currentStock && (
                  <th
                    onClick={() => handleSort('currentStock')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[130px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Current Stock</span>
                      {sortField === 'currentStock' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.stockValuePurchase && (
                  <th
                    onClick={() => handleSort('stockValuePurchase')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[140px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Stock Value (Cost)</span>
                      {sortField === 'stockValuePurchase' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.stockValueSale && (
                  <th
                    onClick={() => handleSort('stockValueSale')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[140px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Stock Value (Sale)</span>
                      {sortField === 'stockValueSale' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.potentialProfit && (
                  <th
                    onClick={() => handleSort('potentialProfit')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[130px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Potential Profit</span>
                      {sortField === 'potentialProfit' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.profitMargin && (
                  <th
                    onClick={() => handleSort('profitMarginPercent')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[90px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Margin %</span>
                      {sortField === 'profitMarginPercent' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.totalUnitSold && (
                  <th
                    onClick={() => handleSort('totalUnitSold')}
                    className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap min-w-[110px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Sold</span>
                      {sortField === 'totalUnitSold' && (
                        <span className="text-indigo-400 font-bold">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                )}

                {visibleColumns.totalUnitTransferred && (
                  <th className="py-3.5 px-3 text-right whitespace-nowrap min-w-[110px]">Transferred</th>
                )}

                {visibleColumns.totalUnitAdjusted && (
                  <th className="py-3.5 px-3 text-right whitespace-nowrap min-w-[110px]">Adjusted</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 text-slate-300">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-16 text-center text-slate-500">
                    <Boxes className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-base font-semibold text-slate-400">No stock records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters, location, or search query</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const isOutOfStock = row.currentStock <= 0;
                  const isLowStock = row.currentStock > 0 && row.currentStock <= row.alertQuantity;

                  return (
                    <tr
                      key={`${row.productId}_${row.variationId || idx}`}
                      className="hover:bg-slate-800/60 transition-colors group"
                    >
                      {/* Action column - Sticky left */}
                      {visibleColumns.action && (
                        <td className="py-2.5 px-3 text-center sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800 border-r border-slate-800 shadow-sm">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setHistoryProduct(row.rawProduct)}
                              title="Product Stock History & Movement Ledger"
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/80 border border-slate-700 hover:border-indigo-500/50 transition-all"
                            >
                              <History className="w-3.5 h-3.5 text-indigo-400" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* SKU */}
                      {visibleColumns.sku && (
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                            {row.sku}
                          </span>
                        </td>
                      )}

                      {/* Product */}
                      {visibleColumns.product && (
                        <td className="py-2.5 px-3 min-w-[240px] max-w-[320px]">
                          <div className="flex items-center gap-2.5">
                            {row.image ? (
                              <img
                                src={row.image}
                                alt={row.productName}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-800"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white truncate" title={row.productName}>
                                {row.productName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span className="truncate max-w-[120px]">{row.brand}</span>
                                {row.barcode && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-slate-400">{row.barcode}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Variation */}
                      {visibleColumns.variation && (
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800/80 text-slate-400 border border-slate-700">
                            {row.variationName}
                          </span>
                        </td>
                      )}

                      {/* Category */}
                      {visibleColumns.category && (
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px]">
                            {row.category}
                          </span>
                        </td>
                      )}

                      {/* Location */}
                      {visibleColumns.location && (
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {row.locationName}
                        </td>
                      )}

                      {/* Unit Cost */}
                      {visibleColumns.costPrice && (
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                          {formatCurrency(row.costPrice, settings)}
                        </td>
                      )}

                      {/* Unit Selling Price */}
                      {visibleColumns.sellingPrice && (
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                          {formatCurrency(row.sellingPrice, settings)}
                        </td>
                      )}

                      {/* Current Stock */}
                      {visibleColumns.currentStock && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                isOutOfStock
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : isLowStock
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {row.currentStock.toFixed(2)} {row.unit}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Stock Value (Cost) */}
                      {visibleColumns.stockValuePurchase && (
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                          {formatCurrency(row.stockValuePurchase, settings)}
                        </td>
                      )}

                      {/* Stock Value (Sale) */}
                      {visibleColumns.stockValueSale && (
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                          {formatCurrency(row.stockValueSale, settings)}
                        </td>
                      )}

                      {/* Potential Profit */}
                      {visibleColumns.potentialProfit && (
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-400 whitespace-nowrap">
                          {formatCurrency(row.potentialProfit, settings)}
                        </td>
                      )}

                      {/* Margin % */}
                      {visibleColumns.profitMargin && (
                        <td className="py-2.5 px-3 text-right font-mono text-purple-400 whitespace-nowrap font-medium">
                          {row.profitMarginPercent.toFixed(1)}%
                        </td>
                      )}

                      {/* Total Sold */}
                      {visibleColumns.totalUnitSold && (
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                          {row.totalUnitSold.toFixed(2)} {row.unit}
                        </td>
                      )}

                      {/* Transferred */}
                      {visibleColumns.totalUnitTransferred && (
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                          {row.totalUnitTransferred.toFixed(2)} {row.unit}
                        </td>
                      )}

                      {/* Adjusted */}
                      {visibleColumns.totalUnitAdjusted && (
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                          {row.totalUnitAdjusted.toFixed(2)} {row.unit}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* 6. Footer Summary Totals Row */}
            {sortedRows.length > 0 && (
              <tfoot className="bg-slate-950/95 shadow-lg border-t-2 border-slate-700">
                <tr className="text-white font-bold font-mono">
                  {visibleColumns.action && (
                    <td className="py-3 px-3 text-center sticky left-0 z-10 bg-slate-950 border-r border-slate-800 shadow-sm text-xs text-indigo-400 font-bold">
                      TOTAL
                    </td>
                  )}
                  {visibleColumns.sku && <td className="py-3 px-3 whitespace-nowrap">—</td>}
                  {visibleColumns.product && (
                    <td className="py-3 px-3 font-sans font-bold whitespace-nowrap">
                      Aggregated ({summaryMetrics.itemCount} Items)
                    </td>
                  )}
                  {visibleColumns.variation && <td className="py-3 px-3 whitespace-nowrap">—</td>}
                  {visibleColumns.category && <td className="py-3 px-3 whitespace-nowrap">—</td>}
                  {visibleColumns.location && <td className="py-3 px-3 whitespace-nowrap">—</td>}
                  {visibleColumns.costPrice && <td className="py-3 px-3 text-right whitespace-nowrap">—</td>}
                  {visibleColumns.sellingPrice && <td className="py-3 px-3 text-right whitespace-nowrap">—</td>}
                  {visibleColumns.currentStock && (
                    <td className="py-3 px-3 text-right text-emerald-400 font-extrabold whitespace-nowrap">
                      {summaryMetrics.totalStockQty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  )}
                  {visibleColumns.stockValuePurchase && (
                    <td className="py-3 px-3 text-right text-white font-extrabold whitespace-nowrap">
                      {formatCurrency(summaryMetrics.totalClosingStockPurchase, settings)}
                    </td>
                  )}
                  {visibleColumns.stockValueSale && (
                    <td className="py-3 px-3 text-right text-emerald-400 font-extrabold whitespace-nowrap">
                      {formatCurrency(summaryMetrics.totalClosingStockSale, settings)}
                    </td>
                  )}
                  {visibleColumns.potentialProfit && (
                    <td className="py-3 px-3 text-right text-indigo-400 font-extrabold whitespace-nowrap">
                      {formatCurrency(summaryMetrics.totalPotentialProfit, settings)}
                    </td>
                  )}
                  {visibleColumns.profitMargin && (
                    <td className="py-3 px-3 text-right text-purple-400 font-extrabold whitespace-nowrap">
                      {summaryMetrics.profitMargin.toFixed(1)}%
                    </td>
                  )}
                  {visibleColumns.totalUnitSold && (
                    <td className="py-3 px-3 text-right text-slate-200 whitespace-nowrap">
                      {summaryMetrics.totalUnitsSold.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  )}
                  {visibleColumns.totalUnitTransferred && (
                    <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                      {summaryMetrics.totalUnitsTransferred.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  )}
                  {visibleColumns.totalUnitAdjusted && (
                    <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                      {summaryMetrics.totalUnitsAdjusted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 7. Table Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-950/80 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              Page <strong className="text-white font-mono">{currentPage}</strong> of{' '}
              <strong className="text-white font-mono">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 8. Product Stock Movement Ledger / History Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {historyProduct.name}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {historyProduct.sku}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Product Stock Movement Ledger & Transaction Audit Trail
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-header Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/80 border-b border-slate-800 text-xs shrink-0">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Current Balance</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {historyProduct.currentStock} {historyProduct.unit}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Unit Purchase Cost</span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatCurrency(historyProduct.costPrice, settings)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Unit Selling Price</span>
                <span className="text-sm font-bold text-indigo-400 font-mono">
                  {formatCurrency(historyProduct.sellingPrice, settings)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400 block mb-0.5">Alert Level</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {historyProduct.alertQuantity} {historyProduct.unit}
                </span>
              </div>
            </div>

            {/* Ledger Timeline Table with Guaranteed Scroll Container */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-4 custom-scrollbar">
              {productStockHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-sm font-medium text-slate-400">No transaction movements recorded yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Purchases, POS sales, returns, and adjustments will appear here
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-950 z-10">
                    <tr className="text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Reference No</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Location / Party</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Quantity In/Out</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Unit Price</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Total Value</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {productStockHistory.map((m, i) => {
                      const isPositive = m.qtyChange > 0;
                      return (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            {m.date.substring(0, 16)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-indigo-400 whitespace-nowrap">
                            {m.refNo}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                                m.type === 'purchase'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : m.type === 'sale'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : m.type === 'sale_return'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : m.type === 'purchase_return'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {m.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-white font-medium block whitespace-nowrap">{m.partyName}</span>
                            <span className="block text-[10px] text-slate-500 whitespace-nowrap">{m.location}</span>
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${m.qtyChange}` : m.qtyChange} {historyProduct.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                            {formatCurrency(m.unitPrice, settings)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                            {formatCurrency(m.totalValue, settings)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                            {m.balance} {historyProduct.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              >
                Close Stock Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Adjust Modal */}
      {isAdjustmentModalOpen && (
        <StockAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
        />
      )}

      {/* Quick Transfer Modal */}
      {isTransferModalOpen && (
        <StockTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
        />
      )}
    </div>
  );
};
export default StockReportView;
