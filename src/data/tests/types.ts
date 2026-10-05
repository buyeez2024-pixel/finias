export interface NegativeTestCase {
  scenario: string;
  inputData: string;
  steps: string[];
  expectedErrorOrBehavior: string;
}

export interface PositiveTestCase {
  inputData: string;
  steps: string[];
  expectedResult: string;
}

export interface TestCaseItem {
  id: string;
  title: string;
  feature: string;
  targetMenu: string;
  whatToCheck: string;
  howToCheck: string[];
  positiveTesting: PositiveTestCase;
  negativeTesting: NegativeTestCase[];
  passCriteria: string;
}

export interface TestingModule {
  id: string;
  title: string;
  category: string;
  iconName: string;
  overview: string;
  testCases: TestCaseItem[];
}
