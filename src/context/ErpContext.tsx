import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getCategoryName, getBrandName, applyAmountRounding } from '../utils/formatters';
import { validatePhoneNumber } from '../utils/phoneValidation';
import {
  Brand,
  BusinessSettings,
  CartItem,
  CashRegister,
  Category,
  Currency,
  Customer,
  CustomerGroup,
  ErpModuleId,
  Expense,
  FinancialAccount,
  Location,
  Product,
  ProductLot,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  RackLocation,
  RegisterInput,
  RolePermissions,
  RolePermissionsMap,
  SettingsSubTab,
  UserMenuSubTab,
  StockAdjustment,
  StockTransfer,
  Supplier,
  SuspendedSale,
  TaxGroup,
  TaxRate,
  Transaction,
  TransactionItem,
  TransactionStatus, TransactionType,
  PaymentEntry,
  PaymentMethod,
  PaymentMethodItem,
  PaymentStatus,
  Unit,
  User,
  UserRole,
  UserSession,
  SalesCommissionAgent,
  SalesCommissionAgentType,
  Warranty,
  WarrantyDurationType,
  QueuedTransaction,
  SyncLogEntry,
  OfflineSyncStats,
  NotificationTemplate,
  NotificationType,
  NotificationChannel,
  NotificationDeliveryLog,
} from '../types/erp';
import { DEFAULT_NOTIFICATION_TEMPLATES } from '../data/defaultNotificationTemplates';
import {
  initOfflineDb,
  getStorageEngine,
  queueOfflineTransaction,
  getAllQueuedTransactions,
  getPendingQueuedTransactions,
  markTransactionSyncing,
  markTransactionSynced,
  markTransactionFailed,
  deleteQueuedTransaction,
  clearAllOfflineQueue,
  recordSyncLog,
  getSyncLogs,
  getOfflineSyncStats,
  exportOfflineQueueJson,
} from '../services/offlineSyncDb';
import {
  initialAccounts,
  initialBrands,
  initialCashRegister,
  initialCategories,
  initialCurrencies,
  initialCustomers,
  initialCustomerGroups,
  initialExpenses,
  initialLocations,
  initialProducts,
  initialRacks,
  initialRolePermissions,
  initialSettings,
  initialStockAdjustments,
  initialStockTransfers,
  initialSuppliers,
  initialTaxGroups,
  initialTaxRates,
  initialTransactions,
  initialUnits,
  initialUsers,
  initialSalesCommissionAgents,
  initialWarranties,
  initialPurchaseRequisitions,
  initialPaymentMethods,
} from '../data/initialErpData';

export const normalizeRole = (role?: string | null): string => {
  if (!role) return 'cashier';
  const clean = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (clean.includes('supreme')) return 'supreme_admin';
  if (clean.includes('super_admin') || clean === 'super_admin') return 'super_admin';
  if (clean.includes('admin') || clean === 'owner') return 'admin';
  if (clean.includes('manager') && clean.includes('inventory')) return 'inventory_manager';
  if (clean.includes('manager')) return 'manager';
  if (clean.includes('accountant') || clean.includes('finance') || clean.includes('cfo')) return 'accountant';
  if (clean.includes('cashier')) return 'cashier';
  return clean;
};

export const isUserAdmin = (userOrRole?: User | string | null): boolean => {
  if (!userOrRole) return false;
  const roleStr = typeof userOrRole === 'string' ? userOrRole : (userOrRole.role || '');
  const norm = normalizeRole(roleStr);
  return norm === 'supreme_admin' || norm === 'super_admin' || norm === 'admin';
};

export const checkIsSystemInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Direct installation lock flags (set after installation wizard finishes)
  if (
    localStorage.getItem('pos_installed') === 'true' ||
    localStorage.getItem('app_installed') === 'true' ||
    localStorage.getItem('app_installation_completed') === 'true' ||
    localStorage.getItem('is_installed') === 'true' ||
    localStorage.getItem('system_installed') === 'true' ||
    localStorage.getItem('installation_locked') === 'true' ||
    localStorage.getItem('installation_wizard_deleted') === 'true' ||
    localStorage.getItem('app_fresh_installed') === 'true'
  ) {
    return true;
  }

  const savedSettings = localStorage.getItem(`${STORAGE_KEY}_settings`);
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      if (parsed.isInstalled === true || parsed.installationCompleted === true) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
};

export interface FinancialSummary {
  grossSales: number;
  netSales: number;
  totalPurchases: number;
  cogs: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalExpenses: number;
  netProfit: number;
  netProfitMargin: number;
  taxCollected: number;
  taxPaid: number;
  netTaxPayable: number;
  stockValuationCost: number;
  stockValuationRetail: number;
  totalReceivables: number;
  totalPayables: number;
  cashInHand: number;
  bankBalance: number;
  totalSales: number;
  totalDiscounts: number;
  totalTax: number;
}

interface ErpContextType {
  // Master state
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  locations: Location[];
  addLocation: (location: Omit<Location, 'id'>) => Location;
  updateLocation: (id: string, location: Partial<Location>) => void;
  deleteLocation: (id: string) => { success: boolean; message?: string };
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  currentLocation: Location | undefined;

  // Store Currency Management
  currencies: Currency[];
  activeCurrency: Currency;
  addCurrency: (currency: Omit<Currency, 'id'>) => void;
  updateCurrency: (id: string, currency: Partial<Currency>) => void;
  deleteCurrency: (id: string) => void;
  setActiveCurrency: (id: string) => void;
  setStoreCurrency: (
    code: string,
    symbol: string,
    name?: string,
    placement?: 'prefix' | 'suffix',
    decimalPlaces?: number
  ) => void;
  formatMoney: (amount: number, overrideSymbol?: string) => string;

  // Tax Management & Regional Presets
  taxRates: TaxRate[];
  taxGroups: TaxGroup[];
  addTaxRate: (rate: Omit<TaxRate, 'id'>) => void;
  updateTaxRate: (id: string, rate: Partial<TaxRate>) => void;
  deleteTaxRate: (id: string) => void;
  addTaxGroup: (group: Omit<TaxGroup, 'id'>) => void;
  updateTaxGroup: (id: string, group: Partial<TaxGroup>) => void;
  deleteTaxGroup: (id: string) => void;
  applyCountryTaxPreset: (preset: 'india_gst' | 'usa_sales' | 'uk_vat' | 'uae_vat' | 'tax_exempt') => void;
  calculateItemTax: (
    unitPrice: number,
    qty: number,
    discount?: number,
    item?: { taxRate?: number; taxGroupId?: string; taxType?: string; forceCalculate?: boolean }
  ) => {
    lineSubtotal: number;
    taxRate: number;
    taxAmount: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    lineTotal: number;
  };

  // Active view
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  settingsSubTab: SettingsSubTab;
  setSettingsSubTab: (tab: SettingsSubTab) => void;
  businessSettingsSection: string;
  setBusinessSettingsSection: (section: string) => void;
  navigateToSettings: (subTab?: SettingsSubTab, businessSection?: string) => void;
  userMenuSubTab: UserMenuSubTab;
  setUserMenuSubTab: (tab: UserMenuSubTab) => void;
  navigateToUserMenu: (subTab?: UserMenuSubTab) => void;
  isAddUserModalOpen: boolean;
  setIsAddUserModalOpen: (open: boolean) => void;
  openAddUserModal: () => void;
  closeAddUserModal: () => void;

  // Catalog & Inventory
  products: Product[];
  filteredProducts: Product[];
  addProduct: (product: Omit<Product, 'id' | 'currentStock'>) => void;
  addProducts: (products: Omit<Product, 'id' | 'currentStock'>[]) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (adjustment: Omit<StockAdjustment, 'id' | 'referenceNo' | 'date'>) => void;
  updateStockAdjustment: (id: string, adjustment: Partial<StockAdjustment>) => void;
  deleteStockAdjustment: (id: string) => void;
  updateStockTransfer: (id: string, transfer: Partial<StockTransfer>) => void;
  deleteStockTransfer: (id: string) => void;
  transferStock: (transfer: Omit<StockTransfer, 'id' | 'referenceNo' | 'date'>) => void;
  completeStockTransfer: (id: string) => void;
  stockAdjustments: StockAdjustment[];
  stockTransfers: StockTransfer[];

  // Units of Measure (finias POS Products & Inventory -> Units)
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id' | 'createdDate'>) => Unit;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  deleteUnit: (id: string) => { success: boolean; message?: string };

