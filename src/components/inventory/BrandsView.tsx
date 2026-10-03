import React, { useState, useMemo, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { Brand } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import { validateMasterEntityData } from '../../utils/validation';
import { FormFieldError } from '../common/FormFieldError';
import { ExportButtons } from '../common/ExportButtons';
import {
  Award,
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
  Globe,
  ExternalLink,
  Download,
  Info,
  ShieldAlert,
  Tag,
  Building2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface BrandFormData {
  name: string;
  code: string;
  shortCode: string;
  description: string;
  website: string;
  originCountry: string;
  color: string;
  logo?: string;
  status: 'active' | 'inactive';
}

const initialFormState: BrandFormData = {
  name: '',
  code: '',
  shortCode: '',
  description: '',
  website: '',
  originCountry: '',
  color: '#6366f1',
  logo: '',
  status: 'active',
};

const COLOR_OPTIONS = [
  { label: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-400' },
  { label: 'Sky Blue', value: '#0ea5e9', bgClass: 'bg-sky-500', textClass: 'text-sky-400' },
  { label: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
  { label: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-400' },
  { label: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500', textClass: 'text-rose-400' },
  { label: 'Violet', value: '#8b5cf6', bgClass: 'bg-violet-500', textClass: 'text-violet-400' },
  { label: 'Cyan', value: '#06b6d4', bgClass: 'bg-cyan-500', textClass: 'text-cyan-400' },
  { label: 'Slate', value: '#64748b', bgClass: 'bg-slate-500', textClass: 'text-slate-400' },
];

const PRESET_COUNTRIES = [
  'United States',
  'Germany',
  'Japan',
  'United Kingdom',
  'Sweden',
  'Colombia',
  'Taiwan',
  'South Korea',
  'Switzerland',
  'Italy',
  'France',
  'India',
  'Canada',
  'Australia',
];

export const BrandsView: React.FC = () => {
  const {
    brands,
    products,
    addBrand,
    updateBrand,
    deleteBrand,
    currentUser,
    navigateToInventory,
    settings,
  } = useErp();

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (
        p.includes('brands/add') ||
        p.includes('brands/edit') 
      ) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('brands/add') && !window.location.pathname.includes('brands/edit')) {
        window.history.replaceState(null, '', '/inventory/brands/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('brands/add') || window.location.pathname.includes('brands/edit') || window.location.hash.includes('brands/add') || window.location.hash.includes('brands/edit'))) {
        window.history.replaceState(null, '', '/inventory/brands');
      }
    }
  }, [isModalOpen]);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<string>>(new Set());

  const handleToggleBrandSelect = (brandId: string) => {
    setSelectedBrandIds((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  };

  const handleClearSelection = () => setSelectedBrandIds(new Set());

  // Logo upload state & handler
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const processAndSetLogoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please upload a valid image file (PNG, SVG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image file exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;
      setFormData((prev) => ({ ...prev, logo: dataUrl }));
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  // Products under currently viewed brand in View modal
  const viewingBrandProducts = useMemo(() => {
    if (!viewingBrand) return [];
    return (products || []).filter(
      (p) => p.brand && p.brand.toLowerCase() === viewingBrand.name.toLowerCase()
    );
  }, [viewingBrand, products]);

  // Deletion modal state
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // Role permissions check
  const isAdminOrManager =
    currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'inventory_manager';

  // Product counts per brand
  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    brands.forEach((b) => {
      const matchCount = (products || []).filter(
        (p) => p.brand && p.brand.toLowerCase() === b.name.toLowerCase()
      ).length;
      counts[b.id] = matchCount;
    });
    return counts;
  }, [brands, products]);

  // Unique origin countries in dataset
  const originCountries = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => {
      if (b.originCountry) set.add(b.originCountry);
    });
    return Array.from(set).sort();
  }, [brands]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.shortCode && b.shortCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.originCountry && b.originCountry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ? true : b.status === statusFilter;

      const matchesCountry =
        countryFilter === 'all' ? true : b.originCountry === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }, [brands, searchQuery, statusFilter, countryFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, countryFilter, pageSize]);

  const totalPages = Math.ceil(filteredBrands.length / pageSize);

  const paginatedBrands = useMemo(() => {
    if (!isLight) return filteredBrands;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBrands.slice(startIndex, startIndex + pageSize);
  }, [filteredBrands, isLight, currentPage, pageSize]);

  const isAllPageSelected = paginatedBrands.length > 0 && paginatedBrands.every(b => selectedBrandIds.has(b.id));
  const isSomePageSelected = paginatedBrands.some(b => selectedBrandIds.has(b.id)) && !isAllPageSelected;

  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      setSelectedBrandIds(prev => {
        const next = new Set(prev);
        paginatedBrands.forEach(b => next.delete(b.id));
        return next;
      });
    } else {
      setSelectedBrandIds(prev => {
        const next = new Set(prev);
        paginatedBrands.forEach(b => next.add(b.id));
        return next;
      });
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = brands.length;
    const active = brands.filter((b) => b.status === 'active').length;
    const inactive = total - active;
    const totalLinkedProducts = Object.values(brandProductCounts).reduce<number>((a, b) => a + Number(b || 0), 0);
    const totalCountries = originCountries.length;

    return { total, active, inactive, totalLinkedProducts, totalCountries };
  }, [brands, brandProductCounts, originCountries]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      code: brand.code,
      shortCode: brand.shortCode || '',
      description: brand.description || '',
      website: brand.website || '',
      originCountry: brand.originCountry || '',
      color: brand.color || '#6366f1',
      logo: brand.logo || '',
      status: brand.status,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Form submission handler
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const schemaRes = validateMasterEntityData({
      name: formData.name,
      shortName: formData.shortCode,
      code: formData.code,
      entityLabel: 'Brand Name',
    });

    if (!schemaRes.isValid) {
      setFieldErrors(schemaRes.errors);
      setFormError(schemaRes.firstError || 'Please correct the highlighted form errors.');
      return;
    }

    const trimmedName = formData.name.trim();

    // Auto-generate code if empty
    const codeToUse =
      formData.code.trim() ||
      `BRD-${trimmedName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

    const shortCodeToUse =
      formData.shortCode.trim() ||
      trimmedName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Duplicate check for name & code
    const isDuplicateName = brands.some(
      (b) =>
        b.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingBrand || b.id !== editingBrand.id)
    );
    if (isDuplicateName) {
      setFormError(`A brand named "${trimmedName}" already exists.`);
      return;
    }

    const isDuplicateCode = brands.some(
      (b) =>
        b.code.toLowerCase() === codeToUse.toLowerCase() &&
        (!editingBrand || b.id !== editingBrand.id)
    );
    if (isDuplicateCode) {
      setFormError(`A brand with code "${codeToUse}" already exists.`);
      return;
    }

    if (editingBrand) {
      updateBrand(editingBrand.id, {
        name: trimmedName,
        code: codeToUse,
        shortCode: shortCodeToUse,
        description: formData.description.trim(),
        website: formData.website.trim(),
        originCountry: formData.originCountry.trim(),
        color: formData.color,
        logo: formData.logo || '',
        status: formData.status,
      });
      setStatusMessage({
        type: 'success',
        text: `Brand "${trimmedName}" updated successfully.`,
      });
    } else {
      addBrand({
        name: trimmedName,
        code: codeToUse,
        shortCode: shortCodeToUse,
        description: formData.description.trim(),
        website: formData.website.trim(),
        originCountry: formData.originCountry.trim(),
        color: formData.color,
        logo: formData.logo || '',
        status: formData.status,
      });
      setStatusMessage({
        type: 'success',
        text: `Brand "${trimmedName}" created and added to registry.`,
      });
    }

    setIsModalOpen(false);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Open delete confirmation modal
  const handlePromptDelete = (brand: Brand) => {
    setBrandToDelete(brand);
    // Find first available target brand other than this one for fallback migration
    const otherBrands = brands.filter((b) => b.id !== brand.id);
    setReassignTargetId(otherBrands.length > 0 ? otherBrands[0].id : '');
  };

  // Execute deletion
  const handleConfirmDelete = () => {
    if (!brandToDelete) return;

    const result = deleteBrand(
      brandToDelete.id,
      reassignTargetId || undefined
    );

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message || `Brand "${brandToDelete.name}" deleted successfully.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message || 'Failed to delete brand.',
      });
    }

    setBrandToDelete(null);
    setReassignTargetId('');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Export Data Preparation for Unified ExportButtons
  const exportBrandsData = useMemo(() => {
    const sourceList = selectedBrandIds.size > 0
      ? brands.filter((b) => selectedBrandIds.has(b.id))
      : filteredBrands;

    return sourceList.map((b) => ({
      name: b.name,
      code: b.code,
      shortCode: b.shortCode || '—',
      originCountry: b.originCountry || '—',
      website: b.website || '—',
      linkedProducts: brandProductCounts[b.id] || 0,
      status: b.status === 'active' ? 'Active' : 'Inactive',
      description: b.description || '—',
    }));
  }, [brands, filteredBrands, selectedBrandIds, brandProductCounts]);

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = ['Brand ID', 'Name', 'Code', 'Short Code', 'Country', 'Website', 'Linked Products', 'Status', 'Description'];
    const rows = filteredBrands.map((b) => [
      `"${b.id}"`,
      `"${b.name.replace(/"/g, '""')}"`,
      `"${b.code}"`,
      `"${b.shortCode || ''}"`,
      `"${b.originCountry || ''}"`,
      `"${b.website || ''}"`,
      `"${brandProductCounts[b.id] || 0}"`,
      `"${b.status}"`,
      `"${(b.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `brands_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isModalOpen) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Top Header & Breadcrumb Bar */}
        <div className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`p-2.5 rounded-xl transition flex items-center gap-2 text-xs font-bold border shadow-sm ${
                isLight 
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-slate-100 border-slate-800' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span>Back to Brands</span>
            </button>
            <div>
              <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Products & Inventory</span>
                <span>/</span>
                <span>Brands</span>
                <span>/</span>
                <span className="text-sky-500 font-semibold">{editingBrand ? 'Edit Brand' : 'Add New Brand'}</span>
              </div>
              <h1 className={`text-xl font-bold mt-0.5 flex items-center gap-2 ${isLight ? 'text-slate-850' : 'text-white'}`}>
                <Award className="w-5 h-5 text-sky-400" />
                <span>{editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create Brand'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-text="Cancel"
              data-action="cancel"
              onClick={() => setIsModalOpen(false)}
              className={
                isLight
                  ? 'px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer active:scale-95'
                  : 'px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }
            >
              Cancel
            </button>
            <button
              id="brand-form-submit-btn"
              type="submit"
              form="brand-main-form"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingBrand ? 'Save Changes' : 'Create Brand'}</span>
            </button>
          </div>
        </div>

        {/* Full Page Form Grid */}
        <form id="brand-main-form" onSubmit={handleSaveBrand} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Area (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Brand Information & Identifiers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure brand name, unique SKU prefixes, web profiles, and origin metadata.
              </p>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Brand Name & SKU Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="brand-form-name-input"
                  type="text"
                  required
                  placeholder="e.g. Apex Tech, Sony, Nike"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    setFormData((prev) => ({
                      ...prev,
                      name: newName,
                      code:
                        prev.code === '' || prev.code.startsWith('BRD-')
                          ? `BRD-${newName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}`
                          : prev.code,
                      shortCode:
                        prev.shortCode === ''
                          ? newName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')
                          : prev.shortCode,
                    }));
                  }}
                  className={`w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border ${fieldErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} focus:outline-none focus:border-sky-500 transition`}
                />
                <FormFieldError error={fieldErrors.name} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand Code / SKU Prefix <span className="text-rose-400">*</span>
                </label>
                <input
                  id="brand-form-code-input"
                  type="text"
                  required
                  placeholder="e.g. BRD-APEX"
                  value={formData.code}
                  onChange={(e) => {
                    if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
                    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                  }}
                  className={`w-full bg-slate-950 font-mono text-white text-xs px-3.5 py-2.5 rounded-xl border ${fieldErrors.code ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} focus:outline-none focus:border-sky-500 transition`}
                />
                <FormFieldError error={fieldErrors.code} />
              </div>
            </div>

            {/* Short Code & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Short Code / Label Slug
                </label>
                <input
                  id="brand-form-shortcode-input"
                  type="text"
                  placeholder="e.g. APEX, SONY"
                  value={formData.shortCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, shortCode: e.target.value.toUpperCase() }))
                  }
                  className="w-full bg-slate-950 font-mono text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used for barcode labeling & SKU auto-generation
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Country of Origin
                </label>
                <input
                  id="brand-form-country-input"
                  type="text"
                  list="country-suggestions"
                  placeholder="e.g. United States, Germany, Japan"
                  value={formData.originCountry}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, originCountry: e.target.value }))
                  }
                  className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 transition"
                />
                <datalist id="country-suggestions">
                  {PRESET_COUNTRIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Brand Logo Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Brand Logo
                </label>
                <span className="text-[11px] text-slate-400">PNG, SVG, JPG, WebP (Max 5MB)</span>
              </div>
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processAndSetLogoFile(file);
                  e.target.value = '';
                }}
              />
              {formData.logo ? (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl border border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden bg-white/5 shadow-inner"
                    >
                      <img src={formData.logo} alt="Brand Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Brand Logo Attached</p>
                      <p className="text-[11px] text-slate-400">Ready for products catalog & POS display</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Remove Logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processAndSetLogoFile(file);
                  }}
                  onClick={() => logoFileInputRef.current?.click()}
                  className={`p-4 rounded-xl border-2 border-dashed transition flex items-center justify-between gap-3 cursor-pointer group ${
                    isDraggingLogo
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 hover:border-sky-500/50 bg-slate-950/60 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-sky-500/15 text-slate-400 group-hover:text-sky-400 border border-slate-700 group-hover:border-sky-500/30 flex items-center justify-center shrink-0 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold text-slate-200 transition ${isLight ? 'group-hover:text-slate-300 group-hover:mb-1.5' : 'group-hover:text-white'}`}>
                        Upload Brand Logo
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Drag and drop or click to upload PNG, SVG, or JPG
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-sky-500/20 text-slate-300 group-hover:text-sky-300 text-[11px] font-bold border border-slate-700 group-hover:border-sky-500/30 shrink-0 transition">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>PNG / SVG / JPG</span>
                  </div>
                </div>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Website / Vendor URL
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="brand-form-website-input"
                  type="text"
                  placeholder="e.g. https://apextech.io"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, website: e.target.value }))
                  }
                  className="w-full bg-slate-950 text-white text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 transition font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description / Profile Notes
              </label>
              <textarea
                id="brand-form-desc-input"
                rows={3}
                placeholder="Provide brand notes, manufacturing overview, or product specialization..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 transition resize-none"
              />
            </div>
          </div>

          {/* Right Sidebar Area (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Color Accent Picker */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                Brand Badge Color Accent
              </h4>
              <div className="flex items-center gap-2.5 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color: c.value }))}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      formData.color === c.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {formData.color === c.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selection */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-3.5 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h4 className={`font-bold text-xs border-b pb-2 ${
                isLight ? 'text-slate-800 border-slate-200' : 'text-white border-slate-800'
              }`}>
                Registry Status
              </h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: 'active' }))}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                    formData.status === 'active'
                      ? (isLight
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                          : 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm')
                      : (isLight
                          ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white')
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${
                      isLight 
                        ? (formData.status === 'active' ? 'text-emerald-600' : 'text-slate-400') 
                        : 'text-emerald-400'
                    }`} />
                    <span>Active (In Products & POS)</span>
                  </div>
                  {formData.status === 'active' && <Check className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: 'inactive' }))}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                    formData.status === 'inactive'
                      ? (isLight
                          ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                          : 'bg-rose-600/30 text-rose-300 border-rose-500 shadow-sm')
                      : (isLight
                          ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white')
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

            {/* Live POS Pill Preview */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>POS & Catalog Badge Preview</span>
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              </h4>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shrink-0 overflow-hidden"
                    style={{ backgroundColor: formData.color || '#6366f1' }}
                  >
                    {formData.logo ? (
                      <img src={formData.logo} alt="Brand Logo" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      (formData.name || 'BR').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm truncate">
                        {formData.name || 'Brand Name'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                        {formData.code || 'BRD-CODE'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formData.originCountry ? `Origin: ${formData.originCountry}` : 'Global Origin'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                data-text="Cancel"
                data-action="cancel"
                onClick={() => setIsModalOpen(false)}
                className={
                  isLight
                    ? 'px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer active:scale-95'
                    : 'px-4 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }
              >
                Cancel
              </button>
              <button
                type="submit"
                id="brand-form-bottom-submit-btn"
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingBrand ? 'Save Changes' : 'Create Brand'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border backdrop-blur-md transition-colors duration-300 shadow-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Brands</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-400 dark:text-sky-300 border border-sky-500/30">
                  Manage your Brands
                </span>
                {selectedBrandIds.size > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                    {selectedBrandIds.size} Selected
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Organize manufacturing brands, trademark labels, origin countries, and link them to product SKUs and POS registers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <ExportButtons
            headers={['Brand Name', 'Code', 'Short Code', 'Origin Country', 'Website', 'Linked Products', 'Status', 'Description']}
            keys={['name', 'code', 'shortCode', 'originCountry', 'website', 'linkedProducts', 'status', 'description']}
            data={exportBrandsData}
            filename={`brands_registry_${new Date().toISOString().slice(0, 10)}`}
            title="Brands Registry"
            isLight={isLight}
          />

          {isAdminOrManager ? (
            <button
              id="brands-add-new-btn"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin / Manager access required to edit</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Brands</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cataloged in registry</p>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Brands</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-2">{metrics.active}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.inactive > 0 ? `${metrics.inactive} inactive / archived` : '100% available in POS'}
          </p>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Linked Products</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-2">{metrics.totalLinkedProducts}</p>
          <p className="text-[11px] text-slate-400 mt-1">SKUs with brand tags</p>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Global Origins</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{metrics.totalCountries}</p>
          <p className="text-[11px] text-slate-400 mt-1">Countries of origin</p>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* Unified Container for Filters and Table to remove gap */}
      <div className="shadow-xl">
        {/* Filter & Search Bar */}
        <div className={`p-3.5 rounded-t-2xl border border-b-0 flex flex-col md:flex-row items-center justify-between gap-3 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="brands-search-input"
                type="text"
                placeholder="Search by brand, code, country, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border focus:outline-none transition ${isLight ? 'bg-slate-50 border-slate-200 focus:border-sky-500' : 'bg-slate-950 border-slate-700 focus:border-sky-500 text-slate-200'}`}
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

            {/* Bulk Action Bar beside Search */}
            {selectedBrandIds.size > 0 && (
              <div className={`flex items-center gap-2 p-1.5 pl-3 rounded-xl animate-fadeIn whitespace-nowrap border ${
                isLight ? 'bg-sky-50 border-sky-200' : 'bg-sky-950/40 border-sky-500/20'
              }`}>
                <div className="flex items-center gap-2 mr-2">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                    {selectedBrandIds.size}
                  </span>
                  <span className={`text-[10px] font-bold hidden md:inline ${isLight ? 'text-sky-800' : 'text-white'}`}>
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExportCsv}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    title={`Export ${selectedBrandIds.size} selected to CSV`}
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

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
            {/* Page size filter (Light Mode Only) */}
            {isLight && (
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-700 text-slate-200'}`}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            )}

            {/* Status Filter */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-700'}`}>
              <button
                id="brands-filter-status-all"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-sky-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({brands.length})
              </button>
              <button
                id="brands-filter-status-active"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === 'active'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({metrics.active})
              </button>
              <button
                id="brands-filter-status-inactive"
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === 'inactive'
                    ? 'bg-rose-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Inactive ({metrics.inactive})
              </button>
            </div>

            {/* Country Filter */}
            {originCountries.length > 0 && (
              <select
                id="brands-filter-country-select"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-700 text-slate-200'}`}
              >
                <option value="all">All Countries ({originCountries.length})</option>
                {originCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || statusFilter !== 'all' || countryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCountryFilter('all');
                }}
                className="text-xs text-sky-400 hover:underline px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Brands Table / List */}
        <div className={`rounded-b-2xl border border-t-0 overflow-hidden shadow-xl ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${isLight ? 'bg-slate-50 border-b border-slate-200 text-slate-600' : 'bg-slate-950/80 border-b border-slate-800 text-slate-400'} font-semibold uppercase tracking-wider text-[10px]`}>
                  <th className="py-3.5 px-4 text-center border-r border-slate-800/50 w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomePageSelected;
                      }}
                      onChange={handleToggleSelectPage}
                      className={`w-4 h-4 rounded border-slate-700 focus:ring-sky-500 cursor-pointer transition ${isLight ? 'text-sky-600' : 'bg-slate-950 text-sky-600'}`}
                    />
                  </th>
                  <th className="py-3.5 px-4">Brand & Identifier</th>
                  <th className="py-3.5 px-4">Short Code</th>
                  <th className="py-3.5 px-4">Origin & Website</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Linked SKUs</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="p-3 bg-slate-800/80 rounded-2xl text-slate-500 border border-slate-700">
                        <Award className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">No brands found</p>
                      <p className="text-xs text-slate-500 text-center">
                        {searchQuery || statusFilter !== 'all' || countryFilter !== 'all'
                          ? 'Try clearing search terms or changing your filter criteria.'
                          : 'Get started by creating manufacturing brands to tag across your products catalog.'}
                      </p>
                      {isAdminOrManager && (
                        <button
                          onClick={handleOpenCreateModal}
                          className="mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Brand</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBrands.map((brand) => {
                  const linkedCount = brandProductCounts[brand.id] || 0;
                  const brandColor = brand.color || '#6366f1';

                  return (
                    <tr
                      key={brand.id}
                      id={`brand-row-${brand.id}`}
                      className={`transition group ${selectedBrandIds.has(brand.id) ? (isLight ? 'bg-sky-50/50' : 'bg-sky-950/20') : ''} ${isLight ? 'hover:bg-slate-50/60 text-slate-800' : 'hover:bg-slate-800/40 text-slate-300'}`}
                    >
                      {/* Selection Checkbox */}
                      <td className={`py-3.5 px-4 text-center border-r border-slate-800/50 ${selectedBrandIds.has(brand.id) ? (isLight ? 'bg-sky-100/30' : 'bg-sky-900/20') : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedBrandIds.has(brand.id)}
                          onChange={() => handleToggleBrandSelect(brand.id)}
                          className={`w-4 h-4 rounded border-slate-700 focus:ring-sky-500 cursor-pointer transition ${isLight ? 'text-sky-600' : 'bg-slate-950 text-sky-600'}`}
                        />
                      </td>
                      {/* Brand Name & Color Identifier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm font-bold text-white text-xs border ${isLight ? 'border-slate-200' : 'border-white/10'} overflow-hidden`}
                            style={{ backgroundColor: brandColor }}
                          >
                            {brand.logo ? (
                              <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-0.5" />
                            ) : (
                              brand.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className={`font-bold text-sm block ${isLight ? 'text-slate-900' : 'text-white'}`}>{brand.name}</span>
                            <span
                              id={`brand-id-${brand.id}`}
                              className={`text-[10px] font-mono block mt-0.5 ${
                                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
                              }`}
                            >
                              ID: <span className={isLight ? 'text-slate-900 font-bold' : 'text-slate-300'}>{brand.id}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Short Code */}
                      <td className="py-3.5 px-4">
                        {brand.shortCode ? (
                          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-950 text-sky-400 border border-slate-700">
                            {brand.shortCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Origin & Website */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {brand.originCountry ? (
                            <div className="flex items-center gap-1 text-slate-300 font-medium">
                              <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{brand.originCountry}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}

                          {brand.website && (
                            <a
                              href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-mono"
                            >
                              <span className="truncate max-w-[140px]">{brand.website.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-300 text-xs line-clamp-2" title={brand.description}>
                          {brand.description || <span className="text-slate-400 italic">No description provided</span>}
                        </p>
                      </td>

                      {/* Linked Products */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigateToInventory('matrix')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 text-indigo-300 border border-indigo-900/40 hover:border-indigo-500 text-[11px] font-bold transition group-hover:bg-slate-800"
                          title="View all products under this brand"
                        >
                          <Boxes className="w-3 h-3 text-indigo-400" />
                          <span>{linkedCount} SKUs</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            brand.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              brand.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span className="capitalize">{brand.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`view-brand-btn-${brand.id}`}
                            onClick={() => setViewingBrand(brand)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="View Brand Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                          {isAdminOrManager && (
                            <>
                              <button
                                id={`edit-brand-btn-${brand.id}`}
                                onClick={() => handleOpenEditModal(brand)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Edit Brand Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`delete-brand-btn-${brand.id}`}
                                onClick={() => handlePromptDelete(brand)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition cursor-pointer"
                                title="Delete Brand"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Light Mode Only - Attached) */}
        {isLight && totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t bg-slate-50/30 ${isLight ? 'border-slate-200/80' : 'border-slate-800'}`}>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{Math.min((currentPage - 1) * pageSize + 1, filteredBrands.length)}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredBrands.length)}</span> of <span className="font-bold text-slate-800">{filteredBrands.length}</span> entries
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
    </div>

      {/* Delete Confirmation & Product Migration Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Brand</h3>
                <p className="text-xs text-slate-400">Confirm registry deletion</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete brand{' '}
                <span className="font-bold text-white">"{brandToDelete.name}"</span> (Code:{' '}
                <span className="font-mono text-sky-400">{brandToDelete.code}</span>)?
              </p>

              {/* Linked products warning */}
              {brandProductCounts[brandToDelete.id] > 0 ? (
                <div className="p-3.5 bg-amber-950/50 border border-amber-800/80 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {brandProductCounts[brandToDelete.id]} Linked Product(s) Detected
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    To maintain catalog integrity, choose a target brand to automatically reassign these products to:
                  </p>

                  <div className="pt-1">
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Reassign Products To:
                    </label>
                    <select
                      id="brand-reassign-target-select"
                      value={reassignTargetId}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                    >
                      <option value="">-- Do not reassign (Block deletion) --</option>
                      {brands
                        .filter((b) => b.id !== brandToDelete.id)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No products are currently linked to this brand. Safe to remove.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBrandToDelete(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    isLight 
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-brand-btn"
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={brandProductCounts[brandToDelete.id] > 0 && !reassignTargetId}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                    brandProductCounts[brandToDelete.id] > 0 && !reassignTargetId
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Brand</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Details View Modal */}
      {viewingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 overflow-hidden p-1 bg-slate-950"
                  style={{
                    borderColor: `${viewingBrand.color || '#6366f1'}60`,
                  }}
                >
                  {viewingBrand.logo ? (
                    <img src={viewingBrand.logo} alt={viewingBrand.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="font-extrabold text-sm" style={{ color: viewingBrand.color || '#6366f1' }}>
                      {viewingBrand.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {viewingBrand.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        viewingBrand.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          viewingBrand.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span className="capitalize">{viewingBrand.status || 'active'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="font-mono text-sky-400 font-semibold">{viewingBrand.code}</span>
                    {viewingBrand.shortCode && (
                      <>
                        <span>•</span>
                        <span>
                          Short Code:{' '}
                          <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                            {viewingBrand.shortCode}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingBrand(null)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className={`p-3.5 border rounded-xl space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Origin</span>
                  <div className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {viewingBrand.originCountry || 'Global / Unspecified'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Country of Origin</div>
                </div>

                <div
                  className={`p-3.5 border rounded-xl space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Products</span>
                  <div className="text-sm font-bold text-sky-400">
                    {viewingBrandProducts.length}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {viewingBrandProducts.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0)} units in stock
                  </div>
                </div>

                <div
                  className={`p-3.5 border rounded-xl space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Accent Theme</span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                      style={{ backgroundColor: viewingBrand.color || '#6366f1' }}
                    />
                    <span className={`font-mono text-xs uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {viewingBrand.color || '#6366f1'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Theme Tint</div>
                </div>

                <div
                  className={`p-3.5 border rounded-xl space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Website</span>
                  <div className="text-sm font-bold truncate">
                    {viewingBrand.website ? (
                      <a
                        href={viewingBrand.website.startsWith('http') ? viewingBrand.website : `https://${viewingBrand.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span className="truncate">{viewingBrand.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-500 font-normal">Not Provided</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Official Portal</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description & Notes</h4>
                <div
                  className={`p-3.5 border rounded-xl text-xs leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  {viewingBrand.description ? (
                    viewingBrand.description
                  ) : (
                    <span className="text-slate-500 italic">No description provided for this brand.</span>
                  )}
                </div>
              </div>

              {/* Linked Products Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Products ({viewingBrandProducts.length})
                  </h4>
                  {viewingBrandProducts.length > 0 && navigateToInventory && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewingBrand(null);
                        navigateToInventory('matrix');
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Open Inventory Catalog</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {viewingBrandProducts.length === 0 ? (
                  <div
                    className={`p-6 border border-dashed rounded-xl text-center ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <Boxes className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No products assigned to this brand yet.</p>
                  </div>
                ) : (
                  <div
                    className={`border rounded-xl overflow-hidden ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950/50 border-slate-800'
                    }`}
                  >
                    <table className="w-full text-left text-xs">
                      <thead
                        className={`border-b ${
                          isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        <tr>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3 text-right">Current Stock</th>
                          <th className="py-2.5 px-3 text-right">Selling Price</th>
                        </tr>
                      </thead>
                      <tbody className={isLight ? 'divide-y divide-slate-200' : 'divide-y divide-slate-800/60'}>
                        {viewingBrandProducts.slice(0, 8).map((prod) => (
                          <tr
                            key={prod.id}
                            className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}`}
                          >
                            <td className={`py-2 px-3 font-medium truncate max-w-[200px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {prod.name}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">{prod.sku || '—'}</td>
                            <td className="py-2 px-3 text-right">
                              <span
                                className={`font-mono font-bold ${
                                  (Number(prod.currentStock) || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              >
                                {prod.currentStock ?? 0}
                              </span>
                            </td>
                            <td className={`py-2 px-3 text-right font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              {formatCurrency(prod.sellingPrice || 0, settings)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {viewingBrandProducts.length > 8 && (
                      <div
                        className={`py-2 px-3 text-center text-[11px] text-slate-400 border-t ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        + {viewingBrandProducts.length - 8} more products
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 border-t flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Brand ID: <span className={isLight ? 'text-slate-900 font-bold' : 'text-slate-300'}>{viewingBrand.id}</span>
              </span>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setViewingBrand(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isLight
                      ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 shadow-slate-900/10'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-slate-800/20'
                  }`}
                >
                  Close
                </button>
                {isAdminOrManager && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingBrand;
                      setViewingBrand(null);
                      handleOpenEditModal(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Brand</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
