import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { Category } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import {
  FolderTree,
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
  Layers,
  ArrowRight,
  Download,
  Info,
  ShieldAlert,
  Tag,
  Laptop,
  Headphones,
  Shirt,
  Coffee,
  Package,
  Sparkles,
  ShoppingBag,
  Cpu,
  Wrench,
  Folder,
  Palette,
  Eye,
  Check,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface CategoryFormData {
  name: string;
  code: string;
  shortCode: string;
  description: string;
  parentId: string;
  color: string;
  icon: string;
  status: 'active' | 'inactive';
}

const initialFormState: CategoryFormData = {
  name: '',
  code: '',
  shortCode: '',
  description: '',
  parentId: '',
  color: '#6366f1',
  icon: 'Folder',
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

const ICON_OPTIONS = [
  { id: 'Folder', label: 'Folder', icon: Folder },
  { id: 'Laptop', label: 'Electronics', icon: Laptop },
  { id: 'Headphones', label: 'Audio/Accessory', icon: Headphones },
  { id: 'Shirt', label: 'Apparel', icon: Shirt },
  { id: 'Coffee', label: 'Food & Beverage', icon: Coffee },
  { id: 'Package', label: 'Packaging/Box', icon: Package },
  { id: 'Layers', label: 'Raw Materials', icon: Layers },
  { id: 'ShoppingBag', label: 'Retail Goods', icon: ShoppingBag },
  { id: 'Cpu', label: 'Hardware/Chips', icon: Cpu },
  { id: 'Wrench', label: 'Tools/Services', icon: Wrench },
  { id: 'Sparkles', label: 'Special/Featured', icon: Sparkles },
  { id: 'Tag', label: 'General Tag', icon: Tag },
];

export const CategoriesView: React.FC = () => {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    currentUser,
    navigateToInventory,
    settings,
  } = useErp();

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'parent_only' | 'sub_only'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (
        p.includes('categories/add') ||
        p.includes('categories/edit') 
      ) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('categories/add') && !window.location.pathname.includes('categories/edit')) {
        window.history.replaceState(null, '', '/inventory/categories/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('categories/add') || window.location.pathname.includes('categories/edit') || window.location.hash.includes('categories/add') || window.location.hash.includes('categories/edit'))) {
        window.history.replaceState(null, '', '/inventory/categories');
      }
    }
  }, [isModalOpen]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());

  const handleToggleCategorySelect = (categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleClearSelection = () => setSelectedCategoryIds(new Set());

  // Deletion modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // Category details modal derived data
  const viewingParentCategory = useMemo(() => {
    if (!viewingCategory || !viewingCategory.parentId) return null;
    return categories.find((c) => c.id === viewingCategory.parentId) || null;
  }, [categories, viewingCategory]);

  const viewingSubcategories = useMemo(() => {
    if (!viewingCategory) return [];
    return categories.filter((c) => c.parentId === viewingCategory.id);
  }, [categories, viewingCategory]);

  const viewingCategoryProducts = useMemo(() => {
    if (!viewingCategory) return [];
    return (products || []).filter(
      (p) => p.category && p.category.toLowerCase() === viewingCategory.name.toLowerCase()
    );
  }, [products, viewingCategory]);

  // Admin / permissions check
  const isAdminOrManager =
    currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'inventory_manager';

  // Parent categories eligible for subcategory selection
  const parentCandidates = useMemo(() => {
    return categories.filter((c) => {
      if (editingCategory && c.id === editingCategory.id) return false;
      // Also prevent picking another subcategory as parent to keep clean 2-level hierarchy
      return !c.parentId;
    });
  }, [categories, editingCategory]);

  // Product counts per category
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      const matchCount = (products || []).filter(
        (p) => p.category && p.category.toLowerCase() === c.name.toLowerCase()
      ).length;
      counts[c.id] = matchCount;
    });
    return counts;
  }, [categories, products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.shortCode && c.shortCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = c.status === 'active';
      if (statusFilter === 'inactive') matchesStatus = c.status === 'inactive';

      let matchesHierarchy = true;
      if (hierarchyFilter === 'parent_only') matchesHierarchy = !c.parentId;
      if (hierarchyFilter === 'sub_only') matchesHierarchy = !!c.parentId;

      return matchesSearch && matchesStatus && matchesHierarchy;
    });
  }, [categories, searchQuery, statusFilter, hierarchyFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, hierarchyFilter, pageSize]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize);

  const paginatedCategories = useMemo(() => {
    if (!isLight) return filteredCategories;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCategories.slice(startIndex, startIndex + pageSize);
  }, [filteredCategories, isLight, currentPage, pageSize]);

  const isAllPageSelected = paginatedCategories.length > 0 && paginatedCategories.every(c => selectedCategoryIds.has(c.id));
  const isSomePageSelected = paginatedCategories.some(c => selectedCategoryIds.has(c.id)) && !isAllPageSelected;

  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      setSelectedCategoryIds(prev => {
        const next = new Set(prev);
        paginatedCategories.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedCategoryIds(prev => {
        const next = new Set(prev);
        paginatedCategories.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  // Icon Upload & Drag-and-Drop state
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const [uploadedCustomIcon, setUploadedCustomIcon] = useState<string | null>(null);
  const iconFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Directly sets the uploaded image without canvas auto-sizing or re-encoding
  const processAndSetIconFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please upload a valid image file (PNG, SVG, JPG, WebP, or ICO).');
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

      setUploadedCustomIcon(dataUrl);
      setFormData((prev) => ({ ...prev, icon: dataUrl }));
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  // Helper to render icon component dynamically (handles both preset Lucide icons and uploaded PNG/image icons)
  const renderCategoryIcon = (iconName?: string, className = 'w-5 h-5') => {
    if (!iconName) {
      return <Folder className={className} />;
    }
    const isCustomImage =
      iconName.startsWith('data:image/') ||
      iconName.startsWith('http://') ||
      iconName.startsWith('https://') ||
      iconName.startsWith('blob:');

    if (isCustomImage) {
      return (
        <img
          src={iconName}
          alt="Category Icon"
          className={`${className} max-w-full max-h-full object-contain inline-block shrink-0`}
          loading="eager"
        />
      );
    }
    const item = ICON_OPTIONS.find((i) => i.id === iconName);
    const IconComp = item ? item.icon : Folder;
    return <IconComp className={className} />;
  };

  // Open modal for Create
  const handleOpenCreateModal = (parentCategory?: Category) => {
    setEditingCategory(null);
    setUploadedCustomIcon(null);
    setFormData({
      name: '',
      code: '',
      shortCode: '',
      description: '',
      parentId: parentCategory ? parentCategory.id : '',
      color: parentCategory ? parentCategory.color || '#6366f1' : '#6366f1',
      icon: parentCategory ? parentCategory.icon || 'Folder' : 'Folder',
      status: 'active',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    const hasCustomIcon = Boolean(
      cat.icon &&
      (cat.icon.startsWith('data:image/') ||
       cat.icon.startsWith('http://') ||
       cat.icon.startsWith('https://') ||
       cat.icon.startsWith('blob:'))
    );
    setUploadedCustomIcon(hasCustomIcon ? cat.icon : null);
    setFormData({
      name: cat.name,
      code: cat.code,
      shortCode: cat.shortCode || '',
      description: cat.description || '',
      parentId: cat.parentId || '',
      color: cat.color || '#6366f1',
      icon: cat.icon || 'Folder',
      status: cat.status || 'active',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Auto-generate code when typing name if code hasn't been manually tailored
  const handleNameChange = (nameVal: string) => {
    setFormData((prev) => {
      const isAutoCode =
        !prev.code ||
        prev.code === `CAT-${prev.name.substring(0, 4).toUpperCase().replace(/\s+/g, '')}`;

      const generatedCode = isAutoCode
        ? `CAT-${nameVal.substring(0, 4).toUpperCase().replace(/\s+/g, '')}`
        : prev.code;

      const generatedShort = !prev.shortCode
        ? nameVal.substring(0, 3).toUpperCase().replace(/\s+/g, '')
        : prev.shortCode;

      return {
        ...prev,
        name: nameVal,
        code: generatedCode,
        shortCode: generatedShort,
      };
    });
  };

  // Save Category (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameClean = formData.name.trim();
    if (!nameClean) {
      setFormError('Category name is required.');
      return;
    }

    const codeClean = (formData.code || `CAT-${nameClean.substring(0, 4).toUpperCase()}`).trim().toUpperCase();

    // Check duplicate name
    const duplicateName = categories.find(
      (c) => c.name.toLowerCase() === nameClean.toLowerCase() && c.id !== editingCategory?.id
    );
    if (duplicateName) {
      setFormError(`A category with the name "${nameClean}" already exists.`);
      return;
    }

    // Check duplicate code
    const duplicateCode = categories.find(
      (c) => c.code.toUpperCase() === codeClean && c.id !== editingCategory?.id
    );
    if (duplicateCode) {
      setFormError(`A category with code "${codeClean}" already exists (${duplicateCode.name}).`);
      return;
    }

    // Find parent category name
    const parent = categories.find((c) => c.id === formData.parentId);

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: nameClean,
        code: codeClean,
        shortCode: formData.shortCode.trim().toUpperCase(),
        description: formData.description.trim(),
        parentId: formData.parentId || undefined,
        parentName: parent ? parent.name : undefined,
        color: formData.color,
        icon: formData.icon,
        status: formData.status,
      });
      setStatusMessage({
        type: 'success',
        text: `Category "${nameClean}" updated successfully.`,
      });
    } else {
      addCategory({
        name: nameClean,
        code: codeClean,
        shortCode: formData.shortCode.trim().toUpperCase(),
        description: formData.description.trim(),
        parentId: formData.parentId || undefined,
        parentName: parent ? parent.name : undefined,
        color: formData.color,
        icon: formData.icon,
        status: formData.status,
      });
      setStatusMessage({
        type: 'success',
        text: `Category "${nameClean}" added to product catalog.`,
      });
    }

    setIsModalOpen(false);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Trigger Delete confirmation
  const handleOpenDeleteModal = (cat: Category) => {
    setCategoryToDelete(cat);
    // Find a fallback candidate for reassigning products
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setReassignTargetId(otherCats[0]?.id || '');
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;

    const result = deleteCategory(
      categoryToDelete.id,
      reassignTargetId || undefined
    );

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message || `Category "${categoryToDelete.name}" deleted.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message || 'Could not delete category.',
      });
    }

    setCategoryToDelete(null);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // KPI calculations
  const totalCategoriesCount = categories.length;
  const activeCategoriesCount = categories.filter((c) => c.status === 'active').length;
  const subCategoriesCount = categories.filter((c) => !!c.parentId).length;
  const categorizedProductsCount = useMemo(() => {
    const catNames = new Set(categories.map((c) => c.name.toLowerCase()));
    return (products || []).filter((p) => p.category && catNames.has(p.category.toLowerCase())).length;
  }, [categories, products]);

  if (isModalOpen) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Top Navigation & Breadcrumb Header */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
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
              <span>Back to Categories List</span>
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Products & Inventory</span>
                <span>/</span>
                <span>Categories</span>
                <span>/</span>
                <span className="text-sky-500 font-semibold">{editingCategory ? 'Edit Category' : 'Add New Category'}</span>
              </div>
              <h1 className={`text-xl font-bold mt-0.5 flex items-center gap-2 ${isLight ? 'text-slate-200' : 'text-white'}`}>
                <FolderTree className="w-5 h-5 text-sky-400" />
                <span>{editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Category'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                isLight 
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 shadow-slate-900/10' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-slate-800/20'
              }`}
            >
              Cancel
            </button>
            <button
              id="category-form-submit-btn"
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </div>

        {/* Full Page Form Grid */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 8 cols: Category Details */}
          <div className="lg:col-span-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Category Identity & Hierarchy Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure taxonomy names, SKU code prefixes, parent hierarchy levels, and description.
              </p>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Category Name & Short Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Electronics, Footwear, Bakery"
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 transition font-medium placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short Code (Slug)
                </label>
                <input
                  type="text"
                  value={formData.shortCode}
                  onChange={(e) => setFormData({ ...formData, shortCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. ELEC, APP"
                  className="w-full bg-slate-950 text-amber-400 font-mono px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Category Code & Parent Hierarchy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Code / SKU Prefix <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CAT-ELEC, CAT-APP"
                  className="w-full bg-slate-950 text-slate-200 font-mono px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Unique reference code in ERP database.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Parent Category (Hierarchy)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="">None (Primary Level Category)</option>
                  {parentCandidates.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Select to create a nested subcategory.</p>
              </div>
            </div>

            {/* Category Vector Icon & Custom Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Category Vector Icon
                </label>
                <span className="text-[11px] text-slate-400">
                  Select a preset icon or upload custom icon/PNG
                </span>
              </div>

              {/* Preset Vector Icons Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-7 gap-2">
                {ICON_OPTIONS.map((item) => {
                  const isSelected = formData.icon === item.id;
                  const ItemIcon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFormData({ ...formData, icon: item.id })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1.5 text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <ItemIcon className="w-5 h-5" />
                      <span className="text-[10px] truncate max-w-full">{item.label.split('/')[0]}</span>
                    </button>
                  );
                })}

                {/* Custom Uploaded Icon Tile inside the grid - visible and clickable just like other default icons */}
                {uploadedCustomIcon ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: uploadedCustomIcon })}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1.5 text-xs transition cursor-pointer ${
                      formData.icon === uploadedCustomIcon
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    title="Select your uploaded custom icon"
                  >
                    <div className="w-5 h-5 flex items-center justify-center overflow-hidden">
                      <img
                        src={uploadedCustomIcon}
                        alt="Custom Icon"
                        className="w-5 h-5 max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] truncate max-w-full font-semibold text-amber-400">Custom Icon</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => iconFileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-slate-950/80 hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 flex flex-col items-center justify-center space-y-1.5 text-xs transition cursor-pointer group"
                    title="Upload custom PNG or icon"
                  >
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition" />
                    <span className="text-[10px] truncate max-w-full font-medium group-hover:text-amber-300">Upload Icon</span>
                  </button>
                )}
              </div>

              {/* Upload Custom Icon / PNG Provision */}
              <div className="pt-2">
                <input
                  ref={iconFileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processAndSetIconFile(file);
                    }
                    e.target.value = '';
                  }}
                />

                {formData.icon && (formData.icon.startsWith('data:image/') || formData.icon.startsWith('http') || formData.icon.startsWith('blob:')) ? (
                  /* Active Custom Uploaded Icon Card */
                  <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-4">
                      {/* Uploaded Icon Preview */}
                      <div
                        className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-2xl flex items-center justify-center border-2 shadow-md shrink-0 overflow-hidden p-1.5 bg-slate-900"
                        style={{
                          backgroundColor: `${formData.color}25`,
                          borderColor: `${formData.color}80`,
                        }}
                      >
                        <img
                          src={formData.icon}
                          alt="Custom Category Icon"
                          className="w-full h-full max-w-[64px] max-h-[64px] object-contain drop-shadow-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">Custom Uploaded Icon</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Custom icon loaded directly without auto-sizing.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => iconFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change Icon</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, icon: 'Folder' });
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/60 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reset to Vector</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Upload Dropzone Provision */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingIcon(true);
                    }}
                    onDragLeave={() => setIsDraggingIcon(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingIcon(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processAndSetIconFile(file);
                      }
                    }}
                    onClick={() => iconFileInputRef.current?.click()}
                    className={`p-4 rounded-xl border-2 border-dashed transition flex items-center justify-between gap-3 cursor-pointer group ${
                      isDraggingIcon
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-amber-500/15 text-slate-400 group-hover:text-amber-400 border border-slate-700 group-hover:border-amber-500/30 flex items-center justify-center shrink-0 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition flex items-center gap-2">
                          <span>Upload Custom Icon or PNG Image</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Drag and drop or click to upload PNG, SVG, or image file.
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-amber-500/20 text-slate-300 group-hover:text-amber-300 text-[11px] font-bold border border-slate-700 group-hover:border-amber-500/30 shrink-0 transition">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>PNG / SVG / JPG</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description / Internal Notes
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of product types, merchandising group, or storage guidelines..."
                className="w-full bg-slate-950 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500 resize-none"
              />
            </div>
          </div>

          {/* Right 4 cols: Color Accent & Status & Preview */}
          <div className="lg:col-span-4 space-y-6">
            {/* Color Tag Accent Picker */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Category Tag Accent Color</span>
              </h4>
              <div className="grid grid-cols-4 gap-2.5">
                {COLOR_OPTIONS.map((col) => {
                  const isSelected = formData.color === col.value;
                  return (
                    <button
                      type="button"
                      key={col.value}
                      onClick={() => setFormData({ ...formData, color: col.value })}
                      className={`h-9 rounded-xl flex items-center justify-center border transition-all ${
                        col.bgClass
                      } ${
                        isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 border-white scale-105 shadow-md'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={col.label}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Selection */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-3.5 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <h4 className={`font-bold text-xs border-b pb-2 ${
                isLight ? 'text-slate-800 border-slate-200' : 'text-white border-slate-800'
              }`}>
                Category Status
              </h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
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
                    <span>Active (Available in Catalog & POS)</span>
                  </div>
                  {formData.status === 'active' && <Check className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'inactive' })}
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

            {/* Live UI Preview Card */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Live Catalog Badge Preview</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h4>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-2xl flex items-center justify-center border shadow-md shrink-0 overflow-hidden p-1.5"
                    style={{
                      backgroundColor: `${formData.color}20`,
                      borderColor: `${formData.color}40`,
                      color: formData.color,
                    }}
                  >
                    {renderCategoryIcon(formData.icon, 'w-10 h-10')}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-bold text-white text-sm truncate">
                      {formData.name || 'Category Name'}
                    </div>
                    <div className="font-mono text-[10px] text-amber-400">
                      {formData.code || 'CAT-CODE'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Category Icon Badge
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold border shrink-0"
                    style={{
                      backgroundColor: `${formData.color}15`,
                      color: formData.color,
                      borderColor: `${formData.color}30`,
                    }}
                  >
                    {formData.shortCode || 'CAT'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Header Card */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors duration-300 shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <FolderTree className="w-5 h-5 text-indigo-500" />
            <span>Categories</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage product classification hierarchies, short codes, and nested sub-categories.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportButtons
            headers={['Category Name', 'Code', 'Short Code', 'Parent Category', 'Status', 'Product Count', 'Description']}
            keys={['name', 'code', 'shortCode', 'parentName', 'status', 'productCount', 'description']}
            data={(selectedCategoryIds.size > 0 ? categories.filter(c => selectedCategoryIds.has(c.id)) : categories).map(c => ({
              name: c.name,
              code: c.code,
              shortCode: c.shortCode || '',
              parentName: c.parentName || 'None (Primary)',
              status: c.status,
              productCount: categoryProductCounts[c.id] || 0,
              description: c.description || ''
            }))}
            filename="categories"
            title="Categories Export"
            isLight={isLight}
          />
          {isAdminOrManager && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification Banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border animate-in fade-in slide-in-from-top duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium text-sm">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-4.5 flex items-center justify-between shadow-sm transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Categories</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalCategoriesCount}</span>
              <span className="text-xs text-slate-400">({activeCategoriesCount} Active)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FolderTree className="w-6 h-6" />
          </div>
        </div>

        <div className={`border rounded-2xl p-4.5 flex items-center justify-between shadow-sm transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sub-Categories</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-indigo-400 font-mono">{subCategoriesCount}</span>
              <span className="text-xs text-slate-400">Nested</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className={`border rounded-2xl p-4.5 flex items-center justify-between shadow-sm transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Linked Products</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-indigo-400 font-mono">{categorizedProductsCount}</span>
              <span className="text-xs text-slate-400">of {(products || []).length} SKUs</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className={`border rounded-2xl p-4.5 flex items-center justify-between shadow-sm transition-colors duration-300 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taxonomy Status</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-base font-bold text-sky-400">Standardized</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Top Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/80 backdrop-blur-sm">
          {/* Left search & filter controls */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category name, code, short code..."
                className="w-full bg-slate-950 text-slate-200 pl-10 pr-4 py-2 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bulk Action Bar beside Search */}
            {selectedCategoryIds.size > 0 && (
              <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl animate-fadeIn whitespace-nowrap border bg-sky-950/40 border-sky-500/20">
                <div className="flex items-center gap-2 mr-2">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                    {selectedCategoryIds.size}
                  </span>
                  <span className="text-[10px] font-bold hidden md:inline text-white">
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-1">
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

            {/* Status Filter */}
            {isLight && (
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-950 text-slate-300 text-sm px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 text-slate-300 text-sm px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Hierarchy Filter */}
            <select
              value={hierarchyFilter}
              onChange={(e) => setHierarchyFilter(e.target.value as any)}
              className="bg-slate-950 text-slate-300 text-sm px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Hierarchy</option>
              <option value="parent_only">Primary Categories</option>
              <option value="sub_only">Sub-Categories</option>
            </select>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {isAdminOrManager && (
              <button
                id="categories-add-new-btn"
                onClick={() => handleOpenCreateModal()}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4 text-center border-r border-slate-800/50 w-10">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomePageSelected;
                    }}
                    onChange={handleToggleSelectPage}
                    className="w-4 h-4 rounded border-slate-700 focus:ring-sky-500 cursor-pointer transition bg-slate-950 text-sky-600"
                  />
                </th>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-3">Code / ID</th>
                <th className="py-3.5 px-3">Short Code</th>
                <th className="py-3.5 px-3">Hierarchy / Parent</th>
                <th className="py-3.5 px-3 text-center">Assigned Products</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FolderTree className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                      <p className="font-semibold text-slate-400">No categories found</p>
                      <p className="text-xs text-slate-500 max-w-xs">
                        {searchQuery
                          ? 'Try adjusting your search query or filters.'
                          : 'Create your first product category to organize inventory and POS catalog.'}
                      </p>
                      {isAdminOrManager && !searchQuery && (
                        <button
                          onClick={() => handleOpenCreateModal()}
                          className="mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Category</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => {
                  const productCount = categoryProductCounts[cat.id] || 0;
                  const isSub = !!cat.parentId;

                  return (
                    <tr
                      key={cat.id}
                      className={`transition duration-150 group ${selectedCategoryIds.has(cat.id) ? 'bg-sky-950/20' : 'hover:bg-slate-850'}`}
                    >
                      {/* Selection Checkbox */}
                      <td className={`py-3.5 px-4 text-center border-r border-slate-800/50 ${selectedCategoryIds.has(cat.id) ? 'bg-sky-900/20' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.has(cat.id)}
                          onChange={() => handleToggleCategorySelect(cat.id)}
                          className="w-4 h-4 rounded border-slate-700 focus:ring-sky-500 cursor-pointer transition bg-slate-950 text-sky-600"
                        />
                      </td>
                      {/* Name & Color & Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden p-1"
                            style={{
                              backgroundColor: `${cat.color || '#6366f1'}20`,
                              borderColor: `${cat.color || '#6366f1'}40`,
                              color: cat.color || '#6366f1',
                            }}
                          >
                            {renderCategoryIcon(cat.icon, 'w-5 h-5')}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white group-hover:text-amber-300 transition">
                                {cat.name}
                              </span>
                              {isSub && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                                  Sub
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 max-w-md">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {cat.code}
                        </span>
                      </td>

                      {/* Short Code */}
                      <td className="py-3.5 px-3">
                        {cat.shortCode ? (
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {cat.shortCode}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Parent / Hierarchy */}
                      <td className="py-3.5 px-3">
                        {cat.parentName ? (
                          <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                            <span className="text-slate-400">{cat.parentName}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="font-medium text-indigo-300">{cat.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                            Primary
                          </span>
                        )}
                      </td>

                      {/* Product Count */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                            productCount > 0
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          <Boxes className="w-3 h-3 mr-1 text-slate-400" />
                          {productCount} {productCount === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          disabled={!isAdminOrManager}
                          onClick={() => {
                            if (!isAdminOrManager) return;
                            updateCategory(cat.id, {
                              status: cat.status === 'active' ? 'inactive' : 'active',
                            });
                          }}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition ${
                            cat.status === 'active'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.status === 'active' ? 'bg-indigo-400' : 'bg-slate-500'
                            }`}
                          />
                          <span className="capitalize">{cat.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Category Details */}
                          <button
                            onClick={() => setViewingCategory(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                            title="View Category Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            disabled={!isAdminOrManager}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition disabled:opacity-30"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleOpenDeleteModal(cat)}
                            disabled={!isAdminOrManager}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition disabled:opacity-30"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="p-3.5 bg-slate-950/40 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Categories structure your inventory classification, POS quick filters, sales tax logic, and departmental reports.
            </span>
          </div>
          <div className="text-slate-400 font-mono shrink-0">
            Showing {filteredCategories.length} of {categories.length} categories
          </div>
        </div>
      </div>

      {/* Pagination Footer (Light Mode Only) */}
      {isLight && totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border border-slate-800 rounded-2xl shadow-sm mt-4">
          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredCategories.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredCategories.length)}</span> of <span className="font-bold text-white">{filteredCategories.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-semibold text-slate-300">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Category?</h3>
                <p className="text-xs text-slate-400">Confirm permanent removal from catalog</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-sm text-slate-300 space-y-2">
              <p>
                Are you sure you want to delete category{' '}
                <strong className="text-white">"{categoryToDelete.name}"</strong> (
                <span className="font-mono text-amber-400">{categoryToDelete.code}</span>)?
              </p>

              {/* Check if products belong to this category */}
              {(categoryProductCounts[categoryToDelete.id] || 0) > 0 && (
                <div className="mt-3 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {categoryProductCounts[categoryToDelete.id]} product(s) are currently in this category.
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Select a target category to safely reassign those products to:
                  </p>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Do not reassign (Cancel deletion if products exist)</option>
                    {categories
                      .filter((c) => c.id !== categoryToDelete.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          Reassign to: {c.name} ({c.code})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  isLight 
                    ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/20 transition transform active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY DETAILS MODAL */}
      {viewingCategory && (
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
                  className="w-13 h-13 rounded-2xl flex items-center justify-center border-2 shadow-md shrink-0 overflow-hidden p-1.5"
                  style={{
                    backgroundColor: `${viewingCategory.color || '#6366f1'}20`,
                    borderColor: `${viewingCategory.color || '#6366f1'}60`,
                  }}
                >
                  {renderCategoryIcon(viewingCategory.icon, 'w-8 h-8')}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {viewingCategory.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        viewingCategory.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          viewingCategory.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      <span className="capitalize">{viewingCategory.status || 'active'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="font-mono text-amber-400 font-semibold">{viewingCategory.code}</span>
                    {viewingCategory.shortCode && (
                      <>
                        <span>•</span>
                        <span>
                          Short Code:{' '}
                          <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                            {viewingCategory.shortCode}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingCategory(null)}
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
              {/* Stat / Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className={`p-3.5 border rounded-xl space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Hierarchy</span>
                  <div className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {viewingParentCategory ? (
                      <span className="text-indigo-400">Subcategory</span>
                    ) : (
                      <span>Primary Parent</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {viewingParentCategory ? `Parent: ${viewingParentCategory.name}` : `${viewingSubcategories.length} subcategories`}
                  </div>
                </div>

                <div
                  className={`p-3.5 border rounded-xl space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Products</span>
                  <div className="text-sm font-bold text-emerald-400">
                    {viewingCategoryProducts.length}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {viewingCategoryProducts.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0)} units in stock
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
                      style={{ backgroundColor: viewingCategory.color || '#6366f1' }}
                    />
                    <span className={`font-mono text-xs uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {viewingCategory.color || '#6366f1'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Theme Tint</div>
                </div>

                <div
                  className={`p-3.5 border rounded-xl space-y-1 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Icon Type</span>
                  <div className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {viewingCategory.icon &&
                    (viewingCategory.icon.startsWith('data:image/') || viewingCategory.icon.startsWith('http'))
                      ? 'Custom Upload'
                      : viewingCategory.icon || 'Vector Icon'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Badge / POS View</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                <div
                  className={`p-3.5 border rounded-xl text-xs leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  {viewingCategory.description ? (
                    viewingCategory.description
                  ) : (
                    <span className="text-slate-500 italic">No description provided for this category.</span>
                  )}
                </div>
              </div>

              {/* Subcategories (if any) */}
              {viewingSubcategories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Subcategories ({viewingSubcategories.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingSubcategories.map((sub) => {
                      const subProdCount = (products || []).filter(
                        (p) => p.category && p.category.toLowerCase() === sub.name.toLowerCase()
                      ).length;
                      return (
                        <div
                          key={sub.id}
                          className={`p-2.5 border rounded-xl flex items-center justify-between transition cursor-pointer hover:border-indigo-500/50 ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900'
                          }`}
                          onClick={() => setViewingCategory(sub)}
                          title="Click to view this subcategory"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden p-0.5"
                              style={{
                                backgroundColor: `${sub.color || '#6366f1'}20`,
                                borderColor: `${sub.color || '#6366f1'}40`,
                              }}
                            >
                              {renderCategoryIcon(sub.icon, 'w-4 h-4')}
                            </div>
                            <div className="truncate">
                              <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {sub.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">{sub.code}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${
                              isLight
                                ? 'bg-white border-slate-200 text-slate-600'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {subProdCount} {subProdCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Linked Products Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Products ({viewingCategoryProducts.length})
                  </h4>
                  {viewingCategoryProducts.length > 0 && navigateToInventory && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewingCategory(null);
                        navigateToInventory('matrix');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Open Inventory Catalog</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {viewingCategoryProducts.length === 0 ? (
                  <div
                    className={`p-6 border border-dashed rounded-xl text-center ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <Boxes className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No products assigned to this category yet.</p>
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
                        {viewingCategoryProducts.slice(0, 8).map((prod) => (
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
                    {viewingCategoryProducts.length > 8 && (
                      <div
                        className={`py-2 px-3 text-center text-[11px] text-slate-400 border-t ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        + {viewingCategoryProducts.length - 8} more products
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
              <span className="text-[11px] text-slate-400 font-mono">
                Category ID: {viewingCategory.id}
              </span>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setViewingCategory(null)}
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
                      const target = viewingCategory;
                      setViewingCategory(null);
                      handleOpenEditModal(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Category</span>
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
