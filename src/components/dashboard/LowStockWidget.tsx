import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import { Product } from '../../types/erp';
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Warehouse,
  Truck,
  ExternalLink,
  Layers,
  Sparkles,
  X,
  SlidersHorizontal,
} from 'lucide-react';

export interface LowStockItem {
  id: string; // unique key (product id or variation id)
  productId: string;
  variationId?: string;
  variationName?: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  image?: string;
  currentStock: number;
  alertQuantity: number;
  costPrice: number;
  sellingPrice: number;
  deficit: number;
  suggestedRestockQty: number;
  estimatedRestockCost: number;
  urgency: 'out_of_stock' | 'critical' | 'low_stock';
  isVariation: boolean;
}

interface LowStockWidgetProps {
  onOpenQuickPurchase?: () => void;
  className?: string;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  onOpenQuickPurchase,
  className = '',
}) => {
  const {
    products = [],
    locations = [],
    selectedLocationId = '',
    suppliers = [],
    settings = {},
    createPurchase,
    updateProduct,
    showFlashNotification,
    setActiveTab,
  } = useErp() || {};

  const isDark = settings.themeMode === 'dark';
  const currencySymbol = settings.currencySymbol || '$';

  // Filter & Search states
  const [filterType, setFilterType] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'deficit_desc' | 'stock_asc' | 'cost_desc'>('deficit_desc');

  // Restock modal state
  const [selectedRestockItem, setSelectedRestockItem] = useState<LowStockItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockCost, setRestockCost] = useState<number>(0);
  const [restockSupplierId, setRestockSupplierId] = useState<string>('');
  const [restockLocationId, setRestockLocationId] = useState<string>('');
  const [restockType, setRestockType] = useState<'received' | 'ordered'>('received');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch restock modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'received' | 'ordered'>('received');

  // Extract all low-stock items (including variations)
  const lowStockItems = useMemo<LowStockItem[]>(() => {
    if (!products || !Array.isArray(products)) return [];

    const items: LowStockItem[] = [];

    products.forEach((prod) => {
      if (!prod) return;
      const isVariable = prod.type === 'variable' && Array.isArray(prod.variations) && prod.variations.length > 0;

      if (isVariable) {
        prod.variations!.forEach((v: any) => {
          const vStock = Number(v.currentStock ?? 0);
          const vAlert = Number(v.alertQuantity ?? prod.alertQuantity ?? 5);

          if (vStock <= vAlert) {
            const deficit = Math.max(0, vAlert - vStock);
            const suggested = deficit > 0 ? deficit + Math.ceil(vAlert * 0.5) : Math.max(5, vAlert);
            const cost = Number(v.costPrice ?? prod.costPrice ?? 0);
            const varLabel = v.value || v.name || 'Variation';

            items.push({
              id: `${prod.id}_${v.id || v.sku}`,
              productId: prod.id,
              variationId: v.id,
              variationName: varLabel,
              name: `${prod.name} (${varLabel})`,
              sku: v.sku || prod.sku,
              unit: prod.unit || 'Pc',
              category: prod.category || 'General',
              image: v.image || prod.image,
              currentStock: vStock,
              alertQuantity: vAlert,
              costPrice: cost,
              sellingPrice: Number(v.sellingPrice ?? prod.sellingPrice ?? 0),
              deficit,
              suggestedRestockQty: suggested,
              estimatedRestockCost: Math.round(suggested * cost * 100) / 100,
              urgency: vStock <= 0 ? 'out_of_stock' : (vStock <= Math.ceil(vAlert / 2) ? 'critical' : 'low_stock'),
              isVariation: true,
            });
          }
        });
      } else {
        const stock = Number(prod.currentStock ?? 0);
        const alert = Number(prod.alertQuantity ?? 5);

        if (stock <= alert) {
          const deficit = Math.max(0, alert - stock);
          const suggested = deficit > 0 ? deficit + Math.ceil(alert * 0.5) : Math.max(5, alert);
          const cost = Number(prod.costPrice ?? 0);

          items.push({
            id: prod.id,
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            unit: prod.unit || 'Pc',
            category: prod.category || 'General',
            image: prod.image,
            currentStock: stock,
            alertQuantity: alert,
            costPrice: cost,
            sellingPrice: Number(prod.sellingPrice ?? 0),
            deficit,
            suggestedRestockQty: suggested,
            estimatedRestockCost: Math.round(suggested * cost * 100) / 100,
            urgency: stock <= 0 ? 'out_of_stock' : (stock <= Math.ceil(alert / 2) ? 'critical' : 'low_stock'),
            isVariation: false,
          });
        }
      }
    });

    return items;
  }, [products]);

  // Filter & Sort
  const filteredItems = useMemo(() => {
    let list = [...lowStockItems];

    if (filterType === 'out_of_stock') {
      list = list.filter((i) => i.currentStock <= 0);
    } else if (filterType === 'low_stock') {
      list = list.filter((i) => i.currentStock > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'deficit_desc') {
      list.sort((a, b) => b.deficit - a.deficit || a.currentStock - b.currentStock);
    } else if (sortBy === 'stock_asc') {
      list.sort((a, b) => a.currentStock - b.currentStock);
    } else if (sortBy === 'cost_desc') {
      list.sort((a, b) => b.estimatedRestockCost - a.estimatedRestockCost);
    }

    return list;
  }, [lowStockItems, filterType, searchQuery, sortBy]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const outOfStockCount = lowStockItems.filter((i) => i.currentStock <= 0).length;
    const criticalCount = lowStockItems.filter((i) => i.urgency === 'critical').length;
    const totalDeficitQty = lowStockItems.reduce((acc, i) => acc + i.deficit, 0);
    const totalEstimatedReorderVal = lowStockItems.reduce((acc, i) => acc + (i.suggestedRestockQty * i.costPrice), 0);

    return {
      total: lowStockItems.length,
      outOfStockCount,
      criticalCount,
      totalDeficitQty,
      totalEstimatedReorderVal,
    };
  }, [lowStockItems]);

  // Open Quick Restock Modal for an item
  const handleOpenRestock = (item: LowStockItem) => {
    setSelectedRestockItem(item);
    setRestockQty(item.suggestedRestockQty > 0 ? item.suggestedRestockQty : 10);
    setRestockCost(item.costPrice);
    setRestockSupplierId(suppliers[0]?.id || 'sup_metro');
    setRestockLocationId(selectedLocationId || locations[0]?.id || 'loc_main');
    setRestockType('received');
  };

  // 1-Click Instant Replenishment directly from the card
  const handleInstantQuickInward = (item: LowStockItem, customQty?: number) => {
    const qtyToReceive = customQty || item.suggestedRestockQty || 10;
    const defaultSupplier = suppliers[0]?.id || 'sup_metro';
    const targetLoc = selectedLocationId || locations[0]?.id || 'loc_main';
    const unitCost = item.costPrice || 50;
    const lineTotal = qtyToReceive * unitCost;

    try {
      createPurchase({
        supplierId: defaultSupplier,
        locationId: targetLoc,
        type: 'purchase',
        status: 'received',
        items: [
          {
            productId: item.productId,
            productName: item.name,
            sku: item.sku,
            unit: item.unit,
            quantity: qtyToReceive,
            unitPrice: unitCost,
            costPrice: unitCost,
            taxRate: 0,
            discount: 0,
            total: lineTotal,
            sellingPrice: item.sellingPrice,
          },
        ],
        subtotal: lineTotal,
        taxAmount: 0,
        discountAmount: 0,
        shippingCharges: 0,
        totalAmount: lineTotal,
        paidAmount: lineTotal,
        paymentMethod: 'cash',
        notes: `Quick Dashboard Restock for ${item.name} (+${qtyToReceive} ${item.unit})`,
      });

      showFlashNotification(
        `Restocked +${qtyToReceive} ${item.unit} for "${item.name}". Stock replenished!`,
        'success'
      );
    } catch (err: any) {
      showFlashNotification(`Restock failed: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  // Submit Modal Restock
  const handleConfirmModalRestock = () => {
    if (!selectedRestockItem) return;
    setIsSubmitting(true);

    const qty = Math.max(1, Number(restockQty) || 1);
    const unitCost = Math.max(0, Number(restockCost) || 0);
    const lineTotal = qty * unitCost;
    const supplierId = restockSupplierId || suppliers[0]?.id || 'sup_metro';
    const locationId = restockLocationId || selectedLocationId || locations[0]?.id || 'loc_main';

    try {
      createPurchase({
        supplierId,
        locationId,
        type: 'purchase',
        status: restockType,
        items: [
          {
            productId: selectedRestockItem.productId,
            productName: selectedRestockItem.name,
            sku: selectedRestockItem.sku,
            unit: selectedRestockItem.unit,
            quantity: qty,
            unitPrice: unitCost,
            costPrice: unitCost,
            taxRate: 0,
            discount: 0,
            total: lineTotal,
            sellingPrice: selectedRestockItem.sellingPrice,
          },
        ],
        subtotal: lineTotal,
        taxAmount: 0,
        discountAmount: 0,
        shippingCharges: 0,
        totalAmount: lineTotal,
        paidAmount: restockType === 'received' ? lineTotal : 0,
        paymentMethod: 'cash',
        notes: `${restockType === 'received' ? 'Direct Inward' : 'Purchase Order'} created via Low Stock Command Hub`,
      });

      showFlashNotification(
        restockType === 'received'
          ? `Successfully received ${qty} ${selectedRestockItem.unit} of ${selectedRestockItem.name}!`
          : `Purchase Order issued for ${qty} ${selectedRestockItem.unit} of ${selectedRestockItem.name}!`,
        'success'
      );

      setSelectedRestockItem(null);
    } catch (err: any) {
      showFlashNotification(`Restock failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch Restock All
  const handleConfirmBatchRestock = () => {
    if (lowStockItems.length === 0) return;
    setIsSubmitting(true);

    const defaultSupplier = suppliers[0]?.id || 'sup_metro';
    const targetLoc = selectedLocationId || locations[0]?.id || 'loc_main';

    const purchaseItems = lowStockItems.map((item) => {
      const qty = item.suggestedRestockQty > 0 ? item.suggestedRestockQty : Math.max(5, item.alertQuantity);
      const cost = item.costPrice > 0 ? item.costPrice : 50;
      return {
        productId: item.productId,
        productName: item.name,
        sku: item.sku,
        unit: item.unit,
        quantity: qty,
        unitPrice: cost,
        costPrice: cost,
        taxRate: 0,
        discount: 0,
        total: qty * cost,
        sellingPrice: item.sellingPrice,
      };
    });

    const totalCost = purchaseItems.reduce((acc, i) => acc + i.total, 0);

    try {
      createPurchase({
        supplierId: defaultSupplier,
        locationId: targetLoc,
        type: 'purchase',
        status: batchActionType,
        items: purchaseItems,
        subtotal: totalCost,
        taxAmount: 0,
        discountAmount: 0,
        shippingCharges: 0,
        totalAmount: totalCost,
        paidAmount: batchActionType === 'received' ? totalCost : 0,
        paymentMethod: 'cash',
        notes: `Bulk Restock Inward for ${purchaseItems.length} low-stock inventory lines`,
      });

      showFlashNotification(
        batchActionType === 'received'
          ? `Bulk restock complete! Replenished ${purchaseItems.length} items (${formatCurrency(totalCost, settings)}).`
          : `Consolidated Purchase Order generated for ${purchaseItems.length} items (${formatCurrency(totalCost, settings)})!`,
        'success'
      );

      setShowBatchModal(false);
    } catch (err: any) {
      showFlashNotification(`Bulk restock error: ${err.message || 'Failed to process'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo simulation trigger (in case all products have high stock)
  const handleSimulateLowStock = () => {
    if (!products || products.length === 0) return;
    const target = products[0];
    if (target) {
      updateProduct(target.id, {
        currentStock: 1,
        alertQuantity: 10,
      });
      showFlashNotification(`Simulated low stock on "${target.name}" (1 left, threshold 10)`, 'info');
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
      } ${className}`}
    >
      {/* 1. Header & Live Command Strip */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl flex items-center justify-center ${
                metrics.outOfStockCount > 0
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : metrics.total > 0
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 ${metrics.outOfStockCount > 0 ? 'animate-pulse text-rose-400' : 'text-amber-400'}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Low Stock & Reorder Hub
                </h3>
                {metrics.total > 0 && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      metrics.outOfStockCount > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {metrics.total} {metrics.total === 1 ? 'Item' : 'Items'} Below Threshold
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Automated threshold monitoring · 1-click supplier purchase replenishments
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {metrics.total > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restock All Deficits ({metrics.total})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenQuickPurchase) onOpenQuickPurchase();
                  else setActiveTab('add_purchase');
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Purchase Form</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSimulateLowStock}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-amber-700/40'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate Low Stock Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar (Clean Unboxed Numbers) */}
      {metrics.total > 0 && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:px-5 border-b text-xs ${
            isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <div>
            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Critical Out of Stock
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-base font-extrabold font-mono ${metrics.outOfStockCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {metrics.outOfStockCount}
              </span>
              <span className="text-[11px] text-slate-500">lines</span>
            </div>
          </div>

          <div>
            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Below Reorder Level
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-extrabold font-mono text-amber-400">
                {metrics.total - metrics.outOfStockCount}
              </span>
              <span className="text-[11px] text-slate-500">lines</span>
            </div>
          </div>

          <div>
            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Total Stock Deficit
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-extrabold font-mono text-indigo-400">
                {metrics.totalDeficitQty}
              </span>
              <span className="text-[11px] text-slate-500">units to threshold</span>
            </div>
          </div>

          <div>
            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Est. Inward Cost
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-extrabold font-mono text-emerald-400">
                {formatCurrency(metrics.totalEstimatedReorderVal, settings)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter, Search & Segmented Controls Bar */}
      {metrics.total > 0 && (
        <div className="p-3 sm:px-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Functional Button Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-start">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Alert Items ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('out_of_stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'out_of_stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Out of Stock ({metrics.outOfStockCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('low_stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Low Stock ({metrics.total - metrics.outOfStockCount})
            </button>
          </div>

          {/* Search & Sort Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search low stock SKU/name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-indigo-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-2.5 py-1.5 text-xs rounded-xl border font-medium focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="deficit_desc">Deficit (Highest)</option>
              <option value="stock_asc">Stock (Lowest)</option>
              <option value="cost_desc">Reorder Cost (Highest)</option>
            </select>
          </div>
        </div>
      )}

      {/* 4. Main Products Display Area */}
      {metrics.total === 0 ? (
        // Empty State: All Stock Levels Optimal
        <div className="p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              All Stock Levels Are Optimal
            </h4>
            <p className={`text-xs max-w-md mx-auto mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Every catalog item and variation currently holds stock above its configured alert threshold.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              View Inventory Matrix
            </button>
            <button
              type="button"
              onClick={handleSimulateLowStock}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              Simulate Stock Depletion
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        // Empty search/filter state
        <div className="p-8 text-center text-slate-500 text-xs">
          No low stock items match the current query "{searchQuery}".
        </div>
      ) : (
        // Responsive Item Grid
        <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const isOOS = item.currentStock <= 0;
            const pct = Math.min(100, Math.round((item.currentStock / Math.max(1, item.alertQuantity)) * 100));

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 hover:border-indigo-500/50 ${
                  isDark
                    ? isOOS
                      ? 'bg-rose-950/15 border-rose-900/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950'
                    : isOOS
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-slate-50/50 border-slate-200 hover:bg-white'
                }`}
              >
                {/* Card Top: Details */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Product Thumbnail / Icon */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback on image error
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                        </div>
                        {/* Clean unboxed metadata with dot separators */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                          <span className="text-slate-500">{item.sku}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span>{item.category}</span>
                          {item.variationName && (
                            <>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                              <span className="text-purple-400 font-sans">{item.variationName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Urgency Badge */}
                    <div className="shrink-0 text-right">
                      {isOOS ? (
                        <span className="text-[10px] font-bold font-mono text-rose-400 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          OUT OF STOCK
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold font-mono text-amber-400 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          LOW STOCK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Level Bar / Deficit Meter */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold ${isOOS ? 'text-rose-400' : 'text-amber-400'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                        <span className="text-slate-500">in stock</span>
                      </div>
                      <div className="text-slate-400">
                        Alert: <span className="font-bold text-slate-300">{item.alertQuantity} {item.unit}</span>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOOS
                            ? 'w-1 bg-rose-500'
                            : pct <= 35
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>

                    {/* Deficit Callout */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                      <span className={item.deficit > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                        Deficit: {item.deficit > 0 ? `-${item.deficit}` : '0'} {item.unit}
                      </span>
                      <span>
                        Est. Inward: <strong className="text-emerald-400 font-bold">{formatCurrency(item.suggestedRestockQty * item.costPrice, settings)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions: Trending Quick Restock */}
                <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInstantQuickInward(item, item.suggestedRestockQty)}
                    className="flex-1 py-1.5 px-2.5 bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    title={`Instant 1-click inward receipt of +${item.suggestedRestockQty} ${item.unit}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+{item.suggestedRestockQty} Inward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRestock(item)}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Customize supplier, quantity, cost, or generate official PO"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Reorder</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Quick Restock Modal Dialog */}
      {selectedRestockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl relative ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Quick Restock Order</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedRestockItem.name} ({selectedRestockItem.sku})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRestockItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">CURRENT STOCK</span>
                <span className={selectedRestockItem.currentStock <= 0 ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedRestockItem.currentStock} {selectedRestockItem.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ALERT LEVEL</span>
                <span className="text-slate-200 font-bold">
                  {selectedRestockItem.alertQuantity} {selectedRestockItem.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">DEFICIT</span>
                <span className="text-rose-400 font-bold">
                  -{selectedRestockItem.deficit} {selectedRestockItem.unit}
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3.5 text-xs">
              {/* Restock Quantity with Fast Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">
                    Restock Quantity ({selectedRestockItem.unit}) *
                  </label>
                  {/* Preset chips */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: `+${selectedRestockItem.suggestedRestockQty} (Suggested)`, val: selectedRestockItem.suggestedRestockQty },
                      { label: '+10', val: 10 },
                      { label: '+25', val: 25 },
                      { label: '+50', val: 50 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setRestockQty(chip.val)}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono transition cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockQty(Math.max(1, (Number(restockQty) || 1) - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold text-lg flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-center font-bold text-white text-base focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setRestockQty((Number(restockQty) || 1) + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold text-lg flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Supplier & Destination Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Vendor / Supplier
                  </label>
                  <select
                    value={restockSupplierId}
                    onChange={(e) => setRestockSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Receiving Warehouse Location
                  </label>
                  <select
                    value={restockLocationId}
                    onChange={(e) => setRestockLocationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit Purchase Cost & Estimated Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Unit Cost Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={restockCost}
                    onChange={(e) => setRestockCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Total Estimated Cost
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 font-mono font-extrabold text-emerald-400 text-sm flex items-center h-[38px]">
                    {formatCurrency(Number(restockQty || 0) * Number(restockCost || 0), settings)}
                  </div>
                </div>
              </div>

              {/* Order Flow: Instant Inward vs Official PO */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Execution Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                      restockType === 'received'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restockType"
                      checked={restockType === 'received'}
                      onChange={() => setRestockType('received')}
                      className="text-emerald-600"
                    />
                    <div>
                      <div className="font-bold text-xs">Direct Inward</div>
                      <div className="text-[10px] opacity-75">Replenish stock now</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                      restockType === 'ordered'
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="restockType"
                      checked={restockType === 'ordered'}
                      onChange={() => setRestockType('ordered')}
                      className="text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-xs">Purchase Order</div>
                      <div className="text-[10px] opacity-75">Mark as Ordered (PO)</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRestockItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmModalRestock}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & {restockType === 'received' ? 'Inward Stock' : 'Create PO'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Batch Restock All Confirmation Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl relative ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Consolidated Bulk Restock</h3>
                  <p className="text-xs text-slate-400">
                    Replenish all {lowStockItems.length} products currently below safety thresholds
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List preview of items to replenish */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800 text-xs font-mono">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-slate-950/50">
                  <div>
                    <span className="font-bold font-sans text-white block">{item.name}</span>
                    <span className="text-[11px] text-slate-400">
                      SKU: {item.sku} · Current: {item.currentStock} · Deficit: -{item.deficit} {item.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-400 font-bold">+{item.suggestedRestockQty} {item.unit}</span>
                    <span className="text-slate-400 block text-[10px]">
                      {formatCurrency(item.suggestedRestockQty * item.costPrice, settings)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary details */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL ITEMS TO RESTOCK</span>
                <span className="font-bold text-white text-sm">{lowStockItems.length} Product Lines</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">CONSOLIDATED ORDER VALUE</span>
                <span className="font-bold text-emerald-400 text-base">
                  {formatCurrency(metrics.totalEstimatedReorderVal, settings)}
                </span>
              </div>
            </div>

            {/* Action Mode Radio */}
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="batchMode"
                  checked={batchActionType === 'received'}
                  onChange={() => setBatchActionType('received')}
                  className="text-indigo-600"
                />
                <span className="font-bold text-slate-200">Direct Inward (Update Stock Now)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="batchMode"
                  checked={batchActionType === 'ordered'}
                  onChange={() => setBatchActionType('ordered')}
                  className="text-indigo-600"
                />
                <span className="font-bold text-slate-200">Issue Reorder PO (Pending Receipt)</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmBatchRestock}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Batch Restock ({formatCurrency(metrics.totalEstimatedReorderVal, settings)})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
