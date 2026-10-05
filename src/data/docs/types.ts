export interface DocField {
  name: string;
  type: string;
  required: boolean;
  purpose: string;
  functionality: string;
  validationRules: string;
}

export interface DocAction {
  action: string;
  description: string;
  keyboardShortcut?: string;
}

export interface DocScreenshotPin {
  pinNumber: number;
  label: string;
  fieldOrSection: string;
  instruction: string;
  whereToEnterDate?: string;
}

export interface MockFormField {
  label: string;
  placeholder: string;
  isDate?: boolean;
  isRequired?: boolean;
  type?: string;
  pinNumber?: number;
}

export interface MockFormSection {
  title: string;
  fields: MockFormField[];
}

export interface MockStatCard {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
}

export interface DocScreenshotMockup {
  viewType: 'table' | 'form' | 'dashboard' | 'settings' | 'pos' | 'tree';
  windowTitle: string;
  urlPath: string;
  dateBadgeText: string;
  primaryActionText?: string;
  filterOptions?: string[];
  mockColumns?: string[];
  mockRows?: Record<string, string>[];
  formSections?: MockFormSection[];
  statCards?: MockStatCard[];
}

export interface DocSubmenu {
  id: string;
  title: string;
  menuPath: string;
  whyItIsUsed: string;
  howToUse: string[];
  whereToEnterDate: string;
  description: string;
  screenshotPins: DocScreenshotPin[];
  fields: DocField[];
  actions?: DocAction[];
  mockup?: DocScreenshotMockup;
}

export interface DocWorkflowStep {
  step: number;
  title: string;
  description: string;
  tips?: string;
}

export interface DocModule {
  id: string;
  title: string;
  category: string;
  iconName: string;
  overview: string;
  workflowSteps: DocWorkflowStep[];
  submenus: DocSubmenu[];
  bestPractices: string[];
  troubleshooting: { issue: string; solution: string }[];
}
