import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { lookupPostalCode } from '../../utils/postalLookup';
import { 
  Building, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Save,
  AlertCircle,
  Sparkles,
  Loader2,
  Globe2,
  Navigation,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Location } from '../../types/erp';

export const LocationsTab: React.FC = () => {
  const { 
    settings,
    updateSettings,
    locations, 
    selectedLocationId, 
    setSelectedLocationId,
    addLocation,
    updateLocation,
    deleteLocation,
    currentUser,
  } = useErp();

  const isLight = settings?.themeMode === 'light';
  const currentBusinessName = (currentUser?.businessName || settings?.businessName || settings?.name || '').trim().toLowerCase();
  const currentBusinessId = currentUser?.businessId;

  const displayedLocations = useMemo(() => {
    const scoped = locations.filter((l) => {
      if (currentBusinessId && l.businessId) {
        return l.businessId === currentBusinessId;
      }
      if (currentBusinessName && l.businessName) {
        return l.businessName.trim().toLowerCase() === currentBusinessName;
      }
      if (currentBusinessName && !l.businessName) {
        return l.id === currentUser?.locationId || l.id === selectedLocationId;
      }
      return true;
    });
    return scoped.length > 0 ? scoped : locations;
  }, [locations, currentBusinessName, currentBusinessId, currentUser?.locationId, selectedLocationId]);

  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    phone: string;
    address: string;
    zip: string;
    city: string;
    district: string;
    state: string;
    country: string;
    isDefault: boolean;
  }>({
    name: '',
    code: '',
    phone: '',
    address: '',
    zip: '',
    city: '',
    district: '',
    state: '',
    country: '',
    isDefault: false
  });

  const [error, setError] = useState<string | null>(null);
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [zipSuccessMsg, setZipSuccessMsg] = useState<string | null>(null);
  const lookupTimerRef = useRef<any>(null);

  const handleOpenAdd = () => {
    setEditingLoc(null);
    setFormData({
      name: '',
      code: '',
      phone: '',
      address: '',
      zip: '',
      city: '',
      district: '',
      state: '',
      country: settings?.country || 'United States',
      isDefault: displayedLocations.length === 0
    });
    setError(null);
    setZipSuccessMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLoc(loc);
    setFormData({
      name: loc.name || '',
      code: loc.code || '',
      phone: loc.phone || '',
      address: loc.address || '',
      zip: loc.zip || '',
      city: loc.city || '',
      district: loc.district || '',
      state: loc.state || '',
      country: loc.country || settings?.country || 'United States',
      isDefault: !!loc.isDefault
    });
    setError(null);
    setZipSuccessMsg(null);
    setShowModal(true);
  };

  // Perform postal code lookup and auto-populate
  const triggerPostalLookup = async (zipCode: string, targetCountry?: string) => {
    const trimmed = (zipCode || '').trim();
    if (trimmed.length < 3) {
      setZipSuccessMsg(null);
      return;
    }

    setIsLookingUpZip(true);
    setZipSuccessMsg(null);

    try {
      const result = await lookupPostalCode(trimmed, targetCountry || formData.country);
      if (result) {
        setFormData(prev => ({
          ...prev,
          city: result.city || prev.city,
          district: result.district || prev.district,
          state: result.state || prev.state,
          country: result.country || prev.country
        }));
        setZipSuccessMsg(`Auto-populated: ${result.city}${result.state ? `, ${result.state}` : ''}, ${result.country}`);
      }
    } catch (err) {
      console.error('Postal lookup error:', err);
    } finally {
      setIsLookingUpZip(false);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZip = e.target.value;
    setFormData(prev => ({ ...prev, zip: newZip }));

    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
    }

    if (newZip.trim().length >= 3) {
      lookupTimerRef.current = setTimeout(() => {
        triggerPostalLookup(newZip);
      }, 350);
    } else {
      setZipSuccessMsg(null);
    }
  };

  useEffect(() => {
    return () => {
      if (lookupTimerRef.current) {
        clearTimeout(lookupTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate mandatory fields
    if (!formData.name.trim()) {
      setError('Branch Name is mandatory.');
      return;
    }
    if (!formData.code.trim()) {
      setError('Location Code is mandatory.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone Number is mandatory.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Address is mandatory.');
      return;
    }
    if (!formData.zip.trim()) {
      setError('Zipcode / Pincode is mandatory.');
      return;
    }
    if (!formData.city.trim()) {
      setError('City is mandatory.');
      return;
    }
    if (!formData.state.trim()) {
      setError('State is mandatory.');
      return;
    }
    if (!formData.country.trim()) {
      setError('Country is mandatory.');
      return;
    }

    const phoneVal = validatePhoneNumber(formData.phone, true);
    if (!phoneVal.isValid) {
      setError(phoneVal.error || 'Invalid phone number format');
      return;
    }

    if (editingLoc) {
      updateLocation(editingLoc.id, formData);
    } else {
      addLocation(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this location? This action cannot be undone if the location is not in use.')) {
      const result = deleteLocation(id);
      if (!result.success) {
        alert(result.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className={`border rounded-3xl p-6 space-y-5 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Building className="w-5 h-5 text-indigo-500" />
              <span>Multi-Location Outlets & Warehouses</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Configured physical branches, stock locations, and retail storefronts with auto-resolved addresses.
            </p>
          </div>
          <button
            id="btn-add-new-branch"
            type="button"
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
        </div>

        {/* Setting Toggle */}
        <div 
          className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
            isLight 
              ? 'bg-slate-50/90 border-slate-200 hover:bg-indigo-50/60 hover:border-indigo-300 shadow-xs' 
              : 'bg-slate-950/50 border-slate-800/50 hover:bg-slate-800/30'
          }`}
          onClick={() => updateSettings({ enableMultiLocationInventory: !settings.enableMultiLocationInventory })}
        >
          <div>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Enable Multi-Location Inventory in Product Form
            </h4>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              When enabled, admins can assign stock values and alerts per branch when creating/editing a product.
            </p>
          </div>
          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableMultiLocationInventory ? 'bg-emerald-500' : 'bg-slate-700'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableMultiLocationInventory ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </div>

        {/* Outlets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedLocations.map((loc) => {
            const isSelected = selectedLocationId === loc.id;
            const formattedAddressParts = [
              loc.address,
              loc.city,
              loc.district,
              loc.state ? `${loc.state} ${loc.zip || ''}`.trim() : loc.zip,
              loc.country
            ].filter(Boolean);

            const fullAddressDisplay = formattedAddressParts.length > 0
              ? formattedAddressParts.join(', ')
              : 'Address not configured';

            return (
              <div
                key={loc.id}
                id={`branch-card-${loc.id}`}
                onClick={() => setSelectedLocationId(loc.id)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between group relative ${
                  isSelected
                    ? isLight
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md text-slate-900'
                      : 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg text-white'
                    : isLight
                      ? 'bg-white hover:bg-indigo-50/80 border-slate-200 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 hover:shadow-md text-slate-700 hover:text-slate-900 shadow-sm'
                      : 'bg-slate-950/70 hover:bg-slate-800/40 border-slate-800 text-slate-300'
                }`}
              >
                {/* Action Buttons Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`btn-edit-branch-${loc.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(loc);
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      isLight 
                        ? 'bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border-indigo-200 hover:border-indigo-600 shadow-xs' 
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                    }`}
                    title="Edit Branch Location"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {!loc.isDefault && (
                    <button
                      id={`btn-delete-branch-${loc.id}`}
                      type="button"
                      onClick={(e) => handleDelete(loc.id, e)}
                      className={`p-1.5 rounded-lg border transition ${
                        isLight
                          ? 'bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border-rose-200 hover:border-rose-500 shadow-xs'
                          : 'bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border-rose-500/20 hover:border-rose-500'
                      }`}
                      title="Delete Branch Location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                      isLight 
                        ? 'bg-indigo-100/90 text-indigo-800 border-indigo-200 shadow-xs' 
                        : 'bg-slate-800 text-indigo-300 border-slate-700'
                    }`}>
                      {loc.code || 'LOC'}
                    </span>
                    {loc.isDefault && (
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                        isLight
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Primary Flagship
                      </span>
                    )}
                  </div>

                  <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {loc.name}
                  </h4>

                  <div className={`space-y-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{fullAddressDisplay}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold">{loc.phone || 'No phone'}</span>
                    </p>
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Status: <strong className="text-emerald-500">Active</strong>
                  </span>
                  {isSelected ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Outlet
                    </span>
                  ) : (
                    <span className={`text-[11px] font-medium transition ${isLight ? 'text-slate-500 hover:text-indigo-600' : 'text-slate-400 hover:text-slate-200'}`}>
                      Select &rarr;
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Branch Outlet Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden my-auto ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              {/* Modal Header */}
              <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div>
                  <h3 className={`text-lg font-black flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {editingLoc ? (
                      <Edit3 className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <Plus className="w-5 h-5 text-emerald-500" />
                    )}
                    <span>{editingLoc ? 'Edit Branch Location' : 'Register New Outlet'}</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Enter branch credentials and postal code to automatically populate regional details.
                  </p>
                </div>
                <button
                  id="btn-close-branch-modal"
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-xl transition cursor-pointer border ${
                    isLight 
                      ? 'border-transparent text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 hover:shadow-md' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {zipSuccessMsg && (
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-300 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span>{zipSuccessMsg}</span>
                  </div>
                )}

                {/* Branch Name & Location Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Branch Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-branch-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Royal POSfini Westside Outlet"
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium transition outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                      }`}
                    />
                    <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Official trade or warehouse name of this branch.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Location Code <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-branch-code"
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. HQ01, BR02"
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium transition outline-none font-mono uppercase ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                      }`}
                    />
                    <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Unique short identifier code for receipts & stock routing.
                    </p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Phone Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-branch-phone"
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium transition outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Primary operational contact phone for store inventory & inquiries.
                  </p>
                </div>

                {/* Address (Renamed from Full Physical Address) */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <textarea
                    id="input-branch-address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address, building number, suite, floor, or landmark"
                    rows={2}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium transition outline-none resize-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                        : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                    }`}
                  />
                  <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Street address, building number, suite, or landmark (e.g. 123 Commercial Ave, Suite 400).
                  </p>
                </div>

                {/* Zipcode / Pincode & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Zipcode / Pincode with Auto-detection */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Zipcode / Pincode <span className="text-rose-500 font-bold">*</span>
                      </label>
                      {isLookingUpZip && (
                        <span className="text-[10px] text-indigo-500 font-semibold flex items-center gap-1 mr-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="input-branch-zipcode"
                        type="text"
                        required
                        value={formData.zip}
                        onChange={handleZipChange}
                        onBlur={() => triggerPostalLookup(formData.zip)}
                        placeholder="e.g. 10001, 560001, SW1A 1AA"
                        className={`w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm font-medium transition outline-none uppercase ${
                          isLight 
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                            : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                        }`}
                      />
                      <Navigation className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      {formData.zip && !isLookingUpZip && (
                        <button
                          type="button"
                          onClick={() => triggerPostalLookup(formData.zip)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition cursor-pointer"
                          title="Auto-resolve location"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                      )}
                    </div>
                    <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Enter postal code or PIN to auto-populate City, District/Province, State & Country.
                    </p>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      City <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-branch-city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. New York, Bengaluru, London"
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium transition outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                      }`}
                    />
                    <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Municipality, town, or city where this branch is physically located.
                    </p>
                  </div>
                </div>

                {/* District / Province & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* District / Province */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      District / Province
                    </label>
                    <div className="relative">
                      <input
                        id="input-branch-district"
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder="e.g. Manhattan District, Bangalore Urban"
                        className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-medium transition outline-none ${
                          isLight 
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                            : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                        }`}
                      />
                      <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      District, county, or provincial administrative territory.
                    </p>
                  </div>

                  {/* State */}
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      State <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      id="input-branch-state"
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. New York, Karnataka, California"
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium transition outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                      }`}
                    />
                    <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Federated state, territory, or administrative division.
                    </p>
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase tracking-wider block ml-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Country <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-branch-country"
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. United States, India, United Kingdom"
                      className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-medium transition outline-none ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                      }`}
                    />
                    <Globe2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className={`text-[11px] ml-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sovereign country or international trade territory.
                  </p>
                </div>

                {/* Primary Flagship Location Toggle */}
                <div 
                  id="toggle-primary-flagship-location"
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    isLight 
                      ? formData.isDefault
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md text-slate-900'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-indigo-50/80 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 hover:shadow-md' 
                      : 'bg-slate-950/50 border-slate-800/50 hover:bg-slate-800/30'
                  }`} 
                  onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    formData.isDefault 
                      ? 'bg-indigo-600 border-indigo-500' 
                      : isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900'
                  }`}>
                    {formData.isDefault && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Set as Primary Flagship Location
                    </p>
                    <p className={`text-[11px] leading-tight mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      The primary flagship location serves as the central stock hub and primary billing location for the business.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`pt-4 border-t flex items-center gap-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <button
                    id="btn-cancel-branch-modal"
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition cursor-pointer ${
                      isLight 
                        ? 'border-slate-200 text-slate-700 bg-white hover:bg-indigo-50/80 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 hover:shadow-md hover:text-indigo-900' 
                        : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-branch-modal"
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingLoc ? 'Update Branch' : 'Register Branch'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
