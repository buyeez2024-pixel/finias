import { getCategoryName, getBrandName } from "../../utils/formatters";
import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Warranty, WarrantyDurationType, Product } from '../../types/erp';
import { ExportButtons } from '../common/ExportButtons';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Boxes,
  HelpCircle,
  X,
  ExternalLink,
  Download,
  Info,
  Tag,
  Check,
  Sparkles,
  ArrowRight,
  Clock,
  FileText,
  Calendar,
  Layers,
  Settings,
  Receipt,
  RotateCcw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  Eye,
} from 'lucide-react';

interface WarrantyFormData {
  name: string;
  duration: number;
  durationType: WarrantyDurationType;
  description: string;
  terms: string;
  color: string;
  status: 'active' | 'inactive';
}

const initialFormState: WarrantyFormData = {
  name: '',
  duration: 1,
  durationType: 'years',
  description: '',
  terms: '',
  color: '#10b981',
  status: 'active',
};

const COLOR_OPTIONS = [
  { label: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
  { label: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-400' },
  { label: 'Sky Blue', value: '#0ea5e9', bgClass: 'bg-sky-500', textClass: 'text-sky-400' },
  { label: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-400' },
  { label: 'Violet', value: '#8b5cf6', bgClass: 'bg-violet-500', textClass: 'text-violet-400' },
  { label: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500', textClass: 'text-rose-400' },
  { label: 'Cyan', value: '#06b6d4', bgClass: 'bg-cyan-500', textClass: 'text-cyan-400' },
  { label: 'Slate', value: '#64748b', bgClass: 'bg-slate-500', textClass: 'text-slate-400' },
];

const PRESET_TEMPLATES = [
  {
    name: '1-Year Limited Manufacturer Warranty',
    duration: 1,
    durationType: 'years' as WarrantyDurationType,
    description: 'Standard 12-month hardware and component repair/replacement.',
    terms: 'Covers manufacturer defects and hardware faults under normal usage. Excludes accidental damage, spills, or unauthorized modifications. Valid receipt or invoice required for claims.',
    color: '#10b981',
  },
  {
    name: '2-Year Premium Extended Guarantee',
    duration: 2,
    durationType: 'years' as WarrantyDurationType,
    description: 'Comprehensive 24-month protection with priority service & parts coverage.',
    terms: 'Covers mechanical breakdown, optical sensor failures, and component replacement after manufacturer period. Fast turnaround repair guarantee included.',
    color: '#6366f1',
  },
  {
    name: '6-Month Accessory & Battery Warranty',
    duration: 6,
    durationType: 'months' as WarrantyDurationType,
    description: 'Covers cables, rechargeable battery cells, adapters, and peripheral accessories.',
    terms: 'Guarantees battery capacity retention above 80% and free replacement of defective wiring or connector pins within 180 days.',
    color: '#0ea5e9',
  },
  {
    name: '30-Day Hassle-Free Replacement',
    duration: 30,
    durationType: 'days' as WarrantyDurationType,
    description: 'Immediate in-store swap for dead-on-arrival or defective items.',
    terms: 'Eligible for instant replacement upon testing in store. Original packaging and invoice required. Wear-and-tear excluded.',
    color: '#f59e0b',
  },
  {
    name: '3-Year Pro Enterprise Warranty',
    duration: 3,
    durationType: 'years' as WarrantyDurationType,
    description: 'Next-business-day on-site replacement and dedicated tech support.',
    terms: 'Commercial use warranty covering 36 months of continuous operation. 24/7 priority support and express parts courier included.',
    color: '#8b5cf6',
  },
];

export const WarrantiesView: React.FC = () => {
  const {
    warranties,
    addWarranty,
    updateWarranty,
    deleteWarranty,
    assignWarrantyToProducts,
    products,
    navigateToSettings,
    settings,
    openEditProductPage,
  } = useErp();

  // Search & Filter State
  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [durationTypeFilter, setDurationTypeFilter] = useState<'all' | 'days' | 'months' | 'years'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedWarrantyIds, setSelectedWarrantyIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (
        p.includes('warranties/add') ||
        p.includes('warranties/edit') 
      ) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isFormModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('warranties/add') && !window.location.pathname.includes('warranties/edit')) {
        window.history.replaceState(null, '', '/inventory/warranties/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('warranties/add') || window.location.pathname.includes('warranties/edit') || window.location.hash.includes('warranties/add') || window.location.hash.includes('warranties/edit'))) {
        window.history.replaceState(null, '', '/inventory/warranties');
      }
    }
  }, [isFormModalOpen]);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [formData, setFormData] = useState<WarrantyFormData>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [warrantyToDelete, setWarrantyToDelete] = useState<Warranty | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('unassign');
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Assign to Products Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningWarranty, setAssigningWarranty] = useState<Warranty | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignCategoryFilter, setAssignCategoryFilter] = useState('all');

  // Linked Products View Modal
  const [viewingProductsWarranty, setViewingProductsWarranty] = useState<Warranty | null>(null);
  const [viewingWarrantyDetails, setViewingWarrantyDetails] = useState<Warranty | null>(null);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleToggleWarrantySelect = (id: string) => {
    const newSelected = new Set(selectedWarrantyIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedWarrantyIds(newSelected);
  };

  const handleClearSelection = () => setSelectedWarrantyIds(new Set());

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compute linked product counts per warranty
  const warrantyProductCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    (products || []).forEach((p) => {
      if (p.warrantyId) {
        counts[p.warrantyId] = (counts[p.warrantyId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Filtered Warranties
  const filteredWarranties = useMemo(() => {
    return (warranties || []).filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.terms && w.terms.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ? true : w.status === statusFilter;

      const matchesDuration =
        durationTypeFilter === 'all' ? true : w.durationType === durationTypeFilter;

      return matchesSearch && matchesStatus && matchesDuration;
    });
  }, [warranties, searchTerm, statusFilter, durationTypeFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, durationTypeFilter, pageSize]);

  const totalPages = Math.ceil(filteredWarranties.length / pageSize);

  const paginatedWarranties = useMemo(() => {
    if (!isLight) return filteredWarranties;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredWarranties.slice(startIndex, startIndex + pageSize);
  }, [filteredWarranties, isLight, currentPage, pageSize]);

  const handleToggleSelectPage = () => {
    const newSelected = new Set(selectedWarrantyIds);
    const allPageSelected = paginatedWarranties.every((w) => newSelected.has(w.id));
    if (allPageSelected) {
      paginatedWarranties.forEach((w) => newSelected.delete(w.id));
    } else {
      paginatedWarranties.forEach((w) => newSelected.add(w.id));
    }
    setSelectedWarrantyIds(newSelected);
  };

  const isAllPageSelected = paginatedWarranties.length > 0 && paginatedWarranties.every((w) => selectedWarrantyIds.has(w.id));
  const isSomePageSelected = paginatedWarranties.some((w) => selectedWarrantyIds.has(w.id)) && !isAllPageSelected;

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = warranties.length;
    const active = warranties.filter((w) => w.status === 'active').length;
    const totalCoveredProducts = products.filter((p) => !!p.warrantyId).length;
    const yearPlans = warranties.filter((w) => w.durationType === 'years').length;
    return { total, active, totalCoveredProducts, yearPlans };
  }, [warranties, products]);

  // Theme Helper Classes for Light Mode / Dark Mode Adaptive Redesign
  const cardBg = isLight ? 'bg-white border-slate-200/80 shadow-md' : 'bg-slate-900 border-slate-800 shadow-sm';
  const overlayBg = isLight ? 'bg-slate-900/60 backdrop-blur-sm' : 'bg-slate-950/80 backdrop-blur-sm';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
  const textMutedDense = isLight ? 'text-slate-600' : 'text-slate-300';
  const inputBg = isLight ? 'bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-400 focus:bg-white focus:border-indigo-500' : 'bg-slate-950 text-white border-slate-700 focus:border-emerald-500';
  const borderPrimary = isLight ? 'border-slate-100' : 'border-slate-800';
  const bgSubtle = isLight ? 'bg-slate-50' : 'bg-slate-950';
  const bgSubtleCard = isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950 border-slate-800';
  const headerActionBtn = isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:text-slate-900 hover:border-slate-300 shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700';
  const actionBtnView = isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700';
  const actionBtnEdit = isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700';
  const actionBtnDelete = isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent' : 'bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border-slate-700 hover:border-rose-700';
  const actionBtnAssign = isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border-slate-700';
  const iconWrapperEmerald = isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400';
  const iconWrapperIndigo = isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400';
  const iconWrapperSky = isLight ? 'bg-sky-50 border-sky-100 text-sky-600' : 'bg-sky-600/10 border-sky-500/20 text-sky-400';
  const secondaryOptionBtn = isLight ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white';

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingWarranty(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (war: Warranty) => {
    setEditingWarranty(war);
    setFormData({
      name: war.name,
      duration: war.duration,
      durationType: war.durationType,
      description: war.description || '',
      terms: war.terms || '',
      color: war.color || '#10b981',
      status: war.status,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Apply Preset Template
  const handleApplyTemplate = (tmpl: (typeof PRESET_TEMPLATES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: tmpl.name,
      duration: tmpl.duration,
      durationType: tmpl.durationType,
      description: tmpl.description,
      terms: tmpl.terms,
      color: tmpl.color,
    }));
    showToast(`Template "${tmpl.name}" loaded into form.`, 'info');
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Warranty plan name is required.';
    } else if (
      warranties.some(
        (w) =>
          w.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          w.id !== editingWarranty?.id
      )
    ) {
      errors.name = 'A warranty plan with this name already exists.';
    }

    if (formData.duration <= 0 || isNaN(formData.duration)) {
      errors.duration = 'Duration must be a positive number (at least 1).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Warranty (Create or Update)
  const handleSaveWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingWarranty) {
      updateWarranty(editingWarranty.id, {
        name: formData.name,
        duration: Number(formData.duration),
        durationType: formData.durationType,
        description: formData.description,
        terms: formData.terms,
        color: formData.color,
        status: formData.status,
      });
      showToast(`Warranty plan "${formData.name.trim()}" updated successfully.`);
    } else {
      addWarranty({
        name: formData.name,
        duration: Number(formData.duration),
        durationType: formData.durationType,
        description: formData.description,
        terms: formData.terms,
        color: formData.color,
        status: formData.status,
      });
      showToast(`Warranty plan "${formData.name.trim()}" created successfully.`);
    }

    setIsFormModalOpen(false);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (war: Warranty) => {
    setWarrantyToDelete(war);
    setReassignTargetId('unassign');
    setDeleteErrorMessage(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!warrantyToDelete) return;

    const cascadeTarget =
      reassignTargetId === 'unassign' ? '' : reassignTargetId;

    const result = deleteWarranty(warrantyToDelete.id, cascadeTarget);

    if (!result.success) {
      setDeleteErrorMessage(result.message || 'Failed to delete warranty plan.');
      return;
    }

    showToast(result.message || `Warranty "${warrantyToDelete.name}" deleted.`);
    setIsDeleteModalOpen(false);
    setWarrantyToDelete(null);
  };

  // Open Assign to Products Modal
  const handleOpenAssignModal = (war: Warranty) => {
    setAssigningWarranty(war);
    // Preselect all products that already have this warranty assigned
    const alreadyAssigned = (products || [])
      .filter((p) => p.warrantyId === war.id)
      .map((p) => p.id);
    setSelectedProductIds(alreadyAssigned);
    setAssignSearch('');
    setAssignCategoryFilter('all');
    setIsAssignModalOpen(true);
  };

  // Save Product Assignments
  const handleSaveProductAssignments = () => {
    if (!assigningWarranty) return;

    // For products previously having this warranty that are not in selectedProductIds: remove warranty
    // For products currently in selectedProductIds: assign this warranty
    const currentWarProducts = products.filter((p) => p.warrantyId === assigningWarranty.id);
    const removedIds = currentWarProducts
      .filter((p) => !selectedProductIds.includes(p.id))
      .map((p) => p.id);

    if (removedIds.length > 0) {
      assignWarrantyToProducts(null, removedIds);
    }

    if (selectedProductIds.length > 0) {
      assignWarrantyToProducts(assigningWarranty.id, selectedProductIds);
    }

    showToast(
      `Updated assignments: ${selectedProductIds.length} product(s) now carry "${assigningWarranty.name}".`
    );
    setIsAssignModalOpen(false);
    setAssigningWarranty(null);
  };

  // Toggle single product selection in assign modal
  const handleToggleProductInAssign = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Toggle all filtered products in assign modal
  const handleToggleAllFilteredInAssign = (filteredList: Product[]) => {
    const allFilteredIds = filteredList.map((p) => p.id);
    const areAllSelected = allFilteredIds.every((id) => selectedProductIds.includes(id));

    if (areAllSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Export warranties to CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'Duration', 'Duration Type', 'Status', 'Linked Products', 'Terms', 'Created Date'];
    const rows = filteredWarranties.map((w) => [
      w.id,
      `"${w.name.replace(/"/g, '""')}"`,
      w.duration,
      w.durationType,
      w.status,
      warrantyProductCountMap[w.id] || 0,
      `"${(w.terms || '').replace(/"/g, '""')}"`,
      w.createdDate || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Warranties_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported warranty plans to CSV file.');
  };

  // Helper to format duration string
  const formatDurationText = (duration: number, type: WarrantyDurationType) => {
    if (type === 'days') return `${duration} Day${duration > 1 ? 's' : ''}`;
    if (type === 'months') return `${duration} Month${duration > 1 ? 's' : ''}`;
    if (type === 'years') return `${duration} Year${duration > 1 ? 's' : ''}`;
    return `${duration} ${type}`;
  };

  // Export Data Preparation for Unified ExportButtons
  const exportWarrantiesData = useMemo(() => {
    const sourceList = selectedWarrantyIds.size > 0
      ? warranties.filter((w) => selectedWarrantyIds.has(w.id))
      : filteredWarranties;

    return sourceList.map((w) => ({
      name: w.name,
      duration: formatDurationText(w.duration, w.durationType),
      status: w.status === 'active' ? 'Active' : 'Inactive',
      linkedProducts: warrantyProductCountMap[w.id] || 0,
      terms: w.terms || '—',
      description: w.description || '—',
      id: w.id,
    }));
  }, [warranties, filteredWarranties, selectedWarrantyIds, warrantyProductCountMap]);

  // Filter products for assign modal
  const filteredAssignProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(assignSearch.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(assignSearch.toLowerCase()));
      const matchCat =
        assignCategoryFilter === 'all' ? true : p.category === assignCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, assignSearch, assignCategoryFilter]);

  // Unique categories for assign modal filter
  const productCategories = useMemo(() => {
    const cats = new Set<string>();
    (products || []).forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  if (isFormModalOpen) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-4 animate-fadeIn">
        {/* Navigation & Actions Header */}
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-md' : 'bg-slate-900/90 border-slate-800 backdrop-blur-md text-white'
        }`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className={`p-2.5 rounded-xl transition flex items-center gap-2 text-xs font-bold border shadow-sm ${
                isLight 
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-slate-100 border-slate-800' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Warranties Registry</span>
            </button>
            <div>
              <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Products & Inventory</span>
                <span>/</span>
                <span>Warranties</span>
                <span>/</span>
                <span className="text-emerald-500 font-semibold">{editingWarranty ? 'Edit Warranty Plan' : 'Add New Warranty Plan'}</span>
              </div>
              <h1 className={`text-xl font-bold mt-0.5 flex items-center gap-2 ${isLight ? 'text-slate-850' : 'text-white'}`}>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>{editingWarranty ? `Edit Warranty: ${editingWarranty.name}` : 'Create Warranty'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-1.5 ${
                isLight 
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 shadow-slate-900/10' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-slate-800/20'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveWarranty}
              className={`px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingWarranty ? 'Save Changes' : 'Create Warranty'}</span>
            </button>
          </div>
        </div>

        {/* Full Page Form Grid */}
        <form onSubmit={handleSaveWarranty} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 8 cols */}
          <div className={`lg:col-span-8 p-6 rounded-2xl border shadow-sm space-y-5 ${cardBg}`}>
            <div className={`border-b pb-3 ${borderPrimary}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textPrimary}`}>
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Warranty Coverage & Terms Configuration</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Set plan title, duration period, coverage terms, and customer policy notes.
              </p>
            </div>

            {/* Quick preset banner */}
            <div>
              <p className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Preset Templates:</span>
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_TEMPLATES.map((preset) => {
                  const isSelected = formData.name === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        handleApplyTemplate(preset);
                      }}
                      className={`px-3 py-1.5 border rounded-xl text-xs transition flex items-center gap-1.5 font-semibold group ${
                        isSelected
                          ? (isLight
                              ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent'
                              : 'bg-indigo-600/30 text-indigo-300 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30')
                          : (isLight 
                              ? 'bg-slate-50 hover:bg-sky-600 text-slate-700 hover:text-white hover:font-bold hover:shadow-lg hover:shadow-sky-600/30 hover:border-transparent active:scale-95 border-slate-200' 
                              : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700')
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full transition-all ${
                          isSelected && isLight ? 'bg-white' : ''
                        } ${
                          !isSelected && isLight ? 'group-hover:bg-white' : ''
                        }`}
                        style={isSelected && isLight ? undefined : { backgroundColor: preset.color }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Warranty Plan Name */}
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${textMutedDense}`}>
                Warranty Plan Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="war-modal-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 1-Year Comprehensive Hardware Warranty"
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition ${inputBg} ${
                  formErrors.name ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                }`}
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{formErrors.name}</span>
                </p>
              )}
            </div>

            {/* Duration & Duration Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${textMutedDense}`}>
                  Duration Value (Number) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="war-modal-duration-input"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) || 1 })}
                  placeholder="e.g. 1, 2, 6, 30"
                  className={`w-full font-bold text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition ${inputBg} ${
                    formErrors.duration ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                  }`}
                />
                {formErrors.duration && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.duration}</p>
                )}
              </div>

              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${textMutedDense}`}>
                  Duration Period Type <span className="text-rose-400">*</span>
                </label>
                <select
                  id="war-modal-duration-type-select"
                  value={formData.durationType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationType: e.target.value as WarrantyDurationType,
                    })
                  }
                  className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                >
                  <option value="days" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-950'}>Days (e.g. 30 Days Replacement)</option>
                  <option value="months" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-950'}>Months (e.g. 6 Months Coverage)</option>
                  <option value="years" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-950'}>Years (e.g. 1 Year, 2 Years Extended)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${textMutedDense}`}>
                Plan Summary Description
              </label>
              <input
                id="war-modal-desc-input"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Full parts & labor replacement with 24h turnaround."
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${inputBg}`}
              />
            </div>

            {/* Terms & Conditions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold uppercase tracking-wider ${textMutedDense}`}>
                  Detailed Terms & Conditions
                </label>
                <span className="text-[10px] text-slate-500">Printed on receipt & invoice</span>
              </div>
              <textarea
                id="war-modal-terms-input"
                rows={4}
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Specify warranty coverage limitations, exclusions (e.g. liquid damage, tamper seals), and return policies..."
                className={`w-full text-xs p-3 rounded-xl border focus:outline-none resize-none ${inputBg}`}
              />
            </div>
          </div>

          {/* Right 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            {/* Color Accent Badge */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-3.5 ${cardBg}`}>
              <h4 className={`font-bold text-xs border-b pb-2 ${
                isLight ? 'text-slate-850 border-slate-200' : 'text-white border-slate-800'
              }`}>
                Plan Identifier Color Badge
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition group ${
                      formData.color === c.value
                        ? (isLight 
                            ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent'
                            : 'bg-slate-800 text-white border-emerald-500 shadow-sm')
                        : (isLight 
                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-600 hover:text-white hover:font-bold hover:shadow-lg hover:shadow-sky-600/30 hover:border-transparent active:scale-95' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white')
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.bgClass} ${formData.color === c.value && isLight ? 'ring-2 ring-white/60' : ''} ${formData.color !== c.value && isLight ? 'group-hover:ring-2 group-hover:ring-white/60' : ''}`} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selection */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-3.5 ${cardBg}`}>
              <h4 className={`font-bold text-xs border-b pb-2 ${
                isLight ? 'text-slate-850 border-slate-200' : 'text-white border-slate-800'
              }`}>
                Registry Status
              </h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                    formData.status === 'active'
                      ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm')
                      : (isLight ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white')
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${
                      isLight 
                        ? (formData.status === 'active' ? 'text-emerald-600' : 'text-slate-400') 
                        : 'text-emerald-400'
                    }`} />
                    <span>Active (Available for POS stamping)</span>
                  </div>
                  {formData.status === 'active' && <Check className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'inactive' })}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                    formData.status === 'inactive'
                      ? (isLight ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm' : 'bg-rose-600/30 text-rose-300 border-rose-500 shadow-sm')
                      : (isLight ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white')
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className={`w-4 h-4 ${
                      isLight 
                        ? (formData.status === 'inactive' ? 'text-rose-600' : 'text-slate-400') 
                        : 'text-rose-400'
                    }`} />
                    <span>Inactive (Archived)</span>
                  </div>
                  {formData.status === 'inactive' && <Check className={`w-3.5 h-3.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />}
                </button>
              </div>
            </div>

            {/* Live Badge Preview */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-3.5 ${cardBg}`}>
              <h4 className={`font-bold text-xs border-b pb-2 flex items-center justify-between ${textPrimary} ${borderPrimary}`}>
                <span>Receipt Stamp Preview</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </h4>
              <div className={`p-4 rounded-xl border space-y-2 ${bgSubtleCard}`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.color || '#10b981' }} />
                  <span className={`font-bold text-xs truncate ${textPrimary}`}>
                    {formData.name || 'Warranty Plan Name'}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Coverage: {formatDurationText(formData.duration, formData.durationType)}</span>
                </div>
                {formData.description && (
                  <p className={`text-[11px] line-clamp-2 ${textMuted}`}>{formData.description}</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-2 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold animate-slideUp ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border-rose-800'
              : 'bg-indigo-950/95 text-indigo-200 border-indigo-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-indigo-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Quick Action Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm ${isLight ? 'bg-white border-slate-200/80 shadow-md' : 'bg-slate-900/90 border-slate-800 backdrop-blur-md'}`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Product & Inventory</span>
            <span>/</span>
            <span className="text-emerald-400 font-bold">Warranties</span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 ${textPrimary}`}>
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Warranty Management</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              {warranties.length} Plans Defined
            </span>
            {selectedWarrantyIds.size > 0 && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                {selectedWarrantyIds.size} Selected
              </span>
            )}
          </h1>
          <p className={`text-xs mt-1 max-w-2xl ${textMuted}`}>
            Create, edit, and assign customer warranties to catalog products. When products with assigned warranty are sold at POS, the transaction date is automatically stamped as the warranty start date.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportButtons
            headers={['Warranty Plan', 'Coverage Duration', 'Status', 'Assigned Products', 'Terms & Conditions', 'Description', 'Plan ID']}
            keys={['name', 'duration', 'status', 'linkedProducts', 'terms', 'description', 'id']}
            data={exportWarrantiesData}
            filename={`warranty_catalog_${new Date().toISOString().slice(0, 10)}`}
            title="Warranty Plans Registry"
            isLight={isLight}
          />

          <button
            id="warranty-add-new-btn"
            type="button"
            onClick={handleOpenCreateModal}
            className={`px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer ${
              isLight
                ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Warranty</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Plans */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-[11px] font-semibold ${textMuted}`}>Total Warranty Plans</p>
            <h3 className={`text-2xl font-bold mt-0.5 ${textPrimary}`}>{metrics.total}</h3>
            <p className="text-[10px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{metrics.active} active guarantee schemes</span>
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${iconWrapperEmerald}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Products Covered */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-[11px] font-semibold ${textMuted}`}>Products Covered</p>
            <h3 className={`text-2xl font-bold mt-0.5 ${textPrimary}`}>{metrics.totalCoveredProducts}</h3>
            <p className="text-[10px] text-indigo-500 font-medium mt-1 flex items-center gap-1">
              <Boxes className="w-3 h-3 text-indigo-500" />
              <span>Out of {products.length} catalog items</span>
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${iconWrapperIndigo}`}>
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Multi-Year Protection */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-[11px] font-semibold ${textMuted}`}>Yearly Guarantees</p>
            <h3 className={`text-2xl font-bold mt-0.5 ${textPrimary}`}>{metrics.yearPlans}</h3>
            <p className="text-[10px] text-sky-500 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-500" />
              <span>Long-term coverage options</span>
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${iconWrapperSky}`}>
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Receipt Status */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`text-[11px] font-semibold ${textMuted}`}>Receipt Display Status</p>
            <h3 className="text-base font-bold mt-1 flex items-center gap-1.5">
              {settings.invoiceLayoutConfig?.showWarranty ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Enabled
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Disabled
                </span>
              )}
            </h3>
            <p className={`text-[10px] font-medium mt-1 ${textMuted}`}>
              {settings.invoiceLayoutConfig?.showWarranty
                ? 'Receipts include warranty expiry dates'
                : 'Enable in Invoice Layout settings'}
            </p>
          </div>
          <button
            id="warranty-receipt-settings-btn"
            type="button"
            onClick={() => navigateToSettings('invoice_layouts')}
            className={`p-3 border rounded-xl transition cursor-pointer ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-indigo-400 hover:text-white'}`}
            title="Configure in invoice layout settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* "Sell with Warranty" Operational Explainer Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm relative overflow-hidden ${isLight ? 'bg-gradient-to-r from-emerald-50 via-slate-50 to-indigo-50/50 border-emerald-200' : 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-emerald-800/40'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${isLight ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textPrimary}`}>
                <span>Sell with Warranty Engine</span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                  Automated Start Date Stamping
                </span>
              </h3>
              <p className={`text-xs leading-relaxed max-w-3xl ${textMutedDense}`}>
                When a cashier adds any product with an assigned warranty to the POS cart and completes the checkout, the system automatically uses the <span className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>Transaction Date</span> as the warranty start date, calculates the exact expiry date, and preserves it permanently on the customer invoice.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Unified Container for Filter and Content */}
      <div className="shadow-sm">
        {/* Filter and Search Bar */}
        <div className={`p-4 rounded-t-2xl border border-b-0 flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
          <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                id="warranty-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search warranties by plan name, duration, terms..."
                className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 transition ${inputBg}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bulk Action Bar beside Search */}
            {selectedWarrantyIds.size > 0 && (
              <div className={`flex items-center gap-2 p-1.5 pl-3 rounded-xl animate-fadeIn whitespace-nowrap border ${
                isLight ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/40 border-indigo-500/20'
              }`}>
                <div className="flex items-center gap-2 mr-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                    {selectedWarrantyIds.size}
                  </span>
                  <span className={`text-[10px] font-bold hidden md:inline ${isLight ? 'text-indigo-800' : 'text-white'}`}>
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExportCsv}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    title={`Export ${selectedWarrantyIds.size} selected to CSV`}
                  >
                    <Download className="w-3.5 h-3.5" />
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

          {/* Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <div className={`flex items-center p-1 rounded-xl border text-xs ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'all'
                    ? (isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95' : 'bg-slate-800 text-white shadow-sm font-bold')
                    : (isLight ? 'text-slate-700 hover:bg-sky-600 hover:text-white hover:font-bold hover:shadow-lg hover:shadow-sky-600/30 active:scale-95 font-medium' : 'text-slate-400 hover:text-slate-200 font-bold')
                }`}
              >
                All ({warranties.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'active'
                    ? (isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95' : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold')
                    : (isLight ? 'text-slate-700 hover:bg-sky-600 hover:text-white hover:font-bold hover:shadow-lg hover:shadow-sky-600/30 active:scale-95 font-medium' : 'text-slate-400 hover:text-slate-200 font-bold')
                }`}
              >
                Active ({warranties.filter((w) => w.status === 'active').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'inactive'
                    ? (isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95' : 'bg-slate-800 text-slate-300 shadow-sm font-bold')
                    : (isLight ? 'text-slate-700 hover:bg-sky-600 hover:text-white hover:font-bold hover:shadow-lg hover:shadow-sky-600/30 active:scale-95 font-medium' : 'text-slate-400 hover:text-slate-200 font-bold')
                }`}
              >
                Inactive ({warranties.filter((w) => w.status === 'inactive').length})
              </button>
            </div>

            {/* Page size filter (Light Mode Only) */}
            {isLight && (
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-emerald-500 font-medium cursor-pointer ${inputBg}`}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            )}

            {/* Duration Type Filter */}
            <select
              id="warranty-duration-filter"
              value={durationTypeFilter}
              onChange={(e) => setDurationTypeFilter(e.target.value as any)}
              className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:border-emerald-500 font-medium ${inputBg}`}
            >
              <option value="all">All Durations</option>
              <option value="years">Years Plans</option>
              <option value="months">Months Plans</option>
              <option value="days">Days Plans</option>
            </select>

            {/* View Mode Toggle */}
            <div className={`flex items-center p-1 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table'
                    ? (isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95' : 'bg-slate-800 text-white font-bold')
                    : (isLight ? 'text-slate-700 hover:bg-sky-600 hover:text-white hover:font-bold hover:shadow-lg hover:shadow-sky-600/30 active:scale-95' : 'text-slate-400 hover:text-white')
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid'
                    ? (isLight ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95' : 'bg-slate-800 text-white font-bold')
                    : (isLight ? 'text-slate-700 hover:bg-sky-600 hover:text-white hover:font-bold hover:shadow-lg hover:shadow-sky-600/30 active:scale-95' : 'text-slate-400 hover:text-white')
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Table or Grid View */}
        <div className={`border rounded-b-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200/80 shadow-md' : 'bg-slate-900 border-slate-800 shadow-sm'}`}>
          {filteredWarranties.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'}`}>
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className={`text-base font-bold ${textPrimary}`}>No Warranty Plans Found</h3>
              <p className={`text-xs max-w-md mx-auto ${textMuted}`}>
                {searchTerm || statusFilter !== 'all' || durationTypeFilter !== 'all'
                  ? 'No warranty plans match your current search or filter criteria. Try resetting filters.'
                  : 'You have not configured any warranty plans yet. Add your first guarantee plan to assign to products.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className={`px-4 py-2 rounded-xl text-xs transition inline-flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/10'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Warranty</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`${isLight ? 'bg-slate-50 border-b border-slate-200 text-slate-600 font-bold' : 'bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800'}`}>
                  <tr>
                    <th className="py-3.5 px-4 text-center border-r border-slate-800/50 w-10">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomePageSelected;
                        }}
                        onChange={handleToggleSelectPage}
                        className={`w-4 h-4 rounded border-slate-700 focus:ring-emerald-500 cursor-pointer transition ${isLight ? 'text-emerald-600' : 'bg-slate-950 text-emerald-600'}`}
                      />
                    </th>
                    <th className="py-3.5 px-4 font-bold">Warranty Plan</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Coverage Duration</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Assigned Products</th>
                    <th className="py-3.5 px-4 font-bold">Terms & Conditions</th>
                    <th className="py-3.5 px-4 font-bold text-center whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right font-bold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-slate-300 ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                  {paginatedWarranties.map((war) => {
                    const linkedCount = warrantyProductCountMap[war.id] || 0;
                    const isSelected = selectedWarrantyIds.has(war.id);
                    return (
                      <tr
                        key={war.id}
                        className={`transition group border-b ${isSelected ? (isLight ? 'bg-emerald-50/50' : 'bg-emerald-950/20') : ''} ${isLight ? 'hover:bg-slate-50/60 border-slate-100 text-slate-800' : 'hover:bg-slate-800/40 border-slate-800/60 text-slate-300'}`}
                      >
                        <td className={`py-3.5 px-4 text-center border-r border-slate-800/50 ${isSelected ? (isLight ? 'bg-emerald-100/30' : 'bg-emerald-900/20') : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleWarrantySelect(war.id)}
                            className={`w-4 h-4 rounded border-slate-700 focus:ring-emerald-500 cursor-pointer transition ${isLight ? 'text-emerald-600' : 'bg-slate-950 text-emerald-600'}`}
                          />
                        </td>
                        {/* Name & Badge */}
                        <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: war.color || '#10b981' }}
                          />
                          <div className="min-w-0">
                            <p className={`font-bold text-sm transition group-hover:text-emerald-500 truncate ${textPrimary}`}>
                              {war.name}
                            </p>
                            {war.description && (
                              <p className={`text-[11px] max-w-xs truncate ${textMuted}`}>
                                {war.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold ${isLight ? 'bg-slate-50 border-slate-200/80 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'}`}>
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{formatDurationText(war.duration, war.durationType)}</span>
                        </div>
                      </td>

                      {/* Assigned Products */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingProductsWarranty(war)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs border transition ${
                            linkedCount > 0
                              ? (isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/60' : 'bg-indigo-950/60 text-indigo-300 border-indigo-800 hover:bg-indigo-900/60')
                              : (isLight ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-slate-950 text-slate-500 border-slate-800')
                          }`}
                          title="Click to view all products carrying this warranty"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>{linkedCount} Product{linkedCount !== 1 ? 's' : ''}</span>
                        </button>
                      </td>

                      {/* Terms */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {war.terms ? (
                          <p className={`text-[11px] truncate max-w-[200px] ${textMuted}`} title={war.terms}>
                            {war.terms}
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No specific terms</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            updateWarranty(war.id, {
                              status: war.status === 'active' ? 'inactive' : 'active',
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${
                            war.status === 'active'
                              ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20')
                              : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700')
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              war.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          <span className="capitalize">{war.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Assign */}
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(war)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${actionBtnAssign}`}
                            title="Assign this warranty to catalog products"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewingWarrantyDetails(war)}
                            className={`p-1.5 rounded-lg border transition ${actionBtnView}`}
                            title="View warranty details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(war)}
                            className={`p-1.5 rounded-lg border transition ${actionBtnEdit}`}
                            title="Edit warranty details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(war)}
                            className={`p-1.5 rounded-lg border transition ${actionBtnDelete}`}
                            title="Delete warranty plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {paginatedWarranties.map((war) => {
                const linkedCount = warrantyProductCountMap[war.id] || 0;
                const isSelected = selectedWarrantyIds.has(war.id);
                return (
                  <div
                    key={war.id}
                    className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 transition group ${isSelected ? (isLight ? 'bg-emerald-50/30 border-emerald-500/50' : 'bg-emerald-950/20 border-emerald-500/30') : ''} ${isLight ? 'bg-white border-slate-200 hover:border-slate-300 shadow-md' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleWarrantySelect(war.id)}
                            className={`w-3.5 h-3.5 rounded border-slate-700 focus:ring-emerald-500 cursor-pointer transition ${isLight ? 'text-emerald-600' : 'bg-slate-950 text-emerald-600'}`}
                          />
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: war.color || '#10b981' }}
                          />
                          <h3 className={`font-bold text-sm transition group-hover:text-emerald-500 ${textPrimary}`}>
                            {war.name}
                          </h3>
                        </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                        war.status === 'active'
                          ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30')
                          : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700')
                      }`}
                    >
                      {war.status}
                    </span>
                  </div>

                  {war.description && (
                    <p className={`text-xs leading-relaxed ${textMutedDense}`}>
                      {war.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-200'}`}>
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{formatDurationText(war.duration, war.durationType)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingProductsWarranty(war)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-950 hover:bg-slate-800 text-indigo-300 border-slate-800'}`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>{linkedCount} Product{linkedCount !== 1 ? 's' : ''}</span>
                    </button>
                  </div>

                  {war.terms && (
                    <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${isLight ? 'bg-slate-50 border-slate-200/60 text-slate-600' : 'bg-slate-950/70 border-slate-800/80 text-slate-400'}`}>
                      <p className={`font-bold flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                        <FileText className="w-3 h-3 text-emerald-500" />
                        <span>Coverage Terms:</span>
                      </p>
                      <p className="line-clamp-2">{war.terms}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className={`flex items-center justify-between gap-2 pt-2 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(war)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Assign Products</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingWarrantyDetails(war)}
                      className={`p-2 rounded-xl border transition ${
                        isLight
                          ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="View warranty details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(war)}
                      className={`p-2 rounded-xl border transition ${
                        isLight
                          ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Edit warranty"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(war)}
                      className={`p-2 rounded-xl border transition ${
                        isLight
                          ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent'
                          : 'bg-slate-800 hover:bg-rose-900/60 border-slate-700 text-slate-400 hover:text-rose-300'
                      }`}
                      title="Delete warranty"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

        </div>

        {/* Pagination Footer (Light Mode Only) */}
        {isLight && totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t bg-slate-50/30 ${isLight ? 'border-slate-200/80' : 'border-slate-800'}`}>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{Math.min((currentPage - 1) * pageSize + 1, filteredWarranties.length)}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredWarranties.length)}</span> of <span className="font-bold text-slate-800">{filteredWarranties.length}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-semibold text-slate-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN WARRANTY TO PRODUCTS (BATCH ASSIGNER)                     */}
      {/* ========================================================================= */}
      {isAssignModalOpen && assigningWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: assigningWarranty.color || '#10b981' }}
                />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Assign Warranty to Products</span>
                    <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      {assigningWarranty.name} ({formatDurationText(assigningWarranty.duration, assigningWarranty.durationType)})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select products that should automatically receive this warranty upon sale.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter bar in modal */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search products by name, SKU, brand..."
                  className="w-full bg-slate-900 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={assignCategoryFilter}
                  onChange={(e) => setAssignCategoryFilter(e.target.value)}
                  className="bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Categories</option>
                  {productCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleToggleAllFilteredInAssign(filteredAssignProducts)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 whitespace-nowrap transition"
                >
                  {filteredAssignProducts.every((p) => selectedProductIds.includes(p.id)) && filteredAssignProducts.length > 0
                    ? 'Deselect All Filtered'
                    : 'Select All Filtered'}
                </button>
              </div>
            </div>

            {/* Product List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-800/60">
              {filteredAssignProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No products match your search query.
                </div>
              ) : (
                filteredAssignProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  const currentWar = p.warrantyId
                    ? warranties.find((w) => w.id === p.warrantyId)
                    : null;
                  const isOtherWar = currentWar && currentWar.id !== assigningWarranty.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleProductInAssign(p.id)}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-emerald-950/30 border border-emerald-800/60'
                          : 'hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent container click
                          className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                              {p.sku}
                            </span>
                            {p.brand && <span>Brand: {getBrandName(p.brand)}</span>}
                            <span>• {getCategoryName(p.category)}</span>
                            <span>• Price: {settings.currencySymbol}{p.sellingPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isChecked ? (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Assigned</span>
                          </span>
                        ) : isOtherWar ? (
                          <span className="text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            Current: {currentWar.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            No Warranty
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 font-medium">
                <span className="font-bold text-white">{selectedProductIds.length}</span> product(s) selected for &quot;{assigningWarranty.name}&quot;
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductAssignments}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Warranty Assignments</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW LINKED PRODUCTS                                             */}
      {/* ========================================================================= */}
      {viewingProductsWarranty && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBg} animate-fadeIn`}>
          <div className={`border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`p-5 border-b flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: viewingProductsWarranty.color || '#10b981' }}
                />
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Products Covered by &quot;{viewingProductsWarranty.name}&quot;
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Duration: {formatDurationText(viewingProductsWarranty.duration, viewingProductsWarranty.durationType)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProductsWarranty(null)}
                className={`p-1.5 rounded-lg transition ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {(() => {
                const linkedProds = (products || []).filter(
                  (p) => p.warrantyId === viewingProductsWarranty.id
                );
                if (linkedProds.length === 0) {
                  return (
                    <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      No products are currently assigned to this warranty plan.
                    </div>
                  );
                }
                return linkedProds.map((prod) => (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}
                  >
                    <div>
                      <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{prod.name}</p>
                      <div className={`flex items-center gap-2 text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className={`font-mono px-1.5 py-0.2 rounded border ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800'}`}>
                          {prod.sku}
                        </span>
                        <span>Brand: {prod.brand || 'Unbranded'}</span>
                        <span>• Cat: {getCategoryName(prod.category)}</span>
                        <span>• Stock: {prod.currentStock} {prod.unit}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setViewingProductsWarranty(null);
                        openEditProductPage(prod);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-semibold border transition flex items-center gap-1 shrink-0 ${
                        isLight
                          ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95 border-transparent'
                          : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border-slate-700'
                      }`}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Product</span>
                    </button>
                  </div>
                ));
              })()}
            </div>

            <div className={`p-4 border-t flex items-center justify-between gap-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setViewingProductsWarranty(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isLight 
                    ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetWar = viewingProductsWarranty;
                  setViewingProductsWarranty(null);
                  handleOpenAssignModal(targetWar);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Manage Product Assignments</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3B: VIEW WARRANTY DETAILS                                           */}
      {/* ========================================================================= */}
      {viewingWarrantyDetails && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBg} animate-fadeIn`}>
          <div className={`rounded-2xl border w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0"
                  style={{ backgroundColor: viewingWarrantyDetails.color || '#0284c7' }}
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {viewingWarrantyDetails.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        viewingWarrantyDetails.status === 'active'
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : isLight
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          viewingWarrantyDetails.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span className="capitalize">{viewingWarrantyDetails.status || 'active'}</span>
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Coverage: <span className="font-semibold">{formatDurationText(viewingWarrantyDetails.duration, viewingWarrantyDetails.durationType)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingWarrantyDetails(null)}
                className={`p-2 rounded-xl transition ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Duration</p>
                  <p className={`text-sm font-extrabold mt-0.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {viewingWarrantyDetails.duration} {viewingWarrantyDetails.durationType}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Unit Type</p>
                  <p className={`text-sm font-extrabold mt-0.5 capitalize ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {viewingWarrantyDetails.durationType}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Covered Products</p>
                  <p className={`text-sm font-extrabold mt-0.5 ${isLight ? 'text-sky-600' : 'text-emerald-400'}`}>
                    {(products || []).filter((p) => p.warrantyId === viewingWarrantyDetails.id).length} Products
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Color Identifier</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: viewingWarrantyDetails.color || '#0284c7' }} />
                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {viewingWarrantyDetails.color || '#0284c7'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <FileText className="w-3.5 h-3.5 text-sky-500" />
                  <span>Description & Scope</span>
                </h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {viewingWarrantyDetails.description || 'No detailed description specified for this warranty plan.'}
                </p>
              </div>

              {/* Terms & Conditions */}
              <div className={`p-3.5 rounded-xl border space-y-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Coverage Terms & Conditions</span>
                </h4>
                <div className={`text-xs leading-relaxed p-2.5 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap ${isLight ? 'bg-white text-slate-700 border border-slate-200' : 'bg-slate-900 text-slate-300 border border-slate-800'}`}>
                  {viewingWarrantyDetails.terms || 'Standard vendor terms and coverage conditions apply.'}
                </div>
              </div>

              {/* Assigned Products List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      Assigned Products ({(products || []).filter((p) => p.warrantyId === viewingWarrantyDetails.id).length})
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingWarrantyDetails;
                      setViewingWarrantyDetails(null);
                      handleOpenAssignModal(target);
                    }}
                    className={`text-xs font-bold hover:underline flex items-center gap-1 ${isLight ? 'text-sky-600' : 'text-emerald-400'}`}
                  >
                    <span>Assign More</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className={`rounded-xl border divide-y max-h-48 overflow-y-auto ${isLight ? 'bg-slate-50 border-slate-200 divide-slate-200' : 'bg-slate-950 border-slate-800 divide-slate-800'}`}>
                  {(() => {
                    const linked = (products || []).filter((p) => p.warrantyId === viewingWarrantyDetails.id);
                    if (linked.length === 0) {
                      return (
                        <div className={`p-6 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          No catalog products are currently assigned to this warranty plan.
                        </div>
                      );
                    }
                    return linked.map((prod) => (
                      <div key={prod.id} className="p-2.5 flex items-center justify-between text-xs gap-2">
                        <div className="min-w-0">
                          <p className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{prod.name}</p>
                          <div className={`flex items-center gap-2 text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span className="font-mono">{prod.sku}</span>
                            <span>• {prod.brand || 'Unbranded'}</span>
                            <span>• Stock: {prod.currentStock} {prod.unit}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setViewingWarrantyDetails(null);
                            openEditProductPage(prod);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 shrink-0 ${
                            isLight
                              ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/30 active:scale-95 border-transparent'
                              : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-700'
                          }`}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setViewingWarrantyDetails(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingWarrantyDetails;
                    setViewingWarrantyDetails(null);
                    handleOpenAssignModal(target);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Assign Products</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingWarrantyDetails;
                    setViewingWarrantyDetails(null);
                    handleOpenEditModal(target);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 active:scale-95'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Warranty</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION WITH CASCADE REASSIGNMENT SAFEGUARD         */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && warrantyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Warranty Plan</h3>
                <p className="text-xs text-slate-400">Confirm removal of &quot;{warrantyToDelete.name}&quot;</p>
              </div>
            </div>

            {deleteErrorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium rounded-xl">
                {deleteErrorMessage}
              </div>
            )}

            {/* Check if products are linked */}
            {(() => {
              const count = warrantyProductCountMap[warrantyToDelete.id] || 0;
              if (count > 0) {
                return (
                  <div className="space-y-3 p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs">
                    <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{count} product(s) currently carry this warranty.</span>
                    </p>
                    <p className="text-slate-300 text-[11px]">
                      Choose what to do with the products currently carrying this warranty:
                    </p>
                    <select
                      value={reassignTargetId}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="unassign">Remove warranty (set to No Warranty)</option>
                      {warranties
                        .filter((w) => w.id !== warrantyToDelete.id)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            Reassign to: {w.name} ({formatDurationText(w.duration, w.durationType)})
                          </option>
                        ))}
                    </select>
                  </div>
                );
              }
              return (
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-white">&quot;{warrantyToDelete.name}&quot;</span>? This action cannot be undone.
                </p>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isLight 
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                id="confirm-delete-warranty-btn"
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
