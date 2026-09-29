import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { validateEmail } from '../../utils/formatters';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Percent,
  X,
  CheckCircle2,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { SalesCommissionAgent } from '../../types/erp';

export const SalesCommissionAgentsView: React.FC = () => {
  const { settings, salesCommissionAgents, addSalesCommissionAgent, updateSalesCommissionAgent, deleteSalesCommissionAgent } = useErp();
  const isLight = settings?.themeMode === 'light';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SalesCommissionAgent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    address: '',
    commissionPercentage: '',
    avatar: '',
  });

  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    email?: string;
    commissionPercentage?: string;
  }>({});

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredAgents = salesCommissionAgents.filter(
    (agent) =>
      agent.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.contactNo.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredAgents.length / rowsPerPage) || 1;
  const paginatedAgents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAgents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAgents, currentPage, rowsPerPage]);

  const handleOpenAdd = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      contactNo: '',
      address: '',
      commissionPercentage: '',
      avatar: '',
    });
    setFormErrors({});
    setEditingAgent(null);
    setIsAddingAgent(true);
  };

  const handleOpenEdit = (agent: SalesCommissionAgent) => {
    setFormData({
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      contactNo: agent.contactNo,
      address: agent.address,
      commissionPercentage: agent.commissionPercentage.toString(),
      avatar: agent.avatar || '',
    });
    setFormErrors({});
    setEditingAgent(agent);
    setIsAddingAgent(true);
  };

  const handleSave = () => {
    const errors: typeof formErrors = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address with a proper domain (e.g. name@mail.com)';
    }
    if (!formData.commissionPercentage.trim()) {
      errors.commissionPercentage = 'Commission percentage is required';
    } else {
      const pct = parseFloat(formData.commissionPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        errors.commissionPercentage = 'Must be between 0 and 100';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      contactNo: formData.contactNo.trim(),
      address: formData.address.trim(),
      commissionPercentage: parseFloat(formData.commissionPercentage) || 0,
      avatar: formData.avatar,
    };

    if (editingAgent) {
      updateSalesCommissionAgent(editingAgent.id, payload);
    } else {
      addSalesCommissionAgent(payload);
    }

    setIsAddingAgent(false);
    setEditingAgent(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteSalesCommissionAgent(id);
    }
  };

  React.useEffect(() => {
    const handleOpenAddAgent = () => {
      handleOpenAdd();
    };
    window.addEventListener('open-add-agent', handleOpenAddAgent);
    return () => window.removeEventListener('open-add-agent', handleOpenAddAgent);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Bar & Quick Actions */}
      <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-3 ${
        isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents by name, email, or contact no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        {paginatedAgents.length > 0 ? (
          paginatedAgents.map((agent) => (
            <div
              key={`mobile_agent_${agent.id}`}
              className={`p-4 rounded-2xl border transition shadow-xs space-y-3 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              {/* Top row: Avatar + Name + Commission Badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {agent.avatar ? (
                    <img
                      src={agent.avatar}
                      alt={`${agent.firstName} ${agent.lastName}`}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                      {agent.firstName.charAt(0)}{agent.lastName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {agent.firstName} {agent.lastName}
                    </h4>
                    <span className="text-xs text-slate-400 block truncate">{agent.email}</span>
                  </div>
                </div>

                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-xs font-black shrink-0">
                  {agent.commissionPercentage}%
                </span>
              </div>

              {/* Contact & Address */}
              <div className="space-y-1 text-xs border-t pt-2 border-slate-100 dark:border-slate-800/80">
                {agent.contactNo && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{agent.contactNo}</span>
                  </div>
                )}
                {agent.address && (
                  <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 truncate">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="truncate">{agent.address}</span>
                  </div>
                )}
              </div>

              {/* Actions row */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(agent)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(agent.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={`p-8 text-center font-semibold rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            No agents found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Desktop Agent List (>= md) */}
      <div className={`hidden md:block rounded-2xl border overflow-hidden ${
        isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}>
                <th className="px-6 py-4">Agent Name</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-center">Commission (%)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
              {paginatedAgents.length > 0 ? (
                paginatedAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    className={`transition-colors ${isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {agent.avatar ? (
                          <img
                            src={agent.avatar}
                            alt={`${agent.firstName} ${agent.lastName}`}
                            className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                            {agent.firstName.charAt(0)}{agent.lastName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {agent.firstName} {agent.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className={`flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {agent.email}
                        </div>
                        {agent.contactNo && (
                          <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {agent.contactNo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-start gap-2 text-sm max-w-[200px] truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="truncate" title={agent.address || 'N/A'}>
                          {agent.address || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-sm font-bold">
                        {agent.commissionPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(agent)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isLight ? 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10'
                          }`}
                          title="Edit Agent"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isLight ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-400/10'
                          }`}
                          title="Delete Agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No agents found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-xs border-t ${
          isLight ? 'bg-slate-50/70 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="ml-2">
              Showing {filteredAgents.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * rowsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  currentPage === page
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal - 100% Mobile Portrait Responsive with Pinned Sticky Footer */}
      {isAddingAgent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in overflow-hidden">
          <div className={`w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60' : 'bg-slate-900 border-slate-800 text-white shadow-black/90'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-widest uppercase block">
                  {editingAgent ? 'Agent Profiles' : 'New Representative Registration'}
                </span>
                <h3 className={`text-base font-bold flex items-center gap-2 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span className="truncate">{editingAgent ? 'Modify Representative Settings' : 'Add Sales Representative'}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsAddingAgent(false)}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content - Scrollable Body */}
            <div className={`p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 min-h-0 overflow-y-auto ${
              isLight ? 'bg-white' : 'bg-slate-900'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
                
                {/* Column 1: Agent Photo & Earning Profile */}
                <div className="md:col-span-4 flex flex-col gap-4">
                  <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 text-center ${
                      isLight ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      Agent Portrait
                    </label>
                    <div className={`relative group w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 hover:border-indigo-500 shadow-inner ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-800'
                    }`}>
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-center p-2 flex flex-col items-center justify-center">
                          <Camera className="w-6 h-6 text-slate-400 mb-1 group-hover:text-indigo-500 transition-colors" />
                          <span className="text-[10px] text-slate-400 font-bold leading-tight">Upload</span>
                        </div>
                      )}
                      
                      {/* File input */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {formData.avatar ? (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: '' })}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 mt-2.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Photo</span>
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 text-center leading-tight mt-2 block">
                        PNG or JPG up to 2MB
                      </span>
                    )}
                  </div>

                  {/* Financial rate spotlight card */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${
                    isLight ? 'bg-emerald-50/50 border-emerald-200/80' : 'bg-slate-950/20 border-slate-800/80'
                  }`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Percent className="w-3.5 h-3.5" />
                      Commission Policy
                    </h4>
                    <div>
                      <label className={`block text-[10px] font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Commission Rate (%) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.commissionPercentage}
                          onChange={(e) => setFormData({ ...formData, commissionPercentage: e.target.value })}
                          className={`w-full border rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold focus:outline-none transition-all ${
                            formErrors.commissionPercentage
                              ? 'border-rose-500 ring-1 ring-rose-500/20'
                              : isLight
                              ? 'bg-white border-slate-300 text-emerald-700 focus:border-indigo-500'
                              : 'bg-slate-950 border-slate-800 text-emerald-400 focus:border-indigo-500'
                          }`}
                          placeholder="0.00"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-slate-400 absolute right-3 top-2 text-xs font-bold">%</span>
                      </div>
                      {formErrors.commissionPercentage && (
                        <p className="text-[9px] text-rose-500 font-bold mt-1 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {formErrors.commissionPercentage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Personal Registry & Contacts */}
                <div className="md:col-span-8 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none font-semibold transition-colors ${
                          formErrors.firstName
                            ? 'border-rose-500 ring-1 ring-rose-500/20'
                            : isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                        }`}
                        placeholder="John"
                      />
                      {formErrors.firstName && (
                        <p className="text-[9px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none font-semibold transition-colors ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                        }`}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </span>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full border rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none font-semibold transition-colors ${
                            formErrors.email
                              ? 'border-rose-500 ring-1 ring-rose-500/20'
                              : isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                              : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                          }`}
                          placeholder="john@example.com"
                        />
                      </div>
                      {formErrors.email && (
                        <p className="text-[9px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Contact Number
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </span>
                        <input
                          type="text"
                          value={formData.contactNo}
                          onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                          className={`w-full border rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none font-semibold transition-colors ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                              : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                          }`}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                        Physical Address
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 pointer-events-none">
                          <MapPin className="h-4 w-4 text-slate-400" />
                        </span>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className={`w-full border rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none font-semibold transition-colors resize-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                              : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                          }`}
                          placeholder="Specify local or permanent physical address details..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Modal Footer - Pinned & Sticky on Mobile */}
            <div className={`p-3 sm:px-6 sm:py-4 border-t flex items-center justify-end gap-2.5 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAddingAgent(false)}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-[1.5] sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editingAgent ? 'Update Profile' : 'Register Representative'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
