import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { optimizeImage } from '../../lib/imageOptimization';
import { formatCurrency } from '../../utils/formatters';
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

const SAMPLE_IMAGE_PRESETS = [
  {
    name: 'Wireless Headphones',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  },
  {
    name: 'Smart Watch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  },
  {
    name: 'Mechanical Keyboard',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  },
  {
    name: 'DSLR Camera Lens',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
  },
  {
    name: 'Leather Sneakers',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  },
  {
    name: 'Artisan Coffee Beans',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
  },
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
    settings,
    taxGroups,
    units,
    categories: erpCategories,
    brands: erpBrands,
    warranties,
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
  const [attributes, setAttributes] = useState<import('../../types/erp').ProductAttribute[]>(
    productToEdit?.attributes || [
      { id: 'attr_1', name: 'Size', values: ['Small', 'Medium', 'Large'] },
      { id: 'attr_2', name: 'Color', values: ['Black', 'White'] },
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLot, setEditingLot] = useState<ProductLot | null>(null);
  const [editingLotStock, setEditingLotStock] = useState<string>('');
  const [showLiveCalculator, setShowLiveCalculator] = useState(() => {
    const saved = localStorage.getItem('erp_live_calc_pref');
    return saved !== 'false'; // Defaults to true if not set
  });

  useEffect(() => {
    localStorage.setItem('erp_live_calc_pref', showLiveCalculator.toString());
  }, [showLiveCalculator]);

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
      if (productToEdit.variations) setVariations(productToEdit.variations);
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

  // Helper: Add Combo Item
  const handleAddComboItem = () => {
    if (!selectedComboProductId) return;
    const targetProd = (products || []).find((p) => p.id === selectedComboProductId);
    if (!targetProd) return;

    if (comboItems.some((ci) => ci.productId === targetProd.id)) {
      setToastMessage(`Product "${targetProd.name}" is already in this bundle.`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const newItem: import('../../types/erp').ComboItem = {
      productId: targetProd.id,
      productName: targetProd.name,
      sku: targetProd.sku,
      quantity: 1,
      unitPrice: targetProd.sellingPrice,
      totalPrice: targetProd.sellingPrice,
    };

    const updatedCombo = [...comboItems, newItem];
    setComboItems(updatedCombo);
    setSelectedComboProductId('');

    // Auto-recalculate bundle cost and selling price
    const sumComponentPrices = updatedCombo.reduce((acc, item) => acc + item.totalPrice, 0);
    setSellingPrice(sumComponentPrices.toFixed(2));
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
    const sellIncVal = parseFloat(valStr) || 0;
    const sellExcVal = sellIncVal / (1 + numericTaxRate / 100);
    setSellingPrice(sellExcVal > 0 ? sellExcVal.toFixed(2) : '');
    
    const excTaxVal = parseFloat(costPrice) || 0;
    if (sellExcVal > 0 && excTaxVal > 0) {
      const calcMargin = (((sellExcVal - excTaxVal) / excTaxVal) * 100).toFixed(1);
      setMarginInput(calcMargin);
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

    if (!name.trim()) {
      setFormError('Product Name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isEditMode) {
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
        setFormError('please enter opening stock for the allocated LOT number');
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

    const finalLots: ProductLot[] = isEditMode
      ? (lots && lots.length > 0
          ? lots.map((l, idx) => (idx === 0 || l.lotNumber === lotNumber) && initialLotStock !== ''
              ? { ...l, currentStock: Math.max(0, Number(initialLotStock) || 0) }
              : l)
          : [
              {
                id: `lot_init_${productToEdit?.id || Date.now()}`,
                lotNumber: lotNumber.trim() || `LOT-${new Date().getFullYear()}-001`,
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
            lotNumber: lotNumber.trim() || `LOT-${new Date().getFullYear()}-001`,
            costPrice: cost,
            sellingPrice: price,
            currentStock: Number(initialLotStock) || totalStockValue,
            createdDate: new Date().toISOString().slice(0, 10),
            source: 'opening_stock',
          }
        ];

    const finalResolvedStock = finalLots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0);

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
      unit,
      costPrice: cost,
      sellingPrice: price,
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
      attributes: productType === 'variable' ? attributes : undefined,
      variations: productType === 'variable' ? variations : undefined,
      comboItems: productType === 'combo' ? comboItems : undefined,
      lots: finalLots,
      manualLotNumber: isEditMode ? undefined : (lotNumber.trim() || undefined),
      initialLotStock: isEditMode ? undefined : (Number(initialLotStock) || 0),
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
    <div className="space-y-6 pb-24 max-w-7xl mx-auto animate-fadeIn">
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
              type="button"
              onClick={() => setShowLiveCalculator(!showLiveCalculator)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                showLiveCalculator 
                  ? (isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' : 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400') 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
              }`}
              title="Toggle Live KPI Calculator"
            >
              <Calculator className={`w-4 h-4 ${showLiveCalculator ? 'animate-pulse' : ''}`} />
              <span>Live Calculator: {showLiveCalculator ? 'ON' : 'OFF'}</span>
            </button>

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

      {/* Form Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Main Inputs */}
        <div className="lg:col-span-8 space-y-6">
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
                    onClick={() => setProductType('variable')}
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
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full descriptive product title..."
                  className="w-full bg-slate-950 text-white font-semibold text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1 placeholder-slate-500"
                />
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
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="w-full bg-slate-950 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1 uppercase"
                  />
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
                      <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                        GST Compliance
                      </span>
                    </label>
                  </div>
                  <input
                    id="prod-input-hsn"
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="e.g. 8528.52 (Audio/Video), 8471 (Computers)"
                    className="w-full bg-slate-950 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                  />
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
                      onClick={() => setInventorySubTab('units')}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Manage Units</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <select
                    id="prod-select-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
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
                </div>
              </div>

              {/* Category, Sub-Category & Brand with Quick Suggestions */}
              {Boolean(settings.enableCategory || settings.enableSubCategory || settings.enableBrand) && (
                <div className={`grid grid-cols-1 ${
                  [Boolean(settings.enableCategory), Boolean(settings.enableSubCategory), Boolean(settings.enableBrand)].filter(Boolean).length === 3
                    ? 'sm:grid-cols-3'
                    : [Boolean(settings.enableCategory), Boolean(settings.enableSubCategory), Boolean(settings.enableBrand)].filter(Boolean).length === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-1'
                } gap-4`}>
                  {/* Category */}
                  {Boolean(settings.enableCategory) && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold">Category</label>
                        <button
                          type="button"
                          onClick={() => setInventorySubTab('categories')}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 font-medium"
                          title="Manage Product Categories"
                        >
                          <span>Manage Categories</span>
                          <ExternalLink className="w-2.5 h-2.5" />
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
                  {Boolean(settings.enableSubCategory) && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold">Sub-Category</label>
                        <button
                          type="button"
                          onClick={() => setInventorySubTab('categories')}
                          className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
                          title="Manage Sub-Categories"
                        >
                          <span>Manage Taxonomy</span>
                          <ExternalLink className="w-2.5 h-2.5" />
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
                  {Boolean(settings.enableBrand) && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold">Brand / Manufacturer</label>
                        <button
                          type="button"
                          onClick={() => setInventorySubTab('brands')}
                          className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <span>Manage Brands</span>
                        </button>
                      </div>
                      <select
                        id="prod-input-brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-slate-950 text-white font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                      >
                        <option value="">Select Brand</option>
                        {(erpBrands && erpBrands.length > 0 ? erpBrands.filter((b) => b.status === 'active') : PRESET_BRANDS.map(b => ({id: b, name: b}))).map((b) => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
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
                      onClick={() => setInventorySubTab('warranties')}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Manage Warranties</span>
                      <ExternalLink className="w-2.5 h-2.5" />
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

          {/* Card 1.5: Variable Product Attributes & Variations Matrix */}
          {productType === 'variable' && (
            <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-purple-500/40 shadow-xl space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Variable Product Attributes & Matrix</h3>
                    <p className="text-[11px] text-slate-400">
                      Configure variation attributes (Size, Color, Flavor, Design) and manage variation combinations
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Variable Mode
                </span>
              </div>

              {/* Attributes Builder */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">1. Define Attributes for this Product</h4>
                  <button
                    type="button"
                    onClick={handleAutoGenerateVariations}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Generate Combinations</span>
                  </button>
                </div>

                {/* Attribute List */}
                <div className="space-y-3">
                  {attributes.map((attr, aIdx) => (
                    <div key={attr.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={attr.name}
                          onChange={(e) => {
                            const newAttrs = [...attributes];
                            newAttrs[aIdx].name = e.target.value;
                            setAttributes(newAttrs);
                          }}
                          placeholder="Attribute Name (e.g. Size, Color, Flavor)"
                          className="bg-slate-950 text-white font-bold text-xs px-2.5 py-1 rounded border border-slate-700 w-48 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setAttributes(attributes.filter((_, idx) => idx !== aIdx))}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        {attr.values.map((val, vIdx) => (
                          <span
                            key={vIdx}
                            className="bg-slate-950 text-slate-300 border border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <span>{val}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newAttrs = [...attributes];
                                newAttrs[aIdx].values = newAttrs[aIdx].values.filter((_, idx) => idx !== vIdx);
                                setAttributes(newAttrs);
                              }}
                              className="text-slate-500 hover:text-rose-400 ml-1"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Quick Add Custom Attribute Inputs */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="New Attr Name (e.g. Design)"
                      value={attrNameInput}
                      onChange={(e) => setAttrNameInput(e.target.value)}
                      className="bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 w-full sm:w-1/3"
                    />
                    <input
                      type="text"
                      placeholder="Values comma separated (e.g. S, M, L, XL)"
                      value={attrValuesInput}
                      onChange={(e) => setAttrValuesInput(e.target.value)}
                      className="bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 w-full sm:w-1/2"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAttribute}
                      className="bg-slate-800 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold w-full sm:w-auto shrink-0 border border-purple-500/30"
                    >
                      + Add Attr
                    </button>
                  </div>
                </div>
              </div>

              {/* Variations Matrix Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>2. Variation Combinations Matrix ({variations.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: import('../../types/erp').ProductVariation = {
                        id: `var_${Date.now()}`,
                        sku: `${sku}-CUSTOM`,
                        barcode: `${barcode.slice(0, 10)}${Math.floor(10 + Math.random() * 89)}`,
                        name: 'Custom Variation',
                        attributes: {},
                        costPrice: parseFloat(costPrice) || 50,
                        sellingPrice: parseFloat(sellingPrice) || 99,
                        currentStock: 10,
                      };
                      setVariations([...variations, newVar]);
                    }}
                    className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Manual Variation Row</span>
                  </button>
                </div>

                {variations.length === 0 ? (
                  <div className="p-6 bg-slate-950 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">No variations generated yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Click "Auto-Generate Combinations" above or add a manual variation row.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Variation Name</th>
                          <th className="py-2.5 px-3">Variation SKU</th>
                          <th className="py-2.5 px-3">Barcode</th>
                          <th className="py-2.5 px-3 w-32">Cost ({settings.currencySymbol || '₹'})</th>
                          <th className="py-2.5 px-3 w-32">Selling ({settings.currencySymbol || '₹'})</th>
                          <th className="py-2.5 px-3 w-20">Stock</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {variations.map((v, idx) => (
                          <tr key={v.id} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-semibold text-white">
                              <input
                                type="text"
                                value={v.name}
                                onChange={(e) => {
                                  const updated = [...variations];
                                  updated[idx].name = e.target.value;
                                  setVariations(updated);
                                }}
                                className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none text-white w-full"
                              />
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-300">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => {
                                  const updated = [...variations];
                                  updated[idx].sku = e.target.value;
                                  setVariations(updated);
                                }}
                                className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none font-mono text-xs w-full text-slate-300"
                              />
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">
                              <input
                                type="text"
                                value={v.barcode}
                                onChange={(e) => {
                                  const updated = [...variations];
                                  updated[idx].barcode = e.target.value;
                                  setVariations(updated);
                                }}
                                className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none font-mono text-xs w-full text-slate-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 overflow-hidden focus-within:border-slate-500 transition">
                                <span className="px-2 py-1 text-slate-400 font-mono text-xs font-bold select-none bg-slate-950 border-r border-slate-800 shrink-0">
                                  {settings.currencySymbol || '₹'}
                                </span>
                                <input
                                  type="number"
                                  value={v.costPrice}
                                  onChange={(e) => {
                                    const updated = [...variations];
                                    updated[idx].costPrice = parseFloat(e.target.value) || 0;
                                    setVariations(updated);
                                  }}
                                  className="bg-transparent text-slate-200 px-2 py-1 w-full font-mono text-right focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 overflow-hidden focus-within:border-indigo-500 transition">
                                <span className="px-2 py-1 text-indigo-400 font-mono text-xs font-bold select-none bg-slate-950 border-r border-slate-800 shrink-0">
                                  {settings.currencySymbol || '₹'}
                                </span>
                                <input
                                  type="number"
                                  value={v.sellingPrice}
                                  onChange={(e) => {
                                    const updated = [...variations];
                                    updated[idx].sellingPrice = parseFloat(e.target.value) || 0;
                                    setVariations(updated);
                                  }}
                                  className="bg-transparent text-indigo-400 font-bold px-2 py-1 w-full font-mono text-right focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={v.currentStock}
                                onChange={(e) => {
                                  const updated = [...variations];
                                  updated[idx].currentStock = parseInt(e.target.value) || 0;
                                  setVariations(updated);
                                }}
                                className="bg-slate-900 border border-slate-700 text-white font-mono px-2 py-1 rounded w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setVariations(variations.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 1.6: Combo / Bundle Products Configuration */}
          {productType === 'combo' && (
            <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-amber-500/40 shadow-xl space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Combo / Bundle Items Assembly</h3>
                    <p className="text-[11px] text-slate-400">
                      Combine multiple individual products from your inventory into a single selling bundle set (e.g. Computer Set)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Combo Mode
                </span>
              </div>

              {/* Add Item to Combo Form */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200">Select Individual Product to Add into Bundle</h4>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedComboProductId}
                    onChange={(e) => setSelectedComboProductId(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Product from Inventory --</option>
                    {(products || [])
                      .filter((p) => p.type !== 'combo' && p.id !== productToEdit?.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) • Price: {settings.currencySymbol || '₹'}{p.sellingPrice} • Stock: {p.currentStock}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddComboItem}
                    disabled={!selectedComboProductId}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add to Combo</span>
                  </button>
                </div>
              </div>

              {/* Combo Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Bundled Items List ({comboItems.length})</span>
                </div>

                {comboItems.length === 0 ? (
                  <div className="p-6 bg-slate-950 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">No products added to this bundle yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Select products from the dropdown above (e.g., Monitor, Keyboard, Mouse, CPU) to build a bundle set.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3 w-28 text-center">Qty in Bundle</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {comboItems.map((item, idx) => (
                          <tr key={item.productId} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-bold text-white">{item.productName}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{item.sku}</td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQty = parseInt(e.target.value) || 1;
                                  const updated = [...comboItems];
                                  updated[idx].quantity = newQty;
                                  updated[idx].totalPrice = updated[idx].unitPrice * newQty;
                                  setComboItems(updated);

                                  const sumComponentPrices = updated.reduce((acc, ci) => acc + ci.totalPrice, 0);
                                  setSellingPrice(sumComponentPrices.toFixed(2));
                                }}
                                className="bg-slate-900 border border-slate-700 text-amber-300 font-bold px-2 py-1 rounded w-16 text-center font-mono"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-300">
                              {formatCurrency(item.unitPrice || 0, settings)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-400">
                              {formatCurrency(item.unitPrice * item.quantity || 0, settings)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = comboItems.filter((_, i) => i !== idx);
                                  setComboItems(updated);
                                  const sumPrices = updated.reduce((acc, ci) => acc + ci.totalPrice, 0);
                                  setSellingPrice(sumPrices.toFixed(2));
                                }}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
              {Boolean(settings.enablePriceAndTaxInfo) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2 border-b border-slate-800">
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 font-semibold flex items-center justify-between">
                      <span>Product Tax</span>
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
                        const found = taxGroups.find((g) => g.id === gid);
                        if (found) {
                          setTaxRate(found.totalRate.toString());
                        } else {
                          setTaxRate('0');
                        }
                      }}
                      className="w-full bg-slate-950 text-white font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 mt-1"
                    >
                      <option value="">Select Tax Attributes</option>
                      {(taxGroups || []).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.totalRate}%) {Array.isArray((g as any).rates) ? `[${(g as any).rates.map((r: any) => `${r.name} ${r.rate}%`).join(', ')}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold">Selling Price Tax</label>
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

              {/* Cost & Selling Price Inputs - Professional Clean Box Styling matching finias POS Columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
                {/* COLUMN 1: Cost Price (Default Purchase Price) */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block border-b border-slate-800 pb-2">
                    Default Purchase Price
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Exc. Tax ({settings.currencySymbol}) *
                      </label>
                      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition">
                        <input
                          id="prod-input-cost-price"
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          value={costPrice}
                          onChange={(e) => handleCostPriceExcTaxChange(e.target.value)}
                          onPaste={(e) => {
                            const pastedText = e.clipboardData.getData('text');
                            handleCostPriceExcTaxPaste(pastedText);
                          }}
                          placeholder="0.00"
                          className="w-full bg-transparent text-indigo-400 font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Inc. Tax ({settings.currencySymbol})
                      </label>
                      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition">
                        <input
                          id="prod-input-cost-price-inc-tax"
                          type="number"
                          step="0.01"
                          min="0"
                          value={calculatedCostPriceIncTax > 0 ? calculatedCostPriceIncTax.toFixed(2) : ''}
                          onChange={(e) => handleCostPriceIncTaxChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent text-indigo-400/80 font-mono font-semibold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Margin % */}
                <div className="md:col-span-2 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2">
                    Margin
                  </span>
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                      Profit Margin (%) *
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition">
                      <input
                        id="prod-input-margin"
                        required
                        type="number"
                        step="0.1"
                        value={marginInput}
                        onChange={(e) => handleMarginChange(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-transparent text-white font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
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
                      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition">
                        <input
                          id="prod-input-selling-price"
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          value={sellingPrice}
                          onChange={(e) => handleSellingPriceExcTaxChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent text-white font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
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
                          value={calculatedSellingPriceIncTax > 0 ? calculatedSellingPriceIncTax.toFixed(2) : ''}
                          onChange={(e) => handleSellingPriceIncTaxChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent text-white font-mono font-semibold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Inventory and Batch details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Batch / Lot Number *
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/50 transition">
                    <div className="bg-slate-900 border-r border-slate-800 px-3 py-2.5 text-amber-400 shrink-0 flex items-center justify-center min-w-[36px]">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="prod-input-lot-number"
                      required
                      type="text"
                      value={lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                      placeholder="LOT-2024-001"
                      className="w-full bg-transparent text-white font-mono font-bold text-sm px-3 py-2.5 focus:outline-none"
                    />
                  </div>
                </div>



                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5 text-xs">
                    {isEditMode ? 'Allocated Stock for this Batch (Lot) *' : 'Opening Stock Quantity *'}
                  </label>
                  <div className="flex items-center rounded-xl border border-indigo-500/30 bg-indigo-500/5 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition">
                    <div className="bg-indigo-500/10 border-r border-indigo-500/20 px-3 py-2.5 text-indigo-400 shrink-0 flex items-center justify-center">
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="prod-input-initial-lot-stock"
                      required
                      type="number"
                      min="0"
                      value={initialLotStock}
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
                      placeholder="0"
                      className="w-full bg-transparent text-white font-mono font-bold text-sm px-3 py-2.5 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                    {isEditMode ? '* Enter stock specifically for this price batch.' : '* This sets the initial stock in your primary location.'}
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Low Stock Alert Threshold</label>
                  <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/50 transition">
                    <input
                      id="prod-input-alert-qty"
                      type="number"
                      min="1"
                      value={alertQuantity}
                      onChange={(e) => setAlertQuantity(e.target.value)}
                      placeholder="10"
                      className="w-full bg-transparent text-amber-300 font-mono font-bold text-sm px-3.5 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="bg-slate-900 border-l border-slate-800 px-3 py-2.5 text-slate-400 font-semibold text-xs select-none shrink-0">
                      {unit}
                    </div>
                  </div>
                </div>
              </div>


              {/* Tax Summary Breakdown Card */}
              {Boolean(settings.enablePriceAndTaxInfo) && (
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

        {/* Right Column (4 cols): Real-Time Analytics & Media */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 0: Live Product Valuation & Margin Executive Widget */}
          {showLiveCalculator && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-5 rounded-2xl border border-indigo-500/30 shadow-xl space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Real-Time Pricing & Margin KPI</span>
                </h4>
                <button
                  onClick={() => setShowLiveCalculator(false)}
                  className="text-slate-500 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 block">Gross Profit Margin</span>
                  <span className={`text-base font-black ${grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {marginPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate font-mono">
                    Profit: {settings.currencySymbol}{grossProfit.toFixed(2)} / unit
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 block">Checkout MRP (Tax Inc.)</span>
                  <span className="text-base font-black text-indigo-300">
                    {settings.currencySymbol} {taxCalculations.finalPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate font-mono">
                    Tax: {settings.currencySymbol}{taxCalculations.taxAmount.toFixed(2)} ({taxRate}%)
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-850 flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-400">Total Asset Stock Valuation:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {settings.currencySymbol} {totalStockValuationCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Card 1: Product Media & Gallery */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Product Media & Gallery</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {image?.startsWith('data:') ? 'Local File' : image ? 'Web Image' : 'No Media'}
              </span>
            </div>

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
              <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
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
                className={`aspect-video w-full rounded-xl border-2 border-dashed cursor-pointer transition flex flex-col items-center justify-center p-4 text-center group ${
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

              {/* Quick Sample Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Sample Catalog Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setImage(preset.url);
                        if (!name) setName(preset.name);
                      }}
                      className="text-[10px] p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white truncate text-left transition font-medium"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
};
