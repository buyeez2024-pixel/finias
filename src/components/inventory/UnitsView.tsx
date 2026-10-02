import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Unit } from '../../types/erp';
import { ExportButtons } from '../common/ExportButtons';
import { validateUnitData } from '../../utils/validation';
import { FormFieldError } from '../common/FormFieldError';
import {
  Scale,
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface UnitFormData {
  name: string;
  shortName: string;
  allowDecimal: boolean;
  isMultiple: boolean;
  baseUnitId: string;
  baseUnitMultiplier: string;
  description: string;
}

const initialFormState: UnitFormData = {
  name: '',
  shortName: '',
  allowDecimal: false,
  isMultiple: false,
  baseUnitId: '',
  baseUnitMultiplier: '1',
  description: '',
};

export const UnitsView: React.FC = () => {
  const {
    units,
    products,
    addUnit,
    updateUnit,
    deleteUnit,
    currentUser,
    settings,
  } = useErp();

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'base' | 'secondary' | 'decimal'>('all');
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (
        p.includes('units/add') ||
        p.includes('units/edit') 
      ) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('units/add') && !window.location.pathname.includes('units/edit')) {
        window.history.replaceState(null, '', '/inventory/units/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('units/add') || window.location.pathname.includes('units/edit') || window.location.hash.includes('units/add') || window.location.hash.includes('units/edit'))) {
        window.history.replaceState(null, '', '/inventory/units');
      }
    }
  }, [isModalOpen]);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  // Admin / permissions check
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin' || currentUser?.role === 'manager' || currentUser?.role === 'inventory_manager';

  // Base units list for the secondary unit dropdown
  const baseUnits = useMemo(() => {
    return units.filter((u) => u.isBaseUnit !== false && (!editingUnit || u.id !== editingUnit.id));
  }, [units, editingUnit]);

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.description && u.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesType = true;
      if (filterType === 'base') {
        matchesType = u.isBaseUnit !== false;
      } else if (filterType === 'secondary') {
        matchesType = u.isBaseUnit === false || !!u.baseUnitId;
      } else if (filterType === 'decimal') {
        matchesType = u.allowDecimal;
      }

      return matchesSearch && matchesType;
    });
  }, [units, searchQuery, filterType]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, pageSize]);

  const totalPages = Math.ceil(filteredUnits.length / pageSize);

  const paginatedUnits = useMemo(() => {
    if (!isLight) return filteredUnits;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUnits.slice(startIndex, startIndex + pageSize);
  }, [filteredUnits, isLight, currentPage, pageSize]);

  const handleToggleUnitSelect = (id: string) => {
    const newSelected = new Set(selectedUnitIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUnitIds(newSelected);
  };

  const handleToggleSelectPage = () => {
    const newSelected = new Set(selectedUnitIds);
    const allPageSelected = paginatedUnits.every((u) => newSelected.has(u.id));
    if (allPageSelected) {
      paginatedUnits.forEach((u) => newSelected.delete(u.id));
    } else {
      paginatedUnits.forEach((u) => newSelected.add(u.id));
    }
    setSelectedUnitIds(newSelected);
  };

  const isAllPageSelected = paginatedUnits.length > 0 && paginatedUnits.every((u) => selectedUnitIds.has(u.id));
  const isSomePageSelected = paginatedUnits.some((u) => selectedUnitIds.has(u.id)) && !isAllPageSelected;

  const handleClearSelection = () => setSelectedUnitIds(new Set());

  // Count products using each unit
  const unitProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    units.forEach((u) => {
      const matchCount = products.filter(
        (p) =>
          p.unit.toLowerCase() === u.shortName.toLowerCase() ||
          p.unit.toLowerCase() === u.name.toLowerCase()
      ).length;
      counts[u.id] = matchCount;
    });
    return counts;
  }, [units, products]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingUnit(null);
    setFormData({
      name: '',
      shortName: '',
      allowDecimal: false,
      isMultiple: false,
      baseUnitId: baseUnits[0]?.id || '',
      baseUnitMultiplier: '10',
      description: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      shortName: unit.shortName,
      allowDecimal: unit.allowDecimal,
      isMultiple: !unit.isBaseUnit && !!unit.baseUnitId,
      baseUnitId: unit.baseUnitId || baseUnits[0]?.id || '',
      baseUnitMultiplier: unit.baseUnitMultiplier?.toString() || '1',
      description: unit.description || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save (Create / Update)
  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const schemaRes = validateUnitData({
      name: formData.name,
      shortName: formData.shortName,
      allowDecimal: formData.allowDecimal,
      baseUnitMultiplier: formData.isMultiple ? formData.baseUnitMultiplier : undefined,
    });

    if (!schemaRes.isValid) {
      setFieldErrors(schemaRes.errors);
      setFormError(schemaRes.firstError || 'Please correct the highlighted form errors.');
      return;
    }

    // Check duplicate short name in other units
    const duplicate = units.find(
      (u) =>
        u.shortName.toLowerCase() === formData.shortName.trim().toLowerCase() &&
        u.id !== editingUnit?.id
    );
    if (duplicate) {
      setFormError(`A unit with short name "${formData.shortName}" already exists (${duplicate.name}).`);
      return;
    }

    const multiplier = formData.isMultiple ? parseFloat(formData.baseUnitMultiplier) || 1 : undefined;
    const baseId = formData.isMultiple && formData.baseUnitId ? formData.baseUnitId : undefined;

    if (editingUnit) {
      updateUnit(editingUnit.id, {
        name: formData.name.trim(),
        shortName: formData.shortName.trim(),
        allowDecimal: formData.allowDecimal,
        isBaseUnit: !formData.isMultiple,
        baseUnitId: baseId,
        baseUnitMultiplier: multiplier,
        description: formData.description.trim(),
      });
      setStatusMessage({
        type: 'success',
        text: `Unit "${formData.name.trim()} (${formData.shortName.trim()})" updated successfully.`,
      });
    } else {
      addUnit({
        name: formData.name.trim(),
        shortName: formData.shortName.trim(),
        allowDecimal: formData.allowDecimal,
        isBaseUnit: !formData.isMultiple,
        baseUnitId: baseId,
        baseUnitMultiplier: multiplier,
        description: formData.description.trim(),
      });
      setStatusMessage({
        type: 'success',
        text: `New unit "${formData.name.trim()} (${formData.shortName.trim()})" created successfully.`,
      });
    }

    setIsModalOpen(false);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!unitToDelete) return;
    const res = deleteUnit(unitToDelete.id);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Unit deleted successfully.' });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to delete unit.' });
    }
    setUnitToDelete(null);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Unit Name', 'Short Name', 'Allow Decimal', 'Is Base Unit', 'Base Unit Ref', 'Multiplier', 'Linked Products', 'Description'];
    const targetList = selectedUnitIds.size > 0 ? units.filter((u) => selectedUnitIds.has(u.id)) : filteredUnits;
    const rows = targetList.map((u) => {
      const baseRef = u.baseUnitId ? units.find((b) => b.id === u.baseUnitId)?.name || u.baseUnitId : 'None';
      const count = unitProductCounts[u.id] || 0;
      return [
        `"${u.name.replace(/"/g, '""')}"`,
        u.shortName,
        u.allowDecimal ? 'Yes' : 'No',
        u.isBaseUnit !== false ? 'Yes' : 'No',
        `"${baseRef}"`,
        u.baseUnitMultiplier || 1,
        count,
        `"${(u.description || '').replace(/"/g, '""')}"`,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `units_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Data Preparation for Unified ExportButtons
  const exportUnitsData = useMemo(() => {
    const sourceList = selectedUnitIds.size > 0
      ? units.filter((u) => selectedUnitIds.has(u.id))
      : filteredUnits;

    return sourceList.map((u) => {
      const baseRef = u.baseUnitId ? units.find((b) => b.id === u.baseUnitId)?.name || u.baseUnitId : 'None (Base)';
      const count = unitProductCounts[u.id] || 0;
      const isBase = u.isBaseUnit !== false && !u.baseUnitId;

      return {
        name: u.name,
        shortName: u.shortName,
        allowDecimal: u.allowDecimal ? 'Yes' : 'No',
        classification: isBase ? 'Base Unit' : `Sub-Unit (1 ${u.shortName} = ${u.baseUnitMultiplier || 1} ${baseRef})`,
        multiplier: u.baseUnitMultiplier || 1,
        baseUnitRef: baseRef,
        linkedProducts: count,
        description: u.description || '—',
        id: u.id,
      };
    });
  }, [units, filteredUnits, selectedUnitIds, unitProductCounts]);

  if (isModalOpen) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-fadeIn">
        {/* Header & Back Button */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold border border-slate-700 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Units Directory</span>
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Products & Inventory</span>
                <span>/</span>
                <span>Units</span>
                <span>/</span>
                <span className="text-indigo-400 font-semibold">{editingUnit ? 'Edit Unit' : 'Add New Unit'}</span>
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <span>{editingUnit ? `Edit Unit: ${editingUnit.name}` : 'Create Unit of Measurement (UoM)'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition border ${
                isLight 
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUnit}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingUnit ? 'Save Changes' : 'Create Unit'}</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2 shadow-lg">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Full Page Form Grid */}
        <form onSubmit={handleSaveUnit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 8 cols */}
          <div className="lg:col-span-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span>Unit Identity & Precision Settings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define primary display name, short abbreviation code, and decimal fraction capabilities.
              </p>
            </div>

            {/* Unit Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-1.5">
                <span>Unit Full Name <span className="text-rose-400">*</span></span>
                <span className="text-[11px] text-slate-500 normal-case">e.g. Pieces, Kilograms, Box, Liters</span>
              </label>
              <input
                id="unit-form-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                  setFormData({ ...formData, name: e.target.value });
                }}
                placeholder="e.g. Kilograms"
                className={`w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border ${fieldErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} focus:outline-none focus:border-indigo-500 font-semibold`}
              />
              <FormFieldError error={fieldErrors.name} />
            </div>

            {/* Short Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-1.5">
                <span>Short Name / Code <span className="text-rose-400">*</span></span>
                <span className="text-[11px] text-slate-500 normal-case">e.g. Kg, Pcs, Box, Ltr, Dzn</span>
              </label>
              <input
                id="unit-form-shortname"
                type="text"
                required
                value={formData.shortName}
                onChange={(e) => {
                  if (fieldErrors.shortName) setFieldErrors(prev => ({ ...prev, shortName: '' }));
                  setFormData({ ...formData, shortName: e.target.value });
                }}
                placeholder="e.g. Kg"
                className={`w-full bg-slate-950 text-white font-mono text-xs font-bold px-3.5 py-2.5 rounded-xl border ${fieldErrors.shortName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'} focus:outline-none focus:border-indigo-500 uppercase`}
              />
              <FormFieldError error={fieldErrors.shortName} />
            </div>

            {/* Allow Decimal */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Allow Decimal Quantities</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    id="unit-decimal-yes"
                    type="radio"
                    name="allowDecimal"
                    checked={formData.allowDecimal === true}
                    onChange={() => setFormData({ ...formData, allowDecimal: true })}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <span>Yes (Allows decimal quantities e.g. 1.25 Kg, 2.50 Liters, 0.75 Meters)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    id="unit-decimal-no"
                    type="radio"
                    name="allowDecimal"
                    checked={formData.allowDecimal === false}
                    onChange={() => setFormData({ ...formData, allowDecimal: false })}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <span>No (Strict integers only e.g. 1 Pcs, 2 Box)</span>
                </label>
              </div>
            </div>

            {/* Sub-unit / Multiplier Config */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-200 text-xs">
                <input
                  id="unit-is-multiple"
                  type="checkbox"
                  checked={formData.isMultiple}
                  onChange={(e) => setFormData({ ...formData, isMultiple: e.target.checked })}
                  className="accent-indigo-600 w-4 h-4 rounded"
                />
                <span className="font-bold text-slate-200">
                  Add as multiple of another base unit (Packaging / Multiplier Sub-unit)
                </span>
              </label>

              {formData.isMultiple && (
                <div className="pt-3 border-t border-slate-800 space-y-3 animate-fadeIn text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 font-semibold text-xs block mb-1">
                        1 {formData.shortName || 'This Unit'} =
                      </label>
                      <input
                        id="unit-multiplier-val"
                        type="number"
                        step="any"
                        min="0.0001"
                        value={formData.baseUnitMultiplier}
                        onChange={(e) => setFormData({ ...formData, baseUnitMultiplier: e.target.value })}
                        placeholder="e.g. 10 (or 0.001)"
                        className="w-full bg-slate-900 text-white font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold text-xs block mb-1">Base Reference Unit</label>
                      <select
                        id="unit-base-select"
                        value={formData.baseUnitId}
                        onChange={(e) => setFormData({ ...formData, baseUnitId: e.target.value })}
                        className="w-full bg-slate-900 text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none font-medium"
                      >
                        {baseUnits.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.shortName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>
                      Example: 1 Box = 10 Pcs, or 1 Dozen = 12 Pcs, or 1 Gram = 0.001 Kg
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Description / Usage Notes
              </label>
              <textarea
                id="unit-form-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional usage instructions or packaging notes..."
                className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Right 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Unit Summary Card</span>
                <Boxes className="w-4 h-4 text-indigo-400" />
              </h4>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Unit Name</span>
                  <p className="font-bold text-white text-sm">{formData.name || 'Unit Name'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Short Code</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-bold rounded-md text-xs border border-indigo-500/30">
                    {formData.shortName || 'CODE'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Decimal Fraction Allowed</span>
                  <p className="font-semibold text-slate-200">{formData.allowDecimal ? 'Yes' : 'No'}</p>
                </div>
                {formData.isMultiple && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Sub-unit Formula</span>
                    <p className="font-mono text-xs text-amber-300">
                      1 {formData.shortName || 'Unit'} = {formData.baseUnitMultiplier || '1'} x Base
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'}`}>
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>Units of Measurement (UoM)</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                  {units.length} Units Defined
                </span>
                {selectedUnitIds.size > 0 && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isLight ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                    {selectedUnitIds.size} Selected
                  </span>
                )}
              </h1>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Manage base units (Pieces, Kilograms, Liters) and packaging multipliers (Box of 10, Dozen, Cartons) for product catalog and POS sales.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <ExportButtons
            headers={['Unit Name', 'Short Name', 'Allow Decimal', 'Classification', 'Multiplier', 'Base Unit Ref', 'Linked Products', 'Description', 'Unit ID']}
            keys={['name', 'shortName', 'allowDecimal', 'classification', 'multiplier', 'baseUnitRef', 'linkedProducts', 'description', 'id']}
            data={exportUnitsData}
            filename={`units_catalog_${new Date().toISOString().slice(0, 10)}`}
            title="Units of Measurement (UoM) Catalog"
            isLight={isLight}
          />
          {isAdminOrManager && (
            <button
              id="units-add-btn"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Status notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between transition-all animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-800/80 text-rose-200'
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
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Units</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{units.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Configured measurement types</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Base Units</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {units.filter((u) => u.isBaseUnit !== false && !u.baseUnitId).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Primary standalone units</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Secondary / Sub-Units</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {units.filter((u) => u.isBaseUnit === false || !!u.baseUnitId).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pack / multiplier conversions</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Decimal-Enabled</span>
            <Boxes className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-1">
            {units.filter((u) => u.allowDecimal).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Weight, volume, and lengths</p>
        </div>
      </div>

      {/* Unified Container for Filter and Content */}
      <div className="shadow-sm">
        {/* Filter and Search Bar */}
        <div className={`p-4 rounded-t-2xl border border-b-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="units-search-input"
                type="text"
                placeholder="Search by unit name, code, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none transition ${isLight ? 'bg-slate-50 border-slate-200 focus:border-indigo-500' : 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white'}`}
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
            {selectedUnitIds.size > 0 && (
              <div className={`flex items-center gap-2 p-1.5 pl-3 rounded-xl animate-fadeIn whitespace-nowrap border ${
                isLight ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/40 border-indigo-500/20'
              }`}>
                <div className="flex items-center gap-2 mr-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                    {selectedUnitIds.size}
                  </span>
                  <span className={`text-[10px] font-bold hidden md:inline ${isLight ? 'text-indigo-800' : 'text-white'}`}>
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExportCSV}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    title={`Export ${selectedUnitIds.size} selected to CSV`}
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

          {/* Filter Badges */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Page size filter (Light Mode Only) */}
            {isLight && (
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`text-xs px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-700 text-white'}`}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            )}

            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Units ({units.length})
            </button>
            <button
              onClick={() => setFilterType('base')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                filterType === 'base'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Base Units
            </button>
            <button
              onClick={() => setFilterType('secondary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                filterType === 'secondary'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Secondary / Packs
            </button>
            <button
              onClick={() => setFilterType('decimal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                filterType === 'decimal'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Decimal Enabled
            </button>
          </div>
        </div>

        {/* Units Content Table (Attached) */}
        <div className={`border rounded-b-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${isLight ? 'bg-slate-50 border-b border-slate-200 text-slate-600' : 'bg-slate-950 border-b border-slate-800 text-slate-400'} uppercase text-[10px] font-bold tracking-wider`}>
                  <th className="py-3.5 px-4 text-center border-r border-slate-800/50 w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomePageSelected;
                      }}
                      onChange={handleToggleSelectPage}
                      className={`w-4 h-4 rounded border-slate-700 focus:ring-indigo-500 cursor-pointer transition ${isLight ? 'text-indigo-600' : 'bg-slate-950 text-indigo-600'}`}
                    />
                  </th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Short Code</th>
                  <th className="py-3.5 px-4">Allow Decimal</th>
                  <th className="py-3.5 px-4">Unit Classification & Multiplier</th>
                  <th className="py-3.5 px-4">Products Linked</th>
                  <th className="py-3.5 px-4">Description / Usage</th>
                  {isAdminOrManager && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className={`${isLight ? 'divide-y divide-slate-100' : 'divide-y divide-slate-800/60'}`}>
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminOrManager ? 8 : 7} className="text-center py-12 text-slate-400">
                      <Scale className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No units found matching your search</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting filters or click &quot;+ Add Unit&quot; to create a new measurement unit.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUnits.map((u) => {
                    const productCount = unitProductCounts[u.id] || 0;
                    const isBase = u.isBaseUnit !== false && !u.baseUnitId;
                    const baseUnitRef = u.baseUnitId ? units.find((b) => b.id === u.baseUnitId) : null;
                    const isSelected = selectedUnitIds.has(u.id);

                    return (
                      <tr
                        key={u.id}
                        id={`unit-row-${u.id}`}
                        className={`transition group ${isSelected ? (isLight ? 'bg-indigo-50/50' : 'bg-indigo-950/20') : ''} ${isLight ? 'hover:bg-slate-50/60 text-slate-800' : 'hover:bg-slate-800/40 text-slate-300'}`}
                      >
                        <td className={`py-3.5 px-4 text-center border-r border-slate-800/50 ${isSelected ? (isLight ? 'bg-indigo-100/30' : 'bg-indigo-900/20') : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleUnitSelect(u.id)}
                            className={`w-4 h-4 rounded border-slate-700 focus:ring-indigo-500 cursor-pointer transition ${isLight ? 'text-indigo-600' : 'bg-slate-950 text-indigo-600'}`}
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {u.name}
                          </span>
                        </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-lg text-xs">
                          {u.shortName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.allowDecimal ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Yes (Decimals)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>No (Integers Only)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isBase ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${isLight ? 'text-sky-700 bg-sky-100 border-sky-300' : 'text-sky-300 bg-sky-950/60 border-sky-800/50'}`}>
                              Base Unit
                            </span>
                            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>(Primary Standard)</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isLight ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-amber-300 bg-amber-950/60 border-amber-800/50'}`}>
                                Sub-Unit
                              </span>
                              <span>
                                1 {u.shortName} = {u.baseUnitMultiplier || 1} {baseUnitRef ? baseUnitRef.shortName : 'Base'}
                              </span>
                            </div>
                            {baseUnitRef && (
                              <p className="text-[10px] text-slate-500">
                                Derived from {baseUnitRef.name}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Boxes className="w-3.5 h-3.5 text-slate-500" />
                          <span
                            className={`font-semibold ${
                              productCount > 0 ? 'text-white' : 'text-slate-500'
                            }`}
                          >
                            {productCount} {productCount === 1 ? 'Product' : 'Products'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {u.description || <span className="text-slate-600 italic">No notes</span>}
                      </td>

                      {isAdminOrManager && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`unit-edit-btn-${u.id}`}
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                              title="Edit Unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`unit-delete-btn-${u.id}`}
                              onClick={() => setUnitToDelete(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Delete Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      {/* Footer info */}
      <div className={`p-3 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-2 ${isLight ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Units defined here are automatically available across Product Creation, POS line items, and Purchase Orders.
          </span>
        </div>
        <span className={`${isLight ? 'text-slate-400' : 'text-slate-500'} text-[11px]`}>Showing {filteredUnits.length} of {units.length} total units</span>
      </div>

      {/* Pagination Footer (Light Mode Only) */}
      {isLight && totalPages > 1 && (
        <div className={`flex items-center justify-between px-4 py-3 border-t bg-slate-50/30 ${isLight ? 'border-slate-200/80' : 'border-slate-800'}`}>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{Math.min((currentPage - 1) * pageSize + 1, filteredUnits.length)}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredUnits.length)}</span> of <span className="font-bold text-slate-800">{filteredUnits.length}</span> entries
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

      {/* Delete Confirmation Modal */}
      {unitToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Measurement Unit</h3>
                <p className="text-xs text-slate-400">Confirmation required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete unit{' '}
              <strong className="text-white font-bold">&quot;{unitToDelete.name} ({unitToDelete.shortName})&quot;</strong>?
            </p>

            {(unitProductCounts[unitToDelete.id] || 0) > 0 && (
              <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Warning: <strong>{unitProductCounts[unitToDelete.id]}</strong> products currently use this unit. Deletion will be rejected by the system to maintain database integrity.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setUnitToDelete(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                  isLight 
                    ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                }`}
              >
                Cancel
              </button>
              <button
                id="unit-confirm-delete-btn"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
