// =========================================================================
// SYSTEM DOCUMENTATION DATA (MASTER INDEX - ALL 14 MAIN MENUS & ALL SUBMENUS)
// =========================================================================

export * from './docs/types';
import { DocModule } from './docs/types';

import { dashboardDoc } from './docs/dashboardDoc';
import { usersDoc } from './docs/usersDoc';
import { contactsDoc } from './docs/contactsDoc';
import { inventoryDoc } from './docs/inventoryDoc';
import { purchasesDoc } from './docs/purchasesDoc';
import { salesDoc } from './docs/salesDoc';
import { transfersDoc } from './docs/transfersDoc';
import { expensesDoc } from './docs/expensesDoc';
import { accountsDoc } from './docs/accountsDoc';
import { reportsDoc } from './docs/reportsDoc';
import { securityDoc } from './docs/securityDoc';
import { updatesDoc } from './docs/updatesDoc';
import { configurationDoc } from './docs/configurationDoc';
import { settingsDoc } from './docs/settingsDoc';

export const SYSTEM_DOCUMENTATION_DATA: DocModule[] = [
  dashboardDoc,
  usersDoc,
  contactsDoc,
  inventoryDoc,
  purchasesDoc,
  salesDoc,
  transfersDoc,
  expensesDoc,
  accountsDoc,
  reportsDoc,
  securityDoc,
  updatesDoc,
  configurationDoc,
  settingsDoc,
];
