import { TestingModule } from './tests/types';
import { dashboardTest } from './tests/dashboardTest';
import { usersTest } from './tests/usersTest';
import { contactsTest } from './tests/contactsTest';
import { inventoryTest } from './tests/inventoryTest';
import { purchasesTest } from './tests/purchasesTest';
import { salesTest } from './tests/salesTest';
import { transfersTest } from './tests/transfersTest';
import { expensesTest } from './tests/expensesTest';
import { accountsTest } from './tests/accountsTest';
import { reportsTest } from './tests/reportsTest';
import { securityTest } from './tests/securityTest';
import { updatesTest } from './tests/updatesTest';
import { configurationTest } from './tests/configurationTest';
import { settingsTest } from './tests/settingsTest';

export * from './tests/types';

export const MANUAL_TESTING_DATA: TestingModule[] = [
  dashboardTest,
  usersTest,
  contactsTest,
  inventoryTest,
  purchasesTest,
  salesTest,
  transfersTest,
  expensesTest,
  accountsTest,
  reportsTest,
  securityTest,
  updatesTest,
  configurationTest,
  settingsTest
];
