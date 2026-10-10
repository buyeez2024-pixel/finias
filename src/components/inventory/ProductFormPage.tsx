import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { optimizeImage } from '../../lib/imageOptimization';
import { formatCurrency } from '../../utils/formatters';
import { validateProductData } from '../../utils/validation';
import { FormFieldError } from '../common/FormFieldError';
import { Product, ProductLot } from '../../types/erp';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import {
  Package,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Calculator,
  Layers,
  Barcode,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Boxes,
  Building2,
  Image as ImageIcon,
  Tag,
  Scale,
  Percent,
  TrendingUp,
  Save,
  Plus,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Printer,
  Info,
  Sliders,
  PackageCheck,
  Trash2,
  ChevronDown,
  UploadCloud,
  Pencil,
  Search,
  Lock,
  Filter,
  CheckSquare,
  Square,
  Minus,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

interface ProductFormPageProps {
  productToEdit?: Product | null;
  onBack: () => void;
  onSaved?: (product: Product, isNew: boolean) => void;
  isModal?: boolean;
}

const PRESET_CATEGORIES = [
  'Electronics',
  'Accessories',
  'Audio & Sound',
  'Smart Wearables',
  'Computers & IT',
  'Grocery & Food',
  'Apparel & Fashion',
  'Beverages',
  'Hardware & Tools',
];

const PRESET_BRANDS = [
  'Apex Tech',
  'Apple',
  'Sony',
  'Samsung',
  'Logitech',
  'Bose',
  'Royal Enterprise',
  'Dell',
  'Nike',
];

export const ProductFormPage: React.FC<ProductFormPageProps> = ({
  productToEdit,
  onBack,
  onSaved,
  isModal = false,
}) => {
  const {
    products,
    locations = [],
    selectedLocationId,
    currentUser,
    racks = [],
    addProduct,
    updateProduct,
    addUnit,
    addCategory,
    addBrand,
    addWarranty,
    settings,
    taxGroups,
    units,
    categories: erpCategories,
    brands: erpBrands,
    warranties,
    variationTemplates = [],
    addVariationTemplate,
    showFlashNotification,
    openBarcodeStudio,
    setInventorySubTab,
  } = useErp();

  const isEditMode = !!productToEdit;
  const isLight = settings.themeMode === 'light';

  const currentBusinessName = (currentUser?.businessName || settings?.businessName || settings?.name || '').trim().toLowerCase();
  const currentBusinessId = currentUser?.businessId;

  const availableLocations = useMemo(() => {
    const scoped = (locations || []).filter((l) => {
      if (currentBusinessId && l.businessId) return l.businessId === currentBusinessId;
      if (currentBusinessName && l.businessName) return l.businessName.trim().toLowerCase() === currentBusinessName;
      return true;
    });
    return scoped.length > 0 ? scoped : locations || [];
  }, [locations, currentBusinessName, currentBusinessId]);

  // Form Fields State
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(() => {
    if (productToEdit?.locationIds && Array.isArray(productToEdit.locationIds) && productToEdit.locationIds.length > 0) {
      return productToEdit.locationIds;
    }
    if (productToEdit?.branchIds && Array.isArray(productToEdit.branchIds) && productToEdit.branchIds.length > 0) {
      return productToEdit.branchIds;
    }
    if (productToEdit?.locationId) {
      return [productToEdit.locationId];
    }
    if (productToEdit?.branchId) {
      return [productToEdit.branchId];
    }
    if (selectedLocationId) {
      return [selectedLocationId];
    }
    return availableLocations.map((l) => l.id);
  });
  const [branchSearchTerm, setBranchSearchTerm] = useState('');
  const [productType, setProductType] = useState<'single' | 'variable' | 'combo'>(
    productToEdit?.type || 'single'
  );
  const [name, setName] = useState(productToEdit?.name || '');
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [barcode, setBarcode] = useState(productToEdit?.barcode || '');
  const [hsnCode, setHsnCode] = useState(productToEdit?.hsnCode || '');
  const [rack, setRack] = useState(productToEdit?.rack || '');
  const [row, setRow] = useState(productToEdit?.row || '');
  const [position, setPosition] = useState(productToEdit?.position || '');
  const [taxGroupId, setTaxGroupId] = useState(
    productToEdit?.taxGroupId || ''
  );
  const [taxType, setTaxType] = useState<'exclusive' | 'inclusive' | 'exempt'>(
    productToEdit?.taxType || settings.taxCalculationType || 'exclusive'
  );
  const [category, setCategory] = useState(productToEdit?.category || '');
  const [subCategory, setSubCategory] = useState(productToEdit?.subCategory || '');
  const [brand, setBrand] = useState(productToEdit?.brand || '');
  const [warrantyId, setWarrantyId] = useState(productToEdit?.warrantyId || '');
  const [expiryPeriod, setExpiryPeriod] = useState<string>(
    productToEdit?.expiryPeriod !== undefined ? String(productToEdit.expiryPeriod) : ''
  );
  const [expiryPeriodType, setExpiryPeriodType] = useState<'Months' | 'Days' | 'Not Applicable'>(
    productToEdit?.expiryPeriodType || 'Months'
  );
  const [unit, setUnit] = useState(productToEdit?.unit || '');
  const [costPrice, setCostPrice] = useState(productToEdit?.costPrice?.toString() || '');
  const [sellingPrice, setSellingPrice] = useState(productToEdit?.sellingPrice?.toString() || '');
  const [marginInput, setMarginInput] = useState(() => {
    if (productToEdit) {
      const initCost = productToEdit.costPrice || 0;
      const initSelling = productToEdit.sellingPrice || 0;
      return initSelling > 0 ? (((initSelling - initCost) / initSelling) * 100).toFixed(1) : (settings.defaultProfitPercent?.toString() || '25');
    }
    return settings.defaultProfitPercent?.toString() || '25';
  });
  const [taxRate, setTaxRate] = useState(
    productToEdit?.taxRate?.toString() ||
      (taxGroups?.find((g) => g.id === (productToEdit?.taxGroupId || settings.defaultTaxGroupId))
        ?.totalRate?.toString() || '')
  );
  const [alertQuantity, setAlertQuantity] = useState(
    productToEdit?.alertQuantity?.toString() || ''
  );
  const [image, setImage] = useState(productToEdit?.image || '');
  const [lots, setLots] = useState<ProductLot[]>(() => {
    if (productToEdit?.lots && Array.isArray(productToEdit.lots) && productToEdit.lots.length > 0) {
      return productToEdit.lots;
    }
    if (productToEdit) {
      const stockVal = Number(productToEdit.currentStock ?? productToEdit.stock) || 0;
      return [
        {
          id: `lot_init_${productToEdit.id}`,
          lotNumber: productToEdit.lotNumber || `LOT-${new Date().getFullYear()}-001`,
          costPrice: Number(productToEdit.costPrice) || 0,
          sellingPrice: Number(productToEdit.sellingPrice) || 0,
          initialStock: stockVal,
          currentStock: stockVal,
          createdDate: productToEdit.createdAt ? String(productToEdit.createdAt).split('T')[0] : new Date().toISOString().slice(0, 10),
          source: (productToEdit as any).source || 'opening_stock',
        }
      ];
    }
    return [];
  });
  const [lotNumber, setLotNumber] = useState(
    productToEdit ? (lots.length > 0 ? lots[lots.length - 1].lotNumber : (productToEdit.lotNumber || `LOT-${new Date().getFullYear()}-001`)) : ''
  );
  const [initialLotStock, setInitialLotStock] = useState(() => {
    if (productToEdit) {
      const stockVal = Number(productToEdit.currentStock ?? productToEdit.stock) || 0;
      return String(stockVal);
    }
    return '';
  });
  const [description, setDescription] = useState(productToEdit?.description || '');

  // File Upload State & Handlers for Product Media
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    try {
      const optimizedImage = await optimizeImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        type: 'image/webp'
      });
      setImage(optimizedImage);
    } catch (error) {
      console.error('Image optimization failed:', error);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Variable Product state
  const [variationSkuFormat, setVariationSkuFormat] = useState<'sku_number' | 'sku_variation'>('sku_number');
  const [selectedVariationName, setSelectedVariationName] = useState<string>('Phase Type');
  const [selectedVariationValues, setSelectedVariationValues] = useState<string[]>(['Single Phase', 'Three Phase', 'two phase']);
  const [newValueInput, setNewValueInput] = useState<string>('');
  const [variationCostsExc, setVariationCostsExc] = useState<Record<string, string>>({ 'Single Phase': '100', 'Three Phase': '180', 'two phase': '160' });
  const [variationMargins, setVariationMargins] = useState<Record<string, string>>({ 'Single Phase': '25', 'Three Phase': '25', 'two phase': '25' });
  const [variationOpeningStocks, setVariationOpeningStocks] = useState<Record<string, string>>({ 'Single Phase': '5', 'Three Phase': '5', 'two phase': '5' });
  const [variationAlertQuantities, setVariationAlertQuantities] = useState<Record<string, string>>({ 'Single Phase': '2', 'Three Phase': '2', 'two phase': '5' });
  const [variationSkus, setVariationSkus] = useState<Record<string, string>>({});
  const [variationImages, setVariationImages] = useState<Record<string, string>>({});
  const [attributes, setAttributes] = useState<import('../../types/erp').ProductAttribute[]>(
    productToEdit?.attributes || [
      { id: 'attr_1', name: 'Phase Type', values: ['Single Phase', 'Three Phase', 'two phase'] },
    ]
  );
  const [variations, setVariations] = useState<import('../../types/erp').ProductVariation[]>(
    productToEdit?.variations || []
  );

  // Temp state for adding new attribute
  const [attrNameInput, setAttrNameInput] = useState('');
  const [attrValuesInput, setAttrValuesInput] = useState('');

  // Combo / Bundle Product state
  const [comboItems, setComboItems] = useState<import('../../types/erp').ComboItem[]>(
    productToEdit?.comboItems || []
  );
  const [selectedComboProductId, setSelectedComboProductId] = useState('');
  const [comboSearchQuery, setComboSearchQuery] = useState('');
  const [isComboSearchFocused, setIsComboSearchFocused] = useState(false);
  const [isComboAdvancedSearchOpen, setIsComboAdvancedSearchOpen] = useState(false);
  const [comboFilterCategory, setComboFilterCategory] = useState('all');
  const [comboFilterBrand, setComboFilterBrand] = useState('all');
  const [comboFilterStockStatus, setComboFilterStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [modalSelectedProductIds, setModalSelectedProductIds] = useState<string[]>([]);
  const [modalProductQuantities, setModalProductQuantities] = useState<Record<string, number>>({});

  // Multi-location stock allocation
  const [locationStocks, setLocationStocks] = useState<Record<string, number>>(() => {
    const stockVal = Number(productToEdit?.currentStock ?? productToEdit?.stock) || 0;
    const initial: Record<string, number> = {};
    const availableLocs = locations && locations.length > 0 ? locations : [{ id: 'loc_main' } as any];
    
    if (productToEdit?.locationStocks && typeof productToEdit.locationStocks === 'object' && Object.keys(productToEdit.locationStocks).length > 0) {
      Object.entries(productToEdit.locationStocks).forEach(([k, v]) => {
        initial[k] = Number(v) || 0;
      });
      availableLocs.forEach((loc) => {
        if (initial[loc.id] === undefined) {
          initial[loc.id] = initial['loc_1'] !== undefined ? initial['loc_1'] : stockVal;
        }
      });
      return initial;
    }

    availableLocs.forEach((loc) => {
      initial[loc.id] = stockVal;
    });
    return initial;
  });

  // UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLot, setEditingLot] = useState<ProductLot | null>(null);
  const [editingLotStock, setEditingLotStock] = useState<string>('');

  // Quick Add Modal States & Handlers (Unit, Category, Brand, Warranty)
  // 1. Quick Add Unit
  const [isQuickUnitModalOpen, setIsQuickUnitModalOpen] = useState(false);
  const [quickUnitName, setQuickUnitName] = useState('');
  const [quickUnitShortName, setQuickUnitShortName] = useState('');
  const [quickUnitAllowDecimal, setQuickUnitAllowDecimal] = useState(false);
  const [quickUnitError, setQuickUnitError] = useState<string | null>(null);

  const handleOpenQuickUnitModal = () => {
    setQuickUnitName('');
    setQuickUnitShortName('');
    setQuickUnitAllowDecimal(false);
    setQuickUnitError(null);
    setIsQuickUnitModalOpen(true);
  };

  const handleSaveQuickUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = quickUnitName.trim();
    const trimmedShort = quickUnitShortName.trim();
    if (!trimmedName || !trimmedShort) {
      setQuickUnitError('Please provide both Unit Name and Short Symbol.');
      return;
    }
    const isDuplicate = units.some(
      (u) => u.shortName.toLowerCase() === trimmedShort.toLowerCase() || u.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setQuickUnitError(`Unit "${trimmedShort}" already exists.`);
      return;
    }
    const newUnit = addUnit({
      name: trimmedName,
      shortName: trimmedShort,
      allowDecimal: quickUnitAllowDecimal,
    });
    setUnit(newUnit.shortName);
    if (fieldErrors.unit) setFieldErrors((prev) => ({ ...prev, unit: '' }));
    setIsQuickUnitModalOpen(false);
    setToastMessage(`Unit "${newUnit.name} (${newUnit.shortName})" created and selected!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 2. Quick Add Category
  const [isQuickCategoryModalOpen, setIsQuickCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [quickCategoryCode, setQuickCategoryCode] = useState('');
  const [quickCategoryParentId, setQuickCategoryParentId] = useState('');
  const [quickCategoryDescription, setQuickCategoryDescription] = useState('');
  const [quickCategoryError, setQuickCategoryError] = useState<string | null>(null);

  const handleOpenQuickCategoryModal = (presetParentId?: string) => {
    setQuickCategoryName('');
    setQuickCategoryCode('');
    setQuickCategoryParentId(presetParentId || '');
    setQuickCategoryDescription('');
    setQuickCategoryError(null);
    setIsQuickCategoryModalOpen(true);
  };

  const handleSaveQuickCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = quickCategoryName.trim();
    if (!trimmedName) {
      setQuickCategoryError('Please enter a Category Name.');
      return;
    }
    const codeToUse = quickCategoryCode.trim() || `CAT-${trimmedName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'GEN'}`;
    const isDuplicate = (erpCategories || []).some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setQuickCategoryError(`Category "${trimmedName}" already exists.`);
      return;
    }
    const newCat = addCategory({
      name: trimmedName,
      code: codeToUse,
      parentId: quickCategoryParentId || undefined,
      description: quickCategoryDescription.trim(),
      status: 'active',
    });
    if (quickCategoryParentId) {
      setSubCategory(newCat.name);
    } else {
      setCategory(newCat.name);
      setSubCategory('');
    }
    setIsQuickCategoryModalOpen(false);
    setToastMessage(`Category "${newCat.name}" created and selected!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 3. Quick Add Brand
  const [isQuickBrandModalOpen, setIsQuickBrandModalOpen] = useState(false);
  const [quickBrandName, setQuickBrandName] = useState('');
  const [quickBrandCode, setQuickBrandCode] = useState('');
  const [quickBrandShortCode, setQuickBrandShortCode] = useState('');
  const [quickBrandOriginCountry, setQuickBrandOriginCountry] = useState('');
  const [quickBrandWebsite, setQuickBrandWebsite] = useState('');
  const [quickBrandError, setQuickBrandError] = useState<string | null>(null);

  const handleOpenQuickBrandModal = () => {
    setQuickBrandName('');
    setQuickBrandCode('');
    setQuickBrandShortCode('');
    setQuickBrandOriginCountry('');
    setQuickBrandWebsite('');
    setQuickBrandError(null);
    setIsQuickBrandModalOpen(true);
  };

  const handleSaveQuickBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = quickBrandName.trim();
    if (!trimmedName) {
      setQuickBrandError('Please enter a Brand Name.');
      return;
    }
    const codeToUse = quickBrandCode.trim() || `BRD-${trimmedName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'GEN'}`;
    const isDuplicate = (erpBrands || []).some(
      (b) => (b.name || '').toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setQuickBrandError(`Brand "${trimmedName}" already exists.`);
      return;
    }
    const newBrand = addBrand({
      name: trimmedName,
      code: codeToUse,
      shortCode: quickBrandShortCode.trim().toUpperCase() || trimmedName.substring(0, 4).toUpperCase(),
      originCountry: quickBrandOriginCountry.trim(),
      website: quickBrandWebsite.trim(),
      color: '#6366f1',
      status: 'active',
    });
    setBrand(newBrand.name);
    setIsQuickBrandModalOpen(false);
    setToastMessage(`Brand "${newBrand.name}" created and selected!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 4. Quick Add Warranty
  const [isQuickWarrantyModalOpen, setIsQuickWarrantyModalOpen] = useState(false);
  const [quickWarrantyName, setQuickWarrantyName] = useState('');
  const [quickWarrantyDurationValue, setQuickWarrantyDurationValue] = useState('1');
  const [quickWarrantyDurationType, setQuickWarrantyDurationType] = useState<'days' | 'months' | 'years'>('years');
  const [quickWarrantyDescription, setQuickWarrantyDescription] = useState('');
  const [quickWarrantyError, setQuickWarrantyError] = useState<string | null>(null);

  const handleOpenQuickWarrantyModal = () => {
    setQuickWarrantyName('');
    setQuickWarrantyDurationValue('1');
    setQuickWarrantyDurationType('years');
    setQuickWarrantyDescription('');
    setQuickWarrantyError(null);
    setIsQuickWarrantyModalOpen(true);
  };

  const handleSaveQuickWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = quickWarrantyName.trim();
    if (!trimmedName) {
      setQuickWarrantyError('Please enter a Warranty Plan Name.');
      return;
    }
    const val = parseInt(quickWarrantyDurationValue) || 1;
    const isDuplicate = (warranties || []).some(
      (w) => w.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setQuickWarrantyError(`Warranty Plan "${trimmedName}" already exists.`);
      return;
    }
    const newWarranty = addWarranty({
      name: trimmedName,
      durationValue: val,
      durationType: quickWarrantyDurationType,
      description: quickWarrantyDescription.trim(),
      status: 'active',
    });
    setWarrantyId(newWarranty.id);
    setIsQuickWarrantyModalOpen(false);
    setToastMessage(`Warranty Plan "${newWarranty.name}" created and selected!`);
    setTimeout(() => setToastMessage(null), 3500);
  };



  // Sync state if productToEdit changes
  useEffect(() => {
    if (productToEdit) {
      setProductType(productToEdit.type || 'single');
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      setHsnCode(productToEdit.hsnCode || '');
      setTaxGroupId(productToEdit.taxGroupId || '');
      setTaxType(productToEdit.taxType || 'exclusive');
      setCategory(productToEdit.category || 'Electronics');
      setSubCategory(productToEdit.subCategory || '');
      setBrand(productToEdit.brand || 'Apex Tech');
      setWarrantyId(productToEdit.warrantyId || '');
      setUnit(productToEdit.unit || 'Pcs');
      setCostPrice(productToEdit.costPrice?.toString() || '0');
      setSellingPrice(productToEdit.sellingPrice?.toString() || '0');
      const initCost = productToEdit.costPrice || 0;
      const initSelling = productToEdit.sellingPrice || 0;
      const initMargin = initSelling > 0 ? (((initSelling - initCost) / initSelling) * 100).toFixed(1) : (settings.defaultProfitPercent?.toString() || '25');
      setMarginInput(initMargin);
      setTaxRate(productToEdit.taxRate?.toString() || '18.0');
      setAlertQuantity(productToEdit.alertQuantity?.toString() || '10');
      setImage(productToEdit.image || '');
      setDescription(productToEdit.description || '');
      setRack(productToEdit.rack || '');
      setRow(productToEdit.row || '');
      setPosition(productToEdit.position || '');
      if (productToEdit.locationIds && Array.isArray(productToEdit.locationIds) && productToEdit.locationIds.length > 0) {
        setSelectedBranchIds(productToEdit.locationIds);
      } else if (productToEdit.branchIds && Array.isArray(productToEdit.branchIds) && productToEdit.branchIds.length > 0) {
        setSelectedBranchIds(productToEdit.branchIds);
      } else if (productToEdit.locationId) {
        setSelectedBranchIds([productToEdit.locationId]);
      } else if (productToEdit.branchId) {
        setSelectedBranchIds([productToEdit.branchId]);
      }
      const stockVal = Number(productToEdit.currentStock ?? productToEdit.stock) || 0;
      setInitialLotStock(String(stockVal));
      setLotNumber(productToEdit.lotNumber || (productToEdit.lots && productToEdit.lots[0]?.lotNumber) || `LOT-${new Date().getFullYear()}-001`);

      if (productToEdit.attributes) setAttributes(productToEdit.attributes);
      if (productToEdit.variations && productToEdit.variations.length > 0) {
        setVariations(productToEdit.variations);
        const firstAttr = productToEdit.attributes?.[0];
        if (firstAttr?.name) setSelectedVariationName(firstAttr.name);
        const vals = productToEdit.variations.map((v) => v.value || v.name?.replace(/^.*:\s*/, '') || 'Default');
        if (vals.length > 0) setSelectedVariationValues(vals);
        const cExc: Record<string, string> = {};
        const vMarg: Record<string, string> = {};
        const vStock: Record<string, string> = {};
        const vAlert: Record<string, string> = {};
        const vSkuMap: Record<string, string> = {};
        productToEdit.variations.forEach((v) => {
          const valKey = v.value || v.name?.replace(/^.*:\s*/, '') || 'Default';
          cExc[valKey] = (v.costPrice ?? 100).toString();
          vMarg[valKey] = (v.margin ?? 25).toString();
          vStock[valKey] = (v.openingStock ?? v.currentStock ?? 10).toString();
          vAlert[valKey] = (v.alertQuantity ?? 5).toString();
          if (v.sku) vSkuMap[valKey] = v.sku;
        });
        setVariationCostsExc(cExc);
        setVariationMargins(vMarg);
        setVariationOpeningStocks(vStock);
        setVariationAlertQuantities(vAlert);
        setVariationSkus(vSkuMap);
      }
      if (productToEdit.comboItems) setComboItems(productToEdit.comboItems);
      if (productToEdit.lots && Array.isArray(productToEdit.lots) && productToEdit.lots.length > 0) {
        setLots(productToEdit.lots);
      } else {
        setLots([
          {
            id: `lot_init_${productToEdit.id}`,
            lotNumber: productToEdit.lotNumber || `LOT-${new Date().getFullYear()}-001`,
            costPrice: Number(productToEdit.costPrice) || 0,
            sellingPrice: Number(productToEdit.sellingPrice) || 0,
            initialStock: stockVal,
            currentStock: stockVal,
            createdDate: productToEdit.createdAt ? String(productToEdit.createdAt).split('T')[0] : new Date().toISOString().slice(0, 10),
            source: (productToEdit as any).source || 'opening_stock',
          }
        ]);
      }

      const availableLocs = locations && locations.length > 0 ? locations : [{ id: 'loc_main' } as any];
      const initialLocMap: Record<string, number> = {};
      if (productToEdit.locationStocks && typeof productToEdit.locationStocks === 'object' && Object.keys(productToEdit.locationStocks).length > 0) {
        Object.entries(productToEdit.locationStocks).forEach(([k, v]) => {
          initialLocMap[k] = Number(v) || 0;
        });
        availableLocs.forEach((loc) => {
          if (initialLocMap[loc.id] === undefined) {
            initialLocMap[loc.id] = initialLocMap['loc_1'] !== undefined ? initialLocMap['loc_1'] : stockVal;
          }
        });
      } else {
        availableLocs.forEach((loc) => {
          initialLocMap[loc.id] = stockVal;
        });
      }
      setLocationStocks(initialLocMap);
    }
  }, [productToEdit, settings.defaultTaxGroupId]);

  // Helper: Auto-generate variation rows from attributes
  const handleAutoGenerateVariations = () => {
    if (attributes.length === 0) return;

    // Cartesian product of attribute values
    let combinations: Record<string, string>[] = [{}];

    attributes.forEach((attr) => {
      if (!attr.name.trim() || attr.values.length === 0) return;
      const newCombs: Record<string, string>[] = [];
      combinations.forEach((comb) => {
        attr.values.forEach((val) => {
          newCombs.push({ ...comb, [attr.name]: val });
        });
      });
      combinations = newCombs;
    });

    const defaultCost = parseFloat(costPrice) || 50;
    const defaultSelling = parseFloat(sellingPrice) || 99;

    const newVariationsList: import('../../types/erp').ProductVariation[] = combinations.map((comb, idx) => {
      const varName = Object.entries(comb)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');

      const varCode = Object.values(comb)
        .map((v) => v.substring(0, 3).toUpperCase())
        .join('-');

      return {
        id: `var_${Date.now()}_${idx}`,
        sku: `${sku}-${varCode}`,
        barcode: `${barcode.slice(0, 8)}${(idx + 10).toString().padStart(4, '0')}`,
        name: varName,
        attributes: comb,
        costPrice: defaultCost,
        sellingPrice: defaultSelling,
        currentStock: 10,
        rack: rack || undefined,
        row: row || undefined,
        position: position || undefined,
      };
    });

    setVariations(newVariationsList);
    setToastMessage(`Generated ${newVariationsList.length} variation combinations!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper: Add custom attribute
  const handleAddCustomAttribute = () => {
    if (!attrNameInput.trim() || !attrValuesInput.trim()) return;
    const vals = attrValuesInput
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const newAttr = {
      id: `attr_${Date.now()}`,
      name: attrNameInput.trim(),
      values: vals,
    };

    setAttributes((prev) => [...prev, newAttr]);
    setAttrNameInput('');
    setAttrValuesInput('');
  };

  // Combo Helpers & Advanced Recalculations
  const updateComboPricing = useCallback((items: import('../../types/erp').ComboItem[], customMargin?: string) => {
    const sumComponentPrices = items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
    const sumComponentCosts = items.reduce((acc, item) => {
      const prod = (products || []).find((p) => p.id === item.productId);
      const itemCost = item.costPrice !== undefined ? Number(item.costPrice) : (Number(prod?.costPrice) || 0);
      return acc + (itemCost * (Number(item.quantity) || 1));
    }, 0);

    setCostPrice(sumComponentCosts.toFixed(2));

    const activeMarginStr = customMargin !== undefined ? customMargin : marginInput;
    const activeMargin = parseFloat(activeMarginStr);

    if (!isNaN(activeMargin) && sumComponentCosts > 0) {
      const newSellExc = sumComponentCosts * (1 + activeMargin / 100);
      setSellingPrice(newSellExc.toFixed(2));
    } else if (sumComponentPrices > 0) {
      setSellingPrice(sumComponentPrices.toFixed(2));
      if (sumComponentCosts > 0) {
        const calcMargin = (((sumComponentPrices - sumComponentCosts) / sumComponentCosts) * 100).toFixed(1);
        setMarginInput(calcMargin);
      }
    } else if (sumComponentCosts > 0) {
      setSellingPrice(sumComponentCosts.toFixed(2));
      setMarginInput('0.0');
    }
  }, [products, marginInput]);

  const addProductToCombo = useCallback((prod: Product, qty: number = 1) => {
    if (prod.type === 'combo' || prod.id === productToEdit?.id) return;

    const existingIdx = comboItems.findIndex((ci) => ci.productId === prod.id);
    let updated: import('../../types/erp').ComboItem[];

    if (existingIdx >= 0) {
      updated = [...comboItems];
      const newQty = (updated[existingIdx].quantity || 1) + qty;
      const unitP = updated[existingIdx].unitPrice || Number(prod.sellingPrice) || 0;
      const unitC = updated[existingIdx].costPrice !== undefined ? Number(updated[existingIdx].costPrice) : (Number(prod.costPrice) || 0);
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: newQty,
        totalPrice: unitP * newQty,
        totalCost: unitC * newQty,
      };
      setToastMessage(`Updated "${prod.name}" quantity to ${newQty} in bundle.`);
    } else {
      const unitP = Number(prod.sellingPrice) || 0;
      const unitC = Number(prod.costPrice) || 0;
      const newItem: import('../../types/erp').ComboItem = {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        category: prod.category,
        brand: prod.brand,
        quantity: qty,
        unitPrice: unitP,
        totalPrice: unitP * qty,
        costPrice: unitC,
        totalCost: unitC * qty,
        image: prod.image,
      };
      updated = [...comboItems, newItem];
      setToastMessage(`Added "${prod.name}" to combo bundle.`);
    }

    setComboItems(updated);
    updateComboPricing(updated);
    setComboSearchQuery('');
    setTimeout(() => setToastMessage(null), 3000);
  }, [comboItems, productToEdit, updateComboPricing]);

  const handleAddComboItem = () => {
    if (!selectedComboProductId) return;
    const targetProd = (products || []).find((p) => p.id === selectedComboProductId);
    if (!targetProd) return;
    addProductToCombo(targetProd, 1);
    setSelectedComboProductId('');
  };

  const removeComboItem = (index: number) => {
    const updated = comboItems.filter((_, i) => i !== index);
    setComboItems(updated);
    updateComboPricing(updated);
  };

  const updateComboItemQuantity = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    const updated = [...comboItems];
    const item = updated[index];
    if (!item) return;

    const unitP = Number(item.unitPrice) || 0;
    const unitC = item.costPrice !== undefined ? Number(item.costPrice) : 0;

    updated[index] = {
      ...item,
      quantity: qty,
      totalPrice: unitP * qty,
      totalCost: unitC * qty,
    };

    setComboItems(updated);
    updateComboPricing(updated);
  };

  // Eligible Products for Combo Assembly
  const eligibleComboProducts = useMemo(() => {
    return (products || []).filter(
      (p) => p.type !== 'combo' && p.id !== productToEdit?.id
    );
  }, [products, productToEdit]);

  // Fast inline search matches (by Name, SKU, Barcode, Brand, Category)
  const searchMatchedComboProducts = useMemo(() => {
    if (!comboSearchQuery.trim()) {
      return eligibleComboProducts.slice(0, 8);
    }
    const q = comboSearchQuery.toLowerCase().trim();
    return eligibleComboProducts.filter((p) => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchCategory = p.category?.toLowerCase().includes(q);
      return matchName || matchSku || matchBarcode || matchBrand || matchCategory;
    });
  }, [eligibleComboProducts, comboSearchQuery]);

  // Advanced Modal filtered products
  const modalFilteredProducts = useMemo(() => {
    return eligibleComboProducts.filter((p) => {
      if (comboFilterCategory !== 'all' && p.category !== comboFilterCategory) return false;
      if (comboFilterBrand !== 'all' && p.brand !== comboFilterBrand) return false;
      
      const stock = Number(p.currentStock ?? p.stock) || 0;
      const alert = Number(p.alertQuantity) || 5;
      if (comboFilterStockStatus === 'in_stock' && stock <= 0) return false;
      if (comboFilterStockStatus === 'low_stock' && (stock <= 0 || stock > alert)) return false;
      if (comboFilterStockStatus === 'out_of_stock' && stock > 0) return false;

      if (comboSearchQuery.trim()) {
        const q = comboSearchQuery.toLowerCase().trim();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchBarcode = p.barcode?.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchCategory = p.category?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode && !matchBrand && !matchCategory) return false;
      }
      return true;
    });
  }, [eligibleComboProducts, comboFilterCategory, comboFilterBrand, comboFilterStockStatus, comboSearchQuery]);

  const handleToggleModalProduct = (productId: string) => {
    setModalSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAllModalProducts = () => {
    if (modalSelectedProductIds.length === modalFilteredProducts.length) {
      setModalSelectedProductIds([]);
    } else {
      setModalSelectedProductIds(modalFilteredProducts.map((p) => p.id));
    }
  };

  const handleAddSelectedModalProducts = () => {
    if (modalSelectedProductIds.length === 0) return;

    let updated = [...comboItems];
    let addedCount = 0;

    modalSelectedProductIds.forEach((pid) => {
      const prod = eligibleComboProducts.find((p) => p.id === pid);
      if (!prod) return;
      const qty = modalProductQuantities[pid] || 1;
      const existingIdx = updated.findIndex((ci) => ci.productId === prod.id);

      if (existingIdx >= 0) {
        const newQty = (updated[existingIdx].quantity || 1) + qty;
        const unitP = updated[existingIdx].unitPrice || Number(prod.sellingPrice) || 0;
        const unitC = updated[existingIdx].costPrice !== undefined ? Number(updated[existingIdx].costPrice) : (Number(prod.costPrice) || 0);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: unitP * newQty,
          totalCost: unitC * newQty,
        };
      } else {
        const unitP = Number(prod.sellingPrice) || 0;
        const unitC = Number(prod.costPrice) || 0;
        updated.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          category: prod.category,
          brand: prod.brand,
          quantity: qty,
          unitPrice: unitP,
          totalPrice: unitP * qty,
          costPrice: unitC,
          totalCost: unitC * qty,
          image: prod.image,
        });
      }
      addedCount++;
    });

    setComboItems(updated);
    updateComboPricing(updated);
    setModalSelectedProductIds([]);
    setModalProductQuantities({});
    setIsComboAdvancedSearchOpen(false);
    setToastMessage(`Added ${addedCount} product(s) to combo bundle.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Duplicate Checkers
  const duplicateBarcodeProduct = useMemo(() => {
    if (!barcode.trim()) return null;
    return (products || []).find((p) => p.barcode && p.barcode.trim() === barcode.trim() && p.id !== productToEdit?.id);
  }, [barcode, products, productToEdit]);

  const duplicateSkuProduct = useMemo(() => {
    if (!sku.trim()) return null;
    return (products || []).find(
      (p) => p.sku && p.sku.toLowerCase() === sku.trim().toLowerCase() && p.id !== productToEdit?.id
    );
  }, [sku, products, productToEdit]);

  // Calculations
  const numericCost = parseFloat(costPrice) || 0;
  const numericSelling = parseFloat(sellingPrice) || 0;
  const numericTaxRate = parseFloat(taxRate) || 0;

  const grossProfit = numericSelling - numericCost;
  const marginPercentage =
    numericSelling > 0 ? ((grossProfit / numericSelling) * 100).toFixed(1) : '0';
  const markupPercentage =
    numericCost > 0 ? (((numericSelling - numericCost) / numericCost) * 100).toFixed(1) : '0';

  // Synchronized Cost & Selling Price handlers (finias POS logic)
  const calculatedCostPriceIncTax = useMemo(() => {
    return (parseFloat(costPrice) || 0) * (1 + numericTaxRate / 100);
  }, [costPrice, numericTaxRate]);

  const calculatedSellingPriceIncTax = useMemo(() => {
    return (parseFloat(sellingPrice) || 0) * (1 + numericTaxRate / 100);
  }, [sellingPrice, numericTaxRate]);

  const handleCostPriceExcTaxChange = useCallback((valStr: string) => {
    setCostPrice(valStr);
    const excTaxVal = parseFloat(valStr) || 0;
    const marginVal = parseFloat(marginInput) || 0;
    if (excTaxVal > 0) {
      const newSellExc = excTaxVal * (1 + marginVal / 100);
      setSellingPrice(newSellExc.toFixed(2));
    }
  }, [marginInput]);

  const handleCostPriceExcTaxPaste = useCallback((pastedText: string) => {
    const cleanVal = pastedText.replace(/[^0-9.]/g, '');
    if (cleanVal) {
      setCostPrice(cleanVal);
      const excTaxVal = parseFloat(cleanVal) || 0;
      const marginVal = parseFloat(marginInput) || 0;
      if (excTaxVal > 0) {
        const newSellExc = excTaxVal * (1 + marginVal / 100);
        setSellingPrice(newSellExc.toFixed(2));
      }
    }
  }, [marginInput]);

  const handleCostPriceIncTaxChange = useCallback((valStr: string) => {
    const incTaxVal = parseFloat(valStr) || 0;
    const excTaxVal = incTaxVal / (1 + numericTaxRate / 100);
    setCostPrice(excTaxVal > 0 ? excTaxVal.toFixed(2) : '');
    
    const marginVal = parseFloat(marginInput) || 0;
    if (excTaxVal > 0) {
      const newSellExc = excTaxVal * (1 + marginVal / 100);
      setSellingPrice(newSellExc.toFixed(2));
    }
  }, [numericTaxRate, marginInput]);

  const handleMarginChange = useCallback((valStr: string) => {
    setMarginInput(valStr);
    const marginVal = parseFloat(valStr) || 0;
    const excTaxVal = parseFloat(costPrice) || 0;
    if (excTaxVal > 0) {
      const newSellExc = excTaxVal * (1 + marginVal / 100);
      setSellingPrice(newSellExc.toFixed(2));
    }
  }, [costPrice]);

  const handleSellingPriceExcTaxChange = useCallback((valStr: string) => {
    setSellingPrice(valStr);
    const sellExcVal = parseFloat(valStr) || 0;
    const excTaxVal = parseFloat(costPrice) || 0;
    if (sellExcVal > 0 && excTaxVal > 0) {
      const calcMargin = (((sellExcVal - excTaxVal) / excTaxVal) * 100).toFixed(1);
      setMarginInput(calcMargin);
    }
  }, [costPrice]);

  const handleSellingPriceIncTaxChange = useCallback((valStr: string) => {
    // Treat the input as the absolute value the user wants, regardless of current conversion
    const sellIncVal = parseFloat(valStr) || 0;
    
    // Update selling price (Exclusive of Tax) derived from the Inclusive value
    const sellExcVal = sellIncVal / (1 + numericTaxRate / 100);
    
    // Store as string to avoid premature rounding during typing
    setSellingPrice(sellIncVal > 0 ? (sellIncVal / (1 + numericTaxRate / 100)).toString() : '');
    
    const excTaxVal = parseFloat(costPrice) || 0;
    if (sellIncVal > 0 && excTaxVal > 0) {
      const calcMargin = (((sellIncVal / (1 + numericTaxRate / 100)) - excTaxVal) / excTaxVal) * 100;
      setMarginInput(calcMargin.toFixed(1));
    }
  }, [numericTaxRate, costPrice]);

  // Tax breakdown
  const taxCalculations = useMemo(() => {
    if (taxType === 'exempt' || numericTaxRate <= 0) {
      return {
        basePrice: numericSelling,
        taxAmount: 0,
        finalPrice: numericSelling,
      };
    }
    if (taxType === 'inclusive') {
      const basePrice = numericSelling / (1 + numericTaxRate / 100);
      const taxAmount = numericSelling - basePrice;
      return {
        basePrice,
        taxAmount,
        finalPrice: numericSelling,
      };
    }
    // Exclusive
    const taxAmount = (numericSelling * numericTaxRate) / 100;
    return {
      basePrice: numericSelling,
      taxAmount,
      finalPrice: numericSelling + taxAmount,
    };
  }, [numericSelling, numericTaxRate, taxType]);

  // Total stock across all locations or lots
  const totalAllocatedStock = useMemo(() => {
    if (lots && lots.length > 0) {
      return lots.reduce<number>((sum, val) => sum + (Number(val.currentStock) || 0), 0);
    }
    return Object.values(locationStocks).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
  }, [lots, locationStocks]);

  const totalStockValuationCost = totalAllocatedStock * numericCost;
  const totalStockValuationRetail = totalAllocatedStock * numericSelling;

  // Generate GS1 / EAN-13 Barcode with valid modulo 10 checksum
  const generateEan13 = () => {
    const prefix = '890';
    let code = prefix;
    for (let i = 0; i < 9; i++) {
      code += Math.floor(Math.random() * 10);
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    setBarcode(code + checksum);
  };

  // Generate Code-128 SKU
  const generateCode128Sku = () => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const prefix = settings.productSkuPrefix || 'PROD-';
    setSku(`${prefix}${rand}`);
  };

  // Helper to determine if a lot's stock is editable
  const isLotStockEditable = (lot: ProductLot, prod?: Product | null): { allowed: boolean; reason?: string } => {
    if (!prod) return { allowed: true };

    // 1. If product is directly from purchase
    if (
      prod.source === 'purchase' ||
      prod.creationSource === 'direct_purchase' ||
      prod.creationSource === 'purchase' ||
      prod.isDirectPurchase === true
    ) {
      return {
        allowed: false,
        reason: 'Directly purchased items cannot have batch stock manually edited here. Stock adjustments must be made via Purchase / Purchase Return.',
      };
    }

    // 2. If the specific lot is from a purchase transaction
    if (
      lot.source === 'purchase' ||
      lot.source === 'direct_purchase' ||
      lot.purchaseId ||
      lot.purchaseInvoiceNo ||
      (lot.id && (String(lot.id).startsWith('lot_pur') || String(lot.id).startsWith('lot_rec'))) ||
      (lot.lotNumber && (String(lot.lotNumber).toUpperCase().startsWith('PUR-') || String(lot.lotNumber).toUpperCase().startsWith('LOT-PUR') || String(lot.lotNumber).toUpperCase().startsWith('PO-')))
    ) {
      return {
        allowed: false,
        reason: 'This inventory batch was generated directly from a Purchase Order. Directly purchased items/lots cannot be manually edited here.',
      };
    }

    // 3. Products imported through bulk products import or added from Add Product screen can be edited
    return { allowed: true };
  };

  // Lot Stock Edit Handlers
  const handleOpenEditLot = (lot: ProductLot) => {
    const eligibility = isLotStockEditable(lot, productToEdit);
    if (!eligibility.allowed) {
      setToastMessage(eligibility.reason || 'Directly purchased items cannot be edited here.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setEditingLot(lot);
    setEditingLotStock(String(lot.currentStock ?? 0));
  };

  const handleSaveLotStock = () => {
    if (!editingLot) return;
    const newStockNum = Math.max(0, parseInt(editingLotStock) || 0);

    const updatedLots = lots.map((l) =>
      l.id === editingLot.id ? { ...l, currentStock: newStockNum } : l
    );
    setLots(updatedLots);

    if (editingLot.lotNumber === lotNumber || lots[0]?.id === editingLot.id) {
      setInitialLotStock(String(newStockNum));
    }

    const totalLotsStock = updatedLots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0);
    const newLocStocks: Record<string, number> = {};
    const targetBranches = selectedBranchIds.length > 0 ? selectedBranchIds : (locations.length > 0 ? locations.map(l => l.id) : ['loc_main']);
    targetBranches.forEach(locId => {
      newLocStocks[locId] = totalLotsStock;
    });
    setLocationStocks(newLocStocks);

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        lots: updatedLots,
        locationStocks: newLocStocks,
        currentStock: totalLotsStock,
        stock: totalLotsStock,
      });
    }

    setToastMessage(`Stock for lot "${editingLot.lotNumber}" updated to ${newStockNum} ${unit}!`);
    setTimeout(() => setToastMessage(null), 4000);
    setEditingLot(null);
  };

  // Save Logic
  const handleSave = (andAddAnother: boolean = false) => {
    setFormError(null);
    setFieldErrors({});

    // 0. Compute effective variations for Variable Products
    let activeVarValues = [...selectedVariationValues];
    if (newValueInput.trim() && !activeVarValues.includes(newValueInput.trim())) {
      activeVarValues.push(newValueInput.trim());
      setSelectedVariationValues(activeVarValues);
      setNewValueInput('');
    }

    if (productType === 'variable' && activeVarValues.length === 0) {
      if (variations.length > 0) {
        activeVarValues = variations.map(v => v.value || v.name?.replace(/^.*:\s*/, '') || 'Default');
      } else {
        const currentName = selectedVariationName || 'Phase Type';
        const matched = variationTemplates.find(t => t.name.toLowerCase() === currentName.toLowerCase());
        if (matched && matched.values?.length > 0) {
          activeVarValues = [...matched.values];
        } else {
          const presets: Record<string, string[]> = {
            'phase type': ['Single Phase', 'Three Phase', 'two phase'],
            'cable length': ['1 Meter', '3 Meter', '5 Meter', '10 Meter'],
            'wire gauge / thickness': ['1.5 sq mm', '2.5 sq mm', '4.0 sq mm'],
            'voltage rating': ['110V', '220V', '440V'],
            'size': ['Small', 'Medium', 'Large', 'XL'],
            'color': ['Red', 'Blue', 'Black', 'White'],
            'flavor': ['Vanilla', 'Chocolate', 'Strawberry'],
            'material / conductor': ['Copper', 'Aluminum', 'Brass'],
            'dram / storage capacity': ['128GB', '256GB', '512GB', '1TB NVMe'],
          };
          activeVarValues = presets[currentName.toLowerCase()] || ['Standard', 'Variant 1'];
        }
      }
      setSelectedVariationValues(activeVarValues);
    }

    const effectiveVariations: import('../../types/erp').ProductVariation[] = productType === 'variable'
      ? activeVarValues.map((val, idx) => {
          const varSku = variationSkus[val] || (variationSkuFormat === 'sku_number'
            ? `${(sku.trim() || 'SKU')}-${idx + 1}`
            : `${(sku.trim() || 'SKU')}${val.replace(/[^a-zA-Z0-9]/g, '')}`);

          const effectiveTaxRate = taxType === 'exempt' ? 0 : (parseFloat(taxRate) || 0);
          const baseCostExc = parseFloat(variationCostsExc[val] !== undefined ? variationCostsExc[val] : ((idx + 1) * 20 + 80).toString()) || 100;
          const currentCostInc = effectiveTaxRate > 0 ? (baseCostExc * (1 + effectiveTaxRate / 100)) : baseCostExc;
          const currentMargin = parseFloat(variationMargins[val] !== undefined ? variationMargins[val] : (marginInput || '25')) || 25;
          const currentSellingExc = baseCostExc * (1 + currentMargin / 100);
          const currentSellingInc = effectiveTaxRate > 0 ? (currentSellingExc * (1 + effectiveTaxRate / 100)) : currentSellingExc;
          const opStock = parseFloat(variationOpeningStocks[val] ?? '5') || 0;
          const alertThresh = parseFloat(variationAlertQuantities[val] ?? '2') || 5;
          const varImg = variationImages[val] || '';

          return {
            id: `var_${Date.now()}_${idx}`,
            name: `${selectedVariationName || 'Variation'}: ${val}`,
            value: val,
            attributeName: selectedVariationName || 'Variation',
            sku: varSku,
            barcode: barcode ? `${barcode}-${idx + 1}` : undefined,
            costPrice: baseCostExc,
            costPriceIncTax: currentCostInc,
            margin: currentMargin,
            sellingPrice: currentSellingExc,
            sellingPriceIncTax: currentSellingInc,
            openingStock: opStock,
            currentStock: opStock,
            alertQuantity: alertThresh,
            image: varImg || undefined,
            attributes: { [selectedVariationName || 'Variation']: val },
          };
        })
      : [];

    const variableTotalOpeningStock = effectiveVariations.reduce(
      (sum, v) => sum + (Number(v.openingStock ?? v.currentStock) || 0),
      0
    );

    // 1. Strict Schema-Driven Input Validation
    const schemaRes = validateProductData({
      name,
      sku: sku.trim() || undefined,
      type: productType,
      unit,
      costPrice: productType === 'single' ? costPrice : (productType === 'combo' ? (costPrice || '0') : (effectiveVariations[0]?.costPrice?.toString() || '0')),
      sellingPrice: productType === 'single' ? sellingPrice : (productType === 'combo' ? (sellingPrice || '0') : (effectiveVariations[0]?.sellingPrice?.toString() || '0')),
      alertQuantity: productType === 'single' ? alertQuantity : (productType === 'combo' ? '0' : (effectiveVariations[0]?.alertQuantity?.toString() || '5')),
      taxRate,
      category,
      brand,
      hsnCode,
      enableHsnCode: settings?.enableHsnCode,
      variations: productType === 'variable' ? effectiveVariations.map((v) => ({
        name: v.name || v.value,
        sku: v.sku,
        purchasePrice: v.costPrice,
        sellingPrice: v.sellingPrice,
      })) : undefined,
    });

    if (!schemaRes.isValid) {
      setFieldErrors(schemaRes.errors);
      setFormError(schemaRes.firstError || 'Please correct the highlighted fields before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (productType === 'combo' && comboItems.length === 0) {
      setFormError('Please select and add at least one individual product into this combo bundle.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isEditMode && productType === 'single') {
      const trimmedLot = lotNumber.trim();
      if (!trimmedLot) {
        setFormError('Please enter a LOT number.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const isDuplicateLot = products?.some((p) =>
        p.lots?.some((l) => l.lotNumber.toLowerCase() === trimmedLot.toLowerCase())
      );
      if (isDuplicateLot) {
        setFormError(`Lot Number "${trimmedLot}" already exists. Please use a unique lot number.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const stockVal = parseFloat(initialLotStock);
      if (isNaN(stockVal) || stockVal <= 0) {
        setFormError('Please enter opening stock for the allocated LOT number.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    let finalSku = sku.trim();
    if (!finalSku) {
      const prefix = settings.productSkuPrefix || 'PROD-';
      finalSku = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
      setSku(finalSku);
    }

    const inlineDuplicateCheck = products?.find(
      (p) => p.sku && p.sku.toLowerCase() === finalSku.toLowerCase() && p.id !== productToEdit?.id
    );

    if (inlineDuplicateCheck) {
      setFormError(`SKU "${finalSku}" is already assigned to "${inlineDuplicateCheck.name}". Please provide a unique SKU.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (selectedBranchIds.length === 0) {
      setFormError('Please select at least one branch location where this product will be available.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);

    const cost = parseFloat(costPrice) || 0;
    const price = parseFloat(sellingPrice) || 0;
    const tax = parseFloat(taxRate) || 0;
    const alertQty = parseInt(alertQuantity) || 5;

    const totalStockValue = (lots && lots.length > 0)
      ? lots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0)
      : (Object.keys(locationStocks).length > 0
          ? Object.values(locationStocks).reduce((sum, v) => sum + (Number(v) || 0), 0)
          : (Number(initialLotStock) || 0));

    // Synchronize location stock allocations across selected branches
    const finalLocationStocks: Record<string, number> = {};
    selectedBranchIds.forEach((locId) => {
      finalLocationStocks[locId] = locationStocks[locId] !== undefined ? locationStocks[locId] : totalStockValue;
    });
    if (Object.keys(finalLocationStocks).length === 0) {
      (locations || []).forEach(loc => {
        finalLocationStocks[loc.id] = totalStockValue;
      });
    }

    const resolvedStockForLot = productType === 'variable'
      ? variableTotalOpeningStock
      : (productType === 'combo' ? 0 : (Number(initialLotStock) || totalStockValue));

    const finalLots: ProductLot[] = productType === 'combo'
      ? []
      : isEditMode
      ? (lots && lots.length > 0
          ? lots.map((l, idx) => (idx === 0 || l.lotNumber === lotNumber) && initialLotStock !== ''
              ? { ...l, currentStock: Math.max(0, Number(initialLotStock) || 0) }
              : l)
          : [
              {
                id: `lot_init_${productToEdit?.id || Date.now()}`,
                lotNumber: lotNumber.trim() || `LOT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
                costPrice: cost,
                sellingPrice: price,
                currentStock: totalStockValue,
                createdDate: new Date().toISOString().slice(0, 10),
                source: 'opening_stock',
              }
            ])
      : [
          {
            id: `lot_${Date.now()}`,
            lotNumber: lotNumber.trim() || `LOT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
            costPrice: productType === 'variable' ? (effectiveVariations[0]?.costPrice || cost) : cost,
            sellingPrice: productType === 'variable' ? (effectiveVariations[0]?.sellingPrice || price) : price,
            currentStock: resolvedStockForLot,
            createdDate: new Date().toISOString().slice(0, 10),
            source: 'opening_stock',
          }
        ];

    // Compute dynamic stock for combo products from components
    let comboDynamicStock = 0;
    if (productType === 'combo' && comboItems.length > 0) {
      const possibleComboCounts = comboItems.map((ci) => {
        const compProd = (products || []).find((p) => p.id === ci.productId);
        const compStock = Number(compProd?.currentStock ?? compProd?.stock) || 0;
        const reqQty = Number(ci.quantity) || 1;
        return Math.floor(compStock / reqQty);
      });
      comboDynamicStock = possibleComboCounts.length > 0 ? Math.min(...possibleComboCounts) : 0;
    }

    const finalResolvedStock = productType === 'variable'
      ? variableTotalOpeningStock
      : productType === 'combo'
      ? comboDynamicStock
      : finalLots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0);

    const productPayload = {
      name: name.trim(),
      sku: finalSku,
      barcode: barcode.trim(),
      type: productType,
      hsnCode: hsnCode.trim(),
      taxGroupId,
      taxType,
      category: category.trim(),
      subCategory: subCategory.trim() || undefined,
      brand: brand.trim(),
      warrantyId: warrantyId || undefined,
      expiryPeriod: (expiryPeriod && expiryPeriodType !== 'Not Applicable') ? parseFloat(expiryPeriod) : undefined,
      expiryPeriodType: expiryPeriodType || 'Months',
      unit,
      costPrice: productType === 'variable' ? (effectiveVariations[0]?.costPrice || cost) : cost,
      sellingPrice: productType === 'variable' ? (effectiveVariations[0]?.sellingPrice || price) : price,
      taxRate: tax,
      alertQuantity: alertQty,
      image: image.trim() || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300&q=80',
      description: description.trim(),
      rack: rack.trim() || undefined,
      row: row.trim() || undefined,
      position: position.trim() || undefined,
      locationId: selectedBranchIds[0] || undefined,
      branchId: selectedBranchIds[0] || undefined,
      locationIds: selectedBranchIds,
      branchIds: selectedBranchIds,
      locationStocks: finalLocationStocks,
      currentStock: finalResolvedStock,
      stock: finalResolvedStock,
      attributes: productType === 'variable'
        ? [{ id: 'attr_1', name: selectedVariationName || 'Variation', values: selectedVariationValues }]
        : undefined,
      variations: productType === 'variable' ? effectiveVariations : undefined,
      comboItems: productType === 'combo' ? comboItems : undefined,
      lots: finalLots,
      openingStock: (productType === 'combo' || isEditMode) ? (productToEdit?.openingStock ?? resolvedStockForLot) : resolvedStockForLot,
      manualLotNumber: (productType === 'combo' || isEditMode) ? undefined : (lotNumber.trim() || undefined),
      initialLotStock: (productType === 'combo' || isEditMode) ? undefined : resolvedStockForLot,
      source: isEditMode ? (productToEdit?.source || 'manual') : 'manual',
      creationSource: isEditMode ? (productToEdit?.creationSource || 'add_product_screen') : 'add_product_screen',
    };

    if (isEditMode && productToEdit) {
      updateProduct(productToEdit.id, productPayload);
      setIsSaving(false);
      if (onSaved) {
        onSaved({ ...productToEdit, ...productPayload, currentStock: finalResolvedStock, stock: finalResolvedStock }, false);
      }
      onBack();
    } else {
      addProduct(productPayload);
      setIsSaving(false);

      if (andAddAnother) {
        setToastMessage(`Product "${name.trim()}" created successfully! Ready for next item.`);
        // Reset form for next item
        setName('');
        setSubCategory('');
        generateCode128Sku();
        generateEan13();
        setDescription('');
        setTimeout(() => setToastMessage(null), 4000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (onSaved) {
          onSaved({ ...productPayload, id: `prod_${Date.now()}`, currentStock: totalAllocatedStock }, true);
        }
        onBack();
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-28 w-full max-w-full animate-fadeIn">
      {/* Top Breadcrumbs & Action Bar */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumbs & Title */}
          <div className="flex items-start sm:items-center gap-3">
            <button
              id="product-form-back-btn"
              type="button"
              onClick={onBack}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Return to Product Matrix"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                <span className="hover:text-indigo-400 cursor-pointer" onClick={onBack}>
                  Products & Inventory
                </span>
                <span>/</span>
                <span className="hover:text-indigo-400 cursor-pointer" onClick={onBack}>
                  All Products
                </span>
                <span>/</span>
                <span className="text-indigo-400 font-bold">
                  {isEditMode ? 'Edit Product' : 'Add New Product'}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <Package className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>{isEditMode ? `Edit: ${name || 'Product'}` : 'Add New Product'}</span>
                {isEditMode && sku && (
                  <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded-lg hidden sm:inline-block">
                    {sku}
                  </span>
                )}
                {!isEditMode && (
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    + New Item
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Action Buttons Top */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end">


            <button
              id="product-form-cancel-btn"
              type="button"
              onClick={onBack}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLight
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-slate-100'
              }`}
            >
              Cancel
            </button>

            {!isEditMode && (
              <button
                id="product-form-save-another-btn"
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 hover:border-indigo-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-indigo-500/40 text-indigo-300 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Save & Add Another</span>
              </button>
            )}

            <button
              id="product-form-save-main-btn"
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEditMode ? 'Update Product Record' : 'Save Product & Close'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {formError && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-semibold rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
          <button onClick={() => setFormError(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast message */}
      {toastMessage && (
        <div className="p-4 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs font-semibold rounded-2xl flex items-center justify-between gap-3 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Content Full Width */}
      <div className="space-y-6 w-full">
          {/* Card 1: Essential Product Information */}
          <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">General Product Information</h3>
                  <p className="text-[11px] text-slate-400">Core identification, barcodes, taxonomy, and measurement unit</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Step 1 of 3
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Product Type Selector */}
              <div>
                <label className="text-slate-300 font-bold text-xs block mb-1.5">
                  Product Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProductType('single')}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      productType === 'single'
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-400" />
                        Single Product
                      </span>
                      {productType === 'single' && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Standard individual item with fixed single SKU & price.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProductType('variable');
                      if (!selectedVariationName) {
                        setSelectedVariationName('Phase Type');
                      }
                      if (selectedVariationValues.length === 0) {
                        setSelectedVariationValues(['Single Phase', 'Three Phase', 'two phase']);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      productType === 'variable'
                        ? 'bg-purple-950/70 border-purple-500 text-white shadow-md shadow-purple-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-purple-300">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        Variable Product
                      </span>
                      {productType === 'variable' && (
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Variations in size, color, design, flavor, etc.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductType('combo')}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      productType === 'combo'
                        ? 'bg-amber-950/70 border-amber-500 text-white shadow-md shadow-amber-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                        <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                        Combo / Bundle
                      </span>
                      {productType === 'combo' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Combine multiple individual products into one bundle.
                    </p>
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>Product Name *</span>
                  <span className="text-[11px] text-slate-500">e.g. Sony WH-1000XM5 Wireless Headphones</span>
                </label>
                <input
                  id="prod-input-name"
                  required
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Enter full descriptive product title..."
                  className={`w-full bg-slate-950 text-white font-semibold text-sm px-3.5 py-2.5 rounded-xl border ${fieldErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} focus:outline-none focus:border-indigo-500 mt-1 placeholder-slate-500`}
                />
                <FormFieldError error={fieldErrors.name} />
              </div>

              {/* SKU & Barcode Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">SKU / Item Code *</label>
                    <button
                      type="button"
                      onClick={generateCode128Sku}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition"
                      title="Auto-generate alphanumeric SKU"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto Generate</span>
                    </button>
                  </div>
                  <input
                    id="prod-input-sku"
                    type="text"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value);
                      if (fieldErrors.sku) setFieldErrors(prev => ({ ...prev, sku: '' }));
                    }}
                    placeholder="Leave blank to auto-generate"
                    className={`w-full bg-slate-950 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl border ${fieldErrors.sku ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} focus:outline-none focus:border-indigo-500 mt-1 uppercase`}
                  />
                  <FormFieldError error={fieldErrors.sku} />
                  {duplicateSkuProduct && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1.5 mt-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Warning: SKU already used by &quot;{duplicateSkuProduct.name}&quot;</span>
                    </p>
                  )}
                </div>

                {/* Barcode */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">Barcode (EAN-13 / UPC / Code128)</label>
                    <button
                      type="button"
                      onClick={generateEan13}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition"
                      title="Generate GS1 standard EAN-13 with checksum"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate EAN-13</span>
                    </button>
                  </div>
                  <input
                    id="prod-input-barcode"
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan barcode with handheld scanner..."
                    className="w-full bg-slate-950 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                  />
                  {duplicateBarcodeProduct && (
                    <p className="text-[11px] text-amber-400 flex items-center gap-1.5 mt-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Matches existing product &quot;{duplicateBarcodeProduct.name}&quot;</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Advanced Multi-Branch Locations Allocation Component */}
              <div className="p-4 rounded-2xl border bg-slate-950/70 border-slate-800 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
                  <div>
                    <label className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                      <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Assigned Branch Locations *</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {selectedBranchIds.length === availableLocations.length
                          ? `All Branches (${availableLocations.length})`
                          : `${selectedBranchIds.length} of ${availableLocations.length} Selected`}
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select multiple branches so this product is automatically available across all your outlets without manual duplicate entry.
                    </p>
                  </div>

                  {/* Quick Action Pill Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      id="btn-select-all-branches"
                      type="button"
                      onClick={() => setSelectedBranchIds(availableLocations.map((l) => l.id))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
                      title="Make product available in all business branches"
                    >
                      <Check className="w-3 h-3" />
                      <span>Select All</span>
                    </button>
                    <button
                      id="btn-select-flagship-branch"
                      type="button"
                      onClick={() => {
                        const defaultLoc = availableLocations.find((l) => l.isDefault) || availableLocations[0];
                        if (defaultLoc) setSelectedBranchIds([defaultLoc.id]);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                      title="Select only primary headquarters / flagship branch"
                    >
                      <span>Primary Only</span>
                    </button>
                    {selectedBranchIds.length > 0 && (
                      <button
                        id="btn-clear-branch-selection"
                        type="button"
                        onClick={() => setSelectedBranchIds([])}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        title="Clear all selected branches"
                      >
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar for Branches (when 3+ branches exist) */}
                {availableLocations.length > 2 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={branchSearchTerm}
                      onChange={(e) => setBranchSearchTerm(e.target.value)}
                      placeholder="Filter branches by name, outlet code (e.g. HQ01), or city..."
                      className="w-full bg-slate-900 text-xs text-white placeholder-slate-500 pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Selected Branch Chips / Badges Container */}
                {selectedBranchIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center px-1">
                      Active In:
                    </span>
                    {selectedBranchIds.map((id) => {
                      const loc = availableLocations.find((l) => l.id === id);
                      if (!loc) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 group animate-fadeIn"
                        >
                          <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[140px] sm:max-w-none">{loc.name}</span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-indigo-500/25 rounded text-indigo-200">
                            {loc.code || 'LOC'}
                          </span>
                          {loc.isDefault && (
                            <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/15 px-1 rounded">
                              Flagship
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBranchIds((prev) => prev.filter((bId) => bId !== id))}
                            className="text-slate-400 hover:text-rose-400 transition p-0.5 rounded ml-0.5 cursor-pointer"
                            title={`Remove ${loc.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Interactive Multi-Select Branch Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar pt-1">
                  {availableLocations
                    .filter((loc) => {
                      if (!branchSearchTerm.trim()) return true;
                      const q = branchSearchTerm.toLowerCase();
                      return (
                        loc.name.toLowerCase().includes(q) ||
                        (loc.code && loc.code.toLowerCase().includes(q)) ||
                        (loc.city && loc.city.toLowerCase().includes(q))
                      );
                    })
                    .map((loc) => {
                      const isSelected = selectedBranchIds.includes(loc.id);
                      return (
                        <div
                          key={loc.id}
                          id={`branch-checkbox-card-${loc.id}`}
                          onClick={() => {
                            setSelectedBranchIds((prev) =>
                              isSelected ? prev.filter((id) => id !== loc.id) : [...prev, loc.id]
                            );
                          }}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 select-none ${
                            isSelected
                              ? 'bg-indigo-500/15 border-indigo-500/80 ring-1 ring-indigo-500/30 text-white shadow-sm'
                              : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate text-white">
                                {loc.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700/60 shrink-0">
                                {loc.code || 'LOC'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {loc.city ? `${loc.city}${loc.state ? `, ${loc.state}` : ''}` : loc.address || 'Physical Branch Outlet'}
                            </p>

                            {loc.isDefault && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 mt-1 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Primary Flagship
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {selectedBranchIds.length === 0 && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Please assign at least one branch location to make this product active in inventory.</span>
                  </p>
                )}
              </div>

              {/* HSN / SAC Code & Unit of Measurement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* HSN / SAC Code */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <span>HSN / SAC Code</span>
                      {settings?.enableHsnCode && <span className="text-rose-500">*</span>}
                      <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                        GST Compliance
                      </span>
                    </label>
                  </div>
                  <input
                    id="prod-input-hsn"
                    required={!!settings?.enableHsnCode}
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="e.g. 8528.52 (Audio/Video), 8471 (Computers)"
                    className={`w-full bg-slate-950 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl border ${
                      settings?.enableHsnCode && !hsnCode.trim() ? 'border-rose-500' : 'border-slate-700'
                    } focus:outline-none focus:border-indigo-500 mt-1`}
                  />
                  {settings?.enableHsnCode && !hsnCode.trim() && (
                    <p className="text-[11px] text-rose-500 mt-1">HSN / SAC Code is required.</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Harmonized System of Nomenclature code for tax determination.
                  </p>
                </div>

                {/* Unit of Measurement */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">Unit of Measurement (UoM) *</label>
                    <button
                      type="button"
                      onClick={handleOpenQuickUnitModal}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      title="Quick Add Unit"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Manage / + Add Unit</span>
                    </button>
                  </div>
                  <select
                    id="prod-select-unit"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      if (fieldErrors.unit) setFieldErrors(prev => ({ ...prev, unit: '' }));
                    }}
                    className={`w-full bg-slate-950 text-white font-medium px-3.5 py-2.5 rounded-xl border ${fieldErrors.unit ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} focus:outline-none focus:border-indigo-500 mt-1`}
                  >
                    <option value="">Select Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.shortName}>
                        {u.name} ({u.shortName}) {u.allowDecimal ? '• Decimals allowed' : ''}{' '}
                        {!u.isBaseUnit && u.baseUnitMultiplier
                          ? `• [1 = ${u.baseUnitMultiplier} base]`
                          : ''}
                      </option>
                    ))}
                    {!units.some((u) => u.shortName.toLowerCase() === (unit || '').toLowerCase()) &&
                      unit && <option value={unit}>{unit} (Custom)</option>}
                  </select>
                  <FormFieldError error={fieldErrors.unit} />
                </div>
              </div>

              {/* Category, Sub-Category & Brand with Quick Suggestions */}
              {Boolean(settings.enableCategory !== false || settings.enableSubCategory !== false || settings.enableBrand !== false) && (
                <div className={`grid grid-cols-1 ${
                  [(settings.enableCategory !== false), (settings.enableSubCategory !== false), (settings.enableBrand !== false)].filter(Boolean).length === 3
                    ? 'sm:grid-cols-3'
                    : [(settings.enableCategory !== false), (settings.enableSubCategory !== false), (settings.enableBrand !== false)].filter(Boolean).length === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-1'
                } gap-4`}>
                  {/* Category */}
                  {settings.enableCategory !== false && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold">Category</label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickCategoryModal()}
                          className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          title="Manage & Add Category"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Manage / + Add Category</span>
                        </button>
                      </div>
                      <select
                        id="prod-input-category"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSubCategory('');
                        }}
                        className="w-full bg-slate-950 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                      >
                        <option value="">Select Category</option>
                        {(() => {
                          const validCats = erpCategories && erpCategories.length > 0
                            ? erpCategories.filter((c) => c.status !== 'inactive' && !c.parentId)
                            : PRESET_CATEGORIES.map(c => ({ id: c, name: c }));
                          return validCats.map((cat) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  )}

                  {/* Sub-Category */}
                  {settings.enableSubCategory !== false && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold">Sub-Category</label>
                        <button
                          type="button"
                          onClick={() => {
                            const parentCatObj = (erpCategories || []).find((c) => c.name === category);
                            handleOpenQuickCategoryModal(parentCatObj?.id);
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          title="Manage & Add Sub-Category"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Manage / + Add Sub-Cat</span>
                        </button>
                      </div>
                      {(() => {
                        const selectedParentCat = (erpCategories || []).find(c => c.name === category);
                        const availableSubCats = (erpCategories || []).filter(c => 
                          c.status === 'active' && (
                            c.parentId === selectedParentCat?.id ||
                            c.parentId === category ||
                            (c.parentId && !selectedParentCat && !category)
                          )
                        );

                        return availableSubCats.length > 0 ? (
                          <select
                            id="prod-input-subcategory"
                            value={subCategory}
                            onChange={(e) => setSubCategory(e.target.value)}
                            className="w-full bg-slate-950 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                          >
                            <option value="">Select Sub-Category</option>
                            {availableSubCats.map((sc) => (
                              <option key={sc.id} value={sc.name}>{sc.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="prod-input-subcategory"
                            type="text"
                            value={subCategory}
                            onChange={(e) => setSubCategory(e.target.value)}
                            placeholder="e.g. Wireless, Organic, Accessories"
                            className="w-full bg-slate-950 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1 text-xs"
                          />
                        );
                      })()}
                    </div>
                  )}

                  {/* Brand */}
                  {settings.enableBrand !== false && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold">Brand / Manufacturer</label>
                        <button
                          type="button"
                          onClick={handleOpenQuickBrandModal}
                          className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          title="Manage & Add Brand"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Manage / + Add Brand</span>
                        </button>
                      </div>
                      <select
                        id="prod-input-brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-slate-950 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                      >
                        <option value="">Select Brand (Optional)</option>
                        {(erpBrands && erpBrands.length > 0
                          ? erpBrands.filter((b) => (b.status || 'active').toLowerCase() === 'active' || (b.name && b.name.toLowerCase() === (brand || '').toLowerCase()))
                          : PRESET_BRANDS.map(b => ({ id: b, name: b, originCountry: '' }))
                        ).map((b) => (
                          <option key={b.id || b.name} value={b.name}>
                            {b.name} {b.originCountry ? `(${b.originCountry})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Product Expiry Configuration */}
              {Boolean(settings?.enableExpiry !== false && settings?.enableExpiry !== undefined ? settings.enableExpiry : (settings?.enableProductExpiry ?? true)) && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>Expires in:</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Product shelf-life duration)</span>
                    </label>
                    {expiryPeriodType !== 'Not Applicable' && expiryPeriod && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">
                        Expires in {expiryPeriod} {expiryPeriodType}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Number input for duration */}
                    <div className="relative">
                      <input
                        id="prod-input-expiry-period"
                        type="number"
                        min="0"
                        step="1"
                        disabled={expiryPeriodType === 'Not Applicable'}
                        value={expiryPeriodType === 'Not Applicable' ? '' : expiryPeriod}
                        onChange={(e) => setExpiryPeriod(e.target.value)}
                        placeholder={expiryPeriodType === 'Not Applicable' ? 'Not Applicable' : 'e.g. 6'}
                        className={`w-full bg-slate-900 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl border ${
                          expiryPeriodType === 'Not Applicable' ? 'border-slate-800 opacity-50 cursor-not-allowed bg-slate-950 text-slate-500' : 'border-slate-700'
                        } focus:outline-none focus:border-amber-500 text-xs`}
                      />
                    </div>

                    {/* Dropdown select for unit: Months, Days, Not Applicable */}
                    <div>
                      <select
                        id="prod-select-expiry-type"
                        value={expiryPeriodType}
                        onChange={(e) => {
                          const newType = e.target.value as 'Months' | 'Days' | 'Not Applicable';
                          setExpiryPeriodType(newType);
                          if (newType === 'Not Applicable') {
                            setExpiryPeriod('');
                          }
                        }}
                        className="w-full bg-slate-900 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 text-xs"
                      >
                        <option value="Months">Months</option>
                        <option value="Days">Days</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Warranty Plan Assignment */}
              {Boolean(settings.enableWarranty) && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Assigned Warranty Plan</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Applied automatically upon sale)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenQuickWarrantyModal}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Manage / + Add Warranty</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      id="prod-select-warranty"
                      value={warrantyId}
                      onChange={(e) => setWarrantyId(e.target.value)}
                      className="w-full bg-slate-900 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">No Warranty / Standard Non-Guaranteed</option>
                      {(warranties || []).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.duration} {w.durationType}) {w.status === 'inactive' ? '[Inactive]' : ''}
                        </option>
                      ))}
                    </select>

                    {/* Selected Warranty Info Card */}
                    {warrantyId && (() => {
                      const selectedWar = (warranties || []).find((w) => w.id === warrantyId);
                      if (!selectedWar) return null;
                      return (
                        <div className="flex items-center justify-between p-2.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-indigo-300 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: selectedWar.color || '#10b981' }}
                            />
                            <div>
                              <p className="font-bold">{selectedWar.name}</p>
                              <p className="text-[10px] text-indigo-400/80">
                                Duration: {selectedWar.duration} {selectedWar.durationType}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                            Active Plan
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Physical Storage Topology (Rack, Row & Position) */}
              {Boolean(settings.enableRacks || settings.enableRows || settings.enablePositions) && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-white text-xs">Physical Warehouse Location</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Warehouse Picking Location</span>
                  </div>

                  <div className={`grid grid-cols-1 ${
                    [Boolean(settings.enableRacks), Boolean(settings.enableRows), Boolean(settings.enablePositions)].filter(Boolean).length === 3
                      ? 'sm:grid-cols-3'
                      : [Boolean(settings.enableRacks), Boolean(settings.enableRows), Boolean(settings.enablePositions)].filter(Boolean).length === 2
                      ? 'sm:grid-cols-2'
                      : 'sm:grid-cols-1'
                  } gap-3`}>
                    {Boolean(settings.enableRacks) && (
                      <div>
                        <label className="text-slate-300 font-semibold text-[11px]">Storage Rack Bay</label>
                        <select
                          id="prod-select-rack"
                          value={rack}
                          onChange={(e) => {
                            const newRackName = e.target.value;
                            setRack(newRackName);
                            const matched = (racks || []).find((r) => r.name === newRackName);
                            if (matched) {
                              if (matched.rows && matched.rows.length > 0) setRow(matched.rows[0]);
                              if (matched.positions && matched.positions.length > 0) setPosition(matched.positions[0]);
                            }
                          }}
                          className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1 font-medium text-xs"
                        >
                          <option value="">-- No Rack Assigned --</option>
                          {(racks || []).map((r) => (
                            <option key={r.id} value={r.name}>
                              {r.name} ({r.code}) — {r.zone || 'General'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {Boolean(settings.enableRows) && (
                      <div>
                        <label className="text-slate-300 font-semibold text-[11px]">Row / Shelf Tier</label>
                        {(() => {
                          const matchedRack = (racks || []).find((r) => r.name === rack);
                          const availableRows = matchedRack?.rows || ['Row 1', 'Row 2', 'Row 3', 'Row 4'];
                          return (
                            <select
                              id="prod-select-row"
                              value={row}
                              onChange={(e) => setRow(e.target.value)}
                              className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1 font-medium text-xs"
                            >
                              <option value="">-- Select Row --</option>
                              {availableRows.map((rName) => (
                                <option key={rName} value={rName}>
                                  {rName}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                    )}

                    {Boolean(settings.enablePositions) && (
                      <div>
                        <label className="text-slate-300 font-semibold text-[11px]">Position / Bin Slot</label>
                        {(() => {
                          const matchedRack = (racks || []).find((r) => r.name === rack);
                          const availablePositions = matchedRack?.positions || ['Position 1', 'Position 2', 'Position 3', 'Position 4'];
                          return (
                            <select
                              id="prod-select-pos"
                              value={position}
                              onChange={(e) => setPosition(e.target.value)}
                              className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1 font-medium text-xs"
                            >
                              <option value="">-- Select Position --</option>
                              {availablePositions.map((pName) => (
                                <option key={pName} value={pName}>
                                  {pName}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-slate-300 font-semibold">
                  {Boolean(settings.enableWarranty) ? 'Product Description / Warranty Notes' : 'Product Description'}
                </label>
                <textarea
                  id="prod-input-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={Boolean(settings.enableWarranty) 
                    ? "Enter detailed technical specs, customer warranty conditions, or packaging notes..." 
                    : "Enter detailed technical specs, product description, or packaging notes..."}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Card 1.6: Combo / Bundle Products Configuration */}
          {productType === 'combo' && (
            <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-amber-500/40 shadow-xl space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Combo / Bundle Items Assembly</h3>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        Combo Mode
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Assemble individual products from your inventory into this bundle. Stock and cost are calculated dynamically.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsComboAdvancedSearchOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Advanced Search & Catalog</span>
                  <span className="bg-indigo-800/80 px-1.5 py-0.2 rounded text-[10px] ml-1">
                    {eligibleComboProducts.length}
                  </span>
                </button>
              </div>

              {/* Fast Inline Search Bar with Live Results Dropdown */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Search Inventory Products (by SKU, Name, Brand, Category)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Type to search or browse below</span>
                </div>

                <div className="relative">
                  <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/40 overflow-hidden transition">
                    <div className="pl-3.5 pr-2 text-slate-400 flex items-center justify-center">
                      <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={comboSearchQuery}
                      onChange={(e) => {
                        setComboSearchQuery(e.target.value);
                        setIsComboSearchFocused(true);
                      }}
                      onFocus={() => setIsComboSearchFocused(true)}
                      placeholder="Search product name, SKU (e.g. ELEC-001), barcode, category, brand..."
                      className="w-full bg-transparent text-white placeholder-slate-500 text-xs py-2.5 px-1 focus:outline-none"
                    />
                    {comboSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setComboSearchQuery('')}
                        className="p-1.5 text-slate-400 hover:text-white mr-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsComboAdvancedSearchOpen(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border-l border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Open full catalog modal"
                    >
                      <Filter className="w-3 h-3 text-amber-400" />
                      <span className="hidden sm:inline">Browse</span>
                    </button>
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {isComboSearchFocused && comboSearchQuery.trim().length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsComboSearchFocused(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-72 overflow-y-auto divide-y divide-slate-800">
                        {searchMatchedComboProducts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No inventory products match "{comboSearchQuery}".
                            <button
                              type="button"
                              onClick={() => {
                                setIsComboSearchFocused(false);
                                setIsComboAdvancedSearchOpen(true);
                              }}
                              className="block mx-auto mt-2 text-indigo-400 hover:underline font-semibold"
                            >
                              Open Advanced Search Catalog
                            </button>
                          </div>
                        ) : (
                          searchMatchedComboProducts.map((p) => {
                            const isAlreadyIn = comboItems.some((ci) => ci.productId === p.id);
                            const existingItem = comboItems.find((ci) => ci.productId === p.id);
                            const stockVal = Number(p.currentStock ?? p.stock) || 0;

                            return (
                              <div
                                key={p.id}
                                className="p-3 hover:bg-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition"
                                onClick={() => {
                                  addProductToCombo(p, 1);
                                  setIsComboSearchFocused(false);
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {p.image ? (
                                    <img
                                      src={p.image}
                                      alt={p.name}
                                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                      <Package className="w-5 h-5 text-slate-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-xs truncate">{p.name}</span>
                                      {p.brand && (
                                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                                          {p.brand}
                                        </span>
                                      )}
                                      {p.category && (
                                        <span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-800/40">
                                          {p.category}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                      <span className="font-mono text-slate-300 font-semibold">SKU: {p.sku}</span>
                                      <span>•</span>
                                      <span>Cost: <strong className="text-slate-200">{formatCurrency(p.costPrice || 0, settings)}</strong></span>
                                      <span>•</span>
                                      <span>Price: <strong className="text-emerald-400">{formatCurrency(p.sellingPrice || 0, settings)}</strong></span>
                                      <span>•</span>
                                      <span className={stockVal > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                        Stock: {stockVal} {p.unit || 'pcs'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                  {isAlreadyIn ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold rounded-lg">
                                      <Check className="w-3 h-3" />
                                      <span>In Bundle ({existingItem?.quantity}) +1</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addProductToCombo(p, 1);
                                        setIsComboSearchFocused(false);
                                      }}
                                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow transition cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Combo Items Assembly Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-2">
                    <span>Bundled Component Items ({comboItems.length})</span>
                    {comboItems.length > 0 && (
                      <span className="text-[11px] text-amber-400 font-normal">
                        ({comboItems.reduce((sum, ci) => sum + (Number(ci.quantity) || 1), 0)} total units)
                      </span>
                    )}
                  </span>
                  {comboItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove all items from this combo bundle?')) {
                          setComboItems([]);
                          setCostPrice('0.00');
                          setSellingPrice('0.00');
                        }
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition"
                    >
                      Clear All Items
                    </button>
                  )}
                </div>

                {comboItems.length === 0 ? (
                  <div className="p-8 bg-slate-950 rounded-xl border border-dashed border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">No products added to this bundle yet</p>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                        Use the search bar above or click <strong>"Advanced Search & Catalog"</strong> to search by SKU, Product Name, Brand, or Category and add items into this bundle.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsComboAdvancedSearchOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow transition"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Browse Inventory Catalog</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Item Details</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3 text-right">Unit Cost</th>
                            <th className="py-2.5 px-3 text-right">Unit Price</th>
                            <th className="py-2.5 px-3 text-center w-36">Quantity in Bundle</th>
                            <th className="py-2.5 px-3 text-right">Subtotal Cost</th>
                            <th className="py-2.5 px-3 text-right">Subtotal Price</th>
                            <th className="py-2.5 px-3 text-center w-12">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {comboItems.map((item, idx) => {
                            const prod = (products || []).find((p) => p.id === item.productId);
                            const itemCost = item.costPrice !== undefined ? Number(item.costPrice) : (Number(prod?.costPrice) || 0);
                            const itemPrice = Number(item.unitPrice) || 0;
                            const qty = Number(item.quantity) || 1;
                            const totalItemCost = itemCost * qty;
                            const totalItemPrice = itemPrice * qty;

                            return (
                              <tr key={item.productId} className="hover:bg-slate-900/50 transition">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2.5">
                                    {item.image || prod?.image ? (
                                      <img
                                        src={item.image || prod?.image}
                                        alt={item.productName}
                                        className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                        <Package className="w-4 h-4 text-slate-400" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-white">{item.productName}</div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                        {prod?.brand && <span>{prod.brand}</span>}
                                        {prod?.brand && prod?.category && <span>•</span>}
                                        {prod?.category && <span>{prod.category}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-semibold text-slate-300">{item.sku}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-indigo-300">
                                  {formatCurrency(itemCost, settings)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                  {formatCurrency(itemPrice, settings)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => updateComboItemQuantity(idx, qty - 1)}
                                      disabled={qty <= 1}
                                      className="p-1.5 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      value={qty}
                                      onChange={(e) => updateComboItemQuantity(idx, parseInt(e.target.value) || 1)}
                                      className="bg-transparent text-amber-300 font-bold w-12 text-center font-mono text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateComboItemQuantity(idx, qty + 1)}
                                      className="p-1.5 hover:bg-slate-800 text-slate-300 transition"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-400">
                                  {formatCurrency(totalItemCost, settings)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                  {formatCurrency(totalItemPrice, settings)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeComboItem(idx)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition cursor-pointer"
                                    title="Remove from bundle"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Live Summary Strip for Bundle Assembly */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Total Bundle Items</div>
                          <div className="text-xs font-bold text-white">
                            {comboItems.length} Products ({comboItems.reduce((s, ci) => s + (Number(ci.quantity) || 1), 0)} Units)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-indigo-400">Total Purchase Cost</div>
                          <div className="text-xs font-bold font-mono text-indigo-300">
                            {settings.currencySymbol} {parseFloat(costPrice || '0').toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-emerald-400">Target Margin (%)</div>
                          <div className="text-xs font-bold font-mono text-emerald-300">
                            {marginInput || '0.0'}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-amber-400">Bundle Selling Price</div>
                          <div className="text-xs font-bold font-mono text-amber-300">
                            {settings.currencySymbol} {parseFloat(sellingPrice || '0').toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Catalog Search Modal for Combo Products */}
          {isComboAdvancedSearchOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Advanced Inventory Search & Bundle Selector</h3>
                      <p className="text-xs text-slate-400">
                        Filter and search products by SKU, Name, Brand, Category or Stock Status to add into bundle
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsComboAdvancedSearchOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter Controls Bar */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  {/* Search Query */}
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Search Keywords</label>
                    <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5">
                      <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        value={comboSearchQuery}
                        onChange={(e) => setComboSearchQuery(e.target.value)}
                        placeholder="Name, SKU, Barcode..."
                        className="w-full bg-transparent text-white focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Category</label>
                    <select
                      value={comboFilterCategory}
                      onChange={(e) => setComboFilterCategory(e.target.value)}
                      className="w-full bg-slate-900 text-white px-2.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Categories</option>
                      {Array.from(new Set(eligibleComboProducts.map((p) => p.category).filter(Boolean))).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Brand</label>
                    <select
                      value={comboFilterBrand}
                      onChange={(e) => setComboFilterBrand(e.target.value)}
                      className="w-full bg-slate-900 text-white px-2.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Brands</option>
                      {Array.from(new Set(eligibleComboProducts.map((p) => p.brand).filter(Boolean))).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Status Filter */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Stock Status</label>
                    <select
                      value={comboFilterStockStatus}
                      onChange={(e) => setComboFilterStockStatus(e.target.value as any)}
                      className="w-full bg-slate-900 text-white px-2.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Stock Statuses</option>
                      <option value="in_stock">In Stock (&gt; 0)</option>
                      <option value="low_stock">Low Stock (≤ Alert)</option>
                      <option value="out_of_stock">Out of Stock (0)</option>
                    </select>
                  </div>
                </div>

                {/* Table of Filtered Products */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllModalProducts}
                        className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {modalSelectedProductIds.length === modalFilteredProducts.length && modalFilteredProducts.length > 0 ? (
                          <>
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                            <span>Deselect All</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-slate-500" />
                            <span>Select All ({modalFilteredProducts.length})</span>
                          </>
                        )}
                      </button>
                      <span>•</span>
                      <span>Showing {modalFilteredProducts.length} matching products</span>
                    </div>

                    {modalSelectedProductIds.length > 0 && (
                      <span className="text-emerald-400 font-bold">
                        {modalSelectedProductIds.length} item(s) selected
                      </span>
                    )}
                  </div>

                  {modalFilteredProducts.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Search className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold">No inventory products found matching the active filters.</p>
                      <p className="text-[11px] text-slate-500">Try clearing or adjusting your search query and filters above.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">
                              <span className="sr-only">Select</span>
                            </th>
                            <th className="py-2.5 px-3">Product Name & Category</th>
                            <th className="py-2.5 px-3">SKU & Barcode</th>
                            <th className="py-2.5 px-3 text-right">Cost Price</th>
                            <th className="py-2.5 px-3 text-right">Selling Price</th>
                            <th className="py-2.5 px-3 text-center">Available Stock</th>
                            <th className="py-2.5 px-3 text-center w-28">Bundle Qty</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {modalFilteredProducts.map((p) => {
                            const isSelected = modalSelectedProductIds.includes(p.id);
                            const isAlreadyInCombo = comboItems.some((ci) => ci.productId === p.id);
                            const currentQty = modalProductQuantities[p.id] || 1;
                            const stockVal = Number(p.currentStock ?? p.stock) || 0;

                            return (
                              <tr
                                key={p.id}
                                className={`hover:bg-slate-900/60 transition cursor-pointer ${
                                  isSelected ? 'bg-indigo-950/20' : ''
                                }`}
                                onClick={() => handleToggleModalProduct(p.id)}
                              >
                                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleModalProduct(p.id)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2.5">
                                    {p.image ? (
                                      <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-9 h-9 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                        <Package className="w-4 h-4 text-slate-400" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-white">{p.name}</div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        {p.brand && <span className="text-slate-300 font-medium">{p.brand}</span>}
                                        {p.brand && p.category && <span>•</span>}
                                        {p.category && (
                                          <span className="bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                                            {p.category}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-semibold text-slate-200">{p.sku}</div>
                                  {p.barcode && <div className="font-mono text-[10px] text-slate-500">{p.barcode}</div>}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-300">
                                  {formatCurrency(p.costPrice || 0, settings)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                  {formatCurrency(p.sellingPrice || 0, settings)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                      stockVal > 0
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                  >
                                    {stockVal} {p.unit || 'pcs'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalProductQuantities((prev) => ({
                                          ...prev,
                                          [p.id]: Math.max(1, currentQty - 1),
                                        }));
                                      }}
                                      disabled={currentQty <= 1}
                                      className="p-1 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      value={currentQty}
                                      onChange={(e) => {
                                        const v = parseInt(e.target.value) || 1;
                                        setModalProductQuantities((prev) => ({
                                          ...prev,
                                          [p.id]: Math.max(1, v),
                                        }));
                                      }}
                                      className="bg-transparent text-amber-300 font-bold w-10 text-center font-mono text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalProductQuantities((prev) => ({
                                          ...prev,
                                          [p.id]: currentQty + 1,
                                        }));
                                      }}
                                      className="p-1 hover:bg-slate-800 text-slate-300"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addProductToCombo(p, currentQty);
                                    }}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 mx-auto cursor-pointer ${
                                      isAlreadyInCombo
                                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                                    }`}
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{isAlreadyInCombo ? 'Add More' : 'Add'}</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal Footer with Batch Actions */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {modalSelectedProductIds.length > 0 ? (
                      <span>
                        <strong>{modalSelectedProductIds.length}</strong> product(s) selected ready to add into bundle.
                      </span>
                    ) : (
                      <span>Select multiple products via checkboxes to add them together in one click.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsComboAdvancedSearchOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSelectedModalProducts}
                      disabled={modalSelectedProductIds.length === 0}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-600/20 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Selected ({modalSelectedProductIds.length}) to Bundle</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Pricing, Tax Group & Profitability Engine */}
          <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pricing & Tax Configuration</h3>
                  <p className="text-[11px] text-slate-400">Cost valuation, retail price, GST slabs, and automated gross margins</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Step 2 of 3
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Tax Group & Tax Type Selection */}
              {settings.enablePriceAndTaxInfo !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2 border-b border-slate-800">
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 font-semibold flex items-center justify-between">
                      <span>Applicable Tax</span>
                      <span className="text-[11px] text-indigo-400 font-mono font-bold">
                        Rate: {taxRate}%
                      </span>
                    </label>
                    <select
                      id="prod-select-tax-group"
                      value={taxGroupId}
                      onChange={(e) => {
                        const gid = e.target.value;
                        setTaxGroupId(gid);
                        const found = (taxGroups || []).find((g) => g.id === gid);
                        if (found) {
                          setTaxRate(found.totalRate.toString());
                          if (taxType === 'exempt' && found.totalRate > 0) {
                            setTaxType('exclusive');
                          }
                        } else {
                          setTaxRate('0');
                        }
                      }}
                      className="w-full bg-slate-950 text-white font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                    >
                      <option value="">None (0% Tax)</option>
                      {(taxGroups || []).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.totalRate}%) {Array.isArray((g as any).rates) ? `[${(g as any).rates.map((r: any) => `${r.name} ${r.rate}%`).join(', ')}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold">Selling Price Tax Type</label>
                    <select
                      id="prod-select-tax-type"
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value as any)}
                      className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1 font-medium capitalize"
                    >
                      <option value="exclusive">
                        Exclusive (Added to price) {numericTaxRate > 0 ? `[+${settings.currencySymbol}${(numericSelling * numericTaxRate / 100).toFixed(2)} Tax]` : ''}
                      </option>
                      <option value="inclusive">
                        Inclusive (Included in price) {numericTaxRate > 0 ? `[${settings.currencySymbol}${(numericSelling - (numericSelling / (1 + numericTaxRate / 100))).toFixed(2)} Tax]` : ''}
                      </option>
                      <option value="exempt">Exempt (0% Nil-Rated)</option>
                    </select>

                    {/* Integrated Live Tax Calculation Display */}
                    {numericTaxRate > 0 && (
                      <div className="mt-2 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-200 space-y-1.5 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-400">Base Selling Price:</span>
                          <span className="font-mono font-bold text-white">
                            {settings.currencySymbol} {taxCalculations.basePrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-400">Calculated Tax Amount ({taxRate}%):</span>
                          <span className="font-mono font-bold text-amber-400">
                            {taxType === 'exempt' ? 'Exempt' : `+${settings.currencySymbol} ${taxCalculations.taxAmount.toFixed(2)} (${taxType === 'inclusive' ? 'Included' : 'Excluded'})`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-indigo-900/40 pt-1.5 mt-1">
                          <span className="font-extrabold text-slate-200">Customer Checkout Price:</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {settings.currencySymbol} {taxCalculations.finalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cost & Selling Price Inputs - Shown only for Single & Combo products (Variable products use individual prices in Variation Table) */}
              {productType !== 'variable' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
                  {/* COLUMN 1: Cost Price (Default Purchase Price) - Disabled for Combo, Enabled ONLY for Single Product */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${productType === 'single' ? 'text-indigo-400' : 'text-slate-500'}`}>
                        <span>Default Purchase Price</span>
                        {productType !== 'single' && <Lock className="w-3 h-3 text-slate-500" />}
                      </span>
                      {productType === 'combo' && (
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Auto from combo items
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className={`text-[11px] font-semibold block mb-1 ${productType === 'single' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Exc. Tax ({settings.currencySymbol}) {productType === 'single' ? '*' : ''}
                        </label>
                        <div className={`flex items-center rounded-xl border ${productType !== 'single' ? 'border-slate-800 bg-slate-900/50 opacity-60 cursor-not-allowed' : fieldErrors.costPrice ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition`}>
                          <input
                            id="prod-input-cost-price"
                            required={productType === 'single'}
                            disabled={productType !== 'single'}
                            type="number"
                            step="0.01"
                            min="0"
                            value={costPrice}
                            onChange={(e) => {
                              handleCostPriceExcTaxChange(e.target.value);
                              if (fieldErrors.costPrice) setFieldErrors(prev => ({ ...prev, costPrice: '' }));
                            }}
                            onPaste={(e) => {
                              if (productType === 'single') {
                                const pastedText = e.clipboardData.getData('text');
                                handleCostPriceExcTaxPaste(pastedText);
                              }
                            }}
                            placeholder="0.00"
                            className="w-full bg-transparent text-indigo-400 font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <FormFieldError error={fieldErrors.costPrice} />
                      </div>

                      <div>
                        <label className={`text-[11px] font-semibold block mb-1 ${productType === 'single' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Inc. Tax ({settings.currencySymbol})
                        </label>
                        <div className={`flex items-center rounded-xl border ${productType !== 'single' ? 'border-slate-800 bg-slate-900/50 opacity-60 cursor-not-allowed' : 'border-slate-700'} bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition`}>
                          <input
                            id="prod-input-cost-price-inc-tax"
                            disabled={productType !== 'single'}
                            type="number"
                            step="0.01"
                            min="0"
                            value={calculatedCostPriceIncTax > 0 ? calculatedCostPriceIncTax.toFixed(2) : ''}
                            onChange={(e) => handleCostPriceIncTaxChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent text-indigo-400/80 font-mono font-semibold text-sm px-3.5 py-2.5 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>
                    {productType === 'combo' && (
                      <p className="text-[10px] text-slate-500 italic leading-tight">
                        * Purchase cost is locked and automatically calculated from the individual component products in the combo bundle.
                      </p>
                    )}
                  </div>

                  {/* COLUMN 2: Margin % - Enabled for Single and Combo Products */}
                  <div className="md:col-span-2 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-2">
                      Margin
                    </span>
                    <div>
                      <label className="text-[11px] font-semibold block mb-1 text-slate-300">
                        Profit Margin (%) {productType === 'single' ? '*' : ''}
                      </label>
                      <div className="flex items-center rounded-xl border border-emerald-500/40 bg-slate-950 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 transition">
                        <input
                          id="prod-input-margin"
                          required={productType === 'single'}
                          type="number"
                          step="0.1"
                          value={marginInput}
                          onChange={(e) => handleMarginChange(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-transparent text-emerald-400 font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      {productType === 'combo' ? (
                        <p className="text-[10px] text-indigo-300 mt-1 italic leading-tight">
                          * Dynamically updates selling price based on total component cost + profit margin.
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                          * Calculates selling price based on cost price.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* COLUMN 3: Default Selling Price */}
                  <div className="md:col-span-5 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-2">
                      Default Selling Price
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Exc. Tax ({settings.currencySymbol}) *
                        </label>
                        <div className={`flex items-center rounded-xl border ${fieldErrors.sellingPrice ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition`}>
                          <input
                            id="prod-input-selling-price"
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            value={sellingPrice === '0' ? '' : sellingPrice}
                            onChange={(e) => {
                              handleSellingPriceExcTaxChange(e.target.value);
                              if (fieldErrors.sellingPrice) setFieldErrors(prev => ({ ...prev, sellingPrice: '' }));
                            }}
                            placeholder="0.00"
                            className="w-full bg-transparent text-white font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <FormFieldError error={fieldErrors.sellingPrice} />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Inc. Tax ({settings.currencySymbol})
                        </label>
                        <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition">
                          <input
                            id="prod-input-selling-price-inc-tax"
                            type="number"
                            step="0.01"
                            min="0"
                            value={calculatedSellingPriceIncTax > 0 ? parseFloat(calculatedSellingPriceIncTax.toFixed(2)) : ''}
                            onChange={(e) => handleSellingPriceIncTaxChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent text-white font-mono font-semibold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Variation SKU Format & Variation Table Section (When Variable Product is Selected) */}
              {productType === 'variable' && (
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-5">
                  {/* Variation SKU Format Radio Selection */}
                  <div className="space-y-2 pb-3 border-b border-slate-800">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>Variation SKU Format</span>
                      <Info className="w-3.5 h-3.5 text-sky-400" />
                    </label>
                    <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="skuFormat"
                          value="sku_number"
                          checked={variationSkuFormat === 'sku_number'}
                          onChange={() => setVariationSkuFormat('sku_number')}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-slate-200">SKU-Number (Example -&gt; ABC-1, ABC-2)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="skuFormat"
                          value="sku_variation"
                          checked={variationSkuFormat === 'sku_variation'}
                          onChange={() => setVariationSkuFormat('sku_variation')}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-slate-200">SKUVariation (Example -&gt; ABCS, ABCM)</span>
                      </label>
                    </div>
                  </div>

                  {/* Add Variation Header with Plus Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Add Variation:*</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = `${(selectedVariationValues.length + 1) * 3}`;
                          if (!selectedVariationValues.includes(nextVal)) {
                            setSelectedVariationValues([...selectedVariationValues, nextVal]);
                          }
                        }}
                        className="w-7 h-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold text-base shadow-md transition active:scale-95 cursor-pointer"
                        title="Add Variation Value"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">Configure cost prices, profit margins, selling prices, SKUs & images per variation</span>
                  </div>

                  {/* Green Banner Variation Table */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                    {/* Green Header Banner (#4caf50) */}
                    <div className="bg-[#4caf50] text-white font-extrabold text-xs grid grid-cols-1 md:grid-cols-12 divide-x divide-emerald-500/50 py-2.5 px-4">
                      <div className="md:col-span-3">Variation</div>
                      <div className="md:col-span-9 pl-4">Variation Values</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950">
                      
                      {/* LEFT COLUMN: Variation Attribute Selector & Chips */}
                      <div className="md:col-span-3 p-4 space-y-4 bg-slate-900/60">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Clear variation values?')) {
                                setSelectedVariationValues([]);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg border border-rose-900/40 transition cursor-pointer"
                            title="Delete Variation Set"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <select
                            id="prod-select-variation-type"
                            value={selectedVariationName}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              if (val === 'Custom') {
                                const customName = prompt('Enter custom variation name (e.g. Storage, Material, Model):');
                                if (customName && customName.trim()) {
                                  setSelectedVariationName(customName.trim());
                                  if (selectedVariationValues.length === 0) {
                                    setSelectedVariationValues(['Standard', 'Option 1']);
                                  }
                                }
                                return;
                              }
                              setSelectedVariationName(val);
                              const matchedTmpl = variationTemplates.find(
                                (t) => t.name.toLowerCase() === val.toLowerCase()
                              );
                              if (matchedTmpl && matchedTmpl.values?.length > 0) {
                                setSelectedVariationValues([...matchedTmpl.values]);
                              } else {
                                const commonPresets: Record<string, string[]> = {
                                  'phase type': ['Single Phase', 'Three Phase', 'two phase'],
                                  'cable length': ['1 Meter', '3 Meter', '5 Meter', '10 Meter'],
                                  'wire gauge / thickness': ['1.5 sq mm', '2.5 sq mm', '4.0 sq mm'],
                                  'voltage rating': ['110V', '220V', '440V'],
                                  'size': ['Small', 'Medium', 'Large', 'XL'],
                                  'color': ['Red', 'Blue', 'Black', 'White'],
                                  'flavor': ['Vanilla', 'Chocolate', 'Strawberry'],
                                  'material / conductor': ['Copper', 'Aluminum', 'Brass'],
                                  'dram / storage capacity': ['128GB', '256GB', '512GB', '1TB NVMe'],
                                };
                                const presetValues = commonPresets[val.toLowerCase()];
                                if (presetValues && presetValues.length > 0) {
                                  setSelectedVariationValues([...presetValues]);
                                } else if (selectedVariationValues.length === 0) {
                                  setSelectedVariationValues(['Option 1', 'Option 2']);
                                }
                              }
                            }}
                            className="w-full bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="">-- Select Variation Type --</option>
                            <option value="Phase Type">Phase Type</option>
                            <option value="Cable Length">Cable Length</option>
                            <option value="Wire Gauge / Thickness">Wire Gauge / Thickness</option>
                            <option value="Voltage Rating">Voltage Rating</option>
                            <option value="Size">Size</option>
                            <option value="Color">Color</option>
                            <option value="Flavor">Flavor</option>
                            <option value="Material / Conductor">Material / Conductor</option>
                            <option value="DRAM / Storage Capacity">DRAM / Storage Capacity</option>
                            {variationTemplates
                              .filter((t) => !['phase type', 'cable length', 'wire gauge / thickness', 'voltage rating', 'size', 'color', 'flavor', 'material / conductor', 'dram / storage capacity'].includes(t.name.toLowerCase()))
                              .map((tmpl) => (
                                <option key={tmpl.id} value={tmpl.name}>
                                  {tmpl.name}
                                </option>
                              ))}
                            {selectedVariationName &&
                              !['Phase Type', 'Cable Length', 'Wire Gauge / Thickness', 'Voltage Rating', 'Size', 'Color', 'Flavor', 'Material / Conductor', 'DRAM / Storage Capacity'].some(
                                (def) => def.toLowerCase() === selectedVariationName.toLowerCase()
                              ) &&
                              !variationTemplates.some((t) => t.name.toLowerCase() === selectedVariationName.toLowerCase()) && (
                                <option value={selectedVariationName}>{selectedVariationName}</option>
                              )}
                            <option value="Custom">+ Custom Attribute...</option>
                          </select>
                        </div>

                        {/* Select Variation Values Chips Section */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-200 block">
                            Select variation values
                          </label>

                          {/* Selected Value Pills / Chips matching scr.png */}
                          <div className="flex flex-wrap gap-1.5">
                            {selectedVariationValues.map((val) => (
                              <span
                                key={val}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0088cc] text-white font-bold text-xs rounded-lg shadow-sm"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVariationValues(selectedVariationValues.filter((v) => v !== val));
                                  }}
                                  className="hover:text-amber-200 transition font-black text-sm leading-none cursor-pointer"
                                >
                                  &times;
                                </button>
                                <span>{val}</span>
                              </span>
                            ))}
                          </div>

                          {/* Quick Add Custom Value Input */}
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              placeholder="Type custom value..."
                              value={newValueInput}
                              onChange={(e) => setNewValueInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newValueInput.trim() && !selectedVariationValues.includes(newValueInput.trim())) {
                                    setSelectedVariationValues([...selectedVariationValues, newValueInput.trim()]);
                                    setNewValueInput('');
                                  }
                                }
                              }}
                              className="w-full bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newValueInput.trim() && !selectedVariationValues.includes(newValueInput.trim())) {
                                  setSelectedVariationValues([...selectedVariationValues, newValueInput.trim()]);
                                  setNewValueInput('');
                                }
                              }}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shrink-0 transition cursor-pointer"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Variation Values Table with Blue Subheader */}
                      <div className="md:col-span-9 p-0 overflow-x-auto">
                        {/* Blue Subheader Banner (#0088cc) */}
                        <div className="bg-[#0088cc] text-white font-extrabold text-xs py-2.5 px-4 shadow-sm">
                          <span>Variation Values</span>
                        </div>

                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-300 text-[11px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3 min-w-[80px]">Value</th>
                              <th className="py-2.5 px-3 min-w-[120px]">SKU</th>
                              <th className="py-2.5 px-3 min-w-[210px] text-center">
                                <div className="text-[11px] font-bold pb-1 border-b border-slate-800 mb-1">Default Purchase Price</div>
                                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-semibold text-slate-400">
                                  <span>Exc. Tax</span>
                                  <span className="flex items-center justify-center gap-0.5">
                                    <span>Inc. Tax</span>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  </span>
                                </div>
                              </th>
                              <th className="py-2.5 px-3 min-w-[90px] text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span>x Margin(%)</span>
                                </div>
                              </th>
                              <th className="py-2.5 px-3 min-w-[210px] text-center">
                                <div className="text-[11px] font-bold pb-1 border-b border-slate-800 mb-1">Default Selling Price</div>
                                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-semibold text-slate-400">
                                  <span>Exc. Tax</span>
                                  <span className="flex items-center justify-center gap-0.5">
                                    <span>Inc. Tax</span>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  </span>
                                </div>
                              </th>
                              <th className="py-2.5 px-3 min-w-[100px] text-center">
                                Opening Stock Qty
                              </th>
                              <th className="py-2.5 px-3 min-w-[100px] text-center">
                                Low Stock Alert
                              </th>
                              <th className="py-2.5 px-3 min-w-[150px]">Variation Images</th>
                              <th className="py-2.5 px-3 text-center min-w-[50px]">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {selectedVariationValues.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="py-8 text-center text-slate-400">
                                  <div className="flex flex-col items-center gap-2">
                                    <Info className="w-6 h-6 text-slate-500" />
                                    <span className="font-semibold text-slate-300">No variation values selected for "{selectedVariationName || 'Variation'}".</span>
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentName = selectedVariationName || 'Phase Type';
                                          const matched = variationTemplates.find(t => t.name.toLowerCase() === currentName.toLowerCase());
                                          if (matched && matched.values?.length > 0) {
                                            setSelectedVariationValues([...matched.values]);
                                          } else {
                                            const presets: Record<string, string[]> = {
                                              'phase type': ['Single Phase', 'Three Phase', 'two phase'],
                                              'cable length': ['1 Meter', '3 Meter', '5 Meter', '10 Meter'],
                                              'wire gauge / thickness': ['1.5 sq mm', '2.5 sq mm', '4.0 sq mm'],
                                              'voltage rating': ['110V', '220V', '440V'],
                                              'size': ['Small', 'Medium', 'Large', 'XL'],
                                              'color': ['Red', 'Blue', 'Black', 'White'],
                                              'flavor': ['Vanilla', 'Chocolate', 'Strawberry'],
                                              'material / conductor': ['Copper', 'Aluminum', 'Brass'],
                                              'dram / storage capacity': ['128GB', '256GB', '512GB', '1TB NVMe'],
                                            };
                                            const defVals = presets[currentName.toLowerCase()] || ['Option 1', 'Option 2', 'Option 3'];
                                            setSelectedVariationValues(defVals);
                                          }
                                        }}
                                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer"
                                      >
                                        + Load Default Values for {selectedVariationName || 'Variation'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newVal = `Option ${selectedVariationValues.length + 1}`;
                                          setSelectedVariationValues([...selectedVariationValues, newVal]);
                                        }}
                                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                                      >
                                        + Add Single Value
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              selectedVariationValues.map((val, idx) => {
                                const varSku = variationSkuFormat === 'sku_number'
                                  ? `${sku || 'SKU'}-${idx + 1}`
                                  : `${sku || 'SKU'}${val.replace(/[^a-zA-Z0-9]/g, '')}`;

                                const effectiveTaxRate = taxType === 'exempt' ? 0 : (parseFloat(taxRate) || 0);

                                const baseCostExc = parseFloat(variationCostsExc[val] !== undefined ? variationCostsExc[val] : ((idx + 1) * 20 + 80).toString()) || 100;
                                const currentCostInc = effectiveTaxRate > 0 ? (baseCostExc * (1 + effectiveTaxRate / 100)) : baseCostExc;

                                const currentMargin = parseFloat(variationMargins[val] !== undefined ? variationMargins[val] : (marginInput || '25')) || 25;

                                const currentSellingExc = baseCostExc * (1 + currentMargin / 100);
                                const currentSellingInc = effectiveTaxRate > 0 ? (currentSellingExc * (1 + effectiveTaxRate / 100)) : currentSellingExc;

                                return (
                                  <tr key={val} className="hover:bg-slate-900/60 transition">
                                    {/* Value Badge */}
                                    <td className="py-2 px-3 font-bold text-white">
                                      <span className="inline-block px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-xs font-mono">
                                        {val}
                                      </span>
                                    </td>

                                    {/* SKU */}
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        value={variationSkus[val] !== undefined ? variationSkus[val] : varSku}
                                        onChange={(e) => {
                                          const valStr = e.target.value;
                                          setVariationSkus(prev => ({ ...prev, [val]: valStr }));
                                        }}
                                        className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded border border-slate-700 font-mono font-medium focus:outline-none focus:border-indigo-500"
                                      />
                                    </td>

                                    {/* Default Purchase Price (Exc. Tax & Inc. Tax) */}
                                    <td className="py-2 px-2">
                                      <div className="grid grid-cols-2 gap-1.5 items-center">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={variationCostsExc[val] !== undefined ? variationCostsExc[val] : baseCostExc.toFixed(2)}
                                          onChange={(e) => {
                                            const valStr = e.target.value;
                                            setVariationCostsExc(prev => ({ ...prev, [val]: valStr }));
                                          }}
                                          placeholder="0.00"
                                          className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded border border-slate-700 font-mono font-bold text-right focus:outline-none focus:border-indigo-500"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={currentCostInc.toFixed(2)}
                                          onChange={(e) => {
                                            const incVal = parseFloat(e.target.value) || 0;
                                            const calcExc = effectiveTaxRate > 0 ? (incVal / (1 + effectiveTaxRate / 100)) : incVal;
                                            setVariationCostsExc(prev => ({ ...prev, [val]: calcExc.toFixed(2) }));
                                          }}
                                          placeholder="0.00"
                                          className="w-full bg-slate-950 text-indigo-300 text-xs px-2 py-1.5 rounded border border-slate-700 font-mono font-bold text-right focus:outline-none focus:border-indigo-500"
                                        />
                                      </div>
                                    </td>

                                    {/* Profit Margin (%) */}
                                    <td className="py-2 px-2">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={variationMargins[val] !== undefined ? variationMargins[val] : currentMargin.toString()}
                                        onChange={(e) => {
                                          setVariationMargins(prev => ({ ...prev, [val]: e.target.value }));
                                        }}
                                        className="w-16 bg-slate-950 text-emerald-400 text-xs px-2 py-1.5 rounded border border-slate-700 font-mono font-bold text-right focus:outline-none focus:border-indigo-500 mx-auto block"
                                      />
                                    </td>

                                    {/* Default Selling Price (Exc. Tax & Inc. Tax) */}
                                    <td className="py-2 px-2">
                                      <div className="grid grid-cols-2 gap-1.5 items-center">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={currentSellingExc.toFixed(2)}
                                          onChange={(e) => {
                                            const sExc = parseFloat(e.target.value) || 0;
                                            const costE = baseCostExc || 1;
                                            const newMargin = (((sExc - costE) / costE) * 100).toFixed(1);
                                            setVariationMargins(prev => ({ ...prev, [val]: newMargin }));
                                          }}
                                          placeholder="0.00"
                                          className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded border border-slate-700 font-mono font-bold text-right focus:outline-none focus:border-indigo-500"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={currentSellingInc > 0 ? parseFloat(currentSellingInc.toFixed(2)) : ''}
                                          onChange={(e) => {
                                            const sInc = parseFloat(e.target.value) || 0;
                                            const sExc = effectiveTaxRate > 0 ? (sInc / (1 + effectiveTaxRate / 100)) : sInc;
                                            const costE = baseCostExc || 1;
                                            const newMargin = (((sExc - costE) / costE) * 100).toFixed(1);
                                            setVariationMargins(prev => ({ ...prev, [val]: newMargin }));
                                          }}
                                          placeholder="0.00"
                                          className="w-full bg-slate-950 text-indigo-400 text-xs px-2 py-1.5 rounded border border-slate-700 font-mono font-extrabold text-right focus:outline-none focus:border-indigo-500"
                                        />
                                      </div>
                                    </td>

                                    {/* Opening Stock Quantity */}
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="10"
                                        value={variationOpeningStocks[val] !== undefined ? variationOpeningStocks[val] : '10'}
                                        onChange={(e) => {
                                          setVariationOpeningStocks({
                                            ...variationOpeningStocks,
                                            [val]: e.target.value
                                          });
                                        }}
                                        className="w-24 bg-slate-950 text-amber-300 font-mono font-bold text-xs px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-indigo-500"
                                      />
                                    </td>

                                    {/* Low Stock Alert Threshold */}
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="5"
                                        value={variationAlertQuantities[val] !== undefined ? variationAlertQuantities[val] : (alertQuantity || '5')}
                                        onChange={(e) => {
                                          setVariationAlertQuantities({
                                            ...variationAlertQuantities,
                                            [val]: e.target.value
                                          });
                                        }}
                                        className="w-24 bg-slate-950 text-rose-300 font-mono font-bold text-xs px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-indigo-500"
                                      />
                                    </td>

                                    {/* Variation Images Upload */}
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold cursor-pointer transition shrink-0">
                                          <span>Browse...</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (loadEvt) => {
                                                  const res = loadEvt.target?.result as string;
                                                  if (res) {
                                                    setVariationImages(prev => ({ ...prev, [val]: res }));
                                                    showFlashNotification(`Variation image attached for ${val}`, 'success');
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={variationImages[val] ? 'Custom image uploaded' : 'No file chosen'}>
                                          {variationImages[val] ? 'Image selected' : 'No files selected.'}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Delete Row Button */}
                                    <td className="py-2 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedVariationValues(selectedVariationValues.filter((v) => v !== val));
                                        }}
                                        className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition mx-auto cursor-pointer"
                                        title="Remove Row"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Inventory and Batch details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`font-semibold block mb-1.5 text-xs ${productType !== 'single' ? 'text-slate-500' : 'text-slate-300'}`}>
                    Batch / Lot Number {productType === 'single' ? '*' : ''}
                    {productType === 'combo' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-2">(Tracked on component items)</span>
                    )}
                    {productType === 'variable' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-2">(Managed per variation)</span>
                    )}
                  </label>
                  <div className={`flex items-center rounded-xl border ${productType !== 'single' ? 'border-slate-800 bg-slate-900/50 opacity-60' : 'border-slate-700'} bg-slate-950 overflow-hidden focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/50 transition`}>
                    <div className={`px-3 py-2.5 shrink-0 flex items-center justify-center min-w-[36px] ${productType !== 'single' ? 'bg-slate-900 text-slate-600 border-r border-slate-800' : 'bg-slate-900 border-r border-slate-800 text-amber-400'}`}>
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="prod-input-lot-number"
                      required={productType === 'single'}
                      disabled={productType !== 'single'}
                      type="text"
                      value={productType !== 'single' ? '' : lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                      placeholder={productType === 'combo' ? 'N/A (Combo Bundle)' : productType === 'variable' ? 'N/A (Managed per variation)' : 'LOT-2024-001'}
                      className="w-full bg-transparent text-white font-mono font-bold text-sm px-3 py-2.5 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                    {productType === 'combo'
                      ? '* Batch / Lot tracking is maintained on individual bundled component items.'
                      : productType === 'variable'
                      ? '* Batch / Lot tracking is captured per line item in the variation table.'
                      : '* Unique batch/lot tracking number for opening stock.'}
                  </p>
                </div>

                <div>
                  <label className={`font-semibold block mb-1.5 text-xs ${productType !== 'single' ? 'text-slate-500' : 'text-slate-300'}`}>
                    {isEditMode ? 'Allocated Stock for this Batch (Lot) *' : 'Opening Stock Quantity *'}
                    {productType === 'combo' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-2">(Dynamic from combo items)</span>
                    )}
                    {productType === 'variable' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-2">(Managed per variation)</span>
                    )}
                  </label>
                  <div className={`flex items-center rounded-xl border ${productType !== 'single' ? 'border-slate-800 bg-slate-900/50 opacity-60' : 'border-indigo-500/30 bg-indigo-500/5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50'} overflow-hidden transition`}>
                    <div className={`px-3 py-2.5 shrink-0 flex items-center justify-center ${productType !== 'single' ? 'bg-slate-900 text-slate-600 border-r border-slate-800' : 'bg-indigo-500/10 border-r border-indigo-500/20 text-indigo-400'}`}>
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="prod-input-initial-lot-stock"
                      required={productType === 'single'}
                      disabled={productType !== 'single'}
                      type="number"
                      min="0"
                      value={productType !== 'single' ? '' : initialLotStock}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInitialLotStock(val);
                        const numVal = Math.max(0, parseFloat(val) || 0);

                        // Synchronize lots
                        setLots((prevLots) => {
                          if (!prevLots || prevLots.length === 0) {
                            return [{
                              id: `lot_init_${productToEdit?.id || Date.now()}`,
                              lotNumber: lotNumber.trim() || `LOT-${new Date().getFullYear()}-001`,
                              costPrice: parseFloat(costPrice) || 0,
                              sellingPrice: parseFloat(sellingPrice) || 0,
                              initialStock: numVal,
                              currentStock: numVal,
                              createdDate: new Date().toISOString().slice(0, 10),
                              source: 'opening_stock',
                            }];
                          }
                          return prevLots.map((l, idx) => (idx === 0 || l.lotNumber === lotNumber ? { ...l, currentStock: numVal } : l));
                        });

                        // Synchronize location stocks
                        setLocationStocks((prev) => {
                          const updated = { ...prev };
                          const targetLocIds = selectedBranchIds.length > 0 ? selectedBranchIds : (locations.length > 0 ? locations.map(l => l.id) : Object.keys(updated));
                          targetLocIds.forEach(locId => {
                            updated[locId] = numVal;
                          });
                          return updated;
                        });
                      }}
                      placeholder={productType === 'combo' ? 'N/A (Combo Bundle)' : productType === 'variable' ? 'N/A (Managed per variation)' : '0'}
                      className="w-full bg-transparent text-white font-mono font-bold text-sm px-3 py-2.5 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                    {productType === 'combo'
                      ? '* Opening stock is derived dynamically in real-time from the available stock of its component products.'
                      : productType === 'variable'
                      ? '* Opening stock quantity is disabled here and captured per line item in the variation table below.'
                      : isEditMode ? '* Enter stock specifically for this price batch.' : '* This sets the initial stock in your primary location.'}
                  </p>
                </div>

                <div>
                  <label className={`font-semibold block mb-1.5 ${productType !== 'single' ? 'text-slate-500' : 'text-slate-300'}`}>
                    Low Stock Alert Threshold
                    {productType === 'combo' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-2">(Tracked on component items)</span>
                    )}
                    {productType === 'variable' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-2">(Managed per variation)</span>
                    )}
                  </label>
                  <div className={`flex items-center rounded-xl border ${productType !== 'single' ? 'border-slate-800 bg-slate-900/50 opacity-60' : fieldErrors.alertQuantity ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} bg-slate-950 overflow-hidden transition`}>
                    <input
                      id="prod-input-alert-qty"
                      disabled={productType !== 'single'}
                      type="number"
                      min="0"
                      value={productType !== 'single' ? '' : alertQuantity}
                      onChange={(e) => {
                        setAlertQuantity(e.target.value);
                        if (fieldErrors.alertQuantity) setFieldErrors(prev => ({ ...prev, alertQuantity: '' }));
                      }}
                      placeholder={productType === 'combo' ? 'N/A (Combo Bundle)' : productType === 'variable' ? 'N/A (Managed per variation)' : '10'}
                      className="w-full bg-transparent text-amber-300 font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="bg-slate-900 border-l border-slate-800 px-3 py-2.5 text-slate-400 font-semibold text-xs select-none shrink-0">
                      {unit}
                    </div>
                  </div>
                  <FormFieldError error={fieldErrors.alertQuantity} />
                  <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                    {productType === 'combo'
                      ? '* Low stock alerts are tracked directly on the individual bundled component items.'
                      : productType === 'variable'
                      ? '* Low stock threshold is disabled here and captured per line item in the variation table below.'
                      : '* Triggers a warning when current stock drops below this level.'}
                  </p>
                </div>
              </div>


              {/* Tax Summary Breakdown Card */}
              {settings.enablePriceAndTaxInfo !== false && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs text-indigo-200 gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                      Base: <strong>{settings.currencySymbol} {taxCalculations.basePrice.toFixed(2)}</strong> + Tax: <strong>{settings.currencySymbol} {taxCalculations.taxAmount.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="font-bold text-white">
                    Customer Checkout Price:{' '}
                    <span className="text-indigo-400 font-extrabold text-sm">
                      {settings.currencySymbol} {taxCalculations.finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Display existing lots if in edit mode */}
              {isEditMode && productToEdit && lots && lots.length > 0 && (
                <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Price History & Inventory Batches (Lots)</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Manual & Bulk-Import items editable • Direct Purchase lots locked
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Lot Number</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Cost</th>
                          <th className="py-2.5 px-3 text-right">Selling</th>
                          <th className="py-2.5 px-3 text-center">Stock</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {[...lots].reverse().map((lot) => {
                          const lotEligibility = isLotStockEditable(lot, productToEdit);

                          return (
                            <tr key={lot.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-200">{lot.lotNumber}</td>
                              <td className="py-2.5 px-3 text-slate-400">{lot.createdDate}</td>
                              <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                                {settings.currencySymbol}{lot.costPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-indigo-400 font-mono">
                                {settings.currencySymbol}{lot.sellingPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/80 rounded-lg font-mono font-bold text-slate-200 text-xs shadow-inner">
                                  <span>{lot.currentStock}</span>
                                  <span className="text-[9px] text-slate-400 uppercase font-sans">{unit}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {lotEligibility.allowed ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditLot(lot)}
                                    id={`edit-lot-stock-btn-${lot.id}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 rounded-lg transition-all shadow-sm group cursor-pointer"
                                    title={`Alter or update stock for lot ${lot.lotNumber}`}
                                  >
                                    <Pencil className="w-3 h-3 text-indigo-400 group-hover:text-white transition" />
                                    <span>Edit Stock</span>
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-slate-500 bg-slate-900 border border-slate-800 rounded-lg cursor-not-allowed select-none"
                                    title={lotEligibility.reason || 'Directly purchased items cannot have batch stock manually edited here.'}
                                  >
                                    <Lock className="w-3 h-3 text-slate-500" />
                                    <span>Purchase Locked</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal to Alter or Update Stock of a Lot */}
              {editingLot && (
                <div
                  id="modal-edit-lot-stock"
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
                >
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleUp">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Update Lot Stock Quantity</h3>
                          <p className="text-[11px] text-slate-400 font-mono">Lot: {editingLot.lotNumber}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingLot(null)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Lot Details Summary Box */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Cost Price</span>
                        <span className="text-slate-300 font-mono font-semibold">
                          {settings.currencySymbol}{editingLot.costPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Selling Price</span>
                        <span className="text-indigo-400 font-mono font-bold">
                          {settings.currencySymbol}{editingLot.sellingPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Created Date</span>
                        <span className="text-slate-300">{editingLot.createdDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Recorded Stock</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {editingLot.currentStock} {unit}
                        </span>
                      </div>
                    </div>

                    {/* Stock Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Correct / Updated Stock Quantity ({unit}) *
                      </label>
                      <div className="flex items-center rounded-xl border border-indigo-500/40 bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseInt(editingLotStock) || 0;
                            setEditingLotStock(String(Math.max(0, current - 1)));
                          }}
                          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border-r border-slate-800 transition select-none"
                        >
                          -
                        </button>
                        <input
                          id="input-updated-lot-stock"
                          type="number"
                          min="0"
                          step="1"
                          value={editingLotStock}
                          onChange={(e) => setEditingLotStock(e.target.value)}
                          className="w-full bg-transparent text-white font-mono font-bold text-base text-center py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseInt(editingLotStock) || 0;
                            setEditingLotStock(String(current + 1));
                          }}
                          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border-l border-slate-800 transition select-none"
                        >
                          +
                        </button>
                        <div className="bg-slate-900 border-l border-slate-800 px-3 py-2.5 text-slate-400 font-semibold text-xs select-none shrink-0">
                          {unit}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Update this value if the quantity was entered mistakenly. Total inventory will be synchronized automatically.
                      </p>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingLot(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLotStock}
                        id="btn-save-updated-lot-stock"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Stock</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card: Product Media & Gallery (Moved below Pricing & Tax Configuration for step-wise flow) */}
          <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Product Media & Gallery</h3>
                  <p className="text-[11px] text-slate-400">Product imagery, visual assets, and promotional banners</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Step 3 of 3
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Hidden native file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Drag & Drop Zone or Image Preview Box */}
              {image ? (
                <div className="relative h-36 sm:h-44 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
                  <img
                    src={image}
                    alt={name || 'Product Preview'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Overlay Action Bar */}
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 p-3 text-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload New File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
                      {image.startsWith('data:') ? 'Custom File Uploaded' : 'Web Image URL'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-36 sm:h-44 w-full rounded-xl border-2 border-dashed cursor-pointer transition flex flex-col items-center justify-center p-4 text-center group ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                      : 'border-slate-700 hover:border-indigo-500/70 bg-slate-950/80 hover:bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 mb-2 group-hover:scale-110 transition shadow-md">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white mb-0.5">Click to Upload or Drag & Drop</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, WEBP, GIF, SVG (up to 10MB)</p>
                </div>
              )}

              {/* Direct Upload Button & URL Option */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">
                    Upload Local File or Enter Image Web URL
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300 hover:text-white transition flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>

                    <input
                      id="prod-input-image"
                      type="text"
                      value={image.startsWith('data:') ? '' : image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder={image.startsWith('data:') ? 'Custom file attached' : 'https://...'}
                      className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 transition truncate"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Multi-Location Warehouse Initial Stock Allocation */}
          {settings.enableMultiLocationInventory && (
            <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Multi-Location Warehouse Inventory</h3>
                    <p className="text-[11px] text-slate-400">Opening stock allocation across registered branches and storage hubs</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableLocations.map((loc) => {
                    const currentStockVal = locationStocks[loc.id] ?? 0;
                    const isAssigned = selectedBranchIds.includes(loc.id);
                    return (
                      <div
                        key={loc.id}
                        className={`p-3.5 rounded-xl border transition space-y-2 ${
                          isAssigned
                            ? 'bg-slate-950 border-indigo-500/40 ring-1 ring-indigo-500/20'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className={`w-3.5 h-3.5 shrink-0 ${isAssigned ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span className="font-bold text-white text-xs truncate">{loc.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {loc.isDefault && (
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                                Flagship
                              </span>
                            )}
                            {isAssigned ? (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                Active
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium text-slate-500 bg-slate-800/80 px-1.5 py-0.2 rounded">
                                Excluded
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={currentStockVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLocationStocks((prev) => ({ ...prev, [loc.id]: Math.max(0, val) }));
                            }}
                            className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-slate-400 text-xs font-semibold shrink-0">{unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Stock Summary Bar */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-500 text-[11px]">Total Opening Stock:</span>
                      <p className="text-base font-black text-white">
                        {totalAllocatedStock} <span className="text-xs text-slate-400 font-normal">{unit}</span>
                      </p>
                    </div>
                    <div className="h-6 w-px bg-slate-800 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 text-[11px]">Asset Valuation (Cost):</span>
                      <p className="text-sm font-bold text-indigo-400">
                        {settings.currencySymbol} {totalStockValuationCost.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px]">Estimated Retail Value:</span>
                    <p className="text-sm font-bold text-indigo-300">
                      {settings.currencySymbol} {totalStockValuationRetail.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Floating Sticky Bottom Bar for instant saving */}
      <div className={`${
        isModal
          ? 'sticky -bottom-4 sm:-bottom-6 md:-bottom-8 -mx-4 sm:-mx-6 md:-mx-8 z-30'
          : 'fixed bottom-0 left-0 right-0 md:left-64 lg:left-72 z-30'
      } backdrop-blur-md border-t py-3.5 px-6 shadow-2xl flex items-center justify-between gap-4 animate-slideUp transition-all ${
        isLight
          ? 'bg-white/95 border-slate-200'
          : 'bg-slate-900/95 border-slate-800'
      }`}>
        <div className="flex items-center gap-3 truncate">
          <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <div className="truncate">
            <span className={`text-xs font-bold truncate block ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {name ? name : 'New Product (Draft)'}
            </span>
            <span className={`text-[10px] font-mono ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              SKU: {sku} • Margin: {marginPercentage}% • Stock: {totalAllocatedStock} {unit}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${
              isLight
                ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-slate-100'
            }`}
          >
            Cancel
          </button>

          {!isEditMode && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hidden sm:flex ${
                isLight
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 hover:border-indigo-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-indigo-500/40 text-indigo-300 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Add Another</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEditMode ? 'Save Changes' : 'Create Product'}</span>
          </button>
        </div>
      </div>

      {/* QUICK ADD MODAL 1: Unit of Measurement */}
      {isQuickUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Quick Add Unit of Measurement</h3>
                  <p className="text-[11px] text-slate-400">Add a new unit and select it instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickUnitModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickUnitError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{quickUnitError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickUnit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Unit Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kilogram, Dozen, Pack, Liter"
                  value={quickUnitName}
                  onChange={(e) => setQuickUnitName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Short Symbol / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kg, doz, pck, ltr"
                  value={quickUnitShortName}
                  onChange={(e) => setQuickUnitShortName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="quick-unit-decimal"
                  checked={quickUnitAllowDecimal}
                  onChange={(e) => setQuickUnitAllowDecimal(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="quick-unit-decimal" className="text-xs text-slate-300 cursor-pointer">
                  Allow fractional/decimal quantities (e.g. 1.5 kg, 0.25 ltr)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickUnitModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Unit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL 2: Category / Sub-Category */}
      {isQuickCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-600/20 rounded-xl text-amber-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {quickCategoryParentId ? 'Quick Add Sub-Category' : 'Quick Add Category'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Create category and apply it immediately</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickCategoryError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{quickCategoryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Home, Organic Staples, Beverages"
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Parent Category (Optional)</label>
                <select
                  value={quickCategoryParentId}
                  onChange={(e) => setQuickCategoryParentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None (Root Category)</option>
                  {(erpCategories || [])
                    .filter((c) => !c.parentId && c.status !== 'inactive')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Parent: {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty (e.g. CAT-SMRT)"
                  value={quickCategoryCode}
                  onChange={(e) => setQuickCategoryCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  value={quickCategoryDescription}
                  onChange={(e) => setQuickCategoryDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL 3: Brand */}
      {isQuickBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-600/20 rounded-xl text-sky-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Quick Add Brand / Manufacturer</h3>
                  <p className="text-[11px] text-slate-400">Register brand and select it automatically</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickBrandModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickBrandError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{quickBrandError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickBrand} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony, Nestlé, Apex Tech, Bose"
                  value={quickBrandName}
                  onChange={(e) => setQuickBrandName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Brand Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BRD-SONY"
                    value={quickBrandCode}
                    onChange={(e) => setQuickBrandCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SONY"
                    value={quickBrandShortCode}
                    onChange={(e) => setQuickBrandShortCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Origin Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Japan, USA"
                    value={quickBrandOriginCountry}
                    onChange={(e) => setQuickBrandOriginCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={quickBrandWebsite}
                    onChange={(e) => setQuickBrandWebsite(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickBrandModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Brand</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL 4: Warranty Plan */}
      {isQuickWarrantyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Quick Add Warranty Plan</h3>
                  <p className="text-[11px] text-slate-400">Configure plan and assign it instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickWarrantyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickWarrantyError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{quickWarrantyError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickWarranty} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Warranty Plan Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 Year Replacement Guarantee, 6 Months Service Warranty"
                  value={quickWarrantyName}
                  onChange={(e) => setQuickWarrantyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Duration Value *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickWarrantyDurationValue}
                    onChange={(e) => setQuickWarrantyDurationValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Duration Type *</label>
                  <select
                    value={quickWarrantyDurationType}
                    onChange={(e) => setQuickWarrantyDurationType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Terms & Policy Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Covers manufacturing defects only. Requires proof of purchase."
                  value={quickWarrantyDescription}
                  onChange={(e) => setQuickWarrantyDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickWarrantyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Warranty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
