import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { CustomerGroupsView } from './CustomerGroupsView';
import { formatCurrency } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Truck,
  Search,
  Phone,
  Mail,
  DollarSign,
  Award,
  Edit,
  Trash2,
  MapPin,
  Receipt,
  Building,
  Plus,
  Eye,
  Percent,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  Layout,
  Columns,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

export const ContactsView: React.FC = () => {
  const {
    customers,
    suppliers,
    customerGroups,
    deleteCustomer,
    deleteSupplier,
    openAddCustomerPage,
    openEditCustomerPage,
    openAddSupplierPage,
    openEditSupplierPage,
    openCustomerLedger,
    openSupplierLedger,
    settings,
    activeTab,
    contactsSubTab,
    navigateToContacts,
    showFlashNotification,
    currentUser
  } = useErp();

  const isAdminOrManager = useMemo(() => {
    if (!currentUser) return true; // Default open access when no user logged in
    const role = currentUser.role;
    return role === 'supreme_admin' || role === 'admin' || role === 'store_manager';
  }, [currentUser]);

  const isSuppliers = activeTab === 'suppliers' || contactsSubTab === 'suppliers';
  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  // Column Visibility State
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [visibleCustomerColumns, setVisibleCustomerColumns] = useState<Record<string, boolean>>({
    id: true, name: true, business: true, contact: true, tax: true, balance: true, credit: true, due: true, loyalty: true, actions: true
  });
  const [visibleSupplierColumns, setVisibleSupplierColumns] = useState<Record<string, boolean>>({
    id: true, name: true, company: true, contact: true, tax: true, balance: true, payable: true, actions: true
  });

  const toggleCustomerColumn = (key: string) => setVisibleCustomerColumns(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleSupplierColumn = (key: string) => setVisibleSupplierColumns(prev => ({ ...prev, [key]: !prev[key] }));

  // Column definitions for visibility toggle
  const customerColumns = [
    { key: 'id', label: 'Customer Code / ID' }, { key: 'name', label: 'Customer Name' }, { key: 'business', label: 'Business / Tier' },
    { key: 'contact', label: 'Contact Coordinates' }, { key: 'tax', label: 'Tax & Address' }, { key: 'balance', label: 'Opening / Adv Balance' },
    { key: 'credit', label: 'Credit Limit' }, { key: 'due', label: 'Current Due' }, { key: 'loyalty', label: 'Loyalty Points' },
    { key: 'actions', label: 'Actions' }
  ];
  const supplierColumns = [
    { key: 'id', label: 'Supplier Code / ID' }, { key: 'name', label: 'Supplier Name' }, { key: 'company', label: 'Company' },
    { key: 'contact', label: 'Contact Coordinates' }, { key: 'tax', label: 'Tax & Location' }, { key: 'balance', label: 'Opening Balance' },
    { key: 'payable', label: 'Payables' }, { key: 'actions', label: 'Actions' }
  ];

  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, isSuppliers, pageSize]);

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contactId || c.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.taxNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactId || s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.taxNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customersExportData = useMemo(() => {
    return filteredCustomers.map((c) => ({
      id: c.contactId || c.id,
      name: c.name,
      businessName: c.businessName || '',
      customerGroup: c.customerGroup || 'Retail Customer',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      taxNumber: c.taxNumber || '',
      totalDue: c.totalDue || 0,
      totalSales: c.totalSales || 0,
      loyaltyPoints: c.loyaltyPoints || 0,
      creditLimit: c.creditLimit || 0,
    }));
  }, [filteredCustomers]);

  const suppliersExportData = useMemo(() => {
    return filteredSuppliers.map((s) => ({
      id: s.contactId || s.id,
      name: s.name,
      businessName: s.businessName || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      taxNumber: s.taxNumber || '',
      totalPayable: s.totalPayable || 0,
      totalPurchases: s.totalPurchases || 0,
      payTerm: s.payTerm || '',
    }));
  }, [filteredSuppliers]);

  const totalPagesCustomers = Math.ceil(filteredCustomers.length / pageSize);
  const totalPagesSuppliers = Math.ceil(filteredSuppliers.length / pageSize);

  const paginatedCustomers = React.useMemo(() => {
    if (!isLight) return filteredCustomers;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, isLight, currentPage, pageSize]);

  const paginatedSuppliers = React.useMemo(() => {
    if (!isLight) return filteredSuppliers;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(startIndex, startIndex + pageSize);
  }, [filteredSuppliers, isLight, currentPage, pageSize]);

  const currencySymbol = settings.currencySymbol || '$';

  const handleDeleteCustomer = (id: string, name: string) => {
    if (id === 'cust_walkin') {
      showFlashNotification('Standard Walk-in Retail Customer is a permanent system record and cannot be deleted.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      deleteCustomer(id);
    }
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      deleteSupplier(id);
      showFlashNotification(`Supplier "${name}" deleted.`, 'info');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    if (isSuppliers) {
      if (filteredSuppliers.length === 0) {
        showFlashNotification('No supplier records to export.', 'warning');
        return;
      }
      const exportData = filteredSuppliers.map((s) => ({
        'ID': s.contactId || s.id,
        'Supplier Name': s.name,
        'Business Name': s.businessName || '',
        'Email': s.email || '',
        'Phone': s.phone || '',
        'Alternate Phone': s.alternatePhone || '',
        'Address': s.address || '',
        'City': s.city || '',
        'State': s.state || '',
        'Zipcode': s.zipcode || '',
        'Country': s.country || '',
        'Tax Number / GSTIN': s.taxNumber || '',
        'Total Payable ($)': s.totalPayable || 0,
        'Total Purchases ($)': s.totalPurchases || 0,
        'Pay Term': s.payTerm || '',
        'Created Date': s.createdDate || '',
        'Contact Type': 'supplier',
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
      XLSX.writeFile(wb, `Suppliers_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showFlashNotification(`Exported ${filteredSuppliers.length} suppliers to Excel.`, 'success');
    } else {
      if (filteredCustomers.length === 0) {
        showFlashNotification('No customer records to export.', 'warning');
        return;
      }
      const exportData = filteredCustomers.map((c) => ({
        'ID': c.contactId || c.id,
        'Customer Name': c.name,
        'Business Name': c.businessName || '',
        'Customer Group': c.customerGroup || 'Retail Customer',
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Alternate Phone': c.alternatePhone || '',
        'Address': c.address || '',
        'City': c.city || '',
        'State': c.state || '',
        'Zipcode': c.zipcode || '',
        'Country': c.country || '',
        'Tax Number / GSTIN': c.taxNumber || '',
        'Total Due ($)': c.totalDue || 0,
        'Total Sales ($)': c.totalSales || 0,
        'Loyalty Points': c.loyaltyPoints || 0,
        'Credit Limit ($)': c.creditLimit || 0,
        'Pay Term': c.payTerm || '',
        'Created Date': c.createdDate || '',
        'Contact Type': 'customer',
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showFlashNotification(`Exported ${filteredCustomers.length} customers to Excel.`, 'success');
    }
  };

  const handleExportCSV = () => {
    if (isSuppliers) {
      if (filteredSuppliers.length === 0) {
        showFlashNotification('No supplier records to export.', 'warning');
        return;
      }
      const exportData = filteredSuppliers.map((s) => ({
        'ID': s.contactId || s.id,
        'Supplier Name': s.name,
        'Business Name': s.businessName || '',
        'Email': s.email || '',
        'Phone': s.phone || '',
        'Address': s.address || '',
        'Tax Number': s.taxNumber || '',
        'Total Payable': s.totalPayable || 0,
        'Total Purchases': s.totalPurchases || 0,
        'Contact Type': 'supplier',
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
      XLSX.writeFile(wb, `Suppliers_Export_${new Date().toISOString().slice(0, 10)}.csv`, { bookType: 'csv' });
      showFlashNotification(`Exported ${filteredSuppliers.length} suppliers to CSV.`, 'success');
    } else {
      if (filteredCustomers.length === 0) {
        showFlashNotification('No customer records to export.', 'warning');
        return;
      }
      const exportData = filteredCustomers.map((c) => ({
        'ID': c.contactId || c.id,
        'Customer Name': c.name,
        'Business Name': c.businessName || '',
        'Customer Group': c.customerGroup || 'Retail Customer',
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Address': c.address || '',
        'Tax Number': c.taxNumber || '',
        'Total Due': c.totalDue || 0,
        'Total Sales': c.totalSales || 0,
        'Contact Type': 'customer',
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().slice(0, 10)}.csv`, { bookType: 'csv' });
      showFlashNotification(`Exported ${filteredCustomers.length} customers to CSV.`, 'success');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Banner & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              onClick={() => navigateToContacts('import_contacts')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Bulk Contacts</span>
            </button>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-2">
            {isSuppliers ? <Truck className="w-5 h-5 text-indigo-400" /> : <Users className="w-5 h-5 text-indigo-400" />}
            <span>{isSuppliers ? 'Suppliers' : 'Customers'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSuppliers
              ? `Manage vendor accounts, tax IDs, opening balances, and supplier ledgers.`
              : `Maintain customer loyalty credits, ledger balances, opening balances, advance deposits, and contact details.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ExportButtons
            headers={
              isSuppliers
                ? ['ID', 'Supplier Name', 'Business Name', 'Email', 'Phone', 'Address', 'Tax Number', 'Total Payable', 'Total Purchases', 'Pay Term']
                : ['ID', 'Customer Name', 'Business Name', 'Customer Group', 'Email', 'Phone', 'Address', 'Tax Number', 'Total Due', 'Total Sales', 'Loyalty Points', 'Credit Limit']
            }
            keys={
              isSuppliers
                ? ['id', 'name', 'businessName', 'email', 'phone', 'address', 'taxNumber', 'totalPayable', 'totalPurchases', 'payTerm']
                : ['id', 'name', 'businessName', 'customerGroup', 'email', 'phone', 'address', 'taxNumber', 'totalDue', 'totalSales', 'loyaltyPoints', 'creditLimit']
            }
            data={isSuppliers ? suppliersExportData : customersExportData}
            filename={isSuppliers ? 'suppliers_list' : 'customers_list'}
            title={isSuppliers ? 'Suppliers Directory' : 'Customers Directory'}
            isLight={isLight}
          />
          

          {!isSuppliers ? (
            <button
              onClick={openAddCustomerPage}
              id="btn-open-add-customer-page"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          ) : (
            <button
              onClick={openAddSupplierPage}
              id="btn-open-add-supplier-page"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

            {/* Column Visibility Section (Reference Screenshot Style) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 mb-6 animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Column Visibility</span>
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {isSuppliers ? Object.values(visibleSupplierColumns).filter(Boolean).length : Object.values(visibleCustomerColumns).filter(Boolean).length} of {isSuppliers ? supplierColumns.length : customerColumns.length} Visible
                </span>
                {isAdminOrManager && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 hidden sm:inline-flex">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Admin Privileges</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Select which columns to display in the contacts table.
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnVisibility && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = {};
                    (isSuppliers ? supplierColumns : customerColumns).forEach(c => allTrue[c.key] = true);
                    isSuppliers ? setVisibleSupplierColumns(allTrue) : setVisibleCustomerColumns(allTrue);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const standard = { id: true, name: true, company: true, contact: true, balance: true, actions: true };
                    const defaultCust = { id: true, name: true, business: true, contact: true, balance: true, actions: true };
                    isSuppliers ? setVisibleSupplierColumns(standard) : setVisibleCustomerColumns(defaultCust);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const compact = { id: true, name: true, balance: true, actions: true };
                    const compactCust = { id: true, name: true, balance: true, actions: true };
                    isSuppliers ? setVisibleSupplierColumns(compact) : setVisibleCustomerColumns(compactCust);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer hidden sm:inline-block"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultSupp = { id: true, name: true, company: true, contact: true, tax: true, balance: true, payable: true, actions: true };
                    const defaultCust = { id: true, name: true, business: true, contact: true, tax: true, balance: true, credit: true, due: true, loyalty: true, actions: true };
                    isSuppliers ? setVisibleSupplierColumns(defaultSupp) : setVisibleCustomerColumns(defaultCust);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-950/50 text-rose-400 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                  title="Reset to default columns"
                >
                  <RotateCcw className="w-3 h-3" /> 
                </button>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowColumnVisibility(!showColumnVisibility)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                showColumnVisibility 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {showColumnVisibility ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Fields</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show Fields</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showColumnVisibility && (
          <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50">
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {(isSuppliers ? supplierColumns : customerColumns).map((col) => {
                const isVisible = isSuppliers ? visibleSupplierColumns[col.key] : visibleCustomerColumns[col.key];
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => isSuppliers ? toggleSupplierColumn(col.key) : toggleCustomerColumn(col.key)}
                    className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isVisible
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/40'
                    } cursor-pointer active:scale-95`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-1 rounded-md ${
                        isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isVisible ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isVisible
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}>
                        {isVisible ? 'Shown' : 'Hidden'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold block truncate w-full">
                        {col.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{isSuppliers ? filteredSuppliers.length : filteredCustomers.length}</span> records
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Page size filter (Light Mode Only) */}
          {isLight && (
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          )}

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isSuppliers ? 'Search suppliers by name, business, tax ID, phone...' : 'Search customers by name, company, tax ID, city...'}
              className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* CUSTOMERS VIEW */}
      {!isSuppliers && (
        <>
          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-md">
                <Users className="w-8 h-8 text-indigo-400/80 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  {searchQuery ? `No customers found matching "${searchQuery}".` : 'No customer profiles created yet.'}
                </p>
                <button
                  type="button"
                  onClick={openAddCustomerPage}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Customer</span>
                </button>
              </div>
            ) : (
              paginatedCustomers.map((cust) => (
                <div key={cust.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-sm uppercase shrink-0">
                        {cust.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">{cust.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono text-indigo-400 font-bold">{cust.contactId || cust.id}</span>
                          <span>•</span>
                          <span>{cust.businessName || 'Individual'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 shrink-0">
                      {cust.customerGroup || 'Retail'}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Phone Contact</span>
                      <a href={`tel:${cust.phone}`} className="font-mono font-bold text-slate-200 flex items-center gap-1 hover:text-indigo-400 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.phone || 'N/A'}</span>
                      </a>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Current Due</span>
                      <div className="font-mono font-extrabold">
                        {(cust.totalDue || 0) > 0 ? (
                          <span className="text-amber-400">{formatCurrency(cust.totalDue || 0, settings)}</span>
                        ) : (
                          <span className="text-emerald-400">{formatCurrency(0, settings)}</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Loyalty Points</span>
                      <span className="font-bold text-indigo-400">{cust.loyaltyPoints || 0} pts</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Credit Limit</span>
                      <span className="font-mono font-semibold text-slate-300">{formatCurrency(cust.creditLimit || 0, settings)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => openCustomerLedger(cust.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCustomerPage(cust)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                  <tr>
                    {visibleCustomerColumns.id && <th className="py-3.5 px-4 text-left">Customer Code / ID</th>}
                    {visibleCustomerColumns.name && <th className="py-3.5 px-4 text-left">Customer Name</th>}
                    {visibleCustomerColumns.business && <th className="py-3.5 px-4 text-left">Business / Tier</th>}
                    {visibleCustomerColumns.contact && <th className="py-3.5 px-4 text-left">Contact Coordinates</th>}
                    {visibleCustomerColumns.tax && <th className="py-3.5 px-4 text-left">Tax & Address</th>}
                    {visibleCustomerColumns.balance && <th className="py-3.5 px-4 text-right">Opening / Adv Bal</th>}
                    {visibleCustomerColumns.credit && <th className="py-3.5 px-4 text-right">Credit Limit</th>}
                    {visibleCustomerColumns.due && <th className="py-3.5 px-4 text-right">Current Due</th>}
                    {visibleCustomerColumns.loyalty && <th className="py-3.5 px-4 text-center">Loyalty</th>}
                    {visibleCustomerColumns.actions && <th className="py-3.5 px-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        No customers found matching &quot;{searchQuery}&quot;. Click &quot;Add Customer&quot; to create a new profile.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-850/60 transition group">
                        {visibleCustomerColumns.id && (
                          <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400 whitespace-nowrap text-left">
                            {cust.contactId || cust.id}
                          </td>
                        )}
                        {visibleCustomerColumns.name && (
                          <td className="py-3.5 px-4 font-bold text-white text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">
                                {cust.name.slice(0, 2)}
                              </div>
                              <div>
                                <div>{cust.name}</div>
                                <div className="text-[10px] text-slate-500 font-normal">Added {cust.createdDate}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleCustomerColumns.business && (
                          <td className="py-3.5 px-4 text-left">
                            <div className="text-slate-300 font-medium">{cust.businessName || 'Individual'}</div>
                            <div className="text-[10px] text-indigo-400/80">{cust.customerGroup || 'Retail'}</div>
                          </td>
                        )}
                        {visibleCustomerColumns.contact && (
                          <td className="py-3.5 px-4 font-mono text-slate-300 text-left">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{cust.phone}</span>
                            </div>
                            {cust.email && cust.email !== 'N/A' && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-500" />
                                <span>{cust.email}</span>
                              </div>
                            )}
                          </td>
                        )}
                        {visibleCustomerColumns.tax && (
                          <td className="py-3.5 px-4 text-slate-300 text-left">
                            {cust.taxNumber && (
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                <Receipt className="w-3 h-3 text-slate-500" />
                                <span>{cust.taxNumber}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{[cust.city, cust.state, cust.province].filter(Boolean).join(', ') || cust.address || 'N/A'}</span>
                            </div>
                          </td>
                        )}
                        {visibleCustomerColumns.balance && (
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="text-slate-300">
                              Op: <span className="text-amber-400 font-medium">{formatCurrency(cust.openingBalance || 0, settings)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Adv: <span className="text-emerald-400">{formatCurrency(cust.advanceBalance || 0, settings)}</span>
                            </div>
                          </td>
                        )}
                        {visibleCustomerColumns.credit && (
                          <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-medium">
                            {formatCurrency(cust.creditLimit, settings)}
                          </td>
                        )}
                        {visibleCustomerColumns.due && (
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            {(cust.totalDue || 0) > 0 ? (
                              <span className="text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                                {formatCurrency(cust.totalDue || 0, settings)}
                              </span>
                            ) : (
                              <span className="text-emerald-400">{formatCurrency(0, settings)}</span>
                            )}
                          </td>
                        )}
                        {visibleCustomerColumns.loyalty && (
                          <td className="py-3.5 px-4 text-center font-bold text-indigo-400">
                            <span className="px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[10px]">
                              {cust.loyaltyPoints} pts
                            </span>
                          </td>
                        )}
                        {visibleCustomerColumns.actions && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openCustomerLedger(cust.id)}
                                id={`btn-ledger-customer-${cust.id}`}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLight
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                    : 'bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border-transparent'
                                }`}
                                title="View Customer Ledger Statement"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditCustomerPage(cust)}
                                id={`btn-edit-customer-${cust.id}`}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLight
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                    : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-transparent'
                                }`}
                                title="Edit Customer Profile"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                                id={`btn-delete-customer-${cust.id}`}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLight
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-rose-600 hover:text-white hover:border-rose-600'
                                    : 'bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border-transparent'
                                }`}
                                title="Delete Customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Light Mode Only) */}
            {isLight && totalPagesCustomers > 1 && (
              <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-t border-slate-800 rounded-b-2xl shadow-sm">
                <div className="text-xs text-slate-400 font-medium">
                  Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredCustomers.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredCustomers.length)}</span> of <span className="font-bold text-white">{filteredCustomers.length}</span> entries
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
                    Page {currentPage} of {totalPagesCustomers}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPagesCustomers, p + 1))}
                    disabled={currentPage === totalPagesCustomers}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* SUPPLIERS VIEW */}
      {isSuppliers && (
        <>
          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {filteredSuppliers.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-md">
                <Truck className="w-8 h-8 text-indigo-400/80 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  {searchQuery ? `No suppliers found matching "${searchQuery}".` : 'No supplier vendors created yet.'}
                </p>
                <button
                  type="button"
                  onClick={openAddSupplierPage}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Supplier</span>
                </button>
              </div>
            ) : (
              paginatedSuppliers.map((supp) => (
                <div key={supp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-sm uppercase shrink-0">
                        <Truck className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">{supp.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono text-indigo-400 font-bold">{supp.contactId || supp.id}</span>
                          <span>•</span>
                          <span>{supp.businessName || 'Vendor'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {supp.taxNumber || 'No Tax ID'}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Contact Phone</span>
                      <a href={`tel:${supp.phone}`} className="font-mono font-bold text-slate-200 flex items-center gap-1 hover:text-indigo-400 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{supp.phone || 'N/A'}</span>
                      </a>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Payables Outstanding</span>
                      <div className="font-mono font-extrabold">
                        {(supp.totalPayable || 0) > 0 ? (
                          <span className="text-amber-400">{formatCurrency(supp.totalPayable || 0, settings)}</span>
                        ) : (
                          <span className="text-emerald-400">{formatCurrency(0, settings)}</span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Address & Location</span>
                      <span className="text-slate-300 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{[supp.city, supp.state].filter(Boolean).join(', ') || supp.address || 'N/A'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => openSupplierLedger(supp.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditSupplierPage(supp)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSupplier(supp.id, supp.name)}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                  <tr>
                    {visibleSupplierColumns.id && <th className="py-3.5 px-4">ID</th>}
                    {visibleSupplierColumns.name && <th className="py-3.5 px-4">Supplier / Vendor</th>}
                    {visibleSupplierColumns.company && <th className="py-3.5 px-4">Company Name</th>}
                    {visibleSupplierColumns.contact && <th className="py-3.5 px-4">Contact Info</th>}
                    {visibleSupplierColumns.tax && <th className="py-3.5 px-4">Tax & Facility Location</th>}
                    {visibleSupplierColumns.balance && <th className="py-3.5 px-4 text-right">Opening / Adv Bal</th>}
                    {visibleSupplierColumns.payable && <th className="py-3.5 px-4 text-right">Payables Outstanding</th>}
                    {visibleSupplierColumns.actions && <th className="py-3.5 px-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No suppliers found matching &quot;{searchQuery}&quot;. Click &quot;Add Supplier&quot; to create a new vendor.
                      </td>
                    </tr>
                  ) : (
                    paginatedSuppliers.map((supp) => (
                      <tr key={supp.id} className="hover:bg-slate-850/60 transition group">
                        {visibleSupplierColumns.id && (
                          <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                            {supp.contactId || supp.id}
                          </td>
                        )}
                        {visibleSupplierColumns.name && (
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs uppercase">
                                {supp.name.slice(0, 2)}
                              </div>
                              <div>
                                <div>{supp.name}</div>
                                <div className="text-[10px] text-slate-500 font-normal">Added {supp.createdDate}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleSupplierColumns.company && (
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200 font-semibold">{supp.businessName}</div>
                            <div className="text-[10px] text-slate-400">{supp.payTerm || 'Net 30 Days'}</div>
                          </td>
                        )}
                        {visibleSupplierColumns.contact && (
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{supp.phone}</span>
                            </div>
                            {supp.email && supp.email !== 'N/A' && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-500" />
                                <span>{supp.email}</span>
                              </div>
                            )}
                          </td>
                        )}
                        {visibleSupplierColumns.tax && (
                          <td className="py-3.5 px-4 text-slate-300">
                            {supp.taxNumber && (
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                <Receipt className="w-3 h-3 text-slate-500" />
                                <span>{supp.taxNumber}</span>
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{[supp.city, supp.state, supp.province].filter(Boolean).join(', ') || supp.address || 'N/A'}</span>
                            </div>
                          </td>
                        )}
                        {visibleSupplierColumns.balance && (
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="text-slate-300">
                              Op: <span className="text-rose-400 font-medium">{formatCurrency(supp.openingBalance || 0, settings)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Adv: <span className="text-emerald-400">{formatCurrency(supp.advanceBalance || 0, settings)}</span>
                            </div>
                          </td>
                        )}
                        {visibleSupplierColumns.payable && (
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            {(supp.totalPayable || 0) > 0 ? (
                              <span className="text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20">
                                {formatCurrency(supp.totalPayable || 0, settings)}
                              </span>
                            ) : (
                              <span className="text-emerald-400">{formatCurrency(0, settings)}</span>
                            )}
                          </td>
                        )}
                        {visibleSupplierColumns.actions && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openSupplierLedger(supp.id)}
                                id={`btn-ledger-supplier-${supp.id}`}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLight
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                    : 'bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border-transparent'
                                }`}
                                title="View Supplier Ledger Statement"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditSupplierPage(supp)}
                                id={`btn-edit-supplier-${supp.id}`}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLight
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                    : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-transparent'
                                }`}
                                title="Edit Supplier Profile"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supp.id, supp.businessName)}
                                id={`btn-delete-supplier-${supp.id}`}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLight
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-rose-600 hover:text-white hover:border-rose-600'
                                    : 'bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border-transparent'
                                }`}
                                title="Delete Supplier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Light Mode Only) */}
            {isLight && totalPagesSuppliers > 1 && (
              <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-t border-slate-800 rounded-b-2xl shadow-sm">
                <div className="text-xs text-slate-400 font-medium">
                  Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredSuppliers.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredSuppliers.length)}</span> of <span className="font-bold text-white">{filteredSuppliers.length}</span> entries
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
                    Page {currentPage} of {totalPagesSuppliers}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPagesSuppliers, p + 1))}
                    disabled={currentPage === totalPagesSuppliers}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
