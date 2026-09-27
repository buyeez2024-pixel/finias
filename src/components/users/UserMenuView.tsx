import React from 'react';
import { useErp, isUserAdmin } from '../../context/ErpContext';
import { EmployeePermissionsTab } from '../settings/EmployeePermissionsTab';
import { SalesCommissionAgentsView } from './SalesCommissionAgentsView';
import { AccessDeniedGuard } from '../settings/AccessDeniedGuard';
import { AddUserPage } from './AddUserPage';
import { UserMenuSubTab } from '../../types/erp';
import {
  Users,
  UserPlus,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const UserMenuView: React.FC = () => {
  const {
    currentUser,
    hasModuleAccess,
    userMenuSubTab,
    users,
    setActiveTab,
  } = useErp();

  // Check if current user has permission to access user_menu module
  const canAccess = isUserAdmin(currentUser) || hasModuleAccess('user_menu') || hasModuleAccess('settings');

  if (!canAccess) {
    return <AccessDeniedGuard moduleName="User menu" moduleId="user_menu" />;
  }

  const currentBusinessName = (currentUser?.businessName || '').trim().toLowerCase();
  const currentBusinessId = currentUser?.businessId;
  const businessUsersCount = users.filter((u) => {
    if (currentBusinessId && u.businessId) return u.businessId === currentBusinessId;
    if (currentBusinessName && u.businessName) return u.businessName.trim().toLowerCase() === currentBusinessName;
    if (currentBusinessName && !u.businessName) return u.id === currentUser?.id;
    return true;
  }).length;

  const currentTab = userMenuSubTab || 'users';

  if (currentTab === 'add_user') {
    return <AddUserPage />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-12 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>User menu</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Employee Directory & Role Assignments</span>
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              {businessUsersCount} Active Accounts
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 pt-1">
            <span>User Management</span>
          </h1>

          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Manage employee accounts, credentials, sales representatives, and per-user role access assignments.
          </p>
        </div>

        {/* Add User Button */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab('add_user')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Main Content Component */}
      <div className="transition-all duration-200">
        {currentTab === 'sales_commission_agents' ? (
          <SalesCommissionAgentsView />
        ) : currentTab === 'roles' || currentTab === 'permissions' ? (
          <EmployeePermissionsTab initialSection="roles" />
        ) : (
          <EmployeePermissionsTab initialSection="users" />
        )}
      </div>
    </div>
  );
};
