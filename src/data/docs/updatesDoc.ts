import { DocModule } from './types';

export const updatesDoc: DocModule = {
  id: 'system_updates',
  title: '12. System Updates & Database Synchronization',
  category: 'System Maintenance & Cloud Infrastructure',
  iconName: 'RefreshCw',
  overview:
    'Manages application software versioning, release changelogs, database migrations, offline client-side caching, background synchronization with cloud storage, and database backup exports.',
  workflowSteps: [
    {
      step: 1,
      title: 'Review Installed Version & Release Notes',
      description:
        'Inspect current ERP software build number, new features, security patches, and performance optimizations.',
    },
    {
      step: 2,
      title: 'Audit Offline Synchronization Queue',
      description:
        'Verify that offline POS counter transactions queue locally and sync automatically when internet connectivity restores.',
    },
    {
      step: 3,
      title: 'Execute Database Backup Export',
      description:
        'Generate an on-demand encrypted JSON / SQL database backup to safeguard customer, invoice, and catalog records.',
    },
  ],
  submenus: [
    {
      id: 'updates_screen',
      title: 'System Updates & Version Changelog',
      menuPath: 'System Updates > System Updates',
      whyItIsUsed:
        'Displays installed application version, build timestamps, pending cloud updates, offline sync queue health, and database export/import controls.',
      howToUse: [
        '1. Go to System Updates in the primary sidebar navigation.',
        '2. Inspect "Current Version" (e.g. v2026.4 Enterprise).',
        '3. Click "Check for Updates" to poll the central release repository.',
        '4. Review the Release Changelog for recent enhancements.',
        '5. Click "Export Database Backup" to save a full snapshot of your ERP data.',
      ],
      whereToEnterDate:
        'The System Updates view displays the official "Release Build Date [YYYY-MM-DD]" and "Last Backup Timestamp [YYYY-MM-DD HH:MM:SS]" to ensure operational administrators know when data was last backed up.',
      description:
        'Software release manager, offline synchronization queue monitor, and database backup generator.',
      mockup: {
        viewType: 'settings',
        windowTitle: 'Royal ERP - System Updates & Synchronization',
        urlPath: 'https://pos.royal-erp.internal/#/updates',
        dateBadgeText: '🚀 Build: v2026.4 Enterprise | Released: 2026-10-04 | Sync Online',
        primaryActionText: 'Export Database Backup',
        formSections: [
          {
            title: '1. Software Version & Release Information',
            fields: [
              { label: 'Installed Version', placeholder: 'v2026.4 Complete Enterprise Edition (All 14 Menus)', pinNumber: 1 },
              { label: 'Build Release Date', placeholder: '2026-10-04 [YYYY-MM-DD]', isDate: true, pinNumber: 2 },
              { label: 'Check for Updates', placeholder: 'Status: Up to date (Latest Stable Release)' },
            ],
          },
          {
            title: '2. Offline Synchronization & Data Safety',
            fields: [
              { label: 'Cloud Database Sync Status', placeholder: 'CONNECTED & SYNCED', pinNumber: 3 },
              { label: 'Offline Queue Pending Rows', placeholder: '0 Items Pending (All transactions committed)' },
              { label: 'Last Backup Created', placeholder: '2026-10-04 06:30 AM [YYYY-MM-DD HH:MM]' },
            ],
          },
        ],
      },
      screenshotPins: [
        {
          pinNumber: 1,
          label: 'Installed Version & Build Info',
          fieldOrSection: 'Section 1: Versioning',
          instruction: 'Displays current active release number.',
        },
        {
          pinNumber: 2,
          label: 'Release Build Date',
          fieldOrSection: 'Section 1: Date',
          instruction: 'Shows compilation date of the running application.',
        },
        {
          pinNumber: 3,
          label: 'Sync Status & Backup Button',
          fieldOrSection: 'Section 2: Data Safety',
          instruction: 'Click Export Database Backup to download full snapshot.',
        },
      ],
      fields: [
        {
          name: 'Backup Action',
          type: 'Button Action',
          required: false,
          purpose: 'Generates full snapshot export of customer, sales, inventory, and ledger tables.',
          functionality: 'Saves timestamped JSON file to local computer.',
          validationRules: 'Admin credentials required.',
        },
      ],
    },
  ],
  bestPractices: [
    'Export a database backup before performing major bulk imports or year-end financial closures.',
    'Ensure all cash registers have synchronized pending offline sales before shutting down evening computers.',
  ],
  troubleshooting: [
    {
      issue: 'Offline sync queue indicates pending unsaved items',
      solution:
        'Verify active internet connectivity. The sync engine will automatically flush pending tickets to the cloud once network heartbeat restores.',
    },
  ],
};
