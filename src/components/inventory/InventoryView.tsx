import { getCategoryName, getBrandName, formatCurrency } from "../../utils/formatters";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { Product } from '../../types/erp';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { UnitsView } from './UnitsView';
import { CategoriesView } from './CategoriesView';
import { BrandsView } from './BrandsView';
import { WarrantiesView } from './WarrantiesView';
import { RacksView } from './RacksView';
import { VariationsView } from './VariationsView';
import { ProductFormPage } from './ProductFormPage';
import { ProductImportModal } from './ProductImportModal';
import { ImportProductsPage } from './ImportProductsPage';
import { BatchManagementGuide } from './BatchManagementGuide';
import { ViewProductDetailsModal } from './ViewProductDetailsModal';
import { AddOpeningStockModal } from './AddOpeningStockModal';
import { ProductHistoryView } from './ProductHistoryView';
import { ProductHistoryModal } from './ProductHistoryModal';
import { StockTransferModal } from './StockTransferModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Boxes,
  Plus,
  Upload,
  ArrowRightLeft,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpDown,
  Download,
  Barcode,
  Printer,
  Scale,
  FolderTree,
  Award,
  ShieldCheck,
  MapPin,
  HelpCircle,
  Eye,
  PackagePlus,
  History,
  SlidersHorizontal,
  Lock,
  RotateCcw,
  Columns,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit,
  X,
  AlertTriangle,
  AlertCircle,
  Pencil,
} from 'lucide-react';

export interface ProductTableColumnVisibility {
  sku: boolean;
  image: boolean;
  name: boolean;
  category: boolean;
  brand: boolean;
  costPrice: boolean;
  sellingPrice: boolean;
  tax: boolean;
  rack: boolean;
  row: boolean;
  position: boolean;
  currentStock: boolean;
  status: boolean;
  actions: boolean;
}

const DEFAULT_COLUMN_VISIBILITY: ProductTableColumnVisibility = {
  sku: true,
  image: true,
  name: true,
  category: true,
  brand: true,
  costPrice: true,
  sellingPrice: true,
  tax: true,
  rack: true,
  row: true,
  position: true,
  currentStock: true,
  status: true,
  actions: true,
};

const COLUMN_STORAGE_KEY = 'erp_product_inventory_column_visibility_v1';

interface ColumnOption {
  key: keyof ProductTableColumnVisibility;
  label: string;
  category: 'General' | 'Pricing & Tax' | 'Warehouse Location' | 'Inventory & Status';
  description: string;
  locked?: boolean;
}

const COLUMN_DEFINITIONS: ColumnOption[] = [
  { key: 'sku', label: 'SKU', category: 'General', description: 'Stock keeping unit code' },
  { key: 'image', label: 'Product Image', category: 'General', description: 'Thumbnail picture' },
  { key: 'name', label: 'Product Name', category: 'General', description: 'Title, variations & combo badges', locked: true },
  { key: 'category', label: 'Category', category: 'General', description: 'Product classification' },
  { key: 'brand', label: 'Brand', category: 'General', description: 'Brand or manufacturer' },
  { key: 'costPrice', label: 'Cost Price', category: 'Pricing & Tax', description: 'Purchase or production cost' },
  { key: 'sellingPrice', label: 'Selling Price', category: 'Pricing & Tax', description: 'Retail sale price' },
  { key: 'tax', label: 'Tax', category: 'Pricing & Tax', description: 'Applicable tax rate percentage' },
  { key: 'rack', label: 'Rack Storage', category: 'Warehouse Location', description: 'Aisle or rack allocation' },
  { key: 'row', label: 'Row / Tier', category: 'Warehouse Location', description: 'Vertical shelf or tier level' },
  { key: 'position', label: 'Position / Bin', category: 'Warehouse Location', description: 'Exact slot or bin index' },
  { key: 'currentStock', label: 'Current Stock', category: 'Inventory & Status', description: 'Total on-hand stock quantity' },
  { key: 'status', label: 'Status', category: 'Inventory & Status', description: 'Stock status alert badge' },
  { key: 'actions', label: 'Actions', category: 'Inventory & Status', description: 'View, edit, barcode, history & delete buttons' },
];

