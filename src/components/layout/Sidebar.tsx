import React, { useState, useEffect, useMemo } from 'react';
import { useErp, isUserAdmin } from '../../context/ErpContext';
import { SettingsSubTab, UserMenuSubTab } from '../../types/erp';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  DollarSign,
  BarChart3,
  Users,
  Building,
  Building2,
  Settings as SettingsIcon,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Percent,
  Coins,
  Lock,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Barcode,
  Sliders,
  SlidersHorizontal,
  Scale,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  FolderTree,
  BookOpen,
  Award,
  Layers,
  UserCheck,
  UserPlus,
  RotateCcw,
  FileText,
  ClipboardList,
  TrendingUp,
  ShoppingBag,
  Package,
  CreditCard,
  Wallet,
  Hash,
  Mail,
  Gift,
  Tag,
  History,
  Printer,
  Landmark,
  Search,
  X,
  Sparkles,
  Stamp,
  Command,
  Database,
  Upload,
} from 'lucide-react';
import { RoyalLogo } from '../common/RoyalLogo';

interface SubItemMeta {
  id: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  isActive: boolean;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab = () => {},
    settingsSubTab,
    businessSettingsSection,
    navigateToSettings = () => {},
    userMenuSubTab,
    navigateToUserMenu = () => {},
    openAddUserModal = () => {},
    isAddUserModalOpen = false,
    inventorySubTab,
    navigateToInventory = () => {},
    navigateToContacts = () => {},
    openAddContactPage = () => {},
    contactsSubTab,
    currentLocation = null,
    currentUser = null,
    users = [],
    hasModuleAccess = () => true,
    settings = {},
    isMobileSidebarOpen = false,
    setIsMobileSidebarOpen = () => {},
  } = useErp() || {};

  const lockedUsers = (users || []).filter((u: any) => u?.status === 'locked');

  const [searchQuery, setSearchQuery] = useState('');

  const getHrefForTab = (tab: string, subTab?: string): string => {
    let base = '/';
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/farm/') || p === '/farm') {
        base = '/farm/';
      }
    }

    let path = `/${tab}`;
    if (tab === 'dashboard') {
      path = '/dashboard';
    } else if (tab === 'installer' || tab === 'installation_wizard') {
      path = '/install';
    } else if (tab === 'inventory') {
      if (!subTab || subTab === 'matrix') {
        path = '/inventory';
      } else {
        path = `/inventory/${subTab}`;
      }
    } else if (tab === 'settings') {
      if (!subTab || subTab === 'business_settings') {
        path = '/settings';
      } else {
        path = `/settings/${subTab}`;
      }
    } else if (tab === 'user_menu') {
      if (subTab === 'users') {
        path = '/users';
      } else if (subTab === 'roles') {
        path = '/roles';
      } else if (subTab === 'permissions') {
        path = '/permissions';
      } else if (subTab === 'sales_commission_agents') {
        path = '/sales_commission_agents';
      } else if (subTab) {
        path = `/user_menu/${subTab}`;
      } else {
        path = '/user_menu';
      }
    } else if (tab === 'contacts') {
      if (!subTab || subTab === 'customers') {
        path = '/contacts';
      } else {
        path = `/contacts/${subTab}`;
      }
    } else if (tab === 'expenses') {
      path = '/expenses';
    } else if (tab === 'system_updates') {
      path = '/system_updates';
    } else if (tab === 'documentation' || tab === 'docs' || tab === 'user_manual') {
      path = '/documentation';
    } else if (tab === 'list_pos_sale' || tab === 'pos_sales') {
      path = '/pos_sales';
    }

    const resolved = (base + path).replace(/\/+/g, '/');
    return resolved;
  };

  // Determine active parent group based on activeTab & sub-tabs
  const getParentForActiveTab = (): string => {
    if (
      activeTab === 'inventory' ||
      activeTab === 'barcode_studio' ||
      activeTab === 'barcode' ||
      activeTab === 'labels' ||
      activeTab === 'products' ||
      activeTab === 'all_products' ||
      activeTab === 'add_product' ||
      activeTab === 'edit_product' ||
      activeTab === 'import_products' ||
      activeTab === 'product_history' ||
      activeTab === 'variations' ||
      activeTab === 'categories' ||
      activeTab === 'brands' ||
      activeTab === 'brands_list' ||
      activeTab === 'warranties' ||
      activeTab === 'racks' ||
      activeTab === 'units'
    ) {
      return 'inventory';
    }
    if (activeTab === 'transfer_adjustment' || activeTab === 'adjustments' || activeTab === 'transfers') {
      return 'transfer_adjustment';
    }
    if (
      activeTab === 'purchases' ||
      activeTab === 'import_purchases' ||
      activeTab === 'add_purchase' ||
      activeTab === 'edit_purchase' ||
      activeTab === 'view_purchase' ||
      activeTab === 'purchase_requisition' ||
      activeTab === 'purchase_order' ||
      activeTab === 'purchase_returns' ||
      activeTab === 'add_purchase_return' ||
      activeTab === 'edit_purchase_return' ||
      activeTab === 'view_purchase_return'
    ) {
      return 'purchases';
    }
    if (
      activeTab === 'sales' ||
      activeTab === 'list_pos_sale' ||
      activeTab === 'add_sale' ||
      activeTab === 'edit_sale' ||
      activeTab === 'view_sale' ||
      activeTab === 'list_drafts' ||
      activeTab === 'add_draft' ||
      activeTab === 'list_quotations' ||
      activeTab === 'add_quotation' ||
      activeTab === 'sale_returns' ||
      activeTab === 'add_sale_return' ||
      activeTab === 'edit_sale_return' ||
      activeTab === 'view_sale_return' ||
      activeTab === 'pos'
    ) {
      return 'sales';
    }
    if (
      activeTab === 'contacts' ||
      activeTab === 'customers' ||
      activeTab === 'suppliers' ||
      activeTab === 'add_contact' ||
      activeTab === 'edit_contact' ||
      activeTab === 'customer_groups' ||
      activeTab === 'customer_ledger' ||
      activeTab === 'supplier_ledger' ||
      activeTab === 'import_contacts'
    ) {
      return 'contacts';
    }
    if (
      activeTab === 'user_menu' ||
      activeTab === 'users' ||
      activeTab === 'roles' ||
      activeTab === 'permissions' ||
      activeTab === 'user_permissions' ||
      activeTab === 'sales_commission_agents' ||
      activeTab === 'add_user'
    ) {
      return 'user_menu';
    }
    if (
      activeTab === 'reports' ||
      activeTab === 'tax_report' ||
      activeTab === 'customer_supplier_report' ||
      activeTab === 'stock_report' ||
      activeTab === 'purchase_payment_report' ||
      activeTab === 'sell_payment_report' ||
      activeTab === 'product_purchase_report' ||
      activeTab === 'product_sell_report' ||
      activeTab === 'stock_adjustment_report' ||
      activeTab === 'sales_representative_report'
    ) {
      return 'reports';
    }
    if (
      activeTab === 'configuration' ||
      (activeTab === 'settings' && settingsSubTab !== 'business_settings')
    ) {
      return 'configuration';
    }
    if (
      activeTab === 'settings' &&
      settingsSubTab === 'business_settings'
    ) {
      return 'settings';
    }
    return activeTab;
  };

  const [expandedMenu, setExpandedMenu] = useState<string | null>(getParentForActiveTab());

  useEffect(() => {
    const parent = getParentForActiveTab();
    if (parent && parent !== 'dashboard' && parent !== 'expenses' && parent !== 'accounts') {
      setExpandedMenu(parent);
    }
  }, [activeTab, settingsSubTab]);

  // Submenu items definitions
  const inventorySubItems: SubItemMeta[] = [
    {
      id: 'matrix',
      label: 'All products',
      icon: Boxes,
      onClick: () => navigateToInventory('matrix'),
      isActive: (activeTab === 'inventory' && inventorySubTab === 'matrix') || activeTab === 'all_products' || activeTab === 'products',
    },
    {
      id: 'add_product',
      label: 'Add New Product',
      badge: 'Form',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      icon: Plus,
      onClick: () => navigateToInventory('add_product'),
      isActive: (activeTab === 'inventory' && (inventorySubTab === 'add_product' || (inventorySubTab as string) === 'add')) || activeTab === 'add_product',
    },
    {
      id: 'product_history',
      label: 'Product History',
      badge: 'Ledger',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
      icon: History,
      onClick: () => navigateToInventory('product_history'),
      isActive: (activeTab === 'inventory' && (inventorySubTab === 'product_history' || (inventorySubTab as string) === 'history')) || activeTab === 'product_history',
    },
    {
      id: 'import_products',
      label: 'Import products',
      badge: 'Bulk',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      icon: FileSpreadsheet,
      onClick: () => navigateToInventory('import_products'),
      isActive: (activeTab === 'inventory' && (inventorySubTab === 'import_products' || (inventorySubTab as string) === 'import')) || activeTab === 'import_products',
    },
    {
      id: 'variations',
      label: 'Variations & Combo Types',
      badge: 'Types',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
      icon: Sliders,
      onClick: () => navigateToInventory('variations'),
      isActive: (activeTab === 'inventory' && inventorySubTab === 'variations') || activeTab === 'variations',
    },
    {
      id: 'categories',
      label: 'Categories',
      badge: 'Tree',
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      icon: FolderTree,
      onClick: () => navigateToInventory('categories'),
      isActive: (activeTab === 'inventory' && inventorySubTab === 'categories') || activeTab === 'categories',
    },
    {
      id: 'brands',
      label: 'Brands',
      icon: Award,
      onClick: () => navigateToInventory('brands'),
      isActive: (activeTab === 'inventory' && inventorySubTab === 'brands') || activeTab === 'brands' || activeTab === 'brands_list',
    },
    {
      id: 'warranties',
      label: 'Warranty',
      icon: ShieldCheck,
      onClick: () => navigateToInventory('warranties'),
      isActive: (activeTab === 'inventory' && inventorySubTab === 'warranties') || activeTab === 'warranties',
    },
    {
      id: 'racks',
      label: 'Rack, Row & Shelf Positions',
      badge: 'Storage',
      badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      icon: Layers,
      onClick: () => navigateToInventory('racks'),
      isActive: (activeTab === 'inventory' && (inventorySubTab === 'racks' || (inventorySubTab as string) === 'rack_row')) || activeTab === 'racks',
    },
    {
      id: 'units',
      label: 'Units of Measure (UoM)',
      icon: Scale,
      onClick: () => navigateToInventory('units'),
      isActive: (activeTab === 'inventory' && inventorySubTab === 'units') || activeTab === 'units',
    },
    {
      id: 'barcode_studio',
      label: 'Barcode & Labels',
      badge: 'Print',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      icon: Barcode,
      onClick: () => setActiveTab('barcode_studio'),
      isActive: activeTab === 'barcode_studio' || activeTab === 'barcode' || activeTab === 'labels',
    },
  ];

  const transferAdjustmentSubItems: SubItemMeta[] = [
    {
      id: 'adjustments',
      label: 'Stock Adjustments',
      icon: AlertTriangle,
      onClick: () => setActiveTab('adjustments'),
      isActive: activeTab === 'adjustments' || (activeTab === 'transfer_adjustment' && inventorySubTab === 'adjustments'),
    },
    {
      id: 'transfers',
      label: 'Branch Transfers',
      icon: ArrowRightLeft,
      onClick: () => setActiveTab('transfers'),
      isActive: activeTab === 'transfers' || (activeTab === 'transfer_adjustment' && inventorySubTab === 'transfers'),
    },
  ];

  const purchasesSubItems: SubItemMeta[] = [
    {
      id: 'purchases',
      label: 'All Purchases',
      icon: Truck,
      onClick: () => setActiveTab('purchases'),
      isActive: activeTab === 'purchases',
    },
    {
      id: 'import_purchases',
      label: 'Import Purchases',
      badge: 'Import',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      icon: Upload,
      onClick: () => setActiveTab('import_purchases'),
      isActive: activeTab === 'import_purchases',
    },
    {
      id: 'add_purchase',
      label: 'Add Purchase Order',
      badge: 'New',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      icon: Plus,
      onClick: () => setActiveTab('add_purchase'),
      isActive: activeTab === 'add_purchase',
    },
    {
      id: 'purchase_requisition',
      label: 'Purchase Requisitions',
      badge: 'Req',
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      icon: ClipboardList,
      onClick: () => setActiveTab('purchase_requisition'),
      isActive: activeTab === 'purchase_requisition',
    },
    {
      id: 'purchase_returns',
      label: 'Purchase Returns (Debit Note)',
      badge: 'Return',
      badgeColor: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      icon: RotateCcw,
      onClick: () => setActiveTab('purchase_returns'),
      isActive: activeTab === 'purchase_returns',
    },
  ];

  const salesSubItems: SubItemMeta[] = [
    {
      id: 'sales',
      label: 'All Sales',
      icon: Receipt,
      onClick: () => setActiveTab('sales'),
      isActive: activeTab === 'sales',
    },
    {
      id: 'list_pos_sale',
      label: 'POS Transactions',
      badge: 'POS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      icon: ShoppingCart,
      onClick: () => setActiveTab('list_pos_sale'),
      isActive: activeTab === 'list_pos_sale',
    },
    {
      id: 'add_sale',
      label: 'Add Sale',
      badge: 'Form',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
      icon: Plus,
      onClick: () => setActiveTab('add_sale'),
      isActive: activeTab === 'add_sale',
    },
    {
      id: 'list_drafts',
      label: 'Draft Invoices',
      badge: 'Draft',
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      icon: FileText,
      onClick: () => setActiveTab('list_drafts'),
      isActive: activeTab === 'list_drafts',
    },
    {
      id: 'list_quotations',
      label: 'Quotations & Estimates',
      badge: 'Quote',
      badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      icon: FileText,
      onClick: () => setActiveTab('list_quotations'),
      isActive: activeTab === 'list_quotations',
    },
    {
      id: 'sale_returns',
      label: 'Sales Returns (Credit Note)',
      badge: 'Return',
      badgeColor: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      icon: RotateCcw,
      onClick: () => setActiveTab('sale_returns'),
      isActive: activeTab === 'sale_returns',
    },
    {
      id: 'pos',
      label: 'POS Terminal',
      badge: 'Live',
      badgeColor: 'bg-emerald-600 text-white font-bold',
      icon: ShoppingCart,
      onClick: () => setActiveTab('pos'),
      isActive: activeTab === 'pos',
    },
  ];

  const contactsSubItems: SubItemMeta[] = [
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      onClick: () => navigateToContacts('customers'),
      isActive: (activeTab === 'contacts' && contactsSubTab === 'customers') || activeTab === 'customers',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      onClick: () => navigateToContacts('suppliers'),
      isActive: (activeTab === 'contacts' && contactsSubTab === 'suppliers') || activeTab === 'suppliers',
    },
    {
      id: 'customer_groups',
      label: 'Customer Groups',
      badge: 'Pricing',
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      icon: Percent,
      onClick: () => navigateToContacts('customer_groups'),
      isActive: (activeTab === 'contacts' && contactsSubTab === 'customer_groups') || activeTab === 'customer_groups',
    },
    {
      id: 'add_contact',
      label: 'Add Customer / Supplier',
      badge: 'New',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      icon: Plus,
      onClick: () => openAddContactPage(),
      isActive: activeTab === 'add_contact' || activeTab === 'edit_contact',
    },
    {
      id: 'customer_ledger',
      label: 'Customer Ledger',
      badge: 'Ledger',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
      icon: BookOpen,
      onClick: () => navigateToContacts('customer_ledger'),
      isActive: (activeTab === 'contacts' && contactsSubTab === 'customer_ledger') || activeTab === 'customer_ledger',
    },
    {
      id: 'supplier_ledger',
      label: 'Supplier Ledger',
      badge: 'Ledger',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
      icon: BookOpen,
      onClick: () => navigateToContacts('supplier_ledger'),
      isActive: (activeTab === 'contacts' && contactsSubTab === 'supplier_ledger') || activeTab === 'supplier_ledger',
    },
    {
      id: 'import_contacts',
      label: 'Import Contacts',
      badge: 'Bulk',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      icon: FileSpreadsheet,
      onClick: () => navigateToContacts('import_contacts'),
      isActive: (activeTab === 'contacts' && contactsSubTab === 'import_contacts') || activeTab === 'import_contacts',
    },
  ];

  const userMenuSubItems: SubItemMeta[] = [
    {
      id: 'users',
      label: 'Users List',
      icon: Users,
      onClick: () => navigateToUserMenu('users'),
      isActive: (activeTab === 'user_menu' && userMenuSubTab === 'users') || activeTab === 'users',
    },
    {
      id: 'add_user',
      label: 'Add New User',
      badge: 'New',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      icon: UserPlus,
      onClick: () => setActiveTab('add_user'),
      isActive: activeTab === 'add_user',
    },
    {
      id: 'sales_commission_agents',
      label: 'Sales Representative',
      badge: 'Comms',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      icon: Award,
      onClick: () => navigateToUserMenu('sales_commission_agents'),
      isActive: activeTab === 'user_menu' && userMenuSubTab === 'sales_commission_agents',
    },
    {
      id: 'roles',
      label: 'Roles & Access',
      badge: 'Security',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      icon: ShieldCheck,
      onClick: () => navigateToUserMenu('roles'),
      isActive: activeTab === 'user_menu' && (userMenuSubTab === 'roles' || userMenuSubTab === 'permissions'),
    },
  ];

  const reportsSubItems: SubItemMeta[] = [
    {
      id: 'reports',
      label: 'Profit & Loss Statement',
      badge: 'P&L',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      icon: BarChart3,
      onClick: () => setActiveTab('reports'),
      isActive: activeTab === 'reports',
    },
    {
      id: 'product_purchase_report',
      label: 'Product Purchase Report',
      icon: ShoppingBag,
      onClick: () => setActiveTab('product_purchase_report'),
      isActive: activeTab === 'product_purchase_report',
    },
    {
      id: 'purchase_payment_report',
      label: 'Purchase Payment Report',
      icon: DollarSign,
      onClick: () => setActiveTab('purchase_payment_report'),
      isActive: activeTab === 'purchase_payment_report',
    },
    {
      id: 'product_sell_report',
      label: 'Product Sell Report',
      icon: TrendingUp,
      onClick: () => setActiveTab('product_sell_report'),
      isActive: activeTab === 'product_sell_report',
    },
    {
      id: 'sell_payment_report',
      label: 'Sell Payment Report',
      icon: DollarSign,
      onClick: () => setActiveTab('sell_payment_report'),
      isActive: activeTab === 'sell_payment_report',
    },
    {
      id: 'tax_report',
      label: 'GST & Tax Summary Report',
      badge: 'Tax',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      icon: Percent,
      onClick: () => setActiveTab('tax_report'),
      isActive: activeTab === 'tax_report',
    },
    {
      id: 'customer_supplier_report',
      label: 'Customer & Supplier Balances',
      icon: Users,
      onClick: () => setActiveTab('customer_supplier_report'),
      isActive: activeTab === 'customer_supplier_report',
    },
    {
      id: 'stock_report',
      label: 'Stock Report',
      badge: 'Stock',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      icon: Boxes,
      onClick: () => setActiveTab('stock_report'),
      isActive: activeTab === 'stock_report',
    },
    {
      id: 'stock_adjustment_report',
      label: 'Stock Adjustment Report',
      icon: AlertTriangle,
      onClick: () => setActiveTab('stock_adjustment_report'),
      isActive: activeTab === 'stock_adjustment_report',
    },
    {
      id: 'sales_representative_report',
      label: 'Sales Representative Report',
      icon: UserCheck,
      onClick: () => setActiveTab('sales_representative_report'),
      isActive: activeTab === 'sales_representative_report',
    },
  ];

  const configurationSubItems: SubItemMeta[] = [
    {
      id: 'locations',
      label: 'Branch Outlets',
      badge: 'Branches',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      icon: Building,
      onClick: () => navigateToSettings('locations'),
      isActive: activeTab === 'settings' && settingsSubTab === 'locations',
    },
    {
      id: 'invoice_layouts',
      label: 'Invoice Layouts & Schemes',
      badge: '6 Layouts',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      icon: FileSpreadsheet,
      onClick: () => navigateToSettings('invoice_layouts'),
      isActive: activeTab === 'settings' && settingsSubTab === 'invoice_layouts',
    },
    {
      id: 'tax',
      label: 'Tax Configuration',
      badge: 'GST/HSN',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      icon: Percent,
      onClick: () => navigateToSettings('tax'),
      isActive: activeTab === 'settings' && settingsSubTab === 'tax',
    },
    {
      id: 'currency',
      label: 'Currency Configuration',
      badge: 'Symbol',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      icon: Coins,
      onClick: () => navigateToSettings('currency'),
      isActive: activeTab === 'settings' && settingsSubTab === 'currency',
    },
    {
      id: 'pos_security',
      label: 'POS Security & Shift PIN',
      badge: 'Security',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      icon: Lock,
      onClick: () => navigateToSettings('pos_security'),
      isActive: activeTab === 'settings' && settingsSubTab === 'pos_security',
    },
    {
      id: 'receipt',
      label: 'Receipt Layouts',
      badge: 'Print POS',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      icon: Receipt,
      onClick: () => navigateToSettings('receipt'),
      isActive: activeTab === 'settings' && settingsSubTab === 'receipt',
    },
    {
      id: 'payment_accounts',
      label: 'Payment Accounts',
      badge: 'Finance',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      icon: Landmark,
      onClick: () => navigateToSettings('payment_accounts'),
      isActive: activeTab === 'settings' && settingsSubTab === 'payment_accounts',
    },
    {
      id: 'payment_methods',
      label: 'Payment Methods',
      badge: 'Methods',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      icon: CreditCard,
      onClick: () => navigateToSettings('payment_methods'),
      isActive: activeTab === 'settings' && settingsSubTab === 'payment_methods',
    },
    {
      id: 'signature_seal',
      label: 'Signature & Seal',
      badge: 'Signoff',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      icon: Stamp,
      onClick: () => navigateToSettings('signature_seal'),
      isActive: activeTab === 'settings' && settingsSubTab === 'signature_seal',
    },
    {
      id: 'notification_templates',
      label: 'Notification Templates',
      badge: 'Email/SMS/WA',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      icon: Mail,
      onClick: () => navigateToSettings('notification_templates'),
      isActive: activeTab === 'settings' && settingsSubTab === 'notification_templates',
    },
  ];

   const businessSettingsSubItems: SubItemMeta[] = [
    {
      id: 'business',
      label: 'Business Settings',
      icon: Building2,
      onClick: () => navigateToSettings('business_settings', 'business' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'business',
    },
    {
      id: 'product',
      label: 'Product Settings',
      icon: Package,
      onClick: () => navigateToSettings('business_settings', 'product' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'product',
    },
    {
      id: 'contact',
      label: 'Contact Settings',
      icon: Users,
      onClick: () => navigateToSettings('business_settings', 'contact' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'contact',
    },
    {
      id: 'sale',
      label: 'Sales Settings',
      icon: ShoppingCart,
      onClick: () => navigateToSettings('business_settings', 'sale' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'sale',
    },
    {
      id: 'pos',
      label: 'POS Settings',
      icon: CreditCard,
      onClick: () => navigateToSettings('business_settings', 'pos' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'pos',
    },
    {
      id: 'purchases',
      label: 'Purchase Settings',
      icon: Truck,
      onClick: () => navigateToSettings('business_settings', 'purchases' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'purchases',
    },
    {
      id: 'payment',
      label: 'Payment Settings',
      icon: Wallet,
      onClick: () => navigateToSettings('business_settings', 'payment' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'payment',
    },
    {
      id: 'app_updates',
      label: 'System Updates',
      icon: Sparkles,
      onClick: () => navigateToSettings('business_settings', 'app_updates' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'app_updates',
    },
    {
      id: 'system',
      label: 'Themes',
      icon: Sliders,
      onClick: () => navigateToSettings('business_settings', 'system' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'system',
    },
    {
      id: 'system_security',
      label: 'System Security Shield',
      icon: Shield,
      onClick: () => navigateToSettings('business_settings', 'system_security' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'system_security',
    },
    {
      id: 'prefixes',
      label: 'Document Prefix',
      icon: Hash,
      onClick: () => navigateToSettings('business_settings', 'prefixes' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'prefixes',
    },
    {
      id: 'reward_points',
      label: 'Reward Settings',
      icon: Gift,
      onClick: () => navigateToSettings('business_settings', 'reward_points' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'reward_points',
    },
    {
      id: 'modules',
      label: 'Modules Manager',
      icon: Boxes,
      onClick: () => navigateToSettings('business_settings', 'modules' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'modules',
    },
    {
      id: 'printers',
      label: 'Printer Configuration',
      icon: Printer,
      onClick: () => navigateToSettings('business_settings', 'printers' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'printers',
    },
    {
      id: 'custom_labels',
      label: 'Custom Fields',
      icon: Tag,
      onClick: () => navigateToSettings('business_settings', 'custom_labels' as any),
      isActive: activeTab === 'settings' && settingsSubTab === 'business_settings' && businessSettingsSection === 'custom_labels',
    },
  ];

  interface NavModuleGroup {
    groupTitle: string;
    items: {
      id: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string | null;
      badgeColor?: string;
      isExpandable?: boolean;
      subItems?: SubItemMeta[];
      iconColor: string;
      iconBg: string;
    }[];
  }

  const moduleGroups: NavModuleGroup[] = [
    {
      groupTitle: '',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-500/10 border-indigo-500/20',
        },
        {
          id: 'user_menu',
          label: 'Users',
          icon: Users,
          isExpandable: true,
          subItems: userMenuSubItems,
          iconColor: 'text-purple-400',
          iconBg: 'bg-purple-500/10 border-purple-500/20',
        },
        {
          id: 'contacts',
          label: 'Contacts',
          icon: Users,
          isExpandable: true,
          subItems: contactsSubItems,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-500/10 border-indigo-500/20',
        },
        {
          id: 'inventory',
          label: 'Products',
          icon: Boxes,
          isExpandable: true,
          subItems: inventorySubItems,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/10 border-amber-500/20',
        },
        {
          id: 'purchases',
          label: 'Purchases',
          icon: Truck,
          isExpandable: true,
          subItems: purchasesSubItems,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/10 border-blue-500/20',
        },
        {
          id: 'sales',
          label: 'Sales',
          icon: Receipt,
          isExpandable: true,
          subItems: salesSubItems,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        },
        {
          id: 'transfer_adjustment',
          label: 'Stock Transfer',
          icon: ArrowRightLeft,
          isExpandable: true,
          subItems: transferAdjustmentSubItems,
          iconColor: 'text-sky-400',
          iconBg: 'bg-sky-500/10 border-sky-500/20',
        },
        {
          id: 'expenses',
          label: 'Expenses',
          icon: DollarSign,
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-500/10 border-rose-500/20',
        },
        {
          id: 'accounts',
          label: 'Accounts',
          icon: BookOpen,
          iconColor: 'text-teal-400',
          iconBg: 'bg-teal-500/10 border-teal-500/20',
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
          isExpandable: true,
          subItems: reportsSubItems,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/10 border-amber-500/20',
        },
        {
          id: 'security',
          label: 'Security & Protection',
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-500/10 border-rose-500/20',
        },
        {
          id: 'system_updates',
          label: 'System Updates',
          icon: Sparkles,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        },
        {
          id: 'configuration',
          label: 'Store Configurations',
          icon: SlidersHorizontal,
          isExpandable: true,
          subItems: configurationSubItems,
          iconColor: 'text-indigo-400',
          iconBg: 'bg-indigo-500/10 border-indigo-500/20',
        },
        {
          id: 'settings',
          label: 'Business Settings',
          icon: SettingsIcon,
          isExpandable: true,
          subItems: businessSettingsSubItems,
          iconColor: 'text-slate-400',
          iconBg: 'bg-slate-500/10 border-slate-500/20',
        },
        {
          id: 'documentation',
          label: 'System Manual & Docs',
          icon: BookOpen,
          iconColor: 'text-sky-400',
          iconBg: 'bg-sky-500/10 border-sky-500/20',
        },
      ],
    },
  ];

  // Filter accessible items
  const filteredGroups = useMemo(() => {
    return moduleGroups.map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => {
        if (item.id === 'documentation') return true;
        if ((item.id === 'security' || item.id === 'system_updates') && !isUserAdmin(currentUser)) return false;
        if (item.id === 'accounts' && settings?.enableAccounts === false) return false;
        if (item.id === 'settings') return hasModuleAccess('settings');
        return hasModuleAccess(item.id);
      }),
    })).filter((grp) => grp.items.length > 0);
  }, [moduleGroups, settings?.enableAccounts, hasModuleAccess, currentUser?.role]);

  // Global search quick-match items
  const allSearchableItems = useMemo(() => {
    const list: { parentLabel: string; label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; href: string }[] = [];
    filteredGroups.forEach((grp) => {
      grp.items.forEach((item) => {
        const itemFirstSubId = item.subItems && item.subItems.length > 0 ? item.subItems[0].id : undefined;
        list.push({
          parentLabel: grp.groupTitle,
          label: item.label,
          icon: item.icon,
          href: getHrefForTab(item.id, itemFirstSubId),
          onClick: () => {
            if (item.isExpandable) {
              setExpandedMenu(item.id);
              if (item.subItems && item.subItems.length > 0) {
                item.subItems[0].onClick();
              }
            } else {
              setExpandedMenu(null);
              setActiveTab(item.id);
            }
            setSearchQuery('');
          },
        });
        if (item.subItems) {
          item.subItems.forEach((sub) => {
            list.push({
              parentLabel: item.label,
              label: sub.label,
              icon: sub.icon,
              href: getHrefForTab(item.id, sub.id),
              onClick: () => {
                setExpandedMenu(item.id);
                sub.onClick();
                setSearchQuery('');
              },
            });
          });
        }
      });
    });
    return list;
  }, [filteredGroups]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allSearchableItems.filter((i) =>
      i.label.toLowerCase().includes(q) || i.parentLabel.toLowerCase().includes(q)
    );
  }, [allSearchableItems, searchQuery]);

  const isParentActive = (id: string) => {
    return getParentForActiveTab() === id;
  };

  const toggleMenu = (id: string, isExpandable?: boolean) => {
    if (isExpandable) {
      if (expandedMenu === id) {
        setExpandedMenu(null);
      } else {
        setExpandedMenu(id);
      }
    } else {
      setExpandedMenu(null);
      setActiveTab(id);
    }
  };

  // Helper functions for responsive Light vs Dark mode styling
  const getBadgeStyles = (badgeColor?: string, isLight?: boolean) => {
    if (!badgeColor) {
      return isLight
        ? 'bg-slate-100 text-slate-700 border border-slate-200'
        : 'bg-slate-800 text-slate-300 border border-slate-700';
    }
    if (isLight) {
      if (badgeColor.includes('emerald')) return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      if (badgeColor.includes('indigo')) return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
      if (badgeColor.includes('amber')) return 'bg-amber-50 text-amber-800 border border-amber-200';
      if (badgeColor.includes('purple') || badgeColor.includes('violet')) return 'bg-purple-50 text-purple-800 border border-purple-200';
      if (badgeColor.includes('rose')) return 'bg-rose-50 text-rose-800 border border-rose-200';
      if (badgeColor.includes('cyan')) return 'bg-cyan-50 text-cyan-800 border border-cyan-200';
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
    return badgeColor;
  };

  const getIconBoxStyles = (isCurrentParent: boolean, iconBg: string, iconColor: string, isLight: boolean) => {
    if (isCurrentParent) {
      return 'bg-indigo-600 border-indigo-500 text-white shadow-xs shadow-indigo-600/30';
    }
    if (isLight) {
      return 'bg-white border-slate-200 text-slate-700 group-hover:border-indigo-300 group-hover:text-indigo-600 group-hover:bg-indigo-50/50 shadow-2xs';
    }
    return `${iconBg} ${iconColor}`;
  };

  const isLight =
    settings?.themeMode === 'light' ||
    (!settings?.themeMode &&
      typeof document !== 'undefined' &&
      !document.documentElement.classList.contains('dark')) ||
    (typeof document !== 'undefined' &&
      !document.documentElement.classList.contains('dark'));

  const sidebarContent = (
    <>
      {/* Top Search / Command Bar */}
      <div className={`sidebar-search-container px-3 py-2.5 border-b ${isLight ? 'border-slate-100 bg-white' : 'border-slate-800/80 bg-slate-900/40'} shrink-0`}>
        <div className="relative flex items-center">
          <Search className={`w-3.5 h-3.5 absolute left-2.5 ${isLight ? 'text-slate-400' : 'text-slate-400'} pointer-events-none`} />
          <input
            id="sidebar-menu-search"
            type="text"
            placeholder="Quick search menus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100/60 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
            } border rounded-lg pl-8 pr-7 py-1.5 text-xs font-medium focus:outline-none transition-all`}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2 ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200'} p-1 rounded-md transition`}
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span
              className={`absolute right-2 text-[9px] font-mono font-medium ${
                isLight ? 'text-slate-500 bg-slate-100 border-slate-200' : 'text-slate-400 bg-slate-800/80 border-slate-700/60'
              } px-1.5 py-0.5 rounded border pointer-events-none`}
            >
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation Container */}
      <div className={`flex-1 overflow-y-auto no-scrollbar p-2 space-y-2.5 min-h-0 ${isLight ? 'bg-white' : ''}`}>
        {/* If searching, render instant search results */}
        {searchQuery ? (
          <div className="space-y-1">
            <div className={`px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Matching Menus ({searchResults.length})</span>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${isLight ? 'text-indigo-700 bg-indigo-50 border border-indigo-200' : 'text-indigo-400 bg-slate-800'}`}>
                Click to open
              </span>
            </div>
            {searchResults.length === 0 ? (
              <div className={`p-4 text-center text-xs ${isLight ? 'text-slate-500 bg-slate-50 border-slate-200' : 'text-slate-400 bg-slate-900/40 border-slate-800'} rounded-lg border`}>
                No matching menus for "{searchQuery}"
              </div>
            ) : (
              searchResults.map((res, idx) => {
                const ItemIcon = res.icon;
                return (
                  <a
                    key={idx}
                    href={res.href}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button !== 1) {
                        e.preventDefault();
                        res.onClick();
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all group text-left relative ${
                      isLight
                        ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent font-medium'
                        : 'text-slate-200 bg-slate-900/70 hover:bg-indigo-600 hover:text-white border-slate-800 hover:border-indigo-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 ${isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-800 border-slate-700 text-indigo-400'}`}>
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`truncate font-semibold ${isLight ? 'text-slate-900 group-hover:text-indigo-950' : 'text-white'}`}>{res.label}</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500 group-hover:text-indigo-700' : 'text-slate-400 group-hover:text-indigo-100'} truncate`}>
                          {res.parentLabel}
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        ) : (
          /* Grouped Executive Hierarchy */
          filteredGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {/* Group Section Header */}
              {group.groupTitle && (
                <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'} flex items-center justify-between`}>
                  <span>{group.groupTitle}</span>
                </div>
              )}

              {/* Group Menu Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isCurrentParent = isParentActive(item.id);
                  const isExpanded = expandedMenu === item.id;

                  return (
                    <div key={item.id} className="space-y-0.5">
                      {/* Parent Button */}
                      {item.isExpandable ? (
                        <button
                          id={`nav-item-${item.id}`}
                          onClick={() => toggleMenu(item.id, item.isExpandable)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all group text-left relative ${
                            isLight
                              ? isCurrentParent
                                ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200 shadow-2xs'
                                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent font-medium'
                              : isCurrentParent
                              ? 'bg-slate-900 text-white font-bold border border-indigo-500/40 shadow-xs shadow-indigo-950 font-semibold'
                              : isExpanded
                              ? 'bg-slate-900/80 text-indigo-200 border border-slate-800 font-semibold'
                              : 'text-slate-300 hover:bg-slate-900/80 hover:text-white border border-transparent font-medium'
                          }`}
                        >
                          {/* Active Left Indicator Bar */}
                          {isCurrentParent && (
                            <span
                              className={`absolute left-0 top-1.5 bottom-1.5 w-1 ${
                                isLight ? 'bg-indigo-600' : 'bg-indigo-500'
                              } rounded-r shadow-xs shadow-indigo-500`}
                            />
                          )}

                          <div className="flex items-center gap-2.5 min-w-0 pl-1">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                                isCurrentParent
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                                  : getIconBoxStyles(false, item.iconBg, item.iconColor, isLight)
                              }`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 ${
                                  isCurrentParent
                                    ? 'text-white'
                                    : isLight
                                    ? 'text-slate-600 group-hover:text-indigo-600'
                                    : item.iconColor
                                }`}
                              />
                            </div>
                            <span
                              className={`truncate ${
                                isCurrentParent
                                  ? isLight
                                    ? 'text-indigo-950 font-bold'
                                    : 'text-white font-bold'
                                  : isExpanded
                                  ? isLight
                                    ? 'text-slate-950 font-semibold'
                                    : 'text-indigo-200 font-semibold'
                                  : isLight
                                  ? 'text-slate-700 group-hover:text-slate-950'
                                  : 'text-slate-300 group-hover:text-white'
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>

                          {item.isExpandable && (
                            <div className={`p-0.5 shrink-0 ml-1 ${isLight ? 'text-slate-400 group-hover:text-slate-700' : 'text-slate-400 group-hover:text-slate-200'}`}>
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded
                                    ? isLight
                                      ? 'rotate-90 text-indigo-700 font-bold'
                                      : 'rotate-90 text-indigo-400 font-bold'
                                    : isCurrentParent
                                    ? isLight
                                      ? 'text-indigo-700 font-bold'
                                      : 'text-indigo-400 font-bold'
                                    : ''
                                }`}
                              />
                            </div>
                          )}
                        </button>
                      ) : (
                        <a
                          id={`nav-item-${item.id}`}
                          href={getHrefForTab(item.id)}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button !== 1) {
                              e.preventDefault();
                              toggleMenu(item.id, item.isExpandable);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all group text-left relative ${
                            isLight
                              ? isCurrentParent
                                ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200 shadow-2xs'
                                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent font-medium'
                              : isCurrentParent
                              ? 'bg-slate-900 text-white font-bold border border-indigo-500/40 shadow-xs shadow-indigo-950 font-semibold'
                              : isExpanded
                              ? 'bg-slate-900/80 text-indigo-200 border border-slate-800 font-semibold'
                              : 'text-slate-300 hover:bg-slate-900/80 hover:text-white border border-transparent font-medium'
                          }`}
                        >
                          {/* Active Left Indicator Bar */}
                          {isCurrentParent && (
                            <span
                              className={`absolute left-0 top-1.5 bottom-1.5 w-1 ${
                                isLight ? 'bg-indigo-600' : 'bg-indigo-500'
                              } rounded-r shadow-xs shadow-indigo-500`}
                            />
                          )}

                          <div className="flex items-center gap-2.5 min-w-0 pl-1">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                                isCurrentParent
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                                  : getIconBoxStyles(false, item.iconBg, item.iconColor, isLight)
                              }`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 ${
                                  isCurrentParent
                                    ? 'text-white'
                                    : isLight
                                    ? 'text-slate-600 group-hover:text-indigo-600'
                                    : item.iconColor
                                }`}
                              />
                            </div>
                            <span
                              className={`truncate ${
                                isCurrentParent
                                  ? isLight
                                    ? 'text-indigo-950 font-bold'
                                    : 'text-white font-bold'
                                  : isExpanded
                                  ? isLight
                                    ? 'text-slate-950 font-semibold'
                                    : 'text-indigo-200 font-semibold'
                                  : isLight
                                  ? 'text-slate-700 group-hover:text-slate-950'
                                  : 'text-slate-300 group-hover:text-white'
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                        </a>
                      )}

                      {/* Clean Full-Width Single-Column Inline Submenu */}
                      {item.isExpandable && isExpanded && item.subItems && (
                        <div
                          className={`relative mt-1 mb-1.5 ml-3.5 pl-3.5 border-l-2 ${
                            isLight ? 'border-slate-200 bg-transparent' : 'border-slate-800/90'
                          } space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150`}
                        >
                          {item.subItems.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <a
                                key={sub.id}
                                id={`nav-sub-${item.id}-${sub.id}`}
                                href={getHrefForTab(item.id, sub.id)}
                                onClick={(e) => {
                                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button !== 1) {
                                    e.preventDefault();
                                    sub.onClick();
                                    setIsMobileSidebarOpen(false);
                                  }
                                }}
                                title={sub.label}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all group text-left relative ${
                                  isLight
                                    ? sub.isActive
                                      ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200 shadow-2xs'
                                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent font-medium'
                                    : sub.isActive
                                    ? 'bg-indigo-600/20 text-indigo-200 font-semibold border border-indigo-500/30 shadow-xs shadow-indigo-950'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                                  <SubIcon
                                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                      sub.isActive
                                        ? isLight
                                          ? 'text-indigo-600'
                                          : 'text-indigo-400'
                                        : isLight
                                          ? 'text-slate-500 group-hover:text-indigo-600'
                                          : 'text-slate-400 group-hover:text-indigo-300'
                                    }`}
                                  />
                                  <span
                                    className={`truncate ${
                                      sub.isActive
                                        ? isLight
                                          ? 'text-indigo-950 font-bold'
                                          : 'text-indigo-200 font-semibold'
                                        : isLight
                                          ? 'text-slate-700 group-hover:text-slate-950'
                                          : 'text-slate-400 group-hover:text-white'
                                    }`}
                                  >
                                    {sub.label}
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg and above) */}
      <aside
        id="main-sidebar-aside"
        className={`hidden lg:flex w-64 lg:w-72 ${
          isLight ? 'bg-white border-r border-slate-200 text-slate-800' : 'bg-slate-950 border-r border-slate-800/90 text-slate-100'
        } flex-col shrink-0 h-full overflow-hidden transition-all select-none`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer (sliding off-canvas overlay) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Sliding Drawer */}
          <aside
            id="mobile-sidebar-drawer"
            className={`relative z-10 w-72 sm:w-80 max-w-[85vw] ${
              isLight ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-950 text-slate-100 border-slate-800'
            } shadow-2xl flex flex-col h-full overflow-hidden border-r animate-in slide-in-from-left duration-200`}
          >
            {/* Drawer Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'
            }`}>
              <RoyalLogo size="sm" showText={false} />
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`p-1.5 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                } transition cursor-pointer`}
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