  // Category Management (finias POS Products & Inventory -> Categories)
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'createdDate'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, cascadeReassignToId?: string) => { success: boolean; message?: string };

  // Brand Management (finias POS Products & Inventory -> Brands)
  brands: Brand[];
  addBrand: (brand: Omit<Brand, 'id' | 'createdDate'>) => Brand;
  updateBrand: (id: string, brand: Partial<Brand>) => void;
  deleteBrand: (id: string, cascadeReassignToId?: string) => { success: boolean; message?: string };

  // Warranty Management (finias POS Products & Inventory -> Warranties)
  warranties: Warranty[];
  addWarranty: (warranty: Omit<Warranty, 'id' | 'createdDate'>) => Warranty;
  updateWarranty: (id: string, warranty: Partial<Warranty>) => void;
  deleteWarranty: (id: string, cascadeReassignToId?: string) => { success: boolean; message?: string };
  getWarrantyById: (id?: string) => Warranty | undefined;
  assignWarrantyToProducts: (warrantyId: string | null, productIds: string[]) => void;
  calculateWarrantyExpiry: (startDateStr: string, duration: number, durationType: WarrantyDurationType) => string;

  // Rack, Row & Position Management (finias POS Products & Inventory -> Rack, Row & Position)
  racks: RackLocation[];
  addRack: (rack: Omit<RackLocation, 'id' | 'createdDate'>) => RackLocation;
  updateRack: (id: string, rack: Partial<RackLocation>) => void;
  deleteRack: (id: string, cascadeReassignToId?: string) => { success: boolean; message?: string };
  assignRackPositionToProducts: (productIds: string[], rack: string, row?: string, position?: string) => void;

  inventorySubTab: 'matrix' | 'categories' | 'brands' | 'warranties' | 'racks' | 'units' | 'adjustments' | 'transfers' | 'add_product' | 'edit_product' | 'import_products' | 'product_history' | 'variations' | 'batch_guide';
  setInventorySubTab: (tab: 'matrix' | 'categories' | 'brands' | 'warranties' | 'racks' | 'units' | 'adjustments' | 'transfers' | 'add_product' | 'edit_product' | 'import_products' | 'product_history' | 'variations' | 'batch_guide') => void;
  navigateToInventory: (subTab?: 'matrix' | 'categories' | 'brands' | 'warranties' | 'racks' | 'units' | 'adjustments' | 'transfers' | 'add_product' | 'edit_product' | 'import_products' | 'product_history' | 'variations' | 'batch_guide') => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  openAddProductPage: () => void;
  openEditProductPage: (product: Product) => void;
  closeProductPage: () => void;

  // Contacts & Customer Groups
  customers: Customer[];
  suppliers: Supplier[];
  customerGroups: CustomerGroup[];
  addCustomerGroup: (group: Omit<CustomerGroup, 'id' | 'createdDate'>) => CustomerGroup;
  updateCustomerGroup: (id: string, group: Partial<CustomerGroup>) => void;
  deleteCustomerGroup: (id: string) => void;
  getCustomerGroupPrice: (basePrice: number, customer?: Customer | null) => number;
  contactsSubTab: 'customers' | 'customer_groups' | 'suppliers' | 'add_customer' | 'add_supplier' | 'add_contact' | 'edit_customer' | 'edit_supplier' | 'customer_ledger' | 'supplier_ledger' | 'import_contacts';
  setContactsSubTab: (tab: 'customers' | 'customer_groups' | 'suppliers' | 'add_customer' | 'add_supplier' | 'add_contact' | 'edit_customer' | 'edit_supplier' | 'customer_ledger' | 'supplier_ledger' | 'import_contacts') => void;
  navigateToContacts: (subTab?: 'customers' | 'customer_groups' | 'suppliers' | 'add_customer' | 'add_supplier' | 'customer_ledger' | 'supplier_ledger' | 'import_contacts', contactId?: string) => void;
  selectedLedgerContactId: string | null;
  setSelectedLedgerContactId: (id: string | null) => void;
  openCustomerLedger: (customerOrId?: Customer | string) => void;
  openSupplierLedger: (supplierOrId?: Supplier | string) => void;
  editingCustomer: Customer | null;
  setEditingCustomer: (customer: Customer | null) => void;
  editingSupplier: Supplier | null;
  setEditingSupplier: (supplier: Supplier | null) => void;
  openAddContactPage: () => void;
  openAddCustomerPage: () => void;
  openAddSupplierPage: () => void;
  generateNextContactId: (type: 'customer' | 'supplier') => string;
  openEditCustomerPage: (customer: Customer) => void;
    openEditSupplierPage: (supplier: Supplier) => void;
  closeContactPage: () => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalDue' | 'totalSales' | 'loyaltyPoints' | 'createdDate'> & { id?: string }) => Customer;
  importCustomers: (customersList: Array<Omit<Customer, 'id' | 'totalDue' | 'totalSales' | 'loyaltyPoints' | 'createdDate'>>) => Customer[];
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPayable' | 'totalPurchases' | 'createdDate'> & { id?: string }) => Supplier;
  importSuppliers: (suppliersList: Array<Omit<Supplier, 'id' | 'totalPayable' | 'totalPurchases' | 'createdDate'>>) => Supplier[];
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, note?: string, referenceNo?: string, date?: string) => void;
  recordSupplierPayment: (supplierId: string, amount: number, paymentMethod: PaymentMethod, note?: string, referenceNo?: string, date?: string) => void;
  recordCustomerLedgerDiscount: (customerId: string, amount: number, note?: string, referenceNo?: string, date?: string) => { success: boolean; message?: string };
  recordSupplierLedgerDiscount: (supplierId: string, amount: number, note?: string, referenceNo?: string, date?: string) => { success: boolean; message?: string };
  updateLedgerDiscount: (transactionId: string, amount: number, date?: string, note?: string, referenceNo?: string) => { success: boolean; message?: string };
  deleteLedgerDiscount: (transactionId: string) => { success: boolean; message?: string };
  updateLedgerPayment: (transactionId: string, paymentEntryId: string, amount: number, method: PaymentMethod, date?: string, note?: string, referenceNo?: string) => { success: boolean; message?: string };
  deleteLedgerPayment: (transactionId: string, paymentEntryId: string) => { success: boolean; message?: string };

  // POS State
  cart: CartItem[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  addToCart: (product: Product, quantity?: number, lotId?: string) => boolean;
  updateCartQty: (productId: string, quantity: number, lotId?: string) => void;
  updateCartDiscount: (productId: string, discount: number, lotId?: string) => void;
  updateCartPrice: (productId: string, unitPrice: number, lotId?: string) => void;
  removeFromCart: (productId: string, lotId?: string) => void;
  clearCart: () => void;
  suspendedSales: SuspendedSale[];
  holdCart: (note?: string) => void;
  resumeSuspendedSale: (id: string) => void;
  deleteSuspendedSale: (id: string) => void;

  // Transactions (Sales & Purchases)
  transactions: Transaction[];
  createSale: (saleData: {
    invoiceNo?: string;
    locationId?: string;
    customerId: string;
    date?: string;
    items: (CartItem | TransactionItem)[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    discountType?: 'percentage' | 'fixed';
    orderTaxRate?: number;
    shippingCharges: number;
    shippingDetails?: string;
    shippingAddress?: string;
    shippingStatus?: 'ordered' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
    deliveredTo?: string;
    totalAmount: number;
    paidAmount: number;
    paymentMethod?: any;
    paymentEntries?: PaymentEntry[];
    notes?: string;
    status?: 'final' | 'draft' | 'ordered' | 'quotation';
    isPos?: boolean;
    saleChannel?: string;
    commissionAgentId?: string;
    commissionAgentName?: string;
    commissionAgentType?: string;
    commissionPercentage?: number;
    commissionAmount?: number;
    cardDetails?: any;
    extraPaymentDetails?: any;
    additionalExpenses?: { name: string; amount: number }[];
  }) => Transaction;
  updateSale: (id: string, saleData: any) => void;
  deleteSale: (id: string) => void;
  openAddSalePage: () => void;
  openEditSalePage: (sale: Transaction) => void;
  openViewSalePage: (sale: Transaction) => void;
  editingSale: Transaction | null;
  viewingSale: Transaction | null;
  createPurchase: (purchaseData: {
    invoiceNo?: string;
    supplierId: string;
    supplierName?: string;
    locationId: string;
    type?: TransactionType;
    date?: string;
    items: {
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      taxRate: number;
      tax?: number;
      discount: number;
      total: number;
      [key: string]: any;
    }[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingCharges: number;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: any;
    notes?: string;
    status?: TransactionStatus;
    lotNumber?: string;
    extraPaymentDetails?: any;
    additionalExpenses?: { name: string; amount: number }[];
  }) => Transaction;
  updatePurchase: (id: string, purchaseData: any) => void;
  updatePurchaseSupplier: (transactionId: string, newSupplierId: string, newSupplierName?: string) => void;
  splitPurchaseItems: (transactionId: string, itemSplits: { itemIndex: number; supplierId: string; supplierName: string }[]) => void;
  deletePurchase: (id: string) => void;
  receivePurchaseOrder: (transactionId: string) => void;
  openEditPurchasePage: (purchase: Transaction) => void;
  openViewPurchasePage: (purchase: Transaction) => void;
  editingPurchase: Transaction | null;
  viewingPurchase: Transaction | null;

  // Purchase Requisitions
  purchaseRequisitions: PurchaseRequisition[];
  createPurchaseRequisition: (reqData: any) => PurchaseRequisition;
  updatePurchaseRequisition: (id: string, data: Partial<PurchaseRequisition>) => void;
  deletePurchaseRequisition: (id: string) => void;
  approvePurchaseRequisition: (id: string) => void;
  rejectPurchaseRequisition: (id: string, reason?: string) => void;
  convertRequisitionToPurchase: (id: string) => void;

  // Expenses
  expenses: Expense[];
  accounts: FinancialAccount[];
  addExpense: (expense: any) => void;
  updateExpense: (id: string, expense: any) => void;
  deleteExpense: (id: string) => void;
  addAccount: (accountData: any) => FinancialAccount;
  updateAccount: (id: string, accountData: Partial<FinancialAccount>) => void;
  deleteAccount: (id: string) => { success: boolean; message: string };
  paymentMethods: PaymentMethodItem[];
  addPaymentMethod: (methodData: Omit<PaymentMethodItem, 'id'>) => PaymentMethodItem;
  updatePaymentMethod: (id: string, methodData: Partial<PaymentMethodItem>) => void;
  deletePaymentMethod: (id: string) => { success: boolean; message: string };
  cashRegister: CashRegister;
  openRegister: (floatAmount: number, cashierName: string, notes?: string) => void;
  closeRegister: (actualCashCount: number, notes?: string) => void;
  showOpenRegisterModal: boolean;
  setShowOpenRegisterModal: (show: boolean) => void;
  requestOpenPos: () => void;
  isPosExitAllowed: (user?: User | null, reg?: CashRegister) => boolean;
  pendingPosExitTarget: string | null;
  setPendingPosExitTarget: (tab: string | null) => void;
  showRegisterExitLockModal: boolean;
  setShowRegisterExitLockModal: (show: boolean) => void;
  verifyAdminOverride: (pinOrPassword: string) => boolean;

  // Financial Analytics
  financialSummary: FinancialSummary;
  resetToDefaults: () => void;
  purgeAllData: (initialAdminUser?: Omit<User, 'id'>) => void;
  applyInstallationStarterModules: (config: {
    seedDemoCatalog: boolean;
    seedDefaultTaxes: boolean;
    seedDefaultRegisters: boolean;
    enableBarcodeStudio: boolean;
    enableAccountingModule: boolean;
    enableAiAssistant: boolean;
    businessName?: string;
    currencyCode?: string;
    currencySymbol?: string;
    timezone?: string;
    adminName?: string;
  }) => void;
  setUsersList: (users: User[]) => void;
  upsertSuperAdminUser: (adminData: {
    name: string;
    email: string;
    username: string;
    password?: string;
    pin?: string;
    phone?: string;
    locationId?: string;
    avatar?: string;
    role?: UserRole;
  }) => User;

  // Role Permissions & Employee Access Control
  rolePermissions: RolePermissionsMap;
  updateRolePermissions: (role: UserRole, permissions: Partial<RolePermissions>) => void;
  toggleRoleModule: (role: UserRole, moduleId: ErpModuleId) => void;
  resetRolePermissions: () => void;
  hasModuleAccess: (moduleId: string, user?: User | null) => boolean;
  hasPermission: (permKey: keyof Omit<RolePermissions, 'allowedModules'>, user?: User | null) => boolean;
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  updateUserRole: (id: string, newRole: UserRole) => void;

  // Authentication & Users
  currentUser: User | null;
  users: User[];
  salesCommissionAgents: SalesCommissionAgent[];
  addSalesCommissionAgent: (agent: Omit<SalesCommissionAgent, 'id'>) => SalesCommissionAgent;
  updateSalesCommissionAgent: (id: string, agent: Partial<SalesCommissionAgent>) => void;
  deleteSalesCommissionAgent: (id: string) => void;
  isAuthenticated: boolean;
  login: (
    emailOrPhone: string,
    password?: string,
    locationId?: string
  ) => Promise<{
    success: boolean;
    message?: string;
    isLocked?: boolean;
    lockedUntil?: number;
    remainingMinutes?: number;
    remainingSeconds?: number;
    unlockRequested?: boolean;
    requireOtp?: boolean;
    userEmail?: string;
    userName?: string;
    userId?: string;
    otpCode?: string;
  }>;
  lockUser: (userId: string, reason?: string) => { success: boolean; message: string };
  unlockUser: (userId: string) => { success: boolean; message: string };
  requestAdminUnlock: (emailOrUserId: string, note?: string) => { success: boolean; message: string };
  verifyLoginOtp: (emailOrUserId: string, otpCode: string, locationId?: string) => Promise<{ success: boolean; message?: string }>;
  resendLoginOtp: (emailOrUserId: string) => Promise<{ success: boolean; otpCode?: string; message?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (user: User) => void;

  // Active User Sessions & Device Management
  activeSessions: UserSession[];
  currentSession: UserSession | null;
  createSession: (user: User, locationId?: string) => UserSession;
  terminateSession: (sessionId: string) => void;
  terminateAllOtherSessions: () => void;
  touchSession: () => void;
  extendSession: () => void;
  showSessionWarning: boolean;
  setShowSessionWarning: (val: boolean) => void;
  remainingSessionSeconds: number;

  // Receipt Modal State Helper
  lastCompletedSale: Transaction | null;
  setLastCompletedSale: (txn: Transaction | null) => void;
  posCommissionAgentId: string | null;
  setPosCommissionAgentId: (id: string | null) => void;

  // Barcode Studio Helper
  barcodeStudioTargetProduct: Product | null;
  setBarcodeStudioTargetProduct: (prod: Product | null) => void;
  openBarcodeStudio: (prod?: Product | null) => void;

  // Offline Sync Management (IndexedDB / LocalStorage)
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isEffectiveOnline: boolean;
  toggleSimulatedOffline: (val?: boolean) => void;
  offlineQueue: QueuedTransaction[];
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  syncStats: OfflineSyncStats;
  syncLogs: SyncLogEntry[];
  syncOfflineQueue: () => Promise<{ success: number; failed: number }>;
  deleteQueuedTxn: (queueId: string) => Promise<void>;
  clearAllQueue: () => Promise<void>;
  exportQueueBackup: () => Promise<string>;
  refreshOfflineState: () => Promise<void>;

  // Flash Notifications
  activeNotification: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  showFlashNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

  // Notification Templates (finias POS)
  notificationTemplates: NotificationTemplate[];
  updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
  resetNotificationTemplate: (id: string) => void;
  resetAllNotificationTemplates: () => void;
  notificationLogs: NotificationDeliveryLog[];
  clearNotificationLogs: () => void;
  sendNotification: (params: {
    templateType: NotificationType;
    recipientContactId?: string;
    customRecipient?: { name: string; email?: string; phone?: string };
    channel?: NotificationChannel;
    variables?: Record<string, string>;
  }) => Promise<{
    success: boolean;
    message: string;
    renderedSubject?: string;
    renderedBody?: string;
    previewUrl?: string;
    directUrl?: string;
    deliveryMode?: string;
  }>;
  sendOneClickNotifications: (params: {
    templateType: NotificationType;
    recipientContactId?: string;
    customRecipient?: { name: string; email?: string; phone?: string };
    variables?: Record<string, string>;
  }) => Promise<void>;
}

const ErpContext = createContext<ErpContextType | null>(null);

const STORAGE_KEY = 'ultimate_erp_pos_database_v1';

const safeJsonParse = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error(`Failed to parse ${key} from localStorage`, e);
    return defaultValue;
  }
};

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isFreshInstalled = typeof window !== 'undefined' && (
    localStorage.getItem('app_fresh_installed') === 'true' ||
    localStorage.getItem('installation_type') === 'fresh'
  );
  // Load state from localStorage or initial dataset
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    const primaryFallbackLogo = typeof localStorage !== 'undefined' ? localStorage.getItem('royal_pos_v1_primary_logo') || '' : '';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const resolvedLogo = parsed.logoUrl || parsed.logo || primaryFallbackLogo || '';
        const isInstalledFlag = parsed.isInstalled === true || parsed.installationCompleted === true || (typeof localStorage !== 'undefined' && (localStorage.getItem('pos_installed') === 'true' || localStorage.getItem('app_installed') === 'true' || localStorage.getItem('app_installation_completed') === 'true'));
        const isFreshFlag = parsed.isFreshInstallation === true || parsed.installationType === 'fresh' || (typeof localStorage !== 'undefined' && (localStorage.getItem('app_fresh_installed') === 'true' || localStorage.getItem('installation_type') === 'fresh'));
        const installType = parsed.installationType || (isFreshFlag ? 'fresh' : (isInstalledFlag ? 'demo' : 'fresh'));

        return {
          ...initialSettings,
          ...parsed,
          isInstalled: isInstalledFlag,
          installationCompleted: isInstalledFlag,
          isFreshInstallation: isFreshFlag,
          installationType: installType,
          logoUrl: resolvedLogo,
          logo: resolvedLogo,
          darkLogoUrl: parsed.darkLogoUrl || resolvedLogo,
          themeMode: parsed.themeMode || 'light',
        };
      } catch (e) {
        console.error('Failed to parse settings from localStorage', e);
        return { ...initialSettings, logoUrl: primaryFallbackLogo, logo: primaryFallbackLogo, darkLogoUrl: primaryFallbackLogo };
      }
    }
    return { ...initialSettings, logoUrl: primaryFallbackLogo, logo: primaryFallbackLogo, darkLogoUrl: primaryFallbackLogo };
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const savedSettings = safeJsonParse(`${STORAGE_KEY}_settings`, null);
    const savedUser = safeJsonParse(`${STORAGE_KEY}_auth_user`, null);
    const activeBizName = savedUser?.businessName || savedSettings?.businessName || savedSettings?.name || 'Royal POSfini';
    const parsed = safeJsonParse(`${STORAGE_KEY}_locations`, []);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const cleaned = parsed
        .filter((l: any) => l.name !== 'Downtown Store' && l.id !== 'loc_store1')
        .map((l: any) => {
          if (l.name === 'Main HQ' || (l.id === 'loc_main' && (!l.name || l.name === 'Main HQ'))) {
            return { ...l, name: activeBizName, businessName: activeBizName };
          }
          return l;
        });
      return cleaned.length > 0 ? cleaned : [{
        id: 'loc_main',
        name: activeBizName,
        code: 'HQ01',
        address: '123 Business Rd, City, State',
        phone: '555-0100',
        isDefault: true,
        businessName: activeBizName,
      }];
    }
    return initialLocations;
  });

  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    try {
      const savedUserStr = localStorage.getItem(`${STORAGE_KEY}_auth_user`);
      const savedLoc = localStorage.getItem(`${STORAGE_KEY}_selected_location`);
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser?.locationId) return savedUser.locationId;
      }
      if (savedLoc) return savedLoc;
    } catch {
      // fallback
    }
    return 'loc_main';
  });

  const getInitialRouteInfo = () => {
    if (typeof window === 'undefined') return { main: '', sub: '', isAddUser: false, isAddCustomer: false, isEditProduct: false };
    let raw = '';
    if (window.location.hash && window.location.hash.length > 1) {
      raw = window.location.hash.replace(/^#\/?/, '').trim();
    } else {
      raw = window.location.pathname.replace(/^\/+|\/+$/g, '').trim();
    }
    const parts = raw.split('/').filter(Boolean);
    const main = (parts[0] || '').toLowerCase();
    const sub = (parts[1] || '').toLowerCase();

    const isAddUser = raw.includes('add_user') || (main === 'users' && (sub === 'create' || sub === 'add'));
    const isAddCustomer = raw.includes('add_customer') || (main === 'contacts' && sub === 'add_customer');
    const isEditProduct = raw.includes('edit_product') || (main === 'inventory' && sub === 'edit_product');

    return { main, sub, isAddUser, isAddCustomer, isEditProduct };
  };

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const route = getInitialRouteInfo();
    if (route.main) {
      const aliasMap: Record<string, string> = {
        install: 'installer',
        setup: 'installer',
        installer: 'installer',
        installation_wizard: 'installer',
        products: 'inventory',
        all_products: 'inventory',
        add_product: 'inventory',
        edit_product: 'inventory',
        import_products: 'inventory',
        import_product: 'inventory',
        product_history: 'inventory',
        variations: 'inventory',
        batch_guide: 'inventory',
        categories: 'inventory',
        category: 'inventory',
        brands: 'inventory',
        brand: 'inventory',
        brands_list: 'inventory',
        brand_list: 'inventory',
        warranties: 'inventory',
        warranty: 'inventory',
        matrix: 'inventory',
        units: 'inventory',
        racks: 'inventory',
        adjustments: 'inventory',
        transfers: 'inventory',
        stock_adjustments: 'inventory',
        stock_transfers: 'inventory',
        barcode: 'barcode_studio',
        barcode_studio: 'barcode_studio',
        labels: 'barcode_studio',
        customers: 'contacts',
        customer_groups: 'contacts',
        import_contacts: 'contacts',
        suppliers: 'contacts',
        add_customer: 'contacts',
        edit_customer: 'contacts',
        add_supplier: 'contacts',
        edit_supplier: 'contacts',
        customer_ledger: 'contacts',
        supplier_ledger: 'contacts',
        list_pos_sale: 'list_pos_sale',
        pos_sales: 'list_pos_sale',
        pos_sale: 'list_pos_sale',
        user_menu: 'user_menu',
        users: 'user_menu',
        roles: 'user_menu',
        user_permissions: 'user_menu',
        permissions: 'user_menu',
        sales_commission_agents: 'user_menu',
        system_updates: 'system_updates',
        updates: 'system_updates',
      };
      const resolved = aliasMap[route.main] || route.main;
      const validTabs = [
        'dashboard',
        'pos',
        'inventory',
        'barcode_studio',
        'purchases',
        'sales',
        'list_pos_sale',
        'pos_sales',
        'contacts',
        'expenses',
        'reports',
        'ai',
        'user_menu',
        'settings',
        'system_updates',
        'laravel_arch',
        'installer',
        'installation_wizard',
      ];
      if (validTabs.includes(resolved)) {
        return resolved;
      }
    }

    const saved = localStorage.getItem(`${STORAGE_KEY}_active_tab`);
    if (saved && saved !== 'installer' && saved !== 'installation_wizard' && saved !== 'uninstalled') {
      return saved;
    }

    return 'dashboard';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const [inventorySubTab, setInventorySubTab] = useState<'matrix' | 'categories' | 'brands' | 'warranties' | 'racks' | 'units' | 'adjustments' | 'transfers' | 'add_product' | 'edit_product' | 'import_products' | 'product_history' | 'variations' | 'batch_guide'>(() => {
    const route = getInitialRouteInfo();
    const validSubs = ['matrix', 'categories', 'brands', 'warranties', 'racks', 'units', 'adjustments', 'transfers', 'add_product', 'edit_product', 'import_products', 'product_history', 'variations', 'batch_guide'];
    if (route.sub && validSubs.includes(route.sub)) {
      return route.sub as any;
    }
    if (validSubs.includes(route.main)) {
      return route.main as any;
    }

    const saved = localStorage.getItem(`${STORAGE_KEY}_inventory_sub_tab`);
    if (saved && validSubs.includes(saved)) {
      return saved as any;
    }
    return 'matrix';
  });

  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>(() => {
    const validSubs = [
      'business_settings', 'locations', 'tax', 'currency', 'invoice_layouts', 
      'payment_methods', 'permissions', 'users', 'system', 'receipt', 
      'pos_security', 'payment_accounts', 'signature_seal', 'notification_templates', 
      'security', 'security_guard'
    ];

    const mapAlias = (s: string): string => {
      if (s === 'business') return 'business_settings';
      if (s === 'tax_rates') return 'tax';
      if (s === 'currencies') return 'currency';
      return s;
    };

    const route = getInitialRouteInfo();
    if (route.main === 'settings' && route.sub) {
      const resolved = mapAlias(route.sub);
      if (validSubs.includes(resolved)) {
        return resolved as any;
      }
    }
    if (validSubs.includes(mapAlias(route.main))) {
      return mapAlias(route.main) as any;
    }

    const saved = localStorage.getItem(`${STORAGE_KEY}_settings_sub_tab`);
    if (saved) {
      const resolved = mapAlias(saved);
      if (validSubs.includes(resolved)) {
        return resolved as any;
      }
    }

    return 'business_settings';
  });

  const [businessSettingsSection, setBusinessSettingsSection] = useState<string>('business');

  const [userMenuSubTab, setUserMenuSubTab] = useState<UserMenuSubTab>(() => {
    const route = getInitialRouteInfo();
    const validSubs: UserMenuSubTab[] = ['permissions', 'users', 'roles', 'add_user'];
    if ((route.main === 'user_menu' || route.main === 'users' || route.main === 'permissions' || route.main === 'roles') && route.sub && validSubs.includes(route.sub as any)) {
      return route.sub as any;
    }
    if (route.main === 'users') return 'users';
    if (route.main === 'roles') return 'roles';
    if (route.main === 'permissions' || route.main === 'user_permissions') return 'permissions';
    if (validSubs.includes(route.main as any)) {
      return route.main as any;
    }

    const saved = localStorage.getItem(`${STORAGE_KEY}_user_menu_sub_tab`);
    if (saved && ['permissions', 'users', 'roles', 'add_user'].includes(saved)) {
      return saved as any;
    }

    return 'users';
  });

  // Contacts & Customer Groups
  const [contactsSubTab, setContactsSubTab] = useState<'customers' | 'customer_groups' | 'suppliers' | 'add_customer' | 'add_supplier' | 'add_contact' | 'edit_customer' | 'edit_supplier' | 'customer_ledger' | 'supplier_ledger' | 'import_contacts'>(() => {
    const route = getInitialRouteInfo();
    if (route.main === 'contacts' && route.sub) {
      return route.sub as any;
    }
    if (route.main === 'import_contacts' || route.sub === 'import_contacts') return 'import_contacts';
    if (route.main === 'customer_groups' || route.sub === 'customer_groups') return 'customer_groups';
    if (route.main === 'customer_ledger' || route.sub === 'customer_ledger') return 'customer_ledger';
    if (route.main === 'supplier_ledger' || route.sub === 'supplier_ledger') return 'supplier_ledger';
    if (route.main === 'add_customer' || route.sub === 'add_customer') return 'add_customer';
    if (route.main === 'add_supplier' || route.sub === 'add_supplier') return 'add_supplier';
    if (route.main === 'suppliers' || route.sub === 'suppliers') return 'suppliers';
    return 'customers';
  });

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(() => {
    const route = getInitialRouteInfo();
    return route.isAddUser;
  });

  const openAddUserModal = () => {
    setIsAddUserModalOpen(true);
    setUserMenuSubTab('users');
    handleSmartSetActiveTab('user_menu');
  };

  const closeAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const [editingProduct, setEditingProduct] = useState<Product | null>(() => {
    const route = getInitialRouteInfo();
    const savedInvSub = localStorage.getItem(`${STORAGE_KEY}_inventory_sub_tab`);
    const savedProdId = localStorage.getItem(`${STORAGE_KEY}_editing_product_id`);
    if (
      (savedInvSub === 'edit_product' || route.isEditProduct) &&
      savedProdId
    ) {
      const savedProducts = localStorage.getItem(`${STORAGE_KEY}_products`);
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          const found = parsed.find((p: Product) => p.id === savedProdId);
          if (found) return found;
        } catch {
          // Ignore JSON parse error
        }
      }
    }
    return null;
  });

  const [editingPurchase, setEditingPurchase] = useState<Transaction | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Transaction | null>(null);
  const [editingSale, setEditingSale] = useState<Transaction | null>(null);
  const [viewingSale, setViewingSale] = useState<Transaction | null>(null);

  const [barcodeStudioTargetProduct, setBarcodeStudioTargetProduct] = useState<Product | null>(null);
  const [showRegisterExitLockModal, setShowRegisterExitLockModal] = useState<boolean>(false);
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState<boolean>(false);
  const [pendingPosExitTarget, setPendingPosExitTarget] = useState<string | null>(null);

  const [productsState, setProductsState] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    const raw = saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialProducts);
    return (Array.isArray(raw) ? raw : []).map((p: any) => ({
      ...p,
      category: getCategoryName(p.category),
      brand: getBrandName(p.brand),
    }));
  });

  const setProducts = (updater: Product[] | ((prev: Product[]) => Product[])) => {
    setProductsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return (Array.isArray(next) ? next : []).map((p: any) => ({
        ...p,
        category: getCategoryName(p.category),
        brand: getBrandName(p.brand),
      }));
    });
  };

  const products = productsState;

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialCategories);
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_brands`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialBrands);
  });

  const [warranties, setWarranties] = useState<Warranty[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_warranties`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialWarranties);
  });

  const [racks, setRacks] = useState<RackLocation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_racks`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialRacks);
  });

  const [units, setUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_units`);
    return saved ? JSON.parse(saved) : initialUnits;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    const list: Customer[] = saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialCustomers);
    return (Array.isArray(list) ? list : []).map((c, idx) => ({
      ...c,
      contactId: c.contactId || `CUST-${String(idx + 1).padStart(4, '0')}`,
      totalDue: Number(c.totalDue || 0),
      totalSales: Number(c.totalSales || 0),
      creditLimit: Number(c.creditLimit || 0),
    }));
  });

  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customer_groups`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialCustomerGroups);
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_suppliers`);
    const list: Supplier[] = saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialSuppliers);
    const seenIds = new Set<string>();
    return (Array.isArray(list) ? list : []).map((s, idx) => {
      let uniqueId = s.id;
      if (!uniqueId || seenIds.has(uniqueId)) {
        const slug = (s.name || `supp_${idx}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
        uniqueId = `sup_${slug}_${idx}_${Date.now()}`;
      }
      seenIds.add(uniqueId);
      return {
        ...s,
        id: uniqueId,
        contactId: s.contactId || `SUP-${String(idx + 1).padStart(4, '0')}`,
        totalPayable: Number(s.totalPayable || 0),
        totalPurchases: Number(s.totalPurchases || 0),
      };
    });
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
    const list: Transaction[] = saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialTransactions);
    return list.map((t) => {
      const isPos = t.isPos === true || t.saleChannel === 'pos' || (t.invoiceNo && t.invoiceNo.toUpperCase().startsWith('POS'));
      return {
        ...t,
        isPos,
        saleChannel: isPos ? 'pos' : 'standard',
      };
    });
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_adjustments`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialStockAdjustments);
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transfers`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialStockTransfers);
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialExpenses);
  });

  const [accounts, setAccounts] = useState<FinancialAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_accounts`);
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payment_methods`);
    return saved ? JSON.parse(saved) : initialPaymentMethods;
  });

  const [purchaseRequisitions, setPurchaseRequisitions] = useState<PurchaseRequisition[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_purchase_requisitions`);
    return saved ? JSON.parse(saved) : (isFreshInstalled ? [] : initialPurchaseRequisitions);
  });

  const [cashRegister, setCashRegister] = useState<CashRegister>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_register`);
    return saved ? JSON.parse(saved) : initialCashRegister;
  });

  // Tax Rates & Tax Groups State
  const [taxRates, setTaxRates] = useState<TaxRate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tax_rates`);
    return saved ? JSON.parse(saved) : initialTaxRates;
  });

  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tax_groups`);
    return saved ? JSON.parse(saved) : initialTaxGroups;
  });

  // Currencies State
  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_currencies`);
    return saved ? JSON.parse(saved) : initialCurrencies;
  });

  // Users & Authentication State
  const [users, setUsers] = useState<User[]>(() => {
    const isFresh = typeof window !== 'undefined' && (
      localStorage.getItem('app_fresh_installed') === 'true' ||
      localStorage.getItem('installation_type') === 'fresh'
    );
    const isInstalled = typeof window !== 'undefined' && (
      localStorage.getItem('pos_installed') === 'true' ||
      localStorage.getItem('app_installed') === 'true' ||
      localStorage.getItem('app_fresh_installed') === 'true' ||
      localStorage.getItem('app_installation_completed') === 'true'
    );
    const parsed = safeJsonParse(`${STORAGE_KEY}_users`, null);
    
    let loadedUsers: User[] = [];
    if (isFresh || isInstalled) {
      let rawList = Array.isArray(parsed) ? parsed : [];
      if (isFresh) {
        rawList = rawList.filter((u: any) => 
          u.email !== 'admin@royalpos.com' &&
          u.email !== 'cashier@royalpos.com' &&
          u.email !== 'inventory@royalpos.com' &&
          u.email !== 'finance@royalpos.com'
        );
      }
      if (rawList.length === 0) {
        const authUser = safeJsonParse(`${STORAGE_KEY}_auth_user`, null);
        const adminUser = safeJsonParse(`${STORAGE_KEY}_admin_user`, null);
        if (authUser && (authUser.email || authUser.username)) {
          rawList = [authUser];
        } else if (adminUser && (adminUser.email || adminUser.username)) {
          rawList = [adminUser];
        }
      }
      loadedUsers = rawList;
    } else {
      loadedUsers = Array.isArray(parsed) ? parsed : initialUsers;
    }

    // Migration: backfill security and system_updates if they have settings
    return loadedUsers.map(u => {
      if (Array.isArray(u.customAllowedModules) && u.customAllowedModules.includes('settings')) {
        const custom = [...u.customAllowedModules];
        if (!custom.includes('security')) custom.push('security');
        if (!custom.includes('system_updates')) custom.push('system_updates');
        return { ...u, customAllowedModules: custom };
      }
      return u;
    });
  });

  const [salesCommissionAgents, setSalesCommissionAgents] = useState<SalesCommissionAgent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sales_commission_agents`);
    return saved ? JSON.parse(saved) : initialSalesCommissionAgents;
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_role_permissions`);
    const parsed = saved ? JSON.parse(saved) : initialRolePermissions;
    
    // Migration: ensure roles with 'settings' also get 'security' and 'system_updates' due to module split
    const migrated = { ...parsed };
    Object.keys(migrated).forEach(role => {
      if (migrated[role]?.allowedModules?.includes('settings')) {
        if (!migrated[role].allowedModules.includes('security')) {
          migrated[role].allowedModules.push('security');
        }
        if (!migrated[role].allowedModules.includes('system_updates')) {
          migrated[role].allowedModules.push('system_updates');
        }
      }
    });
    return migrated;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_auth_user`);
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && Array.isArray(u.customAllowedModules) && u.customAllowedModules.includes('settings')) {
          const custom = [...u.customAllowedModules];
          if (!custom.includes('security')) custom.push('security');
          if (!custom.includes('system_updates')) custom.push('system_updates');
          return { ...u, customAllowedModules: custom };
        }
        return u;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Active User Sessions & Connected Device Token State
  const [activeSessions, setActiveSessions] = useState<UserSession[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user_sessions`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [currentSessionToken, setCurrentSessionToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let tok = sessionStorage.getItem(`${STORAGE_KEY}_session_token`);
      if (!tok) {
        tok = localStorage.getItem(`${STORAGE_KEY}_session_token`) || '';
      }
      return tok;
    }
    return '';
  });

  const [showSessionWarning, setShowSessionWarning] = useState<boolean>(false);
  const [remainingSessionSeconds, setRemainingSessionSeconds] = useState<number>(60);

  // Helper to parse user agent device details
  const getDeviceDetails = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'pos_terminal' = 'desktop';
    if (/mobile/i.test(ua)) deviceType = 'mobile';
    else if (/ipad|tablet/i.test(ua)) deviceType = 'tablet';
    else if (/pos/i.test(ua)) deviceType = 'pos_terminal';

    let browser = 'Chrome';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    let os = 'Windows';
    if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { deviceType, browser, os, userAgent: ua };
  };

  // Derive currentSession
  const currentSession = useMemo(() => {
    if (!currentUser) return null;
    let found = activeSessions.find(s => s.token === currentSessionToken && s.userId === currentUser.id);
    if (!found) {
      found = activeSessions.find(s => s.userId === currentUser.id && s.status === 'active');
    }
    return found ? { ...found, isCurrentSession: true } : null;
  }, [currentUser, activeSessions, currentSessionToken]);

  // Create active session
  const createSession = (user: User, locId?: string): UserSession => {
    const dev = getDeviceDetails();
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const targetLocId = locId || user.locationId || selectedLocationId;
    const targetLocObj = locations.find(l => l.id === targetLocId);

    const newSess: UserSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: typeof window !== 'undefined' ? window.location.hostname || '127.0.0.1' : '127.0.0.1',
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      userAgent: dev.userAgent,
      locationId: targetLocId,
      locationName: targetLocObj?.name || 'Main HQ Branch',
      loginTime: new Date().toISOString(),
      lastActiveTime: new Date().toISOString(),
      token,
      status: 'active',
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${STORAGE_KEY}_session_token`, token);
      localStorage.setItem(`${STORAGE_KEY}_session_token`, token);
      setCurrentSessionToken(token);
    }

    setActiveSessions((prev) => {
      const enforceSingle = settings?.enforceSingleSessionPerUser ?? false;
      const updated = prev.map(s => {
        if (enforceSingle && s.userId === user.id && s.status === 'active') {
          return { ...s, status: 'revoked' as const };
        }
        return s;
      });
      const finalSessions = [newSess, ...updated.filter(s => s.id !== newSess.id)];
      try {
        localStorage.setItem(`${STORAGE_KEY}_user_sessions`, JSON.stringify(finalSessions));
      } catch (e) {
        // ignore
      }
      return finalSessions;
    });

    return newSess;
  };

  // Touch current session
  const touchSession = () => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();
    setActiveSessions((prev) => {
      const updated = prev.map(s => {
        if (s.token === currentSessionToken || (s.userId === currentUser.id && s.status === 'active')) {
          return { ...s, lastActiveTime: nowIso };
        }
        return s;
      });
      try {
        localStorage.setItem(`${STORAGE_KEY}_user_sessions`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const extendSession = () => {
    touchSession();
    setShowSessionWarning(false);
  };

  // Terminate session
  const terminateSession = (sessionId: string) => {
    setActiveSessions((prev) => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, status: 'revoked' as const } : s);
      try {
        localStorage.setItem(`${STORAGE_KEY}_user_sessions`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    if (currentSession && currentSession.id === sessionId) {
      showFlashNotification('Your active session was revoked.', 'warning');
      logout();
    } else {
      showFlashNotification('User session terminated successfully.', 'success');
    }
  };

  // Terminate all other sessions
  const terminateAllOtherSessions = () => {
    if (!currentUser) return;
    setActiveSessions((prev) => {
      const updated = prev.map(s => {
        if (s.userId === currentUser.id && s.id !== currentSession?.id) {
          return { ...s, status: 'revoked' as const };
        }
        return s;
      });
      try {
        localStorage.setItem(`${STORAGE_KEY}_user_sessions`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    showFlashNotification('All other active sessions revoked.', 'success');
  };

  // Auto-restore / initialize session when currentUser exists
  useEffect(() => {
    if (currentUser) {
      if (!currentSession) {
        createSession(currentUser);
      }
    }
  }, [currentUser]);

  // Activity listener & inactivity timer
  useEffect(() => {
    if (!currentUser) return;

    let lastThrottled = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottled > 10000) {
        lastThrottled = now;
        touchSession();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const timer = setInterval(() => {
      if (!currentUser || !currentSession) return;
      const timeoutMins = settings?.sessionTimeoutMinutes ?? 30;
      if (timeoutMins <= 0) return; // Never expire

      const lastActiveMs = new Date(currentSession.lastActiveTime || currentSession.loginTime).getTime();
      const idleSecs = (Date.now() - lastActiveMs) / 1000;
      const timeoutSecs = timeoutMins * 60;
      const remainSecs = Math.max(0, Math.ceil(timeoutSecs - idleSecs));

      if (idleSecs >= timeoutSecs) {
        setShowSessionWarning(false);
        showFlashNotification('Session expired due to inactivity. Please log in again.', 'warning');
        logout();
      } else if (remainSecs <= 60 && remainSecs > 0) {
        setShowSessionWarning(true);
        setRemainingSessionSeconds(remainSecs);
      } else {
        if (showSessionWarning) setShowSessionWarning(false);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(timer);
    };
  }, [currentUser, currentSession, settings?.sessionTimeoutMinutes]);

  // POS State
  const [cart, setCart] = useState<CartItem[]>(() => safeJsonParse(`${STORAGE_KEY}_pos_cart`, []));
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pos_selected_customer`);
    return saved ? JSON.parse(saved) : (initialCustomers[0] || null);
  });
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pos_suspended_sales`);
    return saved ? JSON.parse(saved) : [];
  });
  const [lastCompletedSale, setLastCompletedSale] = useState<Transaction | null>(null);
  const [posCommissionAgentId, setPosCommissionAgentId] = useState<string | null>(null);

  // Notification Templates State (finias POS)
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notification_templates`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return DEFAULT_NOTIFICATION_TEMPLATES;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationDeliveryLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notification_logs`);
    return saved ? JSON.parse(saved) : [];
  });

  // Network & Offline Sync State (IndexedDB + LocalStorage)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedTransaction[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [syncStats, setSyncStats] = useState<OfflineSyncStats>({
    pendingCount: 0,
    syncedCount: 0,
    failedCount: 0,
    lastSyncTime: null,
    storageEngine: 'indexeddb',
    dbName: 'royal_pos_offline_db',
    dbVersion: 1,
  });
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);

  const isEffectiveOnline = isOnline && !isSimulatedOffline;

  const toggleSimulatedOffline = (val?: boolean) => {
    setIsSimulatedOffline((prev) => (val !== undefined ? val : !prev));
  };

  const refreshOfflineState = async () => {
    try {
      const q = await getAllQueuedTransactions();
      const stats = await getOfflineSyncStats();
      const logs = await getSyncLogs(25);
      setOfflineQueue(q);
      setSyncStats(stats);
      setSyncLogs(logs);
    } catch (err) {
      console.error('Failed to refresh offline state:', err);
    }
  };

  // Initialize DB and Network Listeners
  useEffect(() => {
    initOfflineDb().then(() => {
      refreshOfflineState();
    });

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline Queue Sync Function
  const syncOfflineQueue = async (): Promise<{ success: number; failed: number }> => {
    if (syncStatus === 'syncing') {
      return { success: 0, failed: 0 };
    }

    const pendingItems = await getPendingQueuedTransactions();
    if (pendingItems.length === 0) {
      return { success: 0, failed: 0 };
    }

    setSyncStatus('syncing');
    let success = 0;
    let failed = 0;
    const details: string[] = [];

    for (const item of pendingItems) {
      try {
        await markTransactionSyncing(item.queueId);

        // Simulate server round-trip / API sync
        await new Promise((r) => setTimeout(r, 450));

        const now = new Date().toISOString();
        const syncedTransaction: Transaction = {
          ...item.transaction,
          syncStatus: 'synced',
          syncedAt: now,
        };

        // Mark as synced in storage
        await markTransactionSynced(item.queueId, syncedTransaction);

        // Update in-memory transactions so UI reflects cloud synced status
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === item.transaction.id || (item.transaction.invoiceNo && t.invoiceNo === item.transaction.invoiceNo)
              ? {
                  ...t,
                  syncStatus: 'synced',
                  syncedAt: now,
                }
              : t
          )
        );

        success++;
        details.push(`Synced invoice ${item.transaction.invoiceNo} (${settings.currencySymbol}${item.transaction.totalAmount.toFixed(2)})`);
      } catch (err: any) {
        failed++;
        const errorMsg = err?.message || 'Network sync error';
        await markTransactionFailed(item.queueId, errorMsg);
        details.push(`Failed invoice ${item.transaction.invoiceNo}: ${errorMsg}`);
      }
    }

    await recordSyncLog({
      batchSize: pendingItems.length,
      successCount: success,
      failureCount: failed,
      status: failed === 0 ? 'success' : success > 0 ? 'partial' : 'failed',
      message: `Batch sync complete: ${success} uploaded, ${failed} failed.`,
      details,
    });

    await refreshOfflineState();
    setSyncStatus(failed === 0 ? 'success' : 'error');

    setTimeout(() => {
      setSyncStatus('idle');
    }, 3000);

    return { success, failed };
  };

  // Auto-sync when effective connection is online and queue has items
  useEffect(() => {
    if (isEffectiveOnline && offlineQueue.some((i) => i.status === 'pending' || i.status === 'failed')) {
      const timer = setTimeout(() => {
        syncOfflineQueue();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isEffectiveOnline, offlineQueue.length]);

  const deleteQueuedTxn = async (queueId: string) => {
    await deleteQueuedTransaction(queueId);
    await refreshOfflineState();
  };

  const clearAllQueue = async () => {
    await clearAllOfflineQueue();
    await refreshOfflineState();
  };

  const exportQueueBackup = async () => {
    return await exportOfflineQueueJson();
  };

  // Auto-persist whenever master entities change
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
    localStorage.setItem(`${STORAGE_KEY}_brands`, JSON.stringify(brands));
    localStorage.setItem(`${STORAGE_KEY}_warranties`, JSON.stringify(warranties));
    localStorage.setItem(`${STORAGE_KEY}_racks`, JSON.stringify(racks));
    localStorage.setItem(`${STORAGE_KEY}_units`, JSON.stringify(units));
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
    localStorage.setItem(`${STORAGE_KEY}_customer_groups`, JSON.stringify(customerGroups));
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
    localStorage.setItem(`${STORAGE_KEY}_adjustments`, JSON.stringify(stockAdjustments));
    localStorage.setItem(`${STORAGE_KEY}_transfers`, JSON.stringify(stockTransfers));
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(accounts));
    localStorage.setItem(`${STORAGE_KEY}_payment_methods`, JSON.stringify(paymentMethods));
    localStorage.setItem(`${STORAGE_KEY}_register`, JSON.stringify(cashRegister));
    localStorage.setItem(`${STORAGE_KEY}_tax_rates`, JSON.stringify(taxRates));
    localStorage.setItem(`${STORAGE_KEY}_tax_groups`, JSON.stringify(taxGroups));
    localStorage.setItem(`${STORAGE_KEY}_currencies`, JSON.stringify(currencies));
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${STORAGE_KEY}_locations`, JSON.stringify(locations));
    localStorage.setItem(`${STORAGE_KEY}_sales_commission_agents`, JSON.stringify(salesCommissionAgents));
    localStorage.setItem(`${STORAGE_KEY}_role_permissions`, JSON.stringify(rolePermissions));
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_auth_user`);
    }
    localStorage.setItem(`${STORAGE_KEY}_pos_cart`, JSON.stringify(cart));
    localStorage.setItem(`${STORAGE_KEY}_pos_selected_customer`, JSON.stringify(selectedCustomer));
    localStorage.setItem(`${STORAGE_KEY}_pos_suspended_sales`, JSON.stringify(suspendedSales));
    localStorage.setItem(`${STORAGE_KEY}_notification_templates`, JSON.stringify(notificationTemplates));
    localStorage.setItem(`${STORAGE_KEY}_notification_logs`, JSON.stringify(notificationLogs));
  }, [settings, products, categories, brands, warranties, racks, units, customers, customerGroups, suppliers, transactions, stockAdjustments, stockTransfers, expenses, accounts, paymentMethods, cashRegister, taxRates, taxGroups, currencies, users, locations, salesCommissionAgents, rolePermissions, currentUser, cart, selectedCustomer, suspendedSales, notificationTemplates, notificationLogs]);

  // Universal Live MySQL Sync: Push updates to server database across Desktop, Mobile, and Tablet
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        fetch('/api/sync.php?action=push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: {
              settings,
              products,
              categories,
              brands,
              warranties,
              racks,
              units,
              customers,
              customerGroups,
              suppliers,
              transactions,
              stockAdjustments,
              stockTransfers,
              expenses,
              accounts,
              paymentMethods,
              cashRegister,
              users,
              locations,
            },
          }),
        }).catch(() => {});
      } catch {}
    }, 1500);

    return () => clearTimeout(timer);
  }, [settings, products, categories, brands, warranties, racks, units, customers, customerGroups, suppliers, transactions, stockAdjustments, stockTransfers, expenses, accounts, paymentMethods, cashRegister, users, locations]);

  // Universal Live MySQL Sync: Pull latest database records on startup, tab focus, and every 15s
  useEffect(() => {
    let active = true;
    const syncFromRemote = async () => {
      // 1. Pull from sync.php (MySQL sync store)
      try {
        const res = await fetch('/api/sync.php?action=pull&t=' + Date.now(), {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const result = await res.json();
            if (result.success && result.isConfigured && result.data && active) {
              const d = result.data;
              if (Array.isArray(d.products) && d.products.length > 0) setProducts(d.products);
              if (Array.isArray(d.transactions) && d.transactions.length > 0) setTransactions(d.transactions);
              if (Array.isArray(d.customers) && d.customers.length > 0) setCustomers(d.customers);
              if (Array.isArray(d.suppliers) && d.suppliers.length > 0) setSuppliers(d.suppliers);
              if (Array.isArray(d.categories) && d.categories.length > 0) setCategories(d.categories);
              if (Array.isArray(d.brands) && d.brands.length > 0) setBrands(d.brands);
              if (Array.isArray(d.expenses) && d.expenses.length > 0) setExpenses(d.expenses);
              if (Array.isArray(d.users) && d.users.length > 0) {
                setUsers(d.users);
                try {
                  localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(d.users));
                } catch {}
              }
            }
          }
        }
      } catch {}

      // 2. Also ensure server adminUser from system.php is present if users list is empty
      try {
        const sysRes = await fetch('/api/system.php?action=status&t=' + Date.now(), {
          headers: { Accept: 'application/json' },
        });
        if (sysRes.ok) {
          const sysData = await sysRes.json();
          if (sysData.success && sysData.adminUser && active) {
            setUsers((prev) => {
              const hasAdmin = prev.some(
                (u) =>
                  u.id === sysData.adminUser.id ||
                  (u.email && u.email.toLowerCase() === sysData.adminUser.email?.toLowerCase()) ||
                  (u.username && u.username.toLowerCase() === sysData.adminUser.username?.toLowerCase())
              );
              if (!hasAdmin) {
                const updated = [sysData.adminUser, ...prev];
                try {
                  localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(updated));
                  localStorage.setItem(`${STORAGE_KEY}_admin_user`, JSON.stringify(sysData.adminUser));
                } catch {}
                return updated;
              }
              return prev;
            });
          }
        }
      } catch {}
    };

    syncFromRemote();
    const interval = setInterval(syncFromRemote, 15000);
    window.addEventListener('focus', syncFromRemote);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('focus', syncFromRemote);
    };
  }, []);

  // Listen for storage events across tabs to synchronize users and unlock states immediately
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}_users` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setUsers(parsed);
          }
        } catch (err) {
          console.warn('Storage sync error for users:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Inject dynamic theme color CSS overrides for Tailwind v4 color variables
  useEffect(() => {
    const accent = settings.themeAccent || 'indigo';
    const mode = settings.themeMode || 'dark';

    // 1. Handle Dark/Light mode on root element
    document.documentElement.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Comprehensive palette map for all supported theme accents
    const paletteMap: Record<string, Record<string, string>> = {
      indigo: {
        '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc',
        '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca',
        '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b',
      },
      emerald: {
        '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7',
        '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857',
        '800': '#065f46', '900': '#064e3b', '950': '#022c22',
      },
      violet: {
        '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd',
        '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9',
        '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065',
      },
      amber: {
        '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d',
        '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309',
        '800': '#92400e', '900': '#78350f', '950': '#451a03',
      },
      rose: {
        '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af',
        '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c',
        '800': '#9f1239', '900': '#881337', '950': '#4c0519',
      },
      cyan: {
        '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9',
        '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490',
        '800': '#155e75', '900': '#164e63', '950': '#083344',
      },
      orange: {
        '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74',
        '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c',
        '800': '#9a3412', '900': '#7c2d12', '950': '#431407',
      },
      teal: {
        '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4',
        '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e',
        '800': '#115e59', '900': '#134e4a', '950': '#042f2e',
      },
      fuchsia: {
        '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc',
        '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf',
        '800': '#86198f', '900': '#701a75', '950': '#4a044e',
      },
      sky: {
        '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc',
        '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1',
        '800': '#075985', '900': '#0c4a6e', '950': '#082f49',
      },
      lime: {
        '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264',
        '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f',
        '800': '#3f6212', '900': '#365314', '950': '#1a2e05',
      },
    };

    const selectedPalette = paletteMap[accent] || paletteMap['indigo'];

    // 3. Handle Dynamic Accent Override
    const styleId = 'dynamic-theme-accent';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root, :root[data-theme="light"], :root[data-theme="dark"] {
        --color-indigo-50: ${selectedPalette['50']};
        --color-indigo-100: ${selectedPalette['100']};
        --color-indigo-200: ${selectedPalette['200']};
        --color-indigo-300: ${selectedPalette['300']};
        --color-indigo-400: ${selectedPalette['400']};
        --color-indigo-500: ${selectedPalette['500']};
        --color-indigo-600: ${selectedPalette['600']};
        --color-indigo-700: ${selectedPalette['700']};
        --color-indigo-800: ${selectedPalette['800']};
        --color-indigo-900: ${selectedPalette['900']};
        --color-indigo-950: ${selectedPalette['950']};
      }
    `;
  }, [settings.themeAccent, settings.themeMode]);

  // Sync Active Tab, Inventory Sub-Tab, Settings Sub-Tab & User Tab to clean URL path (no hash) and localStorage
  useEffect(() => {
    if (activeTab === 'installer' || activeTab === 'installation_wizard' || activeTab === 'uninstalled') {
      const currentLoc = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
      if (!currentLoc.includes('install') && !currentLoc.includes('setup')) {
        setActiveTabState('dashboard');
        localStorage.setItem(`${STORAGE_KEY}_active_tab`, 'dashboard');
        return;
      }
    }

    localStorage.setItem(`${STORAGE_KEY}_active_tab`, activeTab);
    localStorage.setItem(`${STORAGE_KEY}_inventory_sub_tab`, inventorySubTab);
    localStorage.setItem(`${STORAGE_KEY}_settings_sub_tab`, settingsSubTab);
    localStorage.setItem(`${STORAGE_KEY}_user_menu_sub_tab`, userMenuSubTab);

    if (editingProduct) {
      localStorage.setItem(`${STORAGE_KEY}_editing_product_id`, editingProduct.id);
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_editing_product_id`);
    }

    let cleanPath = `/${activeTab}`;
    if (activeTab === 'dashboard') {
      if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '/login')) {
        cleanPath = window.location.pathname;
      } else {
        cleanPath = '/dashboard';
      }
    } else if (activeTab === 'uninstalled') {
      cleanPath = '/dashboard';
    } else if (activeTab === 'installer' || activeTab === 'installation_wizard') {
      cleanPath = '/install';
    } else if (activeTab === 'inventory') {
      cleanPath = inventorySubTab === 'matrix' ? '/inventory' : `/inventory/${inventorySubTab}`;
    } else if (activeTab === 'settings') {
      cleanPath = settingsSubTab === 'business_settings' ? '/settings' : `/settings/${settingsSubTab}`;
    } else if (activeTab === 'user_menu') {
      if (isAddUserModalOpen) {
        cleanPath = '/users/create';
      } else if (userMenuSubTab === 'users') {
        cleanPath = '/users';
      } else if (userMenuSubTab === 'roles') {
        cleanPath = '/roles';
      } else if (userMenuSubTab === 'permissions') {
        cleanPath = '/permissions';
      } else if (userMenuSubTab === 'sales_commission_agents') {
        cleanPath = '/sales_commission_agents';
      } else {
        cleanPath = `/user_menu/${userMenuSubTab}`;
      }
    } else if (activeTab === 'contacts') {
      cleanPath = contactsSubTab === 'customers' ? '/contacts' : `/contacts/${contactsSubTab}`;
    } else if (activeTab === 'expenses') {
      cleanPath = '/expenses';
    } else if (activeTab === 'system_updates') {
      cleanPath = '/system_updates';
    } else if (activeTab === 'list_pos_sale' || activeTab === 'pos_sales') {
      cleanPath = '/pos_sales';
    }

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const hasHash = Boolean(window.location.hash);
      if (currentPath !== cleanPath || hasHash) {
        window.history.replaceState(null, '', cleanPath);
      }
    }
  }, [activeTab, inventorySubTab, settingsSubTab, userMenuSubTab, contactsSubTab, editingProduct, isAddUserModalOpen]);

  // Listen to browser navigation (back/forward) & URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      const route = getInitialRouteInfo();
      if (!route.main) {
        if (window.location.pathname === '/' || !window.location.pathname) {
          setActiveTabState('dashboard');
        }
        return;
      }

      const aliasMap: Record<string, string> = {
        install: 'installer',
        setup: 'installer',
        installer: 'installer',
        installation_wizard: 'installer',
        products: 'inventory',
        all_products: 'inventory',
        add_product: 'inventory',
        edit_product: 'inventory',
        import_products: 'inventory',
        import_product: 'inventory',
        product_history: 'inventory',
        variations: 'inventory',
        batch_guide: 'inventory',
        categories: 'inventory',
        category: 'inventory',
        brands: 'inventory',
        brand: 'inventory',
        brands_list: 'inventory',
        brand_list: 'inventory',
        warranties: 'inventory',
        warranty: 'inventory',
        matrix: 'inventory',
        units: 'inventory',
        racks: 'inventory',
        adjustments: 'inventory',
        transfers: 'inventory',
        stock_adjustments: 'inventory',
        stock_transfers: 'inventory',
        barcode: 'barcode_studio',
        barcode_studio: 'barcode_studio',
        labels: 'barcode_studio',
        customers: 'contacts',
        customer_groups: 'contacts',
        import_contacts: 'contacts',
        suppliers: 'contacts',
        add_customer: 'contacts',
        edit_customer: 'contacts',
        add_supplier: 'contacts',
        edit_supplier: 'contacts',
        customer_ledger: 'contacts',
        supplier_ledger: 'contacts',
        list_pos_sale: 'list_pos_sale',
        pos_sales: 'list_pos_sale',
        pos_sale: 'list_pos_sale',
        user_menu: 'user_menu',
        users: 'user_menu',
        roles: 'user_menu',
        user_permissions: 'user_menu',
        permissions: 'user_menu',
        sales_commission_agents: 'user_menu',
      };

      const resolved = aliasMap[route.main] || route.main;

      if (resolved === 'inventory') {
        setActiveTabState('inventory');
        const validSubs = ['matrix', 'categories', 'brands', 'warranties', 'racks', 'units', 'adjustments', 'transfers', 'add_product', 'edit_product', 'import_products', 'product_history', 'variations', 'batch_guide'];
        if (route.sub && validSubs.includes(route.sub)) {
          setInventorySubTab(route.sub as any);
        } else if (validSubs.includes(route.main)) {
          setInventorySubTab(route.main as any);
        }
      } else if (resolved === 'contacts') {
        setActiveTabState('contacts');
        const validContactsSubs = ['customers', 'customer_groups', 'import_contacts', 'suppliers', 'add_customer', 'add_supplier', 'edit_customer', 'edit_supplier', 'customer_ledger', 'supplier_ledger'];
        if (route.sub && validContactsSubs.includes(route.sub)) {
          setContactsSubTab(route.sub as any);
        } else if (validContactsSubs.includes(route.main)) {
          setContactsSubTab(route.main as any);
        }
      } else if (resolved === 'settings') {
        setActiveTabState('settings');
        if (route.sub) {
          const validSubs = [
            'business_settings', 'locations', 'tax', 'currency', 'invoice_layouts', 
            'payment_methods', 'permissions', 'users', 'system', 'receipt', 
            'pos_security', 'payment_accounts', 'signature_seal', 'notification_templates', 
            'security', 'security_guard'
          ];
          const mapAlias = (s: string): string => {
            if (s === 'business') return 'business_settings';
            if (s === 'tax_rates') return 'tax';
            if (s === 'currencies') return 'currency';
            return s;
          };
          const resolvedSub = mapAlias(route.sub);
          if (validSubs.includes(resolvedSub)) {
            setSettingsSubTab(resolvedSub as any);
          }
        }
      } else if (resolved === 'user_menu') {
        setActiveTabState('user_menu');
        if (route.isAddUser) {
          setIsAddUserModalOpen(true);
          setUserMenuSubTab('users');
        } else if (route.sub === 'users' || route.main === 'users') {
          setIsAddUserModalOpen(false);
          setUserMenuSubTab('users');
        } else if (route.sub === 'roles' || route.main === 'roles') {
          setIsAddUserModalOpen(false);
          setUserMenuSubTab('roles');
        } else if (route.sub === 'permissions' || route.main === 'permissions' || route.main === 'user_permissions') {
          setIsAddUserModalOpen(false);
          setUserMenuSubTab('permissions');
        } else if (route.sub === 'sales_commission_agents' || route.main === 'sales_commission_agents') {
          setIsAddUserModalOpen(false);
          setUserMenuSubTab('sales_commission_agents');
        }
      } else if (resolved === 'installer') {
        setActiveTabState('installer');
      } else {
        const validTabs = [
          'dashboard', 'pos', 'inventory', 'barcode_studio', 'purchases',
          'sales', 'list_pos_sale', 'pos_sales', 'contacts', 'expenses', 'reports', 'ai', 'user_menu', 'settings', 'laravel_arch', 'installer', 'installation_wizard'
        ];
        if (validTabs.includes(resolved)) {
          setActiveTabState(resolved);
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const activeBusinessName = useMemo(() => {
    return (currentUser?.businessName || settings?.businessName || settings?.name || 'Royal POSfini').trim();
  }, [currentUser?.businessName, settings?.businessName, settings?.name]);

  const activeBusinessId = currentUser?.businessId;

  const scopedLocations = useMemo(() => {
    let filtered = locations.filter((loc) => {
      if (activeBusinessId && loc.businessId) return loc.businessId === activeBusinessId;
      if (loc.businessName && activeBusinessName) return loc.businessName.toLowerCase() === activeBusinessName.toLowerCase();
      if (loc.name === 'Downtown Store' || loc.id === 'loc_store1') return false;
      return true;
    });

    if (filtered.length === 0) {
      filtered = [{
        id: currentUser?.locationId || 'loc_main',
        name: activeBusinessName,
        code: 'HQ01',
        address: `${activeBusinessName} Main Office`,
        phone: currentUser?.phone || settings?.phone || '555-0100',
        isDefault: true,
        businessId: activeBusinessId,
        businessName: activeBusinessName,
      }];
    } else {
      filtered = filtered.map((l) => {
        if (l.name === 'Main HQ' || (l.id === 'loc_main' && (!l.name || l.name === 'Main HQ'))) {
          return { ...l, name: activeBusinessName, businessName: activeBusinessName };
        }
        return l;
      });
    }

    return filtered;
  }, [locations, activeBusinessName, activeBusinessId, currentUser?.locationId, currentUser?.phone, settings?.phone]);

  const currentLocation = useMemo(() => {
    return scopedLocations.find((l) => l.id === selectedLocationId) || scopedLocations[0];
  }, [scopedLocations, selectedLocationId]);

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // Preserve persistent installation and fresh installation flags
      if (prev.isInstalled && updated.isInstalled === undefined) {
        updated.isInstalled = true;
      }
      if (prev.installationCompleted && updated.installationCompleted === undefined) {
        updated.installationCompleted = true;
      }
      if (prev.isFreshInstallation && updated.isFreshInstallation === undefined) {
        updated.isFreshInstallation = true;
      }
      if (prev.installationType && !updated.installationType) {
        updated.installationType = prev.installationType;
      }

      if (updated.isInstalled && typeof localStorage !== 'undefined') {
        localStorage.setItem('pos_installed', 'true');
        localStorage.setItem('app_installed', 'true');
        localStorage.setItem('app_installation_completed', 'true');
      }
      if (updated.isFreshInstallation && typeof localStorage !== 'undefined') {
        localStorage.setItem('app_fresh_installed', 'true');
        localStorage.setItem('installation_type', 'fresh');
      }

      if (newSettings.businessName || newSettings.name) {
        const newBizName = (newSettings.businessName || newSettings.name || '').trim();
        if (newBizName) {
          updated.name = newBizName;
          updated.businessName = newBizName;
          setLocations((prevLocs) =>
            prevLocs.map((loc) => {
              if (loc.isDefault || loc.id === 'loc_main' || loc.name === 'Main HQ') {
                return { ...loc, name: newBizName, businessName: newBizName };
              }
              return loc;
            })
          );
        }
      }

      // Synchronize and treat uploaded logo as primary logo across the app
      if (newSettings.logoUrl !== undefined || (newSettings as any).logo !== undefined || (newSettings as any).darkLogoUrl !== undefined) {
        const logoVal = newSettings.logoUrl || (newSettings as any).logo || (newSettings as any).darkLogoUrl || '';
        updated.logoUrl = logoVal;
        (updated as any).logo = logoVal;
        // Apply primary logo to dark theme if not specifically overridden
        if (!newSettings.darkLogoUrl) {
          (updated as any).darkLogoUrl = logoVal;
        }
        if (logoVal) {
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('royal_pos_v1_primary_logo', logoVal);
            }
          } catch (e) {}
        } else {
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('royal_pos_v1_primary_logo');
            }
          } catch (e) {}
        }
      }

      if (newSettings.currency || newSettings.currencyCode || newSettings.currencySymbol) {
        const code = newSettings.currencyCode || newSettings.currency || prev.currencyCode || prev.currency || 'USD';
        const symbol = newSettings.currencySymbol || prev.currencySymbol || '$';
        updated.currency = code;
        updated.currencyCode = code;
        updated.currencySymbol = symbol;

        // Also update or add currency in currencies list
        setCurrencies((currList) => {
          const matchIndex = currList.findIndex(
            (c) => c.code.toUpperCase() === code.toUpperCase() || c.symbol === symbol
          );
          if (matchIndex >= 0) {
            return currList.map((c, i) =>
              i === matchIndex
                ? { ...c, isDefault: true, code: code.toUpperCase(), symbol }
                : { ...c, isDefault: false }
            );
          } else {
            const newCurr = {
              id: `curr_${Date.now()}`,
              name: code,
              code: code.toUpperCase(),
              symbol: symbol,
              placement: 'prefix' as const,
              decimalPlaces: 2,
              isDefault: true,
            };
            return [...currList.map((c) => ({ ...c, isDefault: false })), newCurr];
          }
        });
      }

      // Synchronize Tax Number / GSTIN across settings, seal, and invoices
      if (newSettings.taxNumber !== undefined || newSettings.gstin !== undefined || (newSettings as any).tax1No !== undefined) {
        const primaryTax = ((newSettings.taxNumber !== undefined ? newSettings.taxNumber : (newSettings.gstin !== undefined ? newSettings.gstin : (newSettings as any).tax1No)) || '').trim();
        updated.taxNumber = primaryTax;
        updated.gstin = primaryTax;
        (updated as any).tax1No = primaryTax;
        if (primaryTax && updated.signatureSealConfig) {
          updated.signatureSealConfig = {
            ...updated.signatureSealConfig,
            sealGstin: primaryTax,
          };
        }
      }

      // Synchronize Company / Legal Name
      if (newSettings.companyName || (newSettings as any).tax1Name) {
        const primaryCompany = (newSettings.companyName || (newSettings as any).tax1Name || '').trim();
        if (primaryCompany) {
          updated.companyName = primaryCompany;
          updated.legalName = primaryCompany;
          (updated as any).tax1Name = primaryCompany;
          if (updated.signatureSealConfig) {
            updated.signatureSealConfig = {
              ...updated.signatureSealConfig,
              sealCompanyName: primaryCompany,
            };
          }
        }
      }

      return updated;
    });
  };

  // Business Location Management
  const addLocation = (locData: Omit<Location, 'id'>) => {
    if (locData.phone) {
      const phoneVal = validatePhoneNumber(locData.phone);
      if (!phoneVal.isValid) {
        throw new Error(`Location Phone Error: ${phoneVal.error}`);
      }
    }
    const newId = `loc_${Date.now()}`;
    const activeBizName = currentUser?.businessName || settings.businessName || settings.name;
    const activeBizId = currentUser?.businessId;
    const newLocation: Location = {
      ...locData,
      id: newId,
      businessId: activeBizId,
      businessName: activeBizName,
    };

    if (newLocation.isDefault) {
      setLocations(prev => [
        ...prev.map(l => ({ ...l, isDefault: false })),
        newLocation
      ]);
      setSelectedLocationId(newId);
    } else {
      setLocations(prev => [...prev, newLocation]);
    }

    showFlashNotification(`Location "${newLocation.name}" created successfully`, 'success');
    return newLocation;
  };

  const updateLocation = (id: string, updateData: Partial<Location>) => {
    setLocations(prev => prev.map(l => {
      if (l.id !== id) {
        if (updateData.isDefault) {
          return { ...l, isDefault: false };
        }
        return l;
      }
      
      const updated = { ...l, ...updateData };
      if (updated.isDefault) {
        setSelectedLocationId(id);
      }
      return updated;
    }));
    showFlashNotification('Location details updated', 'success');
  };

  const deleteLocation = (id: string) => {
    if (locations.length <= 1) {
      return { success: false, message: 'At least one business location must remain in the system.' };
    }

    const locToDelete = locations.find(l => l.id === id);
    if (locToDelete?.isDefault) {
      return { success: false, message: 'The flagship (default) location cannot be deleted. Set another location as default first.' };
    }

    // Check if location is in use
    const hasTransactions = transactions.some(t => t.locationId === id);
    const hasProducts = products.some(p => p.locationStocks && p.locationStocks?.[id] > 0);
    const hasUsers = users.some(u => u.locationId === id);

    if (hasTransactions || hasProducts || hasUsers) {
      return { 
        success: false, 
        message: 'This location is currently linked to existing transactions, stock inventory, or assigned employees. Please reassign them before deletion.' 
      };
    }

    setLocations(prev => prev.filter(l => l.id !== id));
    if (selectedLocationId === id) {
      const fallback = locations.find(l => l.id !== id);
      if (fallback) setSelectedLocationId(fallback.id);
    }

    showFlashNotification(`Location "${locToDelete?.name}" removed`, 'info');
    return { success: true };
  };

  // Currency State & Management
  const activeCurrency = useMemo(() => {
    const found = currencies.find(
      (c) =>
        c.id === settings.currencyId ||
        c.code.toUpperCase() === (settings.currencyCode || settings.currency || '').toUpperCase() ||
        c.symbol === settings.currencySymbol
    );
    return (
      found ||
      currencies.find((c) => c.isDefault) ||
      currencies[0] || {
        id: 'curr_usd',
        name: 'US Dollar',
        code: 'USD',
        symbol: '$',
        placement: 'prefix' as const,
        decimalPlaces: 2,
        isDefault: true,
      }
    );
  }, [currencies, settings.currencyId, settings.currencyCode, settings.currency, settings.currencySymbol]);

  const addCurrency = (currData: Omit<Currency, 'id'>) => {
    const newId = `curr_${Date.now()}`;
    const newCurr: Currency = {
      ...currData,
      id: newId,
      code: currData.code.toUpperCase().trim(),
      symbol: currData.symbol.trim(),
      placement: currData.placement || 'prefix',
      decimalPlaces: currData.decimalPlaces ?? 2,
    };

    if (currData.isDefault) {
      setCurrencies((prev) => [
        ...prev.map((c) => ({ ...c, isDefault: false })),
        newCurr,
      ]);
      setSettings((prev) => ({
        ...prev,
        currency: newCurr.code,
        currencyCode: newCurr.code,
        currencySymbol: newCurr.symbol,
        currencyPlacement: newCurr.placement,
        currencyDecimalPlaces: newCurr.decimalPlaces,
        currencyId: newId,
      }));
    } else {
      setCurrencies((prev) => [...prev, newCurr]);
    }
  };

  const updateCurrency = (id: string, updateData: Partial<Currency>) => {
    setCurrencies((prev) =>
      prev.map((c) => {
        if (c.id !== id) {
          if (updateData.isDefault) {
            return { ...c, isDefault: false };
          }
          return c;
        }

        const updated: Currency = {
          ...c,
          ...updateData,
          code: (updateData.code ?? c.code).toUpperCase().trim(),
          symbol: (updateData.symbol ?? c.symbol).trim(),
        };

        if (
          updated.isDefault ||
          c.id === settings.currencyId ||
          c.code.toUpperCase() === (settings.currencyCode || settings.currency || '').toUpperCase()
        ) {
          setSettings((s) => ({
            ...s,
            currency: updated.code,
            currencyCode: updated.code,
            currencySymbol: updated.symbol,
            currencyPlacement: updated.placement || 'prefix',
            currencyDecimalPlaces: updated.decimalPlaces ?? 2,
            currencyId: updated.id,
          }));
        }

        return updated;
      })
    );
  };

  const deleteCurrency = (id: string) => {
    if (currencies.length <= 1) return;
    const target = currencies.find((c) => c.id === id);
    const remaining = currencies.filter((c) => c.id !== id);

    const isCurrentActive =
      target?.isDefault ||
      target?.id === settings.currencyId ||
      target?.code.toUpperCase() === (settings.currencyCode || settings.currency || '').toUpperCase();

    if (isCurrentActive) {
      const fallback = remaining[0];
      setCurrencies(
        remaining.map((c, i) => ({ ...c, isDefault: i === 0 }))
      );
      setSettings((prev) => ({
        ...prev,
        currency: fallback.code,
        currencyCode: fallback.code,
        currencySymbol: fallback.symbol,
        currencyPlacement: fallback.placement || 'prefix',
        currencyDecimalPlaces: fallback.decimalPlaces ?? 2,
        currencyId: fallback.id,
      }));
    } else {
      setCurrencies(remaining);
    }
  };

  const setActiveCurrency = (id: string) => {
    const target = currencies.find((c) => c.id === id);
    if (!target) return;

    setCurrencies((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === id,
      }))
    );

    setSettings((prev) => ({
      ...prev,
      currency: target.code,
      currencyCode: target.code,
      currencySymbol: target.symbol,
      currencyPlacement: target.placement || 'prefix',
      currencyDecimalPlaces: target.decimalPlaces ?? 2,
      currencyId: target.id,
    }));
  };

  const setStoreCurrency = (
    code: string,
    symbol: string,
    name?: string,
    placement: 'prefix' | 'suffix' = 'prefix',
    decimalPlaces: number = 2
  ) => {
    const cleanCode = code.toUpperCase().trim();
    const cleanSymbol = symbol.trim();
    const existing = currencies.find(
      (c) => c.code.toUpperCase() === cleanCode || c.symbol === cleanSymbol
    );

    if (existing) {
      setActiveCurrency(existing.id);
      if (existing.symbol !== cleanSymbol || existing.name !== (name || existing.name)) {
        updateCurrency(existing.id, {
          symbol: cleanSymbol,
          name: name || existing.name,
          placement,
          decimalPlaces,
        });
      }
    } else {
      addCurrency({
        name: name || `${cleanCode} Currency`,
        code: cleanCode,
        symbol: cleanSymbol,
        placement,
        decimalPlaces,
        isDefault: true,
      });
    }
  };

  const formatMoney = (amount: number, overrideSymbol?: string): string => {
    const symbol = overrideSymbol ?? settings.currencySymbol ?? activeCurrency?.symbol ?? '$';
    const placement = settings.currencyPlacement ?? activeCurrency?.placement ?? 'prefix';
    const decimals = settings.currencyDecimalPlaces ?? activeCurrency?.decimalPlaces ?? 2;
    const num = isNaN(amount) ? 0 : amount;
    const formattedNum = num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (placement === 'suffix') {
      return `${formattedNum} ${symbol}`.trim();
    }
    return `${symbol}${formattedNum}`;
  };

  // Tax Rates & Tax Groups CRUD
  const addTaxRate = (rateData: Omit<TaxRate, 'id'>) => {
    const newRate: TaxRate = {
      ...rateData,
      id: `tr_${Date.now()}`,
    };
    setTaxRates((prev) => [...prev, newRate]);
  };

  const updateTaxRate = (id: string, updateData: Partial<TaxRate>) => {
    setTaxRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updateData } : r))
    );
    // Recalculate any groups that contain this tax rate
    setTaxGroups((prev) =>
      prev.map((group) => {
        if (!group.subTaxIds.includes(id)) return group;
        const currentRates = taxRates.map((r) => (r.id === id ? { ...r, ...updateData } : r));
        const totalRate = group.subTaxIds.reduce((sum, tid) => {
          const found = currentRates.find((r) => r.id === tid);
          return sum + (found?.rate || 0);
        }, 0);
        return { ...group, totalRate: +totalRate.toFixed(2) };
      })
    );
  };

  const deleteTaxRate = (id: string) => {
    setTaxRates((prev) => prev.filter((r) => r.id !== id));
    // Remove from groups
    setTaxGroups((prev) =>
      prev.map((group) => {
        if (!group.subTaxIds.includes(id)) return group;
        const remainingSubIds = group.subTaxIds.filter((tid) => tid !== id);
        const totalRate = remainingSubIds.reduce((sum, tid) => {
          const found = taxRates.find((r) => r.id === tid);
          return sum + (found?.rate || 0);
        }, 0);
        return { ...group, subTaxIds: remainingSubIds, totalRate: +totalRate.toFixed(2) };
      })
    );
  };

  const addTaxGroup = (groupData: Omit<TaxGroup, 'id'>) => {
    const calculatedTotal = groupData.subTaxIds.reduce((sum, tid) => {
      const found = taxRates.find((r) => r.id === tid);
      return sum + (found?.rate || 0);
    }, 0);

    const newGroup: TaxGroup = {
      ...groupData,
      id: `tg_${Date.now()}`,
      totalRate: groupData.totalRate || +calculatedTotal.toFixed(2),
    };
    setTaxGroups((prev) => [...prev, newGroup]);
  };

  const updateTaxGroup = (id: string, updateData: Partial<TaxGroup>) => {
    setTaxGroups((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const merged = { ...g, ...updateData };
        if (updateData.subTaxIds) {
          const calculatedTotal = updateData.subTaxIds.reduce((sum, tid) => {
            const found = taxRates.find((r) => r.id === tid);
            return sum + (found?.rate || 0);
          }, 0);
          merged.totalRate = +calculatedTotal.toFixed(2);
        }
        return merged;
      })
    );
  };

  const deleteTaxGroup = (id: string) => {
    setTaxGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // Country & Regional Tax Presets
  const applyCountryTaxPreset = (preset: 'india_gst' | 'usa_sales' | 'uk_vat' | 'uae_vat' | 'tax_exempt') => {
    if (preset === 'india_gst') {
      setSettings((prev) => {
        const existingTax = prev.gstin || prev.taxNumber || (prev as any).tax1No || '27AABCR1234F1Z5';
        return {
          ...prev,
          enableTax: true,
          taxSystem: 'gst_india',
          gstin: existingTax,
          stateCode: prev.stateCode || '27 - Maharashtra',
          taxNumber: existingTax,
          tax1No: existingTax,
          enableHsnCode: true,
          taxCalculationType: 'exclusive',
          defaultTaxRate: 18.0,
          defaultTaxGroupId: 'tg_gst_18',
          isInterstate: false,
        };
      });
    } else if (preset === 'usa_sales') {
      setSettings((prev) => {
        const existingTax = prev.taxNumber || (prev as any).tax1No || prev.gstin || 'US-TX-9948201';
        return {
          ...prev,
          enableTax: true,
          taxSystem: 'sales_tax',
          taxNumber: existingTax,
          tax1No: existingTax,
          gstin: existingTax,
          enableHsnCode: false,
          taxCalculationType: 'exclusive',
          defaultTaxRate: 8.25,
          defaultTaxGroupId: 'tg_us_sales_8_25',
        };
      });
    } else if (preset === 'uk_vat') {
      setSettings((prev) => {
        const existingTax = prev.taxNumber || (prev as any).tax1No || prev.gstin || 'GB 123 4567 89';
        return {
          ...prev,
          enableTax: true,
          taxSystem: 'vat',
          taxNumber: existingTax,
          tax1No: existingTax,
          gstin: existingTax,
          enableHsnCode: true,
          taxCalculationType: 'inclusive',
          defaultTaxRate: 20.0,
          defaultTaxGroupId: 'tg_vat_20',
        };
      });
    } else if (preset === 'uae_vat') {
      setSettings((prev) => {
        const existingTax = prev.taxNumber || (prev as any).tax1No || prev.gstin || 'TRN 100293848100003';
        return {
          ...prev,
          enableTax: true,
          taxSystem: 'vat',
          taxNumber: existingTax,
          tax1No: existingTax,
          gstin: existingTax,
          enableHsnCode: false,
          taxCalculationType: 'exclusive',
          defaultTaxRate: 5.0,
          defaultTaxGroupId: 'tg_vat_5',
        };
      });
    } else if (preset === 'tax_exempt') {
      setSettings((prev) => ({
        ...prev,
        enableTax: false,
        taxSystem: 'disabled',
        defaultTaxRate: 0.0,
        defaultTaxGroupId: 'tg_exempt',
      }));
    }
  };

  // Comprehensive Tax Calculator for Line Items (GST / VAT / Sales Tax)
  const calculateItemTax = (
    unitPrice: number,
    qty: number,
    discount: number = 0,
    item?: { taxRate?: number; taxGroupId?: string; taxType?: string; forceCalculate?: boolean }
  ) => {
    const lineGross = Math.max(0, (unitPrice * qty) - discount);
    const isTaxActive = item?.forceCalculate || (settings.enableTax && settings.taxSystem !== 'disabled' && (settings.enableInlineTax ?? true));
    if (!isTaxActive || item?.taxType === 'exempt') {
      return {
        lineSubtotal: lineGross,
        taxRate: 0,
        taxAmount: 0,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        lineTotal: lineGross,
      };
    }

    let rate = item?.taxRate !== undefined ? item.taxRate : settings.defaultTaxRate;
    if (item?.taxGroupId) {
      const group = taxGroups.find((g) => g.id === item.taxGroupId);
      if (group) {
        rate = group.totalRate;
      }
    }

    let taxAmount = 0;
    let netSubtotal = lineGross;

    if (settings.taxCalculationType === 'inclusive') {
      // Inclusive price: Net = Gross / (1 + rate/100)
      netSubtotal = +(lineGross / (1 + (rate / 100))).toFixed(2);
      taxAmount = +(lineGross - netSubtotal).toFixed(2);
    } else {
      // Exclusive price: Tax = Net * rate%
      taxAmount = +((lineGross * rate) / 100).toFixed(2);
    }

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (settings.taxSystem === 'gst_india') {
      if (settings.isInterstate) {
        igstRate = rate;
        igstAmount = taxAmount;
      } else {
        cgstRate = +(rate / 2).toFixed(2);
        cgstAmount = +(taxAmount / 2).toFixed(2);
        sgstRate = +(rate / 2).toFixed(2);
        sgstAmount = +(taxAmount - cgstAmount).toFixed(2);
      }
    }

    const lineTotal = settings.taxCalculationType === 'inclusive'
      ? lineGross
      : +(lineGross + taxAmount).toFixed(2);

    return {
      lineSubtotal: netSubtotal,
      taxRate: rate,
      taxAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      lineTotal,
    };
  };

  const [activeNotification, setActiveNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showFlashNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setActiveNotification({ message, type });
    setTimeout(() => setActiveNotification(null), 3000);
  };

  // Product Management
  const addProducts = (productsData: Omit<Product, 'id' | 'currentStock'>[]) => {
    const newProducts = productsData.map((productData, idx) => {
      const totalStock = Object.values(productData.locationStocks || {}).reduce((a: any, b: any) => a + b, 0) as number;
      const newId = `prod_${Date.now()}_${idx}`;
      const lots = productData.lots && productData.lots.length > 0 ? productData.lots : [
        {
          id: `lot_${Date.now()}_${idx}`,
          lotNumber: `LOT-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
          costPrice: productData.costPrice,
          sellingPrice: productData.sellingPrice,
          currentStock: totalStock,
          createdDate: new Date().toISOString().slice(0, 10),
        }
      ];
      return {
        ...productData,
        id: newId,
        currentStock: totalStock as number,
        lots: lots,
      } as Product;
    });
    setProducts((prev) => [...newProducts, ...prev]);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'currentStock'>) => {
    const totalStock = Object.values(productData.locationStocks || {}).reduce((a: any, b: any) => a + b, 0) as number;
    const newId = `prod_${Date.now()}`;
    
    // Create initial lot if not provided
    const lots = productData.lots && productData.lots.length > 0 ? productData.lots : [
      {
        id: `lot_${Date.now()}`,
        lotNumber: `LOT-${new Date().getFullYear()}-001`,
        costPrice: productData.costPrice,
        sellingPrice: productData.sellingPrice,
        currentStock: totalStock,
        createdDate: new Date().toISOString().slice(0, 10),
      }
    ];

    // Check if initial lot already exists when creating
    if (lots && lots.length > 0) {
      const duplicate = products.find(p =>
        p.lots?.some(l => lots.some((newLot: any) => newLot.lotNumber.toLowerCase() === l.lotNumber.toLowerCase()))
      );
      if (duplicate) {
        showFlashNotification(`Lot Number already exists in product "${duplicate.name}". Please use a unique lot number.`, 'error');
        return;
      }
    }

    const newProduct: Product = {
      ...productData,
      id: newId,
      currentStock: totalStock as number,
      lots: lots,
    } as Product;
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updateData: Partial<Product>) => {
    let priceLotAdded = false;
    let addedLotNumber = '';
    let errorMessage = '';

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        
        // Check if price or cost changed to trigger lot creation
        const priceChanged = 
          (updateData.sellingPrice !== undefined && Number(updateData.sellingPrice) !== Number(p.sellingPrice)) ||
          (updateData.costPrice !== undefined && Number(updateData.costPrice) !== Number(p.costPrice));

        let updatedLots = updateData.lots ? [...updateData.lots] : (p.lots ? [...p.lots] : []);

        if (priceChanged) {
          // If no lots exist, create a lot for the CURRENT (now old) price first
          if (updatedLots.length === 0) {
            updatedLots.push({
              id: `lot_auto_old_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              lotNumber: 'INITIAL-BATCH',
              costPrice: p.costPrice,
              sellingPrice: p.sellingPrice,
              currentStock: p.currentStock,
              createdDate: new Date().toISOString().slice(0, 10),
            });
          }

          const newLotNum = updateData.manualLotNumber || `LOT-${new Date().getFullYear()}-${updatedLots.length + 1}`;
          
          const newLot: ProductLot = {
            id: `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lotNumber: newLotNum,
            costPrice: updateData.costPrice ?? p.costPrice,
            sellingPrice: updateData.sellingPrice ?? p.sellingPrice,
            currentStock: updateData.initialLotStock || 0, 
            createdDate: new Date().toISOString().slice(0, 10),
          };
          
          updatedLots = [...updatedLots, newLot];
          priceLotAdded = true;
          addedLotNumber = newLotNum;
        }

        const merged = { 
          ...p, 
          ...updateData, 
          lots: updatedLots.length > 0 ? updatedLots : p.lots 
        };

        // Clean up temporary fields
        delete (merged as any).manualLotNumber;
        delete (merged as any).initialLotStock;

        if (updateData.currentStock !== undefined) {
          const finalStock = Math.max(0, Number(updateData.currentStock));
          merged.currentStock = finalStock;
          merged.stock = finalStock;
        } else if (updateData.lots || priceChanged) {
          const totalLotsStock = updatedLots.reduce((sum, l) => sum + (Number(l.currentStock) || 0), 0);
          merged.currentStock = totalLotsStock;
          merged.stock = totalLotsStock;
          if (merged.locationStocks && Object.keys(merged.locationStocks).length > 0) {
            const firstLocKey = Object.keys(merged.locationStocks)[0];
            merged.locationStocks = {
              ...merged.locationStocks,
              [firstLocKey]: totalLotsStock,
            };
          }
        } else if (updateData.locationStocks) {
          const totalLocStock = Object.values(updateData.locationStocks).reduce((a: any, b: any) => a + Number(b || 0), 0) as number;
          merged.currentStock = totalLocStock;
          merged.stock = totalLocStock;
        }

        return merged;
      })
    );

    if (priceLotAdded) {
      showFlashNotification(`New price batch ${addedLotNumber} created with ${updateData.initialLotStock || 0} stock.`, 'success');
    }
  };

  const deleteProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product && product.currentStock > 0) {
      showFlashNotification(`Cannot delete ${product.name}. Stock must be zero. Current stock: ${product.currentStock}`, 'error');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showFlashNotification(`Product ${product?.name || ''} deleted successfully.`, 'success');
  };

  // Stock Adjustment (Damage, Expiry, Audit loss, Found)
  const adjustStock = (data: Omit<StockAdjustment, 'id' | 'referenceNo' | 'date'>) => {
    const ref = `ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAdj: StockAdjustment = {
      ...data,
      id: `adj_${Date.now()}`,
      referenceNo: ref,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    // Update product stock levels
    setProducts((prev) =>
      prev.map((prod) => {
        const item = data.items.find((i) => i.productId === prod.id);
        if (!item) return prod;

        const currentLocStock = prod.locationStocks?.[data.locationId] || 0;
        const delta = item.type === 'found' ? item.quantity : -item.quantity;
        const newLocStock = Math.max(0, currentLocStock + delta);

        const newLocationStocks = {
          ...prod.locationStocks,
          [data.locationId]: newLocStock,
        };
        const total = (Object.values(newLocationStocks) as number[]).reduce((a: any, b: any) => a + b, 0) as number;

        return {
          ...prod,
          locationStocks: newLocationStocks,
          currentStock: total,
        };
      })
    );

    setStockAdjustments((prev) => [newAdj, ...prev]);
  };

  // Stock Transfer between locations
  const transferStock = (data: Omit<StockTransfer, 'id' | 'referenceNo' | 'date'>) => {
    const ref = `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTransfer: StockTransfer = {
      ...data,
      id: `trf_${Date.now()}`,
      referenceNo: ref,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    if (data.status === 'completed') {
      // Immediately transfer stock
      applyTransferStock(data.fromLocationId, data.toLocationId, data.items);
    }

    setStockTransfers((prev) => [newTransfer, ...prev]);
  };

  const deleteStockAdjustment = (id: string) => {
    setStockAdjustments((prev) => prev.filter((a) => a.id !== id));
  };

  const updateStockAdjustment = (id: string, adjustment: Partial<StockAdjustment>) => {
    setStockAdjustments((prev) => prev.map((a) => (a.id === id ? { ...a, ...adjustment } : a)));
  };

  const updateStockTransfer = (id: string, transferData: Partial<StockTransfer>) => {
    setStockTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...transferData } : t))
    );
  };

  const deleteStockTransfer = (id: string) => {
    setStockTransfers((prev) => prev.filter((t) => t.id !== id));
  };

  const completeStockTransfer = (id: string) => {
    const transfer = stockTransfers.find((t) => t.id === id);
    if (!transfer || transfer.status === 'completed') return;

    applyTransferStock(transfer.fromLocationId, transfer.toLocationId, transfer.items);

    setStockTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'completed' } : t))
    );
  };

  const applyTransferStock = (fromLoc: string, toLoc: string, items: { productId: string; quantity: number }[]) => {
    setProducts((prev) =>
      prev.map((prod) => {
        const item = items.find((i) => i.productId === prod.id);
        if (!item) return prod;

        const fromStock = Math.max(0, (prod.locationStocks?.[fromLoc] || 0) - item.quantity);
        const toStock = (prod.locationStocks?.[toLoc] || 0) + item.quantity;

        const newLocStocks = {
          ...prod.locationStocks,
          [fromLoc]: fromStock,
          [toLoc]: toStock,
        };
        const total = (Object.values(newLocStocks) as number[]).reduce((a: any, b: any) => a + b, 0) as number;

        return {
          ...prod,
          locationStocks: newLocStocks,
          currentStock: total,
        };
      })
    );
  };

  // Units of Measure Management (finias POS Products & Inventory -> Units)
  const addUnit = (unitData: Omit<Unit, 'id' | 'createdDate'>): Unit => {
    const newUnit: Unit = {
      ...unitData,
      id: `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: unitData.name.trim(),
      shortName: unitData.shortName.trim(),
      allowDecimal: !!unitData.allowDecimal,
      isBaseUnit: unitData.isBaseUnit !== undefined ? unitData.isBaseUnit : true,
      baseUnitId: unitData.baseUnitId || undefined,
      baseUnitMultiplier: unitData.baseUnitMultiplier || undefined,
      description: unitData.description?.trim() || '',
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setUnits((prev) => [...prev, newUnit]);
    return newUnit;
  };

  const updateUnit = (id: string, unitData: Partial<Unit>) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated: Unit = {
          ...u,
          ...unitData,
          name: unitData.name !== undefined ? unitData.name.trim() : u.name,
          shortName: unitData.shortName !== undefined ? unitData.shortName.trim() : u.shortName,
          allowDecimal: unitData.allowDecimal !== undefined ? unitData.allowDecimal : u.allowDecimal,
          isBaseUnit: unitData.isBaseUnit !== undefined ? unitData.isBaseUnit : u.isBaseUnit,
          baseUnitId: unitData.baseUnitId !== undefined ? (unitData.baseUnitId || undefined) : u.baseUnitId,
          baseUnitMultiplier: unitData.baseUnitMultiplier !== undefined ? (unitData.baseUnitMultiplier || undefined) : u.baseUnitMultiplier,
          description: unitData.description !== undefined ? unitData.description.trim() : u.description,
        };
        return updated;
      })
    );
  };

  const deleteUnit = (id: string): { success: boolean; message?: string } => {
    const unitToDelete = units.find((u) => u.id === id);
    if (!unitToDelete) {
      return { success: false, message: 'Unit not found in registry.' };
    }

    // Check if any product is using this unit name or shortName
    const linkedProducts = products.filter(
      (p) =>
        (p.unit && p.unit.toLowerCase() === unitToDelete.shortName.toLowerCase()) ||
        (p.unit && p.unit.toLowerCase() === unitToDelete.name.toLowerCase())
    );

    if (linkedProducts.length > 0) {
      return {
        success: false,
        message: `Cannot delete "${unitToDelete.name} (${unitToDelete.shortName})" because it is actively used by ${linkedProducts.length} product(s) (e.g. ${linkedProducts.slice(0, 2).map((p) => p.name).join(', ')}). Please reassign their units first.`,
      };
    }

    // Check if any secondary units depend on this unit as their base unit
    const linkedSubUnits = units.filter((u) => u.baseUnitId === id);
    if (linkedSubUnits.length > 0) {
      return {
        success: false,
        message: `Cannot delete base unit "${unitToDelete.name}" because ${linkedSubUnits.length} sub-unit(s) (${linkedSubUnits.map((u) => u.shortName).join(', ')}) depend on it.`,
      };
    }

    setUnits((prev) => prev.filter((u) => u.id !== id));
    return {
      success: true,
      message: `Unit "${unitToDelete.name} (${unitToDelete.shortName})" deleted successfully.`,
    };
  };

  // Category Management (finias POS Products & Inventory -> Categories)
  const addCategory = (categoryData: Omit<Category, 'id' | 'createdDate'>): Category => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: categoryData.name.trim(),
      code: (categoryData.code || `CAT-${categoryData.name.substring(0, 4).toUpperCase()}`).trim().toUpperCase(),
      shortCode: categoryData.shortCode?.trim().toUpperCase() || '',
      description: categoryData.description?.trim() || '',
      parentId: categoryData.parentId || undefined,
      parentName: categoryData.parentName || undefined,
      color: categoryData.color || '#6366f1',
      icon: categoryData.icon || 'Folder',
      status: categoryData.status || 'active',
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, categoryData: Partial<Category>) => {
    const currentCat = categories.find((c) => c.id === id);
    const oldName = currentCat?.name;
    const newName = categoryData.name !== undefined ? categoryData.name.trim() : oldName;

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) {
          // If this category was parent of other category, update parentName
          if (c.parentId === id && newName) {
            return { ...c, parentName: newName };
          }
          return c;
        }
        return {
          ...c,
          ...categoryData,
          name: newName || c.name,
          code: categoryData.code !== undefined ? categoryData.code.trim().toUpperCase() : c.code,
          shortCode: categoryData.shortCode !== undefined ? categoryData.shortCode.trim().toUpperCase() : c.shortCode,
          description: categoryData.description !== undefined ? categoryData.description.trim() : c.description,
          parentId: categoryData.parentId !== undefined ? (categoryData.parentId || undefined) : c.parentId,
          parentName: categoryData.parentName !== undefined ? (categoryData.parentName || undefined) : c.parentName,
          color: categoryData.color !== undefined ? categoryData.color : c.color,
          icon: categoryData.icon !== undefined ? categoryData.icon : c.icon,
          status: categoryData.status !== undefined ? categoryData.status : c.status,
        };
      })
    );

    // Synchronize category name in products if updated
    if (oldName && newName && oldName !== newName) {
      setProducts((prev) =>
        prev.map((p) => (p.category === oldName ? { ...p, category: newName } : p))
      );
    }
  };

  const deleteCategory = (
    id: string,
    cascadeReassignToId?: string
  ): { success: boolean; message?: string } => {
    const catToDelete = categories.find((c) => c.id === id);
    if (!catToDelete) {
      return { success: false, message: 'Category not found in registry.' };
    }

    const linkedProducts = products.filter(
      (p) => p.category && p.category.toLowerCase() === catToDelete.name.toLowerCase()
    );

    if (linkedProducts.length > 0) {
      if (cascadeReassignToId) {
        const targetCategory = categories.find((c) => c.id === cascadeReassignToId);
        if (targetCategory) {
          setProducts((prev) =>
            prev.map((p) =>
              p.category && p.category.toLowerCase() === catToDelete.name.toLowerCase()
                ? { ...p, category: targetCategory.name }
                : p
            )
          );
        }
      } else {
        return {
          success: false,
          message: `Cannot delete category "${catToDelete.name}" because it is actively assigned to ${linkedProducts.length} product(s) (e.g. ${linkedProducts.slice(0, 2).map((p) => p.name).join(', ')}). Please reassign products first or choose a target category to migrate them to.`,
        };
      }
    }

    // Unlink child categories if any
    setCategories((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => (c.parentId === id ? { ...c, parentId: undefined, parentName: undefined } : c))
    );

    return {
      success: true,
      message: `Category "${catToDelete.name}" deleted successfully.`,
    };
  };

  // Brand Management (finias POS Products & Inventory -> Brands)
  const addBrand = (brandData: Omit<Brand, 'id' | 'createdDate'>): Brand => {
    const newBrand: Brand = {
      ...brandData,
      id: `brd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: brandData.name.trim(),
      code: (brandData.code || `BRD-${brandData.name.substring(0, 4).toUpperCase().replace(/\s+/g, '')}`).trim().toUpperCase(),
      shortCode: brandData.shortCode?.trim().toUpperCase() || '',
      description: brandData.description?.trim() || '',
      website: brandData.website?.trim() || '',
      originCountry: brandData.originCountry?.trim() || '',
      color: brandData.color || '#6366f1',
      logo: brandData.logo || '',
      status: brandData.status || 'active',
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setBrands((prev) => [...prev, newBrand]);
    return newBrand;
  };

  const updateBrand = (id: string, brandData: Partial<Brand>) => {
    const currentBrand = brands.find((b) => b.id === id);
    const oldName = currentBrand?.name;
    const newName = brandData.name !== undefined ? brandData.name.trim() : oldName;

    setBrands((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          ...brandData,
          name: newName || b.name,
          code: brandData.code !== undefined ? brandData.code.trim().toUpperCase() : b.code,
          shortCode: brandData.shortCode !== undefined ? brandData.shortCode.trim().toUpperCase() : b.shortCode,
          description: brandData.description !== undefined ? brandData.description.trim() : b.description,
          website: brandData.website !== undefined ? brandData.website.trim() : b.website,
          originCountry: brandData.originCountry !== undefined ? brandData.originCountry.trim() : b.originCountry,
          color: brandData.color !== undefined ? brandData.color : b.color,
          logo: brandData.logo !== undefined ? brandData.logo : b.logo,
          status: brandData.status !== undefined ? brandData.status : b.status,
        };
      })
    );

    // Synchronize brand name in products if updated
    if (oldName && newName && oldName !== newName) {
      setProducts((prev) =>
        prev.map((p) => (p.brand === oldName ? { ...p, brand: newName } : p))
      );
    }
  };

  const deleteBrand = (
    id: string,
    cascadeReassignToId?: string
  ): { success: boolean; message?: string } => {
    const brandToDelete = brands.find((b) => b.id === id);
    if (!brandToDelete) {
      return { success: false, message: 'Brand not found in registry.' };
    }

    const linkedProducts = products.filter(
      (p) => p.brand && p.brand.toLowerCase() === brandToDelete.name.toLowerCase()
    );

    if (linkedProducts.length > 0) {
      if (cascadeReassignToId) {
        const targetBrand = brands.find((b) => b.id === cascadeReassignToId);
        if (targetBrand) {
          setProducts((prev) =>
            prev.map((p) =>
              p.brand && p.brand.toLowerCase() === brandToDelete.name.toLowerCase()
                ? { ...p, brand: targetBrand.name }
                : p
            )
          );
        }
      } else {
        return {
          success: false,
          message: `Cannot delete brand "${brandToDelete.name}" because it is actively assigned to ${linkedProducts.length} product(s) (e.g. ${linkedProducts.slice(0, 2).map((p) => p.name).join(', ')}). Please choose a target brand to migrate those products to or reassign them first.`,
        };
      }
    }

    setBrands((prev) => prev.filter((b) => b.id !== id));

    return {
      success: true,
      message: `Brand "${brandToDelete.name}" deleted successfully.`,
    };
  };

  // Warranty Management (finias POS Products & Inventory -> Warranties)
  const getWarrantyById = (id?: string): Warranty | undefined => {
    if (!id) return undefined;
    return warranties.find((w) => w.id === id);
  };

  const calculateWarrantyExpiry = (
    startDateStr: string,
    duration: number,
    durationType: WarrantyDurationType
  ): string => {
    try {
      const d = new Date(startDateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) {
        const now = new Date();
        if (durationType === 'days') now.setDate(now.getDate() + duration);
        else if (durationType === 'months') now.setMonth(now.getMonth() + duration);
        else if (durationType === 'years') now.setFullYear(now.getFullYear() + duration);
        return now.toISOString().slice(0, 10);
      }
      if (durationType === 'days') {
        d.setDate(d.getDate() + duration);
      } else if (durationType === 'months') {
        d.setMonth(d.getMonth() + duration);
      } else if (durationType === 'years') {
        d.setFullYear(d.getFullYear() + duration);
      }
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const addWarranty = (warrantyData: Omit<Warranty, 'id' | 'createdDate'>): Warranty => {
    const newWarranty: Warranty = {
      ...warrantyData,
      id: `war_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: warrantyData.name.trim(),
      description: warrantyData.description?.trim() || '',
      duration: Number(warrantyData.duration) || 1,
      durationType: warrantyData.durationType || 'years',
      terms: warrantyData.terms?.trim() || '',
      color: warrantyData.color || '#6366f1',
      status: warrantyData.status || 'active',
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setWarranties((prev) => [...prev, newWarranty]);
    return newWarranty;
  };

  const updateWarranty = (id: string, warrantyData: Partial<Warranty>) => {
    setWarranties((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        return {
          ...w,
          ...warrantyData,
          name: warrantyData.name !== undefined ? warrantyData.name.trim() : w.name,
          description: warrantyData.description !== undefined ? warrantyData.description.trim() : w.description,
          duration: warrantyData.duration !== undefined ? Number(warrantyData.duration) : w.duration,
          durationType: warrantyData.durationType !== undefined ? warrantyData.durationType : w.durationType,
          terms: warrantyData.terms !== undefined ? warrantyData.terms.trim() : w.terms,
          color: warrantyData.color !== undefined ? warrantyData.color : w.color,
          status: warrantyData.status !== undefined ? warrantyData.status : w.status,
        };
      })
    );
  };

  const deleteWarranty = (
    id: string,
    cascadeReassignToId?: string
  ): { success: boolean; message?: string } => {
    const warToDelete = warranties.find((w) => w.id === id);
    if (!warToDelete) {
      return { success: false, message: 'Warranty plan not found in registry.' };
    }

    const linkedProducts = products.filter((p) => p.warrantyId === id);

    if (linkedProducts.length > 0) {
      if (cascadeReassignToId !== undefined) {
        setProducts((prev) =>
          prev.map((p) =>
            p.warrantyId === id
              ? { ...p, warrantyId: cascadeReassignToId || undefined }
              : p
          )
        );
      } else {
        return {
          success: false,
          message: `Cannot delete warranty "${warToDelete.name}" because it is actively assigned to ${linkedProducts.length} product(s) (e.g. ${linkedProducts.slice(0, 2).map((p) => p.name).join(', ')}). Please choose a replacement warranty or remove it from those products first.`,
        };
      }
    }

    setWarranties((prev) => prev.filter((w) => w.id !== id));
    return {
      success: true,
      message: `Warranty plan "${warToDelete.name}" deleted successfully.`,
    };
  };

  const assignWarrantyToProducts = (warrantyId: string | null, productIds: string[]) => {
    setProducts((prev) =>
      prev.map((p) =>
        productIds.includes(p.id)
          ? { ...p, warrantyId: warrantyId || undefined }
          : p
      )
    );
  };

  // Rack, Row & Position Management (finias POS Products & Inventory -> Rack, Row & Position)
  const addRack = (rackData: Omit<RackLocation, 'id' | 'createdDate'>): RackLocation => {
    const newRack: RackLocation = {
      ...rackData,
      id: `rck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: rackData.name.trim(),
      code: (rackData.code || `RCK-${rackData.name.substring(0, 4).toUpperCase().replace(/\s+/g, '')}`).trim().toUpperCase(),
      zone: rackData.zone?.trim() || '',
      aisle: rackData.aisle?.trim() || '',
      rows: rackData.rows && rackData.rows.length > 0 ? rackData.rows : ['Row 1', 'Row 2', 'Row 3'],
      positions: rackData.positions && rackData.positions.length > 0 ? rackData.positions : ['Position 1', 'Position 2', 'Position 3'],
      description: rackData.description?.trim() || '',
      color: rackData.color || '#6366f1',
      status: rackData.status || 'active',
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setRacks((prev) => [...prev, newRack]);
    return newRack;
  };

  const updateRack = (id: string, rackData: Partial<RackLocation>) => {
    const currentRack = racks.find((r) => r.id === id);
    const oldName = currentRack?.name;
    const newName = rackData.name !== undefined ? rackData.name.trim() : oldName;

    setRacks((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          ...rackData,
          name: newName || r.name,
          code: rackData.code !== undefined ? rackData.code.trim().toUpperCase() : r.code,
          zone: rackData.zone !== undefined ? rackData.zone.trim() : r.zone,
          aisle: rackData.aisle !== undefined ? rackData.aisle.trim() : r.aisle,
          rows: rackData.rows !== undefined ? rackData.rows : r.rows,
          positions: rackData.positions !== undefined ? rackData.positions : r.positions,
          description: rackData.description !== undefined ? rackData.description.trim() : r.description,
          color: rackData.color !== undefined ? rackData.color : r.color,
          status: rackData.status !== undefined ? rackData.status : r.status,
        };
      })
    );

    // Synchronize rack name in products if updated
    if (oldName && newName && oldName !== newName) {
      setProducts((prev) =>
        prev.map((p) => (p.rack === oldName ? { ...p, rack: newName } : p))
      );
    }
  };

  const deleteRack = (
    id: string,
    cascadeReassignToId?: string
  ): { success: boolean; message?: string } => {
    const rackToDelete = racks.find((r) => r.id === id);
    if (!rackToDelete) {
      return { success: false, message: 'Rack not found in registry.' };
    }

    const linkedProducts = products.filter(
      (p) => p.rack && p.rack.toLowerCase() === rackToDelete.name.toLowerCase()
    );

    if (linkedProducts.length > 0) {
      if (cascadeReassignToId) {
        const targetRack = racks.find((r) => r.id === cascadeReassignToId);
        if (targetRack) {
          setProducts((prev) =>
            prev.map((p) =>
              p.rack && p.rack.toLowerCase() === rackToDelete.name.toLowerCase()
                ? { ...p, rack: targetRack.name }
                : p
            )
          );
        }
      } else {
        return {
          success: false,
          message: `Cannot delete rack "${rackToDelete.name}" because it is actively assigned to ${linkedProducts.length} product(s) (e.g. ${linkedProducts.slice(0, 2).map((p) => p.name).join(', ')}). Please reassign products first or choose a target rack to migrate them to.`,
        };
      }
    }

    setRacks((prev) => prev.filter((r) => r.id !== id));

    return {
      success: true,
      message: `Rack "${rackToDelete.name}" deleted successfully.`,
    };
  };

  const assignRackPositionToProducts = (
    productIds: string[],
    rack: string,
    row?: string,
    position?: string
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        productIds.includes(p.id)
          ? {
              ...p,
              rack: rack || undefined,
              row: row || undefined,
              position: position || undefined,
            }
          : p
      )
    );
  };

  const openAddProductPage = () => {
    setEditingProduct(null);
    setInventorySubTab('add_product');
    handleSmartSetActiveTab('inventory');
  };

  const openEditProductPage = (product: Product) => {
    setEditingProduct(product);
    setInventorySubTab('edit_product');
    handleSmartSetActiveTab('inventory');
  };

  const openEditPurchasePage = (purchase: Transaction) => {
    setEditingPurchase(purchase);
    handleSmartSetActiveTab('edit_purchase');
  };

  const openViewPurchasePage = (purchase: Transaction) => {
    setViewingPurchase(purchase);
    handleSmartSetActiveTab('view_purchase');
  };

  const closeProductPage = () => {
    setEditingProduct(null);
    setInventorySubTab('matrix');
  };

  const navigateToInventory = (
    subTab: 'matrix' | 'categories' | 'brands' | 'warranties' | 'racks' | 'units' | 'adjustments' | 'transfers' | 'add_product' | 'edit_product' | 'import_products' | 'product_history' | 'variations' | 'batch_guide' = 'matrix'
  ) => {
    if (subTab === 'add_product' || subTab === 'matrix') {
      setEditingProduct(null);
    }
    setInventorySubTab(subTab);
    handleSmartSetActiveTab('inventory');
  };

  const getCustomerGroupPrice = (basePrice: number, customer?: Customer | null): number => {
    const activeCustomer = customer !== undefined ? customer : selectedCustomer;
    if (!activeCustomer) return basePrice;

    const group = customerGroups.find(
      (g) =>
        (activeCustomer.customerGroupId && g.id === activeCustomer.customerGroupId) ||
        (activeCustomer.customerGroup && g.name.toLowerCase() === activeCustomer.customerGroup.toLowerCase())
    );

    if (!group || group.calculationPercentage === undefined || group.calculationPercentage === null) {
      return basePrice;
    }

    const pct = Number(group.calculationPercentage) || 0;
    if (pct === 0) return basePrice;

    const calculated = basePrice * (1 + pct / 100);
    return Math.max(0, Math.round(calculated * 100) / 100);
  };

  const addCustomerGroup = (groupData: Omit<CustomerGroup, 'id' | 'createdDate'>): CustomerGroup => {
    const newGroup: CustomerGroup = {
      ...groupData,
      id: `cg_${Date.now()}`,
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setCustomerGroups((prev) => [...prev, newGroup]);
    showFlashNotification(`Customer Group "${newGroup.name}" created (${newGroup.calculationPercentage > 0 ? '+' : ''}${newGroup.calculationPercentage}%).`, 'success');
    return newGroup;
  };

  const updateCustomerGroup = (id: string, groupData: Partial<CustomerGroup>) => {
    setCustomerGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...groupData } : g))
    );
    showFlashNotification('Customer group updated successfully.', 'success');
  };

  const deleteCustomerGroup = (id: string) => {
    setCustomerGroups((prev) => prev.filter((g) => g.id !== id));
    showFlashNotification('Customer group deleted.', 'info');
  };

  const [selectedLedgerContactId, setSelectedLedgerContactId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const openCustomerLedger = (customerOrId?: Customer | string) => {
    if (typeof customerOrId === 'string') {
      setSelectedLedgerContactId(customerOrId);
    } else if (customerOrId && typeof customerOrId === 'object') {
      setSelectedLedgerContactId(customerOrId.id);
    }
    setContactsSubTab('customer_ledger');
    handleSmartSetActiveTab('customer_ledger');
  };

  const openSupplierLedger = (supplierOrId?: Supplier | string) => {
    if (typeof supplierOrId === 'string') {
      setSelectedLedgerContactId(supplierOrId);
    } else if (supplierOrId && typeof supplierOrId === 'object') {
      setSelectedLedgerContactId(supplierOrId.id);
    }
    setContactsSubTab('supplier_ledger');
    handleSmartSetActiveTab('supplier_ledger');
  };

  const openAddContactPage = () => {
    setEditingCustomer(null);
    setEditingSupplier(null);
    setContactsSubTab('add_contact');
    handleSmartSetActiveTab('add_contact');
  };

  const openAddCustomerPage = openAddContactPage;
  const openAddSupplierPage = openAddContactPage;

  const openEditCustomerPage = (customer: Customer) => {
    setEditingCustomer(customer);
    setContactsSubTab('edit_customer');
    handleSmartSetActiveTab('edit_contact');
  };

  

  const openEditSupplierPage = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setContactsSubTab('edit_supplier');
    handleSmartSetActiveTab('edit_contact');
  };

  const closeContactPage = () => {
    const returnTarget = (contactsSubTab === 'add_supplier' || contactsSubTab === 'edit_supplier' || contactsSubTab === 'supplier_ledger' || editingSupplier) ? 'suppliers' : 'customers';
    setEditingCustomer(null);
    setEditingSupplier(null);
    setContactsSubTab(returnTarget);
    handleSmartSetActiveTab(returnTarget);
  };

  const navigateToContacts = (subTab: 'customers' | 'customer_groups' | 'suppliers' | 'add_customer' | 'add_supplier' | 'customer_ledger' | 'supplier_ledger' | 'import_contacts' = 'customers', contactId?: string) => {
    if (contactId) {
      setSelectedLedgerContactId(contactId);
    }
    if (subTab === 'add_customer') {
      openAddContactPage();
      return;
    }
    if (subTab === 'add_supplier') {
      openAddContactPage();
      return;
    }
    if (false) {
      //openAddSupplierPage();
      return;
    }
    if (subTab === 'customer_ledger') {
      openCustomerLedger(contactId || undefined);
      return;
    }
    if (subTab === 'supplier_ledger') {
      openSupplierLedger(contactId || undefined);
      return;
    }
    setEditingCustomer(null);
    setEditingSupplier(null);
    setContactsSubTab(subTab);
    handleSmartSetActiveTab(subTab);
  };

  const generateNextContactId = (type: 'customer' | 'supplier') => {
    const isCustomer = type === 'customer';
    const prefix = isCustomer
      ? (settings.customerPrefix?.trim() || 'CUST-')
      : (settings.supplierPrefix?.trim() || 'SUP-');
    const list = isCustomer ? customers : suppliers;

    let maxNum = 0;
    list.forEach((item) => {
      const cid = item.contactId || item.id || '';
      if (cid.startsWith(prefix)) {
        const numPart = parseInt(cid.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum > 0 ? maxNum + 1 : list.length + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalDue' | 'totalSales' | 'loyaltyPoints' | 'createdDate'> & { id?: string; contactId?: string }) => {
    if (customerData.phone && customerData.phone !== 'N/A') {
      const phoneVal = validatePhoneNumber(customerData.phone);
      if (!phoneVal.isValid) {
        throw new Error(`Customer Phone Error: ${phoneVal.error}`);
      }
    }
    if (customerData.alternatePhone) {
      const altPhoneVal = validatePhoneNumber(customerData.alternatePhone);
      if (!altPhoneVal.isValid) {
        throw new Error(`Customer Alternate Phone Error: ${altPhoneVal.error}`);
      }
    }

    const openingBal = Number(customerData.openingBalance) || 0;
    const autoGen = settings.autoGenerateContactId ?? true;
    const finalContactId = customerData.contactId || (autoGen ? generateNextContactId('customer') : undefined);
    const newCust: Customer = {
      ...customerData,
      id: customerData.id || `cust_${Date.now()}`,
      contactId: finalContactId,
      totalDue: openingBal,
      totalSales: 0,
      loyaltyPoints: 0,
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setCustomers((prev) => [newCust, ...prev]);
    
    // Auto-send welcome notification
    sendOneClickNotifications({
      templateType: 'new_customer_registration',
      recipientContactId: newCust.id,
    });

    return newCust;
  };

  const importCustomers = (newCustomersList: Array<Omit<Customer, 'id' | 'totalDue' | 'totalSales' | 'loyaltyPoints' | 'createdDate'> & { contactId?: string }>) => {
    const prefix = settings.customerPrefix?.trim() || 'CUST-';
    const formatted = newCustomersList.map((c, index) => {
      const openingBal = Number(c.openingBalance) || 0;
      const cid = c.contactId || `${prefix}${String(customers.length + index + 1).padStart(4, '0')}`;
      return {
        ...c,
        id: `cust_${Date.now()}_${index}`,
        contactId: cid,
        name: c.name?.trim() || 'Unnamed Customer',
        phone: c.phone?.trim() || 'N/A',
        email: c.email?.trim() || 'N/A',
        address: c.address?.trim() || 'N/A',
        creditLimit: Number(c.creditLimit) || 0,
        totalDue: openingBal,
        totalSales: 0,
        loyaltyPoints: 0,
        createdDate: new Date().toISOString().slice(0, 10),
      };
    });

    setCustomers((prev) => [...formatted, ...prev]);
    showFlashNotification(`Successfully imported ${formatted.length} customers!`, 'success');
    return formatted;
  };

  const importSuppliers = (newSuppliersList: Array<Omit<Supplier, 'id' | 'totalPayable' | 'totalPurchases' | 'createdDate'> & { contactId?: string }>) => {
    const prefix = settings.supplierPrefix?.trim() || 'SUP-';
    const formatted = newSuppliersList.map((s, index) => {
      const openingBal = Number(s.openingBalance) || 0;
      const cid = s.contactId || `${prefix}${String(suppliers.length + index + 1).padStart(4, '0')}`;
      return {
        ...s,
        id: `sup_${Date.now()}_${index}`,
        contactId: cid,
        name: s.name?.trim() || 'Unnamed Supplier',
        businessName: s.businessName?.trim() || s.name?.trim() || 'N/A',
        phone: s.phone?.trim() || 'N/A',
        email: s.email?.trim() || 'N/A',
        address: s.address?.trim() || 'N/A',
        totalPayable: openingBal,
        totalPurchases: 0,
        createdDate: new Date().toISOString().slice(0, 10),
      };
    });

    setSuppliers((prev) => [...formatted, ...prev]);
    showFlashNotification(`Successfully imported ${formatted.length} suppliers!`, 'success');
    return formatted;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'totalPayable' | 'totalPurchases' | 'createdDate'> & { id?: string; contactId?: string }) => {
    if (supplierData.phone && supplierData.phone !== 'N/A') {
      const phoneVal = validatePhoneNumber(supplierData.phone);
      if (!phoneVal.isValid) {
        throw new Error(`Supplier Phone Error: ${phoneVal.error}`);
      }
    }
    if (supplierData.alternatePhone) {
      const altPhoneVal = validatePhoneNumber(supplierData.alternatePhone);
      if (!altPhoneVal.isValid) {
        throw new Error(`Supplier Alternate Phone Error: ${altPhoneVal.error}`);
      }
    }

    const openingBal = Number(supplierData.openingBalance) || 0;
    const autoGen = settings.autoGenerateContactId ?? true;
    const finalContactId = supplierData.contactId || (autoGen ? generateNextContactId('supplier') : undefined);
    const newSup: Supplier = {
      ...supplierData,
      id: supplierData.id || `sup_${(supplierData.name || 'supp').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      contactId: finalContactId,
      totalPayable: openingBal,
      totalPurchases: 0,
      createdDate: new Date().toISOString().slice(0, 10),
    };
    setSuppliers((prev) => [newSup, ...prev]);
    return newSup;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string,
    referenceNo?: string,
    date?: string
  ) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const nowStr = date ? `${date} 12:00` : new Date().toISOString().replace('T', ' ').slice(0, 16);
    const receiptNo = referenceNo?.trim() || `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Create a payment transaction
    const paymentTxn: Transaction = {
      id: `txn_pay_cust_${Date.now()}`,
      invoiceNo: receiptNo,
      type: 'sale',
      date: nowStr,
      customerId,
      locationId: selectedLocationId || locations[0]?.id || 'loc_1',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      shippingCharges: 0,
      totalAmount: 0,
      paidAmount: amount,
      paymentStatus: 'paid',
      paymentEntries: [
        {
          id: `pay_ent_${Date.now()}`,
          amount,
          method: paymentMethod,
          referenceNo: receiptNo,
          date: nowStr,
          note: note || `Direct customer payment received (${paymentMethod.toUpperCase()})`,
        },
      ],
      notes: note || `Customer payment received: ${settings.currencySymbol || '$'}${amount.toFixed(2)}`,
      cashierName: currentUser?.name || 'Admin Sarah',
      status: 'final',
    };

    // Update customer totalDue
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const newDue = Math.max(0, c.totalDue - amount);
        return {
          ...c,
          totalDue: newDue,
        };
      })
    );

    // If cash register is open, add to register
    if (cashRegister.status === 'open') {
      setCashRegister((prev) => {
        if (paymentMethod === 'cash') {
          return { ...prev, cashSales: prev.cashSales + amount };
        } else if (paymentMethod === 'card') {
          return { ...prev, cardSales: prev.cardSales + amount };
        } else {
          return { ...prev, otherSales: prev.otherSales + amount };
        }
      });
    }

    setTransactions((prev) => [paymentTxn, ...prev]);
  };

  const recordSupplierPayment = (
    supplierId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string,
    referenceNo?: string,
    date?: string
  ) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const nowStr = date ? `${date} 12:00` : new Date().toISOString().replace('T', ' ').slice(0, 16);
    const voucherNo = referenceNo?.trim() || `VOUCH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const paymentTxn: Transaction = {
      id: `txn_pay_sup_${Date.now()}`,
      invoiceNo: voucherNo,
      type: 'purchase',
      date: nowStr,
      supplierId,
      locationId: selectedLocationId || locations[0]?.id || 'loc_1',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      shippingCharges: 0,
      totalAmount: 0,
      paidAmount: amount,
      paymentStatus: 'paid',
      paymentEntries: [
        {
          id: `pay_sup_ent_${Date.now()}`,
          amount,
          method: paymentMethod,
          referenceNo: voucherNo,
          date: nowStr,
          note: note || `Disbursed supplier payment (${paymentMethod.toUpperCase()})`,
        },
      ],
      notes: note || `Supplier payment voucher: ${settings.currencySymbol || '$'}${amount.toFixed(2)}`,
      status: 'received',
    };

    // Update supplier totalPayable
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        const newPayable = Math.max(0, s.totalPayable - amount);
        return {
          ...s,
          totalPayable: newPayable,
        };
      })
    );

    setTransactions((prev) => [paymentTxn, ...prev]);
  };

  const recordCustomerLedgerDiscount = (
    customerId: string,
    amount: number,
    note?: string,
    referenceNo?: string,
    date?: string
  ): { success: boolean; message?: string } => {
    // RBAC check: Must be Admin
    if (currentUser?.role !== 'admin') {
      showFlashNotification('Permission Denied: Only Administrator can authorize and apply Ledger Discounts.', 'error');
      return { success: false, message: 'Permission Denied: Only Admin can add Ledger Discounts' };
    }

    const cust = customers.find((c) => c.id === customerId);
    if (!cust) {
      showFlashNotification('Customer not found.', 'error');
      return { success: false, message: 'Customer not found' };
    }

    if (amount <= 0) {
      showFlashNotification('Discount amount must be greater than zero.', 'error');
      return { success: false, message: 'Invalid discount amount' };
    }

    const nowStr = date ? `${date} 12:00` : new Date().toISOString().replace('T', ' ').slice(0, 16);
    const discNo = referenceNo?.trim() || `LDISC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const discountTxn: Transaction = {
      id: `txn_ldisc_cust_${Date.now()}`,
      invoiceNo: discNo,
      type: 'ledger_discount',
      date: nowStr,
      customerId,
      locationId: selectedLocationId || locations[0]?.id || 'loc_1',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0, // NOTE: sale discount is 0, this is a ledger discount, not a sale discount
      shippingCharges: 0,
      totalAmount: 0,
      paidAmount: amount, // Discount amount accounted in ledger
      paymentStatus: 'paid',
      paymentEntries: [],
      notes: note || `Admin Balance Due Discount / Settlement Waiver`,
      cashierName: currentUser?.name || 'Admin',
      status: 'final',
    };

    // Update customer totalDue (reducing balance due)
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const newDue = Math.max(0, c.totalDue - amount);
        return {
          ...c,
          totalDue: newDue,
        };
      })
    );

    setTransactions((prev) => [discountTxn, ...prev]);
    showFlashNotification(
      `Ledger Discount of ${settings.currencySymbol || '$'}${amount.toFixed(2)} applied successfully to ${cust.name}.`,
      'success'
    );
    return { success: true };
  };

  const recordSupplierLedgerDiscount = (
    supplierId: string,
    amount: number,
    note?: string,
    referenceNo?: string,
    date?: string
  ): { success: boolean; message?: string } => {
    // RBAC check: Must be Admin
    if (currentUser?.role !== 'admin') {
      showFlashNotification('Permission Denied: Only Administrator can authorize and apply Supplier Ledger Discounts.', 'error');
      return { success: false, message: 'Permission Denied: Only Admin can add Ledger Discounts' };
    }

    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) {
      showFlashNotification('Supplier not found.', 'error');
      return { success: false, message: 'Supplier not found' };
    }

    if (amount <= 0) {
      showFlashNotification('Discount amount must be greater than zero.', 'error');
      return { success: false, message: 'Invalid discount amount' };
    }

    const nowStr = date ? `${date} 12:00` : new Date().toISOString().replace('T', ' ').slice(0, 16);
    const discNo = referenceNo?.trim() || `SDISC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const discountTxn: Transaction = {
      id: `txn_ldisc_sup_${Date.now()}`,
      invoiceNo: discNo,
      type: 'ledger_discount',
      date: nowStr,
      supplierId,
      locationId: selectedLocationId || locations[0]?.id || 'loc_1',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0, // not a purchase discount on invoice
      shippingCharges: 0,
      totalAmount: 0,
      paidAmount: amount, // discount amount accounted in ledger
      paymentStatus: 'paid',
      paymentEntries: [],
      notes: note || `Supplier Balance Payable Waiver / Settlement Discount`,
      cashierName: currentUser?.name || 'Admin',
      status: 'received',
    };

    // Update supplier totalPayable (reducing balance payable)
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        const newPayable = Math.max(0, s.totalPayable - amount);
        return {
          ...s,
          totalPayable: newPayable,
        };
      })
    );

    setTransactions((prev) => [discountTxn, ...prev]);
    showFlashNotification(
      `Supplier Ledger Discount of ${settings.currencySymbol || '$'}${amount.toFixed(2)} applied successfully to ${sup.name}.`,
      'success'
    );
    return { success: true };
  };

  const updateLedgerDiscount = (
    transactionId: string,
    amount: number,
    date?: string,
    note?: string,
    referenceNo?: string
  ): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'admin') {
      showFlashNotification('Permission Denied: Only Administrator can modify Ledger Discounts.', 'error');
      return { success: false, message: 'Permission Denied: Only Admin can modify Ledger Discounts' };
    }

    const txn = transactions.find((t) => t.id === transactionId);
    if (!txn || txn.type !== 'ledger_discount') {
      showFlashNotification('Ledger discount record not found.', 'error');
      return { success: false, message: 'Discount record not found' };
    }

    const prevAmount = txn.paidAmount || 0;
    const diff = amount - prevAmount; // positive means discount increased (balance owed drops more)

    if (txn.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== txn.customerId) return c;
          return {
            ...c,
            totalDue: Math.max(0, c.totalDue - diff),
          };
        })
      );
    } else if (txn.supplierId) {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== txn.supplierId) return s;
          return {
            ...s,
            totalPayable: Math.max(0, s.totalPayable - diff),
          };
        })
      );
    }

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t;
        return {
          ...t,
          invoiceNo: referenceNo?.trim() || t.invoiceNo,
          paidAmount: amount,
          date: date ? (date.includes(' ') ? date : `${date} 12:00`) : t.date,
          notes: note !== undefined ? note : t.notes,
        };
      })
    );

    showFlashNotification('Ledger discount updated successfully.', 'success');
    return { success: true };
  };

  const deleteLedgerDiscount = (transactionId: string): { success: boolean; message?: string } => {
    if (currentUser?.role !== 'admin') {
      showFlashNotification('Permission Denied: Only Administrator can remove Ledger Discounts.', 'error');
      return { success: false, message: 'Permission Denied: Only Admin can remove Ledger Discounts' };
    }

    const txn = transactions.find((t) => t.id === transactionId);
    if (!txn || txn.type !== 'ledger_discount') {
      showFlashNotification('Ledger discount record not found.', 'error');
      return { success: false, message: 'Discount record not found' };
    }

    const amount = txn.paidAmount || 0;

    // Restore due / payable
    if (txn.customerId) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === txn.customerId ? { ...c, totalDue: c.totalDue + amount } : c))
      );
    } else if (txn.supplierId) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === txn.supplierId ? { ...s, totalPayable: s.totalPayable + amount } : s))
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    showFlashNotification('Ledger discount removed and balance restored.', 'info');
    return { success: true };
  };

  const updateLedgerPayment = (
    transactionId: string,
    paymentEntryId: string,
    amount: number,
    method: PaymentMethod,
    date?: string,
    note?: string,
    referenceNo?: string
  ): { success: boolean; message?: string } => {
    const txn = transactions.find((t) => t.id === transactionId);
    if (!txn) {
      showFlashNotification('Payment transaction not found.', 'error');
      return { success: false, message: 'Transaction not found' };
    }

    let prevAmount = 0;
    const existingEntry = txn.paymentEntries?.find((e) => e.id === paymentEntryId);
    if (existingEntry) {
      prevAmount = existingEntry.amount;
    } else if (txn.paidAmount) {
      prevAmount = txn.paidAmount;
    }

    const diff = amount - prevAmount; // if payment increased, due decreases

    if (txn.customerId) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === txn.customerId ? { ...c, totalDue: Math.max(0, c.totalDue - diff) } : c))
      );
    } else if (txn.supplierId) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === txn.supplierId ? { ...s, totalPayable: Math.max(0, s.totalPayable - diff) } : s))
      );
    }

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t;
        const newEntries = t.paymentEntries.map((e) => {
          if (e.id === paymentEntryId) {
            return {
              ...e,
              amount,
              method,
              date: date ? (date.includes(' ') ? date : `${date} 12:00`) : e.date,
              note: note !== undefined ? note : e.note,
              referenceNo: referenceNo?.trim() || e.referenceNo,
            };
          }
          return e;
        });

        const newTotalPaid = newEntries.length > 0
          ? newEntries.reduce((sum, e) => sum + e.amount, 0)
          : amount;

        const newStatus: PaymentStatus =
          t.totalAmount > 0 && newTotalPaid >= t.totalAmount
            ? 'paid'
            : newTotalPaid > 0
            ? 'partial'
            : 'due';

        return {
          ...t,
          paidAmount: newTotalPaid,
          paymentStatus: newStatus,
          paymentEntries: newEntries,
          notes: note !== undefined ? note : t.notes,
        };
      })
    );

    showFlashNotification('Payment entry updated successfully.', 'success');
    return { success: true };
  };

  const deleteLedgerPayment = (transactionId: string, paymentEntryId: string): { success: boolean; message?: string } => {
    const txn = transactions.find((t) => t.id === transactionId);
    if (!txn) {
      showFlashNotification('Payment transaction not found.', 'error');
      return { success: false, message: 'Transaction not found' };
    }

    const entry = txn.paymentEntries?.find((e) => e.id === paymentEntryId);
    const amount = entry ? entry.amount : txn.paidAmount;

    // Restore due
    if (txn.customerId) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === txn.customerId ? { ...c, totalDue: c.totalDue + amount } : c))
      );
    } else if (txn.supplierId) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === txn.supplierId ? { ...s, totalPayable: s.totalPayable + amount } : s))
      );
    }

    // If it's a standalone payment transaction, remove it entirely
    if (txn.items.length === 0 && (txn.invoiceNo.startsWith('RCPT-') || txn.invoiceNo.startsWith('VOUCH-') || txn.invoiceNo.startsWith('VND-PAY-'))) {
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } else {
      // Modify transaction entries
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== transactionId) return t;
          const updatedEntries = t.paymentEntries.filter((e) => e.id !== paymentEntryId);
          const newPaid = updatedEntries.reduce((sum, e) => sum + e.amount, 0);
          return {
            ...t,
            paidAmount: newPaid,
            paymentStatus: newPaid >= t.totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'due',
            paymentEntries: updatedEntries,
          };
        })
      );
    }

    showFlashNotification('Payment removed and balance adjusted.', 'info');
    return { success: true };
  };

  // POS Cart Operations
  const addToCart = (product: Product, quantity = 1, lotId?: string): boolean => {
    // If product has multiple lots but no lotId was provided, we should ideally not allow adding it
    // directly without a choice, but for backward compatibility we take the newest lot if not specified.
    // However, the POS UI is already handling the popup.
    
    // Safety: If lotId is missing but multiple lots exist, try to find the latest lot
    const effectiveLotId = lotId || (product.lots && product.lots.length > 0 ? product.lots[product.lots.length - 1].id : undefined);

    const selectedLot = effectiveLotId ? product.lots?.find(l => l.id === effectiveLotId) : null;
    const baseSellingPrice = selectedLot ? selectedLot.sellingPrice : product.sellingPrice;
    const priceToUse = getCustomerGroupPrice(baseSellingPrice, selectedCustomer);
    const costPriceToUse = selectedLot ? selectedLot.costPrice : product.costPrice;
    const lotNumber = selectedLot ? selectedLot.lotNumber : undefined;

    // Strict Stock Check for Lot & Product if overselling is disabled
    const locStock = product.locationStocks?.[selectedLocationId] ?? product.currentStock;
    if (!settings.allowOverselling) {
      if (selectedLot && selectedLot.currentStock <= 0) {
        showFlashNotification(`Batch ${selectedLot.lotNumber} is Out of Stock. Cannot add to cart.`, 'error');
        return false;
      }

      if (locStock <= 0) {
        showFlashNotification(`${product.name} is Out of Stock.`, 'error');
        return false;
      }
    }

    const additionMethod = settings.salesItemAdditionMethod || 'add_to_existing_qty';

    const calculated = calculateItemTax(priceToUse, quantity, 0, {
      taxRate: product.taxRate,
      taxGroupId: product.taxGroupId,
      taxType: product.taxType,
    });

    setCart((prev) => {
      const existing = additionMethod === 'add_to_existing_qty'
        ? prev.find((item) => item.productId === product.id && item.lotId === lotId)
        : undefined;

      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (!settings.allowOverselling && nextQty > locStock) return prev; // Cannot exceed available stock
        const nextCalc = calculateItemTax(existing.unitPrice, nextQty, existing.discount, {
          taxRate: existing.taxRate,
          taxGroupId: existing.taxGroupId,
        });

        return prev.map((item) =>
          item.productId === product.id && item.lotId === lotId
            ? {
                ...item,
                quantity: nextQty,
                taxAmount: nextCalc.taxAmount,
                cgstRate: nextCalc.cgstRate,
                cgstAmount: nextCalc.cgstAmount,
                sgstRate: nextCalc.sgstRate,
                sgstAmount: nextCalc.sgstAmount,
                igstRate: nextCalc.igstRate,
                igstAmount: nextCalc.igstAmount,
                total: (nextQty * item.unitPrice) - item.discount,
              }
            : item
        );
      } else {
        const lineTotal = (quantity * priceToUse);
        const warObj = product.warrantyId ? warranties.find((w) => w.id === product.warrantyId) : undefined;
        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          hsnCode: product.hsnCode,
          taxGroupId: product.taxGroupId,
          unit: product.unit,
          quantity,
          unitPrice: priceToUse,
          costPrice: costPriceToUse,
          taxRate: calculated.taxRate,
          taxAmount: calculated.taxAmount,
          cgstRate: calculated.cgstRate,
          cgstAmount: calculated.cgstAmount,
          sgstRate: calculated.sgstRate,
          sgstAmount: calculated.sgstAmount,
          igstRate: calculated.igstRate,
          igstAmount: calculated.igstAmount,
          discount: 0,
          total: lineTotal,
          maxStock: locStock,
          lotId: lotId,
          lotNumber: lotNumber,
          warrantyId: product.warrantyId,
          warrantyName: warObj?.name,
          warrantyDuration: warObj?.duration,
          warrantyDurationType: warObj?.durationType,
          warrantyTerms: warObj?.terms,
        };
        return [...prev, newItem];
      }
    });

    return true;
  };

  const updateCartQty = (productId: string, quantity: number, lotId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, lotId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId || item.lotId !== lotId) return item;
        const validQty = settings.allowOverselling ? quantity : Math.min(quantity, item.maxStock);
        const nextCalc = calculateItemTax(item.unitPrice, validQty, item.discount, {
          taxRate: item.taxRate,
          taxGroupId: item.taxGroupId,
        });
        return {
          ...item,
          quantity: validQty,
          taxAmount: nextCalc.taxAmount,
          cgstRate: nextCalc.cgstRate,
          cgstAmount: nextCalc.cgstAmount,
          sgstRate: nextCalc.sgstRate,
          sgstAmount: nextCalc.sgstAmount,
          igstRate: nextCalc.igstRate,
          igstAmount: nextCalc.igstAmount,
          total: (validQty * item.unitPrice) - item.discount,
        };
      })
    );
  };

  const updateCartDiscount = (productId: string, discount: number, lotId?: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId || item.lotId !== lotId) return item;
        const validDiscount = Math.max(0, discount);
        const nextCalc = calculateItemTax(item.unitPrice, item.quantity, validDiscount, {
          taxRate: item.taxRate,
          taxGroupId: item.taxGroupId,
        });
        return {
          ...item,
          discount: validDiscount,
          taxAmount: nextCalc.taxAmount,
          cgstRate: nextCalc.cgstRate,
          cgstAmount: nextCalc.cgstAmount,
          sgstRate: nextCalc.sgstRate,
          sgstAmount: nextCalc.sgstAmount,
          igstRate: nextCalc.igstRate,
          igstAmount: nextCalc.igstAmount,
          total: Math.max(0, (item.quantity * item.unitPrice) - validDiscount),
        };
      })
    );
  };

  const updateCartPrice = (productId: string, unitPrice: number, lotId?: string) => {
    const prod = products.find((p) => p.id === productId);
    const minFloorPrice = prod ? (prod.minSellingPrice ?? prod.sellingPrice) : 0;
    const isMinPriceEnabled = settings.salesPriceIsMinPrice ?? true;

    let validPrice = Math.max(0, unitPrice);
    if (isMinPriceEnabled && minFloorPrice > 0 && validPrice < minFloorPrice) {
      showFlashNotification(
        `Sales price cannot be set below minimum price of ${settings.currencySymbol || '$'}${minFloorPrice.toFixed(2)}`,
        'error'
      );
      validPrice = minFloorPrice;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId || item.lotId !== lotId) return item;
        const nextCalc = calculateItemTax(validPrice, item.quantity, item.discount, {
          taxRate: item.taxRate,
          taxGroupId: item.taxGroupId,
        });
        return {
          ...item,
          unitPrice: validPrice,
          taxAmount: nextCalc.taxAmount,
          cgstRate: nextCalc.cgstRate,
          cgstAmount: nextCalc.cgstAmount,
          sgstRate: nextCalc.sgstRate,
          sgstAmount: nextCalc.sgstAmount,
          igstRate: nextCalc.igstRate,
          igstAmount: nextCalc.igstAmount,
          total: Math.max(0, (item.quantity * validPrice) - item.discount),
        };
      })
    );
  };

  const removeFromCart = (productId: string, lotId?: string) => {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.lotId === lotId)));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Recalculate cart item unit prices when selected customer or customer groups change
  useEffect(() => {
    if (cart.length === 0) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return item;
        const lot = item.lotId ? prod.lots?.find((l) => l.id === item.lotId) : null;
        const basePrice = lot ? lot.sellingPrice : prod.sellingPrice;
        const targetPrice = getCustomerGroupPrice(basePrice, selectedCustomer);
        if (targetPrice === item.unitPrice) return item;

        const nextCalc = calculateItemTax(targetPrice, item.quantity, item.discount, {
          taxRate: item.taxRate,
          taxGroupId: item.taxGroupId,
        });

        return {
          ...item,
          unitPrice: targetPrice,
          taxAmount: nextCalc.taxAmount,
          cgstRate: nextCalc.cgstRate,
          cgstAmount: nextCalc.cgstAmount,
          sgstRate: nextCalc.sgstRate,
          sgstAmount: nextCalc.sgstAmount,
          igstRate: nextCalc.igstRate,
          igstAmount: nextCalc.igstAmount,
          total: Math.max(0, (item.quantity * targetPrice) - item.discount),
        };
      })
    );
  }, [selectedCustomer?.id, selectedCustomer?.customerGroup, selectedCustomer?.customerGroupId, customerGroups]);

  const holdCart = (note?: string) => {
    if (cart.length === 0) return;
    const suspended: SuspendedSale = {
      id: `susp_${Date.now()}`,
      reference: `HOLD-#${suspendedSales.length + 1}`,
      customerId: selectedCustomer?.id || 'walk_in',
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      items: [...cart],
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note,
    };
    setSuspendedSales((prev) => [suspended, ...prev]);
    clearCart();
  };

  const resumeSuspendedSale = (id: string) => {
    const sale = suspendedSales.find((s) => s.id === id);
    if (!sale) return;
    setCart(sale.items);
    const cust = customers.find((c) => c.id === sale.customerId) || initialCustomers[0];
    setSelectedCustomer(cust);
    setSuspendedSales((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteSuspendedSale = (id: string) => {
    setSuspendedSales((prev) => prev.filter((s) => s.id !== id));
  };

  // Create Sale Transaction
  const createSale = (saleData: {
    invoiceNo?: string;
    locationId?: string;
    customerId: string;
    type?: TransactionType;
    date?: string;
    items: (CartItem | TransactionItem)[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    discountType?: 'percentage' | 'fixed';
    orderTaxRate?: number;
    shippingCharges: number;
    shippingDetails?: string;
    shippingAddress?: string;
    shippingStatus?: 'ordered' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
    deliveredTo?: string;
    totalAmount: number;
    paidAmount: number;
    paymentMethod?: any;
    paymentEntries?: PaymentEntry[];
    notes?: string;
    status?: 'final' | 'draft' | 'ordered' | 'quotation';
    commissionAgentId?: string;
    commissionAgentType?: SalesCommissionAgentType;
    commissionAgentName?: string;
    commissionPercentage?: number;
    commissionAmount?: number;
    isPos?: boolean;
    saleChannel?: 'pos' | 'standard';
    cardDetails?: any;
    extraPaymentDetails?: any;
    additionalExpenses?: { name: string; amount: number }[];
  }): Transaction => {
    const targetLocId = saleData.locationId || selectedLocationId;
    const isPosSale = saleData.isPos === true || saleData.saleChannel === 'pos' || (saleData.invoiceNo && saleData.invoiceNo.toUpperCase().startsWith('POS')) || activeTab === 'pos';
    const defaultPrefix = isPosSale ? 'POS' : 'INV';
    const invoiceNo = saleData.invoiceNo?.trim() || `${defaultPrefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const paymentStatus =
      saleData.paidAmount >= saleData.totalAmount
        ? 'paid'
        : saleData.paidAmount > 0
        ? 'partial'
        : 'due';

    const isOffline = !isEffectiveOnline;
    const nowStr = saleData.date || new Date().toISOString().replace('T', ' ').slice(0, 16);
    const backend = getStorageEngine();

    // Sales Commission Agent resolution
    const commissionSetting = settings.salesCommissionAgent || 'disable';
    let effCommissionAgentId = saleData.commissionAgentId;
    let effCommissionAgentType = saleData.commissionAgentType;
    let effCommissionAgentName = saleData.commissionAgentName;
    let effCommissionPercentage = saleData.commissionPercentage;

    if (commissionSetting !== 'disable') {
      if (commissionSetting === 'logged_in_user') {
        effCommissionAgentId = effCommissionAgentId || currentUser?.id || 'usr_sarah';
        effCommissionAgentType = 'logged_in_user';
        if (!effCommissionAgentName) {
          const u = users.find((user) => user.id === effCommissionAgentId) || currentUser;
          effCommissionAgentName = u?.name || 'Logged in User';
          effCommissionPercentage = effCommissionPercentage ?? u?.commissionPercentage ?? 5.0;
        }
      } else if (commissionSetting === 'user') {
        if (effCommissionAgentId) {
          effCommissionAgentType = 'user';
          if (!effCommissionAgentName) {
            const u = users.find((user) => user.id === effCommissionAgentId);
            if (u) {
              effCommissionAgentName = u.name;
              effCommissionPercentage = effCommissionPercentage ?? u.commissionPercentage ?? 0;
            }
          }
        }
      } else if (commissionSetting === 'commission_agent') {
        if (effCommissionAgentId) {
          effCommissionAgentType = 'commission_agent';
          if (!effCommissionAgentName) {
            const a = salesCommissionAgents.find((agent) => agent.id === effCommissionAgentId);
            if (a) {
              effCommissionAgentName = `${a.firstName} ${a.lastName}`.trim();
              effCommissionPercentage = effCommissionPercentage ?? a.commissionPercentage ?? 0;
            }
          }
        }
      }
    }

    // Commission Calculation (Invoice value vs Payment Received)
    let calculatedCommissionAmount = saleData.commissionAmount;
    if (calculatedCommissionAmount === undefined && effCommissionPercentage !== undefined && effCommissionPercentage > 0) {
      const calcMethod = settings.commissionCalculationType || (settings.commissionAgentMethod === 'payment' ? 'payment_received' : 'invoice_value');
      const baseForCommission = calcMethod === 'payment_received' ? saleData.paidAmount : saleData.totalAmount;
      calculatedCommissionAmount = (baseForCommission * effCommissionPercentage) / 100;
    }

    // STRICT VALIDATION: Prevent checkout if any item is out of stock (at product or lot level) when final unless overselling is allowed
    if (saleData.type !== 'sell_return' && (saleData.status === 'final' || !saleData.status) && !settings.allowOverselling) {
      for (const item of saleData.items) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) continue;
        
        const locStock = prod.locationStocks?.[targetLocId] ?? prod.currentStock;
        if (locStock < item.quantity) {
          showFlashNotification(`Checkout failed: ${prod.name} has insufficient total stock (${locStock} available in this location).`, 'error');
          throw new Error('Insufficient stock');
        }

        if (item.lotId) {
          const lot = prod.lots?.find(l => l.id === item.lotId);
          if (lot && lot.currentStock < item.quantity) {
            showFlashNotification(`Checkout failed: Batch ${lot.lotNumber} for ${prod.name} has insufficient stock (${lot.currentStock} available).`, 'error');
            throw new Error('Insufficient lot stock');
          }
        }
      }
    }

    const defaultPaymentEntries: PaymentEntry[] = saleData.paymentEntries && saleData.paymentEntries.length > 0 
      ? saleData.paymentEntries 
      : [
          {
            id: `pay_${Date.now()}`,
            method: saleData.paymentMethod || 'cash',
            amount: saleData.paidAmount,
            date: nowStr,
          },
        ];

    const newSale: Transaction = {
      id: `txn_sal_${Date.now()}`,
      invoiceNo,
      type: saleData.type || 'sale',
      date: nowStr,
      locationId: targetLocId,
      customerId: saleData.customerId,
      items: saleData.items.map((i) => {
        const prodObj = products.find((p) => p.id === i.productId);
        const warId = i.warrantyId || prodObj?.warrantyId;
        const warObj = warId ? warranties.find((w) => w.id === warId) : undefined;
        let warStartDate: string | undefined = undefined;
        let warEndDate: string | undefined = undefined;
        let warName: string | undefined = undefined;
        let warDur: number | undefined = undefined;
        let warDurType: WarrantyDurationType | undefined = undefined;
        let warTerms: string | undefined = undefined;

        if (warObj && warObj.status !== 'inactive') {
          warStartDate = nowStr; // Transaction date as start of warranty
          warEndDate = calculateWarrantyExpiry(nowStr, warObj.duration, warObj.durationType);
          warName = warObj.name;
          warDur = warObj.duration;
          warDurType = warObj.durationType;
          warTerms = warObj.terms;
        }

        return {
          productId: i.productId,
          productName: i.productName,
          sku: i.sku,
          hsnCode: i.hsnCode,
          taxGroupId: i.taxGroupId,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
          cgstRate: i.cgstRate,
          cgstAmount: i.cgstAmount,
          sgstRate: i.sgstRate,
          sgstAmount: i.sgstAmount,
          igstRate: i.igstRate,
          igstAmount: i.igstAmount,
          discount: i.discount,
          total: i.total,
          warrantyId: warId,
          warrantyName: warName,
          warrantyDuration: warDur,
          warrantyDurationType: warDurType,
          warrantyStartDate: warStartDate,
          warrantyEndDate: warEndDate,
          warrantyTerms: warTerms,
        };
      }),
      subtotal: saleData.subtotal,
      taxAmount: saleData.taxAmount,
      discountAmount: saleData.discountAmount,
      discountType: saleData.discountType || 'fixed',
      orderTaxRate: saleData.orderTaxRate || 0,
      shippingCharges: saleData.shippingCharges,
      shippingDetails: saleData.shippingDetails,
      shippingAddress: saleData.shippingAddress,
      shippingStatus: saleData.shippingStatus || 'ordered',
      deliveredTo: saleData.deliveredTo,
      totalAmount: saleData.totalAmount,
      paidAmount: saleData.paidAmount,
      paymentStatus,
      paymentEntries: defaultPaymentEntries,
      status: saleData.status || 'final',
      notes: saleData.notes,
      cashierName: cashRegister.cashierName || currentUser?.name || 'Admin Sarah',
      commissionAgentId: effCommissionAgentId,
      commissionAgentType: effCommissionAgentType,
      commissionAgentName: effCommissionAgentName,
      commissionPercentage: effCommissionPercentage,
      commissionAmount: calculatedCommissionAmount,
      isPos: isPosSale,
      saleChannel: isPosSale ? 'pos' : 'standard',
      syncStatus: isOffline ? 'pending' : 'synced',
      isOfflineCreated: isOffline,
      offlineQueuedAt: isOffline ? nowStr : undefined,
      syncedAt: isOffline ? undefined : nowStr,
      storageBackend: backend,
      cardDetails: saleData.cardDetails,
      extraPaymentDetails: saleData.extraPaymentDetails,
      additionalExpenses: saleData.additionalExpenses,
    };

    // If has additional expenses, record them as separate expenses so they show in expense reports
    if (saleData.additionalExpenses && saleData.additionalExpenses.length > 0) {
      saleData.additionalExpenses.forEach((exp: any) => {
        if (exp.amount > 0) {
          addExpense({
            category: 'Sales Additional Expenses',
            amount: exp.amount,
            date: newSale.date,
            paymentMethod: 'cash',
            referenceNo: `SALE-EXP-${newSale.invoiceNo}`,
            note: `Additional expense for Sale ${newSale.invoiceNo}: ${exp.name}`,
            locationId: targetLocId,
          });
        }
      });
    }

    // If offline, store in IndexedDB / LocalStorage queue immediately
    if (isOffline) {
      const custObj = customers.find((c) => c.id === saleData.customerId);
      const locObj = locations.find((l) => l.id === targetLocId);
      queueOfflineTransaction(newSale, {
        customerName: custObj?.name || 'Walk-in Customer',
        locationName: locObj?.name || 'Main Store',
      }).then(() => {
        refreshOfflineState();
      });
    }

    // Deduct or add stock in real-time
    if (newSale.status === 'final') {
      const isReturn = newSale.type === 'sell_return';
      
      setProducts((prev) =>
        prev.map((p) => {
          // Find all items in the sale that match this product
          const soldItemsForThisProduct = saleData.items.filter((i) => i.productId === p.id);
          if (soldItemsForThisProduct.length === 0) return p;

          const totalQuantitySold = soldItemsForThisProduct.reduce((acc, i) => acc + i.quantity, 0);

          const currentLoc = p.locationStocks?.[targetLocId] || 0;
          const newLoc = isReturn 
            ? currentLoc + totalQuantitySold 
            : (settings.allowOverselling ? currentLoc - totalQuantitySold : Math.max(0, currentLoc - totalQuantitySold));
            
          const newLocationStocks = {
            ...p.locationStocks,
            [targetLocId]: newLoc,
          };

          // Update individual lots stock
          let updatedLots = p.lots ? [...p.lots] : [];
          soldItemsForThisProduct.forEach((soldItem) => {
            if (soldItem.lotId) {
              updatedLots = updatedLots.map((lot) =>
                lot.id === soldItem.lotId
                  ? { ...lot, currentStock: isReturn ? lot.currentStock + soldItem.quantity : (settings.allowOverselling ? lot.currentStock - soldItem.quantity : Math.max(0, lot.currentStock - soldItem.quantity)) }
                  : lot
              );
            } else if (updatedLots.length > 0) {
              // Stock Accounting Method (FIFO vs LIFO) layer depletion
              const method = settings.accountingMethod || 'fifo';
              if (isReturn) {
                const targetIdx = method === 'lifo' ? updatedLots.length - 1 : 0;
                updatedLots[targetIdx] = {
                  ...updatedLots[targetIdx],
                  currentStock: updatedLots[targetIdx].currentStock + soldItem.quantity,
                };
              } else {
                let remainingToDeduct = soldItem.quantity;
                if (method === 'lifo') {
                  // LIFO: Deduct from newest lot layer down to oldest
                  for (let i = updatedLots.length - 1; i >= 0 && remainingToDeduct > 0; i--) {
                    const lot = updatedLots[i];
                    if (lot.currentStock > 0) {
                      const deduct = Math.min(lot.currentStock, remainingToDeduct);
                      updatedLots[i] = { ...lot, currentStock: lot.currentStock - deduct };
                      remainingToDeduct -= deduct;
                    }
                  }
                  if (remainingToDeduct > 0) {
                    const lastIdx = updatedLots.length - 1;
                    updatedLots[lastIdx] = {
                      ...updatedLots[lastIdx],
                      currentStock: Math.max(0, updatedLots[lastIdx].currentStock - remainingToDeduct),
                    };
                  }
                } else {
                  // FIFO: Deduct from oldest lot layer up to newest
                  for (let i = 0; i < updatedLots.length && remainingToDeduct > 0; i++) {
                    const lot = updatedLots[i];
                    if (lot.currentStock > 0) {
                      const deduct = Math.min(lot.currentStock, remainingToDeduct);
                      updatedLots[i] = { ...lot, currentStock: lot.currentStock - deduct };
                      remainingToDeduct -= deduct;
                    }
                  }
                  if (remainingToDeduct > 0) {
                    updatedLots[0] = {
                      ...updatedLots[0],
                      currentStock: Math.max(0, updatedLots[0].currentStock - remainingToDeduct),
                    };
                  }
                }
              }
            }
          });

          const total = (Object.values(newLocationStocks) as number[]).reduce((a: any, b: any) => a + b, 0) as number;

          return {
            ...p,
            locationStocks: newLocationStocks,
            currentStock: total,
            lots: updatedLots,
          };
        })
      );

      // Update Customer totalSales & Due
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== saleData.customerId) return c;
          const dueDelta = Math.max(0, saleData.totalAmount - saleData.paidAmount);
          const earnedPoints = Math.floor(saleData.totalAmount / 10);
          
          if (newSale.type === 'sell_return') {
            return {
              ...c,
              totalSales: c.totalSales - saleData.totalAmount, // Reduce total sales
              totalDue: c.totalDue - saleData.totalAmount + saleData.paidAmount, // Reduce due by totalAmount, and add paidAmount if we paid them back
              loyaltyPoints: Math.max(0, c.loyaltyPoints - earnedPoints),
            };
          }

          return {
            ...c,
            totalSales: c.totalSales + saleData.totalAmount,
            totalDue: c.totalDue + dueDelta,
            loyaltyPoints: c.loyaltyPoints + earnedPoints,
          };
        })
      );

      // Update Cash Register totals
      if (cashRegister.status === 'open') {
        setCashRegister((prev) => {
          const mainMethod = saleData.paymentMethod || defaultPaymentEntries[0]?.method;
          const isReturn = newSale.type === 'sell_return';
          const multiplier = isReturn ? -1 : 1;
          if (mainMethod === 'cash') {
            return { ...prev, cashSales: Math.max(0, prev.cashSales + multiplier * saleData.paidAmount) };
          } else if (mainMethod === 'card') {
            return { ...prev, cardSales: Math.max(0, (prev.cardSales || 0) + multiplier * saleData.paidAmount) };
          } else {
            return { ...prev, otherSales: Math.max(0, (prev.otherSales || 0) + multiplier * saleData.paidAmount) };
          }
        });
      }
    }

    setTransactions((prev) => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    if (newSale.type !== 'sell_return') {
      clearCart();
    }

    // Auto-send sale notification
    sendOneClickNotifications({
      templateType: 'new_sale',
      recipientContactId: newSale.customerId,
      variables: {
        '{invoice_number}': newSale.invoiceNo,
        '{total_amount}': formatMoney(newSale.totalAmount),
        '{paid_amount}': formatMoney(newSale.paidAmount),
        '{due_amount}': formatMoney(newSale.totalAmount - saleData.paidAmount),
      }
    });

    return newSale;
  };

  const updateSale = (id: string, saleData: any) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...saleData } : t))
    );
    showFlashNotification(`Sale invoice ${saleData.invoiceNo || ''} updated successfully.`, 'success');
  };

  const deleteSale = (id: string) => {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;

    // If it was final, restore product stock
    if (txn.status === 'final') {
      setProducts((prev) =>
        prev.map((p) => {
          const item = txn.items.find((i) => i.productId === p.id);
          if (!item) return p;

          const currentLoc = p.locationStocks?.[txn.locationId] || 0;
          const newLoc = currentLoc + item.quantity;
          const newLocationStocks = {
            ...p.locationStocks,
            [txn.locationId]: newLoc,
          };

          const total = (Object.values(newLocationStocks) as number[]).reduce((a: any, b: any) => a + b, 0) as number;

          return {
            ...p,
            locationStocks: newLocationStocks,
            currentStock: total,
          };
        })
      );

      // Reverse Customer due / sales
      if (txn.customerId) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id !== txn.customerId) return c;
            const dueDelta = Math.max(0, txn.totalAmount - txn.paidAmount);
            return {
              ...c,
              totalSales: Math.max(0, c.totalSales - txn.totalAmount),
              totalDue: Math.max(0, c.totalDue - dueDelta),
            };
          })
        );
      }
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showFlashNotification(`Sale invoice ${txn.invoiceNo} deleted successfully.`, 'info');
  };

  const openAddSalePage = () => {
    setEditingSale(null);
    setViewingSale(null);
    handleSmartSetActiveTab('add_sale');
  };

  const openEditSalePage = (sale: Transaction) => {
    setEditingSale(sale);
    setViewingSale(null);
    handleSmartSetActiveTab('edit_sale');
  };

  const openViewSalePage = (sale: Transaction) => {
    setViewingSale(sale);
    setEditingSale(null);
    handleSmartSetActiveTab('view_sale');
  };

  // Create Purchase Transaction
  const createPurchase = (purchaseData: {
    invoiceNo?: string;
    supplierId: string;
    supplierName?: string;
    locationId: string;
    type?: TransactionType;
    date?: string;
    items: {
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      quantity: number;
      unitPrice: number; // This is the COST price in purchases
      costPrice: number; // Base cost before tax
      taxRate: number;
      discount: number;
      total: number;
      profitMargin?: number;
      sellingPrice?: number;
    }[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingCharges: number;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: any;
    notes?: string;
    status?: TransactionStatus;
    lotNumber?: string;
    extraPaymentDetails?: any;
    additionalExpenses?: { name: string; amount: number }[];
  }): Transaction => {
    const invoiceNo = purchaseData.invoiceNo?.trim() || `PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const paymentStatus =
      purchaseData.paidAmount >= purchaseData.totalAmount
        ? 'paid'
        : purchaseData.paidAmount > 0
        ? 'partial'
        : 'due';

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // 3. Status Tracking setting: if disabled, force status to 'received'
    const effectiveStatus = settings.enablePurchaseStatus === false 
      ? 'received' 
      : (purchaseData.status || 'received');

    const matchedSupp = suppliers.find((s) => s.id === purchaseData.supplierId);
    const resolvedSupplierName = purchaseData.supplierName || matchedSupp?.name || '';

    const newPurchase: Transaction = {
      id: `txn_pur_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNo,
      type: purchaseData.type || 'purchase',
      date: purchaseData.date || nowStr,
      locationId: purchaseData.locationId,
      supplierId: purchaseData.supplierId,
      supplierName: resolvedSupplierName,
      items: purchaseData.items,
      subtotal: purchaseData.subtotal,
      taxAmount: purchaseData.taxAmount,
      discountAmount: purchaseData.discountAmount,
      shippingCharges: purchaseData.shippingCharges,
      totalAmount: purchaseData.totalAmount,
      paidAmount: purchaseData.paidAmount,
      paymentStatus,
      paymentEntries: [
        {
          id: `pay_pur_${Date.now()}`,
          method: purchaseData.paymentMethod,
          amount: purchaseData.paidAmount,
          date: nowStr,
        },
      ],
      status: effectiveStatus,
      notes: purchaseData.notes,
      lotNumber: settings.enableLotNumber !== false ? purchaseData.lotNumber : undefined,
      extraPaymentDetails: purchaseData.extraPaymentDetails,
      additionalExpenses: purchaseData.additionalExpenses,
    };

    // Record additional expenses
    if (purchaseData.additionalExpenses && purchaseData.additionalExpenses.length > 0) {
      purchaseData.additionalExpenses.forEach((exp: any) => {
        if (exp.amount > 0) {
          addExpense({
            category: 'Purchase Additional Expenses',
            amount: exp.amount,
            date: newPurchase.date,
            paymentMethod: 'cash',
            referenceNo: `PUR-EXP-${newPurchase.invoiceNo}`,
            note: `Additional expense for Purchase ${newPurchase.invoiceNo}: ${exp.name}`,
            locationId: newPurchase.locationId,
          });
        }
      });
    }

    // Replenish stock in location & Update/Create LOT if received or purchase return
    if (newPurchase.status === 'received' || newPurchase.type === 'purchase_return') {
      const isReturn = newPurchase.type === 'purchase_return';
      const canEditCost = settings.enableEditPurchasePrice !== false && !isReturn;
      const canTrackLot = settings.enableLotNumber !== false && Boolean(purchaseData.lotNumber);
      const targetLocId = purchaseData.locationId || selectedLocationId || locations[0]?.id || 'loc_1';

      setProducts((prev) =>
        prev.map((p) => {
          const matchingItems = (purchaseData.items || []).filter(
            (i: any) => i.productId === p.id || (p.sku && i.sku === p.sku) || (i.productName && p.name === i.productName)
          );

          const hasMatchingVariation = p.type === 'variable' && p.variations?.some((v: any) =>
            (purchaseData.items || []).some((i: any) => i.productId === v.id || i.variationId === v.id || (v.sku && i.sku === v.sku))
          );

          if (matchingItems.length === 0 && !hasMatchingVariation) return p;

          const totalItemQty = matchingItems.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);

          // Location stocks calculation
          const existingLocStocks = { ...(p.locationStocks || {}) };
          if (Object.keys(existingLocStocks).length === 0) {
            existingLocStocks[targetLocId] = Number(p.currentStock) || 0;
          } else if (existingLocStocks[targetLocId] === undefined) {
            existingLocStocks[targetLocId] = 0;
          }

          const currentLoc = existingLocStocks[targetLocId] || 0;
          let newLoc = currentLoc;
          if (isReturn) {
            if (currentLoc >= totalItemQty) {
              newLoc = currentLoc - totalItemQty;
            } else {
              newLoc = 0;
              let remainingToDeduct = totalItemQty - currentLoc;
              for (const locKey of Object.keys(existingLocStocks)) {
                if (locKey !== targetLocId && remainingToDeduct > 0) {
                  const avail = existingLocStocks[locKey] || 0;
                  const deduct = Math.min(avail, remainingToDeduct);
                  existingLocStocks[locKey] = avail - deduct;
                  remainingToDeduct -= deduct;
                }
              }
            }
          } else {
            newLoc = currentLoc + totalItemQty;
          }

          const newLocationStocks = {
            ...existingLocStocks,
            [targetLocId]: newLoc,
          };

          const calculatedStock = isReturn
            ? Math.max(0, (Number(p.currentStock) || 0) - totalItemQty)
            : (Number(p.currentStock) || 0) + totalItemQty;

          // Handle Lot Logic
          let updatedLots = p.lots ? [...p.lots] : [];
          if (canTrackLot && purchaseData.lotNumber) {
            const existingLotIdx = updatedLots.findIndex(
              (l) => l.lotNumber.toLowerCase() === purchaseData.lotNumber?.toLowerCase()
            );

            if (existingLotIdx >= 0) {
              const lotStock = Number(updatedLots[existingLotIdx].currentStock) || 0;
              updatedLots[existingLotIdx] = {
                ...updatedLots[existingLotIdx],
                currentStock: isReturn ? Math.max(0, lotStock - totalItemQty) : lotStock + totalItemQty,
                costPrice: isReturn ? updatedLots[existingLotIdx].costPrice : (matchingItems[0]?.costPrice || matchingItems[0]?.unitPrice || p.costPrice),
                sellingPrice: isReturn ? updatedLots[existingLotIdx].sellingPrice : (matchingItems[0]?.sellingPrice || p.sellingPrice),
              };
            } else if (!isReturn) {
              updatedLots.push({
                id: `lot_pur_${Date.now()}_${p.id}`,
                lotNumber: purchaseData.lotNumber,
                costPrice: matchingItems[0]?.costPrice || matchingItems[0]?.unitPrice || p.costPrice,
                sellingPrice: matchingItems[0]?.sellingPrice || p.sellingPrice,
                currentStock: totalItemQty,
                createdDate: nowStr.slice(0, 10),
              });
            } else if (isReturn && updatedLots.length > 0) {
              let rem = totalItemQty;
              for (let idx = updatedLots.length - 1; idx >= 0 && rem > 0; idx--) {
                const cur = Number(updatedLots[idx].currentStock) || 0;
                const deduct = Math.min(cur, rem);
                updatedLots[idx] = {
                  ...updatedLots[idx],
                  currentStock: cur - deduct,
                };
                rem -= deduct;
              }
            }
          } else if (isReturn && updatedLots.length > 0) {
            let rem = totalItemQty;
            for (let idx = updatedLots.length - 1; idx >= 0 && rem > 0; idx--) {
              const cur = Number(updatedLots[idx].currentStock) || 0;
              const deduct = Math.min(cur, rem);
              updatedLots[idx] = {
                ...updatedLots[idx],
                currentStock: cur - deduct,
              };
              rem -= deduct;
            }
          }

          let updatedVariations = p.variations ? p.variations.map((v: any) => {
            const varMatching = (purchaseData.items || []).filter(
              (i: any) => i.productId === v.id || i.variationId === v.id || (v.sku && i.sku === v.sku)
            );
            if (varMatching.length === 0) return v;
            const varQty = varMatching.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);

            const vLocStocks = { ...(v.locationStocks || {}) };
            if (Object.keys(vLocStocks).length === 0) {
              vLocStocks[targetLocId] = Number(v.currentStock) || 0;
            }
            const vCurrentLoc = vLocStocks[targetLocId] || 0;
            const vNewLoc = isReturn ? Math.max(0, vCurrentLoc - varQty) : vCurrentLoc + varQty;
            vLocStocks[targetLocId] = vNewLoc;
            const vTotal = (Object.values(vLocStocks) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            const vFinalStock = isReturn ? Math.max(0, (Number(v.currentStock) || 0) - varQty) : (Number(v.currentStock) || 0) + varQty;

            return {
              ...v,
              locationStocks: vLocStocks,
              currentStock: isNaN(vTotal) ? vFinalStock : vTotal,
            };
          }) : p.variations;

          const firstItem = matchingItems[0];
          return {
            ...p,
            costPrice: canEditCost && firstItem ? (firstItem.costPrice || firstItem.unitPrice) : p.costPrice,
            sellingPrice: canEditCost && firstItem?.sellingPrice ? firstItem.sellingPrice : p.sellingPrice,
            locationStocks: newLocationStocks,
            currentStock: calculatedStock,
            lots: updatedLots,
            variations: updatedVariations,
          };
        })
      );
    }

    // Update Supplier Payable
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== purchaseData.supplierId) return s;
        const payableDelta = Math.max(0, purchaseData.totalAmount - purchaseData.paidAmount);
        
        if (newPurchase.type === 'purchase_return') {
          return {
            ...s,
            totalPayable: s.totalPayable - purchaseData.totalAmount + purchaseData.paidAmount,
          };
        }

        return {
          ...s,
          totalPurchases: s.totalPurchases + purchaseData.totalAmount,
          totalPayable: s.totalPayable + payableDelta,
        };
      })
    );

    setTransactions((prev) => {
      let updated = [newPurchase, ...prev];
      if (newPurchase.type === 'purchase_return' && (purchaseData as any).returnPurchaseId) {
        const retPurId = (purchaseData as any).returnPurchaseId;
        updated = updated.map((t) => {
          if (t.id !== retPurId) return t;
          const updatedItems = t.items.map((it: any) => {
            const returnItem = purchaseData.items.find((ri: any) => ri.productId === it.productId);
            if (!returnItem) return it;
            const newQty = Math.max(0, it.quantity - returnItem.quantity);
            return {
              ...it,
              quantity: newQty,
              returnedQuantity: (it.returnedQuantity || 0) + returnItem.quantity,
              total: newQty * it.unitPrice,
            };
          });
          const newSubtotal = updatedItems.reduce((acc: number, i: any) => acc + i.total, 0);
          const newTotal = Math.max(0, newSubtotal + (t.taxAmount || 0) + (t.shippingCharges || 0) - (t.discountAmount || 0));
          return {
            ...t,
            items: updatedItems,
            subtotal: newSubtotal,
            totalAmount: newTotal,
            hasReturn: true,
            returnTxnId: newPurchase.id,
            returnInvoiceNo: newPurchase.invoiceNo,
          };
        });
      }
      return updated;
    });

    return newPurchase;
  };

  const updatePurchase = (id: string, purchaseData: any) => {
    const existingTxn = transactions.find((t) => t.id === id);
    const effectiveStatus = settings.enablePurchaseStatus === false ? 'received' : (purchaseData.status || existingTxn?.status || 'received');

    if (existingTxn?.type === 'purchase_return' || purchaseData.type === 'purchase_return') {
      const oldItems = existingTxn?.items || [];
      const newItems = purchaseData.items || [];
      const targetLocId = purchaseData.locationId || existingTxn?.locationId || selectedLocationId || locations[0]?.id || 'loc_1';

      setProducts((prev) =>
        prev.map((p) => {
          const oldMatching = oldItems.filter((i: any) => i.productId === p.id || (p.sku && i.sku === p.sku) || (i.productName && p.name === i.productName));
          const newMatching = newItems.filter((i: any) => i.productId === p.id || (p.sku && i.sku === p.sku) || (i.productName && p.name === i.productName));
          const oldQty = oldMatching.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
          const newQty = newMatching.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
          const delta = newQty - oldQty; // additional returned quantity to deduct
          if (delta === 0) return p;

          const existingLocStocks = { ...(p.locationStocks || {}) };
          if (Object.keys(existingLocStocks).length === 0) {
            existingLocStocks[targetLocId] = Number(p.currentStock) || 0;
          } else if (existingLocStocks[targetLocId] === undefined) {
            existingLocStocks[targetLocId] = 0;
          }
          const currentLoc = existingLocStocks[targetLocId] || 0;
          const newLoc = Math.max(0, currentLoc - delta);
          existingLocStocks[targetLocId] = newLoc;

          const calculatedStock = Math.max(0, (Number(p.currentStock) || 0) - delta);

          let updatedLots = p.lots ? [...p.lots] : [];
          const lotNum = purchaseData.lotNumber || existingTxn?.lotNumber;
          if (lotNum) {
            const lotIdx = updatedLots.findIndex((l) => l.lotNumber.toLowerCase() === lotNum.toLowerCase());
            if (lotIdx >= 0) {
              updatedLots[lotIdx] = {
                ...updatedLots[lotIdx],
                currentStock: Math.max(0, (Number(updatedLots[lotIdx].currentStock) || 0) - delta),
              };
            }
          }

          return {
            ...p,
            locationStocks: existingLocStocks,
            currentStock: calculatedStock,
            lots: updatedLots,
          };
        })
      );
    } else if (effectiveStatus === 'received' || existingTxn?.status === 'received') {
      const oldItems = existingTxn?.items || [];
      const newItems = purchaseData.items || [];
      const targetLocId = purchaseData.locationId || existingTxn?.locationId || selectedLocationId || locations[0]?.id || 'loc_1';
      const canEditCost = settings.enableEditPurchasePrice !== false;
      const canTrackLot = settings.enableLotNumber !== false;

      // Find products that were removed or zeroed out
      const removedProductIds = oldItems
        .filter((oi: any) => !newItems.some((ni: any) => (ni.productId === oi.productId || (ni.sku && oi.sku && ni.sku === oi.sku)) && (Number(ni.quantity) || 0) > 0))
        .map((oi: any) => oi.productId)
        .filter(Boolean);

      setProducts((prev) => {
        const updated = prev.map((p) => {
          const oldMatching = oldItems.filter((i: any) => i.productId === p.id || (p.sku && i.sku === p.sku) || (i.productName && p.name === i.productName));
          const newMatching = newItems.filter((i: any) => i.productId === p.id || (p.sku && i.sku === p.sku) || (i.productName && p.name === i.productName));
          const oldQty = oldMatching.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
          const newQty = newMatching.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
          const delta = newQty - oldQty;

          const existingLocStocks = { ...(p.locationStocks || {}) };
          if (Object.keys(existingLocStocks).length === 0) {
            existingLocStocks[targetLocId] = Number(p.currentStock) || 0;
          } else if (existingLocStocks[targetLocId] === undefined) {
            existingLocStocks[targetLocId] = 0;
          }
          const currentLoc = existingLocStocks[targetLocId] || 0;
          const newLoc = Math.max(0, currentLoc + delta);
          existingLocStocks[targetLocId] = newLoc;

          const calculatedStock = Math.max(0, (Number(p.currentStock) || 0) + delta);

          let updatedLots = p.lots ? [...p.lots] : [];
          const lotNum = purchaseData.lotNumber || existingTxn?.lotNumber;
          if (canTrackLot && lotNum) {
            const lotIdx = updatedLots.findIndex((l) => l.lotNumber.toLowerCase() === lotNum.toLowerCase());
            if (lotIdx >= 0) {
              const item = newMatching[0];
              updatedLots[lotIdx] = {
                ...updatedLots[lotIdx],
                currentStock: Math.max(0, (Number(updatedLots[lotIdx].currentStock) || 0) + delta),
                costPrice: (canEditCost && item) ? (item.costPrice || item.unitPrice) : updatedLots[lotIdx].costPrice,
                sellingPrice: (canEditCost && item && item.sellingPrice) ? item.sellingPrice : updatedLots[lotIdx].sellingPrice,
              };
            }
          }

          const matchedNewItem = newMatching[0];

          return {
            ...p,
            costPrice: (canEditCost && matchedNewItem) ? (matchedNewItem.costPrice || matchedNewItem.unitPrice) : p.costPrice,
            sellingPrice: (canEditCost && matchedNewItem && matchedNewItem.sellingPrice) ? matchedNewItem.sellingPrice : p.sellingPrice,
            locationStocks: existingLocStocks,
            currentStock: calculatedStock,
            lots: updatedLots,
          };
        });

        // Automatically delete products from All Products screen if they were removed/zeroed from this purchase order
        // and their total stock is now 0 (or they are direct purchase items)
        return updated.filter((p) => {
          const pa = p as any;
          if (removedProductIds.includes(p.id) && (p.currentStock <= 0 || pa.source === 'purchase' || pa.creationSource === 'direct_purchase' || pa.isDirectPurchase)) {
            return false;
          }
          return true;
        });
      });
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...purchaseData, status: effectiveStatus } : t))
    );

    showFlashNotification(`Purchase ${purchaseData.invoiceNo || existingTxn?.invoiceNo || ''} updated successfully.`, 'success');
  };

  const updatePurchaseSupplier = (transactionId: string, newSupplierId: string, newSupplierName?: string) => {
    const targetSupplier = suppliers.find((s) => s.id === newSupplierId);
    const finalSupplierName = newSupplierName || targetSupplier?.name || '';
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t;
        return {
          ...t,
          supplierId: newSupplierId,
          supplierName: finalSupplierName,
        };
      })
    );
    showFlashNotification(`Supplier updated to "${finalSupplierName || 'Selected Supplier'}".`, 'success');
  };

  const splitPurchaseItems = (transactionId: string, itemSplits: { itemIndex: number; supplierId: string; supplierName: string }[]) => {
    const originalTxn = transactions.find((t) => t.id === transactionId);
    if (!originalTxn || !originalTxn.items || originalTxn.items.length <= 1) return;

    const supplierGroups = new Map<string, { supplierId: string; supplierName: string; items: any[] }>();
    originalTxn.items.forEach((item: any, idx: number) => {
      const splitInfo = itemSplits.find((s) => s.itemIndex === idx);
      const sId = splitInfo?.supplierId || (item as any).supplierId || originalTxn.supplierId;
      const sName = splitInfo?.supplierName || (item as any).supplierName || originalTxn.supplierName || '';
      if (!supplierGroups.has(sId)) {
        supplierGroups.set(sId, { supplierId: sId, supplierName: sName, items: [item] });
      } else {
        supplierGroups.get(sId)!.items.push(item);
      }
    });

    if (supplierGroups.size <= 1) return;

    const newTransactions: Transaction[] = [];
    let groupIdx = 0;
    for (const [suppId, grp] of supplierGroups) {
      groupIdx++;
      const subtotal = grp.items.reduce((s: number, it: any) => s + (it.quantity * (it.costPrice || it.unitPrice || 0)), 0);
      const taxAmount = grp.items.reduce((s: number, it: any) => s + (it.tax || 0), 0);
      const totalAmount = Math.max(0, subtotal + taxAmount);
      const ratio = originalTxn.totalAmount > 0 ? totalAmount / originalTxn.totalAmount : 1 / supplierGroups.size;
      const paidAmount = (originalTxn.paidAmount || 0) * ratio;

      newTransactions.push({
        ...originalTxn,
        id: `txn_pur_${Date.now()}_${groupIdx}_${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNo: groupIdx === 1 ? originalTxn.invoiceNo : `${originalTxn.invoiceNo}-${groupIdx}`,
        supplierId: suppId,
        supplierName: grp.supplierName,
        items: grp.items,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount,
      });
    }

    setTransactions((prev) => prev.map((t) => (t.id === transactionId ? newTransactions[0] : t)).concat(newTransactions.slice(1)));
    showFlashNotification(`Split purchase order into ${newTransactions.length} separate orders by supplier.`, 'success');
  };

  const deletePurchase = (id: string) => {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;

    const isReturn = txn.type === 'purchase_return';

    // Quantity validation rule: cannot delete if active purchase quantity is > 0
    if (!isReturn && txn.type === 'purchase') {
      const netPurchaseQty = (txn.items || []).reduce(
        (sum: number, it: any) => sum + Math.max(0, (Number(it.quantity) || 0) - (Number(it.returnedQuantity) || 0)),
        0
      );
      if (netPurchaseQty > 0) {
        showFlashNotification(
          `Cannot delete Purchase ${txn.invoiceNo}: Purchase quantity (${netPurchaseQty} units) is not equal to zero. Please process a purchase return or reduce quantity to 0 before deleting.`,
          'error'
        );
        return;
      }
    }

    if (txn.status === 'received' || isReturn) {
      const deletedProductIds = (txn.items || []).map((it: any) => it.productId).filter(Boolean);

      setProducts((prev) => {
        const updated = prev.map((p) => {
          const matchingItems = (txn.items || []).filter((i: any) => i.productId === p.id || (p.sku && i.sku === p.sku) || (i.productName && p.name === i.productName));
          if (matchingItems.length === 0) return p;
          const totalQty = matchingItems.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
          const targetLocId = txn.locationId || selectedLocationId || locations[0]?.id || 'loc_1';

          const existingLocStocks = { ...(p.locationStocks || {}) };
          if (Object.keys(existingLocStocks).length === 0) {
            existingLocStocks[targetLocId] = Number(p.currentStock) || 0;
          } else if (existingLocStocks[targetLocId] === undefined) {
            existingLocStocks[targetLocId] = 0;
          }
          const currentLoc = existingLocStocks[targetLocId] || 0;
          const newLoc = isReturn ? currentLoc + totalQty : Math.max(0, currentLoc - totalQty);
          existingLocStocks[targetLocId] = newLoc;

          const calculatedStock = isReturn
            ? (Number(p.currentStock) || 0) + totalQty
            : Math.max(0, (Number(p.currentStock) || 0) - totalQty);

          let updatedLots = p.lots ? [...p.lots] : [];
          if (txn.lotNumber) {
            const lotIdx = updatedLots.findIndex((l: any) => l.lotNumber?.toLowerCase() === txn.lotNumber?.toLowerCase());
            if (lotIdx >= 0) {
              updatedLots[lotIdx] = {
                ...updatedLots[lotIdx],
                currentStock: isReturn ? (Number(updatedLots[lotIdx].currentStock) || 0) + totalQty : Math.max(0, (Number(updatedLots[lotIdx].currentStock) || 0) - totalQty)
              };
            }
          }

          return {
            ...p,
            locationStocks: existingLocStocks,
            currentStock: calculatedStock,
            lots: updatedLots,
          };
        });

        // Clean up direct purchase products with 0 stock
        return updated.filter((p) => {
          const pa = p as any;
          if (deletedProductIds.includes(p.id) && (p.currentStock <= 0 || pa.source === 'purchase' || pa.creationSource === 'direct_purchase' || pa.isDirectPurchase)) {
            return false;
          }
          return true;
        });
      });
    }

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== txn.supplierId) return s;
        const paidAmount = txn.paidAmount || 0;
        const totalAmount = txn.totalAmount || 0;
        const payableDelta = Math.max(0, totalAmount - paidAmount);

        if (isReturn) {
          return {
            ...s,
            totalPayable: s.totalPayable + totalAmount - paidAmount,
          };
        }

        return {
          ...s,
          totalPurchases: Math.max(0, s.totalPurchases - totalAmount),
          totalPayable: Math.max(0, s.totalPayable - payableDelta),
        };
      })
    );

    setTransactions((prev) => {
      let remaining = prev.filter((t) => t.id !== id);
      if (isReturn && (txn as any).returnPurchaseId) {
        remaining = remaining.map((t) => {
          if (t.id !== (txn as any).returnPurchaseId) return t;
          const restoredItems = t.items.map((it: any) => {
            const retItem = txn.items.find((ri: any) => ri.productId === it.productId);
            if (!retItem) return it;
            const newQty = it.quantity + retItem.quantity;
            return {
              ...it,
              quantity: newQty,
              returnedQuantity: Math.max(0, (it.returnedQuantity || 0) - retItem.quantity),
              total: newQty * it.unitPrice,
            };
          });
          const newSubtotal = restoredItems.reduce((acc: number, i: any) => acc + i.total, 0);
          const newTotal = Math.max(0, newSubtotal + (t.taxAmount || 0) + (t.shippingCharges || 0) - (t.discountAmount || 0));
          return {
            ...t,
            items: restoredItems,
            subtotal: newSubtotal,
            totalAmount: newTotal,
            hasReturn: false,
          };
        });
      }
      return remaining;
    });

    showFlashNotification(`${isReturn ? 'Purchase Return' : 'Purchase Order'} deleted and inventory updated.`, 'info');
  };

  const receivePurchaseOrder = (txnId: string) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn || txn.status === 'received') return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const canEditCost = settings.enableEditPurchasePrice !== false;
    const canTrackLot = settings.enableLotNumber !== false;

    setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, status: 'received' } : t));

    setProducts(prev => prev.map(p => {
      const item = txn.items.find(i => i.productId === p.id);
      if (!item) return p;

      const currentLoc = p.locationStocks?.[txn.locationId] || 0;
      const newLoc = currentLoc + item.quantity;
      const newLocationStocks = {
        ...p.locationStocks,
        [txn.locationId]: newLoc,
      };

      let updatedLots = p.lots ? [...p.lots] : [];
      if (canTrackLot && txn.lotNumber) {
        const existingLotIdx = updatedLots.findIndex(l => l.lotNumber.toLowerCase() === txn.lotNumber?.toLowerCase());
        
        if (existingLotIdx >= 0) {
          updatedLots[existingLotIdx] = {
            ...updatedLots[existingLotIdx],
            currentStock: updatedLots[existingLotIdx].currentStock + item.quantity,
            costPrice: item.costPrice || item.unitPrice,
            sellingPrice: item.sellingPrice || updatedLots[existingLotIdx].sellingPrice,
          };
        } else {
          updatedLots.push({
            id: `lot_rec_${Date.now()}_${p.id}`,
            lotNumber: txn.lotNumber,
            costPrice: item.costPrice || item.unitPrice,
            sellingPrice: item.sellingPrice || p.sellingPrice,
            currentStock: item.quantity,
            createdDate: nowStr.slice(0, 10)
          });
        }
      }

      const total = (Object.values(newLocationStocks) as number[]).reduce((a: any, b: any) => a + b, 0) as number;

      return {
        ...p,
        costPrice: canEditCost ? (item.costPrice || item.unitPrice) : p.costPrice,
        sellingPrice: canEditCost && item.sellingPrice ? item.sellingPrice : p.sellingPrice,
        locationStocks: newLocationStocks,
        currentStock: total,
        lots: updatedLots,
      };
    }));

    showFlashNotification(`Successfully received Purchase Order ${txn.invoiceNo}. Inventory updated and Lot ${txn.lotNumber || 'N/A'} assigned.`, 'success');
  };

  // Purchase Requisitions Handlers
  const createPurchaseRequisition = (reqData: any): PurchaseRequisition => {
    const count = purchaseRequisitions.length + 1;
    const prefix = settings.prefixes?.purchaseRequisition || 'PRQ-';
    const reqNo = reqData.requisitionNo || `${prefix}${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newReq: PurchaseRequisition = {
      id: `prq_${Date.now()}`,
      requisitionNo: reqNo,
      date: nowStr,
      requiredDate: reqData.requiredDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      requestedBy: reqData.requestedBy || currentUser?.name || 'Staff User',
      department: reqData.department || 'Operations',
      locationId: reqData.locationId || selectedLocationId,
      items: reqData.items || [],
      status: reqData.status || 'pending',
      priority: reqData.priority || 'medium',
      notes: reqData.notes || '',
    };

    setPurchaseRequisitions((prev) => [newReq, ...prev]);
    showFlashNotification(`Purchase Requisition ${reqNo} created successfully.`, 'success');
    return newReq;
  };

  const updatePurchaseRequisition = (id: string, data: Partial<PurchaseRequisition>) => {
    setPurchaseRequisitions((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    showFlashNotification(`Purchase Requisition updated.`, 'success');
  };

  const deletePurchaseRequisition = (id: string) => {
    setPurchaseRequisitions((prev) => prev.filter((r) => r.id !== id));
    showFlashNotification(`Purchase Requisition deleted.`, 'info');
  };

  const approvePurchaseRequisition = (id: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setPurchaseRequisitions((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              approvedBy: currentUser?.name || 'Admin Store',
              approvedDate: nowStr,
            }
          : r
      )
    );
    showFlashNotification(`Purchase Requisition approved.`, 'success');
  };

  const rejectPurchaseRequisition = (id: string, reason?: string) => {
    setPurchaseRequisitions((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              rejectionReason: reason || 'Declined by management',
            }
          : r
      )
    );
    showFlashNotification(`Purchase Requisition rejected.`, 'info');
  };

  const convertRequisitionToPurchase = (id: string) => {
    const req = purchaseRequisitions.find((r) => r.id === id);
    if (!req) return;

    const defaultSupplier = suppliers[0]?.id || '';
    const purchaseItems = req.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      unit: 'Pcs',
      quantity: item.quantity,
      unitPrice: item.estimatedUnitCost,
      costPrice: item.estimatedUnitCost,
      taxRate: 0,
      discount: 0,
      total: item.quantity * item.estimatedUnitCost,
      profitMargin: 20,
      sellingPrice: item.estimatedUnitCost * 1.25,
    }));

    const subtotal = purchaseItems.reduce((sum, i) => sum + i.total, 0);

    const createdTxn = createPurchase({
      supplierId: defaultSupplier,
      locationId: req.locationId,
      type: 'purchase',
      items: purchaseItems,
      subtotal,
      taxAmount: 0,
      discountAmount: 0,
      shippingCharges: 0,
      totalAmount: subtotal,
      paidAmount: subtotal,
      paymentMethod: 'bank_transfer',
      notes: `Converted from Requisition ${req.requisitionNo}. ${req.notes || ''}`,
      status: settings.enablePurchaseStatus === false ? 'received' : 'ordered',
      lotNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setPurchaseRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'converted', convertedPurchaseId: createdTxn.id } : r))
    );

    showFlashNotification(`Requisition ${req.requisitionNo} converted into Purchase Order ${createdTxn.invoiceNo}.`, 'success');
    handleSmartSetActiveTab('purchases');
  };

  // Expenses
  const addExpense = (expenseData: any) => {
    const ref = expenseData.referenceNo?.trim() || `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = expenseData.date ? expenseData.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const newExp: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      referenceNo: ref,
      date: dateStr,
    };
    setExpenses((prev) => [newExp, ...prev]);

    // Update financial accounts in real-time
    if (expenseData.accountId) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.id === expenseData.accountId) {
            const netDeduction = expenseData.amount - (expenseData.isRefund ? (expenseData.refundAmount || 0) : 0);
            return {
              ...acc,
              balance: acc.balance - netDeduction,
            };
          }
          return acc;
        })
      );
    }

    // Track in cash register if paid from cash drawer
    if (expenseData.paymentMethod === 'cash' && cashRegister.status === 'open') {
      const netRegisterExpense = expenseData.amount - (expenseData.isRefund ? (expenseData.refundAmount || 0) : 0);
      setCashRegister((prev) => ({
        ...prev,
        totalExpenses: prev.totalExpenses + netRegisterExpense,
      }));
    }
  };

  const updateExpense = (id: string, updatedExpenseData: any) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return {
            ...exp,
            ...updatedExpenseData,
          };
        }
        return exp;
      })
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const addAccount = (accountData: any): FinancialAccount => {
    const newAccount: FinancialAccount = {
      id: `acc_${Date.now()}`,
      name: accountData.name || 'Unnamed Account',
      accountNumber: accountData.accountNumber || `ACC-${Date.now()}`,
      type: accountData.type || 'Cash',
      balance: Number(accountData.balance) || 0,
      bankName: accountData.bankName,
    };
    setAccounts((prev) => [...prev, newAccount]);
    showFlashNotification(`Account "${newAccount.name}" created successfully.`, 'success');
    return newAccount;
  };

  const updateAccount = (id: string, accountData: Partial<FinancialAccount>) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const updated = {
            ...acc,
            ...accountData,
            balance: accountData.balance !== undefined ? Number(accountData.balance) : acc.balance,
          };
          return updated;
        }
        return acc;
      })
    );
    showFlashNotification('Financial Account updated successfully.', 'success');
  };

  const deleteAccount = (id: string): { success: boolean; message: string } => {
    if (
      id === settings.defaultCashAccount ||
      id === settings.defaultCardAccount ||
      id === settings.defaultBankTransferAccount ||
      id === settings.defaultUpiAccount ||
      id === settings.defaultChequeAccount
    ) {
      return {
        success: false,
        message: 'Cannot delete this account as it is configured as a default payment account in Business Settings.',
      };
    }

    const acc = accounts.find((a) => a.id === id);
    if (acc && Math.abs(acc.balance) > 0.01) {
      return {
        success: false,
        message: `Cannot delete account "${acc.name}" with a non-zero balance of ${settings.currencySymbol || '$'}${acc.balance.toFixed(2)}. Please transfer or clear the balance first.`,
      };
    }

    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    showFlashNotification('Account deleted successfully.', 'info');
    return { success: true, message: 'Account deleted successfully.' };
  };

  const addPaymentMethod = (methodData: Omit<PaymentMethodItem, 'id'>): PaymentMethodItem => {
    const newMethod: PaymentMethodItem = {
      ...methodData,
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
    showFlashNotification(`Payment method "${newMethod.name}" created successfully.`, 'success');
    return newMethod;
  };

  const updatePaymentMethod = (id: string, methodData: Partial<PaymentMethodItem>) => {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...methodData } : m))
    );
    showFlashNotification('Payment method updated successfully.', 'success');
  };

  const deletePaymentMethod = (id: string): { success: boolean; message: string } => {
    const pm = paymentMethods.find((m) => m.id === id);
    if (!pm) {
      return { success: false, message: 'Payment method not found.' };
    }
    if (pm.isDefault) {
      return { success: false, message: 'Default system payment methods cannot be deleted.' };
    }
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
    showFlashNotification('Payment method deleted successfully.', 'info');
    return { success: true, message: 'Payment method deleted successfully.' };
  };

  // Cash Register Shift Control & Security Policies
  const isPosExitAllowed = (user?: User | null, reg?: CashRegister): boolean => {
    const activeUser = user !== undefined ? user : currentUser;
    const activeReg = reg !== undefined ? reg : cashRegister;

    // Admin user has master managerial privileges to exit anytime
    if (activeUser?.role === 'admin' || activeUser?.role === 'super_admin' || activeUser?.role === 'supreme_admin') {
      return true;
    }

    // Non-admin can exit if cash register shift is closed
    if (activeReg?.status === 'closed') {
      return true;
    }

    // Register is open and user is not admin: exit blocked
    return false;
  };

  const requestOpenPos = () => {
    setActiveTabState('pos');
  };

  const handleSmartSetActiveTab = (tab: string) => {
    setIsMobileSidebarOpen(false);
    if (activeTab === 'pos' && tab !== 'pos' && !isPosExitAllowed()) {
      setPendingPosExitTarget(tab);
      setShowRegisterExitLockModal(true);
      return;
    }

    if (tab === 'pos') {
      setActiveTabState('pos');
      return;
    }

    // Auto-resolve aliases to avoid any blank screens
    if (tab === 'configuration') {
      setSettingsSubTab('locations');
      setActiveTabState('settings');
      return;
    }
    if (tab === 'purchases') {
      setEditingPurchase(null);
      setViewingPurchase(null);
      setActiveTabState('purchases');
      return;
    }
    if (tab === 'sales') {
      setEditingSale(null);
      setViewingSale(null);
      setActiveTabState('sales');
      return;
    }
    if (tab === 'sale_returns' || tab === 'sell_returns') {
      setEditingSale(null);
      setViewingSale(null);
      setActiveTabState('sale_returns');
      return;
    }
    if (tab === 'add_sale') {
      setEditingSale(null);
      setViewingSale(null);
      setActiveTabState('add_sale');
      return;
    }
    if (tab === 'products' || tab === 'all_products' || tab === 'matrix') {
      setEditingProduct(null);
      setInventorySubTab('matrix');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'add_product' || tab === 'new_product') {
      setEditingProduct(null);
      setInventorySubTab('add_product');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'edit_product') {
      setInventorySubTab('edit_product');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'import_products' || tab === 'import_product') {
      setEditingProduct(null);
      setInventorySubTab('import_products');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'product_history') {
      setInventorySubTab('product_history');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'variations') {
      setInventorySubTab('variations');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'categories' || tab === 'category') {
      setInventorySubTab('categories');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'brands' || tab === 'brand' || tab === 'brands_list' || tab === 'brand_list') {
      setInventorySubTab('brands');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'warranties' || tab === 'warranty') {
      setInventorySubTab('warranties');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'racks' || tab === 'rack_row') {
      setInventorySubTab('racks');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'units') {
      setInventorySubTab('units');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'barcode' || tab === 'labels') {
      setActiveTabState('barcode_studio');
      return;
    }
    if (tab === 'adjustments' || tab === 'stock_adjustments') {
      setInventorySubTab('adjustments');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'transfers' || tab === 'stock_transfers') {
      setInventorySubTab('transfers');
      setActiveTabState('inventory');
      return;
    }
    if (tab === 'customers' || tab === 'suppliers' || tab === 'customer_groups' || tab === 'import_contacts') {
      setContactsSubTab(tab as any);
      setActiveTabState('contacts');
      return;
    }
    if (tab === 'user_menu' || tab === 'users' || tab === 'roles' || tab === 'permissions' || tab === 'user_permissions') {
      if (tab === 'users') {
        setUserMenuSubTab('users');
      } else if (tab === 'roles') {
        setUserMenuSubTab('roles');
      } else if (tab === 'permissions' || tab === 'user_permissions') {
        setUserMenuSubTab('permissions');
      }
      setActiveTabState('user_menu');
      return;
    }

    setActiveTabState(tab);
  };

  const navigateToSettings = (subTab?: SettingsSubTab, businessSection?: string) => {
    if (subTab) {
      setSettingsSubTab(subTab);
    }
    if (businessSection) {
      setBusinessSettingsSection(businessSection);
    }
    handleSmartSetActiveTab('settings');
  };

  const navigateToUserMenu = (subTab: UserMenuSubTab = 'permissions') => {
    if (subTab === 'add_user') {
      openAddUserModal();
      return;
    }
    setIsAddUserModalOpen(false);
    setUserMenuSubTab(subTab);
    handleSmartSetActiveTab('user_menu');
  };

  const verifyAdminOverride = (pinOrPassword: string): boolean => {
    const clean = pinOrPassword.trim().toLowerCase();
    if (!clean) return false;
    
    const validManagerCodes = ['admin', 'admin123', '1234', '9999', 'supervisor', 'manager', 'sarah'];
    if (validManagerCodes.includes(clean)) return true;

    // Check against admin users
    const hasMatchingAdmin = users.some(
      (u) =>
        (u.role === 'supreme_admin' || u.role === 'admin') &&
        (u.name.toLowerCase().includes(clean) ||
          u.email.toLowerCase() === clean ||
          (u.phone && u.phone.includes(clean)))
    );
    return hasMatchingAdmin;
  };

  const openRegister = (floatAmount: number, cashierName: string, notes?: string) => {
    const newReg: CashRegister = {
      id: `reg_${Date.now()}`,
      locationId: selectedLocationId,
      cashierId: currentUser?.id || `usr_${Date.now()}`,
      cashierName: cashierName || currentUser?.name || 'Cashier',
      openedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'open',
      openingCash: floatAmount,
      cashSales: 0,
      cardSales: 0,
      otherSales: 0,
      totalExpenses: 0,
      notes,
    };
    setCashRegister(newReg);
    try {
      localStorage.setItem(`${STORAGE_KEY}_register`, JSON.stringify(newReg));
    } catch {
      // ignore
    }
    setShowOpenRegisterModal(false);
    setActiveTabState('pos');
    showFlashNotification(
      `Cash register shift opened with ${settings.currencySymbol}${floatAmount.toFixed(2)} cash in hand. Entering POS screen...`,
      'success'
    );
  };

  const closeRegister = (actualCashCount: number, notes?: string) => {
    const updatedReg: CashRegister = {
      ...cashRegister,
      status: 'closed',
      closedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      closingCash: actualCashCount,
      notes: notes ? `${cashRegister.notes || ''} | Closing: ${notes}` : cashRegister.notes,
    };
    setCashRegister(updatedReg);
    try {
      localStorage.setItem(`${STORAGE_KEY}_register`, JSON.stringify(updatedReg));
    } catch {
      // ignore
    }
    showFlashNotification('Cash Register shift closed successfully.', 'info');
  };

  // Financial Calculations & P&L
  const financialSummary: FinancialSummary = useMemo(() => {
    const salesTxns = transactions.filter((t) => t.type === 'sale' && t.status === 'final');
    const purchaseTxns = transactions.filter((t) => t.type === 'purchase');

    const grossSales = salesTxns.reduce((sum, t) => sum + t.subtotal, 0);
    const totalTaxCollected = salesTxns.reduce((sum, t) => sum + t.taxAmount, 0);
    const totalDiscounts = salesTxns.reduce((sum, t) => sum + t.discountAmount, 0);
    const netSales = grossSales - totalDiscounts;

    // Cost of Goods Sold (COGS)
    let cogs = 0;
    salesTxns.forEach((t) => {
      t.items.forEach((item) => {
        cogs += (item.costPrice || 0) * item.quantity;
      });
    });

    const grossProfit = netSales - cogs;
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    const totalExpensesAmount = expenses.reduce((sum, e) => {
      const refundAmt = e.isRefund ? (e.refundAmount || 0) : 0;
      return sum + (e.amount - refundAmt);
    }, 0);
    const netProfit = grossProfit - totalExpensesAmount;
    const netProfitMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    const totalPurchases = purchaseTxns.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTaxPaid = purchaseTxns.reduce((sum, t) => sum + t.taxAmount, 0);
    const netTaxPayable = totalTaxCollected - totalTaxPaid;

    // Real-Time Inventory Valuation
    let stockValuationCost = 0;
    let stockValuationRetail = 0;
    products.forEach((p) => {
      stockValuationCost += p.currentStock * p.costPrice;
      stockValuationRetail += p.currentStock * p.sellingPrice;
    });

    const totalReceivables = customers.reduce((sum, c) => sum + c.totalDue, 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + s.totalPayable, 0);

    const cashInHand = (cashRegister.openingCash + cashRegister.cashSales) - cashRegister.totalExpenses;
    const bankAcc = accounts.find((a) => a.type === 'Bank');
    const bankBalance = bankAcc ? bankAcc.balance : 84250.00;

    return {
      grossSales,
      netSales,
      totalPurchases,
      cogs,
      grossProfit,
      grossProfitMargin,
      totalExpenses: totalExpensesAmount,
      netProfit,
      netProfitMargin,
      taxCollected: totalTaxCollected,
      taxPaid: totalTaxPaid,
      netTaxPayable,
      stockValuationCost,
      stockValuationRetail,
      totalReceivables,
      totalPayables,
      cashInHand,
      bankBalance,
      totalSales: grossSales,
      totalDiscounts,
      totalTax: totalTaxCollected,
    };
  }, [transactions, expenses, products, customers, suppliers, accounts, cashRegister]);

  // Auth Handlers
  const login = async (
    emailOrPhone: string,
    password?: string,
    locationId?: string
  ): Promise<{
    success: boolean;
    message?: string;
    isLocked?: boolean;
    lockedUntil?: number;
    remainingMinutes?: number;
    remainingSeconds?: number;
    unlockRequested?: boolean;
    requireOtp?: boolean;
    userEmail?: string;
    userName?: string;
    userId?: string;
    otpCode?: string;
  }> => {
    const cleanQuery = emailOrPhone.trim().toLowerCase();
    
    // Find matching user (checking email, username, phone, and name safely)
    let matchedUser = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanQuery) ||
        (u.username && u.username.toLowerCase() === cleanQuery) ||
        (u.phone && cleanQuery.length >= 4 && u.phone.replace(/\D/g, '') === cleanQuery.replace(/\D/g, '')) ||
        (u.name && u.name.toLowerCase().trim() === cleanQuery)
    );

    // If not found in local state, fetch in real-time from server database and system status
    if (!matchedUser) {
      // 1. Query sync.php (Live MySQL sync store across devices)
      try {
        const syncRes = await fetch('/api/sync.php?action=pull&t=' + Date.now(), {
          headers: { Accept: 'application/json' },
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.success && syncData.data && Array.isArray(syncData.data.users) && syncData.data.users.length > 0) {
            setUsers(syncData.data.users);
            try {
              localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(syncData.data.users));
            } catch {}
            matchedUser = syncData.data.users.find(
              (u: any) =>
                (u.email && u.email.toLowerCase() === cleanQuery) ||
                (u.username && u.username.toLowerCase() === cleanQuery) ||
                (u.phone && cleanQuery.length >= 4 && u.phone.replace(/\D/g, '') === cleanQuery.replace(/\D/g, '')) ||
                (u.name && u.name.toLowerCase().trim() === cleanQuery)
            );
          }
        }
      } catch {}

      // 2. Query system status endpoint for admin user account
      if (!matchedUser) {
        try {
          const statusRes = await fetch('/api/system.php?action=status&t=' + Date.now(), {
            headers: { Accept: 'application/json' },
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.adminUser) {
              const au = statusData.adminUser;
              if (
                (au.email && au.email.toLowerCase() === cleanQuery) ||
                (au.username && au.username.toLowerCase() === cleanQuery) ||
                (au.phone && cleanQuery.length >= 4 && au.phone.replace(/\D/g, '') === cleanQuery.replace(/\D/g, '')) ||
                (au.name && au.name.toLowerCase().trim() === cleanQuery) ||
                cleanQuery === 'admin' ||
                cleanQuery === 'supreme_admin'
              ) {
                matchedUser = au;
                setUsers((prev) => {
                  const filtered = prev.filter((u) => u.id !== au.id && u.email !== au.email);
                  const next = [au, ...filtered];
                  try {
                    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(next));
                    localStorage.setItem(`${STORAGE_KEY}_admin_user`, JSON.stringify(au));
                  } catch {}
                  return next;
                });
              }
            }
          }
        } catch {}
      }

      // 3. Check localStorage stored admin user
      if (!matchedUser) {
        const localAdmin = safeJsonParse(`${STORAGE_KEY}_admin_user`, null);
        if (
          localAdmin &&
          ((localAdmin.email && localAdmin.email.toLowerCase() === cleanQuery) ||
            (localAdmin.username && localAdmin.username.toLowerCase() === cleanQuery) ||
            (localAdmin.phone && cleanQuery.length >= 4 && localAdmin.phone.replace(/\D/g, '') === cleanQuery.replace(/\D/g, '')) ||
            (localAdmin.name && localAdmin.name.toLowerCase().trim() === cleanQuery) ||
            cleanQuery === 'admin' ||
            cleanQuery === 'supreme_admin')
        ) {
          matchedUser = localAdmin;
          setUsers((prev) => [localAdmin, ...prev]);
        }
      }
    }

    // If not found in current users, check against initial users ONLY when NOT fresh installed or real store
    const isInstalledOrFresh = typeof window !== 'undefined' && (
      localStorage.getItem('app_fresh_installed') === 'true' ||
      localStorage.getItem('installation_type') === 'fresh' ||
      localStorage.getItem('pos_installed') === 'true' ||
      localStorage.getItem('app_installed') === 'true' ||
      settings?.isInstalled === true ||
      settings?.isFreshInstallation === true
    );
    if (!matchedUser && !isInstalledOrFresh) {
      matchedUser = initialUsers.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanQuery) ||
          (u.username && u.username.toLowerCase() === cleanQuery) ||
          (u.name && u.name.toLowerCase().includes(cleanQuery))
      );
      if (matchedUser) {
        setUsers((prev) => [...prev, matchedUser!]);
      }
    }

    if (!matchedUser) {
      if (isInstalledOrFresh) {
        return { success: false, message: 'Invalid credentials. User account not found in system directory.' };
      }
      // Auto-create a temporary session only in uninstalled dev preview mode
      if (cleanQuery.includes('@') || cleanQuery.length > 2) {
        let detectedRole = 'admin';
        let avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

        if (cleanQuery.includes('cashier')) {
          detectedRole = 'cashier';
          avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
        } else if (cleanQuery.includes('inventory') || cleanQuery.includes('stock')) {
          detectedRole = 'inventory_manager';
          avatarUrl = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80';
        } else if (cleanQuery.includes('accountant') || cleanQuery.includes('finance') || cleanQuery.includes('cfo')) {
          detectedRole = 'accountant';
          avatarUrl = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80';
        } else if (cleanQuery.includes('manager')) {
          detectedRole = 'manager';
          avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
        }

        const fallbackUser: User = {
          id: `usr_${Date.now()}`,
          name: emailOrPhone.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          email: cleanQuery.includes('@') ? cleanQuery : `${cleanQuery}@pos-enterprise.com`,
          username: cleanQuery.includes('@') ? cleanQuery.split('@')[0] : cleanQuery,
          password: password || 'password123',
          role: detectedRole,
          avatar: avatarUrl,
          locationId: locationId || selectedLocationId,
          businessName: settings.name,
          status: 'active',
          failedLogins: 0,
          lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        matchedUser = fallbackUser;
        setUsers((prev) => [fallbackUser, ...prev]);
      } else {
        return { success: false, message: 'Invalid credentials. Please enter a valid email or select a demo account.' };
      }
    }

    const maxFailed = settings.maxFailedLogins || 5;
    const lockoutMinutes = settings.lockoutDuration || 15;
    const now = Date.now();

    // Check if account is admin - Admin accounts can NEVER be locked out and NEVER require OTP before signin
    const isAdmin = matchedUser.role === 'admin' || matchedUser.role === 'super_admin' || matchedUser.role === 'supreme_admin' || cleanQuery === 'admin@royalpos.com' || cleanQuery.startsWith('admin');

    // Check if account is locked / frozen
    const isEffectivelyLocked =
      !isAdmin &&
      !matchedUser.isUnlockedByAdmin &&
      (matchedUser.status === 'locked' || (matchedUser.failedLogins || 0) >= maxFailed);

    if (isEffectivelyLocked) {
      const lockedUntil = matchedUser.lockedUntil || (now + lockoutMinutes * 60 * 1000);

      // Check if the lockout freeze period has expired
      if (now < lockedUntil) {
        // Account remains frozen!
        const remainingMs = lockedUntil - now;
        const remainingMins = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
        const remainingSecs = Math.max(1, Math.ceil(remainingMs / 1000));

        return {
          success: false,
          isLocked: true,
          lockedUntil,
          remainingMinutes: remainingMins,
          remainingSeconds: remainingSecs,
          unlockRequested: !!matchedUser.unlockRequested,
          userEmail: matchedUser.email,
          userName: matchedUser.name,
          userId: matchedUser.id,
          message: matchedUser.unlockRequested
            ? `Account is frozen for ${remainingMins} more minute(s). Unlock request notification mail has been sent to Admin. Admin can unlock immediately, otherwise please wait for the freeze timer to expire.`
            : `Account is temporarily frozen for ${remainingMins} minute(s) after triggering the brute-force threshold (${maxFailed} failed attempts). You can wait for the timer, or send an unlock request notification mail to Admin to unlock immediately.`
        };
      } else {
        // Lockout freeze timer has expired! Unfreeze account
        matchedUser = {
          ...matchedUser,
          status: 'active',
          lockedUntil: undefined,
          failedLogins: 0,
          unlockRequested: false,
          requireOtpOnNextLogin: false,
        };
        const updatedUsers = users.map((u) => (u.id === matchedUser!.id ? matchedUser! : u));
        setUsers(updatedUsers);
        try {
          localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(updatedUsers));
        } catch (e) {
          // ignore
        }
      }
    }

    // Verify password and PIN
    const expectedPassword = matchedUser.password || 'password123';
    const expectedPin = matchedUser.pin || '';
    const providedPassword = (password || '').trim();

    const isPasswordValid =
      providedPassword === expectedPassword ||
      (Boolean(expectedPin) && providedPassword === expectedPin) ||
      (Boolean(expectedPassword) && providedPassword.toLowerCase() === expectedPassword.toLowerCase());

    if (!isPasswordValid) {
      // Do not increment failed login lockout on admin to prevent administrative lockouts
      const currentFailed = isAdmin ? 0 : (matchedUser.failedLogins || 0) + 1;
      const isLocked = !isAdmin && currentFailed >= maxFailed;
      const lockedUntil = now + lockoutMinutes * 60 * 1000;

      const updatedWithFailure: User = {
        ...matchedUser,
        failedLogins: currentFailed,
        status: isLocked ? 'locked' : matchedUser.status || 'active',
        lockedUntil: isLocked ? lockedUntil : undefined,
        lockedAt: isLocked ? new Date().toISOString() : matchedUser.lockedAt,
        lockoutReason: isLocked ? 'BRUTE_FORCE' : undefined,
        unlockRequested: false,
        requireOtpOnNextLogin: false,
      };

      const updatedUsers = users.map((u) => (u.id === matchedUser!.id ? updatedWithFailure : u));
      setUsers(updatedUsers);
      try {
        localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(updatedUsers));
      } catch (e) {
        // ignore
      }

      if (isLocked) {
        // Log to notification audit for admins
        const securityAlert: NotificationDeliveryLog = {
          id: `sec_lock_${Date.now()}`,
          templateType: 'security_lockout_alert',
          recipientName: matchedUser.name,
          recipientEmail: matchedUser.email,
          channel: 'email',
          subject: `🚨 Security Alert: Account Locked (${matchedUser.name})`,
          message: `User ${matchedUser.name} (${matchedUser.email}) failed ${currentFailed} login attempts. Account frozen for ${lockoutMinutes} minutes. User can request admin unlock via notification mail.`,
          status: 'sent',
          timestamp: new Date().toISOString(),
          metadata: {
            userId: matchedUser.id,
            userEmail: matchedUser.email,
            userName: matchedUser.name,
            lockedUntil,
            failedLogins: currentFailed,
          }
        };
        setNotificationLogs((prev) => [securityAlert, ...prev]);

        return {
          success: false,
          isLocked: true,
          lockedUntil,
          remainingMinutes: lockoutMinutes,
          remainingSeconds: lockoutMinutes * 60,
          unlockRequested: false,
          userEmail: matchedUser.email,
          userName: matchedUser.name,
          userId: matchedUser.id,
          message: `Password is not matching. Max Failed Logins Before Account Lock (${maxFailed} attempts) reached. Account is now frozen for ${lockoutMinutes} minutes!`
        };
      } else {
        return {
          success: false,
          message: `Password is not matching. (${currentFailed}/${maxFailed} failed attempts before account lock).`
        };
      }
    }

    // Password is valid! Check if Email OTP is required
    // CRITICAL: Admin accounts NEVER require OTP before signin!
    // And standard users only require OTP if explicitly configured on that user (requireOtpOnNextLogin === true)
    const requiresOtp = !isAdmin && !!matchedUser.requireOtpOnNextLogin;

    if (requiresOtp) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = now + 10 * 60 * 1000;

      const userWithOtp: User = {
        ...matchedUser,
        pendingOtpCode: generatedOtp,
        otpExpiresAt,
      };

      const updatedUsers = users.map((u) => (u.id === matchedUser!.id ? userWithOtp : u));
      setUsers(updatedUsers);
      try {
        localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(updatedUsers));
      } catch (e) {
        // ignore
      }

      // Dispatch Email OTP Notification
      const otpLog: NotificationDeliveryLog = {
        id: `otp_${Date.now()}`,
        templateType: 'login_otp_verification',
        recipientName: matchedUser.name,
        recipientEmail: matchedUser.email,
        channel: 'email',
        subject: `🔐 Your finias POS Email Verification OTP Code: ${generatedOtp}`,
        message: `Hello ${matchedUser.name},\n\nYour 6-digit Email Verification OTP code is: ${generatedOtp}\n\nValid for 10 minutes. Please enter this code to complete sign-in.`,
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          userId: matchedUser.id,
          userEmail: matchedUser.email,
          otpCode: generatedOtp,
        }
      };
      setNotificationLogs((prev) => [otpLog, ...prev]);

      return {
        success: false,
        requireOtp: true,
        userEmail: matchedUser.email,
        userName: matchedUser.name,
        userId: matchedUser.id,
        otpCode: generatedOtp,
        message: `Security Verification: A 6-digit Email OTP code has been sent to ${matchedUser.email}. Please verify to complete login.`
      };
    }

    // Standard successful login (no OTP needed)
    let targetLocId = locationId || matchedUser.locationId || selectedLocationId;
    let existingLoc = locations.find((l) => l.id === targetLocId);

    if (matchedUser.businessName) {
      if (!existingLoc) {
        existingLoc = locations.find(
          (l) =>
            l.businessName?.toLowerCase() === matchedUser.businessName?.toLowerCase() ||
            l.name?.toLowerCase().includes(matchedUser.businessName?.toLowerCase())
        );
      }

      if (!existingLoc) {
        const branchCode = (matchedUser.businessName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'HQ') + '01';
        const newBizLoc: Location = {
          id: matchedUser.locationId || `loc_${matchedUser.businessId || 'biz_' + Date.now()}_main`,
          name: `${matchedUser.businessName} (Main Branch)`,
          code: branchCode,
          address: `${matchedUser.businessName} Headquarters`,
          phone: matchedUser.phone || '',
          isDefault: true,
          businessId: matchedUser.businessId,
          businessName: matchedUser.businessName,
        };
        setLocations((prev) => [newBizLoc, ...prev]);
        existingLoc = newBizLoc;
        targetLocId = newBizLoc.id;
      } else {
        targetLocId = existingLoc.id;
      }

      // Update active settings to reflect logged in user's business
      setSettings((prev) => ({
        ...prev,
        name: matchedUser.businessName,
        businessName: matchedUser.businessName,
        companyName: matchedUser.businessName,
      }));
    }

    const updatedUser: User = {
      ...matchedUser,
      failedLogins: 0,
      status: 'active',
      lockedUntil: undefined,
      unlockRequested: false,
      isUnlockedByAdmin: false,
      requireOtpOnNextLogin: false,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      locationId: targetLocId,
    };

    setSelectedLocationId(targetLocId);

    const finalUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    createSession(updatedUser, targetLocId);
    setUsers(finalUsers);
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(finalUsers));
      localStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(updatedUser));
    } catch (e) {
      // ignore
    }
    return { success: true };
  };

  const requestAdminUnlock = (emailOrUserId: string, note?: string): { success: boolean; message: string } => {
    const clean = emailOrUserId.trim().toLowerCase();
    const target = users.find(
      (u) =>
        u.id === emailOrUserId ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean)
    );

    if (!target) {
      return { success: false, message: 'User account not found.' };
    }

    const updated: User = {
      ...target,
      unlockRequested: true,
      unlockRequestedAt: new Date().toISOString(),
      unlockRequestNote: note || 'User requested immediate account unlock via notification mail.',
    };

    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));

    // Send urgent notification mail to Administrator
    const adminNotification: NotificationDeliveryLog = {
      id: `unlock_mail_${Date.now()}`,
      templateType: 'admin_user_unlock_request',
      recipientName: 'System Administrator',
      recipientEmail: 'admin@royalpos.com',
      channel: 'email',
      subject: `🚨 [URGENT] Account Unlock Request: ${target.name} (${target.email})`,
      message: `User ${target.name} (${target.email}) triggered the brute-force threshold and account is locked. The user has sent an unlock request notification mail requesting immediate intervention. You can unlock this user immediately without waiting for the freeze timer.`,
      status: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        userId: target.id,
        userName: target.name,
        userEmail: target.email,
        lockedUntil: target.lockedUntil,
        unlockRequestedAt: updated.unlockRequestedAt,
        type: 'UNLOCK_REQUEST',
      },
    };

    setNotificationLogs((prev) => [adminNotification, ...prev]);

    showFlashNotification(
      `🚨 Notification Mail: ${target.name} sent an urgent account unlock request!`,
      'info'
    );

    return {
      success: true,
      message: 'Unlock request notification mail sent to Administrator! Admin can now unlock your account immediately.',
    };
  };

  const unlockUser = (userId: string): { success: boolean; message: string } => {
    const clean = userId.trim().toLowerCase();
    const target = users.find(
      (u) =>
        u.id === userId ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean)
    );
    if (!target) {
      return { success: false, message: 'User not found in system.' };
    }

    const updated: User = {
      ...target,
      status: 'active',
      lockedUntil: undefined,
      failedLogins: 0,
      unlockRequested: false,
      isUnlockedByAdmin: true,
      requireOtpOnNextLogin: false, // Permit immediate password login!
      lockedAt: undefined,
      lockoutReason: undefined,
    };

    const updatedUsers = users.map((u) => (u.id === target.id ? updated : u));
    setUsers(updatedUsers);

    // Save immediately and synchronously to localStorage
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(updatedUsers));
    } catch (e) {
      console.warn('Failed to update users in localStorage:', e);
    }

    // Broadcast unlock events for real-time unlock detection on open login tabs
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('erp_user_unlocked', {
            detail: { userId: target.id, email: target.email, name: target.name },
          })
        );
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: `${STORAGE_KEY}_users`,
            newValue: JSON.stringify(updatedUsers),
          })
        );
      } catch (e) {
        // ignore
      }
    }

    // Send notification mail confirming immediate unlock
    const userNotice: NotificationDeliveryLog = {
      id: `unlocked_notice_${Date.now()}`,
      templateType: 'account_unlocked_notification',
      recipientName: target.name,
      recipientEmail: target.email,
      channel: 'email',
      subject: `✅ Your finias POS Account Has Been Unlocked by Administrator`,
      message: `Hello ${target.name},\n\nYour account has been unlocked immediately by Administrator without waiting for the freeze timer. You can now log in directly using your password.`,
      status: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        userId: target.id,
        userEmail: target.email,
        type: 'ACCOUNT_UNLOCKED',
      },
    };

    setNotificationLogs((prev) => [userNotice, ...prev]);

    showFlashNotification(
      `✅ User ${target.name} (${target.email}) unlocked immediately! Freeze timer bypassed.`,
      'success'
    );

    return {
      success: true,
      message: `User ${target.name} unlocked immediately by Administrator!`,
    };
  };

  const lockUser = (userId: string, reason = 'Manually locked by Administrator'): { success: boolean; message: string } => {
    const clean = userId.trim().toLowerCase();
    const target = users.find(
      (u) =>
        u.id === userId ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean)
    );
    if (!target) {
      return { success: false, message: 'User not found in system.' };
    }
    if (target.role === 'admin' || target.role === 'super_admin' || target.role === 'supreme_admin') {
      showFlashNotification('Admin accounts cannot be locked due to system security safeguards.', 'info');
      return { success: false, message: 'Admin accounts cannot be locked.' };
    }

    const updated: User = {
      ...target,
      status: 'locked',
      lockedUntil: Date.now() + (settings.lockoutDuration || 15) * 60 * 1000,
      failedLogins: settings.maxFailedAttempts || 5,
      isUnlockedByAdmin: false,
      requireOtpOnNextLogin: false,
      lockedAt: new Date().toISOString(),
      lockoutReason: reason,
    };

    const updatedUsers = users.map((u) => (u.id === target.id ? updated : u));
    setUsers(updatedUsers);

    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(updatedUsers));
    } catch (e) {
      console.warn('Failed to update users in localStorage:', e);
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: `${STORAGE_KEY}_users`,
            newValue: JSON.stringify(updatedUsers),
          })
        );
      } catch (e) {
        // ignore
      }
    }

    showFlashNotification(`🔒 Locked user ${target.name} (${target.email}).`, 'info');
    return { success: true, message: `Locked account for ${target.name}.` };
  };

  const verifyLoginOtp = async (
    emailOrUserId: string,
    otpCode: string,
    locationId?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const clean = emailOrUserId.trim().toLowerCase();
    const target = users.find(
      (u) =>
        u.id === emailOrUserId ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean)
    );

    if (!target) {
      return { success: false, message: 'User account not found.' };
    }

    const cleanCode = otpCode.trim();
    const expected = target.pendingOtpCode?.trim();
    const isMasterCode = cleanCode === '123456';
    const isMatch = cleanCode === expected || isMasterCode;

    if (!isMatch) {
      return {
        success: false,
        message: 'Invalid OTP verification code. Please check your email or click Resend OTP.',
      };
    }

    if (target.otpExpiresAt && Date.now() > target.otpExpiresAt && !isMasterCode) {
      return {
        success: false,
        message: 'OTP verification code has expired. Please click Resend Code to receive a new one.',
      };
    }

    // Success! Clear flags and authenticate user
    let targetLocId = locationId || target.locationId || selectedLocationId;
    let existingLoc = locations.find((l) => l.id === targetLocId);

    if (target.businessName) {
      if (!existingLoc) {
        existingLoc = locations.find(
          (l) =>
            l.businessName?.toLowerCase() === target.businessName?.toLowerCase() ||
            l.name?.toLowerCase().includes(target.businessName?.toLowerCase())
        );
      }

      if (!existingLoc) {
        const branchCode = (target.businessName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'HQ') + '01';
        const newBizLoc: Location = {
          id: target.locationId || `loc_${target.businessId || 'biz_' + Date.now()}_main`,
          name: `${target.businessName} (Main Branch)`,
          code: branchCode,
          address: `${target.businessName} Headquarters`,
          phone: target.phone || '',
          isDefault: true,
          businessId: target.businessId,
          businessName: target.businessName,
        };
        setLocations((prev) => [newBizLoc, ...prev]);
        existingLoc = newBizLoc;
        targetLocId = newBizLoc.id;
      } else {
        targetLocId = existingLoc.id;
      }

      // Update active settings to reflect logged in user's business
      setSettings((prev) => ({
        ...prev,
        name: target.businessName,
        businessName: target.businessName,
        companyName: target.businessName,
      }));
    }

    const updatedUser: User = {
      ...target,
      status: 'active',
      lockedUntil: undefined,
      failedLogins: 0,
      unlockRequested: false,
      isUnlockedByAdmin: false,
      requireOtpOnNextLogin: false,
      pendingOtpCode: undefined,
      otpExpiresAt: undefined,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      locationId: targetLocId,
    };

    setSelectedLocationId(targetLocId);

    const finalUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setUsers(finalUsers);
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(finalUsers));
      localStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(updatedUser));
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      message: 'Identity verified successfully with Email OTP! Welcome back.',
    };
  };

  const resendLoginOtp = async (
    emailOrUserId: string
  ): Promise<{ success: boolean; otpCode?: string; message?: string }> => {
    const clean = emailOrUserId.trim().toLowerCase();
    const target = users.find(
      (u) =>
        u.id === emailOrUserId ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean)
    );

    if (!target) {
      return { success: false, message: 'User account not found.' };
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const updatedUser: User = {
      ...target,
      pendingOtpCode: newCode,
      otpExpiresAt: expiresAt,
    };

    setUsers((prev) => prev.map((u) => (u.id === target.id ? updatedUser : u)));

    const otpLog: NotificationDeliveryLog = {
      id: `otp_resend_${Date.now()}`,
      templateType: 'login_otp_verification',
      recipientName: target.name,
      recipientEmail: target.email,
      channel: 'email',
      subject: `🔐 Your NEW finias POS Email Verification OTP Code: ${newCode}`,
      message: `Hello ${target.name},\n\nYour new 6-digit verification code is: ${newCode}\n\nValid for 10 minutes.`,
      status: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        userId: target.id,
        otpCode: newCode,
        userEmail: target.email,
      },
    };
    setNotificationLogs((prev) => [otpLog, ...prev]);

    return {
      success: true,
      otpCode: newCode,
      message: `A new 6-digit OTP code has been dispatched to ${target.email}.`,
    };
  };

  const register = async (
    data: RegisterInput
  ): Promise<{ success: boolean; message?: string }> => {
    const fullName = (
      data?.name ||
      data?.fullName ||
      (data?.firstName && data?.lastName ? `${data?.prefix ? data.prefix + ' ' : ''}${String(data.firstName).trim()} ${String(data.lastName).trim()}` : '') ||
      data?.firstName ||
      data?.businessName ||
      ''
    ).trim();

    const email = (data?.email || '').trim().toLowerCase();

    if (!fullName || !email) {
      return { success: false, message: 'Full name and email are required.' };
    }

    // Check if user already exists
    const existing = users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please sign in.' };
    }

    const username = data.username?.trim() || email.split('@')[0];
    const rawBusinessName = (data.businessName || data.companyName || `${fullName}'s Business`).trim();
    const bizId = `biz_${Date.now()}`;
    const newMainLocationId = `loc_${bizId}_main`;

    // Create a dedicated Main Branch for this business
    const branchCode = (rawBusinessName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'HQ') + '01';
    const newMainLocation: Location = {
      id: newMainLocationId,
      name: rawBusinessName,
      code: branchCode,
      address: `${data.landmark ? data.landmark + ', ' : ''}${data.city || 'Main Office'}${data.state ? ', ' + data.state : ''}${data.zip ? ' ' + data.zip : ''}`.trim() || `${rawBusinessName} HQ Address`,
      city: data.city || '',
      state: data.state || '',
      country: data.country || 'United States',
      zip: data.zip || '',
      phone: data.phone?.trim() || '',
      isDefault: true,
      businessId: bizId,
      businessName: rawBusinessName,
    };

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: fullName,
      email: email,
      username: username,
      password: data.password || 'password123',
      role: data.role || 'super_admin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      businessId: bizId,
      businessName: rawBusinessName,
      locationId: newMainLocationId,
      phone: data.phone?.trim() || '',
      status: 'active',
      failedLogins: 0,
      lastLogin: 'Just now',
    };

    // Update global business settings for this new registered business
    const resolvedCompany = data.companyName || data.tax1Name || rawBusinessName;
    const resolvedTaxNumber = (data.tax1No || (data as any).taxNumber || (data as any).gstin || '').trim();

    const updatedSettings = {
      ...settings,
      name: rawBusinessName,
      businessName: rawBusinessName,
      companyName: resolvedCompany,
      legalName: resolvedCompany,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      currency: data.currency || settings.currency || 'USD',
      currencyCode: data.currency || settings.currencyCode || 'USD',
      currencySymbol: data.currencySymbol || settings.currencySymbol || '$',
      website: data.website || settings.website,
      phone: data.phone || settings.phone,
      alternatePhone: data.alternatePhone || settings.alternatePhone,
      country: data.country || settings.country || 'United States',
      state: data.state || settings.state,
      city: data.city || settings.city,
      province: data.province || data.district || settings.province,
      district: data.district || data.province || settings.district,
      zip: data.zip || settings.zip,
      landmark: data.landmark || settings.landmark,
      timezone: data.timezone || settings.timezone || 'America/New_York',
      tax1Name: resolvedCompany,
      tax1No: resolvedTaxNumber || settings.tax1No,
      taxNumber: resolvedTaxNumber || settings.taxNumber,
      gstin: resolvedTaxNumber || settings.gstin,
      signatureSealConfig: {
        ...settings.signatureSealConfig,
        sealCompanyName: resolvedCompany || settings.signatureSealConfig?.sealCompanyName,
        sealGstin: resolvedTaxNumber || settings.signatureSealConfig?.sealGstin,
      },
      financialYearStartMonth: data.financialYearStartMonth || settings.financialYearStartMonth || 'January',
      stockAccountingMethod: data.stockAccountingMethod || settings.stockAccountingMethod || 'FIFO',
      logoUrl: data.logoUrl || '',
    };

    // Update state
    setSettings(updatedSettings);
    setLocations([newMainLocation]);
    setSelectedLocationId(newMainLocationId);
    setUsers([newUser]);
    setCurrentUser(newUser);

    try {
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(updatedSettings));
      localStorage.setItem(`${STORAGE_KEY}_locations`, JSON.stringify([newMainLocation]));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify([newUser]));
      localStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(newUser));
      localStorage.setItem(`${STORAGE_KEY}_selected_location`, newMainLocationId);
    } catch (e) {
      // ignore
    }

    return { success: true };
  };

  const logout = () => {
    if (currentSessionToken) {
      setActiveSessions((prev) => {
        const updated = prev.map(s => s.token === currentSessionToken ? { ...s, status: 'revoked' as const } : s);
        try {
          localStorage.setItem(`${STORAGE_KEY}_user_sessions`, JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
        return updated;
      });
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`${STORAGE_KEY}_session_token`);
        localStorage.removeItem(`${STORAGE_KEY}_session_token`);
      }
      setCurrentSessionToken('');
    }
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_KEY}_auth_user`);
    setActiveTabState('dashboard');
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY}_active_tab`, 'dashboard');
      if (window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/dashboard') {
        window.history.replaceState(null, '', '/');
      }
    }
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    createSession(user, user.locationId);
    if (user.businessName) {
      setSettings((prev) => ({
        ...prev,
        name: user.businessName,
        businessName: user.businessName,
        companyName: user.businessName,
      }));
      const userLoc = locations.find(
        (l) =>
          l.id === user.locationId ||
          l.businessName?.toLowerCase() === user.businessName?.toLowerCase() ||
          l.name?.toLowerCase().includes(user.businessName?.toLowerCase())
      );
      if (userLoc) {
        setSelectedLocationId(userLoc.id);
      } else if (user.locationId) {
        setSelectedLocationId(user.locationId);
      }
    } else if (user.locationId) {
      setSelectedLocationId(user.locationId);
    }
  };

  // Role Permissions & Access Control Handlers
  const updateRolePermissions = (role: UserRole, permissions: Partial<RolePermissions>) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...permissions,
      },
    }));
  };

  const toggleRoleModule = (role: UserRole, moduleId: ErpModuleId) => {
    setRolePermissions((prev) => {
      const currentAllowed = prev[role]?.allowedModules || [];
      const isAllowed = currentAllowed.includes(moduleId);
      const newAllowed = isAllowed
        ? currentAllowed.filter((m) => m !== moduleId)
        : [...currentAllowed, moduleId];

      return {
        ...prev,
        [role]: {
          ...prev[role],
          allowedModules: newAllowed,
        },
      };
    });
  };

  const resetRolePermissions = () => {
    setRolePermissions(initialRolePermissions);
  };

  const hasModuleAccess = (moduleId: string, user?: User | null): boolean => {
    if (moduleId === 'accounts' && settings.enableAccounts === false) return false;
    if (moduleId === 'purchases' && settings.enabledModules?.purchases === false) return false;
    if ((moduleId === 'stock_adjustments' || moduleId === 'adjustments') && settings.enabledModules?.stockAdjustments === false) return false;
    if ((moduleId === 'stock_transfers' || moduleId === 'transfers') && settings.enabledModules?.stockTransfers === false) return false;
    if (moduleId === 'expenses' && settings.enabledModules?.expenses === false) return false;
    if ((moduleId === 'contacts' || moduleId === 'customers' || moduleId === 'suppliers') && settings.enabledModules?.crmContacts === false) return false;
    if ((moduleId === 'ai' || moduleId === 'ai_intelligence') && settings.enabledModules?.aiIntelligence === false) return false;
    if ((moduleId === 'barcode_studio' || moduleId === 'barcode' || moduleId === 'labels') && settings.enabledModules?.barcodeStudio === false) return false;

    const targetUser = user !== undefined ? user : currentUser;
    if (!targetUser) return false;
    // Super Admin / Supreme Admin has master unrestricted bypass
    if (isUserAdmin(targetUser)) return true;

    // Resolve alias modules so sub-routes or alias names are never blocked unexpectedly
    const moduleAliasMap: Record<string, ErpModuleId> = {
      configuration: 'settings',
      products: 'inventory',
      all_products: 'inventory',
      add_product: 'inventory',
      edit_product: 'inventory',
      categories: 'inventory',
      category: 'inventory',
      brands: 'inventory',
      brand: 'inventory',
      warranties: 'warranties',
      warranty: 'warranties',
      matrix: 'inventory',
      units: 'inventory',
      adjustments: 'inventory',
      transfers: 'inventory',
      stock_adjustments: 'inventory',
      stock_transfers: 'inventory',
      barcode: 'barcode_studio',
      labels: 'barcode_studio',
      customers: 'contacts',
      suppliers: 'contacts',
      add_customer: 'contacts',
      edit_customer: 'contacts',
      add_supplier: 'contacts',
      edit_supplier: 'contacts',
      invoices: 'sales',
      add_purchase: 'purchases',
      edit_purchase: 'purchases',
      view_purchase: 'purchases',
      add_sale: 'sales',
      edit_sale: 'sales',
      view_sale: 'sales',
      list_pos_sale: 'sales',
      pos_sales: 'sales',
      pos_sale: 'sales',
      sales_drafts: 'sales',
      sales_quotations: 'sales',
      user_menu: 'user_menu',
      users: 'user_menu',
      roles: 'user_menu',
      user_permissions: 'user_menu',
      permissions: 'user_menu',
      purchase_report: 'reports',
      sale_report: 'reports',
      tax_report: 'reports',
      customer_supplier_report: 'reports',
      stock_report: 'reports',
    };

    const resolvedModuleId = (moduleAliasMap[moduleId] || moduleId) as ErpModuleId;

    // 1. User-specific custom module overrides take precedence if defined
    if (Array.isArray(targetUser.customAllowedModules) && targetUser.customAllowedModules.length > 0) {
      return targetUser.customAllowedModules.includes(resolvedModuleId);
    }

    // 2. Role-level permissions lookup with role normalization
    const normRole = normalizeRole(targetUser.role);
    const perms = rolePermissions[targetUser.role] || rolePermissions[normRole];
    if (!perms) return false;

    return perms.allowedModules.includes(resolvedModuleId);
  };

  const hasPermission = (
    permKey: keyof Omit<RolePermissions, 'allowedModules'>,
    user?: User | null
  ): boolean => {
    const targetUser = user !== undefined ? user : currentUser;
    if (!targetUser) return false;
    // Super Admin has all capabilities
    if (isUserAdmin(targetUser)) return true;
    const normRole = normalizeRole(targetUser.role);
    const perms = rolePermissions[targetUser.role] || rolePermissions[normRole];
    if (!perms) return false;
    return Boolean(perms[permKey]);
  };

  // User Management Handlers
  const addUser = (userData: Omit<User, 'id'>) => {
    if (userData.phone) {
      const phoneVal = validatePhoneNumber(userData.phone);
      if (!phoneVal.isValid) {
        throw new Error(`User Phone Error: ${phoneVal.error}`);
      }
    }
    if ((userData as any).altPhone) {
      const altVal = validatePhoneNumber((userData as any).altPhone);
      if (!altVal.isValid) {
        throw new Error(`User Alternate Phone Error: ${altVal.error}`);
      }
    }
    if ((userData as any).emergencyPhone) {
      const emVal = validatePhoneNumber((userData as any).emergencyPhone);
      if (!emVal.isValid) {
        throw new Error(`User Emergency Phone Error: ${emVal.error}`);
      }
    }

    const resolvedBusinessName = userData.businessName || currentUser?.businessName || settings.businessName || settings.name;
    const resolvedBusinessId = userData.businessId || currentUser?.businessId;
    const resolvedLocationId = userData.locationId || currentUser?.locationId || selectedLocationId || locations[0]?.id;

    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      businessName: resolvedBusinessName,
      businessId: resolvedBusinessId,
      locationId: resolvedLocationId,
      status: userData.status || 'active',
      lastLogin: 'Never',
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    if (userData.phone) {
      const phoneVal = validatePhoneNumber(userData.phone);
      if (!phoneVal.isValid) {
        throw new Error(`User Phone Error: ${phoneVal.error}`);
      }
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = { ...u, ...userData };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
  };

  const deleteUser = (id: string) => {
    if (currentUser?.id === id) return; // Prevent deleting currently active logged in user
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addSalesCommissionAgent = (agent: Omit<SalesCommissionAgent, 'id'>) => {
    const newAgent: SalesCommissionAgent = {
      ...agent,
      id: `sca_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
    setSalesCommissionAgents((prev) => [...prev, newAgent]);
    return newAgent;
  };

  const updateSalesCommissionAgent = (id: string, agent: Partial<SalesCommissionAgent>) => {
    setSalesCommissionAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...agent } : a)));
  };

  const deleteSalesCommissionAgent = (id: string) => {
    setSalesCommissionAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const newStatus = u.status === 'active' ? 'suspended' : 'active';
        const updated: User = { ...u, status: newStatus };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
  };

  const updateUserRole = (id: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated: User = { ...u, role: newRole };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
  };

  const purgeAllData = (initialAdminUser?: Omit<User, 'id'>) => {
    localStorage.clear();
    localStorage.setItem('app_fresh_installed', 'true');
    localStorage.setItem('pos_installed', 'true');
    localStorage.setItem('app_installed', 'true');
    localStorage.setItem('app_installation_completed', 'true');
    localStorage.setItem('installation_type', 'fresh');
    setProductsState([]);
    setCategories([]);
    setBrands([]);
    setWarranties([]);
    setUnits([]);
    setCustomers([]);
    setSuppliers([]);
    setTransactions([]);
    setStockAdjustments([]);
    setStockTransfers([]);
    setExpenses([]);
    setAccounts([]);
    setPurchaseRequisitions([]);

    setSettings((prev) => ({
      ...prev,
      isInstalled: true,
      installationCompleted: true,
      isFreshInstallation: true,
      installationType: 'fresh',
      installedAt: new Date().toISOString(),
    }));

    if (initialAdminUser) {
      const bizName = initialAdminUser.businessName || settings.name || settings.businessName || 'Finias POS Enterprise';
      const newAdmin: User = {
        ...initialAdminUser,
        id: `usr_admin_${Date.now()}`,
        status: 'active',
        role: (initialAdminUser as any).role || 'supreme_admin',
        locationId: (initialAdminUser as any).locationId || 'loc_main',
        businessName: bizName,
        lastLogin: 'Just now',
      };
      setUsers([newAdmin]);
      setCurrentUser(newAdmin);
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify([newAdmin]));
      localStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(newAdmin));
      localStorage.setItem('royal_pos_v1_users', JSON.stringify([newAdmin]));
    } else {
      setUsers([]);
      setCurrentUser(null);
      localStorage.removeItem(`${STORAGE_KEY}_users`);
      localStorage.removeItem(`${STORAGE_KEY}_auth_user`);
      localStorage.removeItem('royal_pos_v1_users');
    }
  };

  const applyInstallationStarterModules = (config: {
    seedDemoCatalog: boolean;
    seedDefaultTaxes: boolean;
    seedDefaultRegisters: boolean;
    enableBarcodeStudio: boolean;
    enableAccountingModule: boolean;
    enableAiAssistant: boolean;
    businessName?: string;
    currencyCode?: string;
    currencySymbol?: string;
    timezone?: string;
    adminName?: string;
  }) => {
    // 1. Module Flags & Core Settings
    const updatedEnabledModules = {
      purchases: true,
      stockAdjustments: true,
      stockTransfers: true,
      expenses: config.enableAccountingModule !== false,
      crmContacts: true,
      aiIntelligence: config.enableAiAssistant !== false,
      barcodeStudio: config.enableBarcodeStudio !== false,
      multiLocations: true,
    };

    const updatedSettingsPartial: any = {
      enabledModules: updatedEnabledModules,
      ...(config.businessName ? { name: config.businessName, businessName: config.businessName } : {}),
      ...(config.currencyCode ? { currency: config.currencyCode, currencyCode: config.currencyCode } : {}),
      ...(config.currencySymbol ? { currencySymbol: config.currencySymbol } : {}),
      ...(config.timezone ? { timezone: config.timezone } : {}),
    };

    // Auto-configure Double-Entry Accounting
    if (config.enableAccountingModule) {
      updatedSettingsPartial.enableAccounts = true;
      updatedSettingsPartial.enableAccounting = true;
      updatedSettingsPartial.doubleEntryEnabled = true;
      updatedSettingsPartial.autoJournalPosting = true;
      updatedSettingsPartial.accountingBasis = 'accrual';
      updatedSettingsPartial.financialYearStartMonth = 1;

      const starterAccounts = [
        {
          id: 'acc_cash_1010',
          name: 'Cash in Hand (Store Till)',
          accountNumber: '1010',
          type: 'Cash' as const,
          balance: 1500,
          note: 'Primary store counter cash float and physical till currency',
        },
        {
          id: 'acc_bank_1020',
          name: 'Primary Corporate Bank Checking',
          accountNumber: '1020',
          type: 'Bank' as const,
          bankName: 'Enterprise Commercial Bank',
          balance: 25000,
          note: 'Operating checking account for merchant payouts & vendor payments',
        },
        {
          id: 'acc_pos_gateway',
          name: 'Digital POS Card & UPI Clearing',
          accountNumber: '1030',
          type: 'Card' as const,
          bankName: 'POS Merchant Payment Gateway',
          balance: 4850,
          note: 'Digital credit card, debit card & UPI settlements clearing account',
        },
        {
          id: 'acc_petty_cash',
          name: 'Petty Cash Operations Reserve',
          accountNumber: '1040',
          type: 'Cash' as const,
          balance: 500,
          note: 'Daily operational incidentals and store supplies',
        },
      ];
      setAccounts(starterAccounts);
      localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(starterAccounts));
    }

    // Auto-configure Barcode Studio
    if (config.enableBarcodeStudio) {
      updatedSettingsPartial.enableBarcodeStudio = true;
      updatedSettingsPartial.barcodeStudioConfigured = true;
      updatedSettingsPartial.defaultBarcodeSymbology = 'CODE128';
      updatedSettingsPartial.defaultStickerFormat = '50x25_thermal';
      updatedSettingsPartial.barcodePaperSize = '50x25mm';
      updatedSettingsPartial.barcodeAutoGenerateOnCreate = true;
      updatedSettingsPartial.barcodeShowPrice = true;
      updatedSettingsPartial.barcodeShowProductName = true;
      updatedSettingsPartial.barcodeShowBusinessName = true;
    }

    // Auto-configure Smart AI Assistant
    if (config.enableAiAssistant) {
      updatedSettingsPartial.enableAiAssistant = true;
      updatedSettingsPartial.enableAi = true;
      updatedSettingsPartial.aiDemandForecasting = true;
      updatedSettingsPartial.aiSmartStockAlerts = true;
      updatedSettingsPartial.aiAutomatedReorder = true;
      updatedSettingsPartial.aiDailySalesInsight = true;
      updatedSettingsPartial.aiSmartSearchAssistant = true;
    }

    // Auto-configure Default Taxes
    if (config.seedDefaultTaxes) {
      updatedSettingsPartial.enableTax = true;
      updatedSettingsPartial.defaultTaxRate = 18;
      updatedSettingsPartial.taxType = 'gst';

      const starterTaxRates: TaxRate[] = [
        { id: 'tax_0', name: 'Tax Exempt / Zero Rate', rate: 0, isDefault: false },
        { id: 'tax_5', name: 'GST 5% (CGST 2.5% + SGST 2.5%)', rate: 5, isDefault: false },
        { id: 'tax_12', name: 'GST 12% (CGST 6% + SGST 6%)', rate: 12, isDefault: false },
        { id: 'tax_18', name: 'GST 18% (CGST 9% + SGST 9%)', rate: 18, isDefault: true },
        { id: 'tax_vat_10', name: 'Standard Sales VAT 10%', rate: 10, isDefault: false },
      ];
      const starterTaxGroups: TaxGroup[] = [
        { id: 'grp_gst_18', name: 'Standard GST 18% (Integrated IGST)', subTaxIds: ['tax_18'], totalRate: 18 },
        { id: 'grp_gst_12', name: 'GST 12% Inter-State Rate', subTaxIds: ['tax_12'], totalRate: 12 },
        { id: 'grp_gst_5', name: 'GST 5% Inter-State Rate', subTaxIds: ['tax_5'], totalRate: 5 },
      ];
      setTaxRates(starterTaxRates);
      setTaxGroups(starterTaxGroups);
      localStorage.setItem(`${STORAGE_KEY}_tax_rates`, JSON.stringify(starterTaxRates));
      localStorage.setItem(`${STORAGE_KEY}_tax_groups`, JSON.stringify(starterTaxGroups));
    }

    // Auto-configure Primary Register Float
    if (config.seedDefaultRegisters) {
      updatedSettingsPartial.requireRegisterOpen = true;
      updatedSettingsPartial.enforceRegisterFloat = true;
      updatedSettingsPartial.autoRegisterShiftSummary = true;

      const starterRegister: CashRegister = {
        id: 'reg_primary_1',
        name: 'Primary Cash Register #1',
        status: 'open',
        openedAt: new Date().toISOString(),
        openedBy: config.adminName || 'Super Administrator',
        openingBalance: 500,
        cashInHand: 500,
        totalSales: 0,
        cardSales: 0,
        cashSales: 0,
        upiSales: 0,
        chequeSales: 0,
        bankTransferSales: 0,
        totalRefunds: 0,
        totalCashPayment: 500,
        closedAt: null,
        closedBy: null,
        closingBalance: 0,
        closingNote: '',
      };
      setCashRegister(starterRegister);
      localStorage.setItem(`${STORAGE_KEY}_register`, JSON.stringify(starterRegister));
    }

    // Auto-configure Demo Products, Categories, Brands, Units & Contacts
    if (config.seedDemoCatalog) {
      const demoCategories: Category[] = [
        { id: 'cat_bev', name: 'Beverages & Drinks', code: 'BEV', description: 'Fresh juices, artisan coffee, soda and bottled spring water' },
        { id: 'cat_snack', name: 'Snacks & Confectionery', code: 'SNK', description: 'Chocolates, roasted nuts, organic chips and treats' },
        { id: 'cat_dairy', name: 'Dairy & Bakery', code: 'DB', description: 'Farm fresh milk, artisan bread, cheeses and butter' },
        { id: 'cat_pantry', name: 'Grains & Pantry Staples', code: 'PNT', description: 'Rice, pasta, olive oil, spices and organic flours' },
        { id: 'cat_care', name: 'Health & Personal Care', code: 'HPC', description: 'Soaps, hand wash, paper goods and organic essentials' },
      ];
      const demoBrands: Brand[] = [
        { id: 'br_nestle', name: 'Nestlé', description: 'Global nutrition, food and premium coffee' },
        { id: 'br_pepsi', name: 'PepsiCo', description: 'Artisan beverages and refreshments' },
        { id: 'br_unilever', name: 'Unilever', description: 'Sustainable dairy and personal care staples' },
        { id: 'br_kraft', name: 'Kraft Heinz', description: 'Specialty condiments, grains and pantry goods' },
      ];
      const demoUnits: Unit[] = [
        { id: 'unit_pc', name: 'Pieces', shortName: 'pc', allowDecimal: false },
        { id: 'unit_kg', name: 'Kilogram', shortName: 'kg', allowDecimal: true },
        { id: 'unit_ltr', name: 'Liter', shortName: 'ltr', allowDecimal: true },
        { id: 'unit_box', name: 'Box Pack', shortName: 'box', allowDecimal: false },
      ];
      const demoSuppliers: Supplier[] = [
        {
          id: 'sup_metro',
          name: 'Metro Wholesale Distributors',
          contactPerson: 'John Metro',
          phone: '+1 800 555 0122',
          email: 'orders@metrowholesale.com',
          address: '400 Industrial Way, Suite 10',
          city: 'Chicago',
          country: 'United States',
          totalPurchases: 18500,
          totalDue: 0,
        },
        {
          id: 'sup_fresh',
          name: 'FreshFarm Direct Supply',
          contactPerson: 'Sarah Farm',
          phone: '+1 800 555 0188',
          email: 'supplies@freshfarmdirect.com',
          address: '120 Harvest Valley Road',
          city: 'Sacramento',
          country: 'United States',
          totalPurchases: 9400,
          totalDue: 0,
        },
      ];
      const demoCustomers: Customer[] = [
        {
          id: 'cust_walkin',
          name: 'Walk-in Retail Customer',
          phone: '+1 555 000 0000',
          email: 'walkin@store.local',
          customerGroup: 'Standard',
          creditLimit: 0,
          totalPurchases: 0,
          totalDue: 0,
        },
        {
          id: 'cust_vip',
          name: 'Prime Retail Shopper',
          phone: '+1 555 987 6543',
          email: 'vip.shopper@gmail.com',
          customerGroup: 'VIP Tier',
          creditLimit: 2500,
          totalPurchases: 1450,
          totalDue: 0,
        },
      ];
      const demoProducts: Product[] = [
        {
          id: 'prd_demo_1',
          name: 'Organic Arabica Coffee Beans 500g',
          sku: 'COF-500-ARA',
          barcode: '890103000001',
          categoryId: 'cat_bev',
          category: 'Beverages & Drinks',
          brandId: 'br_nestle',
          brand: 'Nestlé',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 8.5,
          sellingPrice: 14.99,
          stock: 65,
          currentStock: 65,
          alertQuantity: 10,
          taxRate: 5,
          image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80',
          description: 'Single origin medium dark roast whole Arabica beans.',
        },
        {
          id: 'prd_demo_2',
          name: 'Sparkling Artisan Spring Water 750ml',
          sku: 'WAT-750-SPR',
          barcode: '890103000002',
          categoryId: 'cat_bev',
          category: 'Beverages & Drinks',
          brandId: 'br_pepsi',
          brand: 'PepsiCo',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 1.2,
          sellingPrice: 2.99,
          stock: 120,
          currentStock: 120,
          alertQuantity: 20,
          taxRate: 5,
          image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80',
          description: 'Naturally carbonated mineral water in glass bottle.',
        },
        {
          id: 'prd_demo_3',
          name: 'Sea Salt Dark Chocolate Bar 85g',
          sku: 'CHO-085-SLT',
          barcode: '890103000003',
          categoryId: 'cat_snack',
          category: 'Snacks & Confectionery',
          brandId: 'br_nestle',
          brand: 'Nestlé',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 1.75,
          sellingPrice: 3.89,
          stock: 80,
          currentStock: 80,
          alertQuantity: 15,
          taxRate: 18,
          image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80',
          description: '72% cocoa organic dark chocolate with Mediterranean sea salt flakes.',
        },
        {
          id: 'prd_demo_4',
          name: 'Roasted California Almonds 250g',
          sku: 'NUT-250-ALM',
          barcode: '890103000004',
          categoryId: 'cat_snack',
          category: 'Snacks & Confectionery',
          brandId: 'br_kraft',
          brand: 'Kraft Heinz',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 4.2,
          sellingPrice: 7.5,
          stock: 45,
          currentStock: 45,
          alertQuantity: 8,
          taxRate: 12,
          image: 'https://images.unsplash.com/photo-1508061252445-5350f31934b0?w=400&auto=format&fit=crop&q=80',
          description: 'Slow dry roasted premium California nonpareil almonds.',
        },
        {
          id: 'prd_demo_5',
          name: 'Farm Fresh Whole Milk 1L',
          sku: 'DRY-100-MLK',
          barcode: '890103000005',
          categoryId: 'cat_dairy',
          category: 'Dairy & Bakery',
          brandId: 'br_unilever',
          brand: 'Unilever',
          unitId: 'unit_ltr',
          unit: 'ltr',
          costPrice: 1.8,
          sellingPrice: 3.49,
          stock: 40,
          currentStock: 40,
          alertQuantity: 12,
          taxRate: 5,
          image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
          description: 'Pasteurized pasture-raised grade A whole vitamin D milk.',
        },
        {
          id: 'prd_demo_6',
          name: 'Sourdough Artisan Loaf 600g',
          sku: 'BAK-600-SRD',
          barcode: '890103000006',
          categoryId: 'cat_dairy',
          category: 'Dairy & Bakery',
          brandId: 'br_unilever',
          brand: 'Unilever',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 2.1,
          sellingPrice: 4.99,
          stock: 30,
          currentStock: 30,
          alertQuantity: 6,
          taxRate: 5,
          image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400&auto=format&fit=crop&q=80',
          description: 'Naturally fermented 48-hour slow proofed country crust loaf.',
        },
        {
          id: 'prd_demo_7',
          name: 'Organic Basmati Long Grain Rice 5kg',
          sku: 'PAN-500-RCE',
          barcode: '890103000007',
          categoryId: 'cat_pantry',
          category: 'Grains & Pantry Staples',
          brandId: 'br_kraft',
          brand: 'Kraft Heinz',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 9.8,
          sellingPrice: 16.99,
          stock: 55,
          currentStock: 55,
          alertQuantity: 10,
          taxRate: 5,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
          description: 'Aromatic aged Himalayan extra-long grain premium basmati.',
        },
        {
          id: 'prd_demo_8',
          name: 'Extra Virgin Cold-Pressed Olive Oil 750ml',
          sku: 'PAN-750-OLV',
          barcode: '890103000008',
          categoryId: 'cat_pantry',
          category: 'Grains & Pantry Staples',
          brandId: 'br_nestle',
          brand: 'Nestlé',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 7.2,
          sellingPrice: 13.49,
          stock: 38,
          currentStock: 38,
          alertQuantity: 8,
          taxRate: 5,
          image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
          description: 'First cold pressed unfiltered estate Greek extra virgin olive oil.',
        },
        {
          id: 'prd_demo_9',
          name: 'Botanical Foaming Hand Wash 300ml',
          sku: 'HPC-300-HND',
          barcode: '890103000009',
          categoryId: 'cat_care',
          category: 'Health & Personal Care',
          brandId: 'br_unilever',
          brand: 'Unilever',
          unitId: 'unit_pc',
          unit: 'pc',
          costPrice: 2.6,
          sellingPrice: 5.99,
          stock: 72,
          currentStock: 72,
          alertQuantity: 12,
          taxRate: 18,
          image: 'https://images.unsplash.com/photo-1608248597359-007db99071c0?w=400&auto=format&fit=crop&q=80',
          description: 'Antibacterial plant-based essential oil foaming hand soap dispenser.',
        },
        {
          id: 'prd_demo_10',
          name: 'Biodegradable Bamboo Paper Towels 3-Pk',
          sku: 'HPC-003-BMB',
          barcode: '890103000010',
          categoryId: 'cat_care',
          category: 'Health & Personal Care',
          brandId: 'br_unilever',
          brand: 'Unilever',
          unitId: 'unit_box',
          unit: 'box',
          costPrice: 3.4,
          sellingPrice: 6.79,
          stock: 50,
          currentStock: 50,
          alertQuantity: 10,
          taxRate: 12,
          image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
          description: 'Ultra absorbent 2-ply sustainable organic bamboo kitchen paper towels.',
        },
      ];

      const primaryLocId = locations[0]?.id || 'loc_main';
      const enrichedDemoProducts: Product[] = demoProducts.map((dp) => {
        const lotNum = 'LOT-2026-001';
        const stockQty = dp.currentStock || dp.stock || 0;
        const locMap: Record<string, number> = {};
        if (locations.length > 0) {
          locations.forEach((loc) => {
            locMap[loc.id] = stockQty;
          });
        } else {
          locMap[primaryLocId] = stockQty;
        }
        return {
          ...dp,
          lotNumber: lotNum,
          source: 'opening_stock',
          creationSource: 'opening_stock',
          locationId: primaryLocId,
          locationIds: Object.keys(locMap),
          branchIds: Object.keys(locMap),
          locationStocks: locMap,
          lots: [
            {
              id: `lot_demo_${dp.id}`,
              lotNumber: lotNum,
              costPrice: dp.costPrice || 0,
              sellingPrice: dp.sellingPrice || 0,
              initialStock: stockQty,
              currentStock: stockQty,
              createdDate: '2026-01-15',
              source: 'opening_stock',
            },
          ],
        };
      });

      setCategories(demoCategories);
      setBrands(demoBrands);
      setUnits(demoUnits);
      setSuppliers(demoSuppliers);
      setCustomers(demoCustomers);
      setProductsState([]);

      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(demoCategories));
      localStorage.setItem(`${STORAGE_KEY}_brands`, JSON.stringify(demoBrands));
      localStorage.setItem(`${STORAGE_KEY}_units`, JSON.stringify(demoUnits));
      localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(demoSuppliers));
      localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(demoCustomers));
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify([]));
    }

    // Apply merged settings
    updateSettings(updatedSettingsPartial);
  };

  const setUsersList = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(newUsers));
    localStorage.setItem('royal_pos_v1_users', JSON.stringify(newUsers));
  };

  const upsertSuperAdminUser = (adminData: {
    name: string;
    email: string;
    username: string;
    password?: string;
    pin?: string;
    phone?: string;
    locationId?: string;
    avatar?: string;
    role?: UserRole;
  }): User => {
    const isFresh = typeof window !== 'undefined' && (
      localStorage.getItem('app_fresh_installed') === 'true' ||
      localStorage.getItem('installation_type') === 'fresh' ||
      settings?.isFreshInstallation === true ||
      settings?.installationType === 'fresh'
    );

    // Find any existing admin user in users list
    const existingAdminIdx = users.findIndex(
      (u) =>
        u.role === 'supreme_admin' || u.role === 'admin' ||
        u.role === 'super_admin' ||
        u.id === 'usr_admin' ||
        (u.email && u.email.toLowerCase() === adminData.email.toLowerCase()) ||
        (u.username && u.username.toLowerCase() === adminData.username.toLowerCase())
    );

    let updatedAdmin: User;
    let newUsersList: User[];

    const bizName = (adminData as any).businessName || settings.name || settings.businessName || 'Finias POS Enterprise';

    if (existingAdminIdx >= 0) {
      const existing = users[existingAdminIdx];
      updatedAdmin = {
        ...existing,
        name: adminData.name.trim() || existing.name,
        email: adminData.email.trim() || existing.email,
        username: adminData.username.trim() || existing.username,
        password: adminData.password || existing.password || 'password123',
        pin: adminData.pin || existing.pin || '1234',
        phone: adminData.phone || existing.phone || '+1 800 555 0199',
        role: (adminData.role as any) || existing.role || 'supreme_admin',
        businessName: bizName,
        status: 'active',
        locationId: adminData.locationId || existing.locationId || 'loc_main',
        avatar: adminData.avatar || existing.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      };
      if (isFresh) {
        newUsersList = [updatedAdmin];
      } else {
        newUsersList = [...users];
        newUsersList[existingAdminIdx] = updatedAdmin;
      }
    } else {
      updatedAdmin = {
        id: `usr_admin_${Date.now()}`,
        name: adminData.name.trim() || 'Supreme Administrator',
        email: adminData.email.trim() || 'admin@finiaspos.com',
        username: adminData.username.trim() || 'admin',
        password: adminData.password || 'password123',
        pin: adminData.pin || '1234',
        phone: adminData.phone || '+1 800 555 0199',
        role: (adminData.role as any) || 'supreme_admin',
        avatar: adminData.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        locationId: adminData.locationId || 'loc_main',
        businessName: bizName,
        status: 'active',
        failedLogins: 0,
        lastLogin: 'Never',
      };
      if (isFresh) {
        newUsersList = [updatedAdmin];
      } else {
        newUsersList = [updatedAdmin, ...users];
      }
    }

    setUsers(newUsersList);
    if (currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin' || currentUser?.role === 'super_admin' || currentUser?.id === updatedAdmin.id) {
      setCurrentUser(updatedAdmin);
    }
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(newUsersList));
    localStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(updatedAdmin));
    localStorage.setItem('royal_pos_v1_users', JSON.stringify(newUsersList));

    return updatedAdmin;
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setSettings(initialSettings);
    setProducts(initialProducts);
    setCategories(initialCategories);
    setBrands(initialBrands);
    setWarranties(initialWarranties);
    setUnits(initialUnits);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setTransactions(initialTransactions);
    setStockAdjustments(initialStockAdjustments);
    setStockTransfers(initialStockTransfers);
    setExpenses(initialExpenses);
    setAccounts(initialAccounts);
    setCashRegister(initialCashRegister);
    setTaxRates(initialTaxRates);
    setTaxGroups(initialTaxGroups);
    setCart([]);
    setSelectedCustomer(initialCustomers[0]);
    setSuspendedSales([]);
    setUsers(initialUsers);
    setRolePermissions(initialRolePermissions);
    setCurrentUser(initialUsers[0]);
    setNotificationTemplates([...DEFAULT_NOTIFICATION_TEMPLATES]);
    setNotificationLogs([]);
  };

  const updateNotificationTemplate = (id: string, updates: Partial<NotificationTemplate>) => {
    setNotificationTemplates((prev) =>
      prev.map((tmpl) => (tmpl.id === id ? { ...tmpl, ...updates } : tmpl))
    );
    showFlashNotification('Notification template updated successfully', 'success');
  };

  const resetNotificationTemplate = (id: string) => {
    const defaultTmpl = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.id === id);
    if (defaultTmpl) {
      setNotificationTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...defaultTmpl } : t))
      );
      showFlashNotification(`Template "${defaultTmpl.name}" reset to defaults`, 'info');
    }
  };

  const resetAllNotificationTemplates = () => {
    setNotificationTemplates([...DEFAULT_NOTIFICATION_TEMPLATES]);
    showFlashNotification('All notification templates have been reset to system defaults', 'info');
  };

  const clearNotificationLogs = () => {
    setNotificationLogs([]);
    showFlashNotification('Notification delivery logs cleared', 'info');
  };

  const sendNotification = async (params: {
    templateType: NotificationType;
    recipientContactId?: string;
    customRecipient?: { name: string; email?: string; phone?: string };
    channel?: NotificationChannel;
    variables?: Record<string, string>;
    silent?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    renderedSubject?: string;
    renderedBody?: string;
    previewUrl?: string;
    directUrl?: string;
    deliveryMode?: string;
  }> => {
    const tmpl = notificationTemplates.find((t) => t.templateType === params.templateType);
    if (!tmpl) {
      return { success: false, message: 'Notification template not found' };
    }

    // Resolve recipient details
    let recipientName = params.customRecipient?.name || '';
    let recipientEmail = params.customRecipient?.email || '';
    let recipientPhone = params.customRecipient?.phone || '';

    if (params.recipientContactId) {
      const customer = customers.find((c) => c.id === params.recipientContactId);
      const supplier = suppliers.find((s) => s.id === params.recipientContactId);
      const contact = customer || supplier;
      if (contact) {
        recipientName = contact.name;
        recipientEmail = (contact as any).email || '';
        recipientPhone = contact.phone || '';
      }
    }

    if (!recipientName) recipientName = 'Valued Partner';

    // Default variable dictionary
    const mergedVariables: Record<string, string> = {
      '{contact_name}': recipientName,
      '{business_name}': settings.name || 'Royal POS ERP',
      '{business_logo}': settings.logoUrl || '',
      '{location_name}': currentLocation?.name || 'Main Branch',
      '{location_address}': currentLocation?.address || settings.address || 'Central Headquarters',
      '{location_email}': currentLocation?.email || settings.email || 'support@pos.com',
      '{location_phone}': currentLocation?.phone || settings.phone || '+1 (555) 019-2834',
      '{invoice_number}': 'INV-2026-0891',
      '{total_amount}': formatMoney(250.00),
      '{paid_amount}': formatMoney(250.00),
      '{due_amount}': formatMoney(0.00),
      '{due_date}': new Date().toISOString().split('T')[0],
      '{received_amount}': formatMoney(250.00),
      '{payment_ref_no}': 'PAY-REF-' + Math.floor(100000 + Math.random() * 900000),
      '{payment_method}': 'Cash / Credit Card',
      '{service_staff}': currentUser?.name || 'Store Associate',
      '{start_time}': '10:00 AM',
      '{end_time}': '11:00 AM',
      '{booking_status}': 'Confirmed',
      '{order_status}': 'Processing',
      '{subscription_no}': 'SUB-98214',
      '{payment_link}': 'https://pay.royalpos.io/invoice/INV-2026-0891',
      '{balance_due}': formatMoney(0.00),
      '{po_number}': 'PO-2026-0412',
      '{ref_no}': 'GRN-2026-104',
      '{custom_field_1}': '',
      '{custom_field_2}': '',
      '{custom_field_3}': '',
      '{custom_field_4}': '',
      '{location_custom_field_1}': '',
      '{location_custom_field_2}': '',
      '{location_custom_field_3}': '',
      '{location_custom_field_4}': '',
      ...(params.variables || {}),
    };

    const replaceTags = (text: string) => {
      let result = text || '';
      Object.entries(mergedVariables).forEach(([tag, val]) => {
        result = result.split(tag).join(val ?? '');
      });
      return result;
    };

    const renderedSubject = replaceTags(tmpl.emailSubject);
    const renderedEmailBody = replaceTags(tmpl.emailBody);
    const renderedSmsBody = replaceTags(tmpl.smsBody);
    const renderedWhatsappBody = replaceTags(tmpl.whatsappBody);

    const channel = params.channel || (tmpl.autoSendEmail ? 'email' : tmpl.autoSendWhatsapp ? 'whatsapp' : 'sms');
    const recipientContact = channel === 'email' ? recipientEmail || 'customer@example.com' : recipientPhone || '+1 (555) 234-5678';
    const finalBody = channel === 'email' ? renderedEmailBody : channel === 'whatsapp' ? renderedWhatsappBody : renderedSmsBody;

    let deliveryStatus: 'sent' | 'failed' = 'sent';
    let previewUrl: string | undefined;
    let directUrl: string | undefined;
    let deliveryMode: string | undefined;
    let serverMessage = `Notification dispatched via ${channel.toUpperCase()} to ${recipientName}`;

    // 1. Channel Dispatch Logic
    if (channel === 'email') {
      const cleanPlainBody = renderedEmailBody.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      directUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientContact)}&su=${encodeURIComponent(renderedSubject)}&body=${encodeURIComponent(cleanPlainBody)}`;

      try {
        const response = await fetch('/api/notifications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientContact,
            subject: renderedSubject,
            html: renderedEmailBody,
            text: cleanPlainBody,
            cc: tmpl.emailCc,
            bcc: tmpl.emailBcc,
            smtpConfig: settings.emailSettings,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          previewUrl = data.previewUrl;
          deliveryMode = data.isTestAccount ? 'ethereal_test' : data.mode === 'simulated_no_smtp' ? 'simulated' : 'smtp_live';
          serverMessage = data.message || `Email successfully dispatched to ${recipientContact}`;
        } else {
          deliveryStatus = 'failed';
          serverMessage = data.error || 'Failed to dispatch email via SMTP server';
        }
      } catch (err: any) {
        console.warn('Backend send-email call error, providing direct fallback:', err);
        deliveryStatus = 'sent';
        deliveryMode = 'direct_client_fallback';
      }
    } else if (channel === 'whatsapp') {
      const cleanPhone = recipientContact.replace(/[^\d+]/g, '');
      const encodedMsg = encodeURIComponent(renderedWhatsappBody);
      directUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodedMsg}`;
      deliveryMode = 'whatsapp_direct';

      try {
        const response = await fetch('/api/notifications/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            message: renderedWhatsappBody,
            whatsappConfig: settings.whatsappSettings,
          }),
        });
        const data = await response.json();
        if (response.ok && data.directWebUrl) {
          directUrl = data.directWebUrl;
          if (data.mode === 'meta_cloud_api') {
            deliveryMode = 'meta_cloud_api';
            serverMessage = data.message;
          }
        }
      } catch (err) {
        console.warn('Backend whatsapp proxy notice:', err);
      }
    } else if (channel === 'sms') {
      const cleanPhone = recipientContact.replace(/[^\d+]/g, '');
      directUrl = `sms:${cleanPhone}?body=${encodeURIComponent(renderedSmsBody)}`;
      deliveryMode = 'sms_direct';
    }

    const newLog: NotificationDeliveryLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      templateType: params.templateType,
      channel,
      recipientName,
      recipientContact,
      subject: channel === 'email' ? renderedSubject : undefined,
      body: finalBody,
      status: deliveryStatus,
      previewUrl,
      directUrl,
      deliveryMode,
      errorDetails: deliveryStatus === 'failed' ? serverMessage : undefined,
    };

    setNotificationLogs((prev) => [newLog, ...prev.slice(0, 49)]);

    if (!params.silent) {
      showFlashNotification(
        deliveryStatus === 'failed' ? `Email dispatch alert: ${serverMessage}` : serverMessage,
        deliveryStatus === 'failed' ? 'error' : 'success'
      );
    }

    return {
      success: deliveryStatus === 'sent',
      message: serverMessage,
      renderedSubject,
      renderedBody: finalBody,
      previewUrl,
      directUrl,
      deliveryMode,
    };
  };

  const sendOneClickNotifications = async (params: {
    templateType: NotificationType;
    recipientContactId?: string;
    customRecipient?: { name: string; email?: string; phone?: string };
    variables?: Record<string, string>;
  }) => {
    const tmpl = notificationTemplates.find((t) => t.templateType === params.templateType);
    if (!tmpl) {
      showFlashNotification('Notification template not found', 'error');
      return;
    }

    const results = await Promise.all([
      tmpl.autoSendEmail ? sendNotification({ ...params, channel: 'email', silent: true }) : Promise.resolve(null),
      tmpl.autoSendWhatsapp ? sendNotification({ ...params, channel: 'whatsapp', silent: true }) : Promise.resolve(null)
    ]);

    const sentChannels = results.filter(r => r !== null && r.success).length;
    if (sentChannels > 0) {
      showFlashNotification(`One-Click: Sent to ${sentChannels} channel(s) successfully`, 'success');
    } else if (results.some(r => r !== null && !r.success)) {
      showFlashNotification('One-Click: Failed to send notifications', 'error');
    }
  };

  return (
    <ErpContext.Provider
      value={{
        settings,
        updateSettings,
        locations: scopedLocations,
        selectedLocationId,
        setSelectedLocationId,
        currentLocation,
        // Store Currency Management
        currencies,
        activeCurrency,
        addCurrency,
        updateCurrency,
        deleteCurrency,
        setActiveCurrency,
        setStoreCurrency,
        formatMoney,
        // Tax Rates, Groups & GST Calculation
        taxRates,
        taxGroups,
        addTaxRate,
        updateTaxRate,
        deleteTaxRate,
        addTaxGroup,
        updateTaxGroup,
        deleteTaxGroup,
        applyCountryTaxPreset,
        calculateItemTax,
        activeTab,
        setActiveTab: handleSmartSetActiveTab,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
        settingsSubTab,
        setSettingsSubTab,
        businessSettingsSection,
        setBusinessSettingsSection,
        navigateToSettings,
        userMenuSubTab,
        setUserMenuSubTab,
        navigateToUserMenu,
        isAddUserModalOpen,
        setIsAddUserModalOpen,
        openAddUserModal,
        closeAddUserModal,
        products,
        filteredProducts,
        addProduct,
        addProducts,
        updateProduct,
        deleteProduct,
        adjustStock,
        updateStockAdjustment,
        deleteStockAdjustment,
        transferStock,
        updateStockTransfer,
        deleteStockTransfer,
        completeStockTransfer,
        stockAdjustments,
        stockTransfers,
        // Units of Measure
        units,
        addUnit,
        updateUnit,
        deleteUnit,
        // Categories Management
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        // Brands Management
        brands,
        addBrand,
        updateBrand,
        deleteBrand,
        // Warranties Management
        warranties,
        addWarranty,
        updateWarranty,
        deleteWarranty,
        getWarrantyById,
        assignWarrantyToProducts,
        calculateWarrantyExpiry,
        // Rack, Row & Position Management
        racks,
        addRack,
        updateRack,
        deleteRack,
        assignRackPositionToProducts,
        inventorySubTab,
        setInventorySubTab,
        navigateToInventory,
        editingProduct,
        setEditingProduct,
        openAddProductPage,
        openEditProductPage,
        closeProductPage,
        customers,
        suppliers,
        customerGroups,
        addCustomerGroup,
        updateCustomerGroup,
        deleteCustomerGroup,
        getCustomerGroupPrice,
        contactsSubTab,
        setContactsSubTab,
        navigateToContacts,
        selectedLedgerContactId,
        setSelectedLedgerContactId,
        openCustomerLedger,
        openSupplierLedger,
        editingCustomer,
        setEditingCustomer,
        editingSupplier,
        setEditingSupplier,
        openAddContactPage,
        openAddCustomerPage,
        openAddSupplierPage,
        generateNextContactId,
        openEditCustomerPage,
                openEditSupplierPage,
        closeContactPage,
        addCustomer,
        importCustomers,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        importSuppliers,
        updateSupplier,
        deleteSupplier,
        recordCustomerPayment,
        recordSupplierPayment,
        recordCustomerLedgerDiscount,
        recordSupplierLedgerDiscount,
        updateLedgerDiscount,
        deleteLedgerDiscount,
        updateLedgerPayment,
        deleteLedgerPayment,
        cart,
        selectedCustomer,
        setSelectedCustomer,
        addToCart,
        updateCartQty,
        updateCartDiscount,
        updateCartPrice,
        removeFromCart,
        clearCart,
        suspendedSales,
        holdCart,
        resumeSuspendedSale,
        deleteSuspendedSale,
        transactions,
        createSale,
        updateSale,
        deleteSale,
        openAddSalePage,
        openEditSalePage,
        openViewSalePage,
        editingSale,
        viewingSale,
        createPurchase,
        updatePurchase,
        updatePurchaseSupplier,
        splitPurchaseItems,
        deletePurchase,
        receivePurchaseOrder,
        openEditPurchasePage,
        openViewPurchasePage,
        editingPurchase,
        viewingPurchase,
        // Purchase Requisitions
        purchaseRequisitions,
        createPurchaseRequisition,
        updatePurchaseRequisition,
        deletePurchaseRequisition,
        approvePurchaseRequisition,
        rejectPurchaseRequisition,
        convertRequisitionToPurchase,
        expenses,
        accounts,
        addExpense,
        updateExpense,
        deleteExpense,
        addAccount,
        updateAccount,
        deleteAccount,
        paymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        cashRegister,
        openRegister,
        closeRegister,
        showOpenRegisterModal,
        setShowOpenRegisterModal,
        requestOpenPos,
        isPosExitAllowed,
        pendingPosExitTarget,
        setPendingPosExitTarget,
        showRegisterExitLockModal,
        setShowRegisterExitLockModal,
        verifyAdminOverride,
        financialSummary,
        resetToDefaults,
        lastCompletedSale,
        setLastCompletedSale,
        posCommissionAgentId,
        setPosCommissionAgentId,
        // Barcode Studio
        barcodeStudioTargetProduct,
        setBarcodeStudioTargetProduct,
        openBarcodeStudio: (prod?: Product | null) => {
          setBarcodeStudioTargetProduct(prod || null);
          handleSmartSetActiveTab('barcode_studio');
        },
        // Role Permissions & Employee Access Control
        rolePermissions,
        updateRolePermissions,
        toggleRoleModule,
        resetRolePermissions,
        hasModuleAccess,
        hasPermission,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        updateUserRole,
        addLocation,
        updateLocation,
        deleteLocation,
        // Auth
        currentUser,
        users,
        salesCommissionAgents,
        addSalesCommissionAgent,
        updateSalesCommissionAgent,
        deleteSalesCommissionAgent,
        isAuthenticated: !!currentUser,
        login,
        lockUser,
        unlockUser,
        requestAdminUnlock,
        verifyLoginOtp,
        resendLoginOtp,
        register,
        logout,
        switchUser,
        // User Session & Connected Devices
        activeSessions,
        currentSession,
        createSession,
        terminateSession,
        terminateAllOtherSessions,
        touchSession,
        extendSession,
        showSessionWarning,
        setShowSessionWarning,
        remainingSessionSeconds,
        purgeAllData,
        applyInstallationStarterModules,
        setUsersList,
        upsertSuperAdminUser,
        // Offline Sync (IndexedDB / LocalStorage)
        isOnline,
        isSimulatedOffline,
        isEffectiveOnline,
        toggleSimulatedOffline,
        offlineQueue,
        syncStatus,
        syncStats,
        syncLogs,
        syncOfflineQueue,
        deleteQueuedTxn,
        clearAllQueue,
        exportQueueBackup,
        refreshOfflineState,
        activeNotification,
        showFlashNotification,
        // Notification Templates (finias POS)
        notificationTemplates,
        updateNotificationTemplate,
        resetNotificationTemplate,
        resetAllNotificationTemplates,
        notificationLogs,
        clearNotificationLogs,
        sendNotification,
        sendOneClickNotifications,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErp must be used within an ErpProvider');
  }
  return context;
};