interface InventoryViewProps {
  onOpenAddProduct?: () => void;
  onOpenAdjustment: () => void;
  onOpenTransfer: () => void;
  onEditProduct?: (product: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddProduct,
  onOpenAdjustment,
  onOpenTransfer,
  onEditProduct,
}) => {
  const {
    products,
    categories: appCategories,
    brands: appBrands,
    warranties: appWarranties,
    units,
    locations,
    racks = [],
    settings,
    deleteProduct,
    stockAdjustments,
    stockTransfers,
    completeStockTransfer,
    deleteStockTransfer,
    deleteStockAdjustment,
    openBarcodeStudio,
    inventorySubTab,
    setInventorySubTab,
    editingProduct,
    openAddProductPage,
    openEditProductPage,
    closeProductPage,
    showFlashNotification,
    currentUser,
    hasPermission,
  } = useErp();

  const canCreate = hasPermission('canCreateProducts');
  const canEdit = hasPermission('canEditProducts');
  const canDelete = hasPermission('canDeleteProducts');
  const canManageStock = hasPermission('canManageStock');
  const canViewCost = hasPermission('canViewCostPrice');

  const [columnVisibility, setColumnVisibility] = useState<ProductTableColumnVisibility>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error reading column visibility from storage:', e);
    }
    return DEFAULT_COLUMN_VISIBILITY;
  });

  const isLight = settings.themeMode === 'light';
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);

  // Check if current user is admin, store manager, or inventory manager
  const isAdminOrManager = useMemo(() => {
    if (!currentUser) return true; // Default open access when no user logged in
    const role = currentUser.role;
    return role === 'supreme_admin' || role === 'admin' || role === 'manager' || role === 'inventory_manager';
  }, [currentUser]);

  
  const handleToggleColumn = (key: keyof ProductTableColumnVisibility) => {
    if (key === 'name') return; // Mandatory column
    if (!isAdminOrManager) {
      showFlashNotification('Access Restricted: Only Administrators and Store Managers can configure table column visibility.', 'error');
      return;
    }
    setColumnVisibility((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleApplyPreset = (preset: 'all' | 'standard' | 'compact' | 'logistics' | 'reset') => {
    if (!isAdminOrManager) {
      showFlashNotification('Access Restricted: Only Administrators and Store Managers can modify column visibility.', 'error');
      return;
    }
    let newVisibility: ProductTableColumnVisibility;
    switch (preset) {
      case 'all':
        newVisibility = {
          sku: true, image: true, name: true, category: true, brand: true,
          costPrice: true, sellingPrice: true, tax: true, rack: true,
          row: true, position: true, currentStock: true, status: true, actions: true
        };
        break;
      case 'standard':
        newVisibility = {
          sku: true, image: true, name: true, category: true, brand: true,
          costPrice: false, sellingPrice: true, tax: true, rack: false,
          row: false, position: false, currentStock: true, status: true, actions: true
        };
        break;
      case 'compact':
        newVisibility = {
          sku: true, image: false, name: true, category: false, brand: false,
          costPrice: false, sellingPrice: true, tax: false, rack: false,
          row: false, position: false, currentStock: true, status: true, actions: true
        };
        break;
      case 'logistics':
        newVisibility = {
          sku: true, image: false, name: true, category: true, brand: true,
          costPrice: false, sellingPrice: false, tax: false, rack: true,
          row: true, position: true, currentStock: true, status: true, actions: true
        };
        break;
      case 'reset':
      default:
        newVisibility = { ...DEFAULT_COLUMN_VISIBILITY };
        break;
    }
    setColumnVisibility(newVisibility);
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(newVisibility));
    showFlashNotification(`Column layout updated: ${preset.toUpperCase()} preset applied`, 'success');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [rackFilter, setRackFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'single' | 'variable' | 'combo'>('all');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [openingStockProduct, setOpeningStockProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Bulk Product Selection for Batch Actions & Export
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, rackFilter, stockStatusFilter, productTypeFilter]);

  const activeSubTab = inventorySubTab || 'matrix';
  const setActiveSubTab = (tab: 'matrix' | 'categories' | 'brands' | 'warranties' | 'units' | 'racks' | 'variations' | 'adjustments' | 'transfers' | 'add_product' | 'edit_product' | 'import_products' | 'batch_guide') => {
    if (tab === 'add_product') {
      openAddProductPage();
    } else {
      setInventorySubTab(tab as any);
    }
  };

  const categoryFilterList = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => {
      if (p?.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const rackFilterList = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => {
      if (p?.rack) set.add(p.rack);
    });
    return ['All', 'Unassigned', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (!p) return false;
      const pName = p.name || '';
      const pSku = p.sku || '';
      const pBarcode = p.barcode || '';
      const pHsn = p.hsnCode || '';
      const pCategory = p.category || '';
      const pBrand = p.brand || '';
      const pRack = p.rack || '';
      const pRow = p.row || '';
      const pPos = p.position || '';

      const matchSearch =
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pBarcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pHsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pRack.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pRow.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pPos.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCat = categoryFilter === 'All' || pCategory === categoryFilter;

      let matchRack = true;
      if (rackFilter === 'Unassigned') {
        matchRack = !p.rack;
      } else if (rackFilter !== 'All') {
        matchRack = p.rack === rackFilter;
      }

      let matchStock = true;
      const currentStock = p.currentStock ?? 0;
      const alertQty = p.alertQuantity ?? 5;
      if (stockStatusFilter === 'low') {
        matchStock = currentStock > 0 && currentStock <= alertQty;
      } else if (stockStatusFilter === 'out') {
        matchStock = currentStock <= 0;
      }

      let matchType = true;
      if (productTypeFilter !== 'all') {
        const pType = p.type || 'single';
        matchType = pType === productTypeFilter;
      }

      return matchSearch && matchCat && matchRack && matchStock && matchType;
    });
  }, [products, searchQuery, categoryFilter, rackFilter, stockStatusFilter, productTypeFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Bulk Selection State Calculations
  const isAllPageSelected = useMemo(() => {
    return paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedProductIds.has(p.id));
  }, [paginatedProducts, selectedProductIds]);

  const isSomePageSelected = useMemo(() => {
    return paginatedProducts.some((p) => selectedProductIds.has(p.id)) && !isAllPageSelected;
  }, [paginatedProducts, selectedProductIds, isAllPageSelected]);

  // Toggle single product selection
  const handleToggleProductSelect = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Toggle select / deselect all visible on current page
  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        paginatedProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        paginatedProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  // Select all products matching active filter criteria
  const handleSelectAllFiltered = () => {
    const next = new Set<string>();
    filteredProducts.forEach((p) => next.add(p.id));
    setSelectedProductIds(next);
    showFlashNotification(`Selected all ${filteredProducts.length} filtered products`, 'success');
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const stats = useMemo(() => {
    const list = products || [];
    const totalProducts = list.length;
    const totalStock = list.reduce((sum, p) => sum + (p.currentStock ?? 0), 0);
    const totalCostValuation = list.reduce((sum, p) => sum + (p.currentStock ?? 0) * (p.costPrice ?? 0), 0);
    const totalRetailValuation = list.reduce((sum, p) => sum + (p.currentStock ?? 0) * (p.sellingPrice ?? 0), 0);
    const potentialProfit = Math.max(0, totalRetailValuation - totalCostValuation);
    const lowStockAlerts = list.filter((p) => {
      const current = p.currentStock ?? 0;
      const alert = p.alertQuantity ?? 5;
      return current > 0 && current <= alert;
    }).length;
    const outOfStockAlerts = list.filter((p) => (p.currentStock ?? 0) <= 0).length;

    return {
      totalProducts,
      totalStock,
      totalCostValuation,
      totalRetailValuation,
      potentialProfit,
      lowStockAlerts,
      outOfStockAlerts,
    };
  }, [products]);

  const ActionButtons = ({ onView, onEdit, onDelete }: { onView: () => void; onEdit?: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-start gap-2">
      <button onClick={onView} className="p-1.5 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
      {onEdit && (
        <button onClick={onEdit} className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
      )}
      <button onClick={onDelete} className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  const [viewingTransfer, setViewingTransfer] = useState<any | null>(null);
  const [viewingAdjustment, setViewingAdjustment] = useState<any | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<any | null>(null);
  const [deletingTransfer, setDeletingTransfer] = useState<any | null>(null);
  const [deletingAdjustment, setDeletingAdjustment] = useState<any | null>(null);

  // If in Add or Edit Product mode, render the full-page product form
  if (activeSubTab === 'add_product' || activeSubTab === 'edit_product') {
    return (
      <ProductFormPage
        productToEdit={activeSubTab === 'edit_product' ? editingProduct : null}
        onBack={() => closeProductPage()}
        onSaved={() => closeProductPage()}
      />
    );
  }

  // If in Import Products mode, render the bulk import products page
  if (activeSubTab === 'import_products') {
    return <ImportProductsPage />;
  }

  // Export inventory CSV
  const handleExportCSV = (forceSelectedOnly: boolean = false) => {
    const isExportingSelected = forceSelectedOnly || selectedProductIds.size > 0;
    const itemsToExport = isExportingSelected
      ? (products || []).filter((p) => selectedProductIds.has(p.id))
      : filteredProducts.length > 0 ? filteredProducts : (products || []);

    if (itemsToExport.length === 0) {
      showFlashNotification('No products available to export', 'error');
      return;
    }

    const headers = ['SKU', 'Barcode', 'HSN Code', 'Product Name', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Tax Rate (%)', 'Current Stock', 'Alert Qty'];
    const rows = itemsToExport.map((p) => [
      p.sku || '',
      p.barcode || '',
      p.hsnCode || 'N/A',
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.category || '',
      p.brand || 'General',
      (p.costPrice ?? 0).toFixed(2),
      (p.sellingPrice ?? 0).toFixed(2),
      p.taxRate ?? 0,
      p.currentStock ?? 0,
      p.alertQuantity ?? 5,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filenamePrefix = isExportingSelected ? `selected_${itemsToExport.length}_products_` : 'inventory_';
    link.setAttribute('download', `ultimate_erp_${filenamePrefix}${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFlashNotification(`Exported ${itemsToExport.length} product(s) to CSV`, 'success');
  };

  // Export inventory PDF
  const handleExportPDF = (forceSelectedOnly: boolean = false) => {
    const isExportingSelected = forceSelectedOnly || selectedProductIds.size > 0;
    const itemsToExport = isExportingSelected
      ? (products || []).filter((p) => selectedProductIds.has(p.id))
      : filteredProducts.length > 0 ? filteredProducts : (products || []);

    if (itemsToExport.length === 0) {
      showFlashNotification('No products available to export', 'error');
      return;
    }

    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(16);
    doc.text(isExportingSelected ? `Selected Inventory Products (${itemsToExport.length})` : 'Inventory Product List', 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Items: ${itemsToExport.length}`, 14, 22);
    
    const headers = [['SKU', 'Product Name', 'Category', 'Brand', 'Cost', 'Price', 'Tax (%)', 'Stock', 'Alert']];
    
    const rows = itemsToExport.map((p) => [
      p.sku || '',
      p.name || '',
      p.category || '',
      p.brand || 'General',
      (p.costPrice ?? 0).toFixed(2),
      (p.sellingPrice ?? 0).toFixed(2),
      (p.taxRate ?? 0).toString(),
      (p.currentStock ?? 0).toString(),
      (p.alertQuantity ?? 5).toString(),
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
    });

    const filenamePrefix = isExportingSelected ? `selected_${itemsToExport.length}_products_` : 'inventory_';
    doc.save(`ultimate_erp_${filenamePrefix}${new Date().toISOString().slice(0, 10)}.pdf`);
    showFlashNotification(`Exported ${itemsToExport.length} product(s) to PDF`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-16">
      {/* Header & Sub-tabs */}
      {activeSubTab === 'matrix' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 transition-colors duration-300 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              <span>All Products</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track multi-warehouse inventory matrix, barcode generation, label printing, and transfers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="inv-add-product-btn"
              onClick={() => {
                if (!canCreate) {
                  showFlashNotification('Access Restricted: You have View Only permission for the Product Catalog. Product creation is disabled.', 'error');
                  return;
                }
                openAddProductPage();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition ${
                canCreate
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
              }`}
              title={canCreate ? 'Add new product' : 'View Only Access: Product Creation Disabled'}
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
              {!canCreate && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded ml-1">
                  View Only
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (!canCreate) {
                  showFlashNotification('Access Restricted: Bulk import is disabled for View Only access.', 'error');
                  return;
                }
                setInventorySubTab('import_products');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                canCreate
                  ? 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed opacity-80'
              }`}
              title={canCreate ? 'Import bulk products' : 'View Only Access: Bulk Import Disabled'}
            >
              <Upload className="w-4 h-4" />
              <span>Import Bulk</span>
            </button>
            <ExportButtons
              headers={['SKU', 'Barcode', 'HSN Code', 'Product Name', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Tax Rate (%)', 'Current Stock', 'Alert Qty']}
              keys={['sku', 'barcode', 'hsnCode', 'name', 'category', 'brand', 'costPrice', 'sellingPrice', 'taxRate', 'currentStock', 'alertQuantity']}
              data={filteredProducts.map(p => ({
                ...p,
                costPrice: (p.costPrice ?? 0).toFixed(2),
                sellingPrice: (p.sellingPrice ?? 0).toFixed(2),
                taxRate: p.taxRate ?? 0,
                currentStock: p.currentStock ?? 0,
                alertQuantity: p.alertQuantity ?? 5
              }))}
              filename="inventory_products"
              title="Inventory Products List"
              isLight={isLight}
            />
          </div>
        </div>
      )}

      {activeSubTab === 'categories' && (
        <div className="animate-fadeIn">
          <CategoriesView />
        </div>
      )}

      {activeSubTab === 'brands' && (
        <div className="animate-fadeIn">
          <BrandsView />
        </div>
      )}

      {activeSubTab === 'warranties' && (
        <div className="animate-fadeIn">
          <WarrantiesView />
        </div>
      )}

      {activeSubTab === 'units' && (
        <div className="animate-fadeIn">
          <UnitsView />
        </div>
      )}

      {activeSubTab === 'racks' && (
        <div className="animate-fadeIn">
          <RacksView />
        </div>
      )}

      {activeSubTab === 'variations' && (
        <div className="animate-fadeIn">
          <VariationsView />
        </div>
      )}

      {activeSubTab === 'batch_guide' && (
        <div className="animate-fadeIn">
          <BatchManagementGuide />
        </div>
      )}

      {activeSubTab === 'product_history' && (
        <div className="animate-fadeIn">
          <ProductHistoryView />
        </div>
      )}

      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {/* Real-time Inventory & Product Statistical Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            {/* Metric 1: Total SKUs / Catalog Items */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                  <Boxes className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">Catalog Size</span>
              </div>
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{stats.totalProducts}</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Unique products & SKUs registered</p>
            </div>

            {/* Metric 2: Total Units On-Hand */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">Total Stock</span>
              </div>
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{stats.totalStock} <span className="text-xs text-slate-400 font-normal">Units</span></h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Sum of all on-hand physical inventory</p>
            </div>

            {/* Metric 3: Capital Asset Valuation */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                  <Scale className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">Valuation (Cost)</span>
              </div>
              <h3 className="text-xl font-black text-emerald-400 font-mono tracking-tight">{formatCurrency(stats.totalCostValuation, settings)}</h3>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-slate-800/80 pt-2 font-medium">
                <span>Retail Value:</span>
                <span className="font-mono font-bold text-white">{formatCurrency(stats.totalRetailValuation, settings)}</span>
              </div>
            </div>

            {/* Metric 4: Health Metrics */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-800/30">Health Status</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-black text-amber-400 font-mono">{stats.lowStockAlerts}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Low Stock</div>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <div className="text-lg font-black text-rose-500 font-mono">{stats.outOfStockAlerts}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Out of Stock</div>
                </div>
              </div>
            </div>
          </div>


          {/* Column Visibility Section (Reference Screenshot Style) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 mb-6 animate-in fade-in slide-in-from-top-2 duration-150">
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
                      {Object.values(columnVisibility).filter(Boolean).length} of {COLUMN_DEFINITIONS.length} Visible
                    </span>
                    {isAdminOrManager ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 hidden sm:inline-flex">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Admin Privileges</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 hidden sm:inline-flex">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                    Select which columns to display in the Product Inventory stock matrix table.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
                {showColumnVisibility && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('all')}
                      disabled={!isAdminOrManager}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('standard')}
                      disabled={!isAdminOrManager}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('compact')}
                      disabled={!isAdminOrManager}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer hidden sm:inline-block"
                    >
                      Compact
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('reset')}
                      disabled={!isAdminOrManager}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-950/50 text-rose-400 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                      title="Reset to default columns"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowColumnVisibility(!showColumnVisibility)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    showColumnVisibility 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {showColumnVisibility ? (
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

            {showColumnVisibility && (
              <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50">
                {/* Role restriction notice if non-admin/manager */}
                {!isAdminOrManager && (
                  <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-300">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      You are logged in as <strong>{currentUser?.name || 'Staff'}</strong> ({currentUser?.role || 'user'}). Only <strong>Administrators</strong> and <strong>Store Managers</strong> have permissions to change table column visibility.
                    </span>
                  </div>
                )}

                {/* Column Toggles Card Grid */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {COLUMN_DEFINITIONS.map((col) => {
                    const isVisible = columnVisibility[col.key];
                    const isLocked = col.locked;

                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => handleToggleColumn(col.key)}
                        disabled={!isAdminOrManager || isLocked}
                        className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isVisible
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/20'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/40'
                        } ${!isAdminOrManager ? 'cursor-not-allowed' : isLocked ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <div className={`p-1 rounded-md ${
                            isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {isVisible ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </div>
                          {isLocked ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> FIXED
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isVisible
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}>
                              {col.label}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold truncate w-full">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Unified Container for Filters and Table to remove gap */}
          <div className="shadow-sm">
            {/* Unified Filter & Bulk Action Section */}
            <div className="bg-slate-900 rounded-t-2xl border border-slate-800 shadow-sm transition-colors duration-300">
            {/* Row 1: Search & Bulk Actions & Filters & Page Settings */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-3 p-3.5 border-b border-slate-800/50">
              <div className="flex flex-col lg:flex-row items-center gap-3 flex-1 w-full">
                <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full">
                  <div className="relative flex-1 w-full min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by SKU, Name, Barcode, Rack, Row..."
                      className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Inline Bulk Actions */}
                  {selectedProductIds.size > 0 && (
                    <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 p-1.5 pl-3 rounded-xl animate-fadeIn whitespace-nowrap">
                      <div className="flex items-center gap-2 mr-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                          {selectedProductIds.size}
                        </span>
                        <span className="text-[10px] font-bold text-white hidden md:inline">
                          Selected
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleExportCSV(true)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          title={`Export ${selectedProductIds.size} selected to CSV`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(true)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          title={`Export ${selectedProductIds.size} selected to PDF`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleClearSelection}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Clear selection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Filters (Moved from Row 2) */}
                <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                  {Boolean(settings.enableCategory) && (
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {categoryFilterList.map((c) => (
                        <option key={c} value={c}>
                          Category: {c}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value as any)}
                    className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Stock Status</option>
                    <option value="low">Low Stock Alerts Only</option>
                    <option value="out">Out of Stock Only</option>
                  </select>

                  <select
                    value={productTypeFilter}
                    onChange={(e) => setProductTypeFilter(e.target.value as any)}
                    className="bg-slate-950 text-indigo-300 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer font-bold focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Product Types</option>
                    <option value="single">Single Products</option>
                    <option value="variable">Variable Products</option>
                    <option value="combo">Combo / Bundle Products</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 justify-between sm:justify-end">
                <button
                  onClick={() => setActiveSubTab('batch_guide')}
                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl transition flex items-center gap-2 text-xs font-bold shrink-0"
                  title="Batch Management Guide"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden lg:inline">Lot Guide</span>
                </button>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-950 text-slate-200 text-xs px-2.5 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                  title="Show how many rows per page"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            {/* Row 2: Secondary Filters (Remaining) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-900/50">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {Boolean(settings.enableRacks) && (
                  <select
                    value={rackFilter}
                    onChange={(e) => setRackFilter(e.target.value)}
                    className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {rackFilterList.map((r) => (
                      <option key={r} value={r}>
                        Rack: {r}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selection Summary */}
              {selectedProductIds.size > 0 && (
                <button
                  onClick={handleSelectAllFiltered}
                  disabled={selectedProductIds.size >= filteredProducts.length}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  {selectedProductIds.size < filteredProducts.length 
                    ? `Select all ${filteredProducts.length} filtered products`
                    : `All ${filteredProducts.length} products selected`
                  }
                </button>
              )}
            </div>
          </div>

            {/* Stock Matrix Table (Attached) */}
            <div className="bg-slate-900 rounded-b-2xl border border-slate-800 border-t-0 overflow-hidden shadow-sm transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-3 text-center border-r border-slate-800 w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all products on current page"
                        title="Select / Deselect all on current page"
                        checked={isAllPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomePageSelected;
                        }}
                        onChange={handleToggleSelectPage}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer transition"
                      />
                    </th>
                    {columnVisibility.sku && <th className="py-3 px-3 border-r border-slate-800">SKU</th>}
                    {columnVisibility.image && <th className="py-3 px-3 border-r border-slate-800 text-center">Product Image</th>}
                    {columnVisibility.name && <th className="py-3 px-3 border-r border-slate-800">Product</th>}
                    {columnVisibility.category && Boolean(settings.enableCategory) && <th className="py-3 px-3 border-r border-slate-800">Category</th>}
                    {columnVisibility.brand && <th className="py-3 px-3 border-r border-slate-800">Brand</th>}
                    {columnVisibility.costPrice && <th className="py-3 px-3 text-right border-r border-slate-800">Cost Price</th>}
                    {columnVisibility.sellingPrice && <th className="py-3 px-3 text-right border-r border-slate-800">Selling Price</th>}
                    {columnVisibility.tax && <th className="py-3 px-3 text-center border-r border-slate-800">Tax</th>}
                    {columnVisibility.rack && Boolean(settings.enableRacks) && <th className="py-3 px-3 border-r border-slate-800">Rack Storage</th>}
                    {columnVisibility.row && Boolean(settings.enableRows) && <th className="py-3 px-2 text-center border-r border-slate-800">Row / Tier</th>}
                    {columnVisibility.position && Boolean(settings.enablePositions) && <th className="py-3 px-2 text-center border-r border-slate-800">Position / Bin</th>}
                    {columnVisibility.currentStock && <th className="py-3 px-3 text-center border-r border-slate-800">Current Stock</th>}
                    {columnVisibility.status && <th className="py-3 px-3 text-center border-r border-slate-800">Status</th>}
                    {columnVisibility.actions && <th className="py-3 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {paginatedProducts.map((p) => {
                    const isVariable = p.type === 'variable' || (Array.isArray(p.variations) && p.variations.length > 0);
                    const varList = isVariable && p.variations ? p.variations : [];
                    const varPrices = varList.map((v) => Number(v.sellingPrice) || 0);
                    const minVarPrice = varPrices.length > 0 ? Math.min(...varPrices) : (p.sellingPrice ?? 0);
                    const maxVarPrice = varPrices.length > 0 ? Math.max(...varPrices) : (p.sellingPrice ?? 0);
                    const totalVarStock = varList.length > 0
                      ? varList.reduce((sum, v) => sum + (Number(v.currentStock ?? v.openingStock) || 0), 0)
                      : (p.currentStock ?? 0);
                    const currentStock = isVariable && varList.length > 0 ? totalVarStock : (p.currentStock ?? 0);
                    const alertQty = p.alertQuantity ?? 5;
                    const cost = p.costPrice ?? 0;
                    const price = p.sellingPrice ?? 0;
                    const isOut = currentStock <= 0;
                    const isLow = currentStock > 0 && currentStock <= alertQty;
                    const matchedRack = racks.find((r) => r.name === p.rack);
                    const isSelected = selectedProductIds.has(p.id);
                    const isExpanded = expandedProductIds.has(p.id);

                    return (
                      <React.Fragment key={p.id}>
                      <tr
                        className={`hover:bg-slate-850/80 transition-colors border-b border-slate-800 ${
                          isSelected ? 'bg-indigo-950/25 border-indigo-900/50' : ''
                        } ${isExpanded ? 'bg-slate-900/70 border-b-0' : ''}`}
                      >
                        <td className={`py-3 px-3 text-center border-r border-slate-800 ${isSelected ? 'bg-indigo-950/40' : ''}`}>
                          <input
                            type="checkbox"
                            aria-label={`Select product ${p.name}`}
                            title={`Select ${p.name}`}
                            checked={isSelected}
                            onChange={() => handleToggleProductSelect(p.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer transition"
                          />
                        </td>
                        {columnVisibility.sku && (
                          <td className="py-3 px-3 font-mono border-r border-slate-800">
                            <div className="font-bold text-indigo-400">{p.sku}</div>
                          </td>
                        )}
                        {columnVisibility.image && (
                          <td className="py-3 px-3 border-r border-slate-800 text-center">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                className="w-10 h-10 rounded-lg object-cover bg-slate-950 mx-auto"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] mx-auto">
                                No Img
                              </div>
                            )}
                          </td>
                        )}
                        {columnVisibility.name && (
                          <td className="py-3 px-3 border-r border-slate-800">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span className="line-clamp-1">{p.name}</span>
                              {isVariable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedProductIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(p.id)) next.delete(p.id);
                                      else next.add(p.id);
                                      return next;
                                    });
                                  }}
                                  className="text-[10px] font-bold text-purple-300 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                                  title={isExpanded ? "Hide variation lines" : "Click to view line-wise variants"}
                                >
                                  <span>Variants ({varList.length})</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                              {p.type === 'combo' && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded-md shrink-0">
                                  Bundle ({p.comboItems?.length || 0})
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {columnVisibility.category && Boolean(settings.enableCategory) && (
                          <td className="py-3 px-3 border-r border-slate-800">
                            <span className="font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                              {p.category || 'General'}
                            </span>
                          </td>
                        )}
                        {columnVisibility.brand && (
                          <td className="py-3 px-3 border-r border-slate-800">
                            <span className="font-medium text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/80 text-[11px]">
                              {p.brand || 'General'}
                            </span>
                          </td>
                        )}
                        {columnVisibility.costPrice && (
                          <td className="py-3 px-3 text-right font-mono text-slate-300 border-r border-slate-800">
                            {formatCurrency(cost, settings)}
                          </td>
                        )}
                        {columnVisibility.sellingPrice && (
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-400 border-r border-slate-800">
                            {isVariable && varList.length > 0 ? (
                              <div>
                                <span>
                                  {minVarPrice === maxVarPrice
                                    ? formatCurrency(minVarPrice, settings)
                                    : `${formatCurrency(minVarPrice, settings)} - ${formatCurrency(maxVarPrice, settings)}`}
                                </span>
                                <span className="block text-[9px] font-normal text-slate-400 font-sans">
                                  {varList.length} variants
                                </span>
                              </div>
                            ) : (
                              formatCurrency(price, settings)
                            )}
                          </td>
                        )}
                        {columnVisibility.tax && (
                          <td className="py-3 px-3 text-center border-r border-slate-800">
                            <span className="font-mono font-semibold text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/50 text-[11px]">
                              {p.taxRate ?? 0}%
                            </span>
                          </td>
                        )}

                        {/* Physical Topology: Rack, Row, Position */}
                        {columnVisibility.rack && Boolean(settings.enableRacks) && (
                          <td className="py-3 px-3 border-r border-slate-800">
                            {p.rack ? (
                              <button
                                onClick={() => setActiveSubTab('racks')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition hover:opacity-90 text-left"
                                style={{
                                  backgroundColor: matchedRack ? `${matchedRack.color}15` : '#6366f115',
                                  color: matchedRack?.color || (settings.themeMode === 'dark' ? '#a5b4fc' : '#4f46e5'),
                                  borderColor: matchedRack ? `${matchedRack.color}35` : '#6366f135',
                                }}
                                title={`Click to open Rack Management for ${p.rack}`}
                              >
                                <Layers className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-1">{p.rack}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveSubTab('racks')}
                                className="text-[10px] text-slate-500 hover:text-indigo-300 italic flex items-center gap-1 transition-colors"
                                title="Click to assign rack"
                              >
                                <span>Not Allocated</span>
                              </button>
                            )}
                          </td>
                        )}

                        {columnVisibility.row && Boolean(settings.enableRows) && (
                          <td className="py-3 px-2 text-center border-r border-slate-800">
                            {p.row ? (
                              <span className="font-mono text-[11px] font-bold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                                {p.row}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {columnVisibility.position && Boolean(settings.enablePositions) && (
                          <td className="py-3 px-2 text-center border-r border-slate-800">
                            {p.position ? (
                              <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                                {p.position}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {columnVisibility.currentStock && (
                          <td className="py-3 px-3 text-center font-mono font-extrabold text-white text-sm border-r border-slate-800">
                            <div>
                              <span>{currentStock}</span> <span className="text-[10px] text-slate-400 font-normal">{p.unit || 'Pcs'}</span>
                              {isVariable && varList.length > 0 && (
                                <span className="block text-[9px] font-semibold text-purple-400 font-sans">
                                  Total across variants
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {columnVisibility.status && (
                          <td className="py-3 px-3 text-center border-r border-slate-800">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Optimal
                              </span>
                            )}
                          </td>
                        )}

                        {columnVisibility.actions && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingProduct(p)}
                                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white transition-all cursor-pointer active:scale-95"
                                title="View product details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setHistoryProduct(p)}
                                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white transition-all cursor-pointer active:scale-95"
                                title="Product History"
                                aria-label="Product History"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setOpeningStockProduct(p)}
                                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white transition-all cursor-pointer active:scale-95"
                                title="Add Opening Stock"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openBarcodeStudio(p)}
                                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white transition-all cursor-pointer active:scale-95"
                                title="Open Barcode Studio for this product"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => openEditProductPage(p)}
                                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white transition-all cursor-pointer active:scale-95"
                                  title="Edit product (Full Page)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => setDeleteTargetProduct(p)}
                                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-rose-600 shadow-lg shadow-indigo-600/30 hover:shadow-rose-600/30 text-white transition-all cursor-pointer active:scale-95"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expandable Line-wise Variations Row for Variable Products */}
                      {isExpanded && isVariable && varList.length > 0 && (
                        <tr className="bg-slate-950/95 border-b border-indigo-900/40 animate-fadeIn">
                          <td colSpan={25} className="p-4 pl-8 sm:pl-12">
                            <div className="bg-slate-900 rounded-xl border border-indigo-900/50 overflow-hidden shadow-inner space-y-3 p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-purple-300">
                                    Line-wise Variations for: <span className="text-white">{p.name}</span> ({p.sku})
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                                    {varList.length} variants captured
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setViewingProduct(p)}
                                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer hover:underline"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Open Full Product View Modal</span>
                                </button>
                              </div>

                              <div className="overflow-x-auto rounded-lg border border-slate-800">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#4caf50] text-white font-bold text-[11px] uppercase tracking-wider">
                                    <tr>
                                      <th className="py-2.5 px-3">Variation</th>
                                      <th className="py-2.5 px-3">SKU</th>
                                      <th className="py-2.5 px-3 text-right">Purchase Price (Exc. Tax)</th>
                                      <th className="py-2.5 px-3 text-right">Purchase Price (Inc. Tax)</th>
                                      <th className="py-2.5 px-3 text-center">Margin %</th>
                                      <th className="py-2.5 px-3 text-right">Selling Price (Exc. Tax)</th>
                                      <th className="py-2.5 px-3 text-right">Selling Price (Inc. Tax)</th>
                                      <th className="py-2.5 px-3 text-center">Current Stock</th>
                                      <th className="py-2.5 px-3 text-right">Stock Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800 bg-slate-950 font-mono text-[11px]">
                                    {varList.map((v, vIdx) => {
                                      const vCost = v.costPrice ?? (p.costPrice || 0);
                                      const vCostInc = v.costPriceIncTax ?? (p.taxRate ? vCost * (1 + p.taxRate / 100) : vCost);
                                      const vPrice = v.sellingPrice ?? (p.sellingPrice || 0);
                                      const vPriceInc = v.sellingPriceIncTax ?? (p.taxRate ? vPrice * (1 + p.taxRate / 100) : vPrice);
                                      const vMargin = v.margin !== undefined ? Number(v.margin).toFixed(2) : (vPrice > 0 ? (((vPrice - vCost) / vPrice) * 100).toFixed(2) : '25.00');
                                      const vStock = Number(v.currentStock ?? v.openingStock ?? 0);
                                      const vStockVal = vStock * vPrice;
                                      const vSku = v.sku || `${p.sku}-${vIdx + 1}`;
                                      const vVal = v.value || v.name?.replace(/^.*:\s*/, '') || `Variant ${vIdx + 1}`;

                                      return (
                                        <tr key={v.id || vIdx} className="hover:bg-slate-900/50">
                                          <td className="py-2 px-3 font-sans font-bold text-white">
                                            <span className="inline-block px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs">
                                              {vVal}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 font-bold text-indigo-400">{vSku}</td>
                                          <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(vCost, settings)}</td>
                                          <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(vCostInc, settings)}</td>
                                          <td className="py-2 px-3 text-center text-indigo-300 font-bold">{vMargin}%</td>
                                          <td className="py-2 px-3 text-right font-bold text-emerald-400">{formatCurrency(vPrice, settings)}</td>
                                          <td className="py-2 px-3 text-right font-bold text-emerald-400">{formatCurrency(vPriceInc, settings)}</td>
                                          <td className="py-2 px-3 text-center font-bold text-white">
                                            {vStock.toFixed(2)} {p.unit || 'Pcs'}
                                          </td>
                                          <td className="py-2 px-3 text-right font-bold text-amber-400">{formatCurrency(vStockVal, settings)}</td>
                                        </tr>
                                      );
                                    })}
                                    <tr className="bg-slate-900 font-bold text-white border-t-2 border-slate-700">
                                      <td className="py-2.5 px-3 font-sans text-purple-300">Total Variations</td>
                                      <td className="py-2.5 px-3 text-slate-400">{varList.length} items</td>
                                      <td colSpan={5} className="py-2.5 px-3 text-right text-slate-400 font-sans">Combined Total Stock:</td>
                                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                                        {totalVarStock.toFixed(2)} {p.unit || 'Pcs'}
                                      </td>
                                      <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                                        {formatCurrency(varList.reduce((s, v) => s + (Number(v.currentStock ?? v.openingStock ?? 0) * (v.sellingPrice ?? 0)), 0), settings)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} entries
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 text-slate-200 text-[10px] px-2 py-1 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
              title="Show how many rows per page"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-bold transition"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-bold transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Stock Adjustments Tab */}
      {activeSubTab === 'adjustments' && (
        <div className="space-y-6">
          {/* Page Title & Header Card */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors duration-300 shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Stock Adjustments</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Audit, record, and track physical inventory discrepancies, damages, and manual adjustments.
              </p>
            </div>
            <button
              onClick={onOpenAdjustment}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Adjustment</span>
            </button>
          </div>

          <div className={`rounded-2xl border p-5 space-y-4 transition-colors duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Historical Stock Adjustments & Damage Audits</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-3 px-3">Ref No.</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Items Adjusted</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3">Adjusted By</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800 text-slate-200'
                }`}>
                  {stockAdjustments.map((adj) => {
                    const loc = locations.find((l) => l.id === adj.locationId);
                    return (
                      <tr key={adj.id} className={`transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850'
                      }`}>
                        <td className={`py-3 px-3 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{adj.referenceNo}</td>
                        <td className="py-3 px-3 text-slate-400">{adj.date}</td>
                        <td className={`py-3 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{loc?.name}</td>
                        <td className="py-3 px-3">
                          {adj.items.map((i, idx) => (
                            <div key={idx} className={`${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                              {i.productName}: <span className="text-amber-500 font-bold">{i.quantity} pcs</span> ({i.type})
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{adj.reason}</td>
                        <td className="py-3 px-3 text-slate-400">{adj.adjustedBy}</td>
                        <td className="py-3 px-3 w-[120px]">
                          <ActionButtons
                            onView={() => setViewingAdjustment(adj)}
                            onDelete={() => setDeletingAdjustment(adj)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfers Tab */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-6">
          {/* Page Title & Header Card */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors duration-300 shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                <span>Branch Transfers</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Dispatch, receive, and track logistics shipments and internal warehouse stock transfers.
              </p>
            </div>
            <button
              onClick={onOpenTransfer}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Dispatch Transfer</span>
            </button>
          </div>

          <div className={`rounded-2xl border p-5 space-y-4 transition-colors duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Inter-Branch Logistics & Transfers</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <tr>
                    <th className="py-3 px-3">Ref No.</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">From Location</th>
                    <th className="py-3 px-3">To Location</th>
                    <th className="py-3 px-3">Items Transferred</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800 text-slate-200'
                }`}>
                  {stockTransfers.map((trf) => {
                    const fromL = locations.find((l) => l.id === trf.fromLocationId);
                    const toL = locations.find((l) => l.id === trf.toLocationId);

                    return (
                      <tr key={trf.id} className={`transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850'
                      }`}>
                        <td className={`py-3 px-3 font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{trf.referenceNo}</td>
                        <td className="py-3 px-3 text-slate-400">{trf.date}</td>
                        <td className={`py-3 px-3 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{fromL?.name}</td>
                        <td className="py-3 px-3 text-indigo-500 font-semibold">{toL?.name}</td>
                        <td className="py-3 px-3">
                          {trf.items?.map((i, idx) => (
                            <div key={idx} className={`${isLight ? 'text-slate-850' : 'text-slate-300'}`}>
                              {i.productName}: <span className="text-emerald-500 font-bold">{i.quantity} pcs</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              trf.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {trf.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {trf.status === 'in_transit' && (
                            <button
                              onClick={() => completeStockTransfer(trf.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                            >
                              Receive Stock
                            </button>
                          )}
                          <div className="flex justify-end mt-1">
                            <ActionButtons
                              onView={() => setViewingTransfer(trf)}
                              onEdit={() => setEditingTransfer(trf)}
                              onDelete={() => setDeletingTransfer(trf)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Modal for viewing transfer details */}
      {viewingTransfer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white">Stock transfer details (Reference No: {viewingTransfer.referenceNo})</h3>
              <button onClick={() => setViewingTransfer(null)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><p className="text-slate-500">Location (From):</p><p className="font-bold text-slate-900 dark:text-white">{locations.find(l=>l.id===viewingTransfer.fromLocationId)?.name}</p></div>
              <div><p className="text-slate-500">Location (To):</p><p className="font-bold text-slate-900 dark:text-white">{locations.find(l=>l.id===viewingTransfer.toLocationId)?.name}</p></div>
              <div><p className="text-slate-500">Date:</p><p className="font-bold text-slate-900 dark:text-white">{viewingTransfer.date}</p></div>
              <div><p className="text-slate-500">Status:</p><p className="font-bold text-indigo-500 dark:text-indigo-400">{viewingTransfer.status}</p></div>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-emerald-500 text-white uppercase text-[10px]">
                <tr><th className="p-2">#</th><th className="p-2">Product</th><th className="p-2">Quantity</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {viewingTransfer.items?.map((i: any, idx: number) => (
                  <tr key={idx}><td className="p-2">{idx + 1}</td><td className="p-2">{i.productName}</td><td className="p-2">{i.quantity}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingTransfer(null)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing transfer */}
      {editingTransfer && (
        <StockTransferModal
          key={editingTransfer.id}
          isOpen={true}
          onClose={() => setEditingTransfer(null)}
          existingTransfer={editingTransfer}
        />
      )}

      {/* Custom Delete Confirmation Modal for Adjustments */}
      {deletingAdjustment && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Adjustment?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Are you sure you want to delete adjustment <span className="font-bold text-slate-900 dark:text-white">#{deletingAdjustment.referenceNo}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingAdjustment(null)}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStockAdjustment(deletingAdjustment.id);
                  setDeletingAdjustment(null);
                  showFlashNotification(`Adjustment ${deletingAdjustment.referenceNo} deleted`, 'success');
                }}
                className="px-4 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingTransfer && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Transfer?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Are you sure you want to delete transfer <span className="font-bold text-slate-900 dark:text-white">{deletingTransfer.referenceNo}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingTransfer(null)}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStockTransfer(deletingTransfer.id);
                  setDeletingTransfer(null);
                  showFlashNotification(`Transfer ${deletingTransfer.referenceNo} deleted`, 'success');
                }}
                className="px-4 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing adjustment details */}
      {viewingAdjustment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Stock adjustment details (Reference No: <span className="text-indigo-500 dark:text-indigo-400">#{viewingAdjustment.referenceNo}</span>)
              </h3>
              <button onClick={() => setViewingAdjustment(null)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="flex justify-end text-[10px] text-slate-500 font-bold mb-2">
              Date: {viewingAdjustment.date}
            </div>

             <div className="grid grid-cols-2 gap-8 text-xs border-b border-slate-100 dark:border-slate-800 pb-4">
               <div className="space-y-1">
                 <p className="text-slate-400 font-semibold">Business:</p>
                 <p className="font-bold text-slate-900 dark:text-white">
                   {settings.businessName || settings.name || 'Finias POS'}{' '}
                   <span className="text-slate-500 font-normal">
                     {locations.find((l) => l.id === viewingAdjustment.locationId)?.name || ''}
                   </span>
                 </p>
                 <p className="text-slate-500 italic">
                   {locations.find((l) => l.id === viewingAdjustment.locationId)?.address || settings.address || 'Naidu Nagar, Chembakur Road'}
                 </p>
                 <p className="text-slate-500">
                   {locations.find((l) => l.id === viewingAdjustment.locationId)
                     ? [
                         locations.find((l) => l.id === viewingAdjustment.locationId)?.city,
                         locations.find((l) => l.id === viewingAdjustment.locationId)?.state,
                         locations.find((l) => l.id === viewingAdjustment.locationId)?.country
                       ].filter(Boolean).join(', ')
                     : 'Madanapalle, Andhra Pradesh, India'}
                 </p>
                 <p className="text-slate-500 font-mono">
                   Mobile: {locations.find((l) => l.id === viewingAdjustment.locationId)?.phone || settings.phone || '+91 9876543210'}
                 </p>
               </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <p className="text-slate-400 font-semibold">Reference No:</p>
                  <p className="text-slate-400 font-semibold">Date:</p>
                  <p className="text-slate-400 font-semibold">Adjustment type:</p>
                  <p className="text-slate-400 font-semibold">Reason:</p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">#{viewingAdjustment.referenceNo}</p>
                  <p className="font-bold text-slate-900 dark:text-white">{viewingAdjustment.date}</p>
                  <p className="font-bold text-slate-900 dark:text-white capitalize">{viewingAdjustment.adjustmentType || 'Normal'}</p>
                  <p className="font-bold text-slate-900 dark:text-white">{viewingAdjustment.reason || '--'}</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-emerald-500 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {viewingAdjustment.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="bg-slate-50/50 dark:bg-slate-950/50">
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{item.productName} ({item.sku || 'N/A'})</td>
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{item.quantity.toFixed(2)}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">₹{item.unitCost.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">₹{(item.quantity * item.unitCost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
               <div className="w-64 space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Total Amount:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{(viewingAdjustment.totalAmount || viewingAdjustment.items?.reduce((acc: number, curr: any) => acc + (curr.quantity * curr.unitCost), 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Total amount recovered:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{(viewingAdjustment.totalAmountRecovered || 0).toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <h4 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-1">Activities:</h4>
               <table className="w-full text-[10px] text-left">
                 <thead className="text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Action</th>
                      <th className="py-2">By</th>
                      <th className="py-2">Note</th>
                    </tr>
                 </thead>
                 <tbody className="text-slate-600 dark:text-slate-400">
                    <tr>
                      <td className="py-2">{viewingAdjustment.date}</td>
                      <td className="py-2">Added</td>
                      <td className="py-2">{viewingAdjustment.adjustedBy}</td>
                      <td className="py-2">{viewingAdjustment.notes || '--'}</td>
                    </tr>
                 </tbody>
               </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Printer className="w-4 h-4"/>
                Print
              </button>
              <button 
                onClick={() => setViewingAdjustment(null)} 
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
      <ViewProductDetailsModal
        isOpen={!!viewingProduct}
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onOpenHistory={(prod) => {
          setViewingProduct(null);
          setHistoryProduct(prod);
        }}
      />
      {openingStockProduct && (
        <AddOpeningStockModal
          product={openingStockProduct}
          onClose={() => setOpeningStockProduct(null)}
        />
      )}
      <ProductHistoryModal
        isOpen={!!historyProduct}
        product={historyProduct}
        onClose={() => setHistoryProduct(null)}
      />

      {/* Uniform Product Deletion Modal (Blocked / Confirmation) */}
      {deleteTargetProduct && (() => {
        const prod = deleteTargetProduct;
        const hasStock = (Number(prod.currentStock) || 0) > 0;
        const unitName = (units || []).find((u: any) => u.id === prod.unitId || u.shortName === prod.unit)?.shortName || prod.unit || 'units';
        const categoryName = getCategoryName(prod.category);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
              {hasStock ? (
                // BLOCKED: Product Stock > 0 (Matching screenshot 'popup dis.png')
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3 text-amber-500">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Product Deletion Blocked</h3>
                        <p className="text-xs text-amber-500/90 font-medium">Product stock is not equal to zero</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetProduct(null)}
                      className={isLight 
                        ? "p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
                        : "p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      }
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="leading-relaxed">
                      Cannot delete Product <strong className="text-slate-900 dark:text-white">{prod.name}</strong> (SKU: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{prod.sku || 'N/A'}</span>) because its current stock is <strong className="text-amber-600 dark:text-amber-400 font-bold font-mono text-sm">{prod.currentStock} {unitName}</strong>.
                    </p>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Item Inventory Details:
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-[11px]">
                        <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800 last:border-0">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[220px]">{prod.name}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">
                            {prod.currentStock} in stock &bull; <strong className="text-amber-500">{prod.currentStock} active</strong>
                          </span>
                        </div>
                        {prod.locationStocks && Object.keys(prod.locationStocks).length > 0 && (
                          <div className="pt-1 text-[10px] text-slate-400 space-y-0.5">
                            {Object.entries(prod.locationStocks).map(([locId, qty]) => {
                              const loc = locations.find((l: any) => l.id === locId);
                              return (
                                <div key={locId} className="flex justify-between">
                                  <span>{loc?.name || locId}:</span>
                                  <span className="font-mono font-semibold">{qty} {unitName}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                      <strong>Policy:</strong> Until and unless the product stock equals 0, product records cannot be deleted to prevent inventory discrepancy. Please adjust or zero out stock before deleting.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetProduct(null)}
                      className={isLight
                        ? "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        : "px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      }
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = deleteTargetProduct;
                        setDeleteTargetProduct(null);
                        openEditProductPage(target);
                      }}
                      className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Quantities</span>
                    </button>
                  </div>
                </>
              ) : (
                // ALLOWED: Product Stock === 0
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3 text-rose-500">
                      <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Product</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">SKU: {prod.sku || 'N/A'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetProduct(null)}
                      className={isLight
                        ? "p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
                        : "p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      }
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="leading-relaxed">
                      Are you sure you want to permanently delete product <strong className="text-slate-900 dark:text-white">{prod.name}</strong>?
                    </p>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Category:</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{categoryName}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Current Stock:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">0 {unitName} (Cleared)</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Selling Price:</span>
                        <span className="text-slate-700 dark:text-slate-200 font-mono font-bold">{formatCurrency(prod.sellingPrice, settings)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      This action is permanent and will remove this product from the inventory catalog and product lists.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetProduct(null)}
                      className={isLight
                        ? "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        : "px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      }
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteProduct(prod.id);
                        setDeleteTargetProduct(null);
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

