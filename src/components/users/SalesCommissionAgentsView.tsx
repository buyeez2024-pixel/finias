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
  const { salesCommissionAgents, addSalesCommissionAgent, updateSalesCommissionAgent, deleteSalesCommissionAgent } = useErp();
  
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-indigo-400" />
            Sales Commission Agents
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage agents and their commission percentages.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search agents by name, email, or contact no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Agent List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Agent Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contact Details
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Commission (%)
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedAgents.length > 0 ? (
                paginatedAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {agent.avatar ? (
                          <img
                            src={agent.avatar}
                            alt={`${agent.firstName} ${agent.lastName}`}
                            className="w-10 h-10 rounded-full object-cover border border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">
                            {agent.firstName.charAt(0)}{agent.lastName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">
                            {agent.firstName} {agent.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {agent.email}
                        </div>
                        {agent.contactNo && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {agent.contactNo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 text-sm text-slate-400 max-w-[200px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span className="truncate" title={agent.address || 'N/A'}>
                          {agent.address || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-sm font-bold">
                        {agent.commissionPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(agent)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                          title="Edit Agent"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-xs text-slate-400 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
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
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all transform scale-100 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">
                  {editingAgent ? 'Agent Profiles' : 'New Representative Registration'}
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  {editingAgent ? 'Modify Representative Settings' : 'Add Sales Representative'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddingAgent(false)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Column 1: Agent Photo & Earning Profile */}
                <div className="md:col-span-4 flex flex-col gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                      Agent Portrait
                    </label>
                    <div className="relative group w-24 h-24 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center overflow-hidden transition-all duration-200 hover:border-indigo-500 shadow-inner">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-center p-2 flex flex-col items-center justify-center">
                          <Camera className="w-6 h-6 text-slate-500 mb-1 group-hover:text-indigo-400 transition-colors" />
                          <span className="text-[10px] text-slate-500 font-bold leading-tight">Upload</span>
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
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 mt-2.5 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Photo</span>
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-500 text-center leading-tight mt-2 block">
                        PNG or JPG up to 2MB
                      </span>
                    )}
                  </div>

                  {/* Financial rate spotlight card */}
                  <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      Commission Policy
                    </h4>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Commission Rate (%) <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.commissionPercentage}
                          onChange={(e) => setFormData({ ...formData, commissionPercentage: e.target.value })}
                          className={`w-full bg-slate-950 border ${
                            formErrors.commissionPercentage ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-indigo-500'
                          } rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-emerald-400 focus:outline-none transition-all`}
                          placeholder="0.00"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-slate-500 absolute right-3 top-2 text-xs">%</span>
                      </div>
                      {formErrors.commissionPercentage && (
                        <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {formErrors.commissionPercentage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Personal Registry & Contacts */}
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        First Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`w-full bg-slate-950 border ${
                          formErrors.firstName ? 'border-rose-500 ring-1 ring-rose-500/20 font-bold' : 'border-slate-800 focus:border-indigo-500'
                        } rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-semibold transition-colors`}
                        placeholder="John"
                      />
                      {formErrors.firstName && (
                        <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-semibold transition-colors"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-500" />
                        </span>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full bg-slate-950 border ${
                            formErrors.email ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-indigo-500'
                          } rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none font-semibold transition-colors`}
                          placeholder="john@example.com"
                        />
                      </div>
                      {formErrors.email && (
                        <p className="text-[9px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Contact Number
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-500" />
                        </span>
                        <input
                          type="text"
                          value={formData.contactNo}
                          onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-semibold transition-colors"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Physical Address
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 pointer-events-none">
                          <MapPin className="h-4 w-4 text-slate-500" />
                        </span>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-semibold transition-colors resize-none"
                          placeholder="Specify local or permanent physical address details..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end items-center gap-3">
              <button
                onClick={() => setIsAddingAgent(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/15"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingAgent ? 'Update Profile' : 'Register Representative'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
