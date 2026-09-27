import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { RackLocation, Product } from '../../types/erp';
import {
  Layers,
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
  Grid,
  MapPin,
  Compass,
  Archive,
  Eye,
  Sliders,
  Move,
  Package,
  Filter,
  CheckSquare,
  Square,
  Navigation,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface RackFormData {
  name: string;
  code: string;
  zone: string;
  aisle: string;
  rows: string[];
  positions: string[];
  description: string;
  color: string;
  status: 'active' | 'inactive';
}

const initialFormState: RackFormData = {
  name: '',
  code: '',
  zone: 'North High-Value Bay',
  aisle: 'Aisle 01',
  rows: ['Row 1', 'Row 2', 'Row 3'],
  positions: ['Position 1', 'Position 2', 'Position 3', 'Position 4'],
  description: '',
  color: '#6366f1',
  status: 'active',
};

const COLOR_OPTIONS = [
  { label: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-400' },
  { label: 'Sky Blue', value: '#0ea5e9', bgClass: 'bg-sky-500', textClass: 'text-sky-400' },
  { label: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
  { label: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-400' },
  { label: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500', textClass: 'text-rose-400' },
  { label: 'Purple', value: '#8b5cf6', bgClass: 'bg-purple-500', textClass: 'text-purple-400' },
  { label: 'Teal', value: '#14b8a6', bgClass: 'bg-teal-500', textClass: 'text-teal-400' },
  { label: 'Slate', value: '#64748b', bgClass: 'bg-slate-500', textClass: 'text-slate-400' },
];

const PRESET_RACK_ARCHETYPES = [
  {
    name: 'Standard 4-Tier Heavy Shelving',
    code: 'RCK-STD',
    zone: 'Central Warehouse Floor',
    aisle: 'Aisle 01',
    rows: ['Row 1 (Bottom Tier)', 'Row 2 (Mid Tier)', 'Row 3 (Upper Tier)', 'Row 4 (Top Tier)'],
    positions: ['Bay 1 (Left)', 'Bay 2 (Center-Left)', 'Bay 3 (Center-Right)', 'Bay 4 (Right)'],
    description: 'Industrial powder-coated steel shelving for medium & large boxed inventory.',
    color: '#6366f1',
  },
  {
    name: 'High-Value Secured Electronics Rack',
    code: 'RCK-SEC',
    zone: 'North High-Value Bay',
    aisle: 'Aisle 02',
    rows: ['Row 1', 'Row 2', 'Row 3'],
    positions: ['Position 1', 'Position 2', 'Position 3', 'Position 4'],
    description: 'Lockable anti-static storage with humidity regulation for laptops and microchips.',
    color: '#0ea5e9',
  },
  {
    name: 'Small Parts Gravity Bin Rack',
    code: 'RCK-BIN',
    zone: 'Fast-Moving Picking Aisle',
    aisle: 'Aisle 03',
    rows: ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5'],
    positions: ['Bin 01', 'Bin 02', 'Bin 03', 'Bin 04', 'Bin 05', 'Bin 06'],
    description: 'Sloped modular bins for cables, adapters, connectors, and precision accessories.',
    color: '#10b981',
  },
  {
    name: 'Apparel & Hanging Garment Wardrobe',
    code: 'RCK-APP',
    zone: 'Central Retail Zone',
    aisle: 'Aisle 04',
    rows: ['Upper Rail', 'Lower Rail', 'Base Shelf'],
    positions: ['Section A', 'Section B', 'Section C', 'Section D'],
    description: 'Dual hanging rail unit for folded merchandise, jackets, and accessories.',
    color: '#f59e0b',
  },
  {
    name: 'Climate-Controlled Pantry & Perishables',
    code: 'RCK-CLM',
    zone: 'East Climate-Controlled',
    aisle: 'Aisle 05',
    rows: ['Row 1 (Cool)', 'Row 2 (Ambient)'],
    positions: ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4'],
    description: 'Temperature and ventilation monitored rack for artisan coffee beans and teas.',
    color: '#f43f5e',
  },
];

export const RacksView: React.FC = () => {
  const {
    racks = [],
    addRack,
    updateRack,
    deleteRack,
    products = [],
    assignRackPositionToProducts,
    openEditProductPage,
    navigateToInventory,
    settings,
  } = useErp();

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  // Navigation & Sub-views
  const [viewMode, setViewMode] = useState<'matrix' | 'visualizer' | 'lookup'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Rack for 2D Visualizer
  const [activeVisualizerRackId, setActiveVisualizerRackId] = useState<string>(
    racks.length > 0 ? racks[0].id : ''
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (
        p.includes('racks/add') ||
        p.includes('racks/edit') 
      ) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('racks/add') && !window.location.pathname.includes('racks/edit')) {
        window.history.replaceState(null, '', '/inventory/racks/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('racks/add') || window.location.pathname.includes('racks/edit') || window.location.hash.includes('racks/add') || window.location.hash.includes('racks/edit'))) {
        window.history.replaceState(null, '', '/inventory/racks');
      }
    }
  }, [isModalOpen]);
  const [editingRackId, setEditingRackId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RackFormData>(initialFormState);
  const [newRowInput, setNewRowInput] = useState('');
  const [newPosInput, setNewPosInput] = useState('');

  // Delete Confirm Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rackToDelete, setRackToDelete] = useState<RackLocation | null>(null);
  const [reassignTargetRackId, setReassignTargetRackId] = useState<string>('');

  // Batch Assign Modal
  const [isBatchAssignOpen, setIsBatchAssignOpen] = useState(false);
  const [batchTargetRack, setBatchTargetRack] = useState<string>('');
  const [batchTargetRow, setBatchTargetRow] = useState<string>('');
  const [batchTargetPosition, setBatchTargetPosition] = useState<string>('');
  const [batchSelectedProductIds, setBatchSelectedProductIds] = useState<string[]>([]);
  const [batchProductSearch, setBatchProductSearch] = useState<string>('');

  // Quick Slot Assign Modal (From visualizer)
  const [isSlotAssignOpen, setIsSlotAssignOpen] = useState(false);
  const [slotTargetRack, setSlotTargetRack] = useState<string>('');
  const [slotTargetRow, setSlotTargetRow] = useState<string>('');
  const [slotTargetPos, setSlotTargetPos] = useState<string>('');
  const [slotSelectedProductId, setSlotSelectedProductId] = useState<string>('');

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedRackIds, setSelectedRackIds] = useState<Set<string>>(new Set());

  const handleToggleRackSelect = (rackId: string) => {
    setSelectedRackIds((prev) => {
      const next = new Set(prev);
      if (next.has(rackId)) next.delete(rackId);
      else next.add(rackId);
      return next;
    });
  };

  const handleClearSelection = () => setSelectedRackIds(new Set());

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Extract unique zones
  const zonesList = useMemo(() => {
    const set = new Set<string>();
    racks.forEach((r) => {
      if (r.zone) set.add(r.zone);
    });
    return ['All', ...Array.from(set)];
  }, [racks]);

  // Product assignment map: rackName -> products[]
  const rackProductsMap = useMemo(() => {
    const map: Record<string, Product[]> = {};
    racks.forEach((r) => {
      map[r.name] = [];
    });
    products.forEach((p) => {
      if (p.rack) {
        if (!map[p.rack]) map[p.rack] = [];
        map[p.rack].push(p);
      }
    });
    return map;
  }, [racks, products]);

  // KPIs
  const totalRacksCount = racks.length;
  const activeRacksCount = racks.filter((r) => r.status === 'active').length;
  const productsWithLocationCount = products.filter((p) => p.rack).length;
  const unplacedProductsCount = products.filter((p) => !p.rack).length;
  const locationCoveragePercent =
    products.length > 0 ? Math.round((productsWithLocationCount / products.length) * 100) : 0;

  // Filtered Racks
  const filteredRacks = useMemo(() => {
    return racks.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.zone && r.zone.toLowerCase().includes(q)) ||
        (r.aisle && r.aisle.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q));

      const matchZone = selectedZoneFilter === 'All' || r.zone === selectedZoneFilter;
      const matchStatus =
        selectedStatusFilter === 'all' || r.status === selectedStatusFilter;

      return matchSearch && matchZone && matchStatus;
    });
  }, [racks, searchQuery, selectedZoneFilter, selectedStatusFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedZoneFilter, selectedStatusFilter, pageSize]);

  const totalPages = Math.ceil(filteredRacks.length / pageSize);

  const paginatedRacks = useMemo(() => {
    if (!isLight) return filteredRacks;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRacks.slice(startIndex, startIndex + pageSize);
  }, [filteredRacks, isLight, currentPage, pageSize]);

  const isAllPageSelected = paginatedRacks.length > 0 && paginatedRacks.every(r => selectedRackIds.has(r.id));
  const isSomePageSelected = paginatedRacks.some(r => selectedRackIds.has(r.id)) && !isAllPageSelected;

  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      setSelectedRackIds(prev => {
        const next = new Set(prev);
        paginatedRacks.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedRackIds(prev => {
        const next = new Set(prev);
        paginatedRacks.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  // Active visualizer rack
  const currentVisualizerRack = useMemo(() => {
    return racks.find((r) => r.id === activeVisualizerRackId) || racks[0] || null;
  }, [racks, activeVisualizerRackId]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRackId(null);
    setFormData({
      ...initialFormState,
      code: `RCK-${Math.floor(100 + Math.random() * 900)}`,
      name: `Rack ${String.fromCharCode(65 + (racks.length % 26))}-0${Math.floor(racks.length / 26) + 1}`,
      rows: ['Row 1', 'Row 2', 'Row 3'],
      positions: ['Position 1', 'Position 2', 'Position 3', 'Position 4'],
    });
    setNewRowInput('');
    setNewPosInput('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rack: RackLocation) => {
    setEditingRackId(rack.id);
    setFormData({
      name: rack.name,
      code: rack.code,
      zone: rack.zone || 'North High-Value Bay',
      aisle: rack.aisle || 'Aisle 01',
      rows: rack.rows && rack.rows.length > 0 ? [...rack.rows] : ['Row 1', 'Row 2', 'Row 3'],
      positions:
        rack.positions && rack.positions.length > 0
          ? [...rack.positions]
          : ['Position 1', 'Position 2', 'Position 3', 'Position 4'],
      description: rack.description || '',
      color: rack.color || '#6366f1',
      status: rack.status || 'active',
    });
    setNewRowInput('');
    setNewPosInput('');
    setIsModalOpen(true);
  };

  // Save Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Rack Name is required.', 'error');
      return;
    }
    if (!formData.code.trim()) {
      showToast('Rack Code is required.', 'error');
      return;
    }
    if (!formData.rows || formData.rows.length === 0) {
      showToast('At least one Row/Shelf tier must be defined.', 'error');
      return;
    }
    if (!formData.positions || formData.positions.length === 0) {
      showToast('At least one Position/Bay slot must be defined.', 'error');
      return;
    }

    if (editingRackId) {
      updateRack(editingRackId, formData);
      showToast(`Rack "${formData.name}" updated successfully.`);
    } else {
      const created = addRack(formData);
      showToast(`Rack "${created.name}" created successfully.`);
      setActiveVisualizerRackId(created.id);
    }
    setIsModalOpen(false);
  };

  // Row & Position list helpers
  const handleAddRow = () => {
    if (!newRowInput.trim()) return;
    if (formData.rows.includes(newRowInput.trim())) {
      showToast('Row already exists in this rack.', 'error');
      return;
    }
    setFormData((prev) => ({ ...prev, rows: [...prev.rows, newRowInput.trim()] }));
    setNewRowInput('');
  };

  const handleRemoveRow = (rowIndex: number) => {
    if (formData.rows.length <= 1) {
      showToast('A rack must have at least one Row.', 'error');
      return;
    }
    setFormData((prev) => ({ ...prev, rows: prev.rows.filter((_, i) => i !== rowIndex) }));
  };

  const handleAddPosition = () => {
    if (!newPosInput.trim()) return;
    if (formData.positions.includes(newPosInput.trim())) {
      showToast('Position already exists in this rack.', 'error');
      return;
    }
    setFormData((prev) => ({ ...prev, positions: [...prev.positions, newPosInput.trim()] }));
    setNewPosInput('');
  };

  const handleRemovePosition = (posIndex: number) => {
    if (formData.positions.length <= 1) {
      showToast('A rack must have at least one Position.', 'error');
      return;
    }
    setFormData((prev) => ({ ...prev, positions: prev.positions.filter((_, i) => i !== posIndex) }));
  };

  const applyArchetype = (template: typeof PRESET_RACK_ARCHETYPES[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: `${template.name} (${String.fromCharCode(65 + (racks.length % 26))})`,
      code: `${template.code}-${Math.floor(100 + Math.random() * 900)}`,
      zone: template.zone,
      aisle: template.aisle,
      rows: [...template.rows],
      positions: [...template.positions],
      description: template.description,
      color: template.color,
    }));
    showToast(`Template "${template.name}" applied.`);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (rack: RackLocation) => {
    setRackToDelete(rack);
    const availableTargets = racks.filter((r) => r.id !== rack.id);
    setReassignTargetRackId(availableTargets.length > 0 ? availableTargets[0].id : '');
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!rackToDelete) return;
    const result = deleteRack(rackToDelete.id, reassignTargetRackId || undefined);
    if (result.success) {
      showToast(result.message || 'Rack deleted successfully.');
      setIsDeleteModalOpen(false);
      setRackToDelete(null);
    } else {
      showToast(result.message || 'Failed to delete rack.', 'error');
    }
  };

  // Batch Assign Handlers
  const handleOpenBatchAssign = (initialRackName?: string) => {
    const target = initialRackName || (racks.length > 0 ? racks[0].name : '');
    setBatchTargetRack(target);
    const targetRackObj = racks.find((r) => r.name === target);
    setBatchTargetRow(targetRackObj?.rows?.[0] || 'Row 1');
    setBatchTargetPosition(targetRackObj?.positions?.[0] || 'Position 1');
    setBatchSelectedProductIds([]);
    setBatchProductSearch('');
    setIsBatchAssignOpen(true);
  };

  const handleExecuteBatchAssign = () => {
    if (!batchTargetRack) {
      showToast('Please select a target Rack.', 'error');
      return;
    }
    if (batchSelectedProductIds.length === 0) {
      showToast('Please select at least one product to assign.', 'error');
      return;
    }

    assignRackPositionToProducts(
      batchSelectedProductIds,
      batchTargetRack,
      batchTargetRow || undefined,
      batchTargetPosition || undefined
    );

    showToast(
      `Assigned ${batchSelectedProductIds.length} product(s) to ${batchTargetRack} › ${batchTargetRow || 'Any Row'} › ${batchTargetPosition || 'Any Position'}.`
    );
    setIsBatchAssignOpen(false);
  };

  // Single Slot Assign from Visualizer
  const handleOpenSlotAssign = (rackName: string, rowName: string, posName: string) => {
    setSlotTargetRack(rackName);
    setSlotTargetRow(rowName);
    setSlotTargetPos(posName);
    setSlotSelectedProductId('');
    setIsSlotAssignOpen(true);
  };

  const handleExecuteSlotAssign = () => {
    if (!slotSelectedProductId) {
      showToast('Please select a product to place in this slot.', 'error');
      return;
    }
    assignRackPositionToProducts([slotSelectedProductId], slotTargetRack, slotTargetRow, slotTargetPos);
    showToast(`Product placed in ${slotTargetRack} › ${slotTargetRow} › ${slotTargetPos}.`);
    setIsSlotAssignOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const racksToExport = selectedRackIds.size > 0 
      ? racks.filter(r => selectedRackIds.has(r.id)) 
      : racks;

    const headers = ['Rack Code', 'Rack Name', 'Zone', 'Aisle', 'Rows (Count)', 'Positions (Count)', 'Assigned Products (Count)', 'Status', 'Description'];
    const rows = racksToExport.map((r) => [
      r.code,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.zone || '').replace(/"/g, '""')}"`,
      `"${(r.aisle || '').replace(/"/g, '""')}"`,
      r.rows?.length || 0,
      r.positions?.length || 0,
      rackProductsMap[r.name]?.length || 0,
      r.status,
      `"${(r.description || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `erp_warehouse_racks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isModalOpen) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-fadeIn">
        {/* Navigation & Header */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold border border-slate-700 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Rack & Row Locations</span>
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Products & Inventory</span>
                <span>/</span>
                <span>Rack, Row & Position</span>
                <span>/</span>
                <span className="text-indigo-400 font-semibold">{editingRackId ? 'Edit Rack Location' : 'Add New Rack Location'}</span>
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>{editingRackId ? `Edit Location: ${formData.name}` : 'Configure Warehouse Storage Rack'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition border ${
                isLight
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingRackId ? 'Save Rack Changes' : 'Create Rack Location'}</span>
            </button>
          </div>
        </div>

        {/* Full Page Form Grid */}
        <form onSubmit={handleSaveForm} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 8 cols */}
          <div className="lg:col-span-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-400" />
                  <span>Warehouse Storage Structure & Slot Layout</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define rack name, barcode ID, warehouse zone, rows (shelves) and positions (slots).
                </p>
              </div>
            </div>

            {/* Quick Presets Banner */}
            {!editingRackId && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Quick Storage Archetype Templates:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_RACK_ARCHETYPES.map((arch) => (
                    <button
                      key={arch.name}
                      type="button"
                      onClick={() => applyArchetype(arch)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition font-semibold"
                    >
                      {arch.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rack Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Rack Name / Identifier <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rack A-01"
                  className="w-full bg-slate-950 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Rack Code / Barcode ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. RCK-A01"
                  className="w-full bg-slate-950 text-white font-mono font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>
            </div>

            {/* Zone & Aisle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Warehouse Zone / Sector
                </label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zone: e.target.value }))}
                  placeholder="e.g. North High-Value Bay, Central Floor"
                  className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Aisle Number / Corridor
                </label>
                <input
                  type="text"
                  value={formData.aisle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, aisle: e.target.value }))}
                  placeholder="e.g. Aisle 01, Aisle 02-B"
                  className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Rows List Configurator */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Shelf Rows / Tiers ({formData.rows.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Horizontal tiers from ground up</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRowInput}
                  onChange={(e) => setNewRowInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRow();
                    }
                  }}
                  placeholder="Add custom row tier (e.g. Row 5, Shelf Top)..."
                  className="flex-1 bg-slate-900 text-white px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition"
                >
                  + Add Row
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {formData.rows.map((rowItem, idx) => (
                  <span
                    key={rowItem}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 flex items-center gap-2 text-xs font-semibold"
                  >
                    <span>{rowItem}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Positions / Bins List Configurator */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Position Bins / Bays ({formData.positions.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Vertical compartments per row</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPosInput}
                  onChange={(e) => setNewPosInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPosition();
                    }
                  }}
                  placeholder="Add custom position slot (e.g. Position 5, Bin 01, Bay Left)..."
                  className="flex-1 bg-slate-900 text-white px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition"
                >
                  + Add Position
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {formData.positions.map((posItem, idx) => (
                  <span
                    key={posItem}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 flex items-center gap-2 text-xs font-semibold font-mono"
                  >
                    <span>{posItem}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePosition(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Storage Guidelines / Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Storage Guidelines / Handling Notes
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Max load 250kg per shelf tier. Keep anti-static cover closed."
                className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Right 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            {/* Color Accent Badge */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                Color Marker Tag
              </h4>
              <div className="flex items-center gap-2.5 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color: c.value }))}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      formData.color === c.value
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Operating Status */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                Operating Status
              </h4>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: 'active' }))}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                    formData.status === 'active'
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Active Storage Bay</span>
                  </div>
                  {formData.status === 'active' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: 'inactive' }))}
                  className={`w-full p-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                    formData.status === 'inactive'
                      ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span>Inactive / Under Maintenance</span>
                  </div>
                  {formData.status === 'inactive' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Capacity Slot Summary */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Calculated Slot Capacity</span>
                <Boxes className="w-4 h-4 text-indigo-400" />
              </h4>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Shelf Tiers (Rows):</span>
                  <span className="font-bold text-white">{formData.rows.length}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Slot Bins (Positions):</span>
                  <span className="font-bold text-white">{formData.positions.length}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-indigo-400">
                  <span>Total Storage Slots:</span>
                  <span>{formData.rows.length * formData.positions.length} Slots</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-16 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-semibold animate-slideDown ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/95 border-rose-800 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Rack, Row & Position Management</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                  Physical Storage Topology
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Organize products into exact physical warehouse Racks, Shelf Rows, and Position Bins for quick picking & audits.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="rack-add-btn"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Rack</span>
          </button>

          <button
            id="rack-batch-assign-btn"
            onClick={() => handleOpenBatchAssign()}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Move className="w-4 h-4" />
            <span>Batch Assign Products</span>
          </button>

          <button
            id="rack-export-btn"
            onClick={handleExportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition"
            title="Export Racks to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Racks</p>
            <p className="text-xl font-black text-white">{totalRacksCount}</p>
            <p className="text-[10px] text-emerald-400 font-semibold">{activeRacksCount} Active Bays</p>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-sky-600/20 border border-sky-500/30 rounded-xl text-sky-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Storage Zones</p>
            <p className="text-xl font-black text-white">{zonesList.length - 1}</p>
            <p className="text-[10px] text-sky-400 font-semibold">Distinct Warehouse Areas</p>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Identified Products</p>
            <p className="text-xl font-black text-white">
              {productsWithLocationCount} <span className="text-xs font-normal text-slate-400">/ {products.length}</span>
            </p>
            <p className="text-[10px] text-emerald-400 font-semibold">{locationCoveragePercent}% Assigned</p>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Unassigned Items</p>
            <p className="text-xl font-black text-amber-300">{unplacedProductsCount}</p>
            <p className="text-[10px] text-slate-400">Need Rack/Row Allocation</p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rack Registry List ({filteredRacks.length})</span>
          </button>

          <button
            onClick={() => setViewMode('visualizer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'visualizer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>2D Interactive Shelf Matrix</span>
          </button>

          <button
            onClick={() => setViewMode('lookup')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'lookup'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Product Location Lookup ({products.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: RACK REGISTRY LIST */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search racks by code, name, zone, aisle..."
                  className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
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

              {/* Bulk Action Bar beside Search */}
              {selectedRackIds.size > 0 && (
                <div className="flex items-center gap-2 p-1 pl-3 rounded-xl animate-fadeIn whitespace-nowrap border bg-sky-950/40 border-sky-500/20">
                  <div className="flex items-center gap-2 mr-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                      {selectedRackIds.size}
                    </span>
                    <span className="text-[10px] font-bold hidden md:inline text-white">
                      Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleExportCSV}
                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      title={`Export ${selectedRackIds.size} selected to CSV`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Page size filter (Light Mode Only) */}
              {isLight && (
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              )}

              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
              >
                {zonesList.map((z) => (
                  <option key={z} value={z}>
                    Zone: {z}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Racks Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedRacks.map((rack) => {
              const assignedProducts = rackProductsMap[rack.name] || [];
              const totalPositionsCapacity = (rack.rows?.length || 1) * (rack.positions?.length || 1);
              const isSelected = selectedRackIds.has(rack.id);

              return (
                <div
                  key={rack.id}
                  className={`rounded-2xl border p-4 transition flex flex-col justify-between space-y-4 shadow-sm relative ${isSelected ? 'bg-sky-950/20 border-sky-800' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 right-4 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleRackSelect(rack.id)}
                      className="w-4 h-4 rounded border-slate-700 focus:ring-sky-500 cursor-pointer transition bg-slate-950 text-sky-600"
                    />
                  </div>
                  {/* Top Bar */}
                  <div className="space-y-2 pr-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: rack.color || '#6366f1' }}
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm line-clamp-1">{rack.name}</h3>
                          <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                            {rack.code}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rack.status === 'active'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {rack.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Zone & Aisle */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3 h-3 text-sky-400 shrink-0" />
                        <strong className="text-slate-300">{rack.zone || 'General Zone'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{rack.aisle || 'Aisle 01'}</span>
                      </span>
                    </div>

                    {rack.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-800/60">
                        {rack.description}
                      </p>
                    )}
                  </div>

                  {/* Shelving Structure Pills */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Rows / Shelves:</span>
                      <span className="font-bold text-slate-200">
                        {rack.rows?.length || 0} Tiers ({rack.rows?.join(', ')})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Positions / Bins:</span>
                      <span className="font-bold text-slate-200">
                        {rack.positions?.length || 0} Slots ({rack.positions?.join(', ')})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-1.5">
                      <span className="text-slate-400">Assigned Products:</span>
                      <span className="font-bold text-emerald-400">
                        {assignedProducts.length} Item(s) stored
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setActiveVisualizerRackId(rack.id);
                        setViewMode('visualizer');
                      }}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>View Shelves</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenBatchAssign(rack.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                        title="Assign Products to this Rack"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(rack)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Edit Rack Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(rack)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                        title="Delete Rack"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer (Light Mode Only) */}
          {isLight && totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border border-slate-800 rounded-2xl shadow-sm mt-4">
              <div className="text-xs text-slate-400 font-medium">
                Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredRacks.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredRacks.length)}</span> of <span className="font-bold text-white">{filteredRacks.length}</span> entries
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

          {filteredRacks.length === 0 && (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-white font-bold text-sm">No storage racks matched your filter.</p>
              <p className="text-xs text-slate-400">Click &quot;+ Add New Rack&quot; to configure a new storage zone.</p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                + Add New Rack
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 2D INTERACTIVE SHELF MATRIX VISUALIZER */}
      {viewMode === 'visualizer' && (
        <div className="space-y-4">
          {/* Rack Selector Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Select Rack to Visualize:</span>
              <select
                value={activeVisualizerRackId}
                onChange={(e) => setActiveVisualizerRackId(e.target.value)}
                className="bg-slate-950 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {racks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) — {r.zone}
                  </option>
                ))}
              </select>
            </div>

            {currentVisualizerRack && (
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>Zone: <strong>{currentVisualizerRack.zone}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aisle: <strong>{currentVisualizerRack.aisle}</strong></span>
                </span>
              </div>
            )}
          </div>

          {currentVisualizerRack ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: currentVisualizerRack.color || '#6366f1' }}
                  />
                  <h3 className="font-extrabold text-white text-base">{currentVisualizerRack.name}</h3>
                  <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {currentVisualizerRack.code}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBatchAssign(currentVisualizerRack.name)}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Items to this Rack</span>
                  </button>
                </div>
              </div>

              {/* 2D Shelving Grid */}
              <div className="space-y-3 overflow-x-auto pb-2">
                {(currentVisualizerRack.rows || ['Row 1', 'Row 2', 'Row 3']).map((rowName, rowIdx) => (
                  <div
                    key={rowName}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                  >
                    {/* Row Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                          Tier #{rowIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{rowName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Slots: {(currentVisualizerRack.positions || []).length} Bins
                      </span>
                    </div>

                    {/* Positions Bay Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                      {(currentVisualizerRack.positions || ['Position 1', 'Position 2', 'Position 3', 'Position 4']).map(
                        (posName) => {
                          // Find products occupying this exact rack + row + pos
                          const occupyingProducts = products.filter(
                            (p) =>
                              p.rack === currentVisualizerRack.name &&
                              p.row === rowName &&
                              p.position === posName
                          );

                          return (
                            <div
                              key={posName}
                              className={`p-3 rounded-xl border transition flex flex-col justify-between min-h-[110px] ${
                                occupyingProducts.length > 0
                                  ? 'bg-slate-900 border-indigo-500/40 shadow-sm'
                                  : 'bg-slate-900/40 border-dashed border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                                  {posName}
                                </span>
                                <button
                                  onClick={() =>
                                    handleOpenSlotAssign(currentVisualizerRack.name, rowName, posName)
                                  }
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                                  title="Place product in this slot"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Place</span>
                                </button>
                              </div>

                              {/* Occupying Product List */}
                              <div className="py-1.5 space-y-1.5">
                                {occupyingProducts.length > 0 ? (
                                  occupyingProducts.map((p) => (
                                    <div
                                      key={p.id}
                                      onClick={() => openEditProductPage(p)}
                                      className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500 cursor-pointer transition flex items-center gap-2 group"
                                      title="Click to view/edit product"
                                    >
                                      {p.image && (
                                        <img
                                          src={p.image}
                                          alt={p.name}
                                          referrerPolicy="no-referrer"
                                          className="w-7 h-7 rounded object-cover bg-slate-900 shrink-0"
                                        />
                                      )}
                                      <div className="truncate">
                                        <p className="text-[11px] font-bold text-white truncate group-hover:text-indigo-300">
                                          {p.name}
                                        </p>
                                        <p className="text-[9px] font-mono text-slate-400">
                                          {p.sku} • Stock: <strong className="text-emerald-400">{p.currentStock ?? 0}</strong>
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-2">
                                    <span className="text-[10px] text-slate-600 font-medium italic">
                                      Empty Bay Slot
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between">
                                <span>{occupyingProducts.length} Item(s)</span>
                                <span className="text-emerald-400/80">
                                  {occupyingProducts.reduce((sum, p) => sum + (p.currentStock ?? 0), 0)} Qty
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center">
              <p className="text-slate-400 text-xs">Please create a rack first to view the 2D visualizer.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: PRODUCT LOCATION LOOKUP */}
      {viewMode === 'lookup' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by SKU, Name, or Barcode..."
                className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => handleOpenBatchAssign()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Move className="w-4 h-4" />
              <span>Batch Relocate Products</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-3">Product Name & SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Assigned Rack</th>
                  <th className="py-3 px-3">Row / Tier</th>
                  <th className="py-3 px-3">Position / Bin</th>
                  <th className="py-3 px-3 text-center">Current Stock</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {products
                  .filter((p) => {
                    const q = searchQuery.toLowerCase().trim();
                    return (
                      !q ||
                      p.name.toLowerCase().includes(q) ||
                      p.sku.toLowerCase().includes(q) ||
                      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                      (p.rack && p.rack.toLowerCase().includes(q))
                    );
                  })
                  .map((prod) => {
                    const matchedRack = racks.find((r) => r.name === prod.rack);

                    return (
                      <tr key={prod.id} className="hover:bg-slate-850 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {prod.image && (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-lg object-cover bg-slate-950 shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-bold text-white line-clamp-1">{prod.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-400">{prod.category || 'General'}</td>

                        {/* Rack Badge */}
                        <td className="py-3 px-3">
                          {prod.rack ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border"
                              style={{
                                backgroundColor: matchedRack ? `${matchedRack.color}20` : '#6366f120',
                                color: matchedRack?.color || '#a5b4fc',
                                borderColor: matchedRack ? `${matchedRack.color}40` : '#6366f140',
                              }}
                            >
                              <Layers className="w-3 h-3 shrink-0" />
                              <span>{prod.rack}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded-full font-bold">
                              Unallocated
                            </span>
                          )}
                        </td>

                        {/* Row Badge */}
                        <td className="py-3 px-3">
                          {prod.row ? (
                            <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {prod.row}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* Position Badge */}
                        <td className="py-3 px-3">
                          {prod.position ? (
                            <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                              {prod.position}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                          {prod.currentStock ?? 0} {prod.unit || 'Pcs'}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => openEditProductPage(prod)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                          >
                            Edit Location
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT RACK MODAL */}
      {/* BATCH ASSIGN PRODUCTS MODAL */}
      {isBatchAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Move className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Batch Relocate / Place Products</h3>
                  <p className="text-[11px] text-slate-400">
                    Assign multiple catalog products to a specific Rack, Shelf Row, and Position
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchAssignOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Target Location Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Target Rack *</label>
                  <select
                    value={batchTargetRack}
                    onChange={(e) => {
                      setBatchTargetRack(e.target.value);
                      const targetObj = racks.find((r) => r.name === e.target.value);
                      setBatchTargetRow(targetObj?.rows?.[0] || 'Row 1');
                      setBatchTargetPosition(targetObj?.positions?.[0] || 'Position 1');
                    }}
                    className="w-full bg-slate-900 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    {racks.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Shelf Row / Tier</label>
                  <select
                    value={batchTargetRow}
                    onChange={(e) => setBatchTargetRow(e.target.value)}
                    className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    {(() => {
                      const targetObj = racks.find((r) => r.name === batchTargetRack);
                      return (targetObj?.rows || ['Row 1', 'Row 2', 'Row 3']).map((row) => (
                        <option key={row} value={row}>
                          {row}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Position / Bin</label>
                  <select
                    value={batchTargetPosition}
                    onChange={(e) => setBatchTargetPosition(e.target.value)}
                    className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    {(() => {
                      const targetObj = racks.find((r) => r.name === batchTargetRack);
                      return (targetObj?.positions || ['Position 1', 'Position 2', 'Position 3']).map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Product Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">
                    Select Products ({batchSelectedProductIds.length} Selected)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBatchSelectedProductIds(products.map((p) => p.id))}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setBatchSelectedProductIds([])}
                      className="text-slate-400 hover:underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={batchProductSearch}
                    onChange={(e) => setBatchProductSearch(e.target.value)}
                    placeholder="Filter products to assign..."
                    className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800">
                  {products
                    .filter((p) => {
                      const q = batchProductSearch.toLowerCase().trim();
                      return (
                        !q ||
                        p.name.toLowerCase().includes(q) ||
                        p.sku.toLowerCase().includes(q) ||
                        (p.category && p.category.toLowerCase().includes(q))
                      );
                    })
                    .map((prod) => {
                      const isChecked = batchSelectedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setBatchSelectedProductIds((prev) =>
                              prev.includes(prod.id)
                                ? prev.filter((id) => id !== prod.id)
                                : [...prev, prod.id]
                            );
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                            isChecked ? 'bg-indigo-950/40' : 'hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-white text-xs line-clamp-1">{prod.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                SKU: {prod.sku} • Current: {prod.rack ? `${prod.rack} (${prod.row || 'No Row'})` : 'Unassigned'}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono font-bold text-slate-300">
                            {prod.currentStock ?? 0} {prod.unit || 'Pcs'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchAssignOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition border ${
                    isLight
                      ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchAssign}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Apply Location Placement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE SLOT ASSIGN MODAL (From Visualizer) */}
      {isSlotAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Place Product in Slot</h3>
                <p className="text-[11px] text-indigo-400 font-mono">
                  {slotTargetRack} › {slotTargetRow} › {slotTargetPos}
                </p>
              </div>
              <button
                onClick={() => setIsSlotAssignOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Select Product to Place</label>
              <select
                value={slotSelectedProductId}
                onChange={(e) => setSlotSelectedProductId(e.target.value)}
                className="w-full bg-slate-950 text-white font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
              >
                <option value="">-- Choose Product from Catalog --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) {p.rack ? `[Currently: ${p.rack}]` : '[Unplaced]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSlotAssignOpen(false)}
                className={`px-4 py-2 rounded-xl font-bold transition border ${
                  isLight
                    ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSlotAssign}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
              >
                Save Placement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && rackToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-600/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Rack Location?</h3>
                <p className="text-slate-400 text-xs">{rackToDelete.name} ({rackToDelete.code})</p>
              </div>
            </div>

            {/* Check if products are linked */}
            {(() => {
              const linkedProducts = rackProductsMap[rackToDelete.name] || [];
              const otherRacks = racks.filter((r) => r.id !== rackToDelete.id);

              return (
                <div className="space-y-3">
                  {linkedProducts.length > 0 ? (
                    <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl space-y-2 text-rose-200">
                      <p className="font-bold">
                        ⚠️ Active Inventory Warning: {linkedProducts.length} product(s) are currently placed in this rack.
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        Choose a replacement rack to safely migrate these products to, or cancel to reassign them manually.
                      </p>
                      {otherRacks.length > 0 && (
                        <div className="pt-1">
                          <label className="text-slate-300 font-bold block mb-1">
                            Migrate Products To:
                          </label>
                          <select
                            value={reassignTargetRackId}
                            onChange={(e) => setReassignTargetRackId(e.target.value)}
                            className="w-full bg-slate-900 text-white font-bold px-3 py-2 rounded-xl border border-slate-700"
                          >
                            {otherRacks.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-300">
                      Are you sure you want to permanently delete <strong>{rackToDelete.name}</strong>? No products are currently assigned to this rack.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className={`px-4 py-2 rounded-xl font-bold transition border ${
                  isLight
                    ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30"
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
