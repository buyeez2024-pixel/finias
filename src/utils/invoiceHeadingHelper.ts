import { Transaction } from '../types/erp';

/**
 * Returns the appropriate document heading based on transaction type and status:
 * - Purchase -> "PURCHASE INVOICE"
 * - Purchase Return -> "CREDIT NOTE"
 * - Draft -> "DRAFT NOTE"
 * - Quotation -> "QUOTATION"
 * - Sales Return -> "CREDIT NOTE"
 * - Standard Sale / Default -> Configured Title (e.g. "TAX INVOICE")
 */
export function getDynamicInvoiceTitle(
  transaction?: Transaction | null,
  defaultTitle: string = 'TAX INVOICE'
): string {
  if (!transaction) return defaultTitle;

  // 1. Draft status takes precedence (draft sale, draft purchase, draft quotation)
  if (transaction.status === 'draft') {
    return 'DRAFT NOTE';
  }

  // 2. Quotation type or status
  if (transaction.type === 'quotation' || transaction.status === 'quotation') {
    return 'QUOTATION';
  }

  // 3. Purchase Return -> Credit Note
  if (transaction.type === 'purchase_return') {
    return 'CREDIT NOTE';
  }

  // 4. Sales Return -> Credit Note
  if (transaction.type === 'sell_return') {
    return 'CREDIT NOTE';
  }

  // 5. Purchase -> Purchase Invoice
  if (transaction.type === 'purchase') {
    return 'PURCHASE INVOICE';
  }

  // 6. Standard Sale / Default
  return defaultTitle || 'TAX INVOICE';
}

/**
 * Returns human-readable modal title header
 */
export function getDynamicDetailModalHeading(
  transaction?: Transaction | null,
  fallback: string = 'Invoice Details'
): string {
  if (!transaction) return fallback;

  if (transaction.status === 'draft') {
    return 'Draft Note Details';
  }
  if (transaction.type === 'quotation' || transaction.status === 'quotation') {
    return 'Quotation Details';
  }
  if (transaction.type === 'purchase_return') {
    return 'Credit Note Details';
  }
  if (transaction.type === 'sell_return') {
    return 'Credit Note Details';
  }
  if (transaction.type === 'purchase') {
    return 'Purchase Invoice Details';
  }
  return fallback;
}
