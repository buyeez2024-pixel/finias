import React, { useState, useCallback } from 'react';
import { ErpProvider, useErp, isUserAdmin, checkIsSystemInstalled } from './context/ErpContext';
import { UninstalledGatewayScreen } from './components/installer/UninstalledGatewayScreen';
import { validatePhoneWithCountry } from './utils/phoneValidation';
import { PhoneInputWithCountry } from './components/common/PhoneInputWithCountry';
import { AddUserPage } from './components/users/AddUserPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { PosTerminal } from './components/pos/PosTerminal';
import { PaymentModal } from './components/pos/PaymentModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { RegisterModal } from './components/pos/RegisterModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { DashboardFooterBar } from './components/dashboard/DashboardFooterBar';
import { InventoryView } from './components/inventory/InventoryView';
import { TransferAdjustmentDashboard } from './components/inventory/TransferAdjustmentDashboard';
import { AddStockAdjustmentPage } from './components/inventory/AddStockAdjustmentPage';
import { AddStockTransferPage } from './components/inventory/AddStockTransferPage';
import { BarcodeStudioView } from './components/inventory/BarcodeStudioView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ImportPurchasesPage } from './components/purchases/ImportPurchasesPage';
import { PurchaseFormPage } from './components/purchases/PurchaseFormPage';
import { PurchaseReturnsView } from './components/purchases/PurchaseReturnsView';
import { PurchaseReturnFormPage } from './components/purchases/PurchaseReturnFormPage';
import { PurchaseRequisitionsView } from './components/purchases/PurchaseRequisitionsView';
import { SalesView } from './components/sales/SalesView';
import { SaleFormPage } from './components/sales/SaleFormPage';
import { SaleReturnsView } from './components/sales/SaleReturnsView';
import { SaleReturnFormPage } from './components/sales/SaleReturnFormPage';
import { ContactsView } from './components/contacts/ContactsView';
import { CustomerGroupsView } from './components/contacts/CustomerGroupsView';
import { ImportContactsPage } from './components/contacts/ImportContactsPage';
import { ContactFormPage } from './components/contacts/ContactFormPage';
import { ContactLedgerView } from './components/contacts/ContactLedgerView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { AccountsView } from './components/accounts/AccountsView';
import { ReportsView } from './components/reports/ReportsView';
import { AiIntelligenceView } from './components/ai/AiIntelligenceView';
import { LaravelArchView } from './components/laravel/LaravelArchView';
import { SettingsView } from './components/settings/SettingsView';
import { SystemUpdatesPage } from './components/settings/SystemUpdatesPage';
import { SecurityGuardView } from './components/security/SecurityGuardView';
import { UserMenuView } from './components/users/UserMenuView';
import { AccessDeniedGuard } from './components/settings/AccessDeniedGuard';
import { AuthPage } from './components/auth/AuthPage';
import { SessionWarningModal } from './components/auth/SessionWarningModal';
import { InstallationWizard } from './components/installer/InstallationWizard';
import { InstallationLockedGuard } from './components/installer/InstallationLockedGuard';
import { PosRegisterLockModal } from './components/pos/PosRegisterLockModal';
import { FlashNotification } from './components/common/FlashNotification';
import { Product, Transaction } from './types/erp';
import { checkServerSystemStatus, resetServerInstallation } from './services/systemService';
import { UserPlus, X, ShieldAlert, Unlock } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    contactsSubTab,
    transactions,
    addCustomer,
    isAuthenticated,
    currentUser,
    users,
    lockUser,
    unlockUser,
    hasModuleAccess,
    showRegisterExitLockModal,
    setShowRegisterExitLockModal,
    pendingPosExitTarget,
    openAddProductPage,
    openEditProductPage,
    settings, // Add settings here
    setSettingsSubTab,
    setUserMenuSubTab,
    inventorySubTab,
    showFlashNotification,
  } = useErp();

  const isLight = settings?.themeMode === 'light';
  React.useEffect(() => {
    if (settings?.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [settings?.themeMode]);
 
  // Modals state with reload persistence
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Transaction | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const pathOrHash = (window.location.pathname + window.location.hash).toLowerCase();
      if (pathOrHash.includes('contacts/add_customer')) {
        return true;
      }
    }
    return false;
  });

  // Sync add customer modal state
  React.useEffect(() => {
    if (showAddCustomerModal) {
      
    } else {
      
    }
  }, [showAddCustomerModal]);

  // Quick Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCountryCode, setNewCustCountryCode] = useState('+1');
  const [newCustCredit, setNewCustCredit] = useState('500.00');

  const handlePaymentSuccess = (sale: any) => {
    setActiveReceiptSale(sale);
    setShowReceiptModal(true);
  };

  const handleOpenReceipt = (sale: Transaction) => {
    setActiveReceiptSale(sale);
    setShowReceiptModal(true);
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    if (!newCustPhone.trim()) {
      showFlashNotification('Phone number is required', 'error');
      return;
    }

    if (newCustPhone.trim()) {
      const phoneVal = validatePhoneWithCountry(newCustPhone, newCustCountryCode);
      if (!phoneVal.isValid) {
        showFlashNotification(`Phone Error: ${phoneVal.error}`, 'error');
        return;
      }
    }

    addCustomer({
      name: newCustName,
      phone: newCustPhone.trim() ? `${newCustCountryCode} ${newCustPhone.trim()}` : 'N/A',
      creditLimit: parseFloat(newCustCredit) || 500,
    });
    setNewCustName('');
    setNewCustPhone('');
    setShowAddCustomerModal(false);
  };

  const onOpenPaymentModal = useCallback(() => setShowPaymentModal(true), []);
  const onOpenAddCustomerModal = useCallback(() => setShowAddCustomerModal(true), []);
  const onExitPos = useCallback(() => setActiveTab('dashboard'), [setActiveTab]);

  const [isInstallUrl, setIsInstallUrl] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      return p.includes('install') || p.includes('setup');
    }
    return false;
  });

  React.useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        const p = (window.location.pathname + window.location.hash).toLowerCase();
        setIsInstallUrl(p.includes('install') || p.includes('setup'));
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const [isVerifyingSystem, setIsVerifyingSystem] = useState<boolean>(() => {
    // If browser already has installation flag in localStorage, render immediately
    return !checkIsSystemInstalled();
  });

  const [systemInstalled, setSystemInstalled] = useState<boolean>(() => {
    return checkIsSystemInstalled();
  });

  React.useEffect(() => {
    let active = true;

    // Check if user requested to unlock / re-run setup wizard via URL (e.g. ?reset=installer or /setup?reset=true)
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isResetRequested =
      searchParams?.get('reset') === 'installer' ||
      searchParams?.get('reset') === 'true' ||
      searchParams?.get('unlock') === 'true' ||
      searchParams?.get('reinstall') === 'true' ||
      (typeof window !== 'undefined' && window.location.pathname === '/setup' && searchParams?.has('reset'));

    if (isResetRequested) {
      resetServerInstallation().then(() => {
        if (!active) return;
        setSystemInstalled(false);
        setIsVerifyingSystem(false);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/setup');
        }
      });
      return () => {
        active = false;
      };
    }

    checkServerSystemStatus().then((res) => {
      if (!active) return;
      if (res.isInstalled) {
        setSystemInstalled(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('pos_installed', 'true');
          localStorage.setItem('app_installed', 'true');
          localStorage.setItem('app_installation_completed', 'true');
          localStorage.setItem('is_installed', 'true');
          localStorage.setItem('system_installed', 'true');
          localStorage.setItem('installation_locked', 'true');
          localStorage.setItem('installation_wizard_deleted', 'true');

          const logo = res.logoUrl || res.settings?.logoUrl || res.settings?.logo || '';
          if (logo) {
            localStorage.setItem('royal_pos_v1_primary_logo', logo);
            localStorage.setItem('pos_custom_logo', logo);
          }

          if (res.settings && typeof res.settings === 'object') {
            const existingSettings = localStorage.getItem('ultimate_erp_pos_database_v1_settings');
            if (!existingSettings || existingSettings === '{}') {
              localStorage.setItem('ultimate_erp_pos_database_v1_settings', JSON.stringify(res.settings));
            }
          }

          if (res.adminUser && typeof res.adminUser === 'object') {
            localStorage.setItem('ultimate_erp_pos_database_v1_admin_user', JSON.stringify(res.adminUser));
            const existingUsers = localStorage.getItem('ultimate_erp_pos_database_v1_users');
            if (!existingUsers || existingUsers === '[]' || existingUsers === '{}' || existingUsers === 'null') {
              localStorage.setItem('ultimate_erp_pos_database_v1_users', JSON.stringify([res.adminUser]));
            }
          }
        }
      }
      setIsVerifyingSystem(false);
    }).catch(() => {
      if (active) setIsVerifyingSystem(false);
    });

    return () => {
      active = false;
    };
  }, []);

  // While checking server for a new device/browser (e.g. mobile or incognito), display a smooth verification screen
  if (isVerifyingSystem) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-ping" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white tracking-wide">Connecting to ERP Server</h3>
            <p className="text-xs text-slate-400">Verifying domain installation status...</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Initial State: If system is NOT installed, ANY URL accessed on farm.butabomma.in MUST show the Installation and Setup Wizard!
  if (!systemInstalled) {
    return (
      <InstallationWizard
        onComplete={() => {
          setSystemInstalled(true);
          setIsInstallUrl(false);
          setActiveTab('dashboard');
          if (typeof window !== 'undefined') {
            localStorage.setItem('pos_installed', 'true');
            localStorage.setItem('app_installed', 'true');
            localStorage.setItem('app_installation_completed', 'true');
            localStorage.setItem('is_installed', 'true');
            localStorage.setItem('system_installed', 'true');
            localStorage.setItem('installation_locked', 'true');
            localStorage.setItem('installation_wizard_deleted', 'true');
            window.history.replaceState(null, '', '/dashboard');
          }
        }}
        onCancel={() => {
          setSystemInstalled(true);
          setIsInstallUrl(false);
          setActiveTab('dashboard');
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/dashboard');
          }
        }}
      />
    );
  }

  // 2. Once installation is completed, visiting /install or /setup presents the secure InstallationLockedGuard
  // allowing immediate return to the POS or an emergency unlock & re-run if initial info was wrong
  if (isInstallUrl) {
    return (
      <InstallationLockedGuard
        onGoToDashboard={() => {
          setIsInstallUrl(false);
          setActiveTab('dashboard');
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/dashboard');
          }
        }}
        onUnlockSuccess={() => {
          setSystemInstalled(false);
          setIsInstallUrl(true);
        }}
      />
    );
  }

  // 3. Unauthenticated: always show Login Page (AuthPage) when logged out or accessing root/dashboard
  if (!isAuthenticated || !currentUser) {
    return <AuthPage />;
  }

  return (
    <div className={`h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300`}>
      {/* Top Navigation - Maximizes workspace by hiding in POS Terminal */}
      {activeTab !== 'pos' && (
        <Navbar
          onOpenRegisterModal={() => setShowRegisterModal(true)}
          onOpenQuickSale={() => setActiveTab('pos')}
          onOpenQuickPurchase={() => setActiveTab('add_purchase')}
          onOpenQuickProduct={openAddProductPage}
        />
      )}

      {/* Admin Security & Account Unlock Banner - only visible after Admin login */}
      {isUserAdmin(currentUser) && (() => {
        const lockedList = users.filter((u) => u.status === 'locked' || (u.lockedUntil && u.lockedUntil > Date.now()));
        if (lockedList.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-40 text-xs border-b border-amber-500/30 animate-fadeIn">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-white animate-pulse" />
              <span>
                <strong>Admin Security Alert:</strong> {lockedList.length} staff account(s) currently locked out due to brute-force security rules ({lockedList.map((u) => u.name).join(', ')}).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  lockedList.forEach((u) => unlockUser(u.id));
                  showFlashNotification(`Immediately unlocked ${lockedList.length} user account(s). They can now log in directly!`, 'success');
                }}
                className="px-3 py-1 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition shadow-xs flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unlock All Immediately</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserMenuSubTab('users');
                  setActiveTab('user_menu');
                }}
                className="px-3 py-1 bg-black/30 hover:bg-black/40 text-white rounded-lg font-medium transition"
              >
                Open Staff & Permissions
              </button>
            </div>
          </div>
        );
      })()}

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Sidebar (hidden in full-screen POS mode for maximum cashier workspace) */}
        {activeTab !== 'pos' && <Sidebar />}

        {/* Tab View Container */}
        <main className={`flex-1 ${activeTab === 'pos' ? 'overflow-hidden p-0' : 'overflow-x-hidden overflow-y-auto scroll-smooth overscroll-y-contain pb-16 lg:pb-2'} ${isLight ? 'bg-slate-50' : 'bg-slate-950/60'} flex flex-col min-h-0 min-w-0 transition-colors duration-300`}>
          {!hasModuleAccess(activeTab) ? (
            <AccessDeniedGuard
              moduleName={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              moduleId={activeTab}
              onNavigateHome={() => setActiveTab('dashboard')}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onOpenQuickPurchase={() => setActiveTab('add_purchase')}
                  onOpenQuickAdjustment={() => setActiveTab('add_adjustment')}
                />
              )}

              {activeTab === 'pos' && (
                <PosTerminal
                  onOpenPaymentModal={onOpenPaymentModal}
                  onOpenAddCustomerModal={onOpenAddCustomerModal}
                  onExitPos={onExitPos}
                  onOpenReceipt={handleOpenReceipt}
                />
              )}

              {(activeTab === 'inventory' ||
                activeTab === 'products' ||
                activeTab === 'all_products' ||
                activeTab === 'add_product' ||
                activeTab === 'edit_product' ||
                activeTab === 'import_products' ||
                activeTab === 'import_product' ||
                activeTab === 'product_history' ||
                activeTab === 'variations' ||
                activeTab === 'categories' ||
                activeTab === 'category' ||
                activeTab === 'brands' ||
                activeTab === 'brand' ||
                activeTab === 'brands_list' ||
                activeTab === 'brand_list' ||
                activeTab === 'warranties' ||
                activeTab === 'warranty' ||
                activeTab === 'racks' ||
                activeTab === 'units' ||
                activeTab === 'matrix' ||
                activeTab === 'adjustments' ||
                activeTab === 'transfers' ||
                activeTab === 'stock_adjustments' ||
                activeTab === 'stock_transfers') && (
                <InventoryView
                  onOpenAddProduct={openAddProductPage}
                  onOpenAdjustment={() => setActiveTab('add_adjustment')}
                  onOpenTransfer={() => setActiveTab('add_transfer')}
                  onEditProduct={openEditProductPage}
                />
              )}

               {activeTab === 'transfer_adjustment' && (
                 <TransferAdjustmentDashboard
                   onOpenTransfer={() => setActiveTab('add_transfer')}
                   onOpenAdjustment={() => setActiveTab('add_adjustment')}
                 />
               )}
              {activeTab === 'add_adjustment' && <AddStockAdjustmentPage />}
              {activeTab === 'add_transfer' && <AddStockTransferPage />}


              {(activeTab === 'barcode_studio' ||
                activeTab === 'barcode' ||
                activeTab === 'labels') && <BarcodeStudioView />}

              {activeTab === 'purchases' && (
                <PurchasesView 
                  onOpenNewPurchase={() => setActiveTab('add_purchase')} 
                  onOpenImportPurchases={() => setActiveTab('import_purchases')}
                />
              )}

              {activeTab === 'import_purchases' && (
                <ImportPurchasesPage onBack={() => setActiveTab('purchases')} />
              )}

              {activeTab === 'purchase_requisition' && (
                <PurchaseRequisitionsView />
              )}

              {activeTab === 'purchase_returns' && (
                <PurchaseReturnsView onOpenNewPurchase={() => setActiveTab('add_purchase_return')} />
              )}

              {(activeTab === 'add_purchase' || activeTab === 'edit_purchase' || activeTab === 'view_purchase') && (
                <PurchaseFormPage />
              )}

              {(activeTab === 'add_purchase_return' || activeTab === 'edit_purchase_return' || activeTab === 'view_purchase_return') && (
                <PurchaseReturnFormPage />
              )}

              {activeTab === 'sales' && (
                <SalesView
                  onOpenReceipt={handleOpenReceipt}
                  onOpenNewSale={() => setActiveTab('pos')}
                  isPosOnly={false}
                />
              )}

              {activeTab === 'list_pos_sale' && (
                <SalesView
                  onOpenReceipt={handleOpenReceipt}
                  onOpenNewSale={() => setActiveTab('pos')}
                  isPosOnly={true}
                />
              )}

              {activeTab === 'list_drafts' && (
                <SalesView
                  onOpenReceipt={handleOpenReceipt}
                  onOpenNewSale={() => setActiveTab('add_draft')}
                  initialStatusFilter="draft"
                  title="List Drafts"
                  addBtnLabel="+ Add Draft"
                  onAddBtnClick={() => setActiveTab('add_draft')}
                />
              )}

              {activeTab === 'list_quotations' && (
                <SalesView
                  onOpenReceipt={handleOpenReceipt}
                  onOpenNewSale={() => setActiveTab('add_quotation')}
                  initialStatusFilter="quotation"
                  title="List Quotations"
                  addBtnLabel="+ Add Quotation"
                  onAddBtnClick={() => setActiveTab('add_quotation')}
                />
              )}

              {(activeTab === 'add_sale' || activeTab === 'edit_sale' || activeTab === 'view_sale') && (
                <SaleFormPage onOpenReceiptModal={handleOpenReceipt} />
              )}
              
              {(activeTab === 'add_draft') && (
                <SaleFormPage onOpenReceiptModal={handleOpenReceipt} initialStatus="draft" />
              )}
              
              {(activeTab === 'add_quotation') && (
                <SaleFormPage onOpenReceiptModal={handleOpenReceipt} initialStatus="quotation" />
              )}

              {activeTab === 'sale_returns' && (
                <SaleReturnsView 
                  onOpenReceipt={handleOpenReceipt}
                  onOpenNewSaleReturn={() => setActiveTab('add_sale_return')} 
                />
              )}

              {(activeTab === 'add_sale_return' || activeTab === 'edit_sale_return' || activeTab === 'view_sale_return') && (
                <SaleReturnFormPage />
              )}

              {(activeTab === 'contacts' ||
                activeTab === 'customers' ||
                activeTab === 'suppliers' ||
                activeTab === 'customer_groups' ||
                activeTab === 'import_contacts') &&
                (contactsSubTab === 'import_contacts' || activeTab === 'import_contacts' ? (
                  <ImportContactsPage />
                ) : contactsSubTab === 'customer_groups' || activeTab === 'customer_groups' ? (
                  <CustomerGroupsView />
                ) : contactsSubTab === 'customer_ledger' || contactsSubTab === 'supplier_ledger' ? (
                  <ContactLedgerView
                    initialContactType={
                      contactsSubTab === 'supplier_ledger' ? 'supplier' : 'customer'
                    }
                  />
                ) : (
                  <ContactsView />
                ))}

              {(activeTab === 'customer_ledger' || activeTab === 'supplier_ledger' || activeTab === 'contacts_ledger') && (
                <ContactLedgerView
                  initialContactType={
                    activeTab === 'supplier_ledger' ? 'supplier' : 'customer'
                  }
                />
              )}

              {(activeTab === 'add_contact' || activeTab === 'edit_contact' || activeTab === 'add_customer' || activeTab === 'add_supplier' || activeTab === 'edit_customer' || activeTab === 'edit_supplier') && (
                <ContactFormPage />
              )}

              
              {activeTab === 'expenses' && <ExpensesView />}

              {activeTab === 'accounts' && <AccountsView />}

              {(activeTab === 'reports' || activeTab === 'product_purchase_report' || activeTab === 'purchase_payment_report' || activeTab === 'sell_payment_report' || activeTab === 'product_sell_report' || activeTab === 'purchase_report' || activeTab === 'sale_report' || activeTab === 'tax_report' || activeTab === 'customer_supplier_report' || activeTab === 'stock_report' || activeTab === 'stock_adjustment_report' || activeTab === 'sales_representative_report') && <ReportsView />}

              {activeTab === 'ai' && <AiIntelligenceView />}

              {(activeTab === 'add_user' || activeTab === 'create_user') && <AddUserPage />}

              {(activeTab === 'user_menu' ||
                activeTab === 'users' ||
                activeTab === 'roles' ||
                activeTab === 'permissions' ||
                activeTab === 'sales_commission_agents' ||
                activeTab === 'user_permissions') && <UserMenuView />}

              {(activeTab === 'settings' || activeTab === 'configuration' || activeTab === 'notification_templates' || activeTab === 'staff_permissions' || activeTab === 'employee_permissions') && <SettingsView />}
              {activeTab === 'system_updates' && (
                isUserAdmin(currentUser) ? (
                  <SystemUpdatesPage />
                ) : (
                  <div className="p-8 text-center text-slate-400 font-bold bg-slate-900 border border-slate-800 rounded-2xl m-6">
                    Access Restricted: System Updates menu is restricted to Supreme Admin.
                  </div>
                )
              )}
              {(activeTab === 'security' || activeTab === 'security_guard') && (
                isUserAdmin(currentUser) ? (
                  <SecurityGuardView />
                ) : (
                  <div className="p-8 text-center text-slate-400 font-bold bg-slate-900 border border-slate-800 rounded-2xl m-6">
                    Access Restricted: Security & Protection menu is restricted to Supreme Admin.
                  </div>
                )
              )}

              {activeTab === 'laravel_arch' && <LaravelArchView />}

              {(activeTab === 'installer' || activeTab === 'installation_wizard') && (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl m-6">
                  <h3 className="text-lg font-bold text-white mb-2">Installation Already Completed</h3>
                  <p className="text-xs text-slate-400 mb-4">The system setup wizard has been locked and permanently deactivated for security.</p>
                  <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition">Go to Dashboard</button>
                </div>
              )}

              {/* Robust Fallback in case of unexpected state */}
              {![
                'dashboard',
                'pos',
                'inventory',
                'products',
                'all_products',
                'add_product',
                'edit_product',
                'import_products',
                'import_product',
                'categories',
                'category',
                'brands',
                'brand',
                'brands_list',
                'brand_list',
                'warranties',
                'warranty',
                'racks',
                'matrix',
                'units',
                'adjustments',
                'transfers',
                'add_adjustment',
                'add_transfer',
                'stock_adjustments',
                'stock_transfers',
                'barcode_studio',
                'barcode',
                'labels',
                'purchases',
                'add_purchase',
                'edit_purchase',
                'view_purchase',
                'purchase_returns',
                'add_purchase_return',
                'edit_purchase_return',
                'view_purchase_return',
                'sale_returns',
                'add_sale_return',
                'edit_sale_return',
                'view_sale_return',
                'sales',
                'list_pos_sale',
                'add_sale',
                'edit_sale',
                'view_sale',
                'list_drafts',
                'add_draft',
                'list_quotations',
                'add_quotation',
                'contacts',
                'customers',
                'customer_groups',
                'import_contacts',
                'suppliers',
                'customer_ledger',
                'supplier_ledger',
                'contacts_ledger',
                'add_customer',
                'edit_customer',
                'add_supplier',
                'edit_supplier',
                'expenses',
                'accounts',
                'reports',
                'product_purchase_report',
                'purchase_payment_report',
                'product_sell_report',
                'purchase_report',
                'sale_report',
                'tax_report',
                'customer_supplier_report',
                'stock_report',
                'stock_adjustment_report',
                'sales_representative_report',
                'ai',
                'user_menu',
                'users',
                'add_user',
                'create_user',
                'roles',
                'permissions',
                'user_permissions',
                'settings',
                'system_updates',
                'notification_templates',
                'laravel_arch',
              ].includes(activeTab) && (
                <>
                  {console.log("Fallback triggered for tab (no component):", activeTab)}
                </>
              )}
            </>
          )}

          {activeTab !== 'pos' && inventorySubTab !== 'add_product' && inventorySubTab !== 'edit_product' && (
            <div className="max-w-7xl w-full mx-auto px-6 pb-2 mt-auto">
              <DashboardFooterBar />
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {showReceiptModal && (
        <ReceiptModal
          sale={activeReceiptSale}
          onClose={() => {
            setShowReceiptModal(false);
            setActiveReceiptSale(null);
          }}
        />
      )}

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      <PosRegisterLockModal
        isOpen={showRegisterExitLockModal}
        onClose={() => setShowRegisterExitLockModal(false)}
        onExitSuccess={() => {
          setActiveTab(pendingPosExitTarget || 'dashboard');
          setShowRegisterExitLockModal(false);
        }}
      />

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>+ Quick Add Customer</span>
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold">Full Name *</label>
                <input
                  required
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <PhoneInputWithCountry
                label="Phone Number"
                id="quick-add-cust-phone"
                phoneValue={newCustPhone}
                countryCode={newCustCountryCode}
                onChangePhone={setNewCustPhone}
                onChangeCountryCode={setNewCustCountryCode}
                showHint={true}
                required={true}
              />

              <div>
                <label className="text-slate-300 font-semibold">Credit Limit ($)</label>
                <input
                  type="number"
                  value={newCustCredit}
                  onChange={(e) => setNewCustCredit(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-2 transition shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
              >
                Save & Select Customer
              </button>
            </form>
          </div>
        </div>
      )}
      <SessionWarningModal />
      <FlashNotification />
      <MobileBottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ErpProvider>
      <ErrorBoundary>
        <MainAppContent />
      </ErrorBoundary>
    </ErpProvider>
  );
}
