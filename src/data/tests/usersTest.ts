import { TestingModule } from './types';

export const usersTest: TestingModule = {
  id: 'user_menu',
  title: '2. User Management & Access Control',
  category: 'Administration & Security',
  iconName: 'Users',
  overview: 'Black-box verification of user lifecycle management, role-based permission (RBAC) enforcement, secure credential updates, and sales representative registration.',
  testCases: [
    {
      id: 'TC-USR-001',
      title: 'Users List & Active Status Management',
      feature: 'User Management',
      targetMenu: 'Users > Users List',
      whatToCheck: 'Verify that the user list displays all registered employees, shows their current status (Active/Inactive), and allows searching by name or username.',
      howToCheck: [
        '1. Navigate to Users > Users List.',
        '2. Observe the data table for accuracy.',
        '3. Use the search bar to filter for a specific user.',
        '4. Toggle a user from Active to Inactive and verify the status badge changes.'
      ],
      positiveTesting: {
        inputData: 'Search: "John Doe"; Status Toggle: Inactive.',
        steps: [
          'Filter list by name.',
          'Change status via action menu.'
        ],
        expectedResult: 'User list updates instantly; search results are accurate; status changes are persisted in the database.'
      },
      negativeTesting: [
        {
          scenario: 'Search with No Matches',
          inputData: 'Query: "NonExistentUser123"',
          steps: ['Type non-existent name in search box.'],
          expectedErrorOrBehavior: 'System displays "No users found matching your search criteria" placeholder.'
        }
      ],
      passCriteria: 'User list is searchable, accurate, and reflects real-time status updates.'
    },
    {
      id: 'TC-USR-002',
      title: 'Add New User & Credential Provisioning',
      feature: 'User Creation',
      targetMenu: 'Users > Add New User',
      whatToCheck: 'Ensure new user accounts can be created with mandatory fields, role assignment, and secure password requirements.',
      howToCheck: [
        '1. Click "Add New User" in the Users menu.',
        '2. Fill in Full Name, Email, Username, Role, and Password.',
        '3. Assign the user to a specific Business Location.',
        '4. Click "Save".'
      ],
      positiveTesting: {
        inputData: 'Name: "Robert Fox"; Role: "Cashier"; Location: "Main Store".',
        steps: [
          'Enter valid details in all mandatory fields.',
          'Submit the form.'
        ],
        expectedResult: 'User account is created; success notification is shown; user is redirected to the Users List.'
      },
      negativeTesting: [
        {
          scenario: 'Mandatory Field Omission',
          inputData: 'Name: "Robert Fox"; Email: [Empty]; Role: [Unselected].',
          steps: ['Attempt to save a user without filling mandatory fields.'],
          expectedErrorOrBehavior: 'Form highlights missing fields in red with message: "This field is required."'
        },
        {
          scenario: 'Username Collision',
          inputData: 'Username: "admin" (Already taken).',
          steps: ['Enter an existing username and submit.'],
          expectedErrorOrBehavior: 'System rejects submission: "Username already exists. Please choose a different one."'
        }
      ],
      passCriteria: 'Users are correctly provisioned with validation for uniqueness and mandatory data.'
    },
    {
      id: 'TC-USR-003',
      title: 'Full-Name Uniformity in Sales Representative Registration',
      feature: 'Sales Rep Management',
      targetMenu: 'Users > Sales Representative',
      whatToCheck: 'Ensure the "Full Name" field correctly captures and displays unified names, replacing the legacy first/last name split.',
      howToCheck: [
        '1. Navigate to Users > Sales Representative.',
        '2. Click "Add Representative".',
        '3. Enter "Alexander Magnus" in the Full Name field.',
        '4. Save and verify the display in the agent table.'
      ],
      positiveTesting: {
        inputData: 'Full Name: "Alexander Magnus"; Comm Rate: 5%.',
        steps: [
          'Fill single full name field.',
          'Submit form.'
        ],
        expectedResult: 'Representative is created successfully; name displays as "Alexander Magnus" in the registry.'
      },
      negativeTesting: [
        {
          scenario: 'Duplicate Sales Agent Registry',
          inputData: 'Name: "Alexander Magnus" (Already exists).',
          steps: ['Attempt to create an agent with an identical name to an existing one.'],
          expectedErrorOrBehavior: 'System displays validation error: "A representative with this name already exists in the registry."'
        }
      ],
      passCriteria: 'Single field name entry works correctly; duplicates are rejected.'
    },
    {
      id: 'TC-USR-004',
      title: 'RBAC: Role Permission Matrix Enforcement',
      feature: 'Role-Based Access Control',
      targetMenu: 'Users > Roles & Access',
      whatToCheck: 'Verify that removing a permission (e.g., "Access Settings") instantly hides the menu item and blocks route access for users assigned to that role.',
      howToCheck: [
        '1. Login as Admin.',
        '2. Edit "Cashier" role and uncheck "Settings" access.',
        '3. Logout and login as a Cashier user.',
        '4. Verify "Settings" icon is hidden from sidebar.'
      ],
      positiveTesting: {
        inputData: 'Role: Cashier; Unchecked: Settings Access.',
        steps: ['Revoke settings access for role.', 'Login as user with that role.'],
        expectedResult: 'Sidebar does not render Settings link; manual URL navigation to /settings redirects to dashboard with "Access Denied" toast.'
      },
      negativeTesting: [
        {
          scenario: 'Deleting Role with Active Users',
          inputData: 'Role: "Store Manager" (Currently assigned to 3 users).',
          steps: ['Navigate to Roles list.', 'Attempt to delete an active role.'],
          expectedErrorOrBehavior: 'System blocks deletion: "Cannot delete role while it is assigned to active users. Please reassign users first."'
        }
      ],
      passCriteria: 'Permissions strictly regulate UI visibility and functional access; role deletion is protected.'
    }
  ]
};
