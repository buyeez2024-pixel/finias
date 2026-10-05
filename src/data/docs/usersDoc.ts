import { DocModule } from './types';

export const usersDoc: DocModule = {
  id: 'user_menu',
  title: '2. User Management & Access Control',
  category: 'Administration & Security',
  iconName: 'Users',
  overview:
    'Comprehensive identity lifecycle, role-based access control (RBAC), multi-branch employee directory, sales commission agents, and granular security permissions governing who can read, create, edit, or delete records in the ERP.',
  workflowSteps: [
    {
      step: 1,
      title: 'Define Roles & Granular Permissions',
      description:
        'Create functional roles (e.g. Cashier, Store Manager, Accountant, Inventory Clerk) and check specific capabilities.',
      tips: 'Always follow the principle of least privilege—only assign sensitive permissions (e.g. edit price, delete invoice) to senior managers.',
    },
    {
      step: 2,
      title: 'Provision Employee User Profile',
      description:
        'Navigate to Add User, input personal details, set login username, generate a secure password, and select assigned branch locations.',
    },
    {
      step: 3,
      title: 'Configure Commission Structure for Sales Agents',
      description:
        'If staff receive performance incentives on invoiced revenue, register them under Sales Commission Agents with their percentage cut.',
    },
    {
      step: 4,
      title: 'Audit User Activity & Session Lockouts',
      description:
        'Monitor user status (Active vs Suspended) and unlock accounts if repeated failed login attempts trigger automated security locks.',
    },
  ],
  submenus: [
    {
      id: 'users_list',
      title: 'Users List & Staff Directory',
      menuPath: 'Users > Users List',
      whyItIsUsed:
        'Allows business administrators to search, filter, inspect, edit, or deactivate employee logins, role assignments, and branch locations across all operating facilities.',
      howToUse: [
        '1. Click "Users" in the primary navigation sidebar, then select "Users List".',
        '2. Use the search bar to locate an employee by name, username, email, or role.',
        '3. Filter the directory by Branch Location or Status (Active / Inactive).',
        '4. Click the "Edit" action button to adjust an employee’s assigned role, contact number, or assigned store.',
        '5. Click the "Lock / Deactivate" button to instantly terminate ERP session access for departing staff.',
      ],
      whereToEnterDate:
        'In the Users List view, date filters appear under "Joined Date Range" in the Advanced Filter bar. Specify Start Date [YYYY-MM-DD] and End Date [YYYY-MM-DD] to audit employees onboarded within a specific HR recruitment cycle. Each user record also displays their immutable "Created At" timestamp in YYYY-MM-DD format.',
      description:
        'Master list of all authorized employee logins, assigned security roles, outlet restrictions, and active session statuses.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Staff Directory & User Accounts',
        urlPath: 'https://pos.royal-erp.internal/#/users/list',
        dateBadgeText: '📅 Filter: Joined Date (All Periods) | Sort: Name ASC',
        primaryActionText: '+ Add New User',
        filterOptions: ['All Roles', 'Cashiers', 'Managers', 'Accountants', 'Active Only', 'Suspended'],
        mockColumns: ['User ID', 'Full Name', 'Username', 'Role', 'Assigned Branch', 'Email / Phone', 'Status', 'Actions'],
        mockRows: [
          { 'User ID': 'USR-101', 'Full Name': 'Alexander Vance', Username: 'alex_admin', Role: 'Super Admin', 'Assigned Branch': 'All Branches', 'Email / Phone': 'alex@royal.com', Status: 'Active', Actions: 'Edit | Deactivate' },
          { 'User ID': 'USR-102', 'Full Name': 'Elena Rodriguez', Username: 'elena_mgr', Role: 'Store Manager', 'Assigned Branch': 'Flagship Outlet', 'Email / Phone': '+1 555-0192', Status: 'Active', Actions: 'Edit | Deactivate' },
          { 'User ID': 'USR-103', 'Full Name': 'Marcus Chen', Username: 'mchen_pos', Role: 'Cashier Staff', 'Assigned Branch': 'East Counter', 'Email / Phone': 'marcus@royal.com', Status: 'Active', Actions: 'Edit | Deactivate' },
          { 'User ID': 'USR-104', 'Full Name': 'Sarah Jenkins', Username: 'sjenkins_acc', Role: 'Accountant', 'Assigned Branch': 'Head Office', 'Email / Phone': '+1 555-0844', Status: 'Active', Actions: 'Edit | Deactivate' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Primary Action: + Add New User',
          fieldOrSection: 'Top Action Bar (Right)',
          instruction: 'Click to open the user registration form.',
        },
        {
          pinNumber: 2,
          label: 'Joined Date & Audit Filter',
          fieldOrSection: 'Toolbar Filter Controls',
          instruction: 'Filter employee records by account creation or onboard date.',
          whereToEnterDate: 'Click the filter drawer to set Start Date and End Date in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Role & Branch Quick Filter',
          fieldOrSection: 'Filter Selectors',
          instruction: 'Filter the list by specific role (e.g. Cashier) or branch location.',
        },
        {
          pinNumber: 4,
          label: 'User Directory Table',
          fieldOrSection: 'Center Data Grid',
          instruction: 'Displays employee ID, full name, username, assigned role, outlet, and status badge.',
        },
        {
          pinNumber: 5,
          label: 'Record Row Actions (Edit / Permissions / Deactivate)',
          fieldOrSection: 'Rightmost Table Column',
          instruction: 'Click Edit to update profile details, or Lock to revoke application access immediately.',
        },
      ],
      fields: [
        {
          name: 'Search Query Input',
          type: 'Text Input',
          required: false,
          purpose: 'Filters staff table by name, username, email address, or telephone number.',
          functionality: 'Performs instant client-side substring matching on keystroke.',
          validationRules: 'Alphanumeric; accepts minimum 2 characters.',
        },
        {
          name: 'Role Filter Dropdown',
          type: 'Select Dropdown',
          required: false,
          purpose: 'Isolates staff belonging to a particular security tier.',
          functionality: 'Queries users matching selected role ID.',
          validationRules: 'Options populated dynamically from the Roles & Permissions master table.',
        },
        {
          name: 'Branch Location Filter',
          type: 'Select Dropdown',
          required: false,
          purpose: 'Restricts employee list to a specific retail shop, warehouse, or head office.',
          functionality: 'Filters table rows to display only personnel assigned to the chosen branch.',
          validationRules: 'Matches registered business locations.',
        },
        {
          name: 'Status Filter Toggle',
          type: 'Multi-select Pills (Active / Inactive / Locked)',
          required: false,
          purpose: 'Allows auditing active personnel or reviewing suspended staff for reactivation.',
          functionality: 'Filters based on the boolean user.isActive flag.',
          validationRules: 'Defaults to Active.',
        },
      ],
    },
    {
      id: 'add_user',
      title: 'Add New User Form',
      menuPath: 'Users > Add New User',
      whyItIsUsed:
        'Registers new personnel into the system, provisions cryptographic authentication credentials, binds the staff member to specific store locations, and enforces role security limits.',
      howToUse: [
        '1. Open "Add New User" from the sidebar navigation or click "+ Add New User" in the staff directory.',
        '2. Fill in the Employee Profile: Prefix (Mr/Ms), First Name, Last Name, Email, and Mobile Number.',
        '3. Enter Account Credentials: Set a unique Username and enter a strong Password (confirm matching password).',
        '4. Set Date of Joining [YYYY-MM-DD] and Date of Birth [YYYY-MM-DD].',
        '5. Assign Role: Choose an authorization role from the dropdown (Admin, Cashier, Manager, Accountant).',
        '6. Select Permitted Locations: Check which retail stores or warehouses this employee may access.',
        '7. Click "Save User" to write the record and immediately activate login capability.',
      ],
      whereToEnterDate:
        'In the Add User Form, date entry occurs in two explicit form inputs: 1) "Date of Joining" located under the Employment Details panel (Input type: Date [YYYY-MM-DD]), which dictates salary accrual, seniority, and sales targets; and 2) "Date of Birth" located in the Personal Information section (Input type: Date [YYYY-MM-DD]) used for employee verification and statutory identity compliance.',
      description:
        'User registration and credential provisioning form with role bindings, branch scopes, and personal information.',
      mockup: {
        viewType: 'form',
        windowTitle: 'Royal ERP - Provision New User Account',
        urlPath: 'https://pos.royal-erp.internal/#/users/add',
        dateBadgeText: '📅 Date of Joining: Required [YYYY-MM-DD]',
        primaryActionText: 'Save & Provision User',
        formSections: [
          {
            title: '1. Personal & Contact Information',
            fields: [
              { label: 'Prefix & Title', placeholder: 'Mr. / Ms. / Dr.', isRequired: false },
              { label: 'First Name *', placeholder: 'e.g. Alexander', isRequired: true, pinNumber: 1 },
              { label: 'Last Name *', placeholder: 'e.g. Vance', isRequired: true },
              { label: 'Email Address *', placeholder: 'alex.vance@company.com', isRequired: true },
              { label: 'Date of Birth', placeholder: 'YYYY-MM-DD', isDate: true, pinNumber: 2 },
            ],
          },
          {
            title: '2. Login Credentials & Security Scope',
            fields: [
              { label: 'Login Username *', placeholder: 'e.g. avance_pos', isRequired: true, pinNumber: 3 },
              { label: 'Password *', placeholder: '••••••••••••', isRequired: true, type: 'password' },
              { label: 'Confirm Password *', placeholder: '••••••••••••', isRequired: true, type: 'password' },
              { label: 'Assign Role *', placeholder: 'Select: Store Manager', isRequired: true, pinNumber: 4 },
            ],
          },
          {
            title: '3. Employment & Branch Assignment',
            fields: [
              { label: 'Date of Joining *', placeholder: 'YYYY-MM-DD (e.g. 2026-10-04)', isDate: true, isRequired: true, pinNumber: 5 },
              { label: 'Sales Commission %', placeholder: 'e.g. 2.50%', isRequired: false },
              { label: 'Allowed Locations *', placeholder: 'Check: Main Flagship Store', isRequired: true },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Personal Name & Contact Fields',
          fieldOrSection: 'Section 1: Personal Details',
          instruction: 'Enter employee legal first name, last name, and primary email address.',
        },
        {
          pinNumber: 2,
          label: 'Date of Birth Picker',
          fieldOrSection: 'Personal Details > Date Input',
          instruction: 'Click calendar icon or type birth date in YYYY-MM-DD format.',
          whereToEnterDate: 'DOB Field: Calendar popup or direct manual entry in YYYY-MM-DD format.',
        },
        {
          pinNumber: 3,
          label: 'Username & Credential Fields',
          fieldOrSection: 'Section 2: Login Credentials',
          instruction: 'Specify unique username and strong alphanumeric password (minimum 8 characters).',
        },
        {
          pinNumber: 4,
          label: 'Role Assignment Dropdown',
          fieldOrSection: 'Security Tiers',
          instruction: 'Select security role (Super Admin, Store Manager, Cashier, Inventory Operator).',
        },
        {
          pinNumber: 5,
          label: 'Date of Joining Input',
          fieldOrSection: 'Section 3: Employment Details',
          instruction: 'Input the official onboarding date. Dictates sales commission reporting and KPI periods.',
          whereToEnterDate: 'Date of Joining calendar input in Section 3: Format YYYY-MM-DD.',
        },
        {
          pinNumber: 6,
          label: 'Submit & Cancel Buttons',
          fieldOrSection: 'Bottom Form Actions',
          instruction: 'Click Save User to finalize record creation or Cancel to discard modifications.',
        },
      ],
      fields: [
        {
          name: 'First Name',
          type: 'Text',
          required: true,
          purpose: 'Legal given name of the employee.',
          functionality: 'Displayed on invoices, audit logs, receipt headers, and shift handovers.',
          validationRules: 'Minimum 2 characters, maximum 50 characters. Letters only.',
        },
        {
          name: 'Last Name',
          type: 'Text',
          required: true,
          purpose: 'Family or surname of the employee.',
          functionality: 'Combined with First Name for formal reports and payroll identification.',
          validationRules: 'Minimum 1 character, maximum 50 characters.',
        },
        {
          name: 'Email Address',
          type: 'Email',
          required: true,
          purpose: 'Official contact email; serves as password recovery channel and notification target.',
          functionality: 'Must be unique across the tenant.',
          validationRules: 'Valid email format RFC 5322 (e.g. name@domain.com).',
        },
        {
          name: 'Login Username',
          type: 'Text (Unique Identifier)',
          required: true,
          purpose: 'Unique identifier entered at the sign-in screen.',
          functionality: 'Indexed for fast lookup; cannot be duplicated by any other employee.',
          validationRules: 'Minimum 3 characters, alphanumeric plus underscores. No spaces allowed.',
        },
        {
          name: 'Password',
          type: 'Password (Masked)',
          required: true,
          purpose: 'Secret credential used to authenticate employee identity.',
          functionality: 'Hashed using industry-standard salted cryptographic algorithms.',
          validationRules: 'Minimum 8 characters with at least 1 number and 1 special symbol.',
        },
        {
          name: 'Date of Joining',
          type: 'Date (YYYY-MM-DD)',
          required: true,
          purpose: 'Establishes the employment start date for fiscal reporting, commissions, and tenure.',
          functionality: 'Used as the baseline start date in sales representative commission calculations.',
          validationRules: 'Cannot be greater than 30 days in the future.',
        },
        {
          name: 'Assigned Role',
          type: 'Dropdown (Role ID)',
          required: true,
          purpose: 'Maps employee to a permission profile regulating UI screens and API capabilities.',
          functionality: 'Restricts sidebar menus, button clicks, price changes, and discount limits.',
          validationRules: 'Must match an existing active Role definition.',
        },
        {
          name: 'Permitted Business Locations',
          type: 'Checkbox Multi-Select',
          required: true,
          purpose: 'Constrains user access to specific physical outlets and warehouse stocks.',
          functionality: 'Prevents staff in Branch A from viewing or selling stock belonging to Branch B.',
          validationRules: 'At least one location must be checked.',
        },
      ],
    },
    {
      id: 'sales_commission_agents',
      title: 'Sales Commission Agents & Representatives',
      menuPath: 'Users > Sales Representative',
      whyItIsUsed:
        'Configures sales staff, field agents, and external commission partners who earn a percentage incentive on closed sales transactions, enabling automated commission reporting and performance tracking.',
      howToUse: [
        '1. Click "Sales Representative" under the Users menu group.',
        '2. Review the list of active sales agents, their contact numbers, and commission percentages.',
        '3. Click "+ Add Sales Representative" to register a new agent.',
        '4. Provide Full Name, Email, Contact Number, and Commission Percentage (e.g. 3.00%).',
        '5. Specify effective Start Date for commission accruals.',
        '6. When finalizing Sales Invoices or POS orders, select the agent in the "Sales Representative" field to automatically bind transaction credit.',
      ],
      whereToEnterDate:
        'In the Sales Representative form, date entry occurs in the "Agreement Effective Date" field [YYYY-MM-DD]. In the Sales Representative Report view, date filters appear as "Commission Period From [YYYY-MM-DD]" and "Commission Period To [YYYY-MM-DD]" to accurately calculate earned commissions over monthly or quarterly pay cycles.',
      description:
        'Configuration of commission percentages, contact details, and performance tracking for internal and external sales personnel.',
      mockup: {
        viewType: 'table',
        windowTitle: 'Royal ERP - Sales Representatives & Commission Rates',
        urlPath: 'https://pos.royal-erp.internal/#/users/sales-agents',
        dateBadgeText: '📅 Commission Cycle: Active Fiscal Month [2026-10-01 to 2026-10-31]',
        primaryActionText: '+ Add Sales Representative',
        mockColumns: ['Agent ID', 'Agent Name', 'Email', 'Phone', 'Commission Rate %', 'Total Sales Invoiced', 'Earned Commission', 'Actions'],
        mockRows: [
          { 'Agent ID': 'REP-01', 'Agent Name': 'David Sterling', Email: 'dsterling@royal.com', Phone: '+1 555-0182', 'Commission Rate %': '3.50%', 'Total Sales Invoiced': '$45,800.00', 'Earned Commission': '$1,603.00', Actions: 'Edit | View Ledger' },
          { 'Agent ID': 'REP-02', 'Agent Name': 'Jessica Alba', Email: 'jessica.a@royal.com', Phone: '+1 555-0199', 'Commission Rate %': '2.00%', 'Total Sales Invoiced': '$32,100.00', 'Earned Commission': '$642.00', Actions: 'Edit | View Ledger' },
          { 'Agent ID': 'REP-03', 'Agent Name': 'Michael Chang', Email: 'mchang@royal.com', Phone: '+1 555-0211', 'Commission Rate %': '4.00%', 'Total Sales Invoiced': '$18,400.00', 'Earned Commission': '$736.00', Actions: 'Edit | View Ledger' },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Add Sales Agent Button',
          fieldOrSection: 'Top Right Header',
          instruction: 'Click to open the commission rate creation dialog.',
        },
        {
          pinNumber: 2,
          label: 'Commission Date Cycle Selector',
          fieldOrSection: 'Top Filter Bar',
          instruction: 'Select payroll cycle dates to calculate invoiced commission amounts.',
          whereToEnterDate: 'Set Start and End dates in YYYY-MM-DD format to review monthly commission totals.',
        },
        {
          pinNumber: 3,
          label: 'Commission Percentage (%) Field',
          fieldOrSection: 'Agent Table Column 5',
          instruction: 'Defines the exact cut of total sales revenue credited to the agent upon invoice completion.',
        },
        {
          pinNumber: 4,
          label: 'Earned Commission Summary',
          fieldOrSection: 'Agent Table Column 7',
          instruction: 'Automatically computes: Total Sales Invoiced * (Commission Rate / 100).',
        },
      ],
      fields: [
        {
          name: 'Full Name',
          type: 'Text',
          required: true,
          purpose: 'Unified single full name of the sales representative displayed on invoices, commission slips, and reports.',
          functionality: 'Standard single field to maintain uniformity across the app (replacing separate first/last name). Linked to sales orders for commission attribution.',
          validationRules: 'Minimum 2 characters, alphabetic characters with optional spaces.',
        },
        {
          name: 'Commission Percentage',
          type: 'Decimal (Percentage)',
          required: true,
          purpose: 'Rate applied against net sales value to compute earned incentives.',
          functionality: 'Auto-calculates commission value on closed sales vouchers.',
          validationRules: 'Value between 0.00% and 100.00%. Precision up to 2 decimal places.',
        },
        {
          name: 'Contact Phone',
          type: 'Tel Number',
          required: true,
          purpose: 'Direct mobile number for agent communications.',
          functionality: 'Used for sending SMS commission alerts.',
          validationRules: 'Standard international or domestic phone format.',
        },
      ],
    },
    {
      id: 'roles_access',
      title: 'Roles & Permissions Access Control Matrix',
      menuPath: 'Users > Roles & Access',
      whyItIsUsed:
        'Enforces enterprise role-based security (RBAC) by allowing administrators to define fine-grained read, create, edit, delete, and approve permissions for every functional module in the ERP.',
      howToUse: [
        '1. Select "Roles & Access" from the Users menu.',
        '2. Review existing roles: Admin, Store Manager, Cashier, Accountant, Stock Controller.',
        '3. Click "+ Add Role" to create a bespoke authorization tier (e.g. "Seasonal POS Operator").',
        '4. In the Permission Matrix, check or uncheck capabilities across modules: Inventory, Sales, Purchases, Reports, Expenses, Settings.',
        '5. Set sensitive overrides: "Allow Editing Selling Price", "Allow Giving Discounts Exceeding 10%", "Allow Deleting Invoices".',
        '6. Click "Save Role" to enforce permissions instantaneously across all connected employee sessions.',
      ],
      whereToEnterDate:
        'Roles are configured without temporal dates, but role creation and modification timestamps are permanently logged in the System Security Shield under "Audit Trail Date" in YYYY-MM-DD HH:MM:SS format to track who altered access permissions and when.',
      description:
        'Security permission matrix granting or restricting read, write, update, and delete access across all 14 ERP menus.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - Role-Based Security Permissions Matrix',
        urlPath: 'https://pos.royal-erp.internal/#/users/roles',
        dateBadgeText: '🛡️ Security Policy: Multi-Tenant RBAC Active',
        primaryActionText: '+ Create New Role',
        formSections: [
          {
            title: '1. Role Identity',
            fields: [
              { label: 'Role Name *', placeholder: 'e.g. Front Desk Cashier', isRequired: true, pinNumber: 1 },
              { label: 'Role Description', placeholder: 'POS checkout only; no back-office settings access' },
            ],
          },
          {
            title: '2. POS & Sales Capabilities',
            fields: [
              { label: 'Access POS Terminal', placeholder: 'Checked: YES', isRequired: true, pinNumber: 2 },
              { label: 'Allow Edit Selling Price', placeholder: 'Unchecked: NO (Supervisor PIN required)' },
              { label: 'Max Discount Allowed (%)', placeholder: '10.00%', isRequired: true, pinNumber: 3 },
              { label: 'Allow Deleting Sales Invoices', placeholder: 'Unchecked: NO (Admin only)' },
            ],
          },
          {
            title: '3. Inventory & Purchasing Access',
            fields: [
              { label: 'View Products & Stock Quantities', placeholder: 'Checked: YES' },
              { label: 'Add / Edit Product Catalog', placeholder: 'Unchecked: NO' },
              { label: 'Create Purchase Orders', placeholder: 'Unchecked: NO' },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Role Name & Description Header',
          fieldOrSection: 'Role Metadata',
          instruction: 'Define the functional title of the access profile.',
        },
        {
          pinNumber: 2,
          label: 'Module Access Checkbox Grid',
          fieldOrSection: 'Permissions Matrix',
          instruction: 'Check View, Add, Edit, or Delete permissions for each menu.',
        },
        {
          pinNumber: 3,
          label: 'Discount & Price Override Guard',
          fieldOrSection: 'Financial Security Controls',
          instruction: 'Enforce ceiling limits on price reductions cashiers can apply without manager approval.',
        },
        {
          pinNumber: 4,
          label: 'Save Role & Deploy Permissions',
          fieldOrSection: 'Bottom Action Bar',
          instruction: 'Click Save to push security policy live to all users holding this role.',
        },
      ],
      fields: [
        {
          name: 'Role Name',
          type: 'Text',
          required: true,
          purpose: 'Label identifying the authorization group.',
          functionality: 'Assigned to user profiles to enforce permissions.',
          validationRules: 'Minimum 3 characters, alphanumeric. Must be unique.',
        },
        {
          name: 'Module Permission Flags',
          type: 'Matrix of Checkboxes (View, Add, Edit, Delete)',
          required: true,
          purpose: 'Regulates UI visibility and API route access.',
          functionality: 'Controls whether menu tabs render and whether backend endpoints allow modifications.',
          validationRules: 'At least one module must be permitted.',
        },
        {
          name: 'Max Discount Percentage Limit',
          type: 'Decimal Number',
          required: false,
          purpose: 'Caps the maximum discount an operator with this role can apply at checkout.',
          functionality: 'If a cashier enters a discount exceeding this threshold, a supervisor PIN prompt appears.',
          validationRules: 'Between 0% and 100%.',
        },
      ],
    },
  ],
  bestPractices: [
    'Never share user logins among multiple cashiers; assign each staff member an individual account to maintain clear audit accountability.',
    'Regularly audit the Users List and deactivate accounts of terminated employees immediately.',
    'Keep Super Admin credentials restricted to business principals.',
  ],
  troubleshooting: [
    {
      issue: 'Cashier cannot see the POS menu',
      solution:
        'Navigate to Users > Roles & Access, edit the Cashier role, and ensure the "Access POS Terminal" capability is checked and saved.',
    },
    {
      issue: 'User locked out due to invalid password attempts',
      solution:
        'An admin can navigate to Users List, locate the locked user, click Edit, and reset their password or toggle the Lock status back to Active.',
    },
  ],
};
